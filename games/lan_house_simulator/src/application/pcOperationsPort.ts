/** Read-only projection of PC operations; all mutations stay in the existing station actions. */
import type {GameState} from "../sim/types.js";
import {pcCount,pcWear,pcBroken} from "../sim/engine.js";
import {stationPoweredOn,stationHasCustomer} from "../sim/stationPower.js";
import {employeeHired} from "../sim/staff.js";
import {workPhaseLabel} from "../sim/staffPresentation.js";
import {serviceVisitCost} from "../sim/historicalEconomy.js";
import {gameYear} from "../sim/era.js";
import {isLinuxPc} from "../sim/linuxQuest.js";

export interface PcOperationRow {
 index:number;
 poweredOn:boolean;
 label:string;
 powerLabel:string;
 powerDisabled:boolean;
 powerTitle:string;
 repairLabel:string;
 repairDisabled:boolean;
 progress:{max:number;value:number;ariaLabel:string}|null;
 upgradeLabel:string;
 upgradeDisabled:boolean;
}
export interface PcOperationsPort {
 summary():string;
 rows():ReadonlyArray<PcOperationRow>;
}
export function createPcOperationsPort(getState:()=>GameState):PcOperationsPort{
 return {
  summary(){
   const game=getState(),count=pcCount(game);
   const broken=Array.from({length:count},(_,i)=>i).filter(i=>pcBroken(game,i)).length;
   const poweredOff=Array.from({length:count},(_,i)=>i).filter(i=>!stationPoweredOn(game,i)).length;
   return count+" computadores · "+game.customers.filter(c=>c.stage==="using"&&c.ps1StationIndex===undefined&&c.ps2StationIndex===undefined).length+
    " ocupados · "+poweredOff+" desligados · "+broken+" em manutenção";
  },
  rows(){
   const game=getState(),year=gameYear(game);
   return Array.from({length:pcCount(game)},(_,i)=>{
    const wear=pcWear(game,i),isOn=stationPoweredOn(game,i),busy=stationHasCustomer(game,i);
    const job=game.repairJobs?.find(j=>j.pc===i);
    const tier=game.pcTiers?.[i]??1,hardwareYear=tier===1?2000:2003;
    const repairLabel=job?
     "Técnico · "+workPhaseLabel("technician",job)+(job.phase==="working"?" · "+Math.floor(job.progress/job.duration*100)+"%":""):
     employeeHired(game,"technician")?"Solicitar reparo · equipe contratada":
     "Chamar técnico avulso · R$ "+serviceVisitCost(game,"repair",wear).toLocaleString("pt-BR");
    return {
     index:i,poweredOn:isOn,
     label:"PC "+(i+1)+" · "+(isOn?"LIGADO":"DESLIGADO")+
      " · desgaste "+Math.round(wear)+"%"+(pcBroken(game,i)?" · MANUTENÇÃO":"")+
      " · hardware nível "+tier+(isLinuxPc(game,i)?" · Linux":" · Windows"),
     powerLabel:isOn?"Desligar estação":"Ligar estação",
     powerDisabled:isOn?busy:!!game.repairJobs?.some(j=>j.pc===i&&j.phase!=="leaving"),
     powerTitle:isOn&&busy?"Aguarde o cliente sair para desligar.":isOn?
      "Economize energia e libere atualizações.":"Religue para receber clientes.",
     repairLabel,
     repairDisabled:wear<1||!!job||game.customers.some(c=>c.pcIndex===i&&["using","sitting","standing","to_pc"].includes(c.stage)),
     progress:job?{max:job.duration,value:job.progress,ariaLabel:"Reparo do PC "+(i+1)}:null,
     upgradeLabel:tier>=3?"Ver Peças e configuração":
      "Kit CRT "+hardwareYear+" · "+(year<hardwareYear?"🔒 "+hardwareYear:"R$ "+(tier*240)),
     upgradeDisabled:tier>=3||year<hardwareYear||game.cash<tier*240||isOn||busy||!!job
    };
   });
  }
 };
}
