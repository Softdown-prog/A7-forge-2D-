/** Boundary between the framework-independent engine and the merchandise UI.
 * Views receive DTOs and commands, never mutable GameState or domain functions.
 */
import type {GameState,Result} from "../sim/types.js";
import {PRODUCTS,SUPPLIERS,availableProducts,merchandiseStock,merchandisePrice,averageProductCost,orderMerchandise,setMerchandisePrice,quoteOrder,productSpec,productQuality} from "../sim/merchandise.js";
import {yearFromMinutes} from "../sim/historicalEconomy.js";

export type MerchandiseCategory="soda"|"candy"|"snacks";
export interface MerchandiseProductOption {id:string;name:string}
export interface MerchandiseSupplierOption {id:string;name:string;description:string;minPacks:number}
export interface MerchandiseOrderView {id:number;productName:string;quantity:number;cost:number;minutesRemaining:number;dueDay:number}
export interface MerchandiseDetail {
 pack:number;stock:number;qualityPercent:number;price:number;averageCost:number;
 sold:number;revenue:number;costOfSales:number;cash:number;
 priceMin:string;priceMax:string;priceStep:string;priceDecimals:number;
 quotes:ReadonlyArray<{name:string;costPerUnit:number}>;
 orderQuantity:number;orderCost:number;canOrder:boolean;orders:ReadonlyArray<MerchandiseOrderView>;
}
export interface MerchandisePort {
 readonly suppliers:ReadonlyArray<MerchandiseSupplierOption>;
 overview(category:MerchandiseCategory):{year:number;products:ReadonlyArray<MerchandiseProductOption>;next:MerchandiseProductOption & {year:number} | null};
 details(id:string,supplier:string,packs:number):MerchandiseDetail|null;
 setPrice(id:string,price:number):Result;
 order(id:string,supplier:string,packs:number):Result;
}
const suppliers:ReadonlyArray<MerchandiseSupplierOption>=SUPPLIERS.map(({id,name,description,minPacks})=>({id,name,description,minPacks}));

export function createMerchandisePort(getState:()=>GameState):MerchandisePort{
 return {
  suppliers,
  overview(category){
   const s=getState(),year=yearFromMinutes(s.totalMinutes);
   const products=availableProducts(s).filter(p=>p.category===category).map(p=>({id:p.id,name:p.name}));
   const next=PRODUCTS.find(p=>p.category===category&&p.year>year);
   return {year,products,next:next?{id:next.id,name:next.name,year:next.year}:null};
  },
  details(id,supplierId,packs){
   const s=getState(),p=productSpec(id),supplier=SUPPLIERS.find(sp=>sp.id===supplierId);
   if(!p||p.year>yearFromMinutes(s.totalMinutes)||!supplier)return null;
   const productId=p.id,account=s.merchandise?.products[productId];
   const price=merchandisePrice(s,productId),averageCost=averageProductCost(s,productId);
   const validPacks=Number.isInteger(packs)&&packs>=supplier.minPacks&&packs<=50;
   const orderCost=validPacks?quoteOrder(s,productId,supplier.id,packs):quoteOrder(s,productId,supplier.id,0);
   return {
    pack:p.pack,stock:merchandiseStock(s,productId),
    qualityPercent:Math.round(productQuality(s,productId)*100),
    price,averageCost,sold:account?.sold??0,revenue:account?.revenue??0,
    costOfSales:account?.costOfSales??0,cash:s.cash,
    priceMin:s.economyVersion===2?"0.25":"1",priceMax:s.economyVersion===2?"100":"40",
    priceStep:s.economyVersion===2?"0.01":"1",priceDecimals:s.economyVersion===2?2:0,
    quotes:SUPPLIERS.map(sp=>({name:sp.name,costPerUnit:quoteOrder(s,productId,sp.id)/p.pack})),
    orderQuantity:validPacks?packs*p.pack:0,orderCost,
    canOrder:validPacks&&s.cash>=orderCost&&(supplier.id!=="partner"||s.supplierTier===2),
    orders:(s.merchandise?.orders??[]).map(o=>({
     id:o.id,productName:productSpec(o.product)?.name??o.product,quantity:o.quantity,cost:o.cost,
     minutesRemaining:Math.max(0,o.dueMinute-s.totalMinutes),dueDay:Math.floor(o.dueMinute/720)+1
    }))
   };
  },
  setPrice(id,price){
   const p=productSpec(id);
   if(!p)return {ok:false,message:"Mercadoria inexistente."};
   return setMerchandisePrice(getState(),p.id,price);
  },
  order(id,supplierId,packs){
   const p=productSpec(id),supplier=SUPPLIERS.find(sp=>sp.id===supplierId);
   if(!p||!supplier)return {ok:false,message:"Mercadoria ou fornecedor inválido."};
   return orderMerchandise(getState(),p.id,supplier.id,packs);
  }
 };
}
