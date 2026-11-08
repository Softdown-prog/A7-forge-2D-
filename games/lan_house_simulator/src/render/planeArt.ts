/** Drawing helpers shared by the counter, printer and disc copier: paint on a
 * physical plane of the isometric world so lettering, keys and screens follow the
 * object when the counter is rotated. Pure geometry; no state, no images. */
import type {Point} from "../sim/types.js";
import {iso,type Projection} from "./isometric.js";

export type Rotation4=0|1|2|3;
const FACES={front:[0,3],back:[1,2],right:[0,1],left:[2,3]} as const;
export type Face=keyof typeof FACES;
/** True when the given side of a counter-aligned object faces the camera. */
export function faceVisible(cam:Projection,face:Face):boolean{
 return (FACES[face] as readonly number[]).includes(cam.rotation??0);
}
/** Paint in a 100 × 60 box mapped onto a vertical wall of the object. */
export function panel(c:CanvasRenderingContext2D,cam:Projection,x:number,y:number,span:number,z:number,h:number,
 axis:"x"|"y",paint:()=>void):void{
 let a=iso({x,y},cam,z+h),b=iso({x:x+(axis==="x"?span:0),y:y+(axis==="y"?span:0)},cam,z+h);
 if(b.x<a.x)[a,b]=[b,a];
 c.save();c.transform((b.x-a.x)/100,(b.y-a.y)/100,0,h*cam.zoom/60,a.x,a.y);paint();c.restore();
}
/** Paint in a 100 × 60 box mapped onto a horizontal surface. */
export function top(c:CanvasRenderingContext2D,cam:Projection,x:number,y:number,w:number,d:number,z:number,paint:()=>void):void{
 const a=iso({x,y},cam,z),b=iso({x:x+w,y},cam,z),e=iso({x,y:y+d},cam,z);
 c.save();c.transform((b.x-a.x)/100,(b.y-a.y)/100,(e.x-a.x)/60,(e.y-a.y)/60,a.x,a.y);paint();c.restore();
}
export function round(c:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,r:number,fill:string|CanvasGradient):void{
 c.fillStyle=fill;c.beginPath();c.roundRect(x,y,w,h,r);c.fill();
}
/** Vertical two-stop gradient for the 100 × 60 panel box. */
export function vertical(c:CanvasRenderingContext2D,from:string,to:string,y0=0,y1=60):CanvasGradient{
 const g=c.createLinearGradient(0,y0,0,y1);g.addColorStop(0,from);g.addColorStop(1,to);return g;
}
/** A circle or ellipse on a horizontal plane, projected through the camera. */
export function flatEllipse(c:CanvasRenderingContext2D,cam:Projection,cx:number,cy:number,rx:number,ry:number,z:number,
 fill:string|CanvasGradient,stroke?:string,steps=22):void{
 c.beginPath();
 for(let i=0;i<steps;i++){
  const t=i/steps*Math.PI*2,p=iso({x:cx+Math.cos(t)*rx,y:cy+Math.sin(t)*ry},cam,z);
  if(i)c.lineTo(p.x,p.y);else c.moveTo(p.x,p.y);
 }
 c.closePath();c.fillStyle=fill;c.fill();
 if(stroke){c.strokeStyle=stroke;c.lineWidth=Math.max(.6,cam.zoom*.9);c.stroke();}
}
/** Soft contact shadow of an object resting on a surface at height `z`. */
export function contactShadow(c:CanvasRenderingContext2D,cam:Projection,x:number,y:number,w:number,d:number,z:number,alpha=.2):void{
 const pad=.03,pts:Point[]=[
  iso({x:x-pad,y:y-pad},cam,z),iso({x:x+w+pad*2,y:y-pad},cam,z),
  iso({x:x+w+pad*2,y:y+d+pad*2},cam,z),iso({x:x-pad,y:y+d+pad*2},cam,z)];
 c.beginPath();pts.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.closePath();
 c.fillStyle="rgba(24,34,28,"+alpha.toFixed(3)+")";c.fill();
}
/** Straight segment between two world points at given heights. */
export function wire(c:CanvasRenderingContext2D,cam:Projection,from:Point,zFrom:number,to:Point,zTo:number,
 color:string,width:number,sag=0):void{
 const a=iso(from,cam,zFrom),b=iso(to,cam,zTo);
 c.strokeStyle=color;c.lineWidth=Math.max(.6,width*cam.zoom);c.lineCap="round";
 c.beginPath();c.moveTo(a.x,a.y);
 if(sag)c.quadraticCurveTo((a.x+b.x)/2,(a.y+b.y)/2+sag*cam.zoom,b.x,b.y);else c.lineTo(b.x,b.y);
 c.stroke();
}
