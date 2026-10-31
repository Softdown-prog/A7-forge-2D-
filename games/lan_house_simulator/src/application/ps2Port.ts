/** PS2 commands and read models. Resolves the active save on every call. */
import type {GameState,Result} from "../sim/types.js";
import {PS2_GAME_CATALOG,ps2Unlocked,ps2BenchPrice,ps2GamePrice,ps2GameCopies,ps2ActiveCopies,
 ps2HourPrice,ps2AllowedHourlyCeiling,ps2PlacementSlots,ps2OpenSeat,ps2StationBusy,
 ps2SecondSeatPrice,ps2RepairPrice,buyPs2Station,buyPs2Game,setPs2StationGame,
 buyPs2SecondSeat,repairPs2,setPs2Power,setPs2HourlyPrice,type Ps2GameId} from "../sim/ps2.js";
import {ps1PlacementLabel} from "../sim/ps1.js";
export interface Ps2StationView{
 index:number;wear:number;occupied:number;capacity:number;gameId:string;
 gameName:string;poweredOff:boolean;busy:boolean;available:boolean;
 canRepair:boolean;canSecondSeat:boolean;
 games:ReadonlyArray<{id:string;title:string;disabled:boolean}>;
}
export interface Ps2Snapshot{
 unlocked:boolean;hourlyPrice:number;ceiling:number;count:number;available:number;
 occupied:number;sessions:number;revenue:number;copies:number;
 benchPrice:number;benchDisabled:boolean;benchText:string;secondSeatPrice:number;repairPrice:number;
 slots:ReadonlyArray<{id:string;label:string}>;
 games:ReadonlyArray<{id:string;title:string;genre:string;price:number;copies:number;disabled:boolean;buyText:string}>;
 stations:ReadonlyArray<Ps2StationView>;
}
export interface Ps2Port{
 snapshot():Ps2Snapshot;
 buyStation(slot:string):Result;buyGame(id:string):Result;setGame(i:number,id:string):Result;
 secondSeat(i:number):Result;repair(i:number):Result;power(i:number,on:boolean):Result;changePrice(direction:number):Result;
}
const invalid:Result={ok:false,message:"Ação de PS2 inválida."};
const known=(id:string):id is Ps2GameId=>PS2_GAME_CATALOG.some(g=>g.id===id);
export function createPs2Port(getState:()=>GameState):Ps2Port{
 const valid=(i:number)=>Number.isInteger(i)&&i>=0&&i<(getState().ps2Stations?.length??0);
 return {
  snapshot(){
   const s=getState(),unlocked=ps2Unlocked(s),stations=s.ps2Stations??[];
   const price=ps2BenchPrice(s),slots=unlocked&&stations.length<3?ps2PlacementSlots(s).map(p=>({id:p.id,label:ps1PlacementLabel(p)})):[];
   const view=stations.map((st,index):Ps2StationView=>{
    const busy=ps2StationBusy(s,index),occupied=s.customers.filter(c=>c.ps2StationIndex===index).length;
    return {index,wear:st.wear,occupied,capacity:st.secondSeat?2:1,gameId:st.gameId??"",
     gameName:PS2_GAME_CATALOG.find(g=>g.id===st.gameId)?.title??"Sem jogo",poweredOff:!!st.poweredOff,
     busy,available:ps2OpenSeat(s,index)!==null,
     canRepair:!busy&&st.wear>=10&&s.cash>=ps2RepairPrice(s),
     canSecondSeat:!busy&&!st.secondSeat&&s.cash>=ps2SecondSeatPrice(s),
     games:PS2_GAME_CATALOG.filter(g=>ps2GameCopies(s,g.id)>0).map(g=>({id:g.id,title:g.title,
      disabled:g.id!==st.gameId&&ps2ActiveCopies(s,g.id,index)>=ps2GameCopies(s,g.id)}))};
   });
   return {unlocked,hourlyPrice:ps2HourPrice(s),ceiling:ps2AllowedHourlyCeiling(s),count:stations.length,
    available:view.filter(v=>v.available).length,occupied:view.reduce((n,v)=>n+v.occupied,0),
    sessions:s.ps2Sessions??0,revenue:s.ps2Revenue??0,copies:PS2_GAME_CATALOG.reduce((n,g)=>n+ps2GameCopies(s,g.id),0),
    benchPrice:price,benchDisabled:!unlocked||stations.length>=3||!slots.length||s.cash<price,
    benchText:!unlocked?"Disponível em 2006":stations.length>=3?"Limite de 3 bancadas PS2":!slots.length?"Sem espaço ou caminho livre":
     s.cash<price?"Caixa insuficiente":"Comprar bancada PS2",
    secondSeatPrice:ps2SecondSeatPrice(s),repairPrice:ps2RepairPrice(s),slots,
    games:PS2_GAME_CATALOG.map(g=>{
     const copies=ps2GameCopies(s,g.id),price=ps2GamePrice(s,g.id),hasStation=stations.length>0;
     return {...g,price,copies,disabled:!unlocked||!hasStation||copies>=3||s.cash<price,
      buyText:!unlocked?"Disponível em 2006":!hasStation?"Instale uma bancada PS2":copies>=3?"Acervo completo":s.cash<price?"Caixa insuficiente":"Comprar jogo"};
    }),stations:view};
  },
  buyStation(slot){return buyPs2Station(getState(),slot);},
  buyGame(id){return known(id)?buyPs2Game(getState(),id):invalid;},
  setGame(i,id){return valid(i)&&(id===""||known(id))?setPs2StationGame(getState(),i,id===""?null:id as Ps2GameId):invalid;},
  secondSeat(i){return valid(i)?buyPs2SecondSeat(getState(),i):invalid;},
  repair(i){return valid(i)?repairPs2(getState(),i):invalid;},
  power(i,on){return valid(i)&&typeof on==="boolean"?setPs2Power(getState(),i,on):invalid;},
  changePrice(direction){return direction===1||direction===-1?setPs2HourlyPrice(getState(),Math.round((ps2HourPrice(getState())+direction*.25)*100)/100):invalid;}
 };
}
