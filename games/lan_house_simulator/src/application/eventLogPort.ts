/** Read-only projection of recent events; never changes the active save. */
import type {GameState} from "../sim/types.js";
export type EventLogIcon="coins"|"network"|"computer"|"mail";
export interface EventLogRow{
 readonly icon:EventLogIcon;
 readonly time:string|null;
 readonly text:string;
}
export interface EventLogSnapshot{
 readonly signature:string;
 readonly rows:ReadonlyArray<EventLogRow>;
}
export interface EventLogPort{snapshot():EventLogSnapshot;}
export function createEventLogPort(getState:()=>GameState):EventLogPort{
 return {snapshot(){
  const recent=getState().eventLog.slice(0,6);
  return {signature:JSON.stringify(recent),rows:recent.map(record=>{
   const match=record.match(/^(D\d+ [\d:]+) · (.*)$/);
   const icon:EventLogIcon=/pagou|Venda/.test(record)?"coins":
    /internet/i.test(record)?"network":/PC|computador/i.test(record)?"computer":"mail";
   return {icon,time:match?match[1]!:null,text:match?match[2]!:record};
  })};
 }};
}
