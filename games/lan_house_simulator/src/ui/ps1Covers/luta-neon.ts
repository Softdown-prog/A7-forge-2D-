/** Original procedural image for luta-neon. */
import {circle,line,path} from "./primitives.js";

function fighter(ctx:CanvasRenderingContext2D,x:number,y:number,scale:number,color:string,flip:number):void{
 ctx.save();ctx.translate(x,y);ctx.scale(scale*flip,scale);
 ctx.shadowColor=color;ctx.shadowBlur=19;
 circle(ctx,-1,-100,22,color);
 path(ctx,[[-26,-76],[21,-74],[31,-8],[-33,-5]],color);
 path(ctx,[[-22,-3],[-42,73],[-18,81],[8,20],[26,78],[51,72],[25,-8]],color);
 path(ctx,[[18,-66],[57,-86],[94,-79],[90,-61],[49,-58],[26,-29]],color);
 path(ctx,[[-28,-69],[-57,-37],[-77,-42],[-65,-57],[-40,-86]],color);
 ctx.restore();
}
export function paintLutaNeon(ctx:CanvasRenderingContext2D):void{
 circle(ctx,204,190,118,"#52318a");
 for(let i=0;i<10;i++){
  const x=i*47;line(ctx,[[x,345],[210+(x-210)*2,445]],"#74e6eb66",2);
 }
 for(let i=0;i<7;i++)line(ctx,[[0,346+i*i*3],[420,346+i*i*3]],"#74e6eb88",2);
 fighter(ctx,121,331,1.04,"#ff5a9d",1);
 fighter(ctx,305,335,1.04,"#5df8ff",-1);
 path(ctx,[[213,141],[184,210],[217,207],[197,280],[261,191],[228,195],[251,141]],"#ffe18b");
}
