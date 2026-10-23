import type { GameState, Result } from "./types.js";
import { DAY_MINUTES, LAST_ADMISSION_MINUTE } from "./types.js";
import { GAME_LAST_MINUTE } from "./mailCalendar.js";
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

/** Só existem novas chegadas antes das 20h30; o último dia também tem limite. */
export function promotionCanAttractVisitors(state:Pick<GameState,"totalMinutes">):boolean {
  return state.totalMinutes<GAME_LAST_MINUTE &&
    state.totalMinutes%DAY_MINUTES<LAST_ADMISSION_MINUTE;
}

/** Tempo útil para atrair visitantes, distinto da duração contratual até 22h. */
export function promotionAdmissionMinutesRemaining(state:PromotionState):number {
  return isPromotionActive(state)
    ? Math.max(0,LAST_ADMISSION_MINUTE-(state.totalMinutes%DAY_MINUTES))
    : 0;
}

export function promotionMinutesRemaining(state:PromotionState):number {
  return isPromotionActive(state) ? DAY_MINUTES - (state.totalMinutes % DAY_MINUTES) : 0;
}

export function promotionVisitorMultiplier(state:PromotionState):number {
  return isPromotionActive(state)&&promotionCanAttractVisitors(state) ? PROMOTION_VISITOR_MULTIPLIER : 1;
}

/** Aumento da procura não fabrica clientes, pagamentos, estoque ou reputação. */
export function launchPromotion(state:GameState):Result {
  if (isPromotionActive(state)) return {ok:false,message:"A panfletagem já foi contratada hoje."};
  if(state.totalMinutes>=GAME_LAST_MINUTE)
    return {ok:false,message:"O calendário terminou: não é possível contratar panfletagem."};
  if(!promotionCanAttractVisitors(state))
    return {ok:false,message:"Novos clientes só entram até 20h30. Volte amanhã para contratar panfletagem."};
  const cost=promotionCost(state);
  const text=cost.toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
  if(state.cash<cost)return {ok:false,message:"Caixa insuficiente para divulgação: "+text+"."};
  state.cash-=cost;
  state.expenses+=cost;
  state.promotionDay=promotionDayNumber(state);
  return {ok:true,message:"Panfletagem contratada: -"+text+". Chance de novos visitantes maior até 20h30."};
}
