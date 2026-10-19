import {receivePaidMerchandise} from "./merchandise.js";
import type {GameState,Result} from "./types.js";
import {DAY_MINUTES} from "./types.js";
import type {GameNotice} from "./notices.js";
import {isHistorical,priceIndex,yearFromMinutes} from "./historicalEconomy.js";
import {sporadicMailDue,recordMailDelivery,sporadicMailSchedule,additionalMailSchedule,fixedYearMailWindowDue} from "./mailCalendar.js";
import {STORY_IDS,STORIES,isStoryId,isStoryNoticeId,storyOptions,chooseStory,processStoryFollowups,storySeen,registerLegacyStory,type StoryId} from "./storyEvents.js";

export type DecisionId="supplier-offer"|"school-booking"|"gaming-tournament"|"equipment-fault"|"electrical-inspection";
export type ChoiceId="supplier-accept"|"supplier-decline"|"school-accept"|"school-decline"|"tournament-host"|"tournament-small"|"tournament-decline"|"fault-express"|"fault-basic"|"fault-delay"|"electrical-complete"|"electrical-essential"|"electrical-defer";
export interface DecisionOption {id:string;label:string;cost:number;description:string}
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
  {id:"fault-delay",label:"Adiar revisão",cost:0,description:"Aumenta desgaste dos PCs"}]},
 "electrical-inspection":{title:"Bombeiros: instalação elétrica irregular",
  body:"Uma equipe dos Bombeiros passou pela lan house e encontrou cabos de energia misturados aos de rede, adaptadores sobrecarregados e ligações improvisadas entre os computadores. O dono montou tudo por entusiasmo, sem consultar um profissional. Para diminuir o risco de incêndio, contrate um eletricista qualificado e regularize a instalação. Você pode solicitar prazo, mas o problema não desaparece sozinho.",
  options:[
   {id:"electrical-complete",label:"Refazer instalação com eletricista · R$ 320",cost:320,description:"Regulariza tudo e recupera +2 de reputação"},
   {id:"electrical-essential",label:"Adequação segura essencial · R$ 190",cost:190,description:"Regulariza os pontos críticos, sem bônus de reputação"},
   {id:"electrical-defer",label:"Solicitar prazo de 8 dias",cost:0,description:"Sem custo agora; se não regularizar, haverá autuação única"}
  ]}
};
/** Serviços de design indexados à época no modo histórico. */
export function decisionOptions(id:string,s?:GameState):DecisionOption[]{
 if(isStoryNoticeId(id))return s?storyOptions(s,id):isStoryId(id)?STORIES[id].choices.map(c=>({...c})):[];
 const options=DECISIONS[id as DecisionId]?.options??[];
 if(id!=="electrical-inspection"||!s||!isHistorical(s))return options;
 const index=priceIndex(yearFromMinutes(s.totalMinutes));
 return options.map(o=>{
  const base=o.id==="electrical-complete"?32:o.id==="electrical-essential"?19:0;
  const cost=Math.round(base*index*100)/100;
  return {...o,cost,label:o.cost?o.label.replace(/R\$ [\d,.]+/,"R$ "+cost.toFixed(2).replace(".",",")):o.label};
 });
}
export function chooseDecision(s:GameState,noticeId:string,choiceId:string):Result{
 if(isStoryNoticeId(noticeId))return chooseStory(s,noticeId,choiceId);
 const notice=s.notices?.find(n=>n.id===noticeId);
 const options=decisionOptions(noticeId,s);
 const option=options.find(o=>o.id===choiceId);
 if(!notice||!option)return {ok:false,message:"Decisão indisponível."};
 if(notice.resolved)return {ok:false,message:"Esta proposta já foi respondida."};
 // Operação idempotente: scripts antigos de campanha repetem a última escolha.
 if(option.id==="electrical-defer"&&(s.electricalExtensionUsed||s.electricalInspectionFineApplied))
  return {ok:true,message:"Prazo já solicitado; nenhuma nova prorrogação foi concedida. Regularize a instalação."};
 if(option.cost>0&&s.cash<option.cost)return {ok:false,message:"Caixa insuficiente para esta decisão."};
 s.cash-=option.cost;s.expenses+=option.cost;
 switch(option.id){
  case "supplier-accept":receivePaidMerchandise(s,"soda",35,option.cost);break;
  case "school-accept":s.cash+=240;s.revenue+=240;s.reputation=Math.min(100,s.reputation+2);break;
  case "tournament-host":s.reputation=Math.min(100,s.reputation+9);break;
  case "tournament-small":s.reputation=Math.min(100,s.reputation+3);break;
  case "fault-express":s.pcWear=(s.pcWear??[]).map(x=>Math.max(0,x-35));break;
  case "fault-basic":s.pcWear=(s.pcWear??[]).map(x=>Math.max(0,x-12));break;
  case "fault-delay":s.pcWear=(s.pcWear??[]).map(x=>Math.min(100,x+8));break;
  case "electrical-complete":s.electricalWiringRegularized=true;s.reputation=Math.min(100,s.reputation+2);break;
  case "electrical-essential":s.electricalWiringRegularized=true;break;
  case "electrical-defer":s.electricalDeadlineDay=(s.electricalDeadlineDay??Math.floor(s.totalMinutes/DAY_MINUTES)+1)+8;s.electricalExtensionUsed=true;break;
 }
 notice.read=true;
 // Pedir prazo não resolve a irregularidade; a carta permanece aberta.
 if(option.id!=="electrical-defer")notice.resolved=option.id;
 registerLegacyStory(s,noticeId,option.id,option.label);
 if(s.electricalWiringRegularized)notice.severity="info";
 const message=option.id==="electrical-defer"
  ?"Prazo solicitado até o dia "+s.electricalDeadlineDay+". A instalação continua irregular."
  :"Decisão: "+option.label+". "+option.description+".";
 s.eventLog.unshift(message);s.eventLog.splice(14);
 return {ok:true,message};
}
/** Propostas esporádicas com data distribuída pelos anos de 1998–2030.
 * São sorteadas uma vez por save e não usam o RNG que movimenta clientes. */
export function scheduleDecisions(s:GameState):void{
 processStoryFollowups(s);
 const today=Math.floor(s.totalMinutes/DAY_MINUTES)+1;
 // As cartas históricas de 2004 e 2005 não participam do sorteio esporádico 1998–2030.
 const randomStories=STORY_IDS.filter(id=>id!=="school-uniform-policy"&&id!=="gpu-games-2005");
 const storyDates=additionalMailSchedule(s,randomStories);
 const ids:Array<DecisionId|StoryId>=["supplier-offer","school-booking","gaming-tournament","equipment-fault","electrical-inspection",...STORY_IDS];
 const candidates=ids.filter(id=>
  (isStoryId(id)
   ?(id==="school-uniform-policy"
     ?fixedYearMailWindowDue(s,2004,121,150)
     :id==="gpu-games-2005"
       ?fixedYearMailWindowDue(s,2005,61,90)
       :storyDates[id]!==undefined&&today>=storyDates[id]!&&today<storyDates[id]!+45)&&!storySeen(s,id)
   :sporadicMailDue(s,id))&&
  !(s.storyRecords??[]).some(r=>r.id===id)&&
  (id!=="electrical-inspection"||!s.electricalInspectionSeen)&&
  !s.notices?.some(n=>n.id===id)&&
  (id!=="school-booking"||s.installedPcs===undefined||s.installedPcs>=3)&&
  (id!=="equipment-fault"||(s.pcWear??[]).some(x=>x>15))
 );
 if(!candidates.length)return;
 const dates:Partial<Record<string,number>>={
  ...sporadicMailSchedule(s),...storyDates,
  "school-uniform-policy":(2004-1998)*360+121,
  "gpu-games-2005":(2005-1998)*360+61
 };
 // Nunca escolher uma mensagem aleatória extra em dias adjacentes.
 const id=candidates.sort((a,b)=>(dates[a]??0)-(dates[b]??0))[0]!;
 const spec=isStoryId(id)?STORIES[id]:DECISIONS[id];
 const notice:GameNotice={id,title:spec.title,body:spec.body,day:today,read:false,severity:id==="electrical-inspection"?"warning":"info"};
 if(id==="electrical-inspection"){s.electricalInspectionSeen=true;s.electricalDeadlineDay=today+8;}
 if(isStoryId(id))(s.storySeenIds??=[]).push(id);
 (s.notices??=[]).unshift(notice);
 s.notices.splice(40);
 if(!isStoryId(id))recordMailDelivery(s,id);
 s.lastDecisionDay=today;
 s.eventLog.unshift("D"+today+" · Nova proposta: "+spec.title);
 s.eventLog.splice(14);
}
