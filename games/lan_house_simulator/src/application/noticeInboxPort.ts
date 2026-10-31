/** Read-only projection of the inbox. No notice or decision is changed here. */
import type {GameState} from "../sim/types.js";
import {missingWindowsLicenses} from "../sim/notices.js";
import {linuxUnlocked,LINUX_OCTOBER_DAY,LINUX_MAGAZINE_ENROLLMENT_COST,LINUX_MAGAZINE_ISSUE_COST,
 linuxNextMagazineDueDay,LINUX_MAGAZINE_TITLES,linuxDay} from "../sim/linuxQuest.js";
import {decisionOptions} from "../sim/decisions.js";
import {basicGamesLicenseCost} from "../sim/economy.js";

export interface NoticeActionButton{
 readonly kind:"button";
 readonly action:"read"|"programmer"|"windows"|"games"|"decision"|"linux-research";
 readonly text:string;readonly disabled:boolean;
 readonly noticeId?:string;readonly choiceId?:string;readonly title?:string;
}
export interface NoticeInfo {readonly kind:"hint"|"deadline"|"resolved";readonly text:string;}
export type NoticePresentationItem=NoticeActionButton|NoticeInfo;
export interface InboxLetter{
 readonly title:string;readonly body:string;readonly day:number;
 readonly severity:"info"|"warning"|"urgent";readonly read:boolean;
 readonly items:ReadonlyArray<NoticePresentationItem>;
}
export interface NoticeInboxSnapshot{readonly letters:ReadonlyArray<InboxLetter>}
export interface NoticeInboxPort{snapshot():NoticeInboxSnapshot}
export function createNoticeInboxPort(getState:()=>GameState):NoticeInboxPort {
 return {snapshot(){
  const s=getState();
  return {letters:(s.notices??[]).map(n=>{
   const items:NoticePresentationItem[]=[];
   if(!n.read)items.push({kind:"button",action:"read",noticeId:n.id,text:"Marcar como lida",disabled:false});
   if(n.id==="linux-forum-contact"){
    if(s.linuxMagazineSubscriptionDay===undefined)
     items.push({kind:"button",action:"linux-research",text:"Assinar revista Informática Livre · R$ "+LINUX_MAGAZINE_ENROLLMENT_COST,
      disabled:s.cash<LINUX_MAGAZINE_ENROLLMENT_COST,
      title:"Assinar seis revistas mensais; R$ "+LINUX_MAGAZINE_ISSUE_COST+
       " por edição entregue. Primeiro exemplar no fim de março, se assinado naquele mês."});
    else items.push({kind:"hint",text:linuxUnlocked(s)?
     "Seis revistas estudadas! Máquinas Linux prontas disponíveis na Loja → Computadores.":
     "Coleção Informática Livre: "+(s.linuxMagazineIssuesReceived??0)+"/6 edições recebidas. "+
     (linuxNextMagazineDueDay(s)!==null?
      "Próxima entrega após o dia "+linuxNextMagazineDueDay(s)+
      (linuxDay(s)>=linuxNextMagazineDueDay(s)!&&s.cash<LINUX_MAGAZINE_ISSUE_COST?
       " · falta R$ "+LINUX_MAGAZINE_ISSUE_COST+" no caixa.":" · R$ "+LINUX_MAGAZINE_ISSUE_COST+" por exemplar.") :
      "Todas recebidas. Estudar até outubro (dia "+LINUX_OCTOBER_DAY+") ou 30 dias após a última edição.")});
   }
   if(LINUX_MAGAZINE_TITLES.some(edition=>edition.id===n.id))
    items.push({kind:"resolved",text:"Edição impressa guardada na coleção: "+
     (s.linuxMagazineIssuesReceived??0)+"/6 recebidas · custo R$ "+LINUX_MAGAZINE_ISSUE_COST+" por exemplar."});
   if(n.id==="linux-forum-ready")
    items.push({kind:"resolved",text:linuxUnlocked(s)?
     "✓ Conhecimento concluído! Compre uma nova máquina Linux já montada na Loja → Computadores.":
     "Aguarde a conclusão da coleção."});
   if(n.id==="safety"&&!s.contentFilterInstalled)
    items.push({kind:"button",action:"programmer",text:"Contratar programador · R$ 320",disabled:s.cash<320});
   if((n.id==="windows"||n.id==="windows-fine")&&missingWindowsLicenses(s)>0)
    items.push({kind:"button",action:"windows",text:"Regularizar Windows",disabled:false});
   if((n.id==="games"||n.id==="copyright")&&!s.licensedGames)
    items.push({kind:"button",action:"games",text:"Regularizar jogos · "+
     basicGamesLicenseCost(s).toLocaleString("pt-BR",{style:"currency",currency:"BRL"}),disabled:false});
   const record=s.storyRecords?.find(r=>n.id===r.id||n.id===r.id+":followup");
   if(record&&(record.stage==="pending"||record.stage==="ending")){
    items.push({kind:"hint",text:record.stage==="pending"?
     "Consequências em acompanhamento: nova carta a partir do dia "+record.dueDay+".":
     "O resultado será registrado na correspondência a partir do dia "+record.dueDay+"."});
   }
   const options=decisionOptions(n.id,s);
   if(n.id==="electrical-inspection"&&s.electricalDeadlineDay!==undefined&&!n.resolved)
    items.push({kind:"deadline",text:s.electricalInspectionFineApplied?
     "Prazo vencido: multa já aplicada. Ainda é necessário regularizar.":
     (s.electricalExtensionUsed?"Prazo prorrogado até o dia ":"Prazo para regularizar até o dia ")+s.electricalDeadlineDay+"."});
   if(options.length){
    if(n.resolved)items.push({kind:"resolved",text:"✓ Decisão tomada: "+(options.find(o=>o.id===n.resolved)?.label??n.resolved)});
    else for(const option of options){
     if(n.id==="electrical-inspection"&&option.id==="electrical-defer"&&
      (s.electricalExtensionUsed||s.electricalInspectionFineApplied))continue;
     items.push({kind:"button",action:"decision",noticeId:n.id,choiceId:option.id,
      text:option.label+" — "+option.description,title:option.description,
      disabled:option.cost>0&&s.cash<option.cost});
    }
   }
   return {title:n.title,day:n.day,body:n.body,severity:n.severity,read:n.read,items};
  })};
 }};
}
