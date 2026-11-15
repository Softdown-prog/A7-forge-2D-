/** Original procedural image for ritmo-da-cidade. */
import {circle,line,path} from "./primitives.js";

export function paintRitmoDaCidade(ctx:CanvasRenderingContext2D):void{
  circle(ctx,312,131,84,"#ef8bd1");
  for(let i=0;i<14;i++){
   const h=55+(i*51)%169,x=5+i*30;
   ctx.fillStyle=i%2?"#82e9ec":"#ffbc9e";ctx.fillRect(x,385-h,19,h);
  }
  path(ctx,[[82,248],[338,248],[357,393],[67,393]],"#1d2552");
  path(ctx,[[95,261],[326,261],[332,380],[90,380]],"#56648c");
  for(const x of [148,279]){
   circle(ctx,x,326,48,"#101c44");circle(ctx,x,326,29,"#88e4ed");circle(ctx,x,326,13,"#d4b2f6");
  }
  line(ctx,[[194,281],[239,281]],"#f6d6fa",10);
}
