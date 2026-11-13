/** PS1 scene station: gameplay remains in sim/ps1.ts, procedural art in ps1Art.ts. */
import {ps1StationPoint,ps1PlayableDisc} from "../../../sim/ps1.js";
import type {GameState} from "../../../sim/types.js";
import type {Projection} from "../../isometric.js";
import {drawPs1Station} from "../../ps1Art.js";
import type {SceneStationEntry} from "./types.js";

export function collectPs1Entries(ctx:CanvasRenderingContext2D,camera:Projection,s:GameState,elapsedSeconds:number):SceneStationEntry[]{
 const entries:SceneStationEntry[]=[];
 for(let i=0;i<(s.ps1Stations?.length??0);i++){
  const point=ps1StationPoint(s,i);
  if(point){
   const inUse=s.customers.some(c=>c.ps1StationIndex===i&&c.stage==="using");
   entries.push({depth:point.x+point.y+.3,paint:()=>drawPs1Station(ctx,camera,point,
    s.ps1Stations![i]!.wear,inUse,elapsedSeconds,ps1PlayableDisc(s,i),
    s.ps1Stations![i]!.secondSeat===true)});
  }
 }
 return entries;
}
