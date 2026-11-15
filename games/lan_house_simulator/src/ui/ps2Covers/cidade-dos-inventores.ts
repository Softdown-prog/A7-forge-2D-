/** PS2 Canvas illustration: cidade-dos-inventores (original commands). */
import {circle,stroke} from "./primitives.js";

export function paintCidadeDosInventores(c:CanvasRenderingContext2D):void{
  circle(c,323,132,73,"#f6ca9d");
  for(let i=0;i<10;i++){c.fillStyle=i%2?"#4b4c72":"#665777";c.fillRect(i*43,187+(i%3)*25,41,226);}
  for(const [x,y,r] of [[128,309,59],[285,266,48],[232,368,45]] as const){
   circle(c,x,y,r,"#e8c58d");circle(c,x,y,r*.70,"#5b4c65");circle(c,x,y,r*.35,"#f3d7a2");
   for(let i=0;i<8;i++){const a=i*Math.PI/4;
    stroke(c,[[x+Math.cos(a)*r*.64,y+Math.sin(a)*r*.64],[x+Math.cos(a)*r*1.23,y+Math.sin(a)*r*1.23]],"#f9d18e",8);}
  }
  stroke(c,[[105,225],[330,184]],"#8fe7e6",6);
}
