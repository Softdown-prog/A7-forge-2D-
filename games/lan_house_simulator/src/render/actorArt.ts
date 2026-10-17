import type { Costume } from "../sim/types.js";
import { iso, type Projection } from "./isometric.js";
import type { ActorDirection } from "./direction.js";
import {workerMotion} from "./workerMotion.js";

export type ActorPose = "idle" | "walking" | "sitting" | "standing-up" | "printing" | "copying" | "sweeping" | "repairing";
export type ActorKind = Costume | "owner" | "cleaner" | "technician";
export interface ActorStyle {
  shirt: string; dark: string; highlight: string;
  pants: string; hair: string; skin: string; trim: string;
}
const casual: readonly ActorStyle[] = [
  {shirt:"#358C94",dark:"#225D73",highlight:"#7FC5BA",pants:"#374A69",hair:"#4A342D",skin:"#EFB68F",trim:"#F2D08D"},
  {shirt:"#BE6B57",dark:"#8B4455",highlight:"#E49C7A",pants:"#3D5368",hair:"#6B493A",skin:"#BD8467",trim:"#E8CF8C"},
  {shirt:"#6C82B7",dark:"#444E85",highlight:"#AEC4EA",pants:"#3A3F63",hair:"#252B3B",skin:"#CFA080",trim:"#D9E89D"},
  {shirt:"#A97C95",dark:"#6F526F",highlight:"#D8AFC4",pants:"#556077",hair:"#53372E",skin:"#F0BF9D",trim:"#8BD2C8"}
];
export function actorStyleFor(kind: ActorKind, id: number): ActorStyle {
  const style = casual[(Math.abs(Math.trunc(id)) || 0)%casual.length]!;
  if(kind==="cleaner")return {shirt:"#368DAD",dark:"#225E7A",highlight:"#8BCBDD",pants:"#345475",hair:"#3D3130",skin:"#DDA57F",trim:"#F0D680"};
  if(kind==="technician")return {shirt:"#41876E",dark:"#245D57",highlight:"#92BE96",pants:"#344D60",hair:"#4B342D",skin:"#DFAC85",trim:"#E6C67D"};
  if(kind==="owner") return {shirt:"#428f79",dark:"#234f48",highlight:"#93c4a0",pants:"#344c54",hair:"#49342c",skin:"#E4AE86",trim:"#e5c18a"};
  if(kind==="clown") return {shirt:"#E2A541",dark:"#C96D58",highlight:"#F4D58B",pants:"#637AB0",hair:"#D34F60",skin:"#E8B08D",trim:"#89C6A1"};
  if(kind==="vampire") return {shirt:"#604A78",dark:"#352C51",highlight:"#B88DAF",pants:"#282E4D",hair:"#252535",skin:"#E9B9B7",trim:"#B64E64"};
  if(kind==="stitched-monster") return {shirt:"#7A8D54",dark:"#46583D",highlight:"#B1C078",pants:"#4B5574",hair:"#353F3B",skin:"#9EC28D",trim:"#D6AD6A"};
  if(kind==="rabbit") return {shirt:"#E1C1C7",dark:"#BA959F",highlight:"#FFF2EE",pants:"#8C94B3",hair:"#F8ECE9",skin:"#F4E6DF",trim:"#E0A6AE"};
  if(kind==="mouse-mascot") return {shirt:"#949FB5",dark:"#5D6F88",highlight:"#CFD7DE",pants:"#556079",hair:"#8C97A8",skin:"#D1B8B0",trim:"#E9BC92"};
  return {...style};
}

export interface ActorRender {
  x: number; y: number;
  kind: ActorKind; id: number; time: number;
  pose?: ActorPose;
  facing?: -1 | 1;
  direction?: ActorDirection;
  transition?: number;
  /** Cliente usando controle de console; anima mãos sem alterar poses de PC. */
  gamepad?: boolean;
  /** Proporções do agachamento diante da cadeira de videogame. */
  consoleSeat?: boolean;
}
function ell(ctx: CanvasRenderingContext2D,x:number,y:number,rx:number,ry:number,color:string,outline?:string):void {
  ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);
  ctx.fillStyle=color;ctx.fill();
  if(outline){ctx.strokeStyle=outline;ctx.lineWidth=1.35;ctx.stroke();}
}
function shape(ctx:CanvasRenderingContext2D,pts:readonly [number,number][],fill:string,stroke="#283449"):void{
  ctx.beginPath();ctx.moveTo(pts[0]![0],pts[0]![1]);
  for(const p of pts.slice(1))ctx.lineTo(p[0],p[1]);
  ctx.closePath();ctx.fillStyle=fill;ctx.fill();
  ctx.strokeStyle=stroke;ctx.lineWidth=1.8;ctx.stroke();
}
function segment(ctx:CanvasRenderingContext2D,
  x1:number,y1:number,x2:number,y2:number,width:number,fill:string):void {
  ctx.lineWidth=width+1.8;ctx.strokeStyle="#293449";ctx.lineCap="round";
  ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();
  ctx.lineWidth=width;ctx.strokeStyle=fill;
  ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();
}
const clamp01=(v:number):number=>Math.min(1,Math.max(0,v));
/** Ease-in/out contínuo: cliente não salta ao começar ou terminar de sentar. */
export function seatTransitionWeight(progress:number):number{
 const t=clamp01(progress);
 return t*t*(3-2*t);
}
/** Broad light and a shaded edge describe a cylinder without textures or 3D. */
function limb(ctx:CanvasRenderingContext2D,x1:number,y1:number,x2:number,y2:number,
 width:number,fill:string):void{
 segment(ctx,x1,y1,x2,y2,width,fill);
 const length=Math.hypot(x2-x1,y2-y1);if(length<.01)return;
 const nx=-(y2-y1)/length,ny=(x2-x1)/length;
 ctx.save();ctx.lineWidth=width*.24;
 ctx.strokeStyle="rgba(255,241,208,.26)";
 ctx.beginPath();ctx.moveTo(x1-nx*width*.22,y1-ny*width*.22);
 ctx.lineTo(x2-nx*width*.22,y2-ny*width*.22);ctx.stroke();ctx.restore();
}
function torso(ctx:CanvasRenderingContext2D,style:ActorStyle,shift:number,profile:boolean):void{
 ctx.save();ctx.translate(0,shift);
 // Curved shoulders, ribcage, belly and hips; profiles have their own outline.
 ctx.beginPath();
 if(profile){
  ctx.moveTo(-8,-52);ctx.bezierCurveTo(-15,-50,-16,-42,-14,-33);
  ctx.bezierCurveTo(-14,-26,-10,-23,-5,-23);ctx.lineTo(10,-23);
  ctx.bezierCurveTo(17,-27,18,-33,16,-39);
  ctx.bezierCurveTo(15,-47,11,-52,5,-53);
 }else{
  ctx.moveTo(-8,-53);ctx.bezierCurveTo(-17,-52,-21,-46,-19,-40);
  ctx.bezierCurveTo(-17,-35,-18,-28,-13,-24);
  ctx.bezierCurveTo(-7,-20,9,-21,14,-24);
  ctx.bezierCurveTo(19,-29,17,-36,19,-42);
  ctx.bezierCurveTo(20,-49,13,-52,6,-53);
 }
 ctx.closePath();ctx.fillStyle=style.shirt;ctx.fill();
 ctx.strokeStyle="#283449";ctx.lineWidth=1.8;ctx.stroke();
 // Large curved planes keep their reading when the room camera zooms out.
 // These patches stay inside the contour, avoiding a per-actor Canvas clip.
 ctx.beginPath();ctx.moveTo(profile?8:9,-51);
 ctx.bezierCurveTo(15,-50,18,-46,17,-41);
 ctx.bezierCurveTo(15,-34,17,-29,10,-24);ctx.lineTo(7,-24);
 ctx.bezierCurveTo(profile?9:8,-31,profile?3:6,-43,profile?8:9,-51);ctx.closePath();
 ctx.fillStyle=style.dark;ctx.fill();
 ctx.beginPath();ctx.moveTo(-10,-51);ctx.bezierCurveTo(-18,-47,-15,-37,-12,-28);
 ctx.bezierCurveTo(-8,-25,-6,-29,-7,-34);
 ctx.bezierCurveTo(-10,-42,-5,-49,-3,-51);ctx.closePath();
 ctx.globalAlpha=.52;ctx.fillStyle=style.highlight;ctx.fill();ctx.globalAlpha=1;
 ell(ctx,-1,-25,11,2,"rgba(23,32,43,.16)");
 ell(ctx,-3,-47,11,2,"rgba(255,241,208,.17)");
 ctx.restore();
}
export function drawActor(ctx:CanvasRenderingContext2D,camera:Projection,a:ActorRender):void {
  const base=iso({x:a.x,y:a.y},camera);
  const z=camera.zoom, style=actorStyleFor(a.kind,a.id);
  const pose=a.pose??"idle";
  const walking=pose==="walking";
  const work=a.kind==="cleaner"&&pose==="sweeping"?workerMotion("sweeping",a.time):
    a.kind==="technician"&&pose==="repairing"?workerMotion("repairing",a.time):null;
  const transition=clamp01(a.transition??1);
  // A cabeça mantém exatamente as mesmas feições, materiais e cores em todas as poses.
  const eased=seatTransitionWeight(transition);
  const seated=pose==="sitting"?eased:pose==="standing-up"?1-eased:0;
  const gamepadActive=!!a.gamepad&&pose==="sitting"&&seated>.99;
  const consoleSeat=!!a.consoleSeat&&(pose==="sitting"||pose==="standing-up");
  const step=walking?Math.sin(a.time*7.7+a.id*.27):0;
  const ownerBreath=a.kind==="owner"&&(pose==="idle"||pose==="printing"||pose==="copying")?Math.sin(a.time*1.4)*.6:0;
  const bob=walking?Math.abs(step)*1.5:0;
  // O quadril acompanha o assento elevado (25px); a cabeça baixa só levemente.
  // Antes, o corpo afundava 18px e parecia agachado no chão.
  const settle=(pose==="sitting"||pose==="standing-up")?Math.sin(Math.PI*transition)*1.5:0;
  const headShift=seated*(consoleSeat?10:3)+settle;
  const lean=walking?Math.cos(a.time*7.7+a.id*.27)*1.1:work?work.pulse*.65:seated*2;
  const typing=seated>0.95&&!gamepadActive?Math.sin(a.time*5.2+a.id*.37)*1.5:0;
  const direction=a.direction??"south";
  const back=direction==="north";
  const sideways=direction==="east"||direction==="west";
  const flip=direction==="west"?-1:direction==="east"?1:(a.facing??1);
  ctx.save();
  ctx.translate(base.x,base.y-bob*z);
  ctx.scale(z*flip,z);
  ctx.lineJoin="round";
  ctx.lineCap="round";

  // Ground anchor: o corpo oscila na caminhada, a sombra permanece no piso.
  // A escala de câmera é aplicada depois; bob é em unidades locais do ator.
  ctx.save();ctx.translate(0,bob);
  ell(ctx,0,0,15.5,5.1,"rgba(25,31,46,0.25)");
  ell(ctx,0,1.2,9.4,2.5,"rgba(24,31,45,0.12)");
  ctx.restore();
  // Respiração quase imperceptível; pés e sombra permanecem ancorados.
  if(ownerBreath)ctx.translate(0,-ownerBreath);

  // Silhuetas de costas, perfil e frente são distintas: não apenas um flip.
  // Capa e acessórios que ficam atrás do corpo.
  if(a.kind==="vampire"){
    shape(ctx,[[-14,-56+headShift],[13,-56+headShift],[24,-6],[-24,-5]],"#433451","#2C2840");
    shape(ctx,[[-12,-51+headShift],[11,-50+headShift],[17,-18],[-16,-15]],"#7E4A68","#4F3556");
  }
  if(a.kind==="rabbit"){
    ell(ctx,-10,-45+headShift,5,8,style.highlight);
  }

  // Passos com movimentos opostos nas pernas. Ao sentar, a coxa dobra para a frente.
  const legY=-24+headShift;
  const footY=-4;
  for(const side of [-1,1]){
    const swing=step*7*side*(1-seated);
    const kneeX=side*7+swing*.55+side*seated*10;
    // Coxa dobra junto à altura do assento; panturrilha desce até o chão.
    const kneeY=-13-seated*(consoleSeat?1:8);
    const toeX=side*7+swing+side*seated*12;
    limb(ctx,side*6,legY,kneeX,kneeY,9.6,style.pants);
    limb(ctx,kneeX,kneeY,toeX,footY-seated*4,8.2,style.pants);
    // Costura de joelho e volume de tecido: visíveis sem aumentar a silhueta.
    ctx.save();ctx.globalAlpha=.38;
    ctx.strokeStyle=style.highlight;ctx.lineWidth=1.1;
    ctx.beginPath();ctx.moveTo(kneeX-1.5,kneeY+1);ctx.lineTo(kneeX+2.1,kneeY+2);ctx.stroke();
    ctx.restore();
    const shoe=a.kind==="rabbit"?"#E5D5D5":"#283647";
    ell(ctx,toeX+2,footY-seated*4,6.8,3.6,shoe,"#1D2736");
    // Sola clara de baixo contraste, pequena o bastante para não parecer tênis brilhante.
    segment(ctx,toeX-1,footY-seated*4+1.8,toeX+6,footY-seated*4+1.9,1.0,
      a.kind==="rabbit"?"#B5A7AC":"#788597");
  }

  // Braços de duas seções: na cadeira, as mãos se aproximam do teclado.
  const arm=(side:number):void=>{
    const printing=a.kind==="owner"&&pose==="printing";
    const copying=a.kind==="owner"&&pose==="copying";
    const serving=a.kind==="owner"&&(pose==="idle"||printing||copying);
    const gesture=copying?Math.sin(a.time*7.5+side)*1.8:printing?Math.sin(a.time*10+side)*2.7:serving?Math.sin(a.time*1.6)*.45:0;
    const ax=side*(sideways?10:15), ay=-47+headShift;
    const wave=step*5*-side*(1-seated);
    const elbowX=work?(side===1?21:-17)+work.pulse*1.7:
      side*(copying?23:printing?21:serving?19:18-seated*2)+wave;
    const elbowY=work?(side===1?-38:-34):((serving?-39:-36)+headShift+seated*3);
    const movingHand=work?(side===1?work.nearHand:work.farHand):null;
    const handX=movingHand?movingHand.x:copying?side*(14+Math.sin(a.time*7)*2):printing?side*(4+Math.sin(a.time*9)*3):serving?side*8:side*(19-seated*15)+wave*.5+seated*12;
    const handY=movingHand?movingHand.y:copying?-33+headShift+gesture:printing?-29+headShift+gesture:serving?-38+headShift+gesture:-24+headShift-seated*6+(gamepadActive?Math.sin(a.time*8+side)*.8:typing*side);
    limb(ctx,ax,ay,elbowX,elbowY,9.2,style.dark);
    limb(ctx,elbowX,elbowY,handX,handY,8.2,style.shirt);
    // Borda da manga e luz discreta: o braço continua legível de costas.
    ctx.save();ctx.globalAlpha=.46;
    ctx.strokeStyle=style.highlight;ctx.lineWidth=1.3;
    ctx.beginPath();ctx.moveTo(elbowX,elbowY+1);
    ctx.lineTo(elbowX+(handX-elbowX)*.32,elbowY+(handY-elbowY)*.32);ctx.stroke();
    ctx.restore();
    ell(ctx,handX,handY,4.7,4.6,style.skin,"#785C59");
    ell(ctx,handX-1.1,handY-1,2.3,2.5,"rgba(255,241,208,.22)");
    if(serving){segment(ctx,elbowX+(handX-elbowX)*.65,elbowY+(handY-elbowY)*.65,handX-side*3,handY-.3,2.3,style.trim);}
  };
  arm(-1);if(!sideways)arm(1);

  torso(ctx,style,headShift,sideways);
  // Barra da roupa amarra a cintura e separa visualmente torso e calça.
  segment(ctx,-11,-24+headShift,10,-24+headShift,2,style.dark);
  if(!back)shape(ctx,[[0,-51+headShift],[5,-48+headShift],[3,-37+headShift],
    [-1,-30+headShift],[-3,-38+headShift]],style.highlight,"#34616B");
  // Gola e botões têm leitura em resolução baixa.
  if(!back){
    shape(ctx,[[-8,-50+headShift],[0,-46+headShift],[6,-51+headShift],
      [3,-53+headShift],[-5,-53+headShift]],style.trim);
    ell(ctx,0,-33+headShift,1.5,1.5,"#EFD9AC");
  }

  if(!back && a.kind==="owner"){
    // Tailored service apron: curved bib, seam, folded pocket and terminal badge.
    segment(ctx,-6,-50+headShift,-7,-44+headShift,2.0,style.trim);
    segment(ctx,6,-50+headShift,7,-44+headShift,2.0,style.trim);
    ctx.beginPath();ctx.moveTo(-7,-46+headShift);ctx.quadraticCurveTo(0,-43+headShift,7,-46+headShift);
    ctx.lineTo(11,-22+headShift);ctx.quadraticCurveTo(0,-18+headShift,-11,-22+headShift);ctx.closePath();
    ctx.fillStyle="#244d47";ctx.fill();ctx.strokeStyle="#193d39";ctx.lineWidth=1.4;ctx.stroke();
    shape(ctx,[[3,-45+headShift],[7,-46+headShift],[11,-22+headShift],[6,-22+headShift]],"#1e423e","#1e423e");
    segment(ctx,-8,-43+headShift,-9,-24+headShift,.8,"#7caa91");
    shape(ctx,[[-6,-31+headShift],[6,-31+headShift],[5,-25+headShift],[-5,-25+headShift]],"#477665","#345d51");
    segment(ctx,-5,-30+headShift,5,-30+headShift,.8,"#99b798");
    ctx.fillStyle="#e8c88c";ctx.beginPath();ctx.roundRect(-3,-42+headShift,7,5,1);ctx.fill();
    ctx.fillStyle="#34584a";ctx.fillRect(-1,-41+headShift,3,2);ctx.fillRect(0,-38.5+headShift,1,1);
    segment(ctx,8,-33+headShift,9,-28+headShift,1.3,"#dbc999");
  } else if(!back && a.kind==="clown"){
    ell(ctx,-8,-40+headShift,3.5,3.5,"#E65A61");
    ell(ctx,8,-31+headShift,3.3,3.3,"#76C4B4");
  } else if(!back && a.kind==="stitched-monster"){
    segment(ctx,-9,-44+headShift,8,-43+headShift,1.5,"#DBB882");
    for(const offset of [-5,2,7]) segment(ctx,offset,-46+headShift,offset+2,-41+headShift,1,"#43584A");
  } else if(!back && a.kind==="vampire"){
    shape(ctx,[[-8,-50+headShift],[1,-44+headShift],[9,-50+headShift],
      [3,-51+headShift],[0,-46+headShift],[-3,-51+headShift]],"#DDC8CC");
    ell(ctx,0,-41+headShift,3,3,"#BA5971");
  }

  // The near arm overlaps the profile's chest: actual depth, not an X squash.
  if(sideways)arm(1);
  else if(a.kind==="owner"&&!back){arm(-1);arm(1);}
  // Neck and chin cast a contact shadow onto the collar.
  ell(ctx,0,-52+headShift,8,3,"rgba(23,32,43,.24)");
  segment(ctx,-1,-53+headShift,0,-57+headShift,7.5,style.skin);
  if(!back&&!sideways){
    ell(ctx,-12+lean,-65+headShift,3,4.4,style.skin,"#785C59");
    ell(ctx,12+lean,-65+headShift,3,4.4,style.skin,"#785C59");
  }
  ell(ctx,lean,-67+headShift,sideways?12.0:13.0,12.3,back?style.hair:style.skin,"#6F5962");
  if(!back){
    ell(ctx,lean+7,-66+headShift,4.7,9,"rgba(103,55,52,0.23)");
    ell(ctx,lean-6,-69+headShift,4.2,7,"rgba(255,244,216,0.25)");
    ell(ctx,lean,-57.4+headShift,5.0,1.45,"rgba(98,55,57,0.10)");
  }

  // Penteado/silhueta específica. Formas grandes, sem texturas micro-pixel.
  if(a.kind==="rabbit"){
    shape(ctx,[[-9,-75+headShift],[-12,-98+headShift],[-6,-100+headShift],
      [-2,-78+headShift]],"#F1E7E7","#A998A9");
    shape(ctx,[[4,-77+headShift],[6,-102+headShift],[12,-102+headShift],
      [11,-76+headShift]],"#F1E7E7","#A998A9");
    segment(ctx,-8,-96+headShift,-5,-81+headShift,2,"#DFB4BD");
    segment(ctx,9,-98+headShift,8,-80+headShift,2,"#DFB4BD");
  } else if(a.kind==="mouse-mascot"){
    ell(ctx,-12,-79+headShift,8,9,"#8E98A8","#56677A");
    ell(ctx,12,-79+headShift,8,9,"#8E98A8","#56677A");
    ell(ctx,-12,-79+headShift,4.7,5.2,"#D2AEB2");
    ell(ctx,12,-79+headShift,4.7,5.2,"#D2AEB2");
  } else if(a.kind==="clown"){
    for(const x of [-10,0,10])ell(ctx,x,-79+headShift,6.5,5.5,style.hair,"#AC4354");
    ell(ctx,0,-79+headShift,3.5,5,"#F6CF80");
  } else if(a.kind==="vampire"){
    shape(ctx,[[-13,-76+headShift],[-10,-82+headShift],[0,-79+headShift],
      [5,-83+headShift],[12,-75+headShift],[7,-73+headShift],
      [0,-76+headShift],[-8,-72+headShift]],"#292839","#222838");
  } else if(a.kind==="stitched-monster"){
    shape(ctx,[[-12,-74+headShift],[-11,-82+headShift],[10,-82+headShift],
      [12,-74+headShift],[6,-75+headShift],[-6,-73+headShift]],"#445549");
    segment(ctx,-10,-79+headShift,10,-78+headShift,1,"#B1BD98");
  } else {
    // Cabelo em dois volumes e franja; casual varia por identidade, não pelo frame.
    ell(ctx,lean,-79+headShift,12.4,6.4,style.hair);
    shape(ctx,[[-12,-75+headShift],[-7,-79+headShift],[0,-77+headShift],
      [4,-75+headShift],[9,-78+headShift],[12,-74+headShift],
      [10,-70+headShift],[5,-74+headShift],[-5,-72+headShift],[-12,-70+headShift]],
      style.hair,style.hair);
    ctx.save();ctx.globalAlpha=.18;
    segment(ctx,-8,-78+headShift,-2,-79+headShift,1.5,style.highlight);
    ctx.restore();
    if(a.kind==="owner"){
      segment(ctx,-11,-73+headShift,-8,-63+headShift,2,style.hair);
      segment(ctx,-7,-80+headShift,3,-78+headShift,1.2,"#84694b");
    }
  }

  if(back){
    // Nuca e cabelo cobrem a face. Ao usar PC, vemos as costas e não olhos na câmera.
    ctx.save();ctx.translate(lean,headShift);
    ctx.beginPath();ctx.moveTo(-12,-72);
    ctx.bezierCurveTo(-14,-82,12,-84,13,-73);
    ctx.bezierCurveTo(14,-66,9,-58,6,-57);ctx.quadraticCurveTo(0,-55,-7,-57);
    ctx.bezierCurveTo(-11,-61,-13,-66,-12,-72);ctx.closePath();
    ctx.fillStyle=style.hair;ctx.fill();ctx.strokeStyle=style.dark;ctx.lineWidth=1.35;ctx.stroke();ctx.clip();
    ell(ctx,9,-66,6,13,"rgba(17,24,36,.25)");
    ell(ctx,-6,-74,3.8,7,"rgba(255,241,208,.14)");
    ctx.restore();
    if(a.kind==="rabbit" || a.kind==="mouse-mascot"){
      ell(ctx,0,-61+headShift,5,3,style.highlight);
    }
    // Costura e dobra nas costas: sem rosto aparecendo na vista do monitor.
    ctx.save();ctx.globalAlpha=.68;
    segment(ctx,0,-48+headShift,0,-30+headShift,1.5,style.highlight);
    segment(ctx,-6,-32+headShift,-3,-27+headShift,1.1,style.dark);
    ctx.restore();
    if(a.kind==="owner"){
      segment(ctx,-9,-48+headShift,8,-29+headShift,1.8,style.trim);
      segment(ctx,9,-48+headShift,-8,-29+headShift,1.8,style.trim);
      segment(ctx,-11,-27+headShift,11,-27+headShift,2.0,"#315f50");
    }
  } else if(sideways){
    // Perfil de verdade: uma orelha, apenas um olho e nariz projetado.
    ell(ctx,7+lean,-65+headShift,4.2,6,style.skin,"#785C59");
    ell(ctx,4+lean,-68+headShift,1.7,2.1,"#263348");
    ell(ctx,4.4+lean,-68.8+headShift,.65,.7,"#F6E4C7");
    segment(ctx,2+lean,-72+headShift,7+lean,-72.8+headShift,1,style.hair);
    shape(ctx,[[10+lean,-65+headShift],[15+lean,-62+headShift],
      [10+lean,-60+headShift]],style.skin,"#785C59");
    segment(ctx,4+lean,-57+headShift,9+lean,-57+headShift,1.1,"#784F51");
  } else {
  // Expressão legível; olhos não mudam entre quadros.
  ell(ctx,-4.3+lean,-66.8+headShift,1.65,2.0,"#263348");
  ell(ctx,5.2+lean,-66.8+headShift,1.65,2.0,"#263348");
  // Olhos com pequeno brilho fixo e sobrancelhas sutis (sem piscar aleatório).
  ell(ctx,-4.8+lean,-67.7+headShift,.56,.64,"#F6E7D0");
  ell(ctx,4.7+lean,-67.7+headShift,.56,.64,"#F6E7D0");
  ctx.save();ctx.globalAlpha=.72;
  segment(ctx,-7+lean,-71.1+headShift,-2+lean,-71.8+headShift,1,style.hair);
  segment(ctx,3+lean,-71.8+headShift,8+lean,-71.1+headShift,1,style.hair);
  ctx.restore();
  if(a.kind==="clown")ell(ctx,lean+.5,-63.8+headShift,4.2,3.1,"#D64C5B");
  else if(a.kind==="mouse-mascot")ell(ctx,lean+.5,-63.3+headShift,3.0,2.7,"#B47B83");
  else ell(ctx,lean+.4,-63.4+headShift,1.8,1.9,"#A66A64");
  ctx.beginPath();
  ctx.moveTo(-2+lean,-59+headShift);
  ctx.quadraticCurveTo(1+lean,-57.2+headShift,4+lean,-59+headShift);
  ctx.lineWidth=1.15;ctx.strokeStyle=a.kind==="vampire"?"#9A546A":"#784F51";ctx.stroke();
  if(a.kind==="stitched-monster"){
    for(const x of [-8,-6,-4])segment(ctx,x,-68+headShift,x+2,-66+headShift,.9,"#6B8071");
  }
  if(a.kind==="vampire"){
    shape(ctx,[[-1,-58+headShift],[1,-55.5+headShift],[2,-59+headShift]],"#FFF1E8","#AC7077");
  }
  }
  if(a.kind==="cleaner"||a.kind==="technician"){
    // Capacete amarelo original: quatro direções, mesmo volume/câmera/contorno dos visitantes.
    const shell=a.kind==="cleaner"?"#F5C84F":"#E8BF47";
    const shade="#B17E32",rim="#FFF1A4";
    ctx.save();ctx.translate(lean,headShift);
    // Casco arredondado, sombreado e assentado sobre a cabeça; sem flutuar.
    ctx.beginPath();
    ctx.moveTo(-12,-76);ctx.bezierCurveTo(-14,-87,-8,-91,0,-91);
    ctx.bezierCurveTo(10,-91,15,-86,12,-76);
    ctx.closePath();ctx.fillStyle=shell;ctx.strokeStyle="#5B503B";
    ctx.lineWidth=1.7;ctx.fill();ctx.stroke();
    shape(ctx,[[6,-88],[11,-84],[13,-77],[5,-76]],shade,"#896A3F");
    ctx.save();ctx.globalAlpha=.7;
    ell(ctx,-5,-86,4.3,1.7,rim);ctx.restore();
    // Aba segue a orientação; perfil destaca a pequena projeção frontal.
    const brim=sideways?[[0,-77],[17,-77],[16,-72],[-2,-73]]:
      [[-16,-77],[16,-77],[17,-73],[-17,-73]];
    shape(ctx,brim as [number,number][],shell,"#6B5A38");
    segment(ctx,-11,-74,11,-74,1.1,rim);
    ctx.restore();
  }
  if(a.kind==="owner"&&!back){
    // Thin warm frames distinguish the manager without changing head/foot anchors.
    ctx.strokeStyle="#524c3b";ctx.lineWidth=1.0;
    for(const x of (sideways?[4]:[-4.3,5.2])){ctx.beginPath();ctx.roundRect(x-3.4+lean,-70+headShift,6.8,6.0,1.6);ctx.stroke();}
    segment(ctx,sideways?7.5+lean:-.8+lean,-67.5+headShift,sideways?11+lean:1.9+lean,-67.4+headShift,.8,"#524c3b");
    ctx.save();ctx.globalAlpha=.17;
    ell(ctx,sideways?7+lean:1+lean,-58.6+headShift,sideways?3.2:5.4,2.0,style.hair);
    ctx.restore();
  }
  ctx.restore();
}

/** Área clicável acompanha a cabeça/ombros do dono, sem depender do frame de animação. */
export function actorHitbox(camera:Projection,x:number,y:number):
  {x:number;y:number;width:number;height:number}{
  const p=iso({x,y},camera);
  const z=camera.zoom;
  return {x:p.x-25*z,y:p.y-86*z,width:50*z,height:89*z};
}
