import type {Customer,GameState,Item,Result} from './types.js';
import {DAY_MINUTES} from './types.js';
import {isHistorical,priceIndex,yearFromMinutes} from './historicalEconomy.js';
import {GAME_LAST_MINUTE} from './mailCalendar.js';

/** Category IDs remain the equipment/queue IDs and the three legacy stock keys. */
export const PRODUCTS = [
 {id:'soda',name:'Refrigerante da casa',category:'soda',year:1998,price:1.5,packCost:7,pack:10,color:'#bf6560',relief:55},
 {id:'candy',name:'Balas sortidas',category:'candy',year:1998,price:1,packCost:7,pack:14,color:'#d7af74',relief:35},
 {id:'snacks',name:'Salgadinho crocante',category:'snacks',year:1998,price:2,packCost:12,pack:12,color:'#d1a34c',relief:55},
 {id:'water',name:'Água mineral',category:'soda',year:1998,price:1,packCost:5.4,pack:12,color:'#79b9d5',relief:65},
 {id:'gum',name:'Chiclete de frutas',category:'candy',year:1998,price:.5,packCost:4.8,pack:24,color:'#ac8291',relief:18},
 {id:'pacoca',name:'Paçoca de amendoim',category:'candy',year:1998,price:.75,packCost:7.2,pack:24,color:'#bd9558',relief:35},
 {id:'cookies',name:'Biscoito recheado',category:'snacks',year:1998,price:1.75,packCost:10.8,pack:12,color:'#719aaf',relief:50},
 {id:'chocolate',name:'Chocolate ao leite',category:'candy',year:1998,price:1.5,packCost:9.6,pack:12,color:'#825c54',relief:40},
 {id:'juice',name:'Suco de caixinha',category:'soda',year:2001,price:1.5,packCost:9.6,pack:12,color:'#e3a747',relief:55},
 {id:'energy',name:'Bebida energética',category:'soda',year:2005,price:3,packCost:21.6,pack:12,color:'#8ca566',relief:45},
 {id:'zero',name:'Refrigerante zero',category:'soda',year:2010,price:1.75,packCost:10.2,pack:12,color:'#8c8d9b',relief:55},
 {id:'wholegrain',name:'Biscoito integral',category:'snacks',year:2020,price:2.25,packCost:15.6,pack:12,color:'#81a98b',relief:60}
] as const;
export type ProductId=typeof PRODUCTS[number]['id'];
export type SupplierId='basic'|'economy'|'quality'|'partner';
export const SUPPLIERS=[
 {id:'basic',name:'Básico',factor:1,quality:1,minPacks:1,delay:0,description:'Retirada imediata, sem contrato.'},
 {id:'economy',name:'Econômico',factor:.9,quality:.92,minPacks:3,delay:DAY_MINUTES,description:'10% menos; mínimo 3 lotes; entrega após 1 dia de jogo. Qualidade simples.'},
 {id:'quality',name:'Selecionado',factor:1.2,quality:1.2,minPacks:1,delay:0,description:'20% mais caro; maior satisfação e tolerância ao preço. Retirada imediata.'},
 {id:'partner',name:'Parceiro',factor:.8,quality:1,minPacks:1,delay:0,description:'20% menos; adesão única de R$ 180; retirada imediata.'}
] as const;
export interface ProductAccount {stock:number;price?:number;averageCost:number;quality:number;sold:number;revenue:number;costOfSales:number}
export interface RetailOrder {id:number;product:ProductId;supplier:SupplierId;quantity:number;cost:number;quality:number;dueMinute:number}
export interface MerchandiseState {products:Partial<Record<ProductId,ProductAccount>>;orders:RetailOrder[];nextOrderId:number}
const lookup=new Map<string,typeof PRODUCTS[number]>(PRODUCTS.map(p=>[p.id,p]));
export const productSpec=(id:string)=>lookup.get(id);
const cents=(n:number)=>Math.round(n*100)/100;
const legacy=(id:ProductId):id is Item=>id==='soda'||id==='candy'||id==='snacks';
export const CLASSIC_PRICES:Record<Item,number>={soda:8,candy:5,snacks:9};
export const CLASSIC_WHOLESALE:Record<Item,number>={soda:40,candy:28,snacks:48};
export function referencePrice(s:GameState,id:ProductId):number{
 const p=productSpec(id)!;
 return isHistorical(s)?cents(p.price*priceIndex(yearFromMinutes(s.totalMinutes))):legacy(id)?CLASSIC_PRICES[id]:Math.max(1,Math.round(p.price*5));
}
export function merchandisePrice(s:GameState,id:ProductId):number{
 const value=legacy(id)?s.retailPrices?.[id]:s.merchandise?.products[id]?.price;
 return Number.isFinite(value)&&value!>=.25&&value!<=100?value!:referencePrice(s,id);
}
export function merchandiseStock(s:GameState,id:ProductId):number{return legacy(id)?s.inventory[id]:s.merchandise?.products[id]?.stock??0;}
export function basePackCost(s:GameState,id:ProductId):number{
 const p=productSpec(id)!;
 return isHistorical(s)?cents(p.packCost*priceIndex(yearFromMinutes(s.totalMinutes))):legacy(id)?CLASSIC_WHOLESALE[id]:Math.round(p.packCost*5);
}
export function quoteOrder(s:GameState,id:ProductId,supplier:SupplierId,packs=1):number{
 const supplierSpec=SUPPLIERS.find(p=>p.id===supplier)!;
 const perPack=isHistorical(s)?cents(basePackCost(s,id)*supplierSpec.factor):Math.round(basePackCost(s,id)*supplierSpec.factor);
 return cents(perPack*packs);
}
export const availableProducts=(s:GameState)=>PRODUCTS.filter(p=>p.year<=yearFromMinutes(s.totalMinutes));
function store(s:GameState):MerchandiseState{return s.merchandise??={products:{},orders:[],nextOrderId:1};}
export function averageProductCost(s:GameState,id:ProductId):number{
 return s.merchandise?.products[id]?.averageCost??basePackCost(s,id)/productSpec(id)!.pack;
}
export const productQuality=(s:GameState,id:ProductId)=>s.merchandise?.products[id]?.quality??1;
function account(s:GameState,id:ProductId):ProductAccount{
 return store(s).products[id]??={stock:0,averageCost:averageProductCost(s,id),quality:1,sold:0,revenue:0,costOfSales:0};
}
/** Entry point for existing paid supplier events. Only stock valuation changes here. */
export function receivePaidMerchandise(s:GameState,id:ProductId,amount:number,cost:number,quality=1):void{
 const old=merchandiseStock(s,id),a=account(s,id),quantity=old+amount;
 a.averageCost=(a.averageCost*old+cost)/quantity;
 a.quality=Math.max(.92,Math.min(1.2,(a.quality*old+quality*amount)/quantity));
 if(legacy(id))s.inventory[id]=quantity;else a.stock=quantity;
}
function receive(s:GameState,o:RetailOrder):void{receivePaidMerchandise(s,o.product,o.quantity,o.cost,o.quality);}

export function orderMerchandise(s:GameState,id:ProductId,supplier:SupplierId,packs=1):Result{
 const p=productSpec(id),sp=SUPPLIERS.find(p=>p.id===supplier);
 if(!p||!sp||p.year>yearFromMinutes(s.totalMinutes))return {ok:false,message:'Mercadoria indisponível nesta época.'};
 if(!Number.isInteger(packs)||packs<sp.minPacks||packs>50)return {ok:false,message:`Peça de ${sp.minPacks} a 50 lotes.`};
 if(supplier==='partner'&&s.supplierTier!==2)return {ok:false,message:'Contrate o parceiro antes de fazer este pedido.'};
 const quantity=p.pack*packs,cost=quoteOrder(s,id,supplier,packs),pending=s.merchandise?.orders??[];
 if((s.merchandise?.nextOrderId??1)>=1e9||pending.length>=100||merchandiseStock(s,id)+pending.filter(o=>o.product===id).reduce((n,o)=>n+o.quantity,0)+quantity>999999)
  return {ok:false,message:'Limite de estoque ou pedidos atingido.'};
 if(s.totalMinutes+sp.delay>GAME_LAST_MINUTE)return {ok:false,message:'Entrega ultrapassaria o fim de 2030.'};
 if(!Number.isFinite(s.cash)||s.cash<cost)return {ok:false,message:'Caixa insuficiente para o pedido.'};
 const m=store(s),o:RetailOrder={id:m.nextOrderId++,product:id,supplier,quantity,cost,quality:sp.quality,dueMinute:s.totalMinutes+sp.delay};
 s.cash=cents(s.cash-cost);s.expenses=cents(s.expenses+cost);
 if(sp.delay)m.orders.push(o);else receive(s,o);
 return {ok:true,message:`${p.name}: ${quantity} un. por R$ ${cost.toFixed(2)}. ${sp.delay?'Entrega em 1 dia de jogo.':'Estoque recebido.'}`};
}
/** Called once per simulated minute; pending orders were paid in full at purchase. */
export function receiveDueOrders(s:GameState):string[]{
 const m=s.merchandise;if(!m?.orders.length)return [];
 const due=m.orders.filter(o=>o.dueMinute<=s.totalMinutes);
 m.orders=m.orders.filter(o=>o.dueMinute>s.totalMinutes);
 for(const o of due)receive(s,o);
 return due.map(o=>`Entrega recebida: ${o.quantity} un. de ${productSpec(o.product)!.name}.`);
}
export function setMerchandisePrice(s:GameState,id:ProductId,value:number):Result{
 if(!productSpec(id)||productSpec(id)!.year>yearFromMinutes(s.totalMinutes)||!Number.isFinite(value)||value<(isHistorical(s)?.25:1)||value>(isHistorical(s)?100:40)||
   (isHistorical(s)?Math.abs(value*100-Math.round(value*100))>1e-7:!Number.isInteger(value)))
  return {ok:false,message:isHistorical(s)?'Preço permitido: R$ 0,25 a R$ 100,00, em centavos.':'Preço permitido: R$ 1 a R$ 40.'};
 if(legacy(id))(s.retailPrices??={soda:merchandisePrice(s,'soda'),candy:merchandisePrice(s,'candy'),snacks:merchandisePrice(s,'snacks')})[id]=value;
 else account(s,id).price=value;
 return {ok:true,message:`Preço de ${productSpec(id)!.name}: R$ ${value.toFixed(2)}.`};
}
export function acceptsProduct(s:GameState,c:Customer,id:ProductId):boolean{
 const p=productSpec(id);if(!p||p.year>yearFromMinutes(s.totalMinutes)||merchandiseStock(s,id)<=0)return false;
 const price=merchandisePrice(s,id),wallet=c.wallet??18;
 const willing=referencePrice(s,id)*(c.preference==='economy'?1.15:1.35+(c.id%5)*.06)*productQuality(s,id);
 return Number.isFinite(wallet)&&price<=wallet+1e-7&&price<=willing+1e-7&&!(p.category==='soda'?c.purchasedDrink:c.purchasedFood);
}
/** Deterministic preference, bounded catalog; evaluated only at decision points. */
export function chooseMerchandise(s:GameState,c:Customer,drink:boolean):ProductId|null{
 let best:ProductId|null=null,score=-Infinity;
 for(const [i,p] of PRODUCTS.entries()){
  if((p.category==='soda')!==drink||!acceptsProduct(s,c,p.id))continue;
  const value=p.relief/55+(c.preference==='comfort'?1:.3)*(productQuality(s,p.id)-1)+
   ((Math.imul(c.id+1,i+11)>>>0)%17)/100-
   (c.preference==='economy'?.8:.18)*merchandisePrice(s,p.id)/referencePrice(s,p.id);
  if(value>score){score=value;best=p.id;}
 }
 return best;
}
/** Single stock/cash mutation shared by old APIs and real visitors. */
export function sellMerchandise(s:GameState,id:ProductId):Result{
 const p=productSpec(id);
 if(!p||p.year>yearFromMinutes(s.totalMinutes)||merchandiseStock(s,id)<=0)return {ok:false,message:'Produto esgotado ou indisponível.'};
 const a=account(s,id),value=merchandisePrice(s,id);
 if(legacy(id))s.inventory[id]--;else a.stock--;
 a.sold++;a.revenue=cents(a.revenue+value);a.costOfSales+=a.averageCost;
 s.cash=cents(s.cash+value);s.revenue=cents(s.revenue+value);s.purchases++;
 return {ok:true,message:`Venda de ${p.name}: +R$ ${value.toFixed(2)}.`};
}
/** No money is booked by migration: legacy stock stays authoritative, no copied units. */
export function validMerchandise(s:Partial<GameState>):boolean{
 const m=s.merchandise;if(m===undefined)return true;
 if(!s.inventory)return false;
 const number=(x:unknown,max=1e9):x is number=>typeof x==='number'&&Number.isFinite(x)&&x>=0&&x<=max;
 const money=(x:unknown)=>number(x)&&Math.abs(x*100-Math.round(x*100))<1e-4&&(s.economyVersion===2||Number.isInteger(x));
 const integer=(x:unknown,max=999999)=>number(x,max)&&Number.isInteger(x);
 if(!m||typeof m!=='object'||!m.products||typeof m.products!=='object'||Array.isArray(m.products)||
  !integer(m.nextOrderId,1e9)||m.nextOrderId<1||!Array.isArray(m.orders)||m.orders.length>100)return false;
 if(!Object.entries(m.products).every(([id,a])=>!!productSpec(id)&&!!a&&integer(a.stock)&&
   (!legacy(id as ProductId)||a.stock===0)&&number(a.averageCost,10000)&&number(a.quality,1.2)&&a.quality>=.92&&
   integer(a.sold,1e9)&&number(a.revenue)&&number(a.costOfSales)&&
   (a.price===undefined||(money(a.price)&&a.price>=(s.economyVersion===2?.25:1)&&a.price<=(s.economyVersion===2?100:40)))))return false;
 const ids=new Set<number>();
 return m.orders.every(o=>{
  if(!o||!productSpec(o.product)||!SUPPLIERS.some(sp=>sp.id===o.supplier)||!integer(o.id,1e9)||o.id<1||o.id>=m.nextOrderId||ids.has(o.id)||
   !integer(o.quantity)||o.quantity<1||!money(o.cost)||o.cost<=0||!number(o.quality,1.2)||o.quality<.92||
   !integer(o.dueMinute,GAME_LAST_MINUTE))return false;
  ids.add(o.id);return true;
 })&&PRODUCTS.every(p=>merchandiseStock(s as GameState,p.id)+m.orders.filter(o=>o.product===p.id).reduce((n,o)=>n+o.quantity,0)<=999999);
}
