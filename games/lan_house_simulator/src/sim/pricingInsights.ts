import type {GameState} from "./types.js";
import {customerSatisfactionDelta,demandFactor,energyCostPerMinute,sessionRevenue} from "./economy.js";
import {gameYear} from "./era.js";
import {DAY_MINUTES} from "./types.js";
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

/** Comparação local de tarifas, sem alterar o preço ou simular clientes fictícios.
 * Índice bruto: procura relativa × cobrança arredondada de uma sessão-padrão.
 * Não prevê caixa, filas, satisfação futura ou lucro de uma campanha. */
export function hourlyPriceScenarios(s:Pick<GameState,"pricePerHour"|"reputation"|"weather"|"totalMinutes"|"offlineUntil">):Array<{
  delta:-2|0|2;
  price:number;
  demandIndex:number;
  grossIntakeIndex:number;
}>{
  const online=s.totalMinutes>=s.offlineUntil,rainy=s.weather==="rain";
  const referenceDemand=demandFactor(s.pricePerHour,s.reputation,online,rainy);
  const referenceGross=referenceDemand*sessionRevenue(s.pricePerHour);
  return ([-2,0,2] as const)
    .filter(delta=>s.pricePerHour+delta>=4&&s.pricePerHour+delta<=40)
    .map(delta=>{
      const price=s.pricePerHour+delta;
      const demand=demandFactor(price,s.reputation,online,rainy);
      return {delta,price,
        demandIndex:Math.round(100*demand/referenceDemand),
        grossIntakeIndex:Math.round(100*demand*sessionRevenue(price)/referenceGross)};
    });
}

/** Projeção da *tarifa de energia*, mantendo a carga ociosa, instalações e
 * demais custos iguais. Não projeta uma conta real ou inventa inflação. */
export function energyYearOutlook(s:GameState):{
  currentYear:number;
  nextYear:number;
  changePercent:number;
}{
  const currentYear=gameYear(s);
  const yearStart=(currentYear-1998)*360*DAY_MINUTES;
  const sameLoad={...s,totalMinutes:yearStart};
  const current=energyCostPerMinute(sameLoad,0);
  const next=energyCostPerMinute({...sameLoad,totalMinutes:yearStart+360*DAY_MINUTES},0);
  return {currentYear,nextYear:currentYear+1,
    changePercent:Math.round((next/current-1)*1000)/10};
}
