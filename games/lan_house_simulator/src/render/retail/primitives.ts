import type {Point} from "../../sim/types.js";
import {iso,polygon,raisedCuboid,type Projection} from "../isometric.js";
import {drawRasterCached,rasterCacheUsable} from "../rasterCache.js";

export const RETAIL_DISPLAY_CAPACITY={soda:9,candy:12,snacks:20} as const;
export function visibleRetailStock(stock:number,capacity:number):number{
 return Number.isFinite(stock)?Math.max(0,Math.min(capacity,Math.floor(stock))):0;
}
export function line(c:CanvasRenderingContext2D,points:Point[],color:string,width:number):void{
 c.beginPath();points.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.strokeStyle=color;c.lineWidth=width;c.lineCap="round";c.lineJoin="round";c.stroke();
}
export function rounded(c:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,r:number,color:string|CanvasGradient,stroke?:string):void{
 c.beginPath();c.roundRect(x,y,w,h,r);c.fillStyle=color;c.fill();
 if(stroke){c.strokeStyle=stroke;c.lineWidth=1;c.stroke();}
}
export function box(c:CanvasRenderingContext2D,cam:Projection,x:number,y:number,w:number,d:number,z:number,h:number,top:string,front:string,side:string):void{
 if(cam.rotation){raisedCuboid(c,cam,x,y,w,d,z,h,[top,front,side]);return;}
 const at=(x:number,y:number,z:number)=>iso({x,y},cam,z);
 polygon(c,[at(x+w,y,z),at(x+w,y+d,z),at(x+w,y+d,z+h),at(x+w,y,z+h)],side,"#41574f");
 polygon(c,[at(x,y+d,z),at(x+w,y+d,z),at(x+w,y+d,z+h),at(x,y+d,z+h)],front,"#41574f");
 polygon(c,[at(x,y,z+h),at(x+w,y,z+h),at(x+w,y+d,z+h),at(x,y+d,z+h)],top,"#6d7e6c");
}
export function face(c:CanvasRenderingContext2D,cam:Projection,x:number,y:number,span:number,z:number,h:number,axis:"x"|"y",paint:()=>void):void{
 // A face turned away from the fixed camera is hidden by the cabinet.
 if(cam.rotation){const a=iso({x,y},cam),b=iso(axis==="x"?{x:x+.1,y}:{x,y:y+.1},cam);if(b.y<=a.y)return;}
 // u always moves right on screen, so lettering is never mirrored on the rack.
 const a=iso(axis==="x"?{x,y:y+span}:{x,y},cam,z+h);
 const b=iso(axis==="x"?{x,y}:{x:x+span,y},cam,z+h);
 const d=iso(axis==="x"?{x,y:y+span}:{x,y},cam,z);
 c.save();c.transform((b.x-a.x)/96,(b.y-a.y)/96,0,(d.y-a.y)/180,a.x,a.y);paint();c.restore();
}
export function caption(c:CanvasRenderingContext2D,text:string,x:number,y:number,size:number,color:string,maxWidth=90):void{
 c.fillStyle=color;c.font="bold "+size+"px Arial,sans-serif";c.textAlign="center";c.fillText(text,x,y,maxWidth);
}

export function drawCached(c:CanvasRenderingContext2D,cam:Projection,p:Point,keyParts:unknown[],paint:(target:CanvasRenderingContext2D)=>void,useCache:boolean):void{
 if(!useCache||!rasterCacheUsable(c)){paint(c);return;}
 const anchor=iso(p,cam),z=cam.zoom;
 drawRasterCached(c,"retail",{
  key:JSON.stringify([z,cam.rotation??0,...keyParts]),anchorX:anchor.x,anchorY:anchor.y,snap:"floor",limit:96,
  padX:Math.ceil((cam.rotation?150:90)*z)+4,padY:Math.ceil((cam.rotation?180:116)*z)+4,
  width:Math.ceil((cam.rotation?300:184)*z)+8,height:Math.ceil((cam.rotation?300:181)*z)+8
 },paint);
}
