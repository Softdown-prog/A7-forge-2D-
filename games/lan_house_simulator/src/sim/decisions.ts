import type {GameState,Result} from "./types.js";
import {DAY_MINUTES} from "./types.js";
import type {GameNotice} from "./notices.js";

export type DecisionId="supplier-offer"|"school-booking"|"gaming-tournament"|"equipment-fault";
export type ChoiceId="supplier-accept"|"supplier-decline"|"school-accept"|"school-decline"|"tournament-host"|"tournament-small"|"tournament-decline"|"fault-express"|"fault-basic"|"fault-delay";
export interface DecisionOption {id:ChoiceId;label:string;cost:number;description:string}
export const DECISIONS:Record<DecisionId,{title:string;body:string;options:DecisionOption[]}>={
 "supplier-offer":{title:"Proposta do distribuidor",body:"Um distribuidor oferece um lote promocional de bebidas. Aceitar exige capital, mas aumenta o estoque.",options:[
  {id:"supplier-accept",label:"Comprar lote especial · R$ 140",cost:140,description:"+35 bebidas"},
  {id:"supplier-decline",label:"Recusar proposta",cost:0,description:"Sem gasto nem bônus"}]},
 "school-booking":{title:"Reserva da escola do bairro",body:"Uma escola quer reservar os computadores para um projeto educativo. A reserva exige organização, mas garante receita.",options:[
  {id:"school-accept",label:"Aceitar reserva · receber R$ 240",cost:0,description:"+R$ 240 e +2 reputação"},
  {id:"school-decline",label:"Recusar educadamente",cost:0,description:"Sem alterações"}]},
 "gaming-tournament":{title:"Campeonato no bairro",body:"Os clientes querem um campeonato de jogos. Você pode investir em um evento grande, organizar algo menor ou adiar.",options:[
  {id:"tournament-host",label:"Campeonato completo · R$ 300",cost:300,description:"+9 reputação"},
  {id:"tournament-small",label:"Evento simples · R$ 100",cost:100,description:"+3 reputação"},
  {id:"tournament-decline",label:"Não organizar",cost:0,description:"Sem custos"}]},
 "equipment-fault":{title:"Manutenção preventiva",body:"O técnico identificou aquecimento em computadores. Você decide quanto investir em prevenção.",options:[
  {id:"fault-express",label:"Revisão completa · R$ 220",cost:220,description:"Reduz desgaste de todos os PCs"},
  {id:"fault-basic",label:"Limpeza básica · R$ 70",cost:70,description:"Reduz parte do desgaste"},
  {id:"fault-delay",label:"Adiar revisão",cost:0,description:"Aumenta desgaste dos PCs"}]}
};
export function decisionOptions(id:string):DecisionOption[]{return DECISIONS[id as DecisionId]?.options??[];}
export function chooseDecision(s:GameState,noticeId:string,choiceId:string):Result{
 const notice=s.notices?.find(n=>n.id===noticeId);
 const options=decisionOptions(noticeId);
 const option=options.find(o=>o.id===choiceId);
 if(!notice||!option)return {ok:false,message:"Decisão indisponível."};
 if(notice.resolved)return {ok:false,message:"Esta proposta já foi respondida."};
 if(s.cash<option.cost)return {ok:false,message:"Caixa insuficiente para esta decisão."};
 s.cash-=option.cost;s.expenses+=option.cost;
 switch(option.id){
  case "supplier-accept":s.inventory.soda+=35;break;
  case "school-accept":s.cash+=240;s.revenue+=240;s.reputation=Math.min(100,s.reputation+2);break;
  case "tournament-host":s.reputation=Math.min(100,s.reputation+9);break;
  case "tournament-small":s.reputation=Math.min(100,s.reputation+3);break;
  case "fault-express":s.pcWear=(s.pcWear??[]).map(x=>Math.max(0,x-35));break;
  case "fault-basic":s.pcWear=(s.pcWear??[]).map(x=>Math.max(0,x-12));break;
  case "fault-delay":s.pcWear=(s.pcWear??[]).map(x=>Math.min(100,x+8));break;
 }
 notice.read=true;notice.resolved=option.id;
 const message="Decisão: "+option.label+". "+option.description+".";
 s.eventLog.unshift(message);s.eventLog.splice(14);
 return {ok:true,message};
}
/** Deterministic event scheduling: 4-7 day cadence, conditioned on current store;
 * never consume the simulation RNG stream used for customer behavior. */
export function scheduleDecisions(s:GameState):void{
 const today=Math.floor(s.totalMinutes/DAY_MINUTES)+1;
 if(today<4||s.notices?.some(n=>decisionOptions(n.id).length&&!n.resolved))return;
 const last=s.lastDecisionDay??0;
 const interval=4+(Math.imul(s.rng>>>0,31)>>>0)%4;
 if(today-last<interval)return;
 const ids:DecisionId[]=["supplier-offer","school-booking","gaming-tournament","equipment-fault"];
 const candidates=ids.filter(id=>!s.notices?.some(n=>n.id===id) &&
  (id!=="school-booking"||s.installedPcs===undefined||s.installedPcs>=3) &&
  (id!=="equipment-fault"||(s.pcWear??[]).some(x=>x>15)));
 if(!candidates.length)return;
 const seed=(Math.imul(today,1103515245)+(s.rng>>>0))>>>0;
 const id=candidates[seed%candidates.length]!;
 const spec=DECISIONS[id];
 const notice:GameNotice={id,title:spec.title,body:spec.body,day:today,read:false,severity:"info"};
 (s.notices??=[]).unshift(notice);
 s.notices.splice(40);
 s.lastDecisionDay=today;
 s.eventLog.unshift("D"+today+" · Nova proposta: "+spec.title);
 s.eventLog.splice(14);
}
