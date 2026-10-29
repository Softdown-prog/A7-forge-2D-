/** Current shop header data from the active save, without DOM or write access. */
import type {GameState} from "../sim/types.js";
import {roomBounds} from "../sim/room.js";
import {wallZoneCount} from "../sim/walls.js";
import {pcCount} from "../sim/engine.js";

export interface ShopOverviewSnapshot {
 readonly organizeText:string;
 readonly demolishText:string;
 readonly demolishDisabled:boolean;
 readonly cashText:string;
}
export interface ShopOverviewPort {
 snapshot():ShopOverviewSnapshot;
}
export function createShopOverviewPort(
 getState:()=>GameState,
 getObjectCount:()=>number,
 getAnnexSlotCount:()=>number
):ShopOverviewPort {
 return {snapshot(){
  const game=getState();
  const objectCount=getObjectCount();
  const partitionCount=(game.interiorWalls?.length??0)+(game.interiorDoors?.length??0);
  const b=roomBounds(game),e=game.roomExtensions??{west:0,east:0,south:0};
  const cashText="Caixa R$ "+game.cash+" · PCs "+pcCount(game)+"/"+
   (3+game.expansionLevel*2+getAnnexSlotCount())+
   " · Tamanho do salão "+(b.maxX-b.minX)+"×"+(b.maxY-b.minY)+
   " · Ampliações: esquerda "+e.west+"/5 · direita "+e.east+"/5 · fundos "+(e.north??0)+"/5 · Salas "+wallZoneCount(game);
  return {
   organizeText:"Organizar salão: "+objectCount+" objetos",
   demolishText:"Remover paredes e portas ("+partitionCount+")",
   demolishDisabled:!partitionCount,
   cashText
  };
 }};
}
