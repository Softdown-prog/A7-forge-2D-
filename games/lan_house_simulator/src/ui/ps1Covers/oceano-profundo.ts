/** Original procedural image for oceano-profundo. */
import {circle,path} from "./primitives.js";

export function paintOceanoProfundo(ctx:CanvasRenderingContext2D):void{
  circle(ctx,334,134,82,"#56aec8");
  for(let i=0;i<20;i++)circle(ctx,27+(i*57)%364,67+(i*113)%307,2+i%4,"#b9fff199");
  path(ctx,[[0,397],[67,354],[154,397],[253,349],[339,399],[420,355],[420,465],[0,465]],"#186c78");
  path(ctx,[[106,278],[151,236],[280,236],[324,278],[316,326],[114,326]],"#f4cd77");
  path(ctx,[[144,242],[180,211],[243,211],[279,242]],"#9bf3e2");
  for(const x of [171,246]){circle(ctx,x,286,29,"#1d677f");circle(ctx,x,286,18,"#8de5e5");}
  path(ctx,[[322,276],[374,255],[374,343],[317,329]],"#d9a96e");
  for(const [x,y] of [[38,239],[359,195],[332,368]] as const){
   path(ctx,[[x-22,y],[x,y-13],[x+21,y],[x,y+13]],"#b7e5b2");
  }
}
