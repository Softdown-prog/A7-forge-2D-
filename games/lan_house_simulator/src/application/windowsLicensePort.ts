/** Read-only licensing view of the current game (safe after save import). */
import type {GameState} from "../sim/types.js";
import {pcCount} from "../sim/engine.js";
import {gameYear,WINDOWS_ERAS,installedWindows} from "../sim/era.js";
import {windowsHardwareIssues} from "../sim/hardware.js";
import {stationPoweredOn,stationUpgradeIssue} from "../sim/stationPower.js";
import {isLinuxPc,linuxInstalledOnPc,linuxUnlocked,LINUX_AUGUST_DAY} from "../sim/linuxQuest.js";
import {stationOccupied} from "../sim/computerModels.js";

export interface WindowsLicenseChoice {
 id:string;label:string;disabled:boolean;title:string;
}
export interface WindowsLicenseRow{
 index:number;title:string;choices:ReadonlyArray<WindowsLicenseChoice>;
 linuxAction:{action:"install"|"windows";label:string;disabled:boolean;title:string};
}
export interface WindowsLicensePort{rows():ReadonlyArray<WindowsLicenseRow>}
export function createWindowsLicensePort(getState:()=>GameState):WindowsLicensePort{
 return {rows(){
  const s=getState(),year=gameYear(s);
  return Array.from({length:pcCount(s)},(_,index)=>{
   const edition=WINDOWS_ERAS.find(w=>w.id===installedWindows(s,index))!;
   const licensed=s.pcWindowsLicenses?.[index]===true;
   return {
    index,title:"PC "+(index+1)+" · "+(isLinuxPc(s,index)?"Linux ativo (Windows "+edition.name+" preservado)":edition.name)+
     (licensed?" · Windows licenciado":" · sem licença Windows"),
    linuxAction:{
     action:isLinuxPc(s,index)?"windows":"install",
     label:isLinuxPc(s,index)?"Voltar ao Windows":linuxInstalledOnPc(s,index)?"Iniciar Linux":"Instalar Linux · gratuito",
     disabled:!linuxUnlocked(s)||!!stationUpgradeIssue(s,index)||!!s.gpuGameInstallJobs?.some(j=>j.pc===index),
     title:!linuxUnlocked(s)?"Pesquisa do Fórum Linux: disponível a partir de agosto de 1999 (dia "+LINUX_AUGUST_DAY+").":
      stationUpgradeIssue(s,index)??"A instalação e a troca de sistema exigem PC desligado, sem clientes ou reparos."
    },
    choices:WINDOWS_ERAS.map(item=>{
     const already=licensed&&edition.id===item.id;
     const reasons=windowsHardwareIssues(s,index,item.id);
     return {
      id:item.id,
      label:item.name+" · "+(year<item.year?"🔒 "+item.year:already?"Instalado":"R$ "+item.cost),
      disabled:year<item.year||already||s.cash<item.cost||reasons.length>0||
       stationPoweredOn(s,index)||stationOccupied(s,index)||
       !!s.repairJobs?.some(job=>job.pc===index),
      title:reasons.join(" ")
     };
    })
   };
  });
 }};
}
