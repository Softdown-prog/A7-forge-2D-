import type {Customer,GameState,Point} from "../sim/types.js";
import type {RepairJob,CleaningJob} from "../sim/services.js";
import {canTraverseLocalStep} from "../sim/navigation.js";
import {directionFromDelta} from "./direction.js";
import {entrance} from "../sim/engine.js";

const lerp=(a:number,b:number,t:number)=>a+(b-a)*t;
/** Presentation between fixed simulation minutes. Never writes to a save or
 * changes paths, reservations, money, RNG, or the four-minutes/second clock. */
export class SceneMotion {
 private customers=new Map<number,Customer>();
 private repairs=new Map<number,RepairJob>();
 private cleaning:CleaningJob|undefined;
 private captured=false;
 reset():void{this.customers.clear();this.repairs.clear();this.cleaning=undefined;this.captured=false;}
 capture(s:GameState):void{
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
   if(!prev)return c;
   const at=this.position(s,prev,c,alpha),changed=prev.stage!==c.stage;
   const stage=changed&&alpha<1?prev.stage:c.stage;
   const endPose=changed&&(prev.stage==="sitting"||prev.stage==="standing")?3:(c.poseMinutes??0);
   const facing=directionFromDelta(c.x-prev.x,c.y-prev.y,c.facing??prev.facing);
   return {...c,...at,stage,facing,pcIndex:changed&&alpha<1?prev.pcIndex:c.pcIndex,
    poseMinutes:lerp(prev.poseMinutes??0,endPose,alpha),
    // The renderer points the actor along the motion being presented, rather
    // than turning early toward the next simulation waypoint.
    target:{x:c.x,y:c.y}};
  }),repairJobs:s.repairJobs?.map(j=>{
   const prev=this.repairs.get(j.pc);if(!prev)return j;
   return {...j,...this.position(s,prev,j,alpha),phase:alpha<1?prev.phase:j.phase,
    progress:lerp(prev.progress,j.progress,alpha)};
  }),cleaningJob:s.cleaningJob&&this.cleaning?{
   ...s.cleaningJob,...this.position(s,this.cleaning,s.cleaningJob,alpha),
   phase:alpha<1?this.cleaning.phase:s.cleaningJob.phase,
   progress:lerp(this.cleaning.progress,s.cleaningJob.progress,alpha)
  }:s.cleaningJob};
 }
}
