import type {PosterDesign} from "./types.js";
import {poly,disk,line} from "./primitives.js";
/** Individually owned procedural artwork for the artillery poster. */
export const artilleryPoster:PosterDesign={
 palette:["#4a4269","#eca47a","#f6edd1"],
 title:["GUNBOUND"],
 caption:"MIRE NAS ESTRELAS",
 paint(c,paper){
  c.fillStyle="#675d8e";c.fillRect(6,6,82,73);disk(c,71,25,14,"#c198ae");
  disk(c,67,21,10,"#dfaebb");
  for(const [x,y] of [[16,14],[38,24],[17,37],[52,10]]){
   line(c,[[x!-2,y!],[x!+2,y!]],paper,1);line(c,[[x!,y!-2],[x!,y!+2]],paper,1);
  }
  poly(c,[[6,63],[27,57],[48,65],[75,53],[89,59],[89,80],[6,80]],"#d99774");
  c.fillStyle="#293f58";c.fillRect(22,55,36,14);disk(c,28,68,7,"#263447");disk(c,51,68,7,"#263447");
  disk(c,28,68,3,"#a3bdaa");disk(c,51,68,3,"#a3bdaa");
  poly(c,[[28,54],[32,45],[47,43],[57,52],[54,59],[25,59]],"#b9c686");
  line(c,[[47,48],[62,36]],"#d4d898",8);line(c,[[49,46],[61,36]],"#7d9b77",2);
  disk(c,68,30,5,"#f2dc9e");disk(c,67,28,2,"#fff4d2");

 }
};
