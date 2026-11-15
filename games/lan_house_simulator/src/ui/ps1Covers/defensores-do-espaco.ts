/** Original procedural image for defensores-do-espaco. */
import {circle,path} from "./primitives.js";

export function paintDefensoresDoEspaco(ctx:CanvasRenderingContext2D):void{
  circle(ctx,331,130,88,"#6e8cda");circle(ctx,313,115,53,"#9dcbf5");
  for(let i=0;i<17;i++)circle(ctx,22+(i*103)%376,55+(i*73)%303,2+(i%3),"#dcf9ff");
  path(ctx,[[210,193],[254,302],[361,375],[254,363],[212,408],[168,363],[61,375],[168,302]],"#72d3de");
  path(ctx,[[210,205],[229,320],[210,384],[191,320]],"#d1f5fd");
  path(ctx,[[163,358],[184,386],[160,442]],"#ffb2a1");
  path(ctx,[[237,386],[256,358],[260,442]],"#ffb2a1");
  for(const x of [80,323]){path(ctx,[[x,231],[x+29,252],[x+5,269],[x-23,252]],"#f7a6c1");}
}
