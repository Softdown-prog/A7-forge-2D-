/** PS2 Canvas illustration: batidas-do-futuro (original commands). */
import {circle,polygon,stroke} from "./primitives.js";

export function paintBatidasDoFuturo(c:CanvasRenderingContext2D):void{
  circle(c,310,132,88,"#c398f5");
  for(let i=0;i<15;i++){c.fillStyle=i%3===0?"#88ede6":i%3===1?"#f0a9da":"#ffdb98";
   c.fillRect(5+i*29,372-(51+i*37%158),18,51+i*37%158);}
  polygon(c,[[58,245],[362,245],[354,418],[66,418]],"#1a275a");
  for(const x of [140,280]){
   circle(c,x,326,62,"#161b41");circle(c,x,326,44,"#8adfe5");circle(c,x,326,24,"#583d8e");
   circle(c,x,326,9,"#f1dbfc");
  }
  stroke(c,[[193,264],[227,264]],"#ffe4a1",9);
  for(let i=0;i<5;i++)stroke(c,[[65+i*72,430],[104+i*72,443]],"#9feff7",5);
}
