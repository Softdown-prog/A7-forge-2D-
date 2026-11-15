/** Original procedural image for dragoes-de-aco. */
import {circle,line,path} from "./primitives.js";

export function paintDragoesDeAco(ctx:CanvasRenderingContext2D):void{
  circle(ctx,301,125,88,"#efac9b");
  path(ctx,[[20,322],[123,245],[187,305],[267,212],[411,299],[355,351],[284,323],[213,364],[157,332],[77,380]],"#a9bdca");
  path(ctx,[[120,289],[171,201],[236,242],[255,318],[197,384],[143,350]],"#687f9d");
  path(ctx,[[236,250],[294,217],[357,240],[385,276],[346,304],[285,283]],"#b4c8c9");
  circle(ctx,350,253,8,"#ffe4af");
  path(ctx,[[176,344],[186,419],[209,445],[240,415],[263,344]],"#7084a8");
  for(const x of [35,95,323])line(ctx,[[x,435],[x+34,395]],"#eb866e",5);
}
