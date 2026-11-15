/** Original procedural image for cosmo-blocos. */
import {circle} from "./primitives.js";

export function paintCosmoBlocos(ctx:CanvasRenderingContext2D):void{
 circle(ctx,314,142,76,"#6e62d9");circle(ctx,325,128,43,"#a88cf6");
 ctx.save();ctx.translate(218,284);ctx.rotate(-.16);
 const cell=48;const pieces=[
  {x:-3,y:0,c:"#ff709e",p:[[0,0],[1,0],[2,0],[1,1]]},
  {x:1,y:-1,c:"#74f5ef",p:[[0,0],[0,1],[1,1],[2,1]]},
  {x:-2,y:3,c:"#ffe683",p:[[0,0],[1,0],[0,1],[1,1]]},
  {x:1,y:3,c:"#ae86ff",p:[[1,0],[2,0],[0,1],[1,1]]}
 ];
 for(const piece of pieces)for(const [dx,dy] of piece.p){
  const x=(piece.x+dx)*cell,y=(piece.y+dy)*cell;
  ctx.fillStyle=piece.c;ctx.fillRect(x,y,cell-4,cell-4);
  ctx.fillStyle="#ffffff77";ctx.fillRect(x+5,y+5,cell-14,6);
  ctx.strokeStyle="#13214c";ctx.lineWidth=4;ctx.strokeRect(x,y,cell-4,cell-4);
 }
 ctx.restore();
}
