import type {GameState,Result} from "../sim/types.js";
import {PS1_CD_CATALOG,buyPs1Disc,buyPs1Station,setPs1StationDisc,buyPs1SecondSeat,repairPs1Controls,type Ps1DiscId} from "../sim/ps1.js";
export interface Ps1ActionsPort {
 buyDisc(id:string):Result;buyStation(slotId:string):Result;insertDisc(index:number,id:string):Result;
 discAt(index:number):string;secondSeat(index:number):Result;repairControls(index:number):Result;stationCount():number;
}
const invalid:Result={ok:false,message:"CD ou bancada de PlayStation inválido."};
const knownDisc=(id:string):id is Ps1DiscId=>PS1_CD_CATALOG.some(x=>x.id===id);
const valid=(s:GameState,i:number)=>Number.isInteger(i)&&i>=0&&i<(s.ps1Stations?.length??0);
/** Read/write adapter always targeting the current save instance. */
export function createPs1ActionsPort(getState:()=>GameState):Ps1ActionsPort{
 return {
  stationCount:()=>getState().ps1Stations?.length??0,
  buyDisc(id){return knownDisc(id)?buyPs1Disc(getState(),id):invalid;},
  buyStation(slotId){return buyPs1Station(getState(),slotId);},
  discAt(i){const s=getState();return valid(s,i)?(s.ps1Stations![i]?.discId??""):"";},
  insertDisc(i,id){
   const s=getState();if(!valid(s,i)||(id!==""&&!knownDisc(id)))return invalid;
   return setPs1StationDisc(s,i,id===""?null:id as Ps1DiscId);
  },
  secondSeat(i){const s=getState();return valid(s,i)?buyPs1SecondSeat(s,i):invalid;},
  repairControls(i){const s=getState();return valid(s,i)?repairPs1Controls(s,i):invalid;}
 };
}
