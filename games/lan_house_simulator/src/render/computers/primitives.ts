import type {Point} from "../../sim/types.js";
import {iso,polygon,raisedCuboid,type Projection} from "../isometric.js";

export function raisedBox(c:CanvasRenderingContext2D,cam:Projection,x:number,y:number,w:number,d:number,z:number,h:number,
 top:string,front:string,side:string):void{
 if(cam.rotation){raisedCuboid(c,cam,x,y,w,d,z,h,[top,front,side]);return;}
 const at=(px:number,py:number,pz:number)=>iso({x:px,y:py},cam,pz);
 polygon(c,[at(x+w,y,z),at(x+w,y+d,z),at(x+w,y+d,z+h),at(x+w,y,z+h)],side,"#6c665b");
 polygon(c,[at(x,y+d,z),at(x+w,y+d,z),at(x+w,y+d,z+h),at(x,y+d,z+h)],front,"#756650");
 polygon(c,[at(x,y,z+h),at(x+w,y,z+h),at(x+w,y+d,z+h),at(x,y+d,z+h)],top,"#9a896f");
}
export function path(c:CanvasRenderingContext2D,points:readonly Point[],color:string,width:number):void{
 c.beginPath();points.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));
 c.strokeStyle=color;c.lineWidth=width;c.lineCap="round";c.lineJoin="round";c.stroke();
}
export function plane(c:CanvasRenderingContext2D,cam:Projection,x:number,y:number,w:number,z:number,h:number,
 paint:()=>void):void{
 if(cam.rotation===1||cam.rotation===2)return;
 const a=iso({x,y},cam,z+h),b=iso({x:x+w,y},cam,z+h),d=iso({x,y},cam,z);
 c.save();c.transform((b.x-a.x)/96,(b.y-a.y)/96,0,(d.y-a.y)/100,a.x,a.y);paint();c.restore();
}
export function round(c:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,r:number,color:string,outline?:string):void{
 c.beginPath();c.roundRect(x,y,w,h,r);c.fillStyle=color;c.fill();
 if(outline){c.strokeStyle=outline;c.lineWidth=1.5;c.stroke();}
}
