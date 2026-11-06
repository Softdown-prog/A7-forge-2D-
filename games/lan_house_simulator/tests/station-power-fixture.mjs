import {stationPoweredOn,stationPowerCount,stationHasCustomer,toggleStationPower} from "../dist/js/sim/stationPower.js";
import {licenseWindows} from "../dist/js/sim/era.js";
import {finishWindowsInstallations,windowsInstallFor} from "../dist/js/sim/windowsInstallation.js";

/** Conclui a instalação pelo prazo real em cenários que testam outros sistemas. */
export function licenseAndCompleteWindows(s,index,edition){
 const result=licenseWindows(s,index,edition);
 if(result.ok)finishWindowsInstallations(s,windowsInstallFor(s,index).finishedAtMs);
 return result;
}
/** Simula desligar e religar antes de uma instalação nos testes preexistentes.
 * Restaura exatamente o estado inicial de energia para manter asserções
 * atômicas antigas; não remove ocupantes nem bypassa a validação de produção.
 */
export function withStationOff(s,index,action){
 if(!s||!Number.isInteger(index)||index<0||index>=stationPowerCount(s)||
    stationHasCustomer(s,index)||s.repairJobs?.some(j=>j.pc===index&&j.phase!=="leaving")||
    !stationPoweredOn(s,index))return action();
 const had=Object.hasOwn(s,"pcPoweredOff"),saved=had?structuredClone(s.pcPoweredOff):undefined;
 const shutdown=toggleStationPower(s,index);
 if(!shutdown.ok)throw Error(shutdown.message);
 try{return action();}
 finally{
  // A real Windows setup must remain physically OFF after a successful purchase.
  // Restoring the former power state would create an invalid/unsafe save.
  if(!s.windowsInstallJobs?.some(job=>job.pc===index)){
   if(had)s.pcPoweredOff=saved;else delete s.pcPoweredOff;
  }
 }
}
