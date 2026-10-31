/** A read-only revision for station and licensing panels.
 * Captures the fields used by the existing UI invalidation checks in order.
 * The active save is supplied at read time; no DOM or persistent state is owned.
 */
import type {GameState} from "../sim/types.js";
import {pcCount} from "../sim/engine.js";
import {stationOccupied} from "../sim/computerModels.js";

export interface StationRevisionPort {
 snapshot(year:number):ReadonlyArray<unknown>;
}
export function createStationRevisionPort(getState:()=>GameState):StationRevisionPort {
 return {snapshot(year){
  const s=getState();
  return [
   year,s.cash,s.economyVersion,s.pcTiers,s.pcWindows,s.pcWindowsLicenses,
   s.pcPoweredOff,s.pcGpus,s.pcLcdModels,s.pcComponents,
   s.pcLinuxInstalled,s.pcOperatingSystems,s.linuxResearchStartedDay,Math.floor(s.totalMinutes/720),
   Array.from({length:pcCount(s)},(_,i)=>stationOccupied(s,i)),
   s.repairJobs?.map(j=>[j.pc,j.phase,Math.floor(j.progress/j.duration*4)])
  ];
 }};
}
