/** Read-only monthly finance indicators using the current campaign. */
import type {GameState} from "../sim/types.js";
import {computerOccupancyPercent,expansionAdvice} from "../sim/financialReview.js";

export interface MonthlyFinanceSnapshot {
 utilization:string;
 previousOccupancy:string;
 billInfo:string;
 receipt:Readonly<{
  rent:string;internet:string;energy:string;
  maintenance:string;wages:string;total:string;
 }> | null;
 statement:string;
 capacityAdvice:string;
}
export interface MonthlyFinancePort {snapshot():MonthlyFinanceSnapshot}
export function createMonthlyFinancePort(getState:()=>GameState):MonthlyFinancePort {
 const money=(value:number):string=>"R$ "+value.toLocaleString("pt-BR");
 const currency=(value:number):string=>value.toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
 return {snapshot(){
  const state=getState();
  const used=state.monthPcUsedMinutes??0,capacity=state.monthPcCapacityMinutes??0;
  const percent=computerOccupancyPercent(used,capacity);
  const previousCapacity=state.lastMonthPcCapacityMinutes??0;
  const previous=previousCapacity>0
   ?computerOccupancyPercent(state.lastMonthPcUsedMinutes??0,previousCapacity).toLocaleString("pt-BR")+"%"
   :"sem histórico";
  const hasStatement=state.lastMonthRevenue!==undefined&&state.lastMonthExpenses!==undefined;
  const lastNet=(state.lastMonthRevenue??0)-(state.lastMonthExpenses??0);
  const bill=state.lastPaidMonthlyBill;
  return {
   utilization:"Ocupação neste mês: "+percent.toLocaleString("pt-BR")+"% dos minutos-PC disponíveis ("+
    used.toLocaleString("pt-BR")+"/"+capacity.toLocaleString("pt-BR")+").",
   previousOccupancy:"Ocupação do último mês: "+previous+".",
   billInfo:bill
    ?"Último fechamento: mês "+String(Math.floor(((bill.endDay-1)%360)/30)+1).padStart(2,"0")+
     "/"+(1998+Math.floor((bill.endDay-1)/360))+
     " · pago "+currency(bill.total)+" · caixa após pagamento "+currency(bill.cashAfterPayment)+"."
    :"Nenhum fechamento pago nesta partida ainda. A primeira cobrança acontece após 30 dias do jogo.",
   receipt:bill?{
    rent:currency(bill.rent),internet:currency(bill.internet),energy:currency(bill.energy),
    maintenance:currency(bill.maintenance),wages:currency(bill.wages),total:currency(bill.total)
   }:null,
   statement:hasStatement
    ?"Fechamento anterior: entradas "+money(state.lastMonthRevenue??0)+
     " · saídas "+money(state.lastMonthExpenses??0)+" · resultado "+money(lastNet)+
     ". Inclui investimentos e multas pagos no período."
    :"Fechamento mensal: disponível após o primeiro mês completo desta partida.",
   capacityAdvice:expansionAdvice(state)
  };
 }};
}
