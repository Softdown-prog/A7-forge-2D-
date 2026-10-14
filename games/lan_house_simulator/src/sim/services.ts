import type {GameState,Result,Point} from "./types.js";
import {pcCount,pcPosition,entrance} from "./engine.js";
import {workerRoute} from "./workerNavigation.js";
export interface RepairJob {pc:number;x:number;y:number;phase:"arriving"|"working"|"leaving";progress:number;duration:number;route?:Point[];target?:Point;stuck?:number}
export interface CleaningJob {x:number;y:number;phase:"arriving"|"working"|"leaving";progress:number;route?:Point[];target?:Point;stuck?:number}
export const BIN_SPOTS:Point[]=[{x:1.1,y:3.1},{x:5.65,y:4.65}];
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
 const cost=20+Math.ceil(wear*.7);
 if(s.cash<cost)return {ok:false,message:"Caixa insuficiente: técnico custa R$ "+cost+"."};
 s.cash-=cost;s.expenses+=cost;
 const entry=entrance(s);
 (s.repairJobs??=[]).push({pc,x:entry.x,y:entry.y,phase:"arriving",progress:0,duration:REPAIR_DURATION});
 return {ok:true,message:"Técnico chamado para o PC "+(pc+1)+": -R$ "+cost+". Computador interditado até o fim do reparo."};
}
export function pcUnderRepair(s:GameState,index:number):boolean{return !!s.repairJobs?.some(j=>j.pc===index&&j.phase!=="leaving");}
export function addWaste(s:GameState,amount=1):void{
 if(!Number.isFinite(amount)||amount<=0)return;
 const bins=s.binFill??(s.binFill=[0,0]);
 const index=bins[0]<=bins[1]?0:1;
 bins[index]=Math.min(100,(bins[index]??0)+amount);
}
export function requestCleaning(s:GameState):Result{
 if(s.cleaningJob)return {ok:false,message:"Faxineiro já está a caminho."};
 if(!(s.binFill??[]).some(x=>x>=10))return {ok:false,message:"As lixeiras ainda estão quase vazias."};
 const cost=55;
 if(s.cash<cost)return {ok:false,message:"Limpeza custa R$ "+cost+"."};
 s.cash-=cost;s.expenses+=cost;
 const entry=entrance(s);
 s.cleaningJob={x:entry.x,y:entry.y,phase:"arriving",progress:0};
 return {ok:true,message:"Faxineiro contratado por R$ 55 para recolher o lixo."};
}
function navigate(s:GameState,job:{x:number;y:number;route?:Point[];target?:Point;stuck?:number},to:Point,speed:number):boolean{
 const close=(a:Point,b:Point)=>Math.hypot(a.x-b.x,a.y-b.y)<.12;
 if(close(job,to))return true;
 const targetChanged=!job.target||!close(job.target,to);
 if(targetChanged||!job.route?.length||((s.totalMinutes%16)===0)){
   const route=workerRoute(s,{x:job.x,y:job.y},to);
   if(route){job.route=route;job.target={...to};job.stuck=0;}
   else{job.route=[];job.stuck=(job.stuck??0)+1;return false;}
 }
 const next=job.route?.[0];
 if(!next)return false;
 if(approach(job,next,speed))job.route?.shift();
 return close(job,to)||(!job.route?.length&&Math.hypot(job.x-to.x,job.y-to.y)<.6);
}
export function tickServices(s:GameState):void{
 const exit=entrance(s);
 for(const job of s.repairJobs??[]){
  const pc=pcPosition(job.pc,s),target={x:pc.x+.55,y:pc.y+.60};
  if(job.phase==="arriving"&&navigate(s,job,target,.35))job.phase="working";
  else if(job.phase==="working"){
   job.progress=Math.min(job.duration,job.progress+1);
   if(job.progress>=job.duration){
    (s.pcWear??=[])[job.pc]=0;job.phase="leaving";
    s.eventLog.unshift("PC "+(job.pc+1)+" reparado. Técnico liberando a estação.");s.eventLog.splice(14);
   }
  }else if(job.phase==="leaving")navigate(s,job,exit,.38);
 }
 s.repairJobs=s.repairJobs?.filter(j=>j.phase!=="leaving"||Math.hypot(j.x-exit.x,j.y-exit.y)>.01);
 const job=s.cleaningJob;
 if(job){
  const target=BIN_SPOTS.reduce((best,p,i)=>(s.binFill?.[i]??0)>(s.binFill?.[best]??0)?i:best,0);
  if(job.phase==="arriving"&&navigate(s,job,BIN_SPOTS[target]!, .32))job.phase="working";
  else if(job.phase==="working"){
   job.progress++;
   if(job.progress>=9){
    (s.binFill??=[0,0])[target]=0;job.progress=0;
    if(s.binFill.some(v=>v>=5))job.phase="arriving";
    else job.phase="leaving";
   }
  }else if(job.phase==="leaving"&&approach(job,exit,.38))s.cleaningJob=undefined;
 }
}
