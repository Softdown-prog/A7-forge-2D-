/** Original procedural image for ilha-dos-cristais. */
import {circle,line,path} from "./primitives.js";

export function paintIlhaDosCristais(ctx:CanvasRenderingContext2D):void{
 circle(ctx,320,140,65,"#e7d0ff");
 path(ctx,[[0,350],[104,227],[161,304],[233,190],[337,350],[420,256],[420,465],[0,465]],"#233c75");
 path(ctx,[[0,393],[113,317],[180,377],[263,283],[420,369],[420,469],[0,469]],"#3c4c96");
 for(let i=0;i<6;i++)line(ctx,[[i*87-25,410+i%2*10],[i*87+61,409+i%2*10]],"#7be7f2aa",4);
 for(const [x,y,size] of [[92,334,57],[199,288,94],[307,353,69]] as const){
  path(ctx,[[x,y-size],[x+size*.4,y-size*.3],[x+size*.28,y+size*.6],
   [x-size*.25,y+size*.5],[x-size*.42,y-size*.2]],"#8bf7e6");
  path(ctx,[[x,y-size],[x+size*.4,y-size*.3],[x,y+size*.25]],"#e2caff");
  path(ctx,[[x,y-size],[x-size*.42,y-size*.2],[x-size*.25,y+size*.5],[x,y+size*.25]],"#54a7e4");
  circle(ctx,x,y-size*.12,size*.1,"#ffffff");
 }
}
