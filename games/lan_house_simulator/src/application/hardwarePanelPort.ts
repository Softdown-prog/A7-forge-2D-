/** Complete hardware presentation model; all quotes and eligibility stay in simulation. */
import { stationModelName,stationOccupied } from "../sim/computerModels.js";
import { WINDOWS_ERAS,gameYear,installedWindows } from "../sim/eraCatalog.js";
import { gpuSpec,installedGpu } from "../sim/gpu.js";
import { HARDWARE_CATALOG,HARDWARE_LABELS,PLATFORM_KITS,buildParts,describePart,hardwareFor,quotePart,quotePlatform,requiredPsuWatts,windowsHardwareIssues,type HardwareKind } from "../sim/hardware.js";
import { pcCount } from "../sim/simulationState.js";
import { stationPoweredOn } from "../sim/stationPower.js";
import type { GameState } from "../sim/types.js";
export type HardwareTab=HardwareKind|"platform";
export type HardwarePage="hardware"|"windows";
export interface HardwareChoice {id:string;label:string;disabled:boolean;title:string;detail:string}
export interface HardwareCard {id:string;kind:HardwareTab;year:number;name:string;description:string;extra?:string;status:string;label:string;locked:boolean;disabled:boolean}
export interface HardwarePanelView {
 index:number;year:number;tab:HardwareTab;page:HardwarePage;stations:number[];
 powered:boolean;powerDisabled:boolean;machineTitle:string;machineSubtitle:string;
 machineNote:string;specs:Array<{kind:string;label:string;name:string;description?:string}>;powerNote:string;
 windows:HardwareChoice[];currentWindowsIssue:string|null;nextWindowsIssue:string|null;
 tabs:Array<{id:HardwareTab;label:string}>;cards:HardwareCard[];
}
export interface HardwarePanelPort {snapshot(index:number,tab:HardwareTab,page?:HardwarePage):HardwarePanelView}
export function createHardwarePanelPort(getState:()=>GameState):HardwarePanelPort{
 return {snapshot(requested,tab,page="hardware"){
  const s=getState(),count=pcCount(s),index=Number.isInteger(requested)?Math.max(0,Math.min(requested,count-1)):0,year=gameYear(s);
  const build=hardwareFor(s,index),parts=buildParts(build),edition=WINDOWS_ERAS.find(e=>e.id===installedWindows(s,index))!,licensed=s.pcWindowsLicenses?.[index]===true;
  const powered=stationPoweredOn(s,index),busy=stationOccupied(s,index)||!!s.repairJobs?.some(j=>j.pc===index);
  const specs:HardwarePanelView["specs"]=(['cpu','ram','storage','motherboard','psu'] as const).map(kind=>({kind,label:HARDWARE_LABELS[kind],name:parts[kind].name,description:describePart(parts[kind])}));
  specs.push({kind:"gpu",label:"Placa de vídeo",name:gpuSpec(installedGpu(s,index))?.name??"Vídeo integrado"});
  const choices=page==="windows"?WINDOWS_ERAS.map(release=>{
   const reasons=windowsHardwareIssues(s,index,release.id),owned=edition.id===release.id&&licensed,locked=year<release.year;
   return {id:release.id,label:release.name+" · "+(owned?"Instalado":locked?release.year:"R$ "+release.cost),disabled:owned||locked||busy||powered||reasons.length>0||s.cash<release.cost,
    title:owned?"Já instalado e licenciado.":locked?"Lançamento no jogo: "+release.year:reasons.length?reasons.join(" "):busy?"Libere esta estação.":powered?"Desligue esta estação.":"Instalar somente neste PC.",
    detail:owned?"Instalado e licenciado.":locked?"Disponível no ano "+release.year+".":reasons.length?reasons.join(" "):busy?"Libere a estação para instalar.":powered?"Desligue a estação para instalar.":s.cash<release.cost?"Caixa insuficiente.":"Compatível com esta configuração."};
  }):[];
  const currentIssue=page==="windows"?windowsHardwareIssues(s,index,edition.id):[];
  const nextWindows=page==="windows"?WINDOWS_ERAS.find(w=>w.year<=year&&w.year>edition.year&&windowsHardwareIssues(s,index,w.id).length>0):undefined;
  const cards:HardwareCard[]=page==="windows"?[]:tab==="platform"?PLATFORM_KITS.map(kit=>{
   const quote=quotePlatform(s,index,kit.id),proposed=buildParts(quote.components??{...kit.components});
   return {id:kit.id,kind:"platform",year:kit.year,name:kit.name,description:describePart(proposed.cpu)+" · "+proposed.ram.name+" · "+proposed.storage.name,
    extra:proposed.motherboard.name+" · "+proposed.psu.name,status:quote.ok?"Pronto para instalar neste PC.":quote.message,
    label:kit.id==="platform98"?"Configuração inicial":year<kit.year?"🔒 Chega em "+kit.year:"Kit · R$ "+(quote.cost||kit.cost),locked:year<kit.year,disabled:!quote.ok};
  }):HARDWARE_CATALOG.filter(p=>p.kind===tab).map(part=>{
   const quote=quotePart(s,index,tab as HardwareKind,part.id),owned=build[tab as HardwareKind]===part.id;
   return {id:part.id,kind:tab,year:part.year,name:part.name,description:describePart(part),status:quote.ok?"Compatível com esta estação.":quote.message,
    label:owned?"Instalado":year<part.year?"🔒 Chega em "+part.year:"Instalar · R$ "+part.cost,locked:year<part.year,disabled:!quote.ok};
  });
  return {index,year,tab,page,stations:Array.from({length:count},(_,i)=>i),powered,
   powerDisabled:stationOccupied(s,index)||!!s.repairJobs?.some(j=>j.pc===index&&j.phase!=="leaving"),
   machineTitle:"PC "+String(index+1).padStart(2,"0")+" · "+edition.name,
   machineSubtitle:(licensed?"Windows licenciado":"Windows preinstalado · sem licença adquirida")+" · "+stationModelName(s,index),
   machineNote:powered?"PC ligado. Desligue a estação selecionada para instalar peças.":"PC desligado. Pode atualizar quando estiver livre.",specs,
   powerNote:"Fonte instalada: "+parts.psu.watts+" W · capacidade recomendada para as peças atuais: "+requiredPsuWatts(build,s.pcGpus?.[index])+" W (margem de 25%). Uma fonte maior oferece reserva; não consome sua potência máxima o tempo todo.",
   windows:choices,currentWindowsIssue:currentIssue.length?edition.name+": "+currentIssue.join(" "):null,
   nextWindowsIssue:nextWindows?"Para "+nextWindows.name+": "+windowsHardwareIssues(s,index,nextWindows.id).join(" "):null,
   tabs:[{id:"platform",label:"Kits de plataforma"},...Object.entries(HARDWARE_LABELS).map(([id,label])=>({id:id as HardwareKind,label}))],cards};
 }};
}
