import type {GameState} from "./types.js";
import {customerSatisfactionDelta,demandFactor} from "./economy.js";
/** Informação do motor para a UI: não altera renda, clientes, RNG ou estado. */
export function hourlyPriceInsight(s:Pick<GameState,"pricePerHour"|"reputation"|"weather"|"totalMinutes"|"offlineUntil">):{
 relativeDemandPercent:number;
 assessment:"positiva"|"sensível"|"desfavorável";
 caution:string;
}{
 const online=s.totalMinutes>=s.offlineUntil, rainy=s.weather==="rain";
 const reference=demandFactor(12,s.reputation,online,rainy);
 const atPrice=demandFactor(s.pricePerHour,s.reputation,online,rainy);
 const delta=customerSatisfactionDelta(s.pricePerHour,0,0);
 return {
  relativeDemandPercent:Math.round(100*atPrice/reference),
  assessment:delta<0?"desfavorável":delta<.10?"sensível":"positiva",
  caution:s.pricePerHour>18?"Acima de R$ 18/h, o sobrepreço reduz progressivamente a procura.":"O preço não sofre a penalidade adicional de sobrepreço."
 };
}
