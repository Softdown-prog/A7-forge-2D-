/** Read-only GPU download projections against the currently loaded campaign. */
import type {GameState} from "../sim/types.js";
import {gpuGameDownloadSlots,gpuGameInstallJob,gpuGameInstallPausedReason} from "../sim/gpuGames.js";
export interface GpuDownloadMetersPort{
 bandwidth():string;
 progress(pc:number,id:string):{label:string;minutesElapsed:number}|null;
}
export function createGpuDownloadMetersPort(getState:()=>GameState):GpuDownloadMetersPort{
 const capacity=(s:GameState)=>({
  slots:gpuGameDownloadSlots(s),
  running:s.gpuGameInstallJobs?.filter(job=>!gpuGameInstallPausedReason(s,job.pc)).length??0
 });
 return {
  bandwidth(){
   const s=getState(),{slots,running}=capacity(s);
   return "Internet nível "+s.internetTier+": até "+slots+
    " PC(s) transferindo por minuto do jogo. "+running+" download(s) apto(s) a avançar"+
    (running>slots?"; a conexão divide a banda por rodízio.":".");
  },
  progress(pc,id){
   const s=getState(),job=gpuGameInstallJob(s,pc);
   if(!job||job.id!==id)return null;
   const {slots,running}=capacity(s);
   const reason=gpuGameInstallPausedReason(s,pc);
   const remaining=job.durationMinutes-job.elapsedMinutes;
   return {
    label:"PC "+(pc+1)+" · "+Math.floor(job.elapsedMinutes/job.durationMinutes*100)+"%"+
     (reason?" · Pausado: "+reason:" · "+remaining+" min de transferência pendentes"+
      (running>slots?" · banda compartilhada":"")),
    minutesElapsed:job.elapsedMinutes
   };
  }
 };
}
