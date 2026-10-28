/** Read-only snapshot for the three legacy quick retail price controls. */
import type {GameState} from "../sim/types.js";
import {productPrice} from "../sim/economy.js";

export type RetailQuickItem="soda"|"candy"|"snacks";
export interface RetailQuickRow {
 readonly id:RetailQuickItem;
 readonly label:string;
 readonly priceText:string;
 readonly decreaseDisabled:boolean;
 readonly increaseDisabled:boolean;
}
export interface RetailPriceStatusPort {snapshot():ReadonlyArray<RetailQuickRow>}

const PRODUCTS:ReadonlyArray<Readonly<{id:RetailQuickItem;label:string}>>=[
 {id:"soda",label:"Refrigerante"},
 {id:"candy",label:"Doce"},
 {id:"snacks",label:"Salgadinho"}
];
export function createRetailPriceStatusPort(getState:()=>GameState):RetailPriceStatusPort {
 const money=(n:number):string=>"R$ "+n.toLocaleString("pt-BR");
 return {snapshot(){
  const game=getState();
  return PRODUCTS.map(({id,label})=>{
   const price=productPrice(game,id);
   return {
    id,label,priceText:money(price),
    decreaseDisabled:price<=1,
    increaseDisabled:price>=40
   };
  });
 }};
}
