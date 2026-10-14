import type {GameState,Result} from "./types.js";
import {stationUpgradeIssue} from "./stationPower.js";
import {gameYear,type WindowsEdition} from "./era.js";
import {HARDWARE_CATALOG,HARDWARE_LABELS,PLATFORM_KITS,hardwarePart,type HardwareKind,type HardwarePart,type PcComponents} from "./hardwareCatalog.js";
export {HARDWARE_CATALOG,HARDWARE_LABELS,PLATFORM_KITS,hardwarePart,describePart,formatMemory} from "./hardwareCatalog.js";
export type {HardwareKind,HardwarePart,PcComponents} from "./hardwareCatalog.js";

const kinds:HardwareKind[]=["cpu","ram","storage","motherboard","psu"];
const gpuWatts:Record<string,number>={gpu05:40,gpu07:75,gpu09:100,gpu11:125,gpu13:150};
export function hardwareFor(s:Partial<GameState>,index:number):PcComponents{
 const saved=s.pcComponents?.[index];
 if(saved)return {...saved};
 const tier=s.pcTiers?.[index]??1;
 return {...PLATFORM_KITS[tier>=3?2:tier>=2?1:0].components};
}
export function buildParts(build:PcComponents):Record<HardwareKind,HardwarePart>{
 return Object.fromEntries(kinds.map(k=>[k,hardwarePart(build[k])!])) as Record<HardwareKind,HardwarePart>;
}
export function hardwareLoadWatts(build:PcComponents):number{
 const parts=buildParts(build);
 return parts.cpu.watts!+parts.ram.watts!+parts.storage.watts!+parts.motherboard.watts!;
}
export function requiredPsuWatts(build:PcComponents,gpu:string|null|undefined):number{
 return Math.ceil((hardwareLoadWatts(build)+(gpuWatts[gpu??""]??0))*1.25/50)*50;
}
export function buildIssues(build:PcComponents,gpu?:string|null):string[]{
 const p=buildParts(build),issues:string[]=[];
 if(kinds.some(k=>!p[k]||p[k].kind!==k))return ["Peças desconhecidas na configuração."];
 if(p.cpu.socket!==p.motherboard.socket)issues.push("CPU exige socket "+p.cpu.socket+"; placa-mãe usa "+p.motherboard.socket+". Use um kit de plataforma.");
 if(p.ram.ramType!==p.motherboard.ramType)issues.push("A placa-mãe exige RAM "+p.motherboard.ramType+". Use um kit de plataforma.");
 if(p.ram.ramMb!>p.motherboard.maxRamMb!)issues.push("RAM excede a capacidade da placa-mãe.");
 if(!p.motherboard.buses!.includes(p.storage.bus!))issues.push("Placa-mãe não tem conexão "+p.storage.bus+" para esse armazenamento.");
 const needed=requiredPsuWatts(build,gpu);
 if(p.psu.watts!<needed)issues.push("Fonte insuficiente: esta configuração pede pelo menos "+needed+" W, com margem de 25%.");
 return issues;
}
export function validComponentArray(value:unknown):boolean{
 if(value===undefined)return true;
 if(!Array.isArray(value)||value.length>200)return false;
 return value.every(entry=>entry===null||(!!entry&&typeof entry==="object"&&!Array.isArray(entry)&&
  Object.keys(entry).length===kinds.length&&kinds.every(k=>typeof entry[k]==="string"&&hardwarePart(entry[k])?.kind===k)&&
  buildIssues(entry).length===0));
}
export function validHardwareState(s:Partial<GameState>):boolean{
 if(s.pcWindows!==undefined&&!Array.isArray(s.pcWindows))return false;
 return validComponentArray(s.pcComponents)&&(s.pcComponents===undefined||s.pcComponents.every((build,i)=>build===null||
  (buildIssues(build,s.pcGpus?.[i]).length===0&&windowsHardwareIssues(s,i,s.pcWindows?.[i]??"win98",build).length===0)))&&
  // Pre-existing OS licenses on legacy saves are grandfathered. Newly added
  // editions still require a capable machine if its component field is missing.
  (s.pcWindows??[]).every((id,i)=>!["win7","win8","win10","win11"].includes(id)||windowsHardwareIssues(s,i,id).length===0);
}
export function componentSatisfactionBonus(s:GameState,index:number):number{
 if(!s.pcComponents?.[index])return Math.min(2,Math.max(0,(s.pcTiers?.[index]??1)-1))*.08;
 const p=buildParts(hardwareFor(s,index)),stage=p.cpu.stage*.45+p.ram.stage*.35+p.storage.stage*.20;
 return Math.min(.24,Math.min(stage,2)*.08+Math.max(0,stage-2)*.01);
}
function pcActionIssue(s:GameState,index:number):string|null{
 const count=Math.max(3,Math.min(3+s.expansionLevel*2,s.installedPcs??(3+s.expansionLevel*2)))+(s.annexPcs?.length??0);
 if(!Number.isInteger(index)||index<0||index>=count)return "PC inexistente.";
 return stationUpgradeIssue(s,index);
}
export interface HardwareQuote extends Result {cost:number;components?:PcComponents}
function deny(message:string,cost=0):HardwareQuote{return {ok:false,message,cost};}
function gained(kind:HardwareKind,next:HardwarePart,old:HardwarePart):boolean{
 if(kind==="cpu")return next.stage>old.stage;
 if(kind==="ram")return next.ramMb!>old.ramMb!;
 if(kind==="storage")return next.capacityGb!>=old.capacityGb!&&next.stage>=old.stage&&(next.capacityGb!>old.capacityGb!||next.stage>old.stage);
 if(kind==="motherboard")return next.year>old.year;
 return next.watts!>old.watts!;
}
export function quotePart(s:GameState,index:number,kind:HardwareKind,id:string):HardwareQuote{
 const issue=pcActionIssue(s,index);if(issue)return deny(issue);
 const part=hardwarePart(id);
 if(!part||part.kind!==kind)return deny("Peça inválida.");
 if(gameYear(s)<part.year)return deny("Chega em "+part.year+".",part.cost);
 const old=hardwareFor(s,index),current=hardwarePart(old[kind])!;
 if(id===current.id)return deny("Já instalada.",part.cost);
 if(!gained(kind,part,current))return deny("Peça igual ou inferior à atual.",part.cost);
 const next={...old,[kind]:id};
 const problem=buildIssues(next,s.pcGpus?.[index])[0];if(problem)return deny(problem,part.cost);
 const osProblem=windowsHardwareIssues(s,index,s.pcWindows?.[index]??"win98",next)[0];
 if(osProblem)return deny("Windows atual: "+osProblem,part.cost);
 if(s.cash<part.cost)return deny("Caixa insuficiente: R$ "+part.cost+".",part.cost);
 return {ok:true,message:"Instalar "+part.name+" por R$ "+part.cost+".",cost:part.cost,components:next};
}
export function quotePlatform(s:GameState,index:number,id:string):HardwareQuote{
 const issue=pcActionIssue(s,index);if(issue)return deny(issue);
 const kit=PLATFORM_KITS.find(k=>k.id===id);if(!kit||kit.id==="platform98")return deny("Configuração inicial.");
 if(gameYear(s)<kit.year)return deny("Chega em "+kit.year+".",kit.cost);
 const old=hardwareFor(s,index),p=buildParts(old),next:PcComponents={...kit.components};
 const newBoard=hardwarePart(next.motherboard)!;
 if(newBoard.year<p.motherboard.year)return deny("Plataforma anterior à instalada.",kit.cost);
 if(p.cpu.socket===newBoard.socket&&p.cpu.stage>hardwarePart(next.cpu)!.stage)next.cpu=old.cpu;
 if(p.ram.ramType===newBoard.ramType&&p.ram.ramMb!>hardwarePart(next.ram)!.ramMb!)next.ram=old.ram;
 if(p.ram.ramType!==newBoard.ramType&&p.ram.ramMb!>hardwarePart(next.ram)!.ramMb!){
  const replacement=HARDWARE_CATALOG.filter(x=>x.kind==="ram"&&x.ramType===newBoard.ramType&&x.ramMb!>=p.ram.ramMb!&&gameYear(s)>=x.year)
   .sort((a,b)=>a.cost-b.cost)[0];
  if(!replacement)return deny("O kit reduziria a RAM. Aguarde memória compatível de maior capacidade.",kit.cost);
  next.ram=replacement.id;
 }
 if(newBoard.buses!.includes(p.storage.bus!)&&(p.storage.capacityGb!>hardwarePart(next.storage)!.capacityGb!||p.storage.stage>hardwarePart(next.storage)!.stage))next.storage=old.storage;
 if(p.psu.watts!>hardwarePart(next.psu)!.watts!)next.psu=old.psu;
 if(kinds.every(k=>old[k]===next[k]))return deny("Já instalado ou sem ganho adicional.",kit.cost);
 if(hardwarePart(next.cpu)!.stage<p.cpu.stage)return deny("O kit reduziria o desempenho da CPU.",kit.cost);
 const problem=buildIssues(next,s.pcGpus?.[index])[0];if(problem)return deny(problem,kit.cost);
 const osProblem=windowsHardwareIssues(s,index,s.pcWindows?.[index]??"win98",next)[0];if(osProblem)return deny("Windows atual: "+osProblem,kit.cost);
 const extraRam=next.ram===old.ram?0:Math.max(0,hardwarePart(next.ram)!.cost-hardwarePart(kit.components.ram)!.cost);
 const cost=kit.cost+extraRam+(kit.id==="platform03"&&p.cpu.stage<1?240:0);
 if(s.cash<cost)return deny("Caixa insuficiente: R$ "+cost+".",cost);
 return {ok:true,message:"Kit "+kit.name+" · R$ "+cost+". Peças superiores compatíveis são mantidas.",cost,components:next};
}
function install(s:GameState,index:number,quote:HardwareQuote):Result{
 if(!quote.ok||!quote.components)return {ok:false,message:quote.message};
 const count=Math.max(3,Math.min(3+s.expansionLevel*2,s.installedPcs??(3+s.expansionLevel*2)))+(s.annexPcs?.length??0);
 s.pcComponents=Array.from({length:count},(_,i)=>s.pcComponents?.[i]?{...s.pcComponents[i]!}:null);
 s.pcComponents[index]={...quote.components};
 const stage=hardwarePart(quote.components.cpu)!.stage;
 (s.pcTiers??=[])[index]=stage>=2?3:stage>=1?2:1;
 s.cash-=quote.cost;s.expenses+=quote.cost;
 return {ok:true,message:"PC "+(index+1)+": "+quote.message};
}
export function buyPart(s:GameState,index:number,kind:HardwareKind,id:string):Result{return install(s,index,quotePart(s,index,kind,id));}
export function buyPlatform(s:GameState,index:number,id:string):Result{return install(s,index,quotePlatform(s,index,id));}

interface WindowsRequirement {mhz:number;cores:number;ramMb:number;diskGb:number;bits:number;modern?:boolean}
/** Simplified installation gates, not a complete real-world driver emulator. */
export const WINDOWS_REQUIREMENTS:Record<WindowsEdition,WindowsRequirement>={
 win98:{mhz:200,cores:1,ramMb:32,diskGb:1,bits:32},
 win2000:{mhz:300,cores:1,ramMb:64,diskGb:2,bits:32},
 winxp:{mhz:300,cores:1,ramMb:64,diskGb:2,bits:32},
 winvista:{mhz:1000,cores:1,ramMb:512,diskGb:20,bits:32},
 win7:{mhz:1000,cores:1,ramMb:1024,diskGb:20,bits:32},
 win8:{mhz:1000,cores:1,ramMb:2048,diskGb:20,bits:64},
 win10:{mhz:1000,cores:1,ramMb:2048,diskGb:32,bits:64},
 win11:{mhz:1000,cores:2,ramMb:4096,diskGb:64,bits:64,modern:true}
};
export function windowsHardwareIssues(s:Partial<GameState>,index:number,edition:string,build=hardwareFor(s,index)):string[]{
 const req=WINDOWS_REQUIREMENTS[edition as WindowsEdition];if(!req)return ["Windows desconhecido."];
 const p=buildParts(build),issues:string[]=[];
 if(p.cpu.mhz!<req.mhz||p.cpu.cores!<req.cores||p.cpu.bits!<req.bits)issues.push("Requer CPU de "+(req.mhz<1000?req.mhz+" MHz":req.mhz/1000+" GHz")+", "+req.cores+" núcleo"+(req.cores===1?"":"s")+" e "+req.bits+" bits.");
 if(p.ram.ramMb!<req.ramMb)issues.push("Requer "+(req.ramMb<1024?req.ramMb+" MB":req.ramMb/1024+" GB")+" de RAM.");
 if(p.storage.capacityGb!<req.diskGb)issues.push("Requer armazenamento de "+req.diskGb+" GB.");
 if(req.modern&&(!p.motherboard.uefi||!p.motherboard.tpm2||!p.motherboard.dx12))issues.push("Requer plataforma UEFI, TPM 2.0 e vídeo DX12.");
 return issues;
}
