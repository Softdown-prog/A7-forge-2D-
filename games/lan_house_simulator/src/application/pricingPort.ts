/**
 * Pricing commands are the sole application-facing entry point for the
 * migrated pricing controls. The current GameState is read on every call so
 * importing a save never leaves the view connected to the previous game.
 * Domain functions remain authoritative for bounds and accounting.
 */
import type {GameState,Item,Result} from "../sim/types.js";
import {setHourlyPrice,setProductPrice,productPrice} from "../sim/economy.js";
import {setPrintPrice} from "../sim/printService.js";
import {setDiscCopyPrice,type DiscKind} from "../sim/discCopy.js";
import {setPs1HourlyPrice,ps1HourPrice} from "../sim/ps1.js";
import {clampPriceToEra} from "../sim/historicalEconomy.js";

export type PriceDirection=-1|1;
export interface PricingPort {
 changeHourly(direction:PriceDirection):Result;
 changePs1(direction:PriceDirection):Result;
 changePrinting(direction:PriceDirection):Result;
 changeDisc(kind:DiscKind,direction:PriceDirection):Result;
 changeRetail(item:Item,direction:PriceDirection):Result;
 migrateHistorical():boolean;
}
const invalid:Result={ok:false,message:"Ajuste de preço inválido."};
const valid=(direction:number)=>direction===1||direction===-1;
const cents=(value:number)=>Math.round(value*100)/100;

export function createPricingPort(getState:()=>GameState):PricingPort{
 return {
  changeHourly(direction){
   if(!valid(direction))return invalid;
   const state=getState(),step=state.economyVersion===2?.5:2;
   return setHourlyPrice(state,cents(state.pricePerHour+direction*step));
  },
  changePs1(direction){
   if(!valid(direction))return invalid;
   const state=getState();
   return setPs1HourlyPrice(state,cents(ps1HourPrice(state)+direction*.25));
  },
  changePrinting(direction){
   if(!valid(direction))return invalid;
   const state=getState();
   if(!state.printer)return {ok:false,message:"Compre uma impressora primeiro."};
   const step=state.economyVersion===2?.5:1;
   return setPrintPrice(state,cents(state.printer.price+direction*step));
  },
  changeDisc(kind,direction){
   if(!valid(direction)||!(kind==="cd"||kind==="dvd"))return invalid;
   const state=getState();
   if(!state.discCopier)return {ok:false,message:"Compre a copiadora primeiro."};
   return setDiscCopyPrice(state,kind,state.discCopier.prices[kind]+direction);
  },
  changeRetail(item,direction){
   if(!valid(direction)||!(item==="soda"||item==="candy"||item==="snacks"))return invalid;
   const state=getState();
   return setProductPrice(state,item,productPrice(state,item)+direction);
  },
  migrateHistorical(){
   const state=getState();
   if(state.economyVersion===2)return false;
   state.economyVersion=2;
   if(state.retailPrices?.soda===8&&state.retailPrices.candy===5&&state.retailPrices.snacks===9)
    delete state.retailPrices;
   clampPriceToEra(state);
   return true;
  }
 };
}
