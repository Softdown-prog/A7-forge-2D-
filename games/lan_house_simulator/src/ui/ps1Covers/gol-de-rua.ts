/** Original procedural image for gol-de-rua. */
import {circle,line,path} from "./primitives.js";

export function paintGolDeRua(ctx:CanvasRenderingContext2D):void{
 circle(ctx,309,134,87,"#ffe28a");
 for(let i=0;i<11;i++){
  const x=i*44;
  ctx.fillStyle=i%3===0?"#103e54":"#19506a";
  ctx.fillRect(x,200+(i%4)*-20,42,180);
  for(let j=0;j<4;j++){ctx.fillStyle="#ffdf9655";ctx.fillRect(x+9,220+j*32,9,8);}
 }
 path(ctx,[[0,347],[420,309],[420,460],[0,460]],"#158b68");
 for(let i=0;i<4;i++)line(ctx,[[0,370+i*25],[420,331+i*22]],"#b3ffd666",2);
 line(ctx,[[40,210],[181,197],[194,337],[39,354],[40,210]],"#dcf8ee",8);
 for(let i=1;i<6;i++)line(ctx,[[40+i*25,208-i*2],[40+i*25,351-i*3]],"#cfffe055",2);
 line(ctx,[[40,236],[185,221]],"#cfffe077",2);
 circle(ctx,281,330,84,"#f6f1e5");
 path(ctx,[[280,281],[316,305],[303,350],[259,350],[246,305]],"#14233a");
 for(let a=0;a<5;a++){
  const angle=a*Math.PI*2/5;
  const x=281+Math.cos(angle)*67,y=330+Math.sin(angle)*67;
  line(ctx,[[281+Math.cos(angle)*34,330+Math.sin(angle)*34],[x,y]],"#183446",11);
 }
 line(ctx,[[228,320],[194,302],[174,260]],"#e8ffba",5);
}
