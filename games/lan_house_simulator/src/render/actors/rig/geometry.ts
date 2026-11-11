import type {ActorContext} from "../../actorArt.js";
import {lerpHex} from "../../color.js";

/** Canvas geometry, selective outlines, physical limbs and shared pose easing. */
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

export function profileWalkingStep(step:number,side:-1|1):
  {hipX:number;kneeX:number;kneeY:number;toeX:number;ankleY:number}{
 const hipX=side*2.4,advance=step*side*9;
 const lift=Math.max(0,-step*side)*1.7;
 return {hipX,kneeX:hipX+advance*.58,kneeY:-13+lift*.55,
   toeX:hipX+advance,ankleY:-4-lift};
}
