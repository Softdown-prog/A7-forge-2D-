import type {GameState} from "./types.js";
import {DAY_MINUTES} from "./types.js";
import {monthlyBills,energyMonthlyEstimate} from "./economy.js";
import {isHistorical,priceIndex,yearFromMinutes} from "./historicalEconomy.js";
import {GAME_END_DAY} from "./mailCalendar.js";

/** Capital inicial da partida padrão; os saves anteriores mantêm seu caixa. */
export const INITIAL_CASH=850;

export interface FinancialSnapshot {
 openingCash:number;
 income:number;
 outgoing:number;
 netResult:number;
 availableCash:number;
 /** Diferença em centavos, para não mascarar divergências de saves antigos. */
 differenceCents:number;
}
/** Apenas leitura dos lançamentos reais, sem alterar dinheiro, RNG ou save. */
export function financialSnapshot(s:Pick<GameState,"cash"|"revenue"|"expenses">):FinancialSnapshot {
 const netResult=s.revenue-s.expenses;
 const expected=INITIAL_CASH+netResult;
 return {
  openingCash:INITIAL_CASH,income:s.revenue,outgoing:s.expenses,
  netResult,availableCash:s.cash,
  differenceCents:Math.round((s.cash-expected)*100),
 };
}

/** O jogo fecha as contas na virada dos dias 30, 60, 90...;
 * os valores são uma provisão até AGORA, não uma fatura futura garantida. */
export interface MonthlyClosingSnapshot {
 daysRemaining:number;
 provision:number;
 cashAfterIfChargedNow:number;
 shortfall:number;
 coversProvision:boolean;
 campaignEnding:boolean;
}
export function monthlyClosingSnapshot(s:GameState):MonthlyClosingSnapshot{
 const dayIndex=Math.floor(Math.max(0,s.totalMinutes)/DAY_MINUTES);
 const daysRemaining=30-dayIndex%30;
 const provision=monthlyBills(s);
 const cashAfterIfChargedNow=Math.round((s.cash-provision)*100)/100;
 return {
  daysRemaining,provision,cashAfterIfChargedNow,
  shortfall:Math.max(0,Math.round((provision-s.cash)*100)/100),
  coversProvision:cashAfterIfChargedNow>=0,
  campaignEnding:dayIndex>=GAME_END_DAY-1,
 };
}

/** A última fatura realmente paga, não uma previsão nem um histórico infinito. */
export interface PaidMonthlyBill {
 endDay:number;
 rent:number;
 internet:number;
 energy:number;
 maintenance:number;
 wages:number;
 total:number;
 cashAfterPayment:number;
}
/** Chamar com a data do ÚLTIMO minuto do mês encerrado. Os números usam
 * exatamente as mesmas parcelas e arredondamentos de monthlyBills. */
export function paidMonthlyBillReceipt(
 s:GameState,endDay:number,paidTotal:number,cashAfterPayment:number
):PaidMonthlyBill{
 const factor=isHistorical(s)?priceIndex(yearFromMinutes(s.totalMinutes)):1;
 return {
  endDay,
  rent:Math.round((270+s.expansionLevel*170)*factor),
  internet:Math.round((110+(s.internetTier-1)*85)*factor),
  energy:s.energyAccrued!==undefined?Math.round(s.energyAccrued):energyMonthlyEstimate(s),
  maintenance:Math.round((75+s.expansionLevel*35)*factor),
  wages:Math.round((s.employeePayrollAccrued??0)*100)/100,
  total:paidTotal,cashAfterPayment,
 };
}
/** Rejeita comprovantes adulterados, duplicações e valores fora do período.
 * Saves anteriores (campo ausente) continuam válidos. */
export function validPaidMonthlyBill(value:unknown,s:Partial<GameState>):boolean{
 if(value===undefined)return true;
 if(!value||typeof value!=="object"||Array.isArray(value))return false;
 const receipt=value as Partial<PaidMonthlyBill>;
 if(!Number.isInteger(receipt.endDay)||receipt.endDay!<30||
    receipt.endDay!>GAME_END_DAY||receipt.endDay!%30!==0||
    receipt.endDay!>Math.floor((s.totalMinutes??0)/DAY_MINUTES))return false;
 const parts=[receipt.rent,receipt.internet,receipt.energy,receipt.maintenance,receipt.wages];
 const cents=(v:unknown)=>typeof v==="number"&&Number.isFinite(v)&&v>=0&&v<=1e9&&
  Math.abs(Math.round(v*100)-v*100)<1e-4;
 if(!parts.every(cents)||!cents(receipt.total)||typeof receipt.cashAfterPayment!=="number"||
    !Number.isFinite(receipt.cashAfterPayment)||Math.abs(receipt.cashAfterPayment)>1e9)return false;
 return Math.abs((parts.reduce((sum,n)=>sum+(n??0),0)-receipt.total!)*100)<1e-4;
}
