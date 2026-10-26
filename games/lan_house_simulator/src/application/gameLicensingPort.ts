import type {GameState,Result} from "../sim/types.js";
import {pcCount} from "../sim/engine.js";
import {ERA_GAME_CATALOG,licenseEraGame} from "../sim/eraGames.js";
import {GPU_GAME_CATALOG,licenseGpuGame,toggleGpuGameInstallation,installGpuGameOnAvailablePcs,cancelGpuGameInstallation,type GpuGameId} from "../sim/gpuGames.js";
export interface GameLicensingPort {
 licenseEra(id:string):Result;licenseGpu(id:string):Result;
 toggleInstallation(index:number,id:string):Result;installAvailable(id:string):Result;cancelDownload(index:number,id:string):Result;
}
const invalid:Result={ok:false,message:"Jogo ou computador inválido."};
const knownGpu=(id:string):id is GpuGameId=>GPU_GAME_CATALOG.some(g=>g.id===id);
const validIndex=(s:GameState,i:number)=>Number.isInteger(i)&&i>=0&&i<pcCount(s);
/** The current state is resolved per command so importing a save is safe. */
export function createGameLicensingPort(getState:()=>GameState):GameLicensingPort{
 return {
  licenseEra(id){return ERA_GAME_CATALOG.some(g=>g.id===id)?licenseEraGame(getState(),id):invalid;},
  licenseGpu(id){return knownGpu(id)?licenseGpuGame(getState(),id):invalid;},
  toggleInstallation(i,id){const s=getState();return knownGpu(id)&&validIndex(s,i)?toggleGpuGameInstallation(s,i,id):invalid;},
  installAvailable(id){return knownGpu(id)?installGpuGameOnAvailablePcs(getState(),id):invalid;},
  cancelDownload(i,id){const s=getState();return knownGpu(id)&&validIndex(s,i)?cancelGpuGameInstallation(s,i,id):invalid;}
 };
}
