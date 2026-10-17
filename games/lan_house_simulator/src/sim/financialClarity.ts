import type {GameState} from "./types.js";

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
