import type {GameState,Result} from "./types.js";
/** Saves antigos sem campo de energia mantêm todas as estações ligadas. */
export function stationPoweredOn(s:Partial<GameState>,index:number):boolean{return s.pcPoweredOff?.[index]!==true;}
export function validStationPower(s:Partial<GameState>):boolean{
 return s.pcPoweredOff===undefined||(Array.isArray(s.pcPoweredOff)&&s.pcPoweredOff.length<=200&&
  Array.from({length:s.pcPoweredOff.length},(_,i)=>typeof s.pcPoweredOff?.[i]==="boolean").every(Boolean));
}
/** Prontidão comercial: não anuncia estações desligadas, quebradas,
 * interditadas por técnico ou temporariamente ocupadas por download.
 * A reserva de cliente e o trajeto físico continuam sendo validados
 * separadamente na escolha do PC; assim filas não somem artificialmente.
 */
export function stationReadyForSessions(s:GameState,index:number):boolean{
 if(!Number.isInteger(index)||index<0||index>=stationPowerCount(s)||!stationPoweredOn(s,index))return false;
 if((s.pcWear?.[index]??0)>=100)return false;
 if(s.repairJobs?.some(job=>job.pc===index&&job.phase!=="leaving"))return false;
 if(s.gpuGameInstallJobs?.some(job=>job.pc===index))return false;
 return true;
}
export function stationPowerCount(s:GameState):number{
 return Math.max(3,Math.min(3+s.expansionLevel*2,s.installedPcs??(3+s.expansionLevel*2)))+(s.annexPcs?.length??0);
}
export function stationHasCustomer(s:GameState,index:number):boolean{
 return s.customers.some(c=>c.pcIndex===index&&["to_pc","sitting","using","standing"].includes(c.stage));
}
export function stationUpgradeIssue(s:GameState,index:number):string|null{
 if(!Number.isInteger(index)||index<0||index>=stationPowerCount(s))return "PC inexistente.";
 if(stationHasCustomer(s,index))return "Aguarde o cliente liberar esta estação.";
 if(stationPoweredOn(s,index))return "Desligue o PC "+(index+1)+" antes de atualizar.";
 if(s.repairJobs?.some(j=>j.pc===index&&j.phase!=="leaving"))return "Aguarde o técnico concluir o reparo.";
 return null;
}
export function toggleStationPower(s:GameState,index:number):Result{
 if(!Number.isInteger(index)||index<0||index>=stationPowerCount(s))return {ok:false,message:"PC inexistente."};
 if(stationPoweredOn(s,index)){
  if(stationHasCustomer(s,index))return {ok:false,message:"PC "+(index+1)+" ocupado. Aguarde o cliente sair antes de desligar."};
  // Arrays esparsos viram null no JSON e invalidam o save após o reload.
  s.pcPoweredOff=Array.from({length:stationPowerCount(s)},(_,i)=>s.pcPoweredOff?.[i]===true);
  s.pcPoweredOff[index]=true;
  return {ok:true,message:"PC "+(index+1)+" desligado. Economiza energia e não recebe clientes."};
 }
 if(s.repairJobs?.some(j=>j.pc===index&&j.phase!=="leaving"))
  return {ok:false,message:"Aguarde a manutenção terminar antes de religar este PC."};
 s.pcPoweredOff=Array.from({length:stationPowerCount(s)},(_,i)=>s.pcPoweredOff?.[i]===true);
 s.pcPoweredOff[index]=false;
 return {ok:true,message:"PC "+(index+1)+" ligado e disponível para clientes."};
}
