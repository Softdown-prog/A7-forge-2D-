import type {Customer,GameState} from "./types.js";
import {DAY_MINUTES} from "./types.js";
/** Perfil determinístico, independente do RNG de movimento e dos frames do renderer. */
export function isVip(customer:Pick<Customer,"vip">):boolean{return customer.vip===true;}
export function vipArrivalEligible(s:Pick<GameState,"reputation"|"totalMinutes">,visitorId:number):boolean{
 const rep=Math.max(0,Math.min(100,s.reputation));
 if(rep<55)return false;
 const day=Math.floor(Math.max(0,s.totalMinutes)/DAY_MINUTES);
 const chance=rep>=85?19:rep>=70?12:7;
 const seed=(Math.imul(visitorId,1103515245)+Math.imul(day+1,12345))>>>0;
 return (seed%100)<chance;
}
/** Clientes exigentes valorizam bom hardware/rede, mas penalizam esperas longas. */
export function vipReputationAdjustment(c:Pick<Customer,"vip"|"waitingMinutes"|"offlineWait">,hardwareBonus:number):number{
 if(!isVip(c))return 0;
 return Math.max(-.20,Math.min(.12,.045+Math.min(.075,hardwareBonus*.40)-Math.max(0,c.waitingMinutes-6)*.008-c.offlineWait*.009));
}
