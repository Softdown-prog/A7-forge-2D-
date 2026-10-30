/** Furniture catalog geometry and legacy placements, without purchases or route mutations. */
import type {GameState} from "./types.js";
import {roomBounds} from "./room.js";

export type FurnitureKind="poster"|"plant"|"table";

export function furnitureLimit(s:GameState,kind:FurnitureKind):number{
 return furnitureSlots(s).filter(p=>p.surface===(kind==="poster"?"wall":"floor")).length;
}


/** Discrete build slots avoid the fixed NPC aisle (y=4.48), PCs and entrance. */
export interface PlacementSlot {id:string;x:number;y:number;surface:"wall"|"floor";axis?:"x"|"y"}

export const FURNITURE_SLOTS:ReadonlyArray<PlacementSlot>=[
 {id:"wall-1",x:2.1,y:0.01,surface:"wall"},{id:"wall-2",x:4.35,y:0.01,surface:"wall"},
 {id:"floor-1",x:0.65,y:5.17,surface:"floor"},{id:"floor-2",x:2.45,y:5.17,surface:"floor"},
 {id:"floor-3",x:4.30,y:5.17,surface:"floor"},{id:"floor-4",x:6.15,y:5.17,surface:"floor"}
];

const LEGACY_SLOTS:Record<FurnitureKind,string[]>={poster:["wall-1","wall-2"],plant:["floor-1","floor-4"],table:["floor-2"]};

/** Pontos novos só surgem após pagar por cada ala; IDs originais não mudam. */
export function furnitureSlots(s:GameState):PlacementSlot[]{
 const bounds=roomBounds(s);
 const result=FURNITURE_SLOTS.map(slot=>slot.surface==="wall"?{...slot,y:bounds.minY+0.01}:slot);
 const e=s.roomExtensions??{west:0,east:0,south:0};
 for(let i=1;i<=e.west;i++){
   result.push({id:"floor-west-"+i,x:-2*i+0.42,y:5.17,surface:"floor"});
   result.push({id:"wall-west-"+i,x:-2*i+0.45,y:bounds.minY+0.01,surface:"wall"});
 }
 for(let i=1;i<=e.east;i++){
   result.push({id:"floor-east-"+i,x:8+2*s.expansionLevel+2*(i-1)+0.48,y:5.17,surface:"floor"});
   result.push({id:"wall-east-"+i,x:8+2*s.expansionLevel+2*(i-1)+0.52,y:bounds.minY+0.01,surface:"wall"});
 }
 for(let i=1;i<=(e.north??0);i++){
   result.push({id:"floor-north-"+i+"-a",x:1.0,y:-2*i+0.7,surface:"floor"});
   result.push({id:"floor-north-"+i+"-b",x:3.0,y:-2*i+0.7,surface:"floor"});
   result.push({id:"wall-north-"+i,x:[0.25,1.12,5.15,6.12,7.05][i-1]!,y:bounds.minY+0.01,surface:"wall"});
 }
 for(let i=1;i<=e.south;i++){
   result.push({id:"floor-south-"+i+"-a",x:Math.max(bounds.minX+1.1,1.05),y:6+2*(i-1)+0.9,surface:"floor"});
   result.push({id:"floor-south-"+i+"-b",x:Math.max(bounds.minX+2.9,3.05),y:6+2*(i-1)+0.9,surface:"floor"});
 }
 const floorReserved=result.filter(p=>p.surface==="floor");
 // Half-tile floor positions provide physical capacity instead of one item per type.
 for(let iy=Math.ceil((bounds.minY-.15)/.75);.25+iy*.75<bounds.maxY-.65;iy++)for(let ix=Math.ceil((bounds.minX-.15)/.75);.25+ix*.75<bounds.maxX-.65;ix++){
  const x=.25+ix*.75,y=.25+iy*.75;
  if(floorReserved.some(p=>Math.hypot(p.x-x,p.y-y)<.65))continue;
  result.push({id:"floor-grid-"+x+":"+y,x,y,surface:"floor"});
 }
 for(let i=Math.ceil((bounds.minX-.15)/.85);.15+i*.85<bounds.maxX-.8;i++){const x=Number((.15+i*.85).toFixed(2));if(!result.some(p=>p.surface==="wall"&&Math.abs(p.x-x)<.65))result.push({id:"wall-grid-"+x,x,y:bounds.minY+.01,surface:"wall"});}
 for(let i=Math.ceil((bounds.minY-.15)/.85);.15+i*.85<bounds.maxY-.8;i++){const y=Number((.15+i*.85).toFixed(2));result.push({id:"wall-side-"+y,x:bounds.minX+.012,y,surface:"wall",axis:"y"});}
 return result;
}


export function occupiedFurnitureSlots(s:GameState):Set<string>{
 const occupied=new Set((s.furniturePlacements??[]).map(p=>p.slotId));
 for(const station of s.ps1Stations??[])occupied.add(station.slotId);
 for(const station of s.ps2Stations??[])occupied.add(station.slotId);
 for(const kind of ["poster","plant","table"] as const){
  const positioned=(s.furniturePlacements??[]).filter(p=>p.kind===kind).length;
  const legacy=Math.max(0,(s.furniture?.[kind]??0)-positioned);
  for(let i=0;i<legacy;i++)if(LEGACY_SLOTS[kind][i])occupied.add(LEGACY_SLOTS[kind][i]!);
 }
 return occupied;
}


/** Lista os móveis instalados, inclusive os legados sem furniturePlacements.
 * Os mesmos encaixes são usados para detectar ocupação e para salvar mudanças. */
export function furnitureLocations(s:GameState):Array<{kind:FurnitureKind;slotId:string;rotation?:0|1|2|3}>{
 const result:Array<{kind:FurnitureKind;slotId:string;rotation?:0|1|2|3}>=[...(s.furniturePlacements??[])];
 for(const kind of ["poster","plant","table"] as const){
  const explicit=result.filter(p=>p.kind===kind).length;
  const remaining=Math.max(0,(s.furniture?.[kind]??0)-explicit);
  for(let i=0;i<remaining;i++){
   const slotId=LEGACY_SLOTS[kind][i];
   if(slotId)result.push({kind,slotId});
  }
 }
 return result;
}
