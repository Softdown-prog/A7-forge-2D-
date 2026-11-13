/** Shared story pricing and effects. No notice scheduling, UI or Canvas dependencies. */
import type {GameState,Item} from "../types.js";
import {DAY_MINUTES} from "../types.js";
import {isHistorical,priceIndex,yearFromMinutes} from "../historicalEconomy.js";
import type {StoryImpact} from "./types.js";

const DAY=(s:GameState)=>Math.floor(s.totalMinutes/DAY_MINUTES)+1;
export const storyCost=(s:GameState,base:number)=>isHistorical(s)?Math.round(base/10*priceIndex(yearFromMinutes(s.totalMinutes))*100)/100:base;

export function applyStoryImpact(s:GameState,id:string,impact:StoryImpact|undefined):void{
 if(!impact)return;
 if(impact.reputation)s.reputation=Math.max(10,Math.min(100,s.reputation+impact.reputation));
 if(impact.wear){
  const count=Math.max(3,Math.min(3+s.expansionLevel*2,s.installedPcs??3+s.expansionLevel*2))+(s.annexPcs?.length??0);
  s.pcWear=Array.from({length:count},(_,i)=>Math.max(0,Math.min(100,(s.pcWear?.[i]??0)+impact.wear!)));
 }
 if(impact.stock)for(const item of ["soda","candy","snacks"] as Item[]){
  const change=impact.stock[item]??0;
  s.inventory[item]=Math.max(0,s.inventory[item]+change);
 }
 if(impact.offlineMinutes)s.offlineUntil=Math.max(s.offlineUntil,s.totalMinutes+impact.offlineMinutes);
 if(impact.energyBill)s.energyAccrued=(s.energyAccrued??0)+storyCost(s,impact.energyBill);
 if(impact.visitors&&impact.visitorDays){
  // Efeito econômico concreto, expirável e serializável; não altera RNG.
  const effects=s.storyVisitorEffects??(s.storyVisitorEffects=[]);
  const untilDay=DAY(s)+impact.visitorDays;
  const existing=effects.findIndex(effect=>effect.id===id);
  if(existing>=0)effects.splice(existing,1);
  effects.push({id,factor:impact.visitors,untilDay});
  if(effects.length>32)effects.splice(0,effects.length-32);
 }
}
export function storyVisitorMultiplier(s:GameState):number {
 const day=DAY(s);
 const active=(s.storyVisitorEffects??[]).filter(e=>e.untilDay>=day);
 return Math.max(.55,Math.min(1.4,active.reduce((factor,e)=>factor*e.factor,1)));
}
