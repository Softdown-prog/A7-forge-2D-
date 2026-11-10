import type {ActorContext,ActorKind,ActorStyle} from "../actorArt.js";
import {lerpHex,shadeHex,mixHex} from "../color.js";
export function ell(ctx: ActorContext,x:number,y:number,rx:number,ry:number,color:string,outline?:string):void {
  ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);
  ctx.fillStyle=color;ctx.fill();
  if(outline){ctx.strokeStyle=outline;ctx.lineWidth=1.35;ctx.stroke();}
}
const INK="#283449",INK_DEEP="#18202f";
const edgeColors=new Map<string,string>();
/** Selective outline: the line takes a dark version of the fill it encloses, so
 * colour boundaries stay readable without a uniform navy rim around everything.
 * Non-hex fills (rgba overlays) keep the shared ink. */
export function edgeFor(fill:string):string{
  if(fill.charCodeAt(0)!==35)return INK;
  let edge=edgeColors.get(fill);
  if(!edge){edge=lerpHex(fill,INK_DEEP,.7);edgeColors.set(fill,edge);}
  return edge;
}
export function shape(ctx:ActorContext,pts:readonly [number,number][],fill:string,stroke?:string):void{
  ctx.beginPath();ctx.moveTo(pts[0]![0],pts[0]![1]);
  for(const p of pts.slice(1))ctx.lineTo(p[0],p[1]);
  ctx.closePath();ctx.fillStyle=fill;ctx.fill();
  ctx.strokeStyle=stroke??edgeFor(fill);ctx.lineWidth=1.8;ctx.stroke();
}
export function segment(ctx:ActorContext,
  x1:number,y1:number,x2:number,y2:number,width:number,fill:string):void {
  ctx.lineWidth=width+1.8;ctx.strokeStyle=edgeFor(fill);ctx.lineCap="round";
  ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();
  ctx.lineWidth=width;ctx.strokeStyle=fill;
  ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();
}
export const clamp01=(v:number):number=>Math.min(1,Math.max(0,v));
/** Eye with sclera, iris, pupil, lid line and a fixed glint (never animated, so
 * cached frames stay interchangeable). `w`/`h` are the iris radii; animals keep
 * the glossy black bead their rigs always had. */
function eye(ctx:ActorContext,x:number,y:number,w:number,h:number,kind:ActorKind,look=0):void{
  if(kind==="rabbit"||kind==="mouse-mascot"){
    ell(ctx,x,y,w*1.15,h*1.1,"#1f2a3c");
    ell(ctx,x-w*.38,y-h*.42,w*.42,h*.38,"#F6E7D0");return;
  }
  const iris=kind==="vampire"?"#a23a52":kind==="stitched-monster"?"#c9b43c":kind==="clown"?"#3a7090":"#3d4d68";
  ell(ctx,x,y,w*1.32,h*1.16,"#f6eee2");
  ell(ctx,x+look,y+h*.08,w*.92,h*.94,iris);
  ell(ctx,x+look,y+h*.12,w*.5,h*.54,"#101826");
  ell(ctx,x+look-w*.28,y-h*.34,w*.34,h*.3,"#ffffff");
  ctx.save();ctx.lineCap="round";ctx.lineWidth=.95;ctx.strokeStyle="rgba(28,34,50,.72)";
  ctx.beginPath();ctx.ellipse(x,y,w*1.32,h*1.16,0,Math.PI*1.1,Math.PI*1.9);ctx.stroke();ctx.restore();
}
/** Soft rim of lighter hair along the crown, on the side the light comes from. */
export function hairSheen(ctx:ActorContext,hair:string,lean:number,shift:number,cy=-79.5,rx=8.4,ry=3.9):void{
  ctx.save();ctx.translate(lean,shift);ctx.lineCap="round";
  ctx.strokeStyle=mixHex(hair,255,.5);ctx.globalAlpha=.42;ctx.lineWidth=1.7;
  ctx.beginPath();ctx.ellipse(-1,cy,rx,ry,0,Math.PI*1.12,Math.PI*1.62);ctx.stroke();
  ctx.restore();
}
/** Warm blush on the visible cheek(s); skipped for characters with painted faces. */
export function blush(ctx:ActorContext,kind:ActorKind,spots:readonly [number,number][]):void{
  if(kind==="rabbit"||kind==="mouse-mascot"||kind==="clown"||kind==="vampire"||kind==="stitched-monster")return;
  ctx.save();ctx.fillStyle="rgba(226,108,100,.17)";
  for(const [x,y] of spots){ctx.beginPath();ctx.ellipse(x,y,3.1,1.9,0,0,Math.PI*2);ctx.fill();}
  ctx.restore();
}
/** Ease-in/out contínuo: cliente não salta ao começar ou terminar de sentar. */
export function seatTransitionWeight(progress:number):number{
 const t=clamp01(progress);
 return t*t*(3-2*t);
}
/** Broad light and a shaded edge describe a cylinder without textures or 3D. */
export function limb(ctx:ActorContext,x1:number,y1:number,x2:number,y2:number,
 width:number,fill:string):void{
 segment(ctx,x1,y1,x2,y2,width,fill);
 const length=Math.hypot(x2-x1,y2-y1);if(length<.01)return;
 const nx=-(y2-y1)/length,ny=(x2-x1)/length;
ctx.save();ctx.lineWidth=width*.24;
 ctx.strokeStyle="rgba(255,241,208,.26)";
 ctx.beginPath();ctx.moveTo(x1-nx*width*.22,y1-ny*width*.22);
 ctx.lineTo(x2-nx*width*.22,y2-ny*width*.22);ctx.stroke();
 // Core shadow on the side away from the light completes the cylinder.
 ctx.strokeStyle="rgba(18,28,48,.17)";
 ctx.beginPath();ctx.moveTo(x1+nx*width*.25,y1+ny*width*.25);
 ctx.lineTo(x2+nx*width*.25,y2+ny*width*.25);ctx.stroke();ctx.restore();
}
export function torso(ctx:ActorContext,style:ActorStyle,shift:number,profile:boolean,quarter=false):void{
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
 ctx.strokeStyle=edgeFor(style.shirt);ctx.lineWidth=1.8;ctx.stroke();
 // Form light: bright upper-left chest falling to a shaded lower right, over the same silhouette.
 const form=ctx.createLinearGradient(-18,-53,16,-22);
 form.addColorStop(0,"rgba(255,244,214,.22)");form.addColorStop(.5,"rgba(255,244,214,0)");form.addColorStop(1,"rgba(14,22,40,.22)");
 ctx.fillStyle=form;ctx.fill();
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
 // Two soft folds where the fabric gathers at the belt.
 ctx.save();ctx.strokeStyle="rgba(18,28,48,.16)";ctx.lineWidth=1.1;ctx.lineCap="round";
 ctx.beginPath();ctx.moveTo(-7,-33);ctx.quadraticCurveTo(-5,-29,-6,-25);
 ctx.moveTo(3,-34);ctx.quadraticCurveTo(5,-30,4,-25);ctx.stroke();ctx.restore();
 ctx.restore();
}
/** Discrete character artwork; all three reuse only rig anchors and movement,
 * never a color mask applied over the same costume. */
export function noseBump(ctx:ActorContext,x:number,y:number,len:number,skin:string):void{
  ctx.save();ctx.beginPath();ctx.moveTo(x,y-3.2);
  ctx.bezierCurveTo(x+len*.45,y-2.6,x+len,y-1.2,x+len*.94,y+.35);
  ctx.bezierCurveTo(x+len*.84,y+1.5,x+len*.4,y+1.8,x,y+1.9);
  ctx.fillStyle=skin;ctx.fill();
  ctx.strokeStyle="#8A645F";ctx.lineWidth=1;ctx.lineCap="round";ctx.stroke();
  ell(ctx,x+len*.62,y+.55,.55,.45,"rgba(96,52,52,.55)");
  ell(ctx,x+len*.3,y-1.7,.9,1.1,"rgba(255,244,216,.3)");
  ctx.restore();
}
/** Hair and chest details that tell the four regular customers apart (same palettes). */
export function casualHairExtras(ctx:ActorContext,hair:string,variant:number,lean:number,shift:number,back:boolean,front:boolean):void{
  const edge=edgeFor(hair);
  if(variant===1){
    for(const [x,w,h] of [[-7,3.4,7.5],[-.5,3.8,9],[6,3.2,6.8]] as const)
      shape(ctx,[[x-w+lean,-79+shift],[x+lean+w*.15,-79-h+shift],[x+w+lean,-79+shift]],hair,edge);
  }else if(variant===2){
    if(front)shape(ctx,[[-12+lean,-72+shift],[-6+lean,-75.5+shift],[3+lean,-77+shift],[2+lean,-73.5+shift],[-4+lean,-71.2+shift],[-12+lean,-67+shift]],hair,edge);
    ctx.save();ctx.globalAlpha=.5;ctx.strokeStyle=shadeHex(hair,.7);ctx.lineWidth=.9;ctx.lineCap="round";
    ctx.beginPath();ctx.moveTo(-2+lean,-84+shift);ctx.quadraticCurveTo(-4+lean,-79+shift,-6+lean,-75+shift);ctx.stroke();ctx.restore();
  }else if(variant===3){
    for(const x of [-9,-4.5,0,4.5,9])ell(ctx,x+lean,-83.4+shift+Math.abs(x)*.12,3.5,3.1,hair,edge);
    if(!back)ell(ctx,lean-3,-85.5+shift,4,1.2,"rgba(255,241,208,.16)");
  }
}
export function casualChestExtras(ctx:ActorContext,style:ActorStyle,variant:number,shift:number,back:boolean,sideways:boolean,quarter:boolean):void{
  const reach=sideways?9:quarter?11:14;
  if(variant===1&&!back&&!sideways){
    // Chest pocket with a pen clip.
    const x=quarter?-9:-12;
    shape(ctx,[[x,-44+shift],[x+8,-44.4+shift],[x+7.6,-37.2+shift],[x+.4,-36.8+shift]],style.dark,edgeFor(style.dark));
    segment(ctx,x+.8,-43+shift,x+7,-43.3+shift,.8,style.highlight);
    segment(ctx,x+5.6,-46+shift,x+5.8,-41+shift,1.1,style.trim);
  }else if(variant===2){
    // Two stripes across the chest; they stop short of the contour so no clip is needed.
    ctx.save();ctx.globalAlpha=.8;
    segment(ctx,-reach,-43+shift,reach,-42.4+shift,2.2,style.trim);
    segment(ctx,-reach,-38.4+shift,reach,-37.8+shift,1.4,style.trim);
    ctx.restore();
  }else if(variant===3&&!back&&!sideways){
    // Hoodie drawstrings with small tips.
    for(const x of quarter?[-1,4]:[-4.5,3.2]){
      segment(ctx,x,-48+shift,x+(x<0?-.4:.4),-38.5+shift,1.1,style.highlight);
      ell(ctx,x+(x<0?-.4:.4),-37.6+shift,1.1,1.5,style.trim);
    }
  }else if(variant===3&&back){
    // Hood seam across the shoulders.
    ctx.save();ctx.globalAlpha=.6;ctx.strokeStyle=style.dark;ctx.lineWidth=1.3;ctx.lineCap="round";
    ctx.beginPath();ctx.moveTo(-10,-50+shift);ctx.quadraticCurveTo(0,-43+shift,10,-50+shift);ctx.stroke();ctx.restore();
  }
}
export function profileWalkingStep(step:number,side:-1|1):
  {hipX:number;kneeX:number;kneeY:number;toeX:number;ankleY:number}{
 const hipX=side*2.4,advance=step*side*9;
 const lift=Math.max(0,-step*side)*1.7;
 return {hipX,kneeX:hipX+advance*.58,kneeY:-13+lift*.55,
   toeX:hipX+advance,ankleY:-4-lift};
}
