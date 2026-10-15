import type {GameState,Customer,Result} from "./types.js";
import {DAY_MINUTES} from "./types.js";
import {priceIndex,yearFromMinutes} from "./historicalEconomy.js";

/** Impressões são um serviço simples de balcão; não representam uma segunda estação de PCs. */
export interface PrinterService {
 price:number;pages:number;revenue:number;expenses:number;day:number;dayPages:number;
}
export const PRINTER_COST=320;
export const PRINT_PAGES_PER_DAY=35;
export const PRINT_MAX_PRICE=20;
const cents=(n:number)=>Math.round(n*100)/100;
const day=(s:GameState)=>Math.floor(s.totalMinutes/DAY_MINUTES)+1;
const inflation=(s:GameState)=>s.economyVersion===2?priceIndex(yearFromMinutes(s.totalMinutes)):1;
export function printPaperInkCost(s:GameState):number{return s.economyVersion===2?cents(.45*inflation(s)):1;}
export function printReferencePrice(s:GameState):number{return s.economyVersion===2?Math.min(PRINT_MAX_PRICE,Math.max(.5,Math.round(1.5*inflation(s)*2)/2)):3;}
export function quotePrinter(s:GameState):Result{
 if(s.printer)return {ok:false,message:"Impressora adquirida. Ajuste o preço em Administração → Preços."};
 if(s.cash<PRINTER_COST)return {ok:false,message:"Caixa insuficiente para a impressora."};
 return {ok:true,message:"Ativa impressão de documentos no balcão; cada página consome papel e tinta."};
}
export function buyPrinter(s:GameState):Result{
 const q=quotePrinter(s);if(!q.ok)return q;
 s.cash=cents(s.cash-PRINTER_COST);s.expenses=cents(s.expenses+PRINTER_COST);
 s.printer={price:printReferencePrice(s),pages:0,revenue:0,expenses:0,day:day(s),dayPages:0};
 return {ok:true,message:"Impressora adquirida! Configure o preço por página na aba Preços."};
}
export function setPrintPrice(s:GameState,price:number):Result{
 if(!s.printer)return {ok:false,message:"Compre uma impressora primeiro."};
 const historical=s.economyVersion===2;
 if(!Number.isFinite(price)||price<(historical?.5:1)||price>PRINT_MAX_PRICE||
    (historical?Math.abs(price*2-Math.round(price*2))>1e-7:!Number.isInteger(price)))
  return {ok:false,message:historical?"Preço por página: R$ 0,50 a R$ 20, em passos de R$ 0,50.":
    "Preço por página: R$ 1 a R$ 20, em reais inteiros neste save clássico."};
 s.printer.price=price;
 return {ok:true,message:"Impressão: R$ "+price.toFixed(2)+" por página."};
}
export function pagesPrintedToday(s:GameState):number{
 return s.printer?.day===day(s)?s.printer.dayPages:0;
}
/** Perfil determinístico sem RNG global; orçamento e capacidade impedem renda fictícia.
 * A compra pode ocorrer uma única vez na jornada do cliente, inclusive após save. */
export function servePrinting(s:GameState,c:Customer):{pages:number;revenue:number;cost:number}|null{
 if(!s.printer||c.printChecked||c.stage!=="to_pc")return null;
 c.printChecked=true;
 const printer=s.printer;
 if(printer.day!==day(s)){printer.day=day(s);printer.dayPages=0;}
 const profile=(Math.imul(c.id,1103515245)+12345)>>>0;
 const demand=.24*Math.min(1,printReferencePrice(s)/printer.price);
 if(profile%1000/1000>=demand)return null;
 const qtyWanted=1+(profile>>>16)%4;
 const qty=Math.min(qtyWanted,PRINT_PAGES_PER_DAY-printer.dayPages,Math.floor((c.wallet??18)/printer.price));
 if(qty<1)return null;
 const revenue=cents(qty*printer.price),cost=cents(qty*printPaperInkCost(s));
 if(s.cash+revenue<cost)return null;
 c.wallet=cents((c.wallet??18)-revenue);
 s.cash=cents(s.cash+revenue-cost);s.revenue=cents(s.revenue+revenue);s.expenses=cents(s.expenses+cost);
 printer.pages+=qty;printer.dayPages+=qty;
 printer.revenue=cents(printer.revenue+revenue);printer.expenses=cents(printer.expenses+cost);
 return {pages:qty,revenue,cost};
}
export function validPrinterService(s:Partial<GameState>):boolean{
 const v=s.printer;if(v===undefined)return true;
 if(!v||typeof v!=="object"||Array.isArray(v))return false;
 const money=(n:number)=>Number.isFinite(n)&&n>=0&&n<=1e12&&Math.abs(n*100-Math.round(n*100))<1e-5;
 const maxDay=Math.floor((s.totalMinutes??0)/DAY_MINUTES)+1;
 return Number.isFinite(v.price)&&v.price>=(s.economyVersion===2?.5:1)&&v.price<=PRINT_MAX_PRICE&&
  (s.economyVersion===2?Math.abs(v.price*2-Math.round(v.price*2))<1e-7:Number.isInteger(v.price))&&
  Number.isSafeInteger(v.pages)&&v.pages>=0&&v.pages<=1e9&&
  money(v.revenue)&&money(v.expenses)&&Number.isInteger(v.day)&&v.day>=1&&v.day<=maxDay&&
  Number.isInteger(v.dayPages)&&v.dayPages>=0&&v.dayPages<=PRINT_PAGES_PER_DAY&&v.dayPages<=v.pages;
}
