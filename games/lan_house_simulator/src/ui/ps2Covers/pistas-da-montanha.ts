/** PS2 Canvas illustration: pistas-da-montanha (original commands). */
import {circle,polygon,stroke} from "./primitives.js";

export function paintPistasDaMontanha(c:CanvasRenderingContext2D):void{
  circle(c,326,137,67,"#ffe5ae");
  polygon(c,[[0,330],[92,156],[185,334],[278,137],[420,335],[420,462],[0,462]],"#607a8c");
  polygon(c,[[0,366],[104,231],[206,349],[312,237],[420,370],[420,460],[0,460]],"#39596a");
  polygon(c,[[172,247],[258,247],[420,461],[0,461]],"#383a4e");
  stroke(c,[[177,250],[0,462]],"#f8dca9",6);stroke(c,[[258,250],[418,462]],"#f8dca9",6);
  polygon(c,[[100,363],[139,328],[283,328],[331,371],[338,409],[86,409]],"#f9a958");
  polygon(c,[[149,333],[176,306],[260,306],[288,333]],"#d6f3e8");
  for(const x of [118,300])circle(c,x,410,21,"#192c3e");
}
