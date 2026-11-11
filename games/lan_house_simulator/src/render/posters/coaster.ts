import type {PosterDesign} from "./types.js";
import {poly,disk,line} from "./primitives.js";
/** Individually owned procedural artwork for the coaster poster. */
export const coasterPoster:PosterDesign={
 palette:["#204c49","#efb75f","#fff0c9"],
 title:["ROLLERCOASTER","TYCOON"],
 caption:"UM PARQUE DE IDEIAS",
 paint(c){
  c.fillStyle="#e7bf78";c.fillRect(6,6,82,73);disk(c,69,24,15,"#f9e3aa");
  poly(c,[[6,65],[18,48],[24,62],[34,51],[46,67],[88,60],[88,80],[6,80]],"#668c73");
  line(c,[[12,70],[12,44],[31,27],[44,33],[62,53],[81,40]],"#64786b",2);
  for(const x of [20,36,54,70])line(c,[[x,41],[x,79]],"#557b69",1.5);
  c.beginPath();c.moveTo(4,64);c.bezierCurveTo(19,61,11,22,31,25);
  c.bezierCurveTo(52,25,47,66,65,56);c.bezierCurveTo(74,52,78,39,92,43);
  c.strokeStyle="#214d4a";c.lineWidth=5;c.stroke();c.strokeStyle="#fff0c9";c.lineWidth=1.4;c.stroke();
  for(const [x,y] of [[22,26],[30,24],[38,29]]){
   c.fillStyle="#b85b49";c.fillRect(x!,y!,8,5);disk(c,x!+2,y!+6,1.5,"#203b3c");disk(c,x!+6,y!+6,1.5,"#203b3c");
  }
  poly(c,[[7,80],[10,65],[15,74],[20,62],[25,80]],"#315f52");

 }
};
