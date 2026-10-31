/** Fórum Linux 1999: correspondence and calendar-only research, independent of customer RNG.
 * Calendar has 12 * 30 days; mission remains available on old saves resumed later.
 */
import type {GameState,Result} from "./types.js";
import {DAY_MINUTES} from "./types.js";
import {linuxMachineFor,validLinuxMachines} from "./linuxMachines.js";
import {stationUpgradeIssue,stationPowerCount,stationReadyForSessions} from "./stationPower.js";
export const LINUX_CONTACT_DAY=360+60+1; // 1 March 1999, absolute campaign day 421
export const LINUX_AUGUST_DAY=360+210+1; // 1 August 1999, absolute campaign day 571
export const LINUX_MAIL_IDS=["linux-forum-contact","linux-forum-guide","linux-forum-pilot","linux-forum-ready"] as const;
export type LinuxMailId=typeof LINUX_MAIL_IDS[number];
export type PcOperatingSystem="windows"|"linux";
export interface LinuxLetter {id:LinuxMailId;title:string;body:string}
export const linuxDay=(s:Pick<GameState,"totalMinutes">):number=>Math.floor(s.totalMinutes/DAY_MINUTES)+1;
export function linuxUnlocked(s:GameState):boolean{
 const day=s.linuxResearchStartedDay;
 return s.economyVersion===2&&Number.isInteger(day)&&day!==undefined&&day>=LINUX_CONTACT_DAY&&
  linuxDay(s)>=Math.max(LINUX_AUGUST_DAY,day!+110);
}
export const isLinuxPc=(s:Pick<GameState,"pcOperatingSystems">,index:number):boolean=>s.pcOperatingSystems?.[index]==="linux";
export const linuxInstalledOnPc=(s:Pick<GameState,"pcLinuxInstalled">,index:number):boolean=>s.pcLinuxInstalled?.[index]===true;
export function operationalLinuxPcs(s:GameState):number[]{
 return Array.from({length:stationPowerCount(s)},(_,i)=>i).filter(i=>isLinuxPc(s,i)&&stationReadyForSessions(s,i));
}
function delivered(s:GameState,id:LinuxMailId):boolean{return !!s.linuxMailSeenIds?.includes(id);}
export function nextLinuxLetter(s:GameState):LinuxLetter|null{
 if(s.economyVersion!==2||linuxDay(s)<LINUX_CONTACT_DAY)return null;
 if(!delivered(s,"linux-forum-contact"))return {
  id:"linux-forum-contact",title:"Fórum da cidade · Vocês têm Linux?",
  body:"Olá, Tony! Somos estudantes, programadores e curiosos que conversam num fórum de Linux da cidade. Procuramos uma lan house com PCs Linux para estudar programação e trocar ideias. Você tem alguma máquina Linux? Tony lê o e-mail e percebe que nem sabe como esse sistema funciona. Talvez seja hora de pesquisar."
 };
 const start=s.linuxResearchStartedDay;
 if(start===undefined)return null;
 if(linuxDay(s)>=start+30&&!delivered(s,"linux-forum-guide"))return {
  id:"linux-forum-guide",title:"Fórum Linux · As primeiras descobertas",
  body:"O fórum enviou explicações sobre software livre, distribuições e comandos. Tony entende que Linux não é um computador diferente: é um sistema operacional que pode ser instalado num PC. Os estudantes prometem ajudar no próximo passo."
 };
 if(linuxDay(s)>=start+75&&!delivered(s,"linux-forum-pilot"))return {
  id:"linux-forum-pilot",title:"Fórum Linux · Preparando um teste",
  body:"Um integrante do fórum explicou como preparar a mídia de instalação e conferir se o hardware da lan house suporta Linux. Tony começa a planejar uma estação experimental. Ainda é preciso esperar a pesquisa amadurecer."
 };
 if(linuxUnlocked(s)&&!delivered(s,"linux-forum-ready"))return {
  id:"linux-forum-ready",title:"Fórum Linux · Estações liberadas!",
  body:"Pesquisa concluída! Os estudantes ajudaram Tony a conhecer bancadas próprias para Linux. A partir de agosto de 1999, a loja oferece dois modelos de computador novos, já com Linux pronto para programar. Eles ocupam vagas físicas, com mesa, monitor e cadeira, sem alterar os PCs Windows antigos."
 };
 return null;
}
export function recordLinuxMail(s:GameState,id:LinuxMailId):void{
 if(!s.linuxMailSeenIds?.includes(id))(s.linuxMailSeenIds??=[]).push(id);
}
export function startLinuxResearch(s:GameState):Result{
 if(s.economyVersion!==2||linuxDay(s)<LINUX_CONTACT_DAY||
    !s.linuxMailSeenIds?.includes("linux-forum-contact"))
  return {ok:false,message:"Aguarde o contato do Fórum Linux a partir de março de 1999."};
 if(s.linuxResearchStartedDay!==undefined)return {ok:false,message:"Tony já está estudando Linux."};
 s.linuxResearchStartedDay=linuxDay(s);
 const mail=s.notices?.find(n=>n.id==="linux-forum-contact");
 if(mail)mail.resolved="linux-research-started";
 return {ok:true,message:"Tony começou a pesquisar Linux. O fórum voltará a escrever conforme os meses passarem; a instalação só será liberada a partir de agosto de 1999."};
}
const setPcArray=(s:GameState):void=>{
 const count=stationPowerCount(s);
 s.pcLinuxInstalled=Array.from({length:count},(_,i)=>s.pcLinuxInstalled?.[i]===true);
 s.pcOperatingSystems=Array.from({length:count},(_,i)=>s.pcOperatingSystems?.[i]==="linux"?"linux":"windows");
};
export function installLinux(s:GameState,index:number):Result{
 if(!linuxUnlocked(s))return {ok:false,message:"Conclua a pesquisa do fórum e aguarde agosto de 1999 para instalar Linux."};
 const issue=stationUpgradeIssue(s,index);if(issue)return {ok:false,message:issue};
 if(s.gpuGameInstallJobs?.some(j=>j.pc===index))return {ok:false,message:"Aguarde a instalação atual terminar."};
 if(!linuxMachineFor(s,index))return {ok:false,message:"Este é um computador Windows. Compre uma bancada Linux pronta na loja; a pesquisa libera máquinas novas."};
 if(isLinuxPc(s,index))return {ok:false,message:"Este PC já está iniciado em Linux."};
 setPcArray(s);
 s.pcLinuxInstalled![index]=true;
 s.pcOperatingSystems![index]="linux";
 return {ok:true,message:"Linux instalado no PC "+(index+1)+". O Windows anterior permanece disponível para alternar depois, com o PC desligado."};
}
export function bootWindows(s:GameState,index:number):Result{
 const issue=stationUpgradeIssue(s,index);if(issue)return {ok:false,message:issue};
 if(!isLinuxPc(s,index)||!linuxInstalledOnPc(s,index))return {ok:false,message:"Esta estação não está usando Linux."};
 if(s.pcWindowsLicenses?.[index]!==true)return {ok:false,message:"Esta máquina Linux não veio com Windows. Adquira a licença para este PC antes de alternar."};
 setPcArray(s);
 s.pcOperatingSystems![index]="windows";
 return {ok:true,message:"PC "+(index+1)+" voltou ao Windows já instalado. Linux permanece disponível."};
}
export function validLinuxState(s:Partial<GameState>):boolean{
 const ids=s.linuxMailSeenIds,started=s.linuxResearchStartedDay;
 if(ids!==undefined&&(!Array.isArray(ids)||ids.length>LINUX_MAIL_IDS.length||
   ids.some(id=>typeof id!=="string"||!(LINUX_MAIL_IDS as readonly string[]).includes(id))||
   new Set(ids).size!==ids.length))return false;
 const day=Math.floor((s.totalMinutes??0)/DAY_MINUTES)+1;
 if(started!==undefined&&(!Number.isInteger(started)||started<LINUX_CONTACT_DAY||started>day||
   !ids?.includes("linux-forum-contact")))return false;
 if(ids?.some(id=>id!=="linux-forum-contact")&&started===undefined)return false;
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
    !(s.economyVersion===2&&started!==undefined&&
      day>=Math.max(LINUX_AUGUST_DAY,started+110)))return false;
 for(let i=0;i<(modes?.length??0);i++)
  if(modes?.[i]==="linux"&&(installed?.[i]!==true||!linuxMachineFor(s,i)))return false;
 for(let i=0;i<(installed?.length??0);i++)
  if(installed?.[i]===true&&!linuxMachineFor(s,i))return false;
 for(let i=0;i<(s.pcLinuxModels?.length??0);i++)
  if(s.pcLinuxModels?.[i]!==null&&s.pcLinuxModels?.[i]!==undefined&&installed?.[i]!==true)return false;
 return true;
}
