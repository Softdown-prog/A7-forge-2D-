import {placedObject} from "./layout.js";
import type {GameState,Result,Point} from "./types.js";
import {pcCount,pcPosition,entrance} from "./engine.js";
import {workerRoute} from "./workerNavigation.js";
import {serviceVisitCost} from "./historicalEconomy.js";
import {employeeHired,accrueEmployeeDay} from "./staff.js";
import {directionFromDelta,type ActorDirection} from "../render/direction.js";
import {canTraverseLocalStep} from "./navigation.js";
import {technicianWorkPoint,technicianContactPoint,cleanerWorkPoint} from "./staffWorksites.js";
export interface RepairJob {pc:number;x:number;y:number;phase:"arriving"|"working"|"leaving";progress:number;duration:number;route?:Point[];target?:Point;stuck?:number;facing?:ActorDirection;moving?:boolean;coveredByContract?:boolean}
export interface CleaningJob {x:number;y:number;phase:"arriving"|"working"|"leaving";progress:number;route?:Point[];target?:Point;stuck?:number;facing?:ActorDirection;moving?:boolean;coveredByContract?:boolean;binIndex?:number}
export const BIN_SPOTS:Point[]=[{x:1.1,y:3.1},{x:5.65,y:4.65}];
export function binSpots(s:GameState):Point[]{return BIN_SPOTS.map((p,i)=>placedObject(s,"bin:"+i,p));}
export type BinStatus="empty"|"filling"|"full";
export function binStatus(fill:number):BinStatus{
 return fill>=100?"full":fill>0?"filling":"empty";
}
export function binStates(s:GameState):BinStatus[]{
 return BIN_SPOTS.map((_,i)=>binStatus(s.binFill?.[i]??0));
}
export const REPAIR_DURATION=24;
function approach(a:{x:number;y:number},b:Point,speed:number):boolean{
 const dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy);
 if(d<=speed){a.x=b.x;a.y=b.y;return true}
 a.x+=dx/d*speed;a.y+=dy/d*speed;return false;
}
export function startRepair(s:GameState,pc:number):Result{
 if(!Number.isInteger(pc)||pc<0||pc>=pcCount(s))return {ok:false,message:"PC inexistente."};
 if(s.repairJobs?.some(j=>j.pc===pc))return {ok:false,message:"Já existe um técnico atendendo esse PC."};
 if(employeeHired(s,"technician")&&s.repairJobs?.length)return {ok:false,message:"O técnico contratado já está atendendo outro PC."};
 const wear=Math.max(0,Math.min(100,s.pcWear?.[pc]??0));
 if(wear<1)return {ok:false,message:"Esse PC não precisa de manutenção."};
 if(s.customers.some(c=>c.pcIndex===pc&&["to_pc","sitting","using","standing"].includes(c.stage)))
  return {ok:false,message:"Aguarde o cliente terminar antes de chamar o técnico."};
 // Não cobrar diária/visita de um técnico que não consegue chegar ao equipamento.
 // Em especial depois da construção de divisórias e reposicionamento de móveis.
 const machine=pcPosition(pc,s),approachPoint=technicianWorkPoint(machine);
 if(!workerRoute(s,entrance(s),approachPoint)||
    !canTraverseLocalStep(s,approachPoint,technicianContactPoint(machine)))
  return {ok:false,message:"Não há passagem para o PC "+(pc+1)+". Abra uma porta ou reorganize o salão antes de chamar o técnico."};
 const cost=employeeHired(s,"technician")?0:serviceVisitCost(s,"repair",wear);
 if(cost>0&&s.cash<cost)return {ok:false,message:"Caixa insuficiente: técnico custa R$ "+cost+"."};
 s.cash-=cost;s.expenses+=cost;
 const entry=entrance(s);
 (s.repairJobs??=[]).push({pc,x:entry.x,y:entry.y,phase:"arriving",progress:0,duration:REPAIR_DURATION,facing:"north",moving:false,coveredByContract:employeeHired(s,"technician")});
 accrueEmployeeDay(s);
 return {ok:true,message:"Técnico chamado para o PC "+(pc+1)+(cost?": -R$ "+cost:": visita coberta pelo contrato")+". Computador interditado até o fim do reparo."};
}
export function pcUnderRepair(s:GameState,index:number):boolean{return !!s.repairJobs?.some(j=>j.pc===index&&j.phase!=="leaving");}
export function addWaste(s:GameState,amount=1):void{
 if(!Number.isFinite(amount)||amount<=0)return;
 const bins=s.binFill??(s.binFill=[0,0]);
 // Cada descarte vai à lixeira menos cheia; um volume acima da sua capacidade
 // transborda no chão, sem reescrever a distribuição anterior dos saves.
 const index=(bins[0]??0)<=(bins[1]??0)?0:1;
 const accepted=Math.max(0,Math.min(100-(bins[index]??0),amount));
 bins[index]=Math.min(100,(bins[index]??0)+accepted);
 const remaining=amount-accepted;
 if(remaining>0){
  s.overflowWaste=Math.min(1000,(s.overflowWaste??0)+remaining);
  s.reputation=Math.max(10,s.reputation-Math.min(1,remaining*.025));
 }
}
/** Escolhe uma lixeira que realmente tem acesso pela rede de corredores.
 * Lixeira inalcançável mantém seu lixo; nunca gera visita fantasma. */
function accessibleCleaningBin(s:GameState,from:Point):number|null{
 const bins=s.binFill??[0,0],overflow=(s.overflowWaste??0)>=1;
 const choices=[0,1].filter(i=>(bins[i]??0)>=5||overflow)
  .sort((a,b)=>(bins[b]??0)-(bins[a]??0)||a-b);
 const spots=binSpots(s);
 for(const i of choices){
  const spot=spots[i]!,stand=cleanerWorkPoint(spot);
  if(workerRoute(s,from,stand)&&canTraverseLocalStep(s,stand,spot))return i;
 }
 return null;
}
export function requestCleaning(s:GameState):Result{
 if(s.cleaningJob)return {ok:false,message:"Faxineiro já está a caminho."};
 if(!(s.binFill??[]).some(x=>x>=10)&&(s.overflowWaste??0)<1)return {ok:false,message:"As lixeiras ainda estão quase vazias."};
 const entry=entrance(s),binIndex=accessibleCleaningBin(s,entry);
 if(binIndex===null)return {ok:false,message:"O faxineiro não consegue alcançar as lixeiras que precisam de limpeza. Abra uma passagem ou reorganize o salão."};
 const cost=employeeHired(s,"cleaner")?0:serviceVisitCost(s,"cleaning");
 if(cost>0&&s.cash<cost)return {ok:false,message:"Limpeza custa R$ "+cost+"."};
 s.cash-=cost;s.expenses+=cost;
 s.cleaningJob={x:entry.x,y:entry.y,phase:"arriving",progress:0,facing:"north",moving:false,coveredByContract:employeeHired(s,"cleaner"),binIndex};
 accrueEmployeeDay(s);
 return {ok:true,message:cost?"Faxineiro avulso chamado por R$ "+cost.toFixed(2)+" para recolher o lixo.":"Limpeza coberta pelo contrato do faxineiro."};
}
function navigate(s:GameState,job:{x:number;y:number;route?:Point[];target?:Point;stuck?:number;facing?:ActorDirection;moving?:boolean},to:Point,speed:number,exact=false):boolean{
 const close=(a:Point,b:Point)=>Math.hypot(a.x-b.x,a.y-b.y)<.12;
 job.moving=false;
 if(close(job,to))return true;
 if(exact&&Math.hypot(job.x-to.x,job.y-to.y)<.65&&canTraverseLocalStep(s,job,to)){
  const oldX=job.x,oldY=job.y;
  approach(job,to,speed);
  const dx=job.x-oldX,dy=job.y-oldY;
  job.moving=Math.hypot(dx,dy)>.001;
  if(job.moving)job.facing=directionFromDelta(dx,dy,job.facing??"north");
  return close(job,to);
 }
 const targetChanged=!job.target||!close(job.target,to);
 if(targetChanged||!job.route?.length||((s.totalMinutes%16)===0)){
   const route=workerRoute(s,{x:job.x,y:job.y},to);
   if(route){job.route=route;job.target={...to};job.stuck=0;}
   else{job.route=[];job.stuck=(job.stuck??0)+1;return false;}
 }
 const next=job.route?.[0];
 if(!next)return false;
 const oldX=job.x,oldY=job.y;
 if(approach(job,next,speed))job.route?.shift();
 const dx=job.x-oldX,dy=job.y-oldY;
 job.moving=Math.hypot(dx,dy)>.001;
 if(job.moving)job.facing=directionFromDelta(dx,dy,job.facing??"north");
 return close(job,to)||(!job.route?.length&&Math.hypot(job.x-to.x,job.y-to.y)<.6);
}
/** Chamar funcionários contratados só quando necessário.
 * Técnico contratado atende uma estação de cada vez. */
export function dispatchHiredStaff(s:GameState):void{
 if(employeeHired(s,"cleaner")&&!s.cleaningJob&&
    ((s.binFill??[]).some(x=>x>=75)||(s.overflowWaste??0)>0))
  requestCleaning(s);
 if(employeeHired(s,"technician")&&!(s.repairJobs?.length)){
  for(let pc=0;pc<pcCount(s);pc++){
   if((s.pcWear?.[pc]??0)<100||(s.repairJobs??[]).some(j=>j.pc===pc))continue;
   if(s.customers.some(c=>c.pcIndex===pc&&["to_pc","sitting","using","standing"].includes(c.stage)))continue;
   startRepair(s,pc);break;
  }
 }
}
/** Funcionários entram e saem pela porta e não atravessam paredes internas. */
export function tickServices(s:GameState):void{
 const exit=entrance(s);
 for(const job of s.repairJobs??[]){
  const pc=pcPosition(job.pc,s),target=technicianWorkPoint(pc);
  if(job.phase==="arriving"){
   if(navigate(s,job,target,.35)){
    job.phase="working";job.moving=false;
    s.eventLog.unshift("Técnico chegou ao PC "+(job.pc+1)+" e iniciou o reparo.");s.eventLog.splice(14);
   }
  }else if(job.phase==="working"){
   job.moving=false;job.progress=Math.min(job.duration,job.progress+1);
   if(job.progress>=job.duration){
    (s.pcWear??=[])[job.pc]=0;job.phase="leaving";
    job.route=undefined;job.target=undefined;
    s.eventLog.unshift("PC "+(job.pc+1)+" reparado. Técnico liberando a estação.");s.eventLog.splice(14);
   }
  }else if(job.phase==="leaving")navigate(s,job,exit,.38,true);
 }
 s.repairJobs=s.repairJobs?.filter(j=>j.phase!=="leaving"||Math.hypot(j.x-exit.x,j.y-exit.y)>.12);
 const job=s.cleaningJob;
 if(!job)return;
 if(job.phase==="arriving"){
  if(job.binIndex===undefined){
   const index=accessibleCleaningBin(s,{x:job.x,y:job.y});
   if(index!==null)job.binIndex=index;
   else{
    // Nunca atravessar divisórias só para finalizar o segundo chamado.
    // O lixo inacessível continua na lixeira, sem nova despesa.
    job.phase="leaving";job.route=undefined;job.target=undefined;
    s.eventLog.unshift("Faxineiro encerrou a visita: há lixeira sem passagem. Verifique as divisórias.");
    s.eventLog.splice(14);
   }
  }
  if(job.phase==="arriving"&&job.binIndex!==undefined&&navigate(s,job,cleanerWorkPoint(binSpots(s)[job.binIndex]!), .32)){
   job.phase="working";job.progress=0;job.moving=false;
   s.eventLog.unshift("Faxineiro chegou à lixeira "+(job.binIndex+1)+" e iniciou a limpeza.");s.eventLog.splice(14);
  }
 }else if(job.phase==="working"){
  job.moving=false;job.progress=Math.min(9,job.progress+1);
  if(job.progress>=9){
   (s.binFill??=[0,0])[job.binIndex??0]=0;
   job.progress=0;job.binIndex=undefined;job.route=undefined;job.target=undefined;
   if(s.binFill.some(v=>v>=5))job.phase="arriving";
   else{
    s.overflowWaste=0;job.phase="leaving";
    s.eventLog.unshift("Faxineiro recolheu o lixo e deixou o salão limpo.");s.eventLog.splice(14);
   }
  }
 }else if(job.phase==="leaving"&&navigate(s,job,exit,.38,true))s.cleaningJob=undefined;
}
