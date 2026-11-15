/** Original procedural image for turbo-circuito. */
import {circle,line,path} from "./primitives.js";

export function paintTurboCircuito(ctx:CanvasRenderingContext2D):void{
 circle(ctx,308,146,78,"#ff6d90");
 for(let i=0;i<12;i++)line(ctx,[[0,110+i*27],[420,15+i*11]],"#6e5ad766",2);
 path(ctx,[[190,199],[248,199],[453,462],[-36,462]],"#1b214b");
 line(ctx,[[190,199],[-36,462]],"#f74fbb",8);
 line(ctx,[[248,199],[453,462]],"#f74fbb",8);
 for(let i=0;i<5;i++){
  const t=(i+1)/6,y=199+t*t*255,size=4+t*15;
  path(ctx,[[218-size/3,y],[222+size/3,y],[230+size,y+size*2],[206-size,y+size*2]],"#fff2a5");
 }
 path(ctx,[[94,330],[126,294],[293,294],[338,330],[364,397],[74,397]],"#1d173a");
 path(ctx,[[125,303],[168,259],[266,259],[302,303]],"#87f3ed");
 path(ctx,[[89,333],[337,333],[355,378],[73,378]],"#f33382");
 path(ctx,[[115,345],[175,345],[168,365],[103,365]],"#fff3af");
 path(ctx,[[254,345],[315,345],[328,365],[260,365]],"#fff3af");
 for(const x of [106,305])circle(ctx,x,394,25,"#0b0a24");
 line(ctx,[[193,319],[239,319]],"#fad5ef",6);
}
