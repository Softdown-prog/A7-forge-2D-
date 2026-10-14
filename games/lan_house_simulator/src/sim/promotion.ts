import type { GameState, Result } from "./types.js";
import { DAY_MINUTES } from "./types.js";
import {isHistorical,priceIndex,yearFromMinutes} from "./historicalEconomy.js";

/** A campanha utiliza o relógio do jogo, sem timers de navegador ou renda artificial. */
/** Mantido para compatibilidade com saves clássicos e auditorias anteriores. */
export const PROMOTION_COST = 120;
/** Base de game design para 1998; não é um valor histórico comprovado. */
export const HISTORICAL_PROMOTION_COST_1998 = 24;
/** Cotação pura: sem mutação de estado ou sorteios. */
export function promotionCost(state:Pick<GameState,"totalMinutes"|"economyVersion">):number{
 return isHistorical(state)
  ? Math.round(HISTORICAL_PROMOTION_COST_1998*priceIndex(yearFromMinutes(state.totalMinutes))*100)/100
  : PROMOTION_COST;
}
export const PROMOTION_VISITOR_MULTIPLIER = 1.4;

type PromotionState = Pick<GameState, "totalMinutes" | "promotionDay">;

export function promotionDayNumber(state:PromotionState):number {
  return Math.floor(state.totalMinutes / DAY_MINUTES) + 1;
}

export function isPromotionActive(state:PromotionState):boolean {
  return Number.isInteger(state.promotionDay) && state.promotionDay === promotionDayNumber(state);
}

export function promotionMinutesRemaining(state:PromotionState):number {
  return isPromotionActive(state) ? DAY_MINUTES - (state.totalMinutes % DAY_MINUTES) : 0;
}

export function promotionVisitorMultiplier(state:PromotionState):number {
  return isPromotionActive(state) ? PROMOTION_VISITOR_MULTIPLIER : 1;
}

/** Aumento da procura não fabrica clientes, pagamentos, estoque ou reputação. */
export function launchPromotion(state:GameState):Result {
  if (isPromotionActive(state)) return {ok:false,message:"A panfletagem já foi contratada hoje."};
  const cost=promotionCost(state);
  const text=cost.toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
  if(state.cash<cost)return {ok:false,message:"Caixa insuficiente para divulgação: "+text+"."};
  state.cash-=cost;
  state.expenses+=cost;
  state.promotionDay=promotionDayNumber(state);
  return {ok:true,message:"Panfletagem contratada: -"+text+". Mais movimento no bairro até 22h."};
}
