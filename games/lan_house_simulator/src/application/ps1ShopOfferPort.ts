/** Read-only purchase offer for the PS1 bench, always using the active save. */
import type {GameState} from "../sim/types.js";
import {gameYear} from "../sim/era.js";
import {PS1_UNLOCK_YEAR,PS1_MAX_STATIONS,ps1PlacementSlots} from "../sim/ps1.js";
import {shopPrice} from "../sim/shop.js";

export interface Ps1ShopOffer {
 readonly disabled:boolean;
 readonly text:string;
}
export interface Ps1ShopOfferPort {
 snapshot():Ps1ShopOffer;
}
export function createPs1ShopOfferPort(getState:()=>GameState):Ps1ShopOfferPort {
 return {snapshot(){
  const s=getState();
  const price=shopPrice(s,"ps1");
  const locked=s.economyVersion!==2||gameYear(s)<PS1_UNLOCK_YEAR;
  const full=(s.ps1Stations?.length??0)>=PS1_MAX_STATIONS||!ps1PlacementSlots(s).length;
  const poor=s.cash<price;
  return {
   disabled:locked||full||poor,
   text:locked?"🔒 Disponível em 2002":full?"Sem espaço livre":
    poor?"Caixa insuficiente · R$ "+price:"Comprar conjunto · R$ "+price
  };
 }};
}
