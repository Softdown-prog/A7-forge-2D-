import type { GameState, Result } from "./types.js";
import { DAY_MINUTES } from "./types.js";

/** A campanha utiliza o relógio do jogo, sem timers de navegador ou renda artificial. */
export const PROMOTION_COST = 120;
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
  if (state.cash < PROMOTION_COST) return {ok:false,message:"Caixa insuficiente para divulgação: R$ "+PROMOTION_COST+"."};
  state.cash -= PROMOTION_COST;
  state.expenses += PROMOTION_COST;
  state.promotionDay = promotionDayNumber(state);
  return {ok:true,message:"Panfletagem contratada: -R$ "+PROMOTION_COST+". Mais movimento no bairro até 22h."};
}
