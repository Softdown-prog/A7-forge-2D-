import type { Point,GameState } from "./types.js";
export type Rotation=0|1|2|3;
export type PlacedPoint=Point&{rotation?:Rotation};
export function placedObject(s:GameState|undefined,id:string,fallback:Point):PlacedPoint{
 const saved=s?.objectPlacements?.find(p=>p.id===id);
 return saved?{x:saved.x,y:saved.y,rotation:saved.rotation}:{...fallback};
}
export function turnPoint(point:Point,pivot:Point,rotation:Rotation=0):Point{
 if(!rotation)return {...point};
 const dx=point.x-pivot.x,dy=point.y-pivot.y;
 const offsets=[[dx,dy],[-dy,dx],[-dx,-dy],[dy,-dx]][rotation]!;
 return {x:pivot.x+offsets[0]!,y:pivot.y+offsets[1]!};
}
export function stationPoint(p:PlacedPoint,dx:number,dy:number):Point{
 return turnPoint({x:p.x+dx,y:p.y+dy},{x:p.x+.55,y:p.y+.35},p.rotation??0);
}
export function counterPoint(s:GameState|undefined,point:Point):Point{
 const p=placedObject(s,"counter",{x:.9,y:1.42});
 return turnPoint({x:point.x+p.x-.9,y:point.y+p.y-1.42},{x:p.x+.875,y:p.y+.36},p.rotation??0);
}
export function vendingMachines(s?:GameState):Array<VendingMachinePlacement&{rotation?:Rotation}>{
 return VENDING_MACHINES.map(p=>({...p,...placedObject(s,p.kind,p)}));
}

/** Uma fonte única para posições físicas e atendimento das máquinas. */
export interface VendingMachinePlacement extends Point {
  kind: "soda" | "candy";
}
export const VENDING_WIDTH=0.66;
export const VENDING_DEPTH=0.59;
export const VENDING_MACHINES: readonly VendingMachinePlacement[]=[
  {kind:"soda",x:5.80,y:0.18},
  {kind:"candy",x:6.60,y:0.18}
];
/** Fila centrada em frente às duas vitrines, fora da área das máquinas. */
export const VENDING_APPROACH:Point={
  x:(VENDING_MACHINES[0]!.x+VENDING_MACHINES[1]!.x+VENDING_WIDTH)/2,
  y:VENDING_MACHINES[0]!.y+VENDING_DEPTH+0.88
};

/** Ponto de atendimento de cada máquina, sem atravessar sua colisão. */
export function vendingApproach(kind:"soda"|"candy",s?:GameState):Point {
 const machine=vendingMachines(s).find(m=>m.kind===kind)!;
 return turnPoint({x:machine.x+VENDING_WIDTH/2,y:machine.y+VENDING_DEPTH+0.88},
  {x:machine.x+VENDING_WIDTH/2,y:machine.y+VENDING_DEPTH/2},machine.rotation??0);
}
export function purchaseApproach(item:"soda"|"candy"|"snacks",s?:GameState):Point{
 if(item!=="snacks")return vendingApproach(item,s);
 const minX=-2*(s?.roomExtensions?.west??0),p=placedObject(s,"shelf",{x:minX+.23,y:2.92});
 return turnPoint({x:p.x+1.11,y:p.y+.61},{x:p.x+.23,y:p.y+.61},p.rotation??0);
}
