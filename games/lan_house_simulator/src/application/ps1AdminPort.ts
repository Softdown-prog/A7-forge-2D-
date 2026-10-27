/** Read-only PS1 administration projection. Always resolves the active save. */
import type {GameState} from "../sim/types.js";
import {gameYear} from "../sim/era.js";
import {PS1_CD_CATALOG,PS1_MAX_STATIONS,PS1_UNLOCK_YEAR,ps1HourPrice,
 ps1AllowedHourlyCeiling,ps1DiscCopies,ps1PlayableDisc,ps1SecondSeatPrice,ps1OpenSeat} from "../sim/ps1.js";
export interface Ps1StationView{
 index:number;occupied:number;capacity:number;wear:number;isBusy:boolean;
 playableDisc:string|null;discName:string;acceptsAnotherPlayer:boolean;
 selectedDisc:string;discOptions:ReadonlyArray<{id:string;label:string}>;
 canRepair:boolean;secondSeat:boolean;secondSeatPrice:number;canBuySecondSeat:boolean;
}
export interface Ps1AdminSnapshot{
 consoleReady:boolean;stationCount:number;maxStations:number;sessions:number;
 revenue:number;hourlyPrice:number;ownedDiscs:number;readyStations:number;
 canDecreasePrice:boolean;canIncreasePrice:boolean;
 stations:ReadonlyArray<Ps1StationView>;
}
export interface Ps1AdminPort{snapshot():Ps1AdminSnapshot;}
export function createPs1AdminPort(getState:()=>GameState):Ps1AdminPort{
 return {snapshot(){
  const s=getState(),stations=s.ps1Stations??[],year=gameYear(s);
  const consoleReady=s.economyVersion===2&&year>=PS1_UNLOCK_YEAR;
  const hourlyPrice=ps1HourPrice(s),secondSeatPrice=ps1SecondSeatPrice(s);
  const ownedDiscs=PS1_CD_CATALOG.reduce((sum,d)=>sum+ps1DiscCopies(s,d.id),0);
  const readyStations=stations.filter((_,i)=>ps1PlayableDisc(s,i)!==null).length;
  return {
   consoleReady,stationCount:stations.length,maxStations:PS1_MAX_STATIONS,
   sessions:s.ps1Sessions??0,revenue:s.ps1Revenue??0,hourlyPrice,ownedDiscs,readyStations,
   canDecreasePrice:consoleReady&&stations.length>0&&hourlyPrice>.5,
   canIncreasePrice:consoleReady&&stations.length>0&&hourlyPrice<ps1AllowedHourlyCeiling(s),
   stations:stations.map((station,index)=>{
    const occupied=s.customers.filter(c=>c.ps1StationIndex===index&&
     ["to_pc","sitting","using","standing"].includes(c.stage)).length;
    const isBusy=occupied>0,playableDisc=ps1PlayableDisc(s,index);
    const discOptions=PS1_CD_CATALOG.flatMap(disc=>{
     const copies=ps1DiscCopies(s,disc.id);
     if(!copies)return [];
     const used=stations.filter((other,i)=>i!==index&&other.discId===disc.id).length;
     if(used>=copies&&station.discId!==disc.id)return [];
     return [{id:disc.id,label:disc.title+" ("+copies+" cópia"+(copies===1?"":"s")+")"}];
    });
    return {
     index,occupied,capacity:station.secondSeat?2:1,wear:station.wear,isBusy,
     playableDisc,discName:PS1_CD_CATALOG.find(d=>d.id===playableDisc)?.title??"Nenhum CD",
     acceptsAnotherPlayer:!!station.secondSeat&&ps1OpenSeat(s,index)!==null,
     selectedDisc:station.discId??"",discOptions,
     canRepair:!isBusy&&station.wear>=10&&s.cash>=45,
     secondSeat:!!station.secondSeat,secondSeatPrice,
     canBuySecondSeat:!station.secondSeat&&!isBusy&&s.cash>=secondSeatPrice
    };
   })
  };
 }};
}
