/** Application boundary for the salon editor. DOM, pointer events, zoom and
 * screen-space projection remain presentation concerns. Mutations and
 * business validation stay entirely inside the simulation.
 * Access to the active save is resolved afresh on every call.
 */
import type {GameState,Point,Result} from "../sim/types.js";
import {editableObjects,layoutPlacementIssue,layoutRemovalIssue,
 moveLayoutObject,removeLayoutObject,type EditableObject} from "../sim/editableObjects.js";
import {removablePartitions,removePartition,wallEndpoints} from "../sim/walls.js";
import {furnitureSlots} from "../sim/shop.js";
import {roomBounds} from "../sim/room.js";

export type LayoutEditorObject=EditableObject;
export type LayoutEditorPartition=ReturnType<typeof removablePartitions>[number];
export type LayoutEditorSlot=ReturnType<typeof furnitureSlots>[number];
export interface LayoutEditorCamera {originX:number;originY:number;zoom:number}
export interface LayoutEditorPort {
 objects():LayoutEditorObject[];
 partitions():LayoutEditorPartition[];
 partition(id:string|null):LayoutEditorPartition|null;
 slots():LayoutEditorSlot[];
 bounds():ReturnType<typeof roomBounds>;
 camera():LayoutEditorCamera;
 endpoints(wall:LayoutEditorPartition):[Point,Point];
 placementIssue(draft:LayoutEditorObject):string|null;
 removalIssue(id:string):string|null;
 move(id:string,draft:LayoutEditorObject):Result;
 remove(id:string):Result;
}
export function createLayoutEditorPort(
 getState:()=>GameState,
 cameraForState:(state:GameState)=>LayoutEditorCamera
):LayoutEditorPort{
 return {
  objects:()=>editableObjects(getState()),
  partitions:()=>removablePartitions(getState()),
  partition:id=>id?removablePartitions(getState()).find(w=>w.id===id)??null:null,
  slots:()=>furnitureSlots(getState()),
  bounds:()=>roomBounds(getState()),
  camera:()=>cameraForState(getState()),
  endpoints:wall=>wallEndpoints(wall),
  placementIssue:draft=>layoutPlacementIssue(getState(),draft),
  removalIssue:id=>layoutRemovalIssue(getState(),id),
  move:(id,draft)=>moveLayoutObject(getState(),id,draft,draft.rotation),
  remove(id){
   const s=getState();
   return removablePartitions(s).some(w=>w.id===id)
    ?removePartition(s,id):removeLayoutObject(s,id);
  }
 };
}
