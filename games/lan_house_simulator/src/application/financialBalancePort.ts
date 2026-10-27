/** Read-only projections of the running balance and the next monthly closing. */
import type {GameState} from "../sim/types.js";
import {financialSnapshot,monthlyClosingSnapshot} from "../sim/financialClarity.js";
import {monthlyBills} from "../sim/economy.js";

export interface FinancialBalanceView {
 cash:string; summary:string; profit:string; negative:boolean;
 opening:string; income:string; outgoing:string; available:string;
 reconciliation:string|null;
}
export interface BillWatchView {
 title:string; status:string; warning:boolean;
}
export interface FinancialBalancePort {
 balance():FinancialBalanceView;
 billWatch():BillWatchView;
}
export function createFinancialBalancePort(getState:()=>GameState):FinancialBalancePort {
 const money=(n:number):string=>"R$ "+n.toLocaleString("pt-BR");
 const currency=(n:number):string=>n.toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
 return {
  balance(){
   const state=getState();
   const statement=financialSnapshot(state);
   return {
    cash:money(state.cash),
    summary:"Caixa "+money(state.cash)+" · contas/mês "+money(monthlyBills(state)),
    profit:money(statement.netResult),
    negative:statement.netResult<0,
    opening:currency(statement.openingCash),
    income:currency(statement.income),
    outgoing:currency(statement.outgoing),
    available:currency(statement.availableCash),
    reconciliation:statement.differenceCents===0?null:
     "Atenção: o caixa deste salvamento difere em "+currency(statement.differenceCents/100)+
     " do cálculo pelo capital inicial e pelos lançamentos. Confira o histórico em Finanças."
   };
  },
  billWatch(){
   const closing=monthlyClosingSnapshot(getState());
   if(closing.campaignEnding)return {
    title:"Calendário encerrando",
    status:"A campanha termina neste dia; não há outro fechamento agendado.",
    warning:false
   };
   return {
    title:"Próximo fechamento em "+closing.daysRemaining+
     (closing.daysRemaining===1?" dia do jogo":" dias do jogo"),
    status:"Provisão acumulada até agora: "+currency(closing.provision)+
     ". "+(closing.coversProvision?"O caixa atual cobre este valor.":
      "Se a cobrança fosse agora, faltariam "+currency(closing.shortfall)+"."),
    warning:!closing.coversProvision&&closing.daysRemaining<=7
   };
  }
 };
}
