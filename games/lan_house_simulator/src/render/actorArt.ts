import type { Costume } from "../sim/types.js";
import { iso, type Projection } from "./isometric.js";

export type ActorPose = "idle" | "walking" | "sitting" | "standing-up";
type ActorKind = Costume | "owner";
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
  if(kind==="owner") return {shirt:"#328777",dark:"#185E5B",highlight:"#76C1A4",pants:"#394960",hair:"#4E3029",skin:"#E4AE86",trim:"#F0CE86"};
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
  transition?: number;
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
  ctx.strokeStyle=stroke;ctx.lineWidth=1.6;ctx.stroke();
}
function segment(ctx:CanvasRenderingContext2D,
  x1:number,y1:number,x2:number,y2:number,width:number,fill:string):void {
  ctx.lineWidth=width+1.8;ctx.strokeStyle="#293449";ctx.lineCap="round";
  ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();
  ctx.lineWidth=width;ctx.strokeStyle=fill;
  ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();
}
const clamp01=(v:number):number=>Math.min(1,Math.max(0,v));
export function drawActor(ctx:CanvasRenderingContext2D,camera:Projection,a:ActorRender):void {
  const base=iso({x:a.x,y:a.y},camera);
  const z=camera.zoom, style=actorStyleFor(a.kind,a.id);
  const pose=a.pose??"idle";
  const walking=pose==="walking";
  const transition=clamp01(a.transition??1);
  // A cabeça mantém exatamente as mesmas feições, materiais e cores em todas as poses.
  const seated=pose==="sitting"?transition:pose==="standing-up"?1-transition:0;
  const step=walking?Math.sin(a.time*7.7+a.id*.27):0;
  const bob=walking?Math.abs(step)*1.5:0;
  const headShift=seated*9;
  const lean=walking?Math.cos(a.time*7.7+a.id*.27)*1.1:seated*2;
  const flip=a.facing??1;
  ctx.save();
  ctx.translate(base.x,base.y-bob*z);
  ctx.scale(z*0.94*flip,z*0.94);
  ctx.lineJoin="round";
  ctx.lineCap="round";

  // A sombra fica presa aos pés (ground anchor), sem saltos na transição de pose.
  ell(ctx,0,0,14,5.1,"rgba(25,31,46,0.26)");

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
    const kneeX=side*7+swing*.55+side*seated*2;
    const kneeY=-13+seated*4;
    const toeX=side*7+swing+side*seated*8;
    segment(ctx,side*5,legY,kneeX,kneeY,8,style.pants);
    segment(ctx,kneeX,kneeY,toeX,footY-seated*4,7,style.pants);
    ell(ctx,toeX+2,footY-seated*4,6.3,3.3,a.kind==="rabbit"?"#E5D5D5":"#283647","#1D2736");
  }

  // Braços de duas seções: na cadeira, as mãos se aproximam do teclado.
  for(const side of [-1,1]){
    const ax=side*12, ay=-48+headShift;
    const wave=step*5*-side*(1-seated);
    const elbowX=side*(18-seated*2)+wave;
    const elbowY=-36+headShift+seated*3;
    const handX=side*(19-seated*5)+wave*.5;
    const handY=-24+headShift+seated*4;
    segment(ctx,ax,ay,elbowX,elbowY,8,style.dark);
    segment(ctx,elbowX,elbowY,handX,handY,7,style.shirt);
    ell(ctx,handX,handY,4.1,4.4,style.skin,"#785C59");
  }

  // Jaqueta/camisa com cintura, volume de ombros e divisão de material.
  shape(ctx,[[-12,-52+headShift],[-17,-45+headShift],[-12,-26+headShift],
    [-7,-22+headShift],[11,-23+headShift],[16,-45+headShift],[10,-51+headShift]],
    style.dark);
  shape(ctx,[[-10,-49+headShift],[-3,-52+headShift],[11,-49+headShift],
    [10,-30+headShift],[7,-24+headShift],[-9,-26+headShift]],style.shirt);
  shape(ctx,[[0,-51+headShift],[5,-48+headShift],[3,-37+headShift],
    [-1,-30+headShift],[-3,-38+headShift]],style.highlight,"#34616B");
  // Gola e botões têm leitura em resolução baixa.
  shape(ctx,[[-8,-50+headShift],[0,-46+headShift],[6,-51+headShift],
    [3,-53+headShift],[-5,-53+headShift]],style.trim);
  ell(ctx,0,-33+headShift,1.5,1.5,"#EFD9AC");

  if(a.kind==="owner"){
    // Avental de atendente: personagem central legível mesmo atrás do balcão.
    shape(ctx,[[-7,-44+headShift],[7,-44+headShift],[10,-21+headShift],
      [-11,-21+headShift]],"#315C5A","#23444C");
    segment(ctx,-8,-42+headShift,8,-41+headShift,2.0,"#E9C68B");
    shape(ctx,[[-7,-31+headShift],[7,-31+headShift],[7,-26+headShift],
      [-7,-26+headShift]],"#517F71");
    ell(ctx,5,-43+headShift,2.4,2.4,"#F2D7A0");
  } else if(a.kind==="clown"){
    ell(ctx,-8,-40+headShift,3.5,3.5,"#E65A61");
    ell(ctx,8,-31+headShift,3.3,3.3,"#76C4B4");
  } else if(a.kind==="stitched-monster"){
    segment(ctx,-9,-44+headShift,8,-43+headShift,1.5,"#DBB882");
    for(const offset of [-5,2,7]) segment(ctx,offset,-46+headShift,offset+2,-41+headShift,1,"#43584A");
  } else if(a.kind==="vampire"){
    shape(ctx,[[-8,-50+headShift],[1,-44+headShift],[9,-50+headShift],
      [3,-51+headShift],[0,-46+headShift],[-3,-51+headShift]],"#DDC8CC");
    ell(ctx,0,-41+headShift,3,3,"#BA5971");
  }

  // Pescoço e cabeça com contorno e sombra lateral.
  segment(ctx,-1,-53+headShift,0,-57+headShift,6,style.skin);
  ell(ctx,lean,-67+headShift,12.0,12.3,style.skin,"#6F5962");
  ell(ctx,lean+6.0,-68+headShift,3.7,8.3,"rgba(109,64,56,0.13)");

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
    if(a.kind==="owner"){
      segment(ctx,-11,-73+headShift,-8,-63+headShift,2,style.hair);
    }
  }

  // Expressão legível; olhos não mudam entre quadros.
  ell(ctx,-4.3+lean,-66.8+headShift,1.65,2.0,"#263348");
  ell(ctx,5.2+lean,-66.8+headShift,1.65,2.0,"#263348");
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
  ctx.restore();
}

/** Área clicável acompanha a cabeça/ombros do dono, sem depender do frame de animação. */
export function actorHitbox(camera:Projection,x:number,y:number):
  {x:number;y:number;width:number;height:number}{
  const p=iso({x,y},camera);
  const z=camera.zoom;
  return {x:p.x-22*z,y:p.y-86*z,width:44*z,height:89*z};
}
