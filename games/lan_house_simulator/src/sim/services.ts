import {placedObject,stationPoint} from "./layout.js";
import type {GameState,Result,Point} from "./types.js";
import {pcCount,pcPosition,entrance} from "./engine.js";
import {workerRoute} from "./workerNavigation.js";
import {serviceVisitCost} from "./historicalEconomy.js";
import {directionFromDelta,type ActorDirection} from "../render/direction.js";
import {canTraverseLocalStep} from "./navigation.js";
export interface RepairJob {pc:number;x:number;y:number;phase:"arriving"|"working"|"leaving";progress:number;duration:number;route?:Point[];target?:Point;stuck?:number;facing?:ActorDirection;moving?:boolean}
export interface CleaningJob {x:number;y:number;phase:"arriving"|"working"|"leaving";progress:number;route?:Point[];target?:Point;stuck?:number;facing?:ActorDirection;moving?:boolean;binIndex?:number}
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
 const wear=Math.max(0,Math.min(100,s.pcWear?.[pc]??0));
 if(wear<1)return {ok:false,message:"Esse PC não precisa de manutenção."};
 if(s.customers.some(c=>c.pcIndex===pc&&["to_pc","sitting","using","standing"].includes(c.stage)))
  return {ok:false,message:"Aguarde o cliente terminar antes de chamar o técnico."};
 const cost=serviceVisitCost(s,"repair",wear);
 if(s.cash<cost)return {ok:false,message:"Caixa insuficiente: técnico custa R$ "+cost+"."};
 s.cash-=cost;s.expenses+=cost;
 const entry=entrance(s);
 (s.repairJobs??=[]).push({pc,x:entry.x,y:entry.y,phase:"arriving",progress:0,duration:REPAIR_DURATION,facing:"north",moving:false});
 return {ok:true,message:"Técnico chamado para o PC "+(pc+1)+": -R$ "+cost+". Computador interditado até o fim do reparo."};
}
export function pcUnderRepair(s:GameState,index:number):boolean{return !!s.repairJobs?.some(j=>j.pc===index&&j.phase!=="leaving");}
export function addWaste(s:GameState,amount=1):void{
 if(!Number.isFinite(amount)||amount<=0)return;
 const bins=s.binFill??(s.binFill=[0,0]);
 let remaining=amount;
 // Priorizar a lixeira mais vazia; quando ambas atingem 100, o lixo transborda.
 for(let i=0;i<bins.length&&remaining>0;i++){
  const available=bins.map((v,index)=>({index,fill:v??0})).filter(x=>x.fill<100).sort((a,b)=>a.fill-b.fill)[0];
  if(!available)break;
  const accepted=Math.min(100-available.fill,remaining);
  bins[available.index]=Math.min(100,available.fill+accepted);
  remaining-=accepted;
 }
 if(remaining>0){
  s.overflowWaste=Math.min(1000,(s.overflowWaste??0)+remaining);
  s.reputation=Math.max(10,s.reputation-Math.min(1,remaining*.025));
 }
}
export function requestCleaning(s:GameState):Result{
 if(s.cleaningJob)return {ok:false,message:"Faxineiro já está a caminho."};
 if(!(s.binFill??[]).some(x=>x>=10)&&(s.overflowWaste??0)<1)return {ok:false,message:"As lixeiras ainda estão quase vazias."};
 const cost=serviceVisitCost(s,"cleaning");
 if(s.cash<cost)return {ok:false,message:"Limpeza custa R$ "+cost+"."};
 s.cash-=cost;s.expenses+=cost;
 const entry=entrance(s);
 s.cleaningJob={x:entry.x,y:entry.y,phase:"arriving",progress:0,facing:"north",moving:false};
 return {ok:true,message:"Faxineiro contratado por R$ "+cost.toFixed(2)+" para recolher o lixo."};
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
/** Funcionários entram e saem pela porta e não atravessam paredes internas. */
export function tickServices(s:GameState):void{
 const exit=entrance(s);
 for(const job of s.repairJobs??[]){
  const pc=pcPosition(job.pc,s),target=stationPoint(pc,.55,.60);
  if(job.phase==="arriving"){
   if(navigate(s,job,target,.35)){job.phase="working";job.moving=false;}
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
   const bins=s.binFill??[0,0],index=bins[0]>=bins[1]?0:1;
   if((bins[index]??0)>=5||(s.overflowWaste??0)>=1)job.binIndex=index;
   else{job.phase="leaving";job.route=undefined;job.target=undefined;}
  }
  if(job.phase==="arriving"&&job.binIndex!==undefined&&navigate(s,job,binSpots(s)[job.binIndex]!, .32)){
   job.phase="working";job.progress=0;job.moving=false;
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
