/** Read-only hourly price and year-end energy reports for the current campaign. */
import type {GameState} from "../sim/types.js";
import {hourlyPriceInsight,hourlyPriceScenarios,energyYearOutlook} from "../sim/pricingInsights.js";
import {allowableHourlyPrice} from "../sim/historicalEconomy.js";

export interface HourlyPricingInsightView {
 demand:string;
 satisfaction:string;
 caution:string;
 lower:string;
 current:string;
 higher:string;
}
export interface EnergyOutlookView {label:string}
export interface PricingInsightsPort {
 hourly():HourlyPricingInsightView;
 energy():EnergyOutlookView;
}
export function createPricingInsightsPort(getState:()=>GameState):PricingInsightsPort {
 return {
  hourly(){
   const game=getState();
   const historical=game.economyVersion===2;
   const max=allowableHourlyPrice(game);
   const inReais=(n:number):string=>n.toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
   const insight=hourlyPriceInsight(game);
   const scenarios=hourlyPriceScenarios(game);
   const scenarioLine=(delta:-2|-0.5|0|0.5|2,title:string):string=>{
    const candidate=scenarios.find(p=>p.delta===delta);
    return candidate?title+" · R$ "+(historical?candidate.price.toFixed(2):String(candidate.price))+
     "/h · procura "+candidate.demandIndex+"% · receita bruta potencial "+candidate.grossIntakeIndex+"%":
     title+" · fora do teto de "+inReais(max)+"/h.";
   };
   return {
    demand:"Procura relativa pelo modelo: "+
     (insight.relativeDemandPercent===0?"menos de 1%":insight.relativeDemandPercent+"%")+
     " (R$ 12/h = 100%).",
    satisfaction:"Avaliação estimada em PC básico, sem espera ou queda: "+insight.assessment+".",
    caution:insight.caution,
    lower:historical?scenarioLine(-.5,"Reduzir R$ 0,50"):scenarioLine(-2,"Reduzir R$ 2"),
    current:scenarioLine(0,"Manter"),
    higher:historical?scenarioLine(.5,"Aumentar R$ 0,50"):scenarioLine(2,"Aumentar R$ 2")
   };
  },
  energy(){
   const game=getState();
   const historical=game.economyVersion===2;
   const outlook=energyYearOutlook(game);
   const change=(outlook.changePercent>0?"+":"")+outlook.changePercent.toLocaleString("pt-BR");
   return {
    label:historical?
     "IPCA na virada "+outlook.currentYear+" → "+outlook.nextYear+
     ": "+change+
     "% aplicado ao custo energético e às demais contas indexadas, mantendo as máquinas iguais.":
     "Energia na virada "+outlook.currentYear+" → "+outlook.nextYear+
     ": "+change+
     "% de tarifa, mantendo os mesmos PCs e a carga ociosa. Demais contas fixas não recebem inflação automática."
   };
  }
 };
}
