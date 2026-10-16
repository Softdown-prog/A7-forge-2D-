import type {GameState} from "./types.js";
import {DAY_MINUTES} from "./types.js";
import {PRINTER_COST,printWalkInDemand} from "./printService.js";
import {DISC_COPIER_COST,discWalkInDemand} from "./discCopy.js";

/** Indicadores de caixa para dois serviços que não exigem uma estação de PC.
 * O resultado operacional desconta materiais; a amortização inclui a compra única.
 * Não confundir os indicadores com o lucro total da lan house. */
export interface ServiceEconomySnapshot {
  revenue:number;
  materialCost:number;
  operatingResult:number;
  investment:number;
  netAfterInvestment:number;
  remainingInvestment:number;
  fullyRecovered:boolean;
  walkIns:number;
  /** Expectativa matemática de tentativas de entrada, NÃO atendimentos garantidos. */
  expectedWalkInAttemptsPerDay:number;
}
const money=(n:number)=>Math.round(n*100)/100;
/** O caixa fecha admissão de novos clientes nos últimos 90 minutos do dia. */
export const SERVICE_ADMISSION_MINUTES=DAY_MINUTES-90;
function snapshot(revenue:number,cost:number,investment:number,walkIns:number,demand:number):ServiceEconomySnapshot{
 const operatingResult=money(revenue-cost);
 const netAfterInvestment=money(operatingResult-investment);
 return {
  revenue,materialCost:cost,operatingResult,investment,netAfterInvestment,
  remainingInvestment:money(Math.max(0,-netAfterInvestment)),fullyRecovered:netAfterInvestment>=0,
  walkIns,
  expectedWalkInAttemptsPerDay:Math.round(demand*SERVICE_ADMISSION_MINUTES*10)/10
 };
}
export function printEconomy(s:GameState):ServiceEconomySnapshot|null{
 const v=s.printer;
 return v?snapshot(v.revenue,v.expenses,PRINTER_COST,v.walkIns??0,printWalkInDemand(s)):null;
}
export function discEconomy(s:GameState):ServiceEconomySnapshot|null{
 const v=s.discCopier;
 return v?snapshot(v.revenue,v.expenses,DISC_COPIER_COST,v.walkIns??0,discWalkInDemand(s)):null;
}
