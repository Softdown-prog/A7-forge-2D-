import type {PosterDesign} from "./types.js";
import {poly,disk,line} from "./primitives.js";
/** Individually owned procedural artwork for the golf poster. */
export const golfPoster:PosterDesign={
 palette:["#42879a","#f3d77b","#fff7db"],
 title:["PANGYA"],
 caption:"VENTO A FAVOR",
 paint(c){
  c.fillStyle="#6cbbc2";c.fillRect(6,6,82,73);disk(c,69,22,11,"#fce2a0");
  line(c,[[12,23],[23,23],[27,19],[38,19]],"#f3efd6",4);
  poly(c,[[6,51],[26,44],[52,53],[73,43],[89,49],[89,80],[6,80]],"#3f8862");
  poly(c,[[6,67],[40,55],[75,60],[88,57],[88,80],[6,80]],"#9dbb70");
  poly(c,[[41,68],[48,65],[65,70],[59,75],[44,74]],"#e7d9a6");
  line(c,[[59,33],[59,65]],"#f8edcd",2);poly(c,[[59,33],[76,38],[59,44]],"#c75f74");
  c.fillStyle="#52745e";c.beginPath();c.ellipse(32,71,12,4,0,0,Math.PI*2);c.fill();
  disk(c,31,62,10,"#fcf5dc");disk(c,34,66,5,"#d3dacc");disk(c,28,59,5,"#fffef0");
  for(const [x,y] of [[26,63],[32,60],[35,64]])disk(c,x!,y!,1,"#b6c7c5");

 }
};
