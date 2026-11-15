/** PS2 Canvas illustration: volei-na-praia (original commands). */
import {circle,polygon,stroke} from "./primitives.js";

export function paintVoleiNaPraia(c:CanvasRenderingContext2D):void{
  circle(c,314,132,85,"#ffe7a3");
  polygon(c,[[0,285],[420,285],[420,341],[0,341]],"#61b6be");
  polygon(c,[[0,333],[420,326],[420,466],[0,466]],"#dfbf86");
  stroke(c,[[210,260],[210,438]],"#f5f8e9",8);
  for(let y=280;y<433;y+=21)stroke(c,[[103,y],[318,y]],"#f6faf2a0",2);
  stroke(c,[[102,277],[318,277]],"#faf9e5",6);
  circle(c,162,348,24,"#faaf8c");circle(c,270,345,24,"#8bdfe6");
  stroke(c,[[162,376],[132,419]],"#345c7c",13);stroke(c,[[270,373],[304,413]],"#345c7c",13);
  circle(c,222,242,28,"#f9f7e4");stroke(c,[[207,224],[237,261]],"#2f7295",5);
}
