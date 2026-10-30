import type {GameState} from "./types.js";
import {customerSatisfactionDelta,demandFactor,energyCostPerMinute,sessionRevenue} from "./economy.js";
import {gameYear} from "./eraCatalog.js";
import {DAY_MINUTES} from "./types.js";
import {allowableHourlyPrice,normalizedHourlyPrice,MIN_HOURLY_PRICE} from "./historicalEconomy.js";
/** Informação do motor para a UI: não altera renda, clientes, RNG ou estado. */
export function hourlyPriceInsight(s:Pick<GameState,"pricePerHour"|"reputation"|"weather"|"totalMinutes"|"offlineUntil">):{
 relativeDemandPercent:number;
 assessment:"positiva"|"sensível"|"desfavorável";
 caution:string;
}{
 const online=s.totalMinutes>=s.offlineUntil, rainy=s.weather==="rain";
 const reference=demandFactor((s as GameState).economyVersion===2?10:12,s.reputation,online,rainy);
 const normalized=normalizedHourlyPrice(s,s.pricePerHour);
 const atPrice=demandFactor(normalized,s.reputation,online,rainy);
 const delta=customerSatisfactionDelta(normalized,0,0);
 return {
  relativeDemandPercent:Math.round(100*atPrice/reference),
  assessment:delta<0?"desfavorável":delta<.10?"sensível":"positiva",
  caution:(s as GameState).economyVersion===2?
   (normalized>18?"Tarifa elevada para o poder de compra desta época: a procura cai progressivamente.":
    "A tarifa é avaliada contra o poder de compra da época, não como um preço nominal eterno."):
   (s.pricePerHour>18?"Acima de R$ 18/h, o sobrepreço reduz progressivamente a procura.":
    "O preço não sofre a penalidade adicional de sobrepreço.")
 };
}

/** Comparação local de tarifas, sem alterar o preço ou simular clientes fictícios.
 * Índice bruto: procura relativa × cobrança arredondada de uma sessão-padrão.
 * Não prevê caixa, filas, satisfação futura ou lucro de uma campanha. */
export function hourlyPriceScenarios(s:Pick<GameState,"pricePerHour"|"reputation"|"weather"|"totalMinutes"|"offlineUntil">):Array<{
  delta:-2|-0.5|0|0.5|2;
  price:number;
  demandIndex:number;
  grossIntakeIndex:number;
}>{
  const online=s.totalMinutes>=s.offlineUntil,rainy=s.weather==="rain";
  const referenceDemand=demandFactor(normalizedHourlyPrice(s,s.pricePerHour),s.reputation,online,rainy);
  const historical=(s as GameState).economyVersion===2;
  const referenceGross=referenceDemand*sessionRevenue(s.pricePerHour,45,historical);
  const ceiling=allowableHourlyPrice(s as GameState);
  const deltas=historical?[-.5,0,.5]:[-2,0,2];
  return deltas
    .filter(delta=>s.pricePerHour+delta>=(historical?MIN_HOURLY_PRICE:4)&&s.pricePerHour+delta<=ceiling)
    .map(delta=>{
      const price=Math.round((s.pricePerHour+delta)*100)/100;
      const demand=demandFactor(normalizedHourlyPrice(s,price),s.reputation,online,rainy);
      return {delta:delta as -2|-0.5|0|0.5|2,price,
        demandIndex:Math.round(100*demand/referenceDemand),
        grossIntakeIndex:Math.round(100*demand*sessionRevenue(price,45,historical)/referenceGross)};
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
