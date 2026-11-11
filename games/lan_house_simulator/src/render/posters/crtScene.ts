import {poly,disk,line} from "./primitives.js";
/** The terminal and arcade posters share the original CRT scene geometry. */
export function paintCrtScene(c:CanvasRenderingContext2D,kind:"terminal"|"arcade"):void{
  c.fillStyle=kind==="terminal"?"#628778":"#786488";c.fillRect(6,6,82,73);
  disk(c,72,21,16,kind==="terminal"?"#9eae78":"#be8496");
  poly(c,[[12,70],[78,70],[69,79],[20,79]],"#253c42");
  c.fillStyle="#233e3d";c.fillRect(20,21,58,44);
  c.fillStyle="#d9d9ac";c.fillRect(16,17,58,44);
  c.fillStyle="#254f49";c.fillRect(21,22,48,31);
  c.fillStyle="#8bb784";c.fillRect(25,26,40,23);
  if(kind==="terminal"){
   line(c,[[32,32],[38,37],[32,42]],"#214d41",3);line(c,[[43,42],[51,42]],"#214d41",3);
  }else{
   poly(c,[[46,27],[49,34],[57,35],[51,41],[53,48],[46,44],[39,48],[41,40],[35,35],[43,34]],"#fff0c7");
   disk(c,58,29,2,"#d28680");
  }
  c.fillStyle="#bac393";c.fillRect(37,61,15,5);c.fillRect(30,66,30,4);
  c.fillStyle="#d9cda7";c.fillRect(21,73,46,4);

}
