/** Boundary for salon construction and placement: no DOM, canvas or cached GameState. */
import type {GameState,Result} from "../sim/types.js";
import {placeFurniture,relocateFurniture,rotateFurniture,furnitureLocations,furnitureSlots,type FurnitureKind} from "../sim/shop.js";
import {buildWall,canBuildWall,removeWall,installInteriorDoor,removeInteriorDoor,wallCandidates,wallEndpoints,type WallSegment} from "../sim/walls.js";
import {annexComputerSlots,availableAnnexComputers,installAnnexComputer} from "../sim/stations.js";
export type WallPlacementMode="build"|"door"|"remove";
export interface PlacementActionsPort{
 furniture():ReturnType<typeof furnitureLocations>;
 slots():ReturnType<typeof furnitureSlots>;
 annexSlots():ReturnType<typeof annexComputerSlots>;
 availableAnnex():ReturnType<typeof availableAnnexComputers>;
 walls(mode:WallPlacementMode):WallSegment[];
 endpoints(wall:WallSegment):ReturnType<typeof wallEndpoints>;
 canBuild(wall:WallSegment):boolean;
 confirmWall(mode:WallPlacementMode,wall:WallSegment):Result;
 place(kind:FurnitureKind,id:string,rotation:0|1|2|3):Result;
 move(from:string,to:string):Result;
 rotate(id:string):Result;
 installAnnex(id:string):Result;
}
const invalid:Result={ok:false,message:"Posição de construção inválida."};
const validWall=(w:WallSegment)=>!!w&&(w.axis==="x"||w.axis==="y")&&Number.isFinite(w.x)&&Number.isFinite(w.y);
const validKind=(kind:string)=>kind==="poster"||kind==="plant"||kind==="table";
export function createPlacementActionsPort(getState:()=>GameState):PlacementActionsPort{
 return {
  furniture:()=>furnitureLocations(getState()),
  slots:()=>furnitureSlots(getState()),
  annexSlots:()=>annexComputerSlots(getState()),
  availableAnnex:()=>availableAnnexComputers(getState()),
  walls(mode){
   const s=getState();
   if(mode==="remove")return [...(s.interiorWalls??[]),...(s.interiorDoors??[])];
   if(mode==="door")return s.interiorWalls??[];
   return mode==="build"?wallCandidates(s):[];
  },
  endpoints:wall=>wallEndpoints(wall),
  canBuild:wall=>validWall(wall)&&canBuildWall(getState(),wall),
  confirmWall(mode,wall){
   if(!validWall(wall)||!["build","door","remove"].includes(mode))return invalid;
   const s=getState();
   if(mode==="build")return buildWall(s,wall);
   if(mode==="door")return installInteriorDoor(s,wall);
   return (s.interiorDoors??[]).some(p=>p.axis===wall.axis&&p.x===wall.x&&p.y===wall.y)
    ?removeInteriorDoor(s,wall):removeWall(s,wall);
  },
  place(kind,id,rotation){
   if(!validKind(kind)||!id||!Number.isInteger(rotation)||rotation<0||rotation>3)return invalid;
   return placeFurniture(getState(),kind,id,rotation);
  },
  move(from,to){return from&&to?relocateFurniture(getState(),from,to):invalid;},
  rotate(id){return id?rotateFurniture(getState(),id):invalid;},
  installAnnex(id){return id?installAnnexComputer(getState(),id):invalid;}
 };
}
