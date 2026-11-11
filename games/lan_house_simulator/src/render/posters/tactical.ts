import type {PosterDesign} from "./types.js";
import {poly,disk,line} from "./primitives.js";
/** Individually owned procedural artwork for the tactical poster. */
export const tacticalPoster:PosterDesign={
 palette:["#203344","#db954b","#fff0d1"],
 title:["COUNTER","STRIKE"],
 caption:"ENTRE PARA A PARTIDA",
 paint(c){
  poly(c,[[5,6],[88,6],[88,51],[5,74]],"#bc8049");
  poly(c,[[5,6],[46,6],[5,51]],"#e8bd77");
  for(const [x,h] of [[10,24],[24,34],[60,28],[74,39]]){
   c.fillStyle="#6c665b";c.fillRect(x!,76-h!,10,h!);
   c.fillStyle="#d6b677";c.fillRect(x!+2,79-h!,3,4);
  }
  // Silhouette of a player: large shapes remain readable on the wall.
  disk(c,47,30,7,"#263747");poly(c,[[36,39],[53,37],[60,58],[54,65],[32,65]],"#253747");
  poly(c,[[35,58],[43,62],[39,80],[30,80]],"#182c3c");
  poly(c,[[48,59],[56,58],[63,80],[53,80]],"#182c3c");
  line(c,[[38,43],[30,53],[44,58]],"#263747",7);line(c,[[54,42],[61,48],[73,44]],"#263747",7);
  line(c,[[38,43],[47,42],[50,55]],"#648079",2);
  c.strokeStyle="#f4d39a";c.lineWidth=1;c.strokeRect(69,17,9,9);
  line(c,[[73.5,14],[73.5,29]],"#f4d39a",1);line(c,[[66,21.5],[81,21.5]],"#f4d39a",1);

 }
};
