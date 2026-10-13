import type { Customer, Inventory, Item } from "./types.js";
import { ITEM_PRICES } from "./economy.js";

/** Necessidades 0..100. Cada minuto do jogo atualiza uma vez; sem decisões por frame. */
export function initialNeeds(id:number):NonNullable<Customer["needs"]>{
  return {thirst:25+(id*17)%38,hunger:18+(id*23)%43,energy:58+(id*11)%38};
}
export function tickNeeds(c:Customer):void{
  const n=c.needs??(c.needs=initialNeeds(c.id));
  n.thirst=Math.min(100,n.thirst+0.34);
  n.hunger=Math.min(100,n.hunger+0.20);
  n.energy=Math.max(0,n.energy-(c.stage==="using"?0.26:0.10));
}
/** Só decidir compras depois do PC; a reserva da cadeira não é interrompida. */
export function selectPurchase(c:Customer,inventory:Inventory):Item|null{
  const n=c.needs??initialNeeds(c.id);
  const cash=c.wallet??18;
  if(n.thirst>=55&&inventory.soda>0&&cash>=ITEM_PRICES.soda)return "soda";
  if(n.hunger>=55){
    if(inventory.snacks>0&&cash>=ITEM_PRICES.snacks)return "snacks";
    if(inventory.candy>0&&cash>=ITEM_PRICES.candy)return "candy";
  }
  return null;
}
