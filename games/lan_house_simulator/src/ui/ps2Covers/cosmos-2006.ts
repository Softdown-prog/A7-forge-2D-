/** PS2 Canvas illustration: cosmos-2006 (original commands). */
import {circle,polygon,stroke} from "./primitives.js";

export function paintCosmos2006(c:CanvasRenderingContext2D):void{
 circle(c,310,139,99,"#7b80c8");
 circle(c,301,133,65,"#9fb8e9");
 circle(c,317,113,22,"#eac9d0");
 for(let i=0;i<46;i++){
  const x=15+(i*83)%387,y=55+(i*47)%344;
  circle(c,x,y,1+(i%3)*.8,"#e1f8ff");
 }
 polygon(c,[[211,197],[249,290],[362,372],[257,357],[211,423],[163,357],[59,372],[176,290]],"#85d0e5");
 polygon(c,[[211,213],[232,312],[211,391],[190,312]],"#dbf7ff");
 polygon(c,[[154,352],[166,389],[156,445],[126,387]],"#ffb78b");
 polygon(c,[[267,352],[293,387],[267,445],[255,389]],"#ffb78b");
 stroke(c,[[211,208],[211,320]],"#f5f0c3",4);
 for(const [x,y] of [[74,234],[324,293],[101,382]] as const){
  polygon(c,[[x-29,y],[x,y-17],[x+30,y],[x,y+17]],"#ffb6c5");
  circle(c,x,y,6,"#fff5c9");
 }
}
