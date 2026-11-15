/** PS2 Canvas illustration: misterio-do-farol (original commands). */
import {circle,polygon,stroke} from "./primitives.js";

export function paintMisterioDoFarol(c:CanvasRenderingContext2D):void{
  circle(c,330,126,69,"#d6e6ec");
  polygon(c,[[0,364],[88,276],[177,328],[261,262],[420,358],[420,463],[0,463]],"#29465c");
  polygon(c,[[156,431],[185,198],[240,198],[272,431]],"#d7cbb1");
  c.fillStyle="#f9e2b8";c.fillRect(179,184,71,18);c.fillStyle="#26364d";c.fillRect(193,158,42,33);
  circle(c,211,180,18,"#ffe7ac");
  polygon(c,[[211,164],[420,73],[420,252],[214,198]],"#ffe6a855");
  polygon(c,[[0,389],[420,368],[420,466],[0,466]],"#27647a");
  for(let i=0;i<5;i++)stroke(c,[[i*99,406+i*7],[i*99+75,400+i*7]],"#8fe5e299",4);
}
