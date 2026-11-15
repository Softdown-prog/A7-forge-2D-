/** PS2 Canvas illustration: templo-da-aurora (original commands). */
import {circle,polygon,stroke} from "./primitives.js";

export function paintTemploDaAurora(c:CanvasRenderingContext2D):void{
  circle(c,301,144,109,"#ffe4a5");
  polygon(c,[[0,339],[90,261],[142,312],[243,229],[336,310],[420,242],[420,469],[0,469]],"#6c5073");
  polygon(c,[[70,298],[214,202],[362,298]],"#f7dda0");
  c.fillStyle="#c8ac96";c.fillRect(87,298,257,153);
  for(const x of [103,161,219,277]){c.fillStyle="#6b607c";c.fillRect(x,296,28,139);
   c.fillStyle="#ffe5b4";c.fillRect(x-9,293,45,12);}
  polygon(c,[[188,451],[190,338],[242,338],[240,451]],"#4e4b65");
  for(let i=0;i<4;i++)stroke(c,[[0,447-i*18],[420,447-i*18]],"#edc99999",3);
}
