/** Original procedural image for selva-perdida. */
import {circle,line,path} from "./primitives.js";

export function paintSelvaPerdida(ctx:CanvasRenderingContext2D):void{
  circle(ctx,316,137,81,"#f8edaa");
  for(let i=0;i<7;i++){
   const x=-18+i*73;
   path(ctx,[[x,73],[x+70,45],[x+115,115],[x+43,162]],i%2?"#1b5b43":"#267e5b");
   line(ctx,[[x+43,58],[x+43,360]],"#1b473e",12);
  }
  path(ctx,[[0,375],[78,299],[141,346],[209,250],[279,348],[359,301],[420,356],[420,458],[0,458]],"#194d42");
  path(ctx,[[142,346],[159,279],[207,253],[253,284],[269,346]],"#baae86");
  path(ctx,[[175,308],[230,308],[235,346],[170,346]],"#294a50");
  path(ctx,[[0,412],[420,412],[420,466],[0,466]],"#347f5a");
}
