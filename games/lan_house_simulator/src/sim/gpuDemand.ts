import type {GameState} from "./types.js";
import {GPU_GAME_CATALOG,gpuGameSpec,type GpuGameId} from "./gpuGames.js";
export interface GpuGameDemandRow {
 requested:number;played:number;basic:number;premiumCents:number;
}
export type GpuGameDemand=Partial<Record<GpuGameId,GpuGameDemandRow>>;
const MAX_COUNT=10_000_000,MAX_CENTS=1_000_000_000_000;
const empty=():GpuGameDemandRow=>({requested:0,played:0,basic:0,premiumCents:0});
export function validGpuGameDemand(value:unknown):boolean{
 if(value===undefined)return true;
 if(!value||typeof value!=="object"||Array.isArray(value))return false;
 const record=value as Record<string,unknown>;
 const ids=Object.keys(record);
 if(ids.length>GPU_GAME_CATALOG.length)return false;
 const valid=(n:unknown,max:number)=>typeof n==="number"&&Number.isSafeInteger(n)&&n>=0&&n<=max;
 return ids.every(id=>{
  if(!gpuGameSpec(id))return false;
  const data=record[id];
  if(!data||typeof data!=="object"||Array.isArray(data))return false;
  const row=data as Record<string,unknown>;
  if(Object.keys(row).some(k=>!["requested","played","basic","premiumCents"].includes(k)))return false;
  return valid(row.requested,MAX_COUNT)&&valid(row.played,MAX_COUNT)&&
   valid(row.basic,MAX_COUNT)&&valid(row.premiumCents,MAX_CENTS)&&
   (row.played as number)+(row.basic as number)<=(row.requested as number);
 });
}
export function recordGpuGameRequest(s:GameState,id:GpuGameId):void{
 const all=s.gpuGameDemand??(s.gpuGameDemand={});
 const row=all[id]??(all[id]=empty());
 row.requested=Math.min(MAX_COUNT,row.requested+1);
}
export function recordGpuGameSession(s:GameState,id:GpuGameId,played:boolean,extraReais:number):void{
 const all=s.gpuGameDemand??(s.gpuGameDemand={});
 const row=all[id]??(all[id]=empty());
 // Cliente importado já na fila pode não ter contador de chegada.
 row.requested=Math.max(row.requested,Math.min(MAX_COUNT,row.played+row.basic+1));
 if(played)row.played=Math.min(MAX_COUNT,row.played+1);
 else row.basic=Math.min(MAX_COUNT,row.basic+1);
 row.premiumCents=Math.min(MAX_CENTS,row.premiumCents+
  (played?Math.max(0,Math.round(extraReais*100)):0));
}
export function gpuDemandReport(s:GameState){
 return GPU_GAME_CATALOG.map(game=>{
  const row=s.gpuGameDemand?.[game.id]??empty();
  return {id:game.id,name:game.name,requested:row.requested,
   played:row.played,basic:row.basic,
   withoutSession:Math.max(0,row.requested-row.played-row.basic),
   premiumRevenue:row.premiumCents/100};
 });
}
