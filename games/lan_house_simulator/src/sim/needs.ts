import type { Customer, Inventory, Item } from "./types.js";
import { ITEM_PRICES, productPrice } from "./economy.js";
import type {GameState} from "./types.js";
import {SESSION_PACKAGES} from "./historicalEconomy.js";

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
export function selectPurchase(c:Customer,inventory:Inventory,state?:GameState):Item|null{
  const n=c.needs??initialNeeds(c.id);
  const cash=c.wallet??18;
  if(!c.purchasedDrink&&n.thirst>=55&&inventory.soda>0&&cash>=(state?productPrice(state,"soda"):ITEM_PRICES.soda))return "soda";
  if(!c.purchasedFood&&n.hunger>=55){
    if(inventory.snacks>0&&cash>=(state?productPrice(state,"snacks"):ITEM_PRICES.snacks))return "snacks";
    if(inventory.candy>0&&cash>=(state?productPrice(state,"candy"):ITEM_PRICES.candy))return "candy";
  }
  return null;
}

/** Aplicar apenas após a venda real; impede compras repetidas durante o trajeto. */
export function consumePurchase(c:Customer,item:Item):void{
 const n=c.needs??(c.needs=initialNeeds(c.id));
 if(item==="soda"){c.purchasedDrink=true;n.thirst=Math.max(0,n.thirst-55);}
 else{c.purchasedFood=true;n.hunger=Math.max(0,n.hunger-(item==="snacks"?55:35));}
}

/** Escolha determinística por perfil, energia e sede. O tempo é contratado antes do pagamento. */
export function chooseSessionMinutes(c:Customer):number {
  const n=c.needs??initialNeeds(c.id);
  // Cliente cansado ou com muita sede prefere jogar menos; entusiasta pode ficar 90 min.
  if(n.energy<45||n.thirst>=72)return 30;
  if(n.energy>=87&&n.thirst<40&&c.id%17===0)return 240;
  if(n.energy>=82&&n.thirst<50&&c.id%11===0)return 180;
  if(n.energy>=78&&n.thirst<55&&c.id%7===0)return 120;
  if(n.energy>=75&&n.thirst<60&&c.id%3===0)return 90;
  if(n.energy>=65&&n.thirst<65&&c.id%2===0)return 60;
  return SESSION_PACKAGES[1];
}
