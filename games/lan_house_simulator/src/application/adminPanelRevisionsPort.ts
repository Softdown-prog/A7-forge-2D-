/** Read-only signatures for administrative panels.
 * The current save is resolved on every call, including after imports.
 * DOM reconciliation and cache equality stay in the UI adapter.
 */
import type {GameState} from "../sim/types.js";
import {online} from "../sim/engine.js";

export interface AdminPanelRevisionsPort {
 feedback():ReadonlyArray<unknown>;
 packages():ReadonlyArray<unknown>;
 retail():ReadonlyArray<unknown>;
 computerWear(operationsActive:boolean):ReadonlyArray<number>|null|undefined;
 computerMaintenance(page:string|undefined,stationIndex:number,hardwareTab:string,stationRevision:ReadonlyArray<unknown>,operationsActive:boolean):ReadonlyArray<unknown>;
 gpuChoice(stationRevision:ReadonlyArray<unknown>,selectedGpuPc:number):ReadonlyArray<unknown>;
 windows(stationRevision:ReadonlyArray<unknown>):ReadonlyArray<unknown>;
 classicGames(year:number,stationRevision:ReadonlyArray<unknown>):ReadonlyArray<unknown>;
 gpuGames(year:number,stationRevision:ReadonlyArray<unknown>):ReadonlyArray<unknown>;
}

export function createAdminPanelRevisionsPort(getState:()=>GameState):AdminPanelRevisionsPort {
 return {
  feedback(){
   const s=getState();
   return [Math.floor(s.totalMinutes/720),s.customerFeedback];
  },
  packages(){
   const s=getState();
   return [s.pricePerHour,s.economyVersion===2];
  },
  retail(){return [getState().retailPrices];},
  computerWear(operationsActive){
   return operationsActive?getState().pcWear?.map(Math.round):null;
  },
  computerMaintenance(page,stationIndex,hardwareTab,stationRevision,operationsActive){
   return [page,stationIndex,hardwareTab,stationRevision,this.computerWear(operationsActive)];
  },
  gpuChoice(stationRevision,selectedGpuPc){return [stationRevision,selectedGpuPc];},
  windows(stationRevision){return [stationRevision];},
  classicGames(year,stationRevision){
   const s=getState();
   return [year,stationRevision,s.licensedGames,s.licensedEraGames,s.ericSecondMailDelivered];
  },
  gpuGames(year,stationRevision){
   const s=getState();
   return [
    year,stationRevision,s.licensedGames,s.licensedGpuGames,s.pcPoweredOff,
    s.gpuGameInstalls,s.gpuGameInstallJobs?.map(j=>[j.pc,j.id,j.durationMinutes]),
    s.gpuGameDemand,online(s)
   ];
  }
 };
}
