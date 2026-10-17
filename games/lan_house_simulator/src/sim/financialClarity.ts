import type {GameState} from "./types.js";
import {DAY_MINUTES} from "./types.js";
import {monthlyBills} from "./economy.js";
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
