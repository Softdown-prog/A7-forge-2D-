import type {GameState,Result} from "./types.js";
import {DAY_MINUTES} from "./types.js";
import type {DecisionId} from "./decisions.js";
import type {StoryNoticeId} from "./storyEvents.js";
import {ERIC_FIRST_MAIL_ID,ERIC_FIRST_MAIL_TITLE,ERIC_FIRST_MAIL_BODY,ericFirstMailDue,
 ERIC_SECOND_MAIL_ID,ERIC_SECOND_MAIL_TITLE,ERIC_SECOND_MAIL_BODY,ericSecondMailDue} from "./ericStory.js";
import {isHistorical,priceIndex,yearFromMinutes} from "./historicalEconomy.js";
import {nextLinuxLetter,recordLinuxMail,isLinuxPc,type LinuxMailId} from "./linuxQuest.js";
import {isSporadicMailId,sporadicMailDue,recordMailDelivery,fixedYearMailWindowDue} from "./mailCalendar.js";
export type NoticeId="safety"|"windows"|"games"|"copyright"|"windows-fine"|"y2k-warning"|typeof ERIC_FIRST_MAIL_ID|typeof ERIC_SECOND_MAIL_ID|DecisionId|StoryNoticeId|LinuxMailId;
export interface GameNotice {
 id:NoticeId; title:string; body:string; day:number; read:boolean; resolved?:string; severity:"info"|"warning"|"urgent";
}
const day=(s:GameState)=>Math.floor(s.totalMinutes/DAY_MINUTES)+1;
const computerCount=(s:GameState)=>Math.max(3,Math.min(3+s.expansionLevel*2,s.installedPcs??(3+s.expansionLevel*2)))+(s.annexPcs?.length??0);
export function missingWindowsLicenses(s:GameState):number{
 return Array.from({length:computerCount(s)},(_,i)=>isLinuxPc(s,i)||s.pcWindowsLicenses?.[i]===true?0:1).reduce<number>((a,b)=>a+b,0);
}
export function unreadNotices(s:GameState):number{return (s.notices??[]).filter(n=>!n.read).length;}
function deliver(s:GameState,id:NoticeId,title:string,body:string,severity:GameNotice["severity"]="warning"):void{
 const notices=s.notices??(s.notices=[]);
 if(notices.some(n=>n.id===id))return;
 notices.unshift({id,title,body,day:day(s),read:false,severity});
 if(isSporadicMailId(id))recordMailDelivery(s,id);
 notices.splice(40);
 s.eventLog.unshift("D"+day(s)+" · Nova mensagem: "+title);
 s.eventLog.splice(14);
}
export function reviewNotices(s:GameState):void{
 const d=day(s);
 // One time-gated Linux correspondence per review, no artificial choices.
 const linux=nextLinuxLetter(s);
 if(linux){deliver(s,linux.id,linux.title,linux.body,"info");recordLinuxMail(s,linux.id);}
 // Eric é família, não um vendedor: primeiro contato narrativo, sem preço,
 // novo catálogo ou pressão para decidir. A leitura é opcional.
 if(!s.ericFirstMailDelivered&&s.notices?.some(n=>n.id===ERIC_FIRST_MAIL_ID))
  s.ericFirstMailDelivered=true;
 if(!s.ericFirstMailDelivered&&ericFirstMailDue(s)){
  deliver(s,ERIC_FIRST_MAIL_ID,ERIC_FIRST_MAIL_TITLE,ERIC_FIRST_MAIL_BODY,"info");
  s.ericFirstMailDelivered=true;
 }
 // Meses depois: carta pessoal, sem compra forçada ou recompensa.
 if(!s.ericSecondMailDelivered&&s.notices?.some(n=>n.id===ERIC_SECOND_MAIL_ID))
  s.ericSecondMailDelivered=true;
 if(!s.ericSecondMailDelivered&&ericSecondMailDue(s)){
  deliver(s,ERIC_SECOND_MAIL_ID,ERIC_SECOND_MAIL_TITLE,ERIC_SECOND_MAIL_BODY,"info");
  s.ericSecondMailDelivered=true;
 }
 // Evento histórico: aviso antes da virada de 1999 para 2000, sem retroatividade.
 if(!s.y2kNoticeDelivered&&s.notices?.some(n=>n.id==="y2k-warning"))s.y2kNoticeDelivered=true;
 if(!s.y2kNoticeDelivered&&fixedYearMailWindowDue(s,1999,331,350)){
   deliver(s,"y2k-warning","Especial de 1999: o Bug do Milênio",
     "Dezembro de 1999. O ano 2000 está chegando e o bairro inteiro comenta sobre o Bug do Milênio! Alguns computadores e programas antigos podem confundir 2000 com 1900. Antes da virada, faça cópias de segurança, confira o relógio e a data das máquinas e verifique os programas. Se algum PC precisar de reinstalação, programe sua formatação depois do expediente, com a estação desocupada e desligada. Não é preciso formatar todos: o importante é verificar a compatibilidade. Que venha o ano 2000!","info");
   s.y2kNoticeDelivered=true;
 }
 // Notificação única: a multa por prazo vencido não substitui regularização.
 if(s.electricalDeadlineDay!==undefined&&d>s.electricalDeadlineDay&&
    !s.electricalWiringRegularized&&!s.electricalInspectionFineApplied){
   s.electricalInspectionFineApplied=true;
   const fine=isHistorical(s)?Math.round(22*priceIndex(yearFromMinutes(s.totalMinutes))*100)/100:220;
   s.cash-=fine;s.expenses+=fine;s.reputation=Math.max(10,s.reputation-3);
   const n=s.notices?.find(n=>n.id==="electrical-inspection");
   if(n){
     n.severity="urgent";
     n.body+=" O prazo expirou; foi aplicada uma autuação de R$ "+fine.toFixed(2).replace(".",",")+". A multa não substitui a adequação elétrica.";
     n.read=false;
   }
   s.eventLog.unshift("D"+d+" · Bombeiros: prazo vencido, autuação elétrica de R$ "+fine.toFixed(2)+".");
   s.eventLog.splice(14);
 }
 if(sporadicMailDue(s,"safety")&&!s.contentFilterInstalled)deliver(s,"safety","Proteção para menores","Menores foram vistos entrando na lan house. Contrate um técnico para instalar o filtro de conteúdo. Sem proteção, poderá haver fiscalização.");
 if(sporadicMailDue(s,"windows")&&missingWindowsLicenses(s)>0)deliver(s,"windows","Licenças de Windows pendentes","Computadores estão funcionando sem licenças individuais. Regularize na aba Windows / Licenças. Prazo: 7 dias após receber esta carta.");
 if(sporadicMailDue(s,"games")&&!s.licensedGames)deliver(s,"games","Direitos autorais dos jogos","A lan house oferece jogos comerciais sem regularizar o catálogo. Licencie os jogos no painel Serviços. Prazo: 7 dias após receber esta carta.");
 const windowsWarning=s.notices?.find(n=>n.id==="windows");
 if(windowsWarning&&d>=windowsWarning.day+7&&missingWindowsLicenses(s)>0&&!s.windowsNoticeFine){
   s.windowsNoticeFine=true;const amount=210+60*missingWindowsLicenses(s);
   s.cash-=amount;s.expenses+=amount;s.reputation=Math.max(10,s.reputation-3);
   deliver(s,"windows-fine","Auto de fiscalização: Windows","Foi aplicada multa de R$ "+amount+" por computadores sem licença. O pagamento não substitui a compra das licenças.","urgent");
   s.eventLog.unshift("Fiscalização Windows: -R$ "+amount+".");
 }
 const gamesWarning=s.notices?.find(n=>n.id==="games");
 if(gamesWarning&&d>=gamesWarning.day+7&&!s.licensedGames&&!s.copyrightNoticeFine){
   s.copyrightNoticeFine=true;const amount=540;
   s.cash-=amount;s.expenses+=amount;s.reputation=Math.max(10,s.reputation-5);
   deliver(s,"copyright","Notificação de direitos autorais","Foi aplicada multa de R$ 540 por catálogo de jogos não licenciado. A dívida foi debitada mesmo se o caixa ficar negativo. Ainda é preciso licenciar os jogos.","urgent");
   s.eventLog.unshift("Autuação de direitos autorais: -R$ 540.");
 }
 s.eventLog.splice(14);
}
export function readNotice(s:GameState,id:string):boolean{
 const item=s.notices?.find(n=>n.id===id);if(!item)return false;
 item.read=true;return true;
}
export function hireContentProgrammer(s:GameState):Result{
 if(s.contentFilterInstalled)return {ok:false,message:"Filtro de conteúdo já instalado."};
 const cost=320;
 if(s.cash<cost)return {ok:false,message:"O programador custa R$ "+cost+"."};
 s.cash-=cost;s.expenses+=cost;s.contentFilterInstalled=true;
 return {ok:true,message:"Programador contratado por R$ 320. Bloqueio de conteúdo instalado nas máquinas."};
}
