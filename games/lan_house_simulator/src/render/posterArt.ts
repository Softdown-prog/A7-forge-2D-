import type {Projection} from "./isometric.js";
import {iso} from "./isometric.js";
import {line} from "./posters/primitives.js";
import type {PosterKind} from "./posters/types.js";
export type {PosterKind} from "./posters/types.js";
import {posterFor} from "./posters/registry.js";
export {POSTER_KINDS} from "./posters/registry.js";

export const POSTER_WIDTH=96,POSTER_HEIGHT=112;
/** Original vector illustrations and lettering, painted by the game itself. */
export function drawPosterPlate(c:CanvasRenderingContext2D,kind:PosterKind):void{
 const poster=posterFor(kind);
 const [base,accent,paper]=poster.palette;
 c.save();c.lineJoin="round";c.lineCap="round";
 c.fillStyle="#715c4e";c.fillRect(0,0,96,112);
 c.fillStyle="#ddc9a4";c.fillRect(0,0,94,110);
 c.fillStyle=paper;c.fillRect(2,2,90,106);
 c.fillStyle=base;c.fillRect(5,5,84,101);
 c.save();c.beginPath();c.rect(6,6,82,73);c.clip();
 poster.paint(c,paper);
 c.restore();
 // Titles live on the same paper plane as the illustration.
 c.fillStyle=base;c.fillRect(6,79,82,26);line(c,[[12,81],[82,81]],accent,1);
 c.textAlign="center";c.fillStyle=paper;
 const name=poster.title;c.font="900 "+(kind==="coaster"?9.2:name.length>1?13.5:16)+"px Arial,sans-serif";
 name.forEach((text,i)=>c.fillText(text,47,name.length===1?96:91+i*12,78));
 c.fillStyle=paper;c.fillRect(6,104.5,82,4.5);
 c.fillStyle=base;c.font="600 4.5px Arial,sans-serif";c.fillText(poster.caption,47,108.2,80);
 c.strokeStyle="rgba(255,249,224,.6)";c.lineWidth=1;c.strokeRect(1.5,1.5,91,107);
 c.restore();
}

export interface PosterPlacement{x:number;y:number;axis:"x"|"y";span:number;top:number;height:number}
/** Affine wall projection: illustrations, frame and text share one perspective. */
export function drawWallPoster(c:CanvasRenderingContext2D,camera:Projection,p:PosterPlacement,kind:PosterKind):void{
 const left=p.axis==="y"?{x:p.x,y:p.y+p.span}:{x:p.x,y:p.y};
 const right=p.axis==="y"?{x:p.x,y:p.y}:{x:p.x+p.span,y:p.y};
 const origin=iso(left,camera,p.top),u=iso(right,camera,p.top),down=iso(left,camera,p.top-p.height);
 c.save();c.transform((u.x-origin.x)/96,(u.y-origin.y)/96,(down.x-origin.x)/112,(down.y-origin.y)/112,origin.x,origin.y);
 c.fillStyle="rgba(49,40,41,.22)";c.fillRect(2.5,3,96,112);
 drawPosterPlate(c,kind);c.restore();
}
export function purchasedPosterKind(index:number):PosterKind{
 const collection:readonly PosterKind[]=["city","arcade","coaster","golf","artillery","tactical"];
 return collection[Math.abs(Math.trunc(index))%collection.length]!;
}
