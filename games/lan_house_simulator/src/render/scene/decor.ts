import type {GameState} from "../../sim/types.js";
import type {RoomBounds} from "../../sim/room.js";
import {builtPosters} from "../../sim/editableObjects.js";
import {cosmeticAvailable} from "../../sim/premiumCosmetics.js";
import {yearFromMinutes} from "../../sim/historicalEconomy.js";
import {iso,polygon,type Projection} from "../isometric.js";
import {drawLampHalo,lampPositions} from "../lighting.js";
import {drawPremiumWallPoster,type PremiumPosterIndex} from "../premiumRoomArt.js";
import {drawWallPoster} from "../posterArt.js";

  export function drawRoomDecor(ctx:CanvasRenderingContext2D,camera:Projection,bounds:RoomBounds,s:GameState):void {
    const minX=bounds.minX,w=bounds.maxX,south=bounds.maxY,north=bounds.minY;
    // Light cones below each lamp belong to the static wall paint.
    for(const x of lampPositions(bounds))drawLampHalo(ctx,camera,x,north);
    // Frisos ao pé das paredes; ajudam a perceber o interior sem adicionar telhado.
    polygon(ctx,[
      iso({x:minX,y:north+0.02},camera,9),iso({x:w,y:north+0.02},camera,9),
      iso({x:w,y:north+0.02},camera,2),iso({x:minX,y:north+0.02},camera,2)
    ],"#967D78");
    polygon(ctx,[
      iso({x:minX,y:north+0.02},camera,10.5),iso({x:w,y:north+0.02},camera,10.5),
      iso({x:w,y:north+0.02},camera,9),iso({x:minX,y:north+0.02},camera,9)
    ],"#b8a29c");
    polygon(ctx,[
      iso({x:minX+0.02,y:north},camera,9),iso({x:minX+0.02,y:south},camera,9),
      iso({x:minX+0.02,y:south},camera,2),iso({x:minX+0.02,y:north},camera,2)
    ],"#817A84");
    polygon(ctx,[
      iso({x:minX+0.02,y:north},camera,10.5),iso({x:minX+0.02,y:south},camera,10.5),
      iso({x:minX+0.02,y:south},camera,9),iso({x:minX+0.02,y:north},camera,9)
    ],"#a39ca6");
    // Pôsteres premium usam as molduras e pontos existentes; nunca bloqueiam paredes.
    const premium=cosmeticAvailable("exclusive-arcade-posters",yearFromMinutes(s.totalMinutes));
    for(const p of builtPosters(s)){
      const placement={x:p.x,y:p.y,axis:p.axis!,span:p.span!,top:p.id.endsWith(":0")||p.id.endsWith(":1")?128:133,height:p.id.endsWith(":0")||p.id.endsWith(":1")?49:59};
      const index=Number(p.id.slice("built-poster:".length));
      if(premium&&index>=0&&index<3)drawPremiumWallPoster(ctx,camera,placement,index as PremiumPosterIndex);
      else drawWallPoster(ctx,camera,placement,p.posterKind!);
    }
    // Luminárias na parte superior da parede: iluminação contida e sem brilho glossy.
    for(const x of lampPositions(bounds)){
      const p=iso({x,y:north},camera,146),z=camera.zoom;
      ctx.fillStyle="rgba(40,36,34,.25)";ctx.fillRect(p.x-18*z,p.y+5*z,36*z,2.5*z);
      ctx.fillStyle="#7B6261";ctx.fillRect(p.x-17*z,p.y-4*z,34*z,9*z);
      ctx.fillStyle="#5c4847";ctx.fillRect(p.x-17*z,p.y-4*z,34*z,2*z);
      ctx.fillStyle="#F6E1B2";ctx.fillRect(p.x-14*z,p.y-1*z,28*z,3*z);
      ctx.fillStyle="rgba(255,255,255,.65)";ctx.fillRect(p.x-12*z,p.y-.4*z,24*z,1.2*z);
    }
  }
