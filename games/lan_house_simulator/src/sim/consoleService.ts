/** One checkout/route selection flow for both generations; inventory stays separate. */
import type {Customer,GameState,Point} from "./types.js";
import {ps1OpenSeat,ps1SessionPrice,ps1HourPrice} from "./ps1.js";
import {ps2OpenSeat,ps2SessionPrice,ps2HourPrice} from "./ps2.js";
import {consoleSeat,consoleApproach,consoleStations,type ConsoleGeneration} from "./consoleLayout.js";
import {sessionPlan,shouldConsiderConsole} from "./customerChoices.js";
import {navigableRoute,canTraverseLocalStep} from "./navigation.js";
export interface ConsoleSessionOffer{
 generation:ConsoleGeneration;index:number;number:0|1;seat:Point;side:Point;
 minutes:number;paid:number;hourly:number;
}
export function chooseConsoleSession(s:GameState,c:Customer,wanted:number,remaining:number,pc:number|undefined):ConsoleSessionOffer|null{
 if(c.multiplayerVisitId!==undefined||!shouldConsiderConsole(c,pc))return null;
 // Stable taste: some gamers still prefer the PS1. Economy visitors compare rates.
 const generations:ConsoleGeneration[]=c.preference==="economy"
  ?(ps1HourPrice(s)<=ps2HourPrice(s)?["ps1","ps2"]:["ps2","ps1"])
  :c.id%3===0?["ps1","ps2"]:["ps2","ps1"];
 for(const g of generations)for(let index=0;index<consoleStations(s,g).length;index++){
  const number=g==="ps1"?ps1OpenSeat(s,index):ps2OpenSeat(s,index);
  if(number===null)continue;
  const side=consoleApproach(s,g,index,number),seat=consoleSeat(s,g,index,number);
  if(!side||!seat||!navigableRoute(s,c,side)||
    !(canTraverseLocalStep(s,side,seat)||navigableRoute(s,side,seat)))continue;
  const quote=(m:number)=>g==="ps1"?ps1SessionPrice(s,m):ps2SessionPrice(s,m);
  const minutes=sessionPlan(c,wanted,remaining,quote);if(minutes===null)continue;
  return {generation:g,index,number,side,seat,minutes,paid:quote(minutes),hourly:g==="ps1"?ps1HourPrice(s):ps2HourPrice(s)};
 }
 return null;
}
