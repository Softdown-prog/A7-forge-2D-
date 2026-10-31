/** Forum Linux 1999: six paid monthly print magazines, then a separate study period.
 * The simulation uses 12 equal 30-day months (1999/03/01 = day 421).
 * The Linux-ready machines are NEW physical PCs; Windows stations are untouched.
 */
import type {GameState,Result} from "./types.js";
import {DAY_MINUTES} from "./types.js";
import {linuxMachineFor,validLinuxMachines} from "./linuxMachines.js";
import {stationUpgradeIssue,stationPowerCount,stationReadyForSessions} from "./stationPower.js";

export const LINUX_CONTACT_DAY=421;
export const LINUX_AUGUST_DAY=571;
export const LINUX_OCTOBER_DAY=631;
export const LINUX_MAGAZINE_ENROLLMENT_COST=8;
export const LINUX_MAGAZINE_ISSUE_COST=12;
export const LINUX_MAGAZINE_TITLES=[
 {id:"linux-magazine-01",month:"março",title:"O que é Linux?",lesson:"O primeiro exemplar explica software livre, distribuições e por que os estudantes usam Unix e Linux. Tony descobre que nem todo computador precisa ter Windows."},
 {id:"linux-magazine-02",month:"abril",title:"Por dentro do computador",lesson:"A edição mostra processador, memória, disco rígido e requisitos de uma estação para programação. Tony começa a reconhecer equipamentos próprios de estudo."},
 {id:"linux-magazine-03",month:"maio",title:"Terminal e comandos",lesson:"Tony aprende caminhos, arquivos, diretórios e comandos de terminal. Anota exemplos da revista e descobre como navegar sem usar apenas janelas."},
 {id:"linux-magazine-04",month:"junho",title:"Permissões e usuários",lesson:"Chega a matéria sobre contas de usuário, permissões, segurança básica e o hábito de cuidar dos arquivos de cada estudante."},
 {id:"linux-magazine-05",month:"julho",title:"Editores e programação",lesson:"Os exemplos ensinam a usar um editor de textos, compilar programas simples e compreender bibliotecas e ferramentas disponíveis no Linux."},
 {id:"linux-magazine-06",month:"agosto",title:"Montando um laboratório Linux",lesson:"A última edição da coleção ensina a planejar bancadas, terminais, redes locais e estações para estudantes. Tony guarda os seis exemplares e passa setembro estudando antes de abrir o serviço."}
] as const;
export const LINUX_MAIL_IDS=[
 "linux-forum-contact","linux-magazine-01","linux-magazine-02","linux-magazine-03",
 "linux-magazine-04","linux-magazine-05","linux-magazine-06","linux-forum-ready",
 // Accepted when importing test saves created during the earlier draft.
 "linux-forum-guide","linux-forum-pilot"
] as const;
export type LinuxMailId=typeof LINUX_MAIL_IDS[number];
export type PcOperatingSystem="windows"|"linux";
export interface LinuxLetter{id:LinuxMailId;title:string;body:string}
export const linuxDay=(s:Pick<GameState,"totalMinutes">):number=>Math.floor(s.totalMinutes/DAY_MINUTES)+1;
const money=(n:number)=>Math.round(n*100)/100;
const subscriptionDay=(s:GameState)=>s.linuxMagazineSubscriptionDay;
const issueCount=(s:GameState)=>s.linuxMagazineIssuesReceived??0;
const magazineId=(id:string)=>LINUX_MAGAZINE_TITLES.findIndex(x=>x.id===id);
const monthEnd=(day:number)=>Math.ceil(day/30)*30;
export function linuxNextMagazineDueDay(s:GameState):number|null{
 const subscribed=subscriptionDay(s),received=issueCount(s);
 if(subscribed===undefined||received>=LINUX_MAGAZINE_TITLES.length)return null;
 const scheduled=monthEnd(subscribed)+received*30;
 return Math.max(scheduled,(s.linuxMagazineLastDeliveryDay??(subscribed-30))+30);
}
export function linuxUnlocked(s:GameState):boolean{
 const last=s.linuxMagazineLastDeliveryDay;
 return s.economyVersion===2&&subscriptionDay(s)!==undefined&&
   issueCount(s)===LINUX_MAGAZINE_TITLES.length&&Number.isInteger(last)&&
   linuxDay(s)>=Math.max(LINUX_OCTOBER_DAY,last!+30);
}
export const isLinuxPc=(s:Pick<GameState,"pcOperatingSystems">,index:number)=>s.pcOperatingSystems?.[index]==="linux";
export const linuxInstalledOnPc=(s:Pick<GameState,"pcLinuxInstalled">,index:number)=>s.pcLinuxInstalled?.[index]===true;
export function operationalLinuxPcs(s:GameState):number[]{
 return Array.from({length:stationPowerCount(s)},(_,i)=>i).filter(i=>isLinuxPc(s,i)&&stationReadyForSessions(s,i));
}
function delivered(s:GameState,id:LinuxMailId):boolean{return !!s.linuxMailSeenIds?.includes(id);}
export function nextLinuxLetter(s:GameState):LinuxLetter|null{
 if(s.economyVersion!==2||linuxDay(s)<LINUX_CONTACT_DAY)return null;
 if(!delivered(s,"linux-forum-contact"))return{
  id:"linux-forum-contact",title:"Fórum da cidade · Vocês têm Linux?",
  body:"Olá, Tony! Nosso fórum reúne estudantes e programadores da cidade. Procuramos uma lan house com máquinas prontas para Linux, para estudar e programar. Sabemos que o assunto ainda é novidade por aí. Na Banca da Praça Central, aqui da cidade, é possível assinar a coleção mensal fictícia 'Informática Livre'. São seis edições de março a agosto, sobre Linux e equipamentos. Depois de estudar, você poderia receber nosso grupo?"
 };
 if(subscriptionDay(s)===undefined)return null;
 const due=linuxNextMagazineDueDay(s),n=issueCount(s);
 if(due!==null&&linuxDay(s)>=due&&s.cash>=LINUX_MAGAZINE_ISSUE_COST){
  const magazine=LINUX_MAGAZINE_TITLES[n]!;
  return{id:magazine.id,title:"Revista Informática Livre · edição "+(n+1)+"/6 — "+magazine.month,
   body:"A nova revista impressa chegou da banca! "+magazine.title+". "+magazine.lesson+
    " Valor da edição: R$ "+LINUX_MAGAZINE_ISSUE_COST+". Tony pode guardá-la para consultar depois."};
 }
 if(linuxUnlocked(s)&&!delivered(s,"linux-forum-ready"))return{
  id:"linux-forum-ready",title:"Fórum Linux · Tony concluiu seus estudos!",
  body:"Outubro de 1999 (ou depois, caso a coleção tenha atrasado). Tony recebeu as seis edições e teve tempo para estudá-las. A Banca da Praça Central e o fórum indicaram duas máquinas completas, próprias para Linux. A loja agora vende Bancada Linux 99 e Estação Programador 99, já com Linux, bancada, gabinete, monitor CRT e cadeira. Seus computadores Windows continuam intactos."
 };
 return null;
}
/** Called ONLY after the corresponding in-game notice has been delivered.
 * Exactly one issue is charged per actual arrival, never on every simulation frame.
 */
export function recordLinuxMail(s:GameState,id:LinuxMailId):void{
 if(delivered(s,id))return;
 const n=magazineId(id);
 if(n>=0){
  if(subscriptionDay(s)===undefined||n!==issueCount(s)||s.cash<LINUX_MAGAZINE_ISSUE_COST||
    linuxDay(s)<(linuxNextMagazineDueDay(s)??Infinity))return;
  s.cash=money(s.cash-LINUX_MAGAZINE_ISSUE_COST);
  s.expenses=money(s.expenses+LINUX_MAGAZINE_ISSUE_COST);
  s.linuxMagazineIssuesReceived=n+1;
  s.linuxMagazineLastDeliveryDay=linuxDay(s);
 }
 (s.linuxMailSeenIds??=[]).push(id);
}
/** Subscribing from the email is an explicit, paid action, not an automatic reward. */
export function startLinuxResearch(s:GameState):Result{
 if(s.economyVersion!==2||linuxDay(s)<LINUX_CONTACT_DAY||
   !delivered(s,"linux-forum-contact"))
  return{ok:false,message:"Aguarde o e-mail do Fórum Linux em março de 1999."};
 if(subscriptionDay(s)!==undefined)return{ok:false,message:"A assinatura da coleção Linux já está ativa."};
 if(s.cash<LINUX_MAGAZINE_ENROLLMENT_COST)
  return{ok:false,message:"A assinatura exige R$ "+LINUX_MAGAZINE_ENROLLMENT_COST+" de adesão. Caixa insuficiente."};
 s.cash=money(s.cash-LINUX_MAGAZINE_ENROLLMENT_COST);
 s.expenses=money(s.expenses+LINUX_MAGAZINE_ENROLLMENT_COST);
 s.linuxMagazineSubscriptionDay=linuxDay(s);
 s.linuxResearchStartedDay=linuxDay(s);
 s.linuxMagazineIssuesReceived=0;
 const notice=s.notices?.find(n=>n.id==="linux-forum-contact");
 if(notice)notice.resolved="linux-magazine-subscribed";
 return{ok:true,message:"Tony assinou a coleção Informática Livre! Adesão de R$ "+LINUX_MAGAZINE_ENROLLMENT_COST+
  " e R$ "+LINUX_MAGAZINE_ISSUE_COST+" por edição recebida, até seis exemplares. Em março de 1999, a primeira chega no fim do mês; as máquinas Linux serão liberadas no mínimo em outubro."};
}
const setPcArray=(s:GameState):void=>{
 const count=stationPowerCount(s);
 s.pcLinuxInstalled=Array.from({length:count},(_,i)=>s.pcLinuxInstalled?.[i]===true);
 s.pcOperatingSystems=Array.from({length:count},(_,i)=>s.pcOperatingSystems?.[i]==="linux"?"linux":"windows");
};
export function installLinux(s:GameState,index:number):Result{
 if(!linuxUnlocked(s))return{ok:false,message:"Conclua as seis revistas e aguarde outubro de 1999 para acessar as máquinas Linux."};
 const issue=stationUpgradeIssue(s,index);if(issue)return{ok:false,message:issue};
 if(s.gpuGameInstallJobs?.some(j=>j.pc===index))return{ok:false,message:"Aguarde a instalação atual terminar."};
 if(!linuxMachineFor(s,index))return{ok:false,message:"Este PC é Windows; compre uma nova estação Linux pronta na loja."};
 if(isLinuxPc(s,index))return{ok:false,message:"Este PC já usa Linux."};
 setPcArray(s);s.pcLinuxInstalled![index]=true;s.pcOperatingSystems![index]="linux";
 return{ok:true,message:"PC "+(index+1)+" reiniciado em Linux."};
}
export function bootWindows(s:GameState,index:number):Result{
 const issue=stationUpgradeIssue(s,index);if(issue)return{ok:false,message:issue};
 if(!isLinuxPc(s,index)||!linuxInstalledOnPc(s,index))return{ok:false,message:"Esta estação não está usando Linux."};
 if(s.pcWindowsLicenses?.[index]!==true)return{ok:false,message:"Compre uma licença Windows para esta estação antes de alternar."};
 setPcArray(s);s.pcOperatingSystems![index]="windows";
 return{ok:true,message:"PC "+(index+1)+" iniciou Windows. Linux permanece instalado."};
}
export function validLinuxState(s:Partial<GameState>):boolean{
 const ids=s.linuxMailSeenIds,started=s.linuxResearchStartedDay,sub=s.linuxMagazineSubscriptionDay;
 const received=s.linuxMagazineIssuesReceived,last=s.linuxMagazineLastDeliveryDay;
 const now=Math.floor((s.totalMinutes??0)/DAY_MINUTES)+1;
 if(ids!==undefined&&(!Array.isArray(ids)||ids.length>LINUX_MAIL_IDS.length||
   ids.some(id=>typeof id!=="string"||!(LINUX_MAIL_IDS as readonly string[]).includes(id))||
   new Set(ids).size!==ids.length))return false;
 if(started!==undefined&&(!Number.isInteger(started)||started<LINUX_CONTACT_DAY||
   started>now||!ids?.includes("linux-forum-contact")))return false;
 if(sub!==undefined&&(!Number.isInteger(sub)||sub<LINUX_CONTACT_DAY||sub>now||
   !ids?.includes("linux-forum-contact")||started!==sub))return false;
 if(sub===undefined&&(received!==undefined||last!==undefined||ids?.some(id=>magazineId(id)>=0)))return false;
 if(received!==undefined&&(!Number.isInteger(received)||received<0||received>6))return false;
 if(sub!==undefined&&received===undefined)return false;
 if(last!==undefined&&(!Number.isInteger(last)||last<sub!||last>now))return false;
 if(received===0&&last!==undefined||received!==undefined&&received>0&&last===undefined)return false;
 if(received!==undefined&&ids){
  for(let i=0;i<6;i++)if(ids.includes(LINUX_MAGAZINE_TITLES[i]!.id)!==(i<received))return false;
 }
 if(ids?.includes("linux-forum-ready")&&!(received===6&&last!==undefined&&
    now>=Math.max(LINUX_OCTOBER_DAY,last+30)))return false;
 if(!validLinuxMachines(s.pcLinuxModels))return false;
 const installed=s.pcLinuxInstalled,modes=s.pcOperatingSystems;
 if(installed!==undefined&&(!Array.isArray(installed)||installed.length>200||
   installed.some(v=>typeof v!=="boolean")))return false;
 if(modes!==undefined&&(!Array.isArray(modes)||modes.length>200||
   modes.some(v=>v!=="windows"&&v!=="linux")))return false;
 if(s.linuxSessions!==undefined&&(!Number.isSafeInteger(s.linuxSessions)||s.linuxSessions<0||s.linuxSessions>1e7))return false;
 if(s.linuxRevenue!==undefined&&(!Number.isFinite(s.linuxRevenue)||s.linuxRevenue<0||s.linuxRevenue>1e9||
  Math.abs(s.linuxRevenue*100-Math.round(s.linuxRevenue*100))>1e-4))return false;
 if((installed?.some(Boolean)||modes?.includes("linux")||s.pcLinuxModels?.some(Boolean))&&
   !(s.economyVersion===2&&sub!==undefined&&received===6&&last!==undefined&&
     now>=Math.max(LINUX_OCTOBER_DAY,last+30)))return false;
 for(let i=0;i<(modes?.length??0);i++)if(modes?.[i]==="linux"&&
   (installed?.[i]!==true||!linuxMachineFor(s,i)))return false;
 for(let i=0;i<(installed?.length??0);i++)if(installed?.[i]===true&&!linuxMachineFor(s,i))return false;
 for(let i=0;i<(s.pcLinuxModels?.length??0);i++)if(s.pcLinuxModels?.[i]!==null&&
   s.pcLinuxModels?.[i]!==undefined&&installed?.[i]!==true)return false;
 return true;
}
