import type {PosterDesign} from "./types.js";
import {poly,disk,line} from "./primitives.js";
/** Individually owned procedural artwork for the city poster. */
export const cityPoster:PosterDesign={
 palette:["#215852","#e6b778","#fff0c7"],
 title:["CITY","HORIZON"],
 caption:"CONSTRUA SEU FUTURO",
 paint(c){
  c.fillStyle="#76a39a";c.fillRect(6,6,82,73);disk(c,72,21,13,"#f0c782");
  poly(c,[[6,54],[48,37],[90,55],[50,79],[6,69]],"#527e72");
  line(c,[[7,65],[50,46],[88,61]],"#d0c295",5);line(c,[[30,79],[68,51]],"#c5b48b",4);
  for(const [x,y,w,h,color] of [[20,55,13,20,"#dcbe8c"],[39,46,16,31,"#e8d8ae"],[62,57,11,23,"#e3bf86"]] as const){
   poly(c,[[x,y],[x+w,y-5],[x+w,y-h-5],[x,y-h]],color);
   poly(c,[[x+w,y-5],[x+w+7,y],[x+w+7,y-h],[x+w,y-h-5]],"#6a7770");
   poly(c,[[x,y-h],[x+w,y-h-5],[x+w+7,y-h],[x+7,y-h+5]],"#f3dfb3");
   for(let k=0;k<Math.floor(h/8);k++)line(c,[[x+4,y-h+8+k*7],[x+w-3,y-h+5+k*7]],"#4d7977",2);
  }
  for(const [x,y] of [[13,65],[75,70],[53,75]]){line(c,[[x!,y!],[x!,y!-7]],"#4d5d45",2);disk(c,x!,y!-8,5,"#b1c786");}

 }
};
