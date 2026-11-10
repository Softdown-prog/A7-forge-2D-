import type {GameState,Result} from "../types.js";
import {installedLcd} from "../computerModels.js";
import {installedWindows} from "../eraCatalog.js";
import {linuxMachineSpec,linuxMachineFor,type LinuxMachineId} from "../linuxMachines.js";
import {linuxUnlocked} from "../linuxQuest.js";
import {fixedLayoutObjects,layoutGoals,layoutPlacementIssue,objectTouchesCustomer} from "../layoutGeometry.js";
import {navigableRoute} from "../navigation.js";
import {entrance} from "../simulationState.js";
import {emptyStationAccount} from "../stationAccounting.js";
import {stationPoweredOn} from "../stationPower.js";
import {shopPrice} from "./pricing.js";

/** Previews the same candidate and shifted annex station IDs as a real purchase.
 * Never mutates the active save, changes RNG or charges money.
 */
function plannedMainComputer(s:GameState,count:number):{
 shifted:GameState["objectPlacements"];issue:string|null;
}{
 const shifted=s.objectPlacements?.map(p=>p.id.startsWith("pc:")&&Number(p.id.slice(3))>=count?{...p,id:"pc:"+(Number(p.id.slice(3))+1)}:p);
 const candidate={...s,installedPcs:count+1,objectPlacements:shifted};
 const nextPc=fixedLayoutObjects(candidate).find(o=>o.id==="pc:"+count);
 if(!nextPc)return {shifted,issue:"Não foi possível localizar a próxima vaga do computador."};
 const placement=layoutPlacementIssue(candidate,nextPc);
 if(placement)return {shifted,issue:"Próximo PC sem encaixe: "+placement+" Reorganize o salão."};
 if(s.customers.some(customer=>objectTouchesCustomer(nextPc,customer)))
  return {shifted,issue:"Aguarde os clientes saírem da posição do próximo PC."};
 if(layoutGoals(candidate).some(p=>!navigableRoute(candidate,entrance(candidate),p)))
  return {shifted,issue:"O próximo PC bloquearia uma passagem. Reorganize o salão."};
 return {shifted,issue:null};
}
/** Read-only placement quote, shared by the shop and actual purchase. */
export function nextComputerPlacementIssue(s:GameState):string|null{
 const count=s.installedPcs??(3+s.expansionLevel*2),capacity=3+s.expansionLevel*2;
 if(count>=capacity)return "Amplie o salão antes de instalar outro PC.";
 return plannedMainComputer(s,count).issue;
}
export function buyComputer(s:GameState,linuxModel?:LinuxMachineId):Result{
 if(linuxModel&&(!linuxMachineSpec(linuxModel)||!linuxUnlocked(s)))
  return {ok:false,message:"Assine e receba as seis revistas de Linux; os novos computadores ficam disponíveis a partir de outubro de 1999."};
 const count=s.installedPcs??(3+s.expansionLevel*2),capacity=3+s.expansionLevel*2;
 if(count>=capacity)return {ok:false,message:"Amplie o salão antes de instalar outro PC."};
 const cost=shopPrice(s,linuxModel??"computer");
 if(s.cash<cost)return {ok:false,message:"Caixa insuficiente para o PC."};
 const {shifted,issue}=plannedMainComputer(s,count);
 if(issue)return {ok:false,message:issue};
 // An annex can exist before explicit Windows arrays have ever been created.
 // Normalize the old PC slots BEFORE inserting the new main-room station:
 // splice(count, 0, ...) on [] would otherwise insert at index 0, not count.
 const oldPcCount=count+(s.annexPcs?.length??0);
 const windows=Array.from({length:oldPcCount},(_,i)=>installedWindows(s,i));
 const windowsLicenses=Array.from({length:oldPcCount},(_,i)=>s.pcWindowsLicenses?.[i]===true);
 if(shifted)s.objectPlacements=shifted;
 // Ao inserir um PC original depois de PCs anexos, preservar os índices existentes.
 for(const visitor of s.customers){
  if(visitor.pcIndex!==null&&visitor.pcIndex>=count)visitor.pcIndex++;
  // An unpaid LAN group may have reserved the annex without sitting yet.
  // Keep the reservation attached to that same physical PC.
  if(visitor.multiplayerAssignedPc!==undefined&&visitor.multiplayerAssignedPc>=count)
   visitor.multiplayerAssignedPc++;
 }
 for(const job of s.repairJobs??[])if(job.pc>=count)job.pc++;
 for(const job of s.gpuGameInstallJobs??[])if(job.pc>=count)job.pc++;
 // A instalação real acompanha o PC do anexo quando os índices se deslocam.
 if(s.windowsInstallJobs?.length)s.windowsInstallJobs=s.windowsInstallJobs.map(job=>
  job.pc>=count?{...job,pc:job.pc+1}:job);
 (s.pcWear??=[]).splice(count,0,0);
 (s.pcTiers??=[]).splice(count,0,1);
 windows.splice(count,0,"win98");s.pcWindows=windows;
 windowsLicenses.splice(count,0,false);s.pcWindowsLicenses=windowsLicenses;
 (s.pcGpus??=[]).splice(count,0,null);
 // The new PC is a physical station: never overwrite or shift an annex station's OS or model.
 if(linuxModel||s.pcOperatingSystems||s.pcLinuxInstalled||s.pcLinuxModels){
  // Preserve byte-for-byte legacy saves when purchasing an ordinary Windows PC.
  // Migrate OS/model arrays only once a Linux machine or prior OS data exists.
  const previous=count+(s.annexPcs?.length??0);
  const systems=Array.from({length:previous},(_,i)=>s.pcOperatingSystems?.[i]==="linux"?"linux":"windows");
  const linuxInstalled=Array.from({length:previous},(_,i)=>s.pcLinuxInstalled?.[i]===true);
  const models=Array.from({length:previous},(_,i)=>linuxMachineFor(s,i));
  systems.splice(count,0,linuxModel?"linux":"windows");
  linuxInstalled.splice(count,0,!!linuxModel);
  models.splice(count,0,linuxModel??null);
  s.pcOperatingSystems=systems;s.pcLinuxInstalled=linuxInstalled;s.pcLinuxModels=models;
 }
 // PC inserido ANTES dos anexos desloca as licenças de software por índice,
 // exatamente como GPU/Windows/contabilidade; PC novo começa sem instalações.
 if(s.gpuGameInstalls){
  const size=count+(s.annexPcs?.length??0);
  const installs=Array.from({length:size},(_,i)=>[...(s.gpuGameInstalls?.[i]??[])]);
  installs.splice(count,0,[]);
  s.gpuGameInstalls=installs;
 }
 // Um PC original inserido antes dos anexos também desloca seus estados de energia.
 if(s.pcPoweredOff){
  const power=Array.from({length:count+(s.annexPcs?.length??0)},(_,i)=>!stationPoweredOn(s,i));
  power.splice(count,0,false);s.pcPoweredOff=power;
 }
 if(s.stationLedger){
  while(s.stationLedger.length<count+(s.annexPcs?.length??0))
   s.stationLedger.push(emptyStationAccount());
  s.stationLedger.splice(count,0,emptyStationAccount());
 }
 s.pcLcdModels=Array.from({length:count+(s.annexPcs?.length??0)},(_,i)=>installedLcd(s,i));
 s.pcLcdModels.splice(count,0,null);
 if(s.pcComponents){s.pcComponents=Array.from({length:count+(s.annexPcs?.length??0)},(_,i)=>s.pcComponents?.[i]??null);s.pcComponents.splice(count,0,null);}
 s.cash-=cost;s.expenses+=cost;s.installedPcs=count+1;
 return {ok:true,message:linuxModel?
  linuxMachineSpec(linuxModel)!.name+" comprado pronto para Linux: -R$ "+cost+". Estação física com mesa, monitor e cadeira.":
  "Novo PC instalado: -R$ "+cost+"."};
}
