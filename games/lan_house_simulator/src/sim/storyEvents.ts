/** Story orchestration and effects; story catalogue lives in one module per event. */
import type {GameState,Result,Item} from "./types.js";
import type {GameNotice} from "./notices.js";
import {DAY_MINUTES} from "./types.js";
import {isHistorical,priceIndex,yearFromMinutes} from "./historicalEconomy.js";
import {hasPlayableGpuGame} from "./gpuGames.js";
import {CHAIN_IDS,LEGACY_CHAIN_IDS,type StoryId,type StoryChainId,type LegacyChainId,type StoryNoticeId,type StoryOutcome,type StoryImpact,type StoryRecord} from "./stories/types.js";
import {STORIES} from "./stories/catalog.js";
import {LEGACY_STORIES} from "./stories/legacy.js";
import {FOLLOWUP_LABELS,FOLLOWUP_KEYS,PERSISTENT_ESCALATIONS} from "./stories/followups.js";

// Preserve the public API and the serialized IDs consumed by existing game saves.
export {STORY_IDS,LEGACY_CHAIN_IDS,CHAIN_IDS} from "./stories/types.js";
export type {StoryId,StoryChainId,LegacyChainId,StoryNoticeId,StoryOutcome,StoryImpact,StoryChoice,StoryDefinition,StoryRecord,StoryVisitorEffect} from "./stories/types.js";
export {STORIES} from "./stories/catalog.js";

const chainDefinition=(id:StoryChainId)=>isStoryId(id)?STORIES[id]:LEGACY_STORIES[id];
export const isChainId=(id:string):id is StoryChainId=>(CHAIN_IDS as readonly string[]).includes(id);
export function registerLegacyStory(s:GameState,id:string,choiceId:string,choiceLabel?:string):void{
 if(!(LEGACY_CHAIN_IDS as readonly string[]).includes(id))return;
 const key=id as LegacyChainId;
 if((s.storyRecords??[]).some(r=>r.id===key))return;
 const outcomes:Record<LegacyChainId,Record<string,StoryOutcome>>={
  "supplier-offer":{"supplier-accept":"good","supplier-decline":"mixed"},
  "school-booking":{"school-accept":"good","school-decline":"mixed"},
  "gaming-tournament":{"tournament-host":"good","tournament-small":"mixed","tournament-decline":"bad"},
  "equipment-fault":{"fault-express":"good","fault-basic":"mixed","fault-delay":"bad"}
 };
 const outcome=outcomes[key][choiceId];
 if(!outcome)return;
 (s.storyRecords??=[]).push({id:key,choice:choiceId,choiceLabel,outcome,stage:"pending",dueDay:DAY(s)+2+((s.rng>>>6)%4)});
}
const DAY=(s:GameState)=>Math.floor(s.totalMinutes/DAY_MINUTES)+1;
export function isStoryId(id:string):id is StoryId{return Object.prototype.hasOwnProperty.call(STORIES,id);}
export function isStoryNoticeId(id:string):id is StoryNoticeId{
 return isStoryId(id)||((id.endsWith(":followup")||id.endsWith(":report"))&&isChainId(id.replace(/:(followup|report)$/,"")));
}
const actualCost=(s:GameState,base:number)=>isHistorical(s)?Math.round(base/10*priceIndex(yearFromMinutes(s.totalMinutes))*100)/100:base;
const money=(cost:number)=>"R$ "+cost.toFixed(2).replace(".",",");
function recordFor(s:GameState,id:StoryChainId):StoryRecord|undefined{
 return s.storyRecords?.find(record=>record.id===id);
}
/** Regra do saldo nunca aceita duas execuções de uma decisão já resolvida. */
function purchase(s:GameState,cost:number):boolean{
 if(cost<=0)return true; // Permite decidir gratuitamente mesmo com caixa negativo.
 if(s.cash<cost)return false;
 s.cash=Math.round((s.cash-cost)*100)/100;
 s.expenses=Math.round((s.expenses+cost)*100)/100;
 return true;
}
function applyImpact(s:GameState,id:string,impact:StoryImpact|undefined):void{
 if(!impact)return;
 if(impact.reputation)s.reputation=Math.max(10,Math.min(100,s.reputation+impact.reputation));
 if(impact.wear){
  const count=Math.max(3,Math.min(3+s.expansionLevel*2,s.installedPcs??3+s.expansionLevel*2))+(s.annexPcs?.length??0);
  s.pcWear=Array.from({length:count},(_,i)=>Math.max(0,Math.min(100,(s.pcWear?.[i]??0)+impact.wear!)));
 }
 if(impact.stock)for(const item of ["soda","candy","snacks"] as Item[]){
  const change=impact.stock[item]??0;
  s.inventory[item]=Math.max(0,s.inventory[item]+change);
 }
 if(impact.offlineMinutes)s.offlineUntil=Math.max(s.offlineUntil,s.totalMinutes+impact.offlineMinutes);
 if(impact.energyBill)s.energyAccrued=(s.energyAccrued??0)+actualCost(s,impact.energyBill);
 if(impact.visitors&&impact.visitorDays){
  // Efeito econômico concreto, expirável e serializável; não altera RNG.
  const effects=s.storyVisitorEffects??(s.storyVisitorEffects=[]);
  const untilDay=DAY(s)+impact.visitorDays;
  const existing=effects.findIndex(effect=>effect.id===id);
  if(existing>=0)effects.splice(existing,1);
  effects.push({id,factor:impact.visitors,untilDay});
  if(effects.length>32)effects.splice(0,effects.length-32);
 }
}
export function storyVisitorMultiplier(s:GameState):number {
 const day=DAY(s);
 const active=(s.storyVisitorEffects??[]).filter(e=>e.untilDay>=day);
 return Math.max(.55,Math.min(1.4,active.reduce((factor,e)=>factor*e.factor,1)));
}
export function storyOptions(s:GameState,id:string):Array<{id:string;label:string;cost:number;description:string}>{
 if(isStoryId(id))return STORIES[id].choices.map(o=>({...o,cost:actualCost(s,o.cost),
  label:o.cost?o.label+" · "+money(actualCost(s,o.cost)):o.label}));
 if(!id.endsWith(":followup"))return [];
 const storyId=id.slice(0,-":followup".length);
 if(!isChainId(storyId))return [];
 const r=recordFor(s,storyId);
 if(!r||r.stage!=="awaiting")return [];
 if(r.outcome==="bad"&&chainDefinition(storyId).category==="opportunity")return [
  {id:"story-reconnect",
   label:storyId==="gpu-games-2005"?"Retomar pesquisa de jogos · "+money(actualCost(s,40)):"Retomar contato · "+money(actualCost(s,40)),
   cost:actualCost(s,40),
   description:storyId==="gpu-games-2005"?"Consulta o interesse pelos novos jogos sem comprar GPU ou licença":"Tenta recuperar a oportunidade de divulgação ou parceria"},
  {id:"story-let-go",label:"Encerrar o assunto",cost:0,description:"Sem punição por recusar uma parceria opcional"}
 ];
 // Duas ações reais no retorno; o estado criado pela escolha anterior muda as alternativas.
 const outcomes:Record<StoryOutcome,Array<[string,string,number,string]>>={
  good:[["consolidate","Consolidar a melhoria",65,"Novo investimento melhora a confiança e atrai clientes"],
        ["observe","Manter a solução atual",0,"Preserva os benefícios já conquistados"]],
  mixed:[["complete","Finalizar a correção",90,"Resolve a pendência e recupera confiança"],
         ["maintain","Continuar monitorando",0,"Risco residual de desgaste e perda de procura"]],
  bad:[["recover","Corrigir depois do agravamento",170,"Intervenção tardia reduz os danos"],
       ["persist","Continuar ignorando",0,"Prejuízo adicional e perda de confiança"]]
 };
 return outcomes[r.outcome].map(([choiceId,label,baseCost,description])=>
  ({id:"story-"+choiceId,
   label:(isStoryId(storyId)?FOLLOWUP_LABELS[storyId][FOLLOWUP_KEYS.indexOf(choiceId)]??label:label)+
     (baseCost?" · "+money(actualCost(s,baseCost)):""),
   cost:actualCost(s,baseCost),
   description:storyId==="gpu-games-2005"&&choiceId==="maintain"
    ?"Continuar pesquisa sem prejuízo, mesmo sem jogo avançado licenciado":description}));
}
export function chooseStory(s:GameState,noticeId:string,choiceId:string):Result{
 const n=s.notices?.find(x=>x.id===noticeId);
 if(!n||n.resolved)return {ok:false,message:"Esta carta não está disponível ou já foi concluída."};
 if(isStoryId(noticeId)){
  if(recordFor(s,noticeId))return {ok:false,message:"Esta história já começou."};
  const c=STORIES[noticeId].choices.find(x=>x.id===choiceId);
  if(!c)return {ok:false,message:"Opção desconhecida."};
  const cost=actualCost(s,c.cost);
  if(!purchase(s,cost))return {ok:false,message:"Caixa insuficiente: "+money(cost)+"."};
  // Divulgação de títulos GPU só aumenta a procura se existir uma licença
  // avançada utilizável em algum PC. A pesquisa/preparação pode ocorrer antes.
  const ready=noticeId!=="gpu-games-2005"||hasPlayableGpuGame(s);
  const startImpact=!ready&&c.impact?{...c.impact,visitors:undefined,visitorDays:undefined}:c.impact;
  applyImpact(s,noticeId+":start",startImpact);
  (s.storyRecords??=[]).push({id:noticeId,choice:c.id,choiceLabel:c.label,outcome:c.outcome,
   stage:"pending",dueDay:DAY(s)+2+((s.rng>>>5)%4)});
  if(!(s.storySeenIds??=[]).includes(noticeId))s.storySeenIds.push(noticeId);
  n.resolved=c.id;n.read=true;
  s.eventLog.unshift("D"+DAY(s)+" · "+STORIES[noticeId].title+": "+c.label+". Uma resposta chegará depois.");
  s.eventLog.splice(14);
  return {ok:true,message:"Decisão registrada. "+c.description+". Haverá um desdobramento."};
 }
 if(!noticeId.endsWith(":followup"))return {ok:false,message:"Carta sem alternativas."};
 const base=noticeId.slice(0,-":followup".length);
 if(!isChainId(base))return {ok:false,message:"História desconhecida."};
 const record=recordFor(s,base);
 if(!record||record.stage!=="awaiting")return {ok:false,message:"Desdobramento indisponível."};
 const option=storyOptions(s,noticeId).find(o=>o.id===choiceId);
 if(!option)return {ok:false,message:"Opção desconhecida."};
 if(!purchase(s,option.cost))return {ok:false,message:"Caixa insuficiente: "+money(option.cost)+"."};
 const kind=choiceId.slice("story-".length);
 let impact:StoryImpact;
 let ending:string;
 if(kind==="reconnect"){impact={reputation:1,visitors:1.04,visitorDays:7};ending="A parceria foi retomada de forma modesta." ;}
 else if(kind==="let-go"){impact={};ending="A parceria não seguiu adiante, sem prejudicar a lan house." ;}
 else if(kind==="consolidate"){impact={reputation:2,visitors:1.08,visitorDays:12};ending="Investimento consolidado; o bairro percebe a melhoria.";}
 else if(kind==="observe"){impact={reputation:1};ending="Medida preservada sem novo gasto; os benefícios já obtidos permanecem.";}
 else if(kind==="complete"){impact={reputation:2,visitors:1.05,visitorDays:8};ending="Pendência finalmente resolvida; a confiança começou a se recuperar.";}
 else if(kind==="maintain"){impact={reputation:-1,wear:3,visitors:.97,visitorDays:9};ending="A solução parcial deixou custos e preocupação para o proprietário.";}
 else if(kind==="recover"){impact={reputation:1,visitors:1.02,visitorDays:7};ending="Correção tardia concluída, mas os danos anteriores não são desfeitos.";}
 else if(kind==="persist"){impact={reputation:-5,visitors:.82,visitorDays:18,...(PERSISTENT_ESCALATIONS[base]??{})};ending="O problema se agravou. Clientes comentam a situação e a procura cai por vários dias.";}
 else return {ok:false,message:"Opção desconhecida."};
 // Esta carta é uma oportunidade, não uma infração. Esperar ou seguir
 // pesquisando não estraga computadores nem pune quem não tem GPU.
 if(base==="gpu-games-2005"){
  if(kind==="maintain"){
   impact={};ending="Tony continuou acompanhando o interesse, sem gastos nem prejuízos para o salão.";
  }else if(!hasPlayableGpuGame(s)){
   impact={...impact,visitors:undefined,visitorDays:undefined};
   ending="A iniciativa foi registrada, mas a procura por jogos avançados só aumenta quando houver licença e PC compatível.";
  }
 }
 applyImpact(s,base+":followup",impact);
 record.stage="ending";record.followupChoice=choiceId;record.followupLabel=option.label;record.finalOutcome=kind==="persist"?"bad":kind==="maintain"?"mixed":kind==="let-go"?"mixed":"good";
 record.dueDay=DAY(s)+2+((s.rng>>>9)%3);
 n.resolved=choiceId;n.read=true;
 n.severity=record.finalOutcome==="bad"?"urgent":"info";
 s.eventLog.unshift("D"+DAY(s)+" · "+chainDefinition(base).title+": "+ending);
 s.eventLog.splice(14);
 return {ok:true,message:ending+" A conclusão será registrada na correspondência."};
}
function send(s:GameState,id:StoryNoticeId,title:string,body:string,severity:GameNotice["severity"]):void{
 const list=s.notices??(s.notices=[]);
 if(list.some(n=>n.id===id))return;
 list.unshift({id,title,body,day:DAY(s),read:false,severity});
 if(list.length>40)list.length=40;
 s.eventLog.unshift("D"+DAY(s)+" · Carta: "+title);
 s.eventLog.splice(14);
}
export function processStoryFollowups(s:GameState):void{
 const today=DAY(s);
 // A fila é independente do sorteio de novas propostas e não consome RNG.
 for(const record of s.storyRecords??[]){
  if(record.dueDay>today)continue;
  const def=chainDefinition(record.id);
  if(record.stage==="pending"){
   send(s,`${record.id}:followup`,"Desdobramento: "+def.title,def.developments[record.outcome]+
    " Sua decisão teve consequências. Como deseja responder agora?",record.outcome==="bad"?"urgent":"warning");
   record.stage="awaiting";
  }else if(record.stage==="ending"){
   const outcomes:Record<StoryOutcome,string>={
    good:"A situação foi acompanhada nos dias seguintes e está estabilizada. Seu investimento ou cuidado gerou resultado.",
    mixed:"O episódio terminou com pendências e gastos indiretos. A decisão teve reflexo na administração.",
    bad:"A ocorrência deixou consequências para os equipamentos e para a confiança do bairro. A queda de procura será temporária, mas real."
   };
   const gpuNote=record.id==="gpu-games-2005"
    ?" Os jogos avançados continuam sujeitos à compra de licença e à compatibilidade de GPU/Windows em cada estação.":"";
   const conclusion=record.id==="gpu-games-2005"
    ?record.finalOutcome==="good"
      ?"Tony concluiu a etapa de pesquisa ou divulgação. A decisão não instalou equipamentos nem gerou licenças automaticamente."
      :"Tony continuou pesquisando ou decidiu aguardar, sem novas penalidades ou gastos indiretos."
    :outcomes[record.finalOutcome??"mixed"];
   send(s,`${record.id}:report`,"Conclusão: "+def.title,
    "Sua primeira decisão: "+(record.choiceLabel??record.choice)+". Depois: "+(record.followupLabel??record.followupChoice??"sem resposta")+". "+conclusion+gpuNote,
    record.finalOutcome==="bad"?"warning":"info");
   const n=s.notices?.find(x=>x.id===`${record.id}:report`);
   if(n)n.resolved="summary";
   record.stage="done";
  }
 }
}
export function storySeen(s:GameState,id:StoryId):boolean{
 return (s.storySeenIds??[]).includes(id)||(s.storyRecords??[]).some(r=>r.id===id);
}

