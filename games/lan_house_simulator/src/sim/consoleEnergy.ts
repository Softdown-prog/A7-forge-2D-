/** Energy in reference 2006 reais; accrued once by the monthly billing system. */
import type {GameState} from "./types.js";
import {priceIndex,yearFromMinutes} from "./historicalEconomy.js";
export function ps2EnergyCostPerMinute(s:Pick<Partial<GameState>,"ps2Stations"|"customers"|"totalMinutes">):number{
 const factor=priceIndex(yearFromMinutes(s.totalMinutes??0))/priceIndex(2006);
 return (s.ps2Stations??[]).reduce((sum,st,i)=>sum+(st.poweredOff?0:
  (s.customers??[]).some(c=>c.ps2StationIndex===i&&c.stage==="using")?.0012:.00015),0)*factor;
}
