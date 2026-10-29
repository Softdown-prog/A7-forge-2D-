/** Read-only purchase quotes for the two counter services, from the active save. */
import type {GameState} from "../sim/types.js";
import {gameYear} from "../sim/era.js";
import {quotePrinter} from "../sim/printService.js";
import {quoteDiscCopier,DISC_COPIER_YEAR} from "../sim/discCopy.js";
import {shopPrice} from "../sim/shop.js";
export type ShopServiceOfferId="printer"|"disc-copier";
export interface ShopServiceOffer{
 readonly disabled:boolean;
 readonly title:string;
 readonly text:string;
}
export interface ShopServiceOffersPort{snapshot(id:ShopServiceOfferId):ShopServiceOffer}
export function createShopServiceOffersPort(getState:()=>GameState):ShopServiceOffersPort{
 return {snapshot(id){
  const s=getState(),price=shopPrice(s,id);
  const quote=id==="printer"?quotePrinter(s):quoteDiscCopier(s);
  const text=id==="printer"?
   s.printer?"Adquirida · serviço ativo":s.cash<price?"Caixa insuficiente · R$ "+price:"Comprar · R$ "+price:
   s.discCopier?"Adquirida · serviço ativo":gameYear(s)<DISC_COPIER_YEAR?"🔒 Disponível em 2001":
   s.cash<price?"Caixa insuficiente · R$ "+price:"Comprar · R$ "+price;
  return {disabled:!quote.ok,title:quote.message,text};
 }};
}
