/** Read-only station accounting for Finance > por computador. */
import type {GameState} from "../sim/types.js";
import {pcCount} from "../sim/engine.js";
import {stationAccountingSummary} from "../sim/stationAccounting.js";

export interface StationLedgerRow {
 label:string;
 sessions:number;
 vipSessions:number;
 occupiedMinutes:number;
 sessionRevenue:number;
 energyShare:number;
 netRevenue:number;
}
export interface StationLedgerPort {
 rows():ReadonlyArray<StationLedgerRow>;
}
export function createStationLedgerPort(getState:()=>GameState):StationLedgerPort {
 return {rows(){
  const state=getState();
  return Array.from({length:pcCount(state)},(_,index)=>{
   const account=stationAccountingSummary(state,index);
   return {
    label:"PC "+(index+1),
    sessions:account.sessions,
    vipSessions:account.vipSessions,
    occupiedMinutes:account.occupiedMinutes,
    sessionRevenue:account.sessionRevenue,
    energyShare:account.energyShare,
    netRevenue:account.sessionRevenue-account.energyShare
   };
  });
 }};
}
