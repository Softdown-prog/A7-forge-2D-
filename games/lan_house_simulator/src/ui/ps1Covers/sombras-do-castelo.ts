/** Original procedural image for sombras-do-castelo. */
import {circle,line,path} from "./primitives.js";

export function paintSombrasDoCastelo(ctx:CanvasRenderingContext2D):void{
  circle(ctx,315,133,75,"#eaedff");
  for(const [x,h] of [[25,190],[117,150],[205,212],[310,177]] as const){
   path(ctx,[[x,410],[x,h],[x+26,h-47],[x+52,h],[x+52,410]],"#172443");
   path(ctx,[[x+14,h+36],[x+26,h+18],[x+37,h+36],[x+37,h+83],[x+14,h+83]],"#ffe1a3");
  }
  path(ctx,[[0,408],[420,408],[420,465],[0,465]],"#272948");
  path(ctx,[[168,400],[187,331],[206,318],[230,340],[245,400]],"#7b9bbb");
  circle(ctx,208,315,23,"#c3d6df");line(ctx,[[220,345],[285,302]],"#f4db9a",9);
}
