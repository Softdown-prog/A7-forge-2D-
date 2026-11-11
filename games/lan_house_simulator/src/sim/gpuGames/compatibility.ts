import type {GameState} from "../types.js";
import {GPU_CATALOG,installedGpu} from "../gpu.js";
import {WINDOWS_ERAS,installedWindows} from "../eraCatalog.js";
import {isLinuxPc} from "../linuxQuest.js";
import {isHistorical,yearFromMinutes} from "../historicalEconomy.js";
import {stationPowerCount} from "../stationPower.js";
import {GPU_GAME_CATALOG,gpuGameSpec,type GpuGameId,type GpuGameSpec} from "./catalog.js";

/** Saved installations, station hardware and executable game entitlement. */
/** Jogos implicitamente instalados em saves antigos até a primeira edição. */
export function gpuGameInstalledOnPc(s:GameState,index:number,id:GpuGameId):boolean{
 if(!Number.isInteger(index)||index<0||index>=stationPowerCount(s)||!s.licensedGpuGames?.includes(id))return false;
 return s.gpuGameInstalls===undefined?true:s.gpuGameInstalls[index]?.includes(id)===true;
}
export function validGpuGameInstalls(value:unknown,s:Partial<GameState>):boolean{
 if(value===undefined)return true;
 if(!isHistorical(s as GameState)||!Array.isArray(value)||value.length>stationPowerCount(s as GameState))return false;
 return value.every(row=>Array.isArray(row)&&row.length<=GPU_GAME_CATALOG.length&&
  new Set(row).size===row.length&&row.every(id=>typeof id==="string"&&
   s.licensedGpuGames?.some(owned=>owned===id)&&!!gpuGameSpec(id)));
}

/** Licença Windows paga e hardware compatível na estação especificada. */
export function gpuGameCompatible(s:GameState,index:number,game:GpuGameSpec):boolean{
 const count=Math.max(3,Math.min(3+s.expansionLevel*2,s.installedPcs??(3+s.expansionLevel*2)))+(s.annexPcs?.length??0);
 if(index<0||!Number.isInteger(index)||index>=count)return false;
 if(isLinuxPc(s,index)||s.pcWindowsLicenses?.[index]!==true)return false;
 const gpu=installedGpu(s,index);
 const current=GPU_CATALOG.findIndex(x=>x.id===gpu);
 const required=GPU_CATALOG.findIndex(x=>x.id===game.minGpu);
 const os=WINDOWS_ERAS.findIndex(x=>x.id===installedWindows(s,index));
 const requiredOs=WINDOWS_ERAS.findIndex(x=>x.id===game.minWindows);
 return current>=required&&required>=0&&os>=requiredOs&&requiredOs>=0;
}
export function gpuGameEligiblePcs(s:GameState,game:GpuGameSpec):number[]{
 const original=Math.max(3,Math.min(3+s.expansionLevel*2,s.installedPcs??(3+s.expansionLevel*2)));
 const count=original+(s.annexPcs?.length??0);
 return Array.from({length:count},(_,i)=>i).filter(i=>gpuGameCompatible(s,i,game));
}
/** Somente uma licença paga E ao menos um PC realmente compatível representam
 * oferta comercial de jogos avançados. Planejar divulgação não cria capacidade. */
export function hasPlayableGpuGame(s:GameState):boolean{
 if(!isHistorical(s)||!s.licensedGames)return false;
 const year=yearFromMinutes(s.totalMinutes);
 return (s.licensedGpuGames??[]).some(id=>{
  const game=gpuGameSpec(id);
  return !!game&&game.year<=year&&gpuGameEligiblePcs(s,game).some(i=>gpuGamePlayableOnPc(s,i,id));
 });
}

/** Licença do estabelecimento, ano do lançamento e requisitos por estação.
 * Compatibilidade nunca depende da tarifa ou de haver bônus econômico. */
export function gpuGamePlayableOnPc(s:GameState,index:number,id:GpuGameId):boolean{
 const spec=gpuGameSpec(id);
 return !!spec&&isHistorical(s)&&!!s.licensedGames&&
  spec.year<=yearFromMinutes(s.totalMinutes)&&
  !!s.licensedGpuGames?.includes(id)&&gpuGameCompatible(s,index,spec)&&gpuGameInstalledOnPc(s,index,id);
}
