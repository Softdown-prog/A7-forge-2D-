import type {Customer,GameState,Result} from "./types.js";
import {DAY_MINUTES} from "./types.js";
import {yearFromMinutes,priceIndex} from "./historicalEconomy.js";

export type DiscKind="cd"|"dvd";
export interface DiscCopier {
 prices:Record<DiscKind,number>;
 cdCopies:number;dvdCopies:number;revenue:number;expenses:number;
 day:number;dayCopies:number;
 /** Atendimentos exclusivos de cópia, separados das sessões de computadores. */
 walkIns?:number;
}
export const DISC_COPIER_YEAR=2001;
export const DISC_COPIER_COST=900;
export const DISC_COPIES_PER_DAY=24;
export const MAX_DISC_PRICE=80;
const day=(s:GameState)=>Math.floor(s.totalMinutes/DAY_MINUTES)+1;
const round=(n:number)=>Math.round(n*100)/100;
const index=(s:GameState)=>s.economyVersion===2?priceIndex(yearFromMinutes(s.totalMinutes))/priceIndex(DISC_COPIER_YEAR):1;
/** Parâmetros de design; não são preços históricos tabelados. */
export function discMediaCost(s:GameState,kind:DiscKind):number{
 return Math.max(1,Math.round((kind==="cd"?1:2)*index(s)));
}
export function discReferencePrice(s:GameState,kind:DiscKind):number{
 return Math.max(1,Math.round((kind==="cd"?3:6)*index(s)));
}
export function quoteDiscCopier(s:GameState):Result{
 if(yearFromMinutes(s.totalMinutes)<DISC_COPIER_YEAR)return {ok:false,message:"Disponível a partir de 2001."};
 if(s.discCopier)return {ok:false,message:"Copiadora adquirida. Ajuste os preços em Administração → Preços."};
 if(s.cash<DISC_COPIER_COST)return {ok:false,message:"Caixa insuficiente para a copiadora."};
 return {ok:true,message:"Ativa cópias de CD e DVD no balcão, sem ocupar espaço no salão."};
}
export function buyDiscCopier(s:GameState):Result{
 const quote=quoteDiscCopier(s);if(!quote.ok)return quote;
 s.cash-=DISC_COPIER_COST;s.expenses+=DISC_COPIER_COST;
 s.discCopier={prices:{cd:discReferencePrice(s,"cd"),dvd:discReferencePrice(s,"dvd")},
  cdCopies:0,dvdCopies:0,revenue:0,expenses:0,day:day(s),dayCopies:0};
 return {ok:true,message:"Copiadora adquirida! Cópias de CD e DVD disponíveis no balcão. Ajuste os preços em Administração → Preços."};
}
export function setDiscCopyPrice(s:GameState,kind:DiscKind,price:number):Result{
 if(!s.discCopier)return {ok:false,message:"Compre a copiadora primeiro."};
 if(kind!=="cd"&&kind!=="dvd")return {ok:false,message:"Tipo de cópia inválido."};
 if(!Number.isInteger(price)||price<1||price>MAX_DISC_PRICE)return {ok:false,message:"Escolha um preço entre R$ 1 e R$ 80, em reais inteiros."};
 s.discCopier.prices[kind]=price;
 return {ok:true,message:"Cópia de "+kind.toUpperCase()+": R$ "+price+" por unidade."};
}
export function discCopiesToday(s:GameState):number{
 return s.discCopier?.day===day(s)?s.discCopier.dayCopies:0;
}
/** Mesma escolha de CD/DVD do pedido real, disponível antes de criar o visitante. */
export function discWalkInKind(id:number):DiscKind{
 const profile=(Math.imul(id,1664525)+1013904223)>>>0;
 return ((profile>>>8)%100)<55?"cd":"dvd";
}
/** Procura de cópias avulsas: sem RNG global, sensível ao preço e sem renda passiva. */
export function discWalkInDemand(s:GameState):number{
 const copier=s.discCopier;
 if(!copier||yearFromMinutes(s.totalMinutes)<DISC_COPIER_YEAR||discCopiesToday(s)>=DISC_COPIES_PER_DAY)return 0;
 const priceRatio=(["cd","dvd"] as const).reduce((sum,k)=>
  sum+Math.min(1,discReferencePrice(s,k)/copier.prices[k]),0)/2;
 return .0065*priceRatio*(.7+Math.max(0,Math.min(s.reputation,100))/300);
}
/** A entrada é determinada por minuto e semente salva, independentemente de visitas de PC. */
export function discWalkInDue(s:GameState):boolean{
 if(s.totalMinutes%DAY_MINUTES>=DAY_MINUTES-90)return false;
 const chance=discWalkInDemand(s);
 if(chance<=0)return false;
 let hash=(s.totalMinutes^(s.mailScheduleSeed??0)^0x27d4eb2f)>>>0;
 hash=Math.imul(hash^(hash>>>16),0x85ebca6b)>>>0;
 hash=Math.imul(hash^(hash>>>13),0xc2b2ae35)>>>0;
 hash^=hash>>>16;
 return (hash>>>0)/0x100000000<chance;
}
/** Perfil determinístico, independente do RNG dos clientes; cerca de 20% procuram cópias
 * ao preço de referência. Cobrar mais reduz a procura e a carteira limita a quantidade. */
export function serveDiscCopy(s:GameState,c:Customer):{kind:DiscKind;quantity:number;revenue:number;cost:number}|null{
 const walkIn=c.serviceRequest==="disc-copy";
 if(!s.discCopier||yearFromMinutes(s.totalMinutes)<DISC_COPIER_YEAR||
    c.discCopyChecked||!(c.stage==="to_pc"||(walkIn&&c.stage==="waiting")))return null;
 c.discCopyChecked=true;
 const copier=s.discCopier;
 if(copier.day!==day(s)){copier.day=day(s);copier.dayCopies=0;}
 const profile=(Math.imul(c.id,1664525)+1013904223)>>>0;
 const kind=discWalkInKind(c.id);
 const price=copier.prices[kind],cost=discMediaCost(s,kind);
 const demand=.2*Math.min(1,discReferencePrice(s,kind)/price);
 if(!walkIn&&(profile%1000)/1000>=demand)return null;
 const requested=1+(profile>>>16)%3;
 const quantity=Math.min(requested,DISC_COPIES_PER_DAY-copier.dayCopies,Math.floor((c.wallet??18)/price));
 if(quantity<1||s.cash+price*quantity<cost*quantity)return null;
 const revenue=price*quantity,expense=cost*quantity;
 c.wallet=round((c.wallet??18)-revenue);
 s.cash=round(s.cash+revenue-expense);s.revenue=round(s.revenue+revenue);s.expenses=round(s.expenses+expense);
 copier[kind==="cd"?"cdCopies":"dvdCopies"]+=quantity;
 copier.revenue=round(copier.revenue+revenue);copier.expenses=round(copier.expenses+expense);copier.dayCopies+=quantity;
 if(walkIn)copier.walkIns=(copier.walkIns??0)+1;
 return {kind,quantity,revenue,cost:expense};
}
export function validDiscCopier(s:Partial<GameState>):boolean{
 const v=s.discCopier;if(v===undefined)return true;
 if(!v||typeof v!=="object"||Array.isArray(v)||yearFromMinutes(s.totalMinutes??0)<DISC_COPIER_YEAR)return false;
 const prices=v.prices;if(!prices||typeof prices!=="object"||Array.isArray(prices))return false;
 return [prices.cd,prices.dvd].every(n=>Number.isInteger(n)&&n>=1&&n<=MAX_DISC_PRICE)&&
  [v.cdCopies,v.dvdCopies].every(n=>Number.isSafeInteger(n)&&n>=0&&n<=1e9)&&
  [v.revenue,v.expenses].every(n=>Number.isFinite(n)&&n>=0&&n<=1e12&&Math.abs(n*100-Math.round(n*100))<1e-6)&&
  Number.isInteger(v.day)&&v.day>=1&&v.day<=Math.floor((s.totalMinutes??0)/DAY_MINUTES)+1&&
  Number.isInteger(v.dayCopies)&&v.dayCopies>=0&&v.dayCopies<=DISC_COPIES_PER_DAY&&v.dayCopies<=v.cdCopies+v.dvdCopies&&
  (v.walkIns===undefined||(Number.isSafeInteger(v.walkIns)&&v.walkIns>=0&&v.walkIns<=v.cdCopies+v.dvdCopies));
}
