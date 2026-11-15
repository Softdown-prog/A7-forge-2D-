/** Original procedural image for rally-do-deserto. */
import {circle,line,path} from "./primitives.js";

export function paintRallyDoDeserto(ctx:CanvasRenderingContext2D):void{
  circle(ctx,322,132,83,"#ffe5a8");
  path(ctx,[[0,295],[105,238],[216,294],[335,212],[420,282],[420,458],[0,458]],"#db9555");
  path(ctx,[[0,363],[153,294],[260,342],[420,276],[420,468],[0,468]],"#b76c4b");
  path(ctx,[[171,247],[234,247],[388,459],[34,459]],"#685260");
  line(ctx,[[171,247],[34,459]],"#f5cc87",8);line(ctx,[[234,247],[388,459]],"#f5cc87",8);
  path(ctx,[[91,348],[132,301],[275,301],[327,348],[340,388],[79,388]],"#367e94");
  path(ctx,[[135,305],[167,272],[247,272],[279,305]],"#a8e9d8");
  for(const x of [105,309])circle(ctx,x,391,23,"#25243b");
  line(ctx,[[120,348],[156,348]],"#fff2bc",9);
}
