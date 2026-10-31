/** Framework-neutral read models. No DOM and no mutation of GameState. */
import type {GameState} from "../sim/types.js";
import {online,pcCount,pcWear,pcBroken} from "../sim/engine.js";
import {computerOccupancyPercent} from "../sim/financialReview.js";
import {isPromotionActive} from "../sim/promotion.js";
import {stationModelName} from "../sim/computerModels.js";
import {installedWindows,WINDOWS_ERAS} from "../sim/era.js";
import {isLinuxPc} from "../sim/linuxQuest.js";
import {hardwareFor,buildParts,formatMemory,describePart} from "../sim/hardware.js";
import {PRODUCTS,merchandiseStock} from "../sim/merchandise.js";

export interface LiveStatusSnapshot {
 cash:number;reputation:number;internetName:string;connected:boolean;
 occupied:number;computerCount:number;customerCount:number;
 stock:Readonly<{soda:number;candy:number;snacks:number}>;
 promotionActive:boolean;occupancyPercent:number;
}
export interface ComputerOperationSnapshot {
 index:number;wear:number;broken:boolean;windows:string;model:string;
 cpu:string;ram:string;storage:string;
}
export function liveStatusSnapshot(s:GameState,internetName:string):LiveStatusSnapshot{
 const stock={soda:0,candy:0,snacks:0};
 for(const p of PRODUCTS)stock[p.category]+=merchandiseStock(s,p.id);
 return {
  cash:s.cash,reputation:s.reputation,internetName,connected:online(s),
  occupied:s.customers.filter(c=>c.stage==="using"&&c.ps1StationIndex===undefined&&c.ps2StationIndex===undefined).length,
  computerCount:pcCount(s),customerCount:s.customers.length,stock,
  promotionActive:isPromotionActive(s),
  occupancyPercent:computerOccupancyPercent(s.monthPcUsedMinutes??0,s.monthPcCapacityMinutes??0)
 };
}
export function computerOperationsSnapshot(s:GameState):ComputerOperationSnapshot[]{
 return Array.from({length:pcCount(s)},(_,i)=>{
  const parts=buildParts(hardwareFor(s,i));
  return {
   index:i,wear:pcWear(s,i),broken:pcBroken(s,i),
   windows:isLinuxPc(s,i)?"Linux":WINDOWS_ERAS.find(w=>w.id===installedWindows(s,i))!.name,
   model:stationModelName(s,i),cpu:parts.cpu.name,
   ram:formatMemory(parts.ram.ramMb!),storage:describePart(parts.storage)
  };
 });
}
