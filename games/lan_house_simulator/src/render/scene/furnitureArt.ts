import type {GameState} from "../../sim/types.js";
import type {FurnitureKind} from "../../sim/furnitureLayout.js";
import {furnitureSlots} from "../../sim/furnitureLayout.js";
import {roomBounds} from "../../sim/room.js";
import {roomWidth} from "../../sim/simulationState.js";
import {cosmeticAvailable} from "../../sim/premiumCosmetics.js";
import {yearFromMinutes} from "../../sim/historicalEconomy.js";
import {cuboid,iso,type Projection} from "../isometric.js";
import {drawWallPoster,purchasedPosterKind,type PosterKind} from "../posterArt.js";
import {drawPremiumWallPoster,type PremiumPosterIndex} from "../premiumRoomArt.js";
/** Shared purchased furniture, legacy decorations and posters. */
  export function drawPurchasedFurniture(ctx:CanvasRenderingContext2D,camera:Projection,kind:FurnitureKind,x:number,y:number,rotation:0|1|2|3=0,posterKind:PosterKind="city",axis:"x"|"y"="x",premiumIndex?:PremiumPosterIndex):void{
    if(kind==="poster"){
      const placement={x,y,axis,span:.65,top:156,height:39};
      if(premiumIndex!==undefined)drawPremiumWallPoster(ctx,camera,placement,premiumIndex);
      else drawWallPoster(ctx,camera,placement,posterKind);
    }else if(kind==="plant"){
      cuboid(ctx,camera,x,y,0.32,0.32,22,["#a87553","#805344","#915f4c"]);
      const center=iso({x:x+0.16,y:y+0.16},camera,42);
      ctx.fillStyle="#578d68";ctx.beginPath();
      ctx.ellipse(center.x,center.y,13*camera.zoom,15*camera.zoom,0,0,Math.PI*2);ctx.fill();
    }else if(kind==="table"){
      cuboid(ctx,camera,x,y,rotation%2===0?0.55:0.4,rotation%2===0?0.4:0.55,23,["#c49a76","#8d6754","#a07b60"]);
    }
    if(kind!=="poster"){
      const width=kind==="table"?(rotation%2===0?0.55:0.4):0.32;
      const depth=kind==="table"?(rotation%2===0?0.4:0.55):0.32;
      const direction=[[0,1],[1,0],[0,-1],[-1,0]][rotation]!;
      const marker=iso({x:x+width/2+direction[0]!*width*.43,
                        y:y+depth/2+direction[1]!*depth*.43},camera,kind==="plant"?20:19);
      ctx.fillStyle="#f5cd91";ctx.beginPath();
      ctx.ellipse(marker.x,marker.y,3.5*camera.zoom,2.5*camera.zoom,0,0,Math.PI*2);ctx.fill();
    }
  }
  export function drawExtraPosters(ctx:CanvasRenderingContext2D,camera:Projection,s:GameState):void{
    const premium=cosmeticAvailable("exclusive-arcade-posters",yearFromMinutes(s.totalMinutes));
    const positioned=(s.furniturePlacements??[]).filter(p=>p.kind==="poster");
    for(let i=0;i<Math.min(2,Math.max(0,(s.furniture?.poster??0)-positioned.length));i++){
      const x=2.1+i*2.25;
      const y=roomBounds(s).minY+0.01;
      drawPurchasedFurniture(ctx,camera,"poster",x,y,0,purchasedPosterKind(i),"x",premium?(i%3 as PremiumPosterIndex):undefined);
    }
    for(const [index,placed] of positioned.entries()){
      const slot=furnitureSlots(s).find(v=>v.id===placed.slotId&&v.surface==="wall");
      if(slot)drawPurchasedFurniture(ctx,camera,"poster",slot.x,slot.y,0,purchasedPosterKind(index),slot.axis,premium?(index%3 as PremiumPosterIndex):undefined);
    }
  }
    /* Saved placement coordinates are always resolved from vetted slots. */
  export function drawExtraFurniture(ctx:CanvasRenderingContext2D,camera:Projection,s:GameState):void{
    const positioned=s.furniturePlacements??[];
    const legacyPlants=Math.max(0,(s.furniture?.plant??0)-positioned.filter(p=>p.kind==="plant").length);
    for(let i=0;i<Math.min(2,legacyPlants);i++){
      const x=i===0?0.6:roomWidth(s)-0.8,y=i===0?5.3:3.6;
      cuboid(ctx,camera,x,y,0.32,0.32,22,["#a87553","#805344","#915f4c"]);
      const center=iso({x:x+0.16,y:y+0.16},camera,42);
      ctx.fillStyle="#578d68";ctx.beginPath();
      ctx.ellipse(center.x,center.y,13*camera.zoom,15*camera.zoom,0,0,Math.PI*2);ctx.fill();
    }
    if((s.furniture?.table??0)>positioned.filter(p=>p.kind==="table").length){
      cuboid(ctx,camera,0.75,4.12,0.55,0.4,23,["#c49a76","#8d6754","#a07b60"]);
    }
    for(const placed of positioned){
      if(placed.kind==="poster")continue;
      const slot=furnitureSlots(s).find(v=>v.id===placed.slotId&&v.surface==="floor");
      if(slot)drawPurchasedFurniture(ctx,camera,placed.kind,slot.x,slot.y,placed.rotation??0);
    }
  }
