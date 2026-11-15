/** Original procedural image for agentes-da-noite. */
import {circle,line,path} from "./primitives.js";

export function paintAgentesDaNoite(ctx:CanvasRenderingContext2D):void{
  circle(ctx,326,135,80,"#b5f2e9");
  for(let i=0;i<10;i++){
   const x=i*47,h=135+(i*37)%129;
   ctx.fillStyle=i%2?"#172f49":"#203c50";ctx.fillRect(x,445-h,43,h);
   for(let j=0;j<3;j++){ctx.fillStyle="#ffdd9f77";ctx.fillRect(x+11,450-h+j*30,8,12);}
  }
  path(ctx,[[0,425],[420,425],[420,467],[0,467]],"#112a3e");
  path(ctx,[[165,403],[175,350],[194,323],[216,329],[227,405]],"#86a7b8");
  circle(ctx,198,318,23,"#a3c8cb");
  path(ctx,[[166,304],[183,271],[210,271],[229,304]],"#1d3447");
  line(ctx,[[242,340],[341,283]],"#c7f5eb",6);
}
