/** Coordinates one simulation frame without retaining the active game or save.
 * Keeps animation capture before clock advancement and resets interpolation
 * whenever eligibility for movement changes.
 */
import {frameActivitySnapshot,type FrameActivityInput} from "./frameActivity.js";

export interface FrameSimulationActions {
 resetMotion():void;
 captureMotion():void;
 advance(minutes:number):void;
}
export interface FrameSimulationCoordinator {
 run(activity:FrameActivityInput,dt:number,leftoverMinutes:number):void;
}
export function createFrameSimulationCoordinator(actions:FrameSimulationActions):FrameSimulationCoordinator {
 let wasSimulating=false;
 return {
  run(activity,dt,leftoverMinutes){
   const {captureMotion:simulating,advanceSimulation}=frameActivitySnapshot(activity);
   if(wasSimulating!==simulating){
    actions.resetMotion();
    wasSimulating=simulating;
   }
   const minutes=dt*4.0;
   if(simulating&&leftoverMinutes+minutes>=1)actions.captureMotion();
   if(advanceSimulation)actions.advance(minutes);
  }
 };
}
