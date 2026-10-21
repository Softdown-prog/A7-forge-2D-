import type {Customer,GameState,Point} from "../sim/types.js";
import type {RepairJob,CleaningJob} from "../sim/services.js";
import {canTraverseLocalStep} from "../sim/navigation.js";
import {directionFromDelta,screenViewForMotion,type ActorScreenView} from "./direction.js";
import {entrance} from "../sim/engine.js";

/** Presentation-only data. Never added to the simulation or a save. */
export interface RenderMotion {distance:number;view:ActorScreenView;moving:boolean}
export type MotionCustomer=Customer & {renderMotion?:RenderMotion};
export type MotionWorker=(RepairJob|CleaningJob)&{renderMotion?:RenderMotion};
interface WorkerStride {distance:number;view:ActorScreenView}
const groundDistance=(dx:number,dy:number)=>Math.hypot((dx-dy)*64,(dx+dy)*32);

const lerp=(a:number,b:number,t:number)=>a+(b-a)*t;
/** Presentation between fixed simulation minutes. Never writes to a save or
 * changes paths, reservations, money, RNG, or the four-minutes/second clock. */
export class SceneMotion {
 private customers=new Map<number,Customer>();
 private repairs=new Map<number,RepairJob>();
 private cleaning:CleaningJob|undefined;
 private captured=false;
 private strides=new Map<number,{distance:number;view:ActorScreenView}>();
 private repairStrides=new Map<number,WorkerStride>();
 private cleaningStride:WorkerStride|undefined;
 reset():void{
  this.customers.clear();this.repairs.clear();this.cleaning=undefined;
  this.captured=false;this.strides.clear();this.repairStrides.clear();this.cleaningStride=undefined;
 }
 /** Same screen-space distance and eight-view facing used for customer strides. */
 private workerStride(s:GameState,prev:RepairJob|CleaningJob|undefined,
  current:RepairJob|CleaningJob,old:WorkerStride|undefined):WorkerStride{
  if(!prev)return {distance:0,view:screenViewForMotion(0,0,current.facing)};
  const dx=current.x-prev.x,dy=current.y-prev.y;
  const valid=Math.hypot(dx,dy)<=.8&&canTraverseLocalStep(s,prev,current);
  const travel=valid?groundDistance(dx,dy):0;
  return {distance:(old?.distance??0)+travel,
   view:travel>.0001?screenViewForMotion(dx,dy):old?.view??screenViewForMotion(0,0,current.facing)};
 }
 private workerSample(s:GameState,prev:RepairJob|CleaningJob|undefined,
  current:RepairJob|CleaningJob,base:WorkerStride|undefined,alpha:number):MotionWorker{
  const fallback:WorkerStride=base??{distance:0,view:screenViewForMotion(0,0,current.facing)};
  if(!prev)return {...current,renderMotion:{...fallback,moving:false}};
  const dx=current.x-prev.x,dy=current.y-prev.y;
  // Never animate a teleport, nor interpolate a chord across a closed partition.
  const valid=Math.hypot(dx,dy)<=.8&&canTraverseLocalStep(s,prev,current);
  const travel=valid?groundDistance(dx,dy):0;
  const at=valid?this.position(s,prev,current,alpha):{x:current.x,y:current.y};
  const phase=alpha<1?prev.phase:current.phase;
  return {...current,...at,phase,progress:lerp(prev.progress,current.progress,alpha),
   facing:travel>.0001?directionFromDelta(dx,dy,current.facing??prev.facing):current.facing,
   renderMotion:{distance:fallback.distance+travel*alpha,
    view:travel>.0001?screenViewForMotion(dx,dy):fallback.view,
    moving:travel>.0001&&phase!=="working"}};
 }
 capture(s:GameState):void{
  const strides=new Map<number,{distance:number;view:ActorScreenView}>();
  for(const c of s.customers){
   const entry=entrance(s);
   const prev=this.customers.get(c.id)??(this.captured&&c.stage==="arriving"&&
    Math.hypot(c.x-entry.x,c.y-entry.y)<=.8?{...c,...entry}:undefined);
   const old=this.strides.get(c.id);
   const dx=prev?c.x-prev.x:0,dy=prev?c.y-prev.y:0;
   const continuous=!!prev&&Math.hypot(dx,dy)<=.8&&canTraverseLocalStep(s,prev,c);
   const distance=continuous?groundDistance(dx,dy):0;
   strides.set(c.id,{distance:(old?.distance??0)+distance,
    view:distance>.0001?screenViewForMotion(dx,dy):old?.view??screenViewForMotion(0,0,c.facing)});
  }
  this.strides=strides;
  const repairStrides=new Map<number,WorkerStride>();
  for(const job of s.repairJobs??[]){
   const old=this.repairs.get(job.pc);
   const fresh=old?.phase==="leaving"&&job.phase==="arriving";
   repairStrides.set(job.pc,this.workerStride(s,fresh?undefined:old,job,
    fresh?undefined:this.repairStrides.get(job.pc)));
  }
  this.repairStrides=repairStrides;
  this.cleaningStride=s.cleaningJob?this.workerStride(s,this.cleaning,s.cleaningJob,this.cleaningStride):undefined;
  this.captured=true;
  this.customers=new Map(s.customers.map(c=>[c.id,{...c,target:{...c.target}}]));
  this.repairs=new Map((s.repairJobs??[]).map(j=>[j.pc,{...j}]));
  this.cleaning=s.cleaningJob?{...s.cleaningJob}:undefined;
 }
 private position(s:GameState,previous:Point,current:Point,alpha:number):Point{
  // A collision detour can turn around a corner in one minute. Do not draw a
  // straight chord through its wall or interpolate a legacy teleport/day reset.
  if(Math.hypot(current.x-previous.x,current.y-previous.y)>.8||
     !canTraverseLocalStep(s,previous,current))return {x:current.x,y:current.y};
  return {x:lerp(previous.x,current.x,alpha),y:lerp(previous.y,current.y,alpha)};
 }
 sample(s:GameState,fraction=s.leftoverMinutes):GameState{
  const alpha=Math.max(0,Math.min(1,fraction));
  return {...s,customers:s.customers.map(c=>{
   const entry=entrance(s);
   const prev=this.customers.get(c.id)??(this.captured&&c.stage==="arriving"&&
    Math.hypot(c.x-entry.x,c.y-entry.y)<=.8?{...c,...entry}:undefined);
   const stride=this.strides.get(c.id)??{distance:0,view:screenViewForMotion(0,0,c.facing)};
   if(!prev)return {...c,renderMotion:{...stride,moving:false}} as MotionCustomer;
   const changed=prev.stage!==c.stage;
   const stage=changed&&alpha<1?prev.stage:c.stage;
   const endPose=changed&&(prev.stage==="sitting"||prev.stage==="standing")?3:(c.poseMinutes??0);
   const dx=c.x-prev.x,dy=c.y-prev.y;
   const travel=Math.hypot(dx,dy)<=.8&&canTraverseLocalStep(s,prev,c)?groundDistance(dx,dy):0;
   const at=travel?{x:lerp(prev.x,c.x,alpha),y:lerp(prev.y,c.y,alpha)}:{x:c.x,y:c.y};
   const renderMotion={distance:stride.distance+travel*alpha,
    view:travel>.0001?screenViewForMotion(dx,dy):stride.view,moving:travel>.0001};
   const facing=directionFromDelta(c.x-prev.x,c.y-prev.y,c.facing??prev.facing);
   return {...c,...at,stage,facing,renderMotion,pcIndex:changed&&alpha<1?prev.pcIndex:c.pcIndex,
    poseMinutes:lerp(prev.poseMinutes??0,endPose,alpha),
    // The renderer points the actor along the motion being presented, rather
    // than turning early toward the next simulation waypoint.
    target:{x:c.x,y:c.y}};
  }),repairJobs:s.repairJobs?.map(j=>this.workerSample(s,this.repairs.get(j.pc),j,
   this.repairStrides.get(j.pc),alpha)),cleaningJob:s.cleaningJob
    ?this.workerSample(s,this.cleaning,s.cleaningJob,this.cleaningStride,alpha)
    :undefined};
 }
}
