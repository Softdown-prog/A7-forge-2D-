/** Cache only the last event-list revision; never retain game or DOM state. */
import type {EventLogSnapshot} from "../application/eventLogPort.js";
export function createEventLogRefresh(
 snapshot:()=>EventLogSnapshot,
 render:(value:EventLogSnapshot)=>void
):{refresh():boolean}{
 let lastSignature="";
 return {refresh(){
  const value=snapshot();
  if(value.signature===lastSignature)return false;
  render(value);
  lastSignature=value.signature;
  return true;
 }};
}
