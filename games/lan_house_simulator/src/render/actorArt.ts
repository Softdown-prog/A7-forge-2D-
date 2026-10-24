import type { Costume } from "../sim/types.js";
import { iso, type Projection } from "./isometric.js";
import type { ActorDirection,ActorScreenView } from "./direction.js";
import {walkPhase,walkingLeg,walkAxis} from "./walkCycle.js";
import {workerMotion} from "./workerMotion.js";

type ActorContext=CanvasRenderingContext2D|OffscreenCanvasRenderingContext2D;

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
  // Three hand-authored costumes: no per-ID hue shifts, tint masks or recoloring.
  if(kind==="female")return {shirt:"#B87998",dark:"#744968",highlight:"#E7B9CF",
    pants:"#394A69",hair:"#382A3B",skin:"#DB9D80",trim:"#F0D7B7"};
  if(kind==="female-bob")return {shirt:"#4F9189",dark:"#285A62",highlight:"#9AD3C1",
    pants:"#4B536A",hair:"#9E6745",skin:"#EDB596",trim:"#F5D7A1"};
  if(kind==="female-ponytail")return {shirt:"#D28A50",dark:"#915A45",highlight:"#F1BA79",
    pants:"#354866",hair:"#222C42",skin:"#BF866B",trim:"#E7C89A"};
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
  /** Direction of visible movement projected onto the screen; seats keep legacy rig. */
  screenView?: ActorScreenView;
  /** Distance on the projected floor at zoom 1; independent of wall-clock time. */
  walkDistance?:number;
  transition?: number;
  /** Cliente usando controle de console; anima mãos sem alterar poses de PC. */
  gamepad?: boolean;
  /** Proporções do agachamento diante da cadeira de videogame. */
  consoleSeat?: boolean;
  /** Só passa true com entitlement verificado no backend; exclusivo de sessão PC. */
  premiumHeadset?: boolean;
  /** Gesto transitório ao concluir a chave real, sem mudar posição no salão. */
  reaction?:"win"|"loss";
  /** Aplicado ao dono somente com direito VIP verificado. */
  premiumCyber?: boolean;
}
function ell(ctx: ActorContext,x:number,y:number,rx:number,ry:number,color:string,outline?:string):void {
  ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);
  ctx.fillStyle=color;ctx.fill();
  if(outline){ctx.strokeStyle=outline;ctx.lineWidth=1.35;ctx.stroke();}
}
function shape(ctx:ActorContext,pts:readonly [number,number][],fill:string,stroke="#283449"):void{
  ctx.beginPath();ctx.moveTo(pts[0]![0],pts[0]![1]);
  for(const p of pts.slice(1))ctx.lineTo(p[0],p[1]);
  ctx.closePath();ctx.fillStyle=fill;ctx.fill();
  ctx.strokeStyle=stroke;ctx.lineWidth=1.8;ctx.stroke();
}
function segment(ctx:ActorContext,
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
function limb(ctx:ActorContext,x1:number,y1:number,x2:number,y2:number,
 width:number,fill:string):void{
 segment(ctx,x1,y1,x2,y2,width,fill);
 const length=Math.hypot(x2-x1,y2-y1);if(length<.01)return;
 const nx=-(y2-y1)/length,ny=(x2-x1)/length;
 ctx.save();ctx.lineWidth=width*.24;
 ctx.strokeStyle="rgba(255,241,208,.26)";
 ctx.beginPath();ctx.moveTo(x1-nx*width*.22,y1-ny*width*.22);
 ctx.lineTo(x2-nx*width*.22,y2-ny*width*.22);ctx.stroke();ctx.restore();
}
function torso(ctx:ActorContext,style:ActorStyle,shift:number,profile:boolean,quarter=false):void{
 ctx.save();ctx.translate(0,shift);
 if(profile){
  // Truly turned shoulders/ribcage: narrow depth, no front-facing shirt placket.
  shape(ctx,[[-5,-53],[-10,-50],[-12,-43],[-10,-30],[-6,-24],
    [6,-23],[12,-28],[12,-40],[7,-52]],style.shirt);
  shape(ctx,[[3,-51],[9,-47],[11,-33],[7,-24],[3,-25],[5,-39]],
    style.dark,style.dark);
  ctx.save();ctx.globalAlpha=.48;
  shape(ctx,[[-6,-50],[-9,-43],[-8,-34],[-5,-27],[-3,-30],[-5,-40]],
    style.highlight,style.shirt);
  ctx.restore();
  ell(ctx,-1,-25,7,1.7,"rgba(23,32,43,.16)");
  ctx.restore();return;
 }
 if(quarter){
  // Narrow three-quarter shoulders, with a readable far shoulder and side panel.
  shape(ctx,[[-8,-53],[-14,-51],[-16,-42],[-13,-29],[-9,-24],
    [10,-23],[15,-30],[14,-46],[7,-53]],style.shirt);
  shape(ctx,[[3,-51],[10,-50],[14,-42],[13,-30],[9,-24],[4,-26],[7,-40]],style.dark,style.dark);
  ctx.save();ctx.globalAlpha=.48;
  shape(ctx,[[-9,-51],[-14,-43],[-12,-32],[-7,-25],[-4,-29],[-9,-41]],style.highlight,style.shirt);
  ctx.restore();ctx.restore();return;
 }
 // Curved shoulders, ribcage, belly and hips; front and back keep original art.
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
/** Discrete character artwork; all three reuse only rig anchors and movement,
 * never a color mask applied over the same costume. */
export const FEMALE_COSTUMES=["female","female-bob","female-ponytail"] as const;
type FemaleCostume=typeof FEMALE_COSTUMES[number];
function isFemaleCostume(kind:ActorKind):kind is FemaleCostume{
 return kind==="female"||kind==="female-bob"||kind==="female-ponytail";
}
/** Three bespoke upper-body silhouettes: cardigan, tailored jacket and hoodie. */
function femaleTorso(ctx:ActorContext,style:ActorStyle,shift:number,
 profile:boolean,back:boolean,kind:FemaleCostume,quarter=false):void{
 ctx.save();ctx.translate(0,shift);
 if(profile){
  // Three distinct garments seen from their narrow side, without two front lapels.
  const coat=kind==="female-bob"?style.dark:style.shirt;
  shape(ctx,[[-5,-54],[-11,-50],[-11,-37],[-8,-24],[7,-23],
    [12,-29],[11,-47],[5,-54]],coat);
  if(kind==="female"){
   shape(ctx,[[3,-51],[9,-48],[10,-31],[7,-24],[4,-25]],style.dark,style.dark);
   segment(ctx,-6,-27,7,-27,2.1,style.trim);
  }else if(kind==="female-bob"){
   shape(ctx,[[-3,-52],[5,-51],[7,-30],[1,-27],[-6,-29]],style.highlight,style.dark);
   segment(ctx,4,-48,6,-31,1.5,style.trim);
  }else{
   shape(ctx,[[-6,-53],[1,-57],[7,-53],[7,-45],[0,-42],[-7,-46]],style.dark,style.dark);
   shape(ctx,[[3,-37],[9,-37],[8,-28],[2,-27]],style.dark,style.dark);
   segment(ctx,-7,-25,8,-25,2.4,style.trim);
  }
  ctx.restore();return;
 }
 if(quarter){
  // Bespoke silhouettes stay identifiable in the diagonal camera views.
  shape(ctx,[[-7,-54],[-13,-51],[-15,-40],[-12,-27],[-8,-24],
    [10,-23],[14,-31],[13,-47],[6,-54]],kind==="female-bob"?style.dark:style.shirt);
  if(kind==="female"){
   shape(ctx,[[4,-52],[11,-48],[13,-31],[9,-24],[4,-27]],style.dark,style.dark);
   if(!back)shape(ctx,[[-5,-51],[-1,-44],[-3,-28],[-8,-29]],style.highlight,style.dark);
   segment(ctx,-7,-25,9,-25,1.7,style.trim);
  }else if(kind==="female-bob"){
   shape(ctx,[[-6,-51],[4,-52],[6,-30],[0,-26],[-8,-28]],style.highlight,style.dark);
   segment(ctx,5,-47,8,-29,1.7,style.trim);
  }else{
   shape(ctx,[[-7,-52],[-1,-56],[6,-52],[7,-46],[0,-42],[-7,-46]],style.dark,style.dark);
   shape(ctx,[[3,-37],[10,-36],[9,-27],[2,-27]],style.dark,style.dark);
   segment(ctx,-7,-25,9,-25,2.2,style.trim);
  }
  ctx.restore();return;
 }
 if(kind==="female"){
  // Long-haired character: soft blouse with layered cardigan and folded hem.
  shape(ctx,profile?[[-8,-52],[-13,-48],[-15,-37],[-10,-24],[11,-23],[15,-30],[14,-46],[7,-53]]:
   [[-9,-53],[-17,-50],[-18,-37],[-14,-24],[15,-24],[18,-39],[15,-50],[7,-53]],style.shirt);
  shape(ctx,[[8,-50],[14,-45],[12,-30],[8,-24],[3,-24],[7,-41]],style.dark,style.dark);
  if(!back){
   shape(ctx,[[-5,-52],[2,-45],[-1,-29],[-6,-26],[-8,-32]],style.highlight,style.dark);
   shape(ctx,[[7,-52],[2,-45],[1,-29],[5,-27],[9,-39]],style.dark,style.dark);
   segment(ctx,-13,-24,13,-24,2.6,style.trim);
   ell(ctx,0,-36,1.2,1.5,style.trim);
  }
 }else if(kind==="female-bob"){
  // Cropped teal jacket, contrasting inner shirt, seams and angular lapels.
  shape(ctx,profile?[[-9,-53],[-16,-46],[-14,-25],[12,-24],[17,-41],[9,-54]]:
   [[-10,-53],[-19,-46],[-16,-23],[16,-23],[18,-47],[10,-53]],style.dark);
  shape(ctx,[[-11,-49],[-5,-52],[4,-51],[10,-48],[9,-27],[-9,-27]],style.highlight,style.dark);
  if(!back){
   shape(ctx,[[-12,-52],[-2,-47],[-6,-39],[-3,-27],[-13,-27]],style.shirt,style.dark);
   shape(ctx,[[10,-52],[2,-47],[6,-39],[3,-27],[13,-27]],style.shirt,style.dark);
   segment(ctx,0,-47,0,-27,1.6,style.trim);
   ell(ctx,5,-32,1.7,1.7,style.trim);
  }else{
   segment(ctx,-11,-29,11,-29,2,style.shirt);
   segment(ctx,-9,-45,9,-45,1.1,style.highlight);
  }
 }else{
  // Orange sports hoodie, attached hood, drawstrings and kangaroo pocket.
  shape(ctx,profile?[[-8,-54],[-16,-48],[-16,-29],[-11,-23],[11,-23],[16,-30],[14,-48],[8,-55]]:
   [[-9,-54],[-20,-47],[-17,-28],[-12,-23],[12,-23],[18,-29],[19,-47],[8,-54]],style.shirt);
  shape(ctx,[[-8,-52],[0,-56],[8,-52],[7,-46],[0,-43],[-7,-46]],style.dark,style.dark);
  shape(ctx,[[8,-48],[15,-45],[14,-29],[8,-25],[5,-27],[9,-40]],style.dark,style.dark);
  if(!back){
   segment(ctx,-4,-46,-3,-35,1.3,style.trim);
   segment(ctx,4,-46,5,-35,1.3,style.trim);
   shape(ctx,[[-8,-35],[8,-35],[10,-27],[-10,-27]],style.dark,style.dark);
   segment(ctx,-7,-34,7,-34,1.2,style.highlight);
  }else{
   shape(ctx,[[-10,-51],[0,-55],[10,-51],[9,-43],[0,-40],[-9,-43]],style.dark,style.trim);
  }
  segment(ctx,-11,-24,11,-24,3,style.trim);
 }
 ctx.restore();
}
/** Individual rear-hair shapes, drawn behind neck and clothing. */
function femaleHairBehind(ctx:ActorContext,style:ActorStyle,kind:FemaleCostume,
 shift:number,lean:number,sideways:boolean):void{
 ctx.save();ctx.translate(lean,shift);
 if(kind==="female"){
  shape(ctx,[[-12,-78],[-16,-70],[-18,-47],[-14,-39],
    [-6,-43],[6,-43],[13,-40],[18,-47],[16,-70],[10,-79]],style.hair,"#292839");
  segment(ctx,-13,-71,-14,-47,1.7,"#765468");
 }else if(kind==="female-bob"){
  shape(ctx,[[-12,-77],[-16,-70],[-18,-60],[-13,-55],[-6,-58],
    [6,-58],[14,-55],[18,-61],[15,-73],[9,-80]],style.hair,"#654534");
  ell(ctx,-12,-62,5.2,7,style.hair);
  ell(ctx,12,-62,5.2,7,style.hair);
 }else{
  // Raised ponytail, tied high and swinging gently with movement direction.
  const tailX=sideways?-15:-19;
  shape(ctx,[[9,-83],[17,-79],[23,-72],[24,-60],
    [20,-44],[13,-49],[15,-66],[7,-74]],style.hair,"#1C2535");
  ell(ctx,17,-77,4,4,"#D8B67F");
  segment(ctx,tailX+32,-62,tailX+36,-48,2,"#35465F");
 }
 ctx.restore();
}
/** Individual fringe shapes, not the generic short hairstyle tinted differently. */
function femaleHairFront(ctx:ActorContext,style:ActorStyle,kind:FemaleCostume,
 shift:number,lean:number,sideways:boolean):void{
 ctx.save();ctx.translate(lean,shift);
 if(kind==="female"){
  ell(ctx,0,-79,14.4,7,style.hair);
  shape(ctx,[[-13,-79],[9,-83],[13,-76],[7,-72],[-7,-70],[-13,-72]],style.hair,style.hair);
  const sides=sideways?[-1]:[-1,1];
  for(const side of sides){
   shape(ctx,[[side*9,-76],[side*15,-71],[side*14,-56],
     [side*11,-49],[side*8,-58],[side*9,-68]],style.hair,style.hair);
  }
 }else if(kind==="female-bob"){
  // Rounded bob cap, blunt-cut side locks and swept bangs.
  ell(ctx,0,-79,14.8,8,style.hair);
  for(const side of (sideways?[-1]:[-1,1])){
   shape(ctx,[[side*8,-79],[side*15,-76],[side*16,-62],
     [side*17,-57],[side*9,-58],[side*10,-71]],style.hair,"#654534");
  }
  shape(ctx,[[-13,-80],[12,-82],[12,-74],[6,-72],[-4,-75],[-11,-71]],
   style.hair,style.hair);
  segment(ctx,-9,-79,5,-79,1.8,"#D99E65");
 }else{
  // Swept short fringe at the front, with a raised tie at the rear.
  ell(ctx,0,-79,13.8,6.9,style.hair);
  shape(ctx,[[-13,-78],[0,-84],[11,-79],[12,-74],[5,-70],
    [-3,-74],[-11,-71]],style.hair,style.hair);
  ell(ctx,11,-82,4.2,3.8,style.hair);
  segment(ctx,-8,-79,-2,-81,1.5,"#647188");
 }
 ctx.restore();
}
/** Back view must show whole hairstyle instead of the generic cropped skull. */
function femaleHairBack(ctx:ActorContext,style:ActorStyle,kind:FemaleCostume,
 shift:number,lean:number):void{
 ctx.save();ctx.translate(lean,shift);
 if(kind==="female"){
  shape(ctx,[[-13,-75],[-15,-86],[-7,-90],[5,-90],[15,-83],[16,-68],
    [18,-43],[12,-40],[5,-44],[-5,-44],[-12,-40],[-18,-43],[-17,-67]],
    style.hair,"#27293A");
  segment(ctx,-8,-82,-11,-52,1.7,"#765468");
  segment(ctx,8,-84,11,-53,1.2,"#765468");
 }else if(kind==="female-bob"){
  shape(ctx,[[-14,-75],[-10,-87],[0,-90],[11,-86],[16,-73],
    [17,-58],[11,-55],[0,-59],[-10,-55],[-17,-59]],style.hair,"#654534");
  segment(ctx,-9,-81,-13,-63,1.6,"#D39D71");
  segment(ctx,8,-82,13,-63,1.4,"#D39D71");
 }else{
  ell(ctx,0,-76,14,14,style.hair,"#1C2535");
  shape(ctx,[[-12,-81],[-5,-89],[8,-89],[13,-82],[12,-72],
    [4,-68],[-9,-72]],style.hair,style.hair);
  // Ponytail hangs behind the shoulders (not a different-tinted short bob).
  shape(ctx,[[8,-79],[17,-78],[21,-63],[20,-47],[16,-38],
    [11,-44],[12,-66]],style.hair,"#1C2535");
  ell(ctx,13,-79,4,3.5,"#D8B67F");
  segment(ctx,18,-63,18,-48,2,"#56617A");
 }
 ctx.restore();
}

/** Profile walk: both legs advance along the facing axis, not away from the camera.
 * The raised trailing foot and the darker far leg give the stride depth. */
export function profileWalkingStep(step:number,side:-1|1):
  {hipX:number;kneeX:number;kneeY:number;toeX:number;ankleY:number}{
 const hipX=side*2.4,advance=step*side*9;
 const lift=Math.max(0,-step*side)*1.7;
 return {hipX,kneeX:hipX+advance*.58,kneeY:-13+lift*.55,
   toeX:hipX+advance,ankleY:-4-lift};
}

export function drawActor(ctx:ActorContext,camera:Projection,a:ActorRender):void {
  const base=iso({x:a.x,y:a.y},camera);
  const z=camera.zoom,cyber=a.kind==="owner"&&!!a.premiumCyber;
  const baseStyle=actorStyleFor(a.kind,a.id);
  const style=cyber?{...baseStyle,shirt:"#293950",dark:"#15243c",
    highlight:"#67e2d8",pants:"#25334a",hair:"#283247",trim:"#e5a1df"}:baseStyle;
  const pose=a.pose??"idle";
  const walking=pose==="walking";
  const work=a.kind==="cleaner"&&pose==="sweeping"?workerMotion("sweeping",a.time):
    a.kind==="technician"&&pose==="repairing"?workerMotion("repairing",a.time):null;
  const transition=clamp01(a.transition??1);
  // A cabeça mantém exatamente as mesmas feições, materiais e cores em todas as poses.
  const eased=seatTransitionWeight(transition);
  const seated=pose==="sitting"?eased:pose==="standing-up"?1-eased:0;
  const celebrating=a.reaction==="win"&&seated>.95;
  const disappointed=a.reaction==="loss"&&seated>.95;
  const gamepadActive=!!a.gamepad&&pose==="sitting"&&seated>.99;
  const consoleSeat=!!a.consoleSeat&&(pose==="sitting"||pose==="standing-up");
  const phase=a.walkDistance===undefined?a.time*7.7+a.id*.27:walkPhase(a.walkDistance);
  const step=walking?Math.sin(phase):0;
  const ownerBreath=a.kind==="owner"&&(pose==="idle"||pose==="printing"||pose==="copying")?Math.sin(a.time*1.4)*.6:0;
  const bob=walking?(1-Math.cos(phase*2))*.45:
    celebrating?(1+Math.sin(a.time*6))*.9:0;
  // O quadril acompanha o assento elevado (25px); a cabeça baixa só levemente.
  // Antes, o corpo afundava 18px e parecia agachado no chão.
  const settle=(pose==="sitting"||pose==="standing-up")?Math.sin(Math.PI*transition)*1.5:0;
  const headShift=seated*(consoleSeat?10:3)+settle+(disappointed?3:0);
  const lean=walking?Math.sin(phase*2)*.35:work?work.pulse*.65:
    seated*2+(disappointed?1.5:0);
  const typing=seated>0.95&&!gamepadActive?Math.sin(a.time*5.2+a.id*.37)*1.5:0;
  const direction=a.direction??"south",screenView=a.screenView;
  const back=screenView?(screenView==="back"||screenView.startsWith("back-")):direction==="north";
  const sideways=screenView?screenView.startsWith("profile-"):direction==="east"||direction==="west";
  const quarter=!!screenView&&!sideways&&screenView!=="front"&&screenView!=="back";
  const flip=screenView?(screenView.endsWith("-left")?-1:1):
    direction==="west"?-1:direction==="east"?1:(a.facing??1);
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
  if(isFemaleCostume(a.kind))femaleHairBehind(ctx,style,a.kind,headShift,lean,sideways);
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
  const screenRig=!!screenView&&seated===0&&(pose==="walking"||pose==="idle");
  const profileWalk=!screenView&&sideways&&walking&&seated===0;
  const nearSide=quarter&&!back?-1:1;
  const legOrder=screenRig&&quarter&&!back?[1,-1] as const:[-1,1] as const;
  for(const side of legOrder){
    const swing=step*7*side*(1-seated);
    const rigLeg=screenRig?walkingLeg(phase,side,screenView!,walking):null;
    const profileLeg=rigLeg??(profileWalk?profileWalkingStep(step,side):null);
    const kneeX=profileLeg?.kneeX??side*7+swing*.55+side*seated*10;
    // Side profiles move feet in the facing axis; frontal/seat poses stay intact.
    const kneeY=profileLeg?.kneeY??-13-seated*(consoleSeat?1:8);
    const toeX=profileLeg?.toeX??side*7+swing+side*seated*12;
    const ankleY=(profileLeg?.ankleY??footY-seated*4)+(screenRig?bob:0);
    const legColor=profileLeg&&side!==nearSide?style.dark:style.pants;
    limb(ctx,profileLeg?.hipX??side*6,legY+(rigLeg?.hipY??0),kneeX,kneeY,9.6,legColor);
    limb(ctx,kneeX,kneeY,toeX,ankleY,8.2,legColor);
    // Costura de joelho e volume de tecido: visíveis sem aumentar a silhueta.
    ctx.save();ctx.globalAlpha=.38;
    ctx.strokeStyle=style.highlight;ctx.lineWidth=1.1;
    ctx.beginPath();ctx.moveTo(kneeX-1.5,kneeY+1);ctx.lineTo(kneeX+2.1,kneeY+2);ctx.stroke();
    ctx.restore();
    const shoe=a.kind==="rabbit"?"#E5D5D5":"#283647";
    // Body rises while the supporting shoe stays on the floor.
    const shoeY=ankleY;
    const shoeX=toeX+(screenRig?walkAxis(screenView!).x*2:2);
    ell(ctx,shoeX,shoeY,screenRig&&!sideways?5.3:6.8,3.2,shoe,"#1D2736");
    // Sola clara de baixo contraste, pequena o bastante para não parecer tênis brilhante.
    segment(ctx,shoeX-3,shoeY+1.8,shoeX+3,shoeY+1.9,1.0,
      a.kind==="rabbit"?"#B5A7AC":"#788597");
  }

  // Braços de duas seções: na cadeira, as mãos se aproximam do teclado.
  const arm=(side:number):void=>{
    const printing=a.kind==="owner"&&pose==="printing";
    const copying=a.kind==="owner"&&pose==="copying";
    const serving=a.kind==="owner"&&(pose==="idle"||printing||copying);
    const gesture=copying?Math.sin(a.time*7.5+side)*1.8:printing?Math.sin(a.time*10+side)*2.7:serving?Math.sin(a.time*1.6)*.45:0;
    const angledWalk=profileWalk||screenRig;
    const shoulderX=side*(sideways?8:quarter?10:15);
    const axis=screenRig?walkAxis(screenView!):{x:1,y:0};
    const armSwing=walking?-Math.cos(phase+(side===1?0:Math.PI))*7:0;
    const ax=angledWalk?shoulderX:side*(sideways?10:15), ay=-47+headShift+(screenRig&&quarter?-side*axis.y*3:0);
    const wave=step*5*-side*(1-seated);
    // In profile the shoulders remain narrow, and the arms counter-swing the legs.
    const elbowX=celebrating?side*20:
      angledWalk?shoulderX+side*1.5+armSwing*axis.x*.5:
      work?(side===1?21:-17)+work.pulse*1.7:
      side*(copying?23:printing?21:serving?19:18-seated*2)+wave;
    const elbowY=celebrating?-52+headShift+Math.sin(a.time*6+side)*1.5:
      angledWalk?-36+headShift+armSwing*axis.y*.5:
      work?(side===1?-38:-34):((serving?-39:-36)+headShift+seated*3);
    const movingHand=work?(side===1?work.nearHand:work.farHand):null;
    const handX=celebrating?side*22:
      angledWalk?shoulderX+side*2+armSwing*axis.x:
      movingHand?movingHand.x:copying?side*(14+Math.sin(a.time*7)*2):printing?side*(4+Math.sin(a.time*9)*3):serving?side*8:side*(19-seated*15)+wave*.5+seated*12;
    const handY=celebrating?-72+headShift+Math.sin(a.time*6+side)*2:
      disappointed?-17+headShift:
      angledWalk?-25+headShift+armSwing*axis.y:
      movingHand?movingHand.y:copying?-33+headShift+gesture:printing?-29+headShift+gesture:serving?-38+headShift+gesture:-24+headShift-seated*6+(gamepadActive?Math.sin(a.time*8+side)*.8:typing*side);
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
  arm(-nearSide);if(!sideways&&!quarter)arm(nearSide);

  if(isFemaleCostume(a.kind))femaleTorso(ctx,style,headShift,sideways,back,a.kind,quarter);
  else{
    torso(ctx,style,headShift,sideways,quarter);
    segment(ctx,-11,-24+headShift,10,-24+headShift,2,style.dark);
    if(!back&&!sideways&&!quarter)shape(ctx,[[0,-51+headShift],[5,-48+headShift],[3,-37+headShift],
      [-1,-30+headShift],[-3,-38+headShift]],style.highlight,"#34616B");
    if(!back&&!sideways&&!quarter){
      shape(ctx,[[-8,-50+headShift],[0,-46+headShift],[6,-51+headShift],
        [3,-53+headShift],[-5,-53+headShift]],style.trim);
      ell(ctx,0,-33+headShift,1.5,1.5,"#EFD9AC");
    }
  }

  if(!back && a.kind==="owner"&&!cyber){
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
  } else if(!back && cyber){
    // Couraça dupla, cintura e circuitos desenhados na mesma silhueta do Tony.
    shape(ctx,[[-12,-48+headShift],[11,-48+headShift],[12,-24+headShift],[-12,-24+headShift]],"#192e49","#71889c");
    shape(ctx,[[-10,-45+headShift],[-1,-40+headShift],[-2,-29+headShift],[-9,-27+headShift]],"#395675","#244159");
    shape(ctx,[[10,-45+headShift],[1,-40+headShift],[2,-29+headShift],[9,-27+headShift]],"#304964","#244159");
    segment(ctx,-10,-43+headShift,-8,-29+headShift,1.8,"#65f2e2");
    segment(ctx,10,-43+headShift,8,-29+headShift,1.8,"#f4a2df");
    ctx.fillStyle=Math.sin(a.time*2)>.2?"#a4fff3":"#63bdbd";
    ctx.beginPath();ctx.roundRect(-4,-42+headShift,8,8,1.3);ctx.fill();
    shape(ctx,[[-3,-39+headShift],[0,-43+headShift],[3,-39+headShift],[0,-35+headShift]],"#1b3b52","#8bc6d2");
    segment(ctx,-12,-24+headShift,11,-24+headShift,3,"#1a263b");
    for(const x of [-7,0,7])ell(ctx,x,-28+headShift,1.15,1.15,"#ebd3ef");
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
  if(sideways||quarter)arm(nearSide);
  else if(a.kind==="owner"&&!back){arm(-1);arm(1);}
  if(cyber){
    // Ombreiras facetadas nas quatro orientações.
    for(const side of [-1,1]){
      shape(ctx,[[side*11,-49+headShift],[side*19,-46+headShift],
        [side*19,-40+headShift],[side*12,-39+headShift]],"#344a65","#162638");
      segment(ctx,side*13,-46+headShift,side*18,-43+headShift,1.4,
        side===1?"#ee96d5":"#70f0e3");
    }
    if(back){
      shape(ctx,[[-10,-46+headShift],[0,-42+headShift],[10,-46+headShift],
        [9,-29+headShift],[-9,-29+headShift]],"#19334e","#597c91");
      segment(ctx,-8,-37+headShift,8,-37+headShift,2,"#69e8e0");
      segment(ctx,-4,-32+headShift,4,-32+headShift,1.5,"#e99dda");
    }
  }
  // Neck and chin cast a contact shadow onto the collar.
  ell(ctx,0,-52+headShift,8,3,"rgba(23,32,43,.24)");
  segment(ctx,-1,-53+headShift,0,-57+headShift,7.5,style.skin);
  if(!back&&!sideways){
    ell(ctx,-12+lean,-65+headShift,3,4.4,style.skin,"#785C59");
    if(!quarter)ell(ctx,12+lean,-65+headShift,3,4.4,style.skin,"#785C59");
  }
  ell(ctx,lean,-67+headShift,sideways?12.0:quarter?12.4:13.0,12.3,back?style.hair:style.skin,"#6F5962");
  if(!back){
    ell(ctx,lean+7,-66+headShift,4.7,9,"rgba(103,55,52,0.23)");
    ell(ctx,lean-6,-69+headShift,4.2,7,"rgba(255,244,216,0.25)");
    ell(ctx,lean,-57.4+headShift,5.0,1.45,"rgba(98,55,57,0.10)");
  }

  // Penteado/silhueta específica. Formas grandes, sem texturas micro-pixel.
  if(isFemaleCostume(a.kind)){
    if(!back)femaleHairFront(ctx,style,a.kind,headShift,lean,sideways||quarter);
  }else if(a.kind==="rabbit"){
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
    if(quarter){
      // A visible side ear/cheek distinguishes the diagonal rear from straight back.
      ell(ctx,11+lean,-64+headShift,2.8,4.6,style.skin,"#785C59");
      segment(ctx,12+lean,-65+headShift,12+lean,-62+headShift,.9,"#A66A64");
    }
    if(isFemaleCostume(a.kind))femaleHairBack(ctx,style,a.kind,headShift,lean);
    if(a.kind==="rabbit" || a.kind==="mouse-mascot"){
      ell(ctx,0,-61+headShift,5,3,style.highlight);
    }
    // Costura e dobra nas costas: sem rosto aparecendo na vista do monitor.
    ctx.save();ctx.globalAlpha=.68;
    if(!isFemaleCostume(a.kind))segment(ctx,0,-48+headShift,0,-30+headShift,1.5,style.highlight);
    segment(ctx,-6,-32+headShift,-3,-27+headShift,1.1,style.dark);
    ctx.restore();
    if(a.kind==="owner"){
      segment(ctx,-9,-48+headShift,8,-29+headShift,1.8,style.trim);
      segment(ctx,9,-48+headShift,-8,-29+headShift,1.8,style.trim);
      segment(ctx,-11,-27+headShift,11,-27+headShift,2.0,"#315f50");
    }
  } else if(quarter){
    // One recessed eye and a projecting cheek/nose make the 3/4 facing legible.
    ell(ctx,-.5+lean,-68.2+headShift,.85,1.6,"#263348");
    ell(ctx,7.3+lean,-67.5+headShift,1.6,2.1,"#263348");
    ell(ctx,7+lean,-68.2+headShift,.5,.6,"#F6E7D0");
    segment(ctx,-2.5+lean,-72+headShift,1.5+lean,-72.3+headShift,1,style.hair);
    segment(ctx,5+lean,-71.9+headShift,10+lean,-71.4+headShift,1,style.hair);
    if(a.kind==="clown")ell(ctx,8+lean,-63.2+headShift,3.4,3.1,"#D64C5B");
    else if(a.kind==="mouse-mascot")ell(ctx,8+lean,-63.2+headShift,2.8,2.5,"#B47B83");
    else shape(ctx,[[10+lean,-65+headShift],[14+lean,-63+headShift],
      [10+lean,-61+headShift]],style.skin,"#A66A64");
    segment(ctx,3+lean,-58+headShift,9+lean,-58.4+headShift,1.1,"#784F51");
    if(a.kind==="stitched-monster")segment(ctx,-9,-68+headShift,-5,-65+headShift,.9,"#6B8071");
    if(a.kind==="vampire")shape(ctx,[[6,-59+headShift],[8,-55+headShift],[9,-59+headShift]],"#FFF1E8","#AC7077");
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
  if(a.premiumHeadset && a.kind!=="owner" && pose==="sitting" && seated>.97 && !consoleSeat){
    drawNeonHeadset(ctx,lean,-67+headShift,back,sideways,a.time);
  }
  if(a.kind==="owner"&&!back&&!cyber){
    // Thin warm frames distinguish the manager without changing head/foot anchors.
    ctx.strokeStyle="#524c3b";ctx.lineWidth=1.0;
    for(const x of (sideways?[4]:[-4.3,5.2])){ctx.beginPath();ctx.roundRect(x-3.4+lean,-70+headShift,6.8,6.0,1.6);ctx.stroke();}
    segment(ctx,sideways?7.5+lean:-.8+lean,-67.5+headShift,sideways?11+lean:1.9+lean,-67.4+headShift,.8,"#524c3b");
    ctx.save();ctx.globalAlpha=.17;
    ell(ctx,sideways?7+lean:1+lean,-58.6+headShift,sideways?3.2:5.4,2.0,style.hair);
    ctx.restore();
  }
  if(cyber){
    // Visor semiespelhado e headset translúcido não exigem sprites extras.
    if(!back){
      shape(ctx,sideways?
        [[2+lean,-73+headShift],[13+lean,-73+headShift],[14+lean,-66+headShift],[3+lean,-65+headShift]]:
        [[-13+lean,-73+headShift],[12+lean,-73+headShift],[13+lean,-66+headShift],[-12+lean,-66+headShift]],
        "#1d4964","#67b1c9");
      segment(ctx,sideways?5+lean:-9+lean,-69+headShift,
        sideways?12+lean:9+lean,-69+headShift,1.6,
        Math.sin(a.time*2.2)>.25?"#a2fff0":"#5cc7c9");
      segment(ctx,sideways?5+lean:-7+lean,-67+headShift,
        sideways?11+lean:8+lean,-67+headShift,1,"#afcde1");
      ell(ctx,sideways?11+lean:12+lean,-68+headShift,2.5,3.2,"#eea6dd");
    }else{
      segment(ctx,-10,-74+headShift,10,-74+headShift,2,"#6ee6de");
      ell(ctx,0,-77+headShift,2.5,1.6,"#f5b1e6");
    }
    if(!back){
      segment(ctx,sideways?11+lean:13+lean,-67+headShift,
        sideways?14+lean:16+lean,-61+headShift,1.3,"#87ede5");
      ell(ctx,sideways?14+lean:16+lean,-61+headShift,2,2,"#edaadd");
    }
  }
  ctx.restore();
}

/** Fone com arco anatômico, conchas separadas e microfone articulado.
 * Em perspectiva de costas e perfil preserva os mesmos pontos de ancoragem. */
function drawNeonHeadset(ctx:ActorContext,headX:number,
 headY:number,back:boolean,sideways:boolean,time:number):void{
 ctx.save();ctx.translate(headX,headY);
 // Proporções calibradas para não engolir a cabeça de um ator em zoom alto.
 ctx.scale(.80,.82);
 const glow=.55+.45*Math.sin(time*2.5),cyan="#63f4ef",pink="#f18be3";
 const cup=(x:number,y:number,width=7.2,height=11.4)=>{
  ctx.save();ctx.shadowColor=cyan;ctx.shadowBlur=4*glow;
  ctx.beginPath();ctx.ellipse(x,y,width+2.3,height+2.2,0,0,Math.PI*2);
  ctx.fillStyle="#0c1924";ctx.fill();ctx.shadowBlur=0;
  ctx.lineWidth=1.7;ctx.strokeStyle="#697c8c";ctx.stroke();
  const grad=ctx.createLinearGradient(x-8,y-10,x+8,y+10);
  grad.addColorStop(0,"#5d7082");grad.addColorStop(.35,"#1b2b3c");
  grad.addColorStop(.8,"#0c1725");grad.addColorStop(1,"#4f6575");
  ctx.beginPath();ctx.ellipse(x,y,width,height,0,0,Math.PI*2);ctx.fillStyle=grad;ctx.fill();
  ctx.lineWidth=2.4;ctx.strokeStyle=glow>.7?cyan:pink;ctx.stroke();
  ctx.beginPath();ctx.ellipse(x-1,y-1,width*.48,height*.51,0,0,Math.PI*2);
  ctx.fillStyle="#18394a";ctx.fill();
  ctx.beginPath();ctx.moveTo(x-3,y-2);ctx.lineTo(x,y-5);ctx.lineTo(x+3,y-2);ctx.lineTo(x,y+3);
  ctx.closePath();ctx.fillStyle=pink;ctx.fill();
  ctx.beginPath();ctx.ellipse(x-2,y-5,width*.23,height*.13,-.3,0,Math.PI*2);
  ctx.fillStyle="rgba(235,254,255,.8)";ctx.fill();
  ctx.restore();
 };
 // Banda dupla curvada acima da cabeça, com almofada interna.
 ctx.save();ctx.lineCap="round";
 ctx.beginPath();ctx.moveTo(-14,0);ctx.bezierCurveTo(-16,-25,-9,-31,0,-31);
 ctx.bezierCurveTo(10,-32,16,-23,14,0);
 ctx.lineWidth=7.4;ctx.strokeStyle="#081724";ctx.stroke();
 ctx.beginPath();ctx.moveTo(-14,0);ctx.bezierCurveTo(-16,-25,-9,-31,0,-31);
 ctx.bezierCurveTo(10,-32,16,-23,14,0);
 ctx.lineWidth=3;ctx.strokeStyle="#8496a6";ctx.stroke();
 ctx.beginPath();ctx.moveTo(-10,-18);ctx.quadraticCurveTo(0,-29,10,-18);
 ctx.strokeStyle=glow>.7?cyan:pink;ctx.lineWidth=1.9;ctx.stroke();
 ctx.beginPath();ctx.moveTo(-6,-26);ctx.quadraticCurveTo(0,-29,6,-26);
 ctx.strokeStyle="#b9c7d5";ctx.lineWidth=3.2;ctx.stroke();
 ctx.restore();
 if(sideways){cup(12,1,7.5,11.8);cup(-11,0,3.4,8.5);}
 else {cup(-13,1);cup(13,1);}
 // Haste de microfone, conector e espuma redonda.
 const origin=sideways?14:-13,dir=sideways?1:-1;
 ctx.beginPath();ctx.moveTo(origin,8);ctx.quadraticCurveTo(origin+dir*2,18,origin+dir*12,19);
 ctx.strokeStyle="#243847";ctx.lineWidth=3.5;ctx.stroke();
 ctx.beginPath();ctx.moveTo(origin,8);ctx.quadraticCurveTo(origin+dir*2,18,origin+dir*12,19);
 ctx.strokeStyle="#8797a9";ctx.lineWidth=1.35;ctx.stroke();
 ctx.beginPath();ctx.ellipse(origin+dir*13,19,4.5,3,0,0,Math.PI*2);
 ctx.fillStyle="#15283b";ctx.fill();ctx.strokeStyle=pink;ctx.lineWidth=1.2;ctx.stroke();
 ctx.restore();
}

/** Área clicável acompanha a cabeça/ombros do dono, sem depender do frame de animação. */
export function actorHitbox(camera:Projection,x:number,y:number):
  {x:number;y:number;width:number;height:number}{
  const p=iso({x,y},camera);
  const z=camera.zoom;
  return {x:p.x-25*z,y:p.y-86*z,width:50*z,height:89*z};
}
