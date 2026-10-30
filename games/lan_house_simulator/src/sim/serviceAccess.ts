import type {GameState,Point} from "./types.js";
import {entrance,pcCount,pcPosition} from "./simulationState.js";
import {binSpots} from "./services.js";
import {canTraverseLocalStep} from "./navigation.js";
import {technicianWorkPoint,technicianContactPoint,cleanerWorkPoint} from "./staffWorksites.js";
import {workerRoute} from "./workerNavigation.js";

export type ServiceAccessIssue={
 kind:"bin"|"pc";
 index:number;
 point:Point;
 label:string;
};
/** Verifica apenas destinos com demanda real; é uma consulta pura.
 * Uma posição sem rota não prova qual parede específica causou o bloqueio. */
export function serviceAccessIssues(s:GameState):ServiceAccessIssue[]{
 const issues:ServiceAccessIssue[]=[],entry=entrance(s);
 const bins=binSpots(s),overflow=(s.overflowWaste??0)>=1;
 for(let i=0;i<bins.length;i++){
  if((s.binFill?.[i]??0)<10&&!overflow)continue;
  if(s.cleaningJob?.binIndex===i)continue;
  const point=bins[i]!,stand=cleanerWorkPoint(point);
  if(!workerRoute(s,entry,stand)||!canTraverseLocalStep(s,stand,point))
   issues.push({kind:"bin",index:i,point,label:"Lixeira "+(i+1)});
 }
 for(let i=0;i<pcCount(s);i++){
  if((s.pcWear?.[i]??0)<1||s.repairJobs?.some(j=>j.pc===i))continue;
  const pc=pcPosition(i,s),point=technicianContactPoint(pc),stand=technicianWorkPoint(pc);
  if(!workerRoute(s,entry,stand)||!canTraverseLocalStep(s,stand,point))
   issues.push({kind:"pc",index:i,point,label:"PC "+(i+1)});
 }
 return issues;
}
