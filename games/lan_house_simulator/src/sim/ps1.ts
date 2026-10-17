import type {GameState,Point,Result} from "./types.js";
import {DAY_MINUTES} from "./types.js";
import {availablePlacementSlots,furnitureSlots,shopPrice} from "./shop.js";
import {annualHourlyCeiling,isHistorical,yearFromMinutes} from "./historicalEconomy.js";

/** Marco de design: mistura das antigas locadoras de console com lan houses. */
export const PS1_UNLOCK_YEAR=2002;
export const PS1_MAX_STATIONS=3;
export const PS1_REPAIR_COST=45;
export const PS1_WEAR_LIMIT=100;
export type Ps1Station={slotId:string;wear:number};
const in2002=(s:GameState):boolean=>isHistorical(s)&&yearFromMinutes(s.totalMinutes)>=PS1_UNLOCK_YEAR;
const coin=(v:number):number=>Math.round(v*100)/100;
/** Bancadas usam os pontos largos do salão, não as casas miúdas da decoração. */
export function ps1PlacementSlots(s:GameState){
 const free=new Set(availablePlacementSlots(s,"table").map(p=>p.id));
 return furnitureSlots(s).filter(p=>p.surface==="floor"&&
  p.id.startsWith("floor-")&&!p.id.startsWith("floor-grid-")&&free.has(p.id));
}
export function ps1StationPoint(s:GameState,index:number):Point|null{
 const id=s.ps1Stations?.[index]?.slotId;
 const slot=id&&furnitureSlots(s).find(p=>p.id===id&&p.surface==="floor");
 return slot?{x:slot.x,y:slot.y}:null;
}
export function ps1Seat(s:GameState,index:number):Point|null{
 const p=ps1StationPoint(s,index);
 return p?{x:p.x+.43,y:p.y+.77}:null;
}
export function ps1HourPrice(s:GameState):number{
 return s.ps1HourlyPrice??2.5;
}
export function ps1AllowedHourlyCeiling(s:GameState):number{
 return annualHourlyCeiling(yearFromMinutes(s.totalMinutes));
}
export function ps1SessionPrice(s:GameState,minutes:number):number{
 return coin(ps1HourPrice(s)*minutes/60);
}
export function buyPs1Station(s:GameState,slotId:string):Result{
 if(!in2002(s))return {ok:false,message:"Bancada de PlayStation disponível a partir de 2002."};
 if((s.ps1Stations?.length??0)>=PS1_MAX_STATIONS)
  return {ok:false,message:"Limite de três bancadas de PlayStation."};
 if(!ps1PlacementSlots(s).some(p=>p.id===slotId))
  return {ok:false,message:"Posição sem espaço livre para bancada, TV e cadeira."};
 const cost=shopPrice(s,"ps1");
 if(s.cash<cost)return {ok:false,message:"Caixa insuficiente para PlayStation, TV, bancada e cadeira."};
 s.cash=coin(s.cash-cost);s.expenses=coin(s.expenses+cost);
 (s.ps1Stations??=[]).push({slotId,wear:0});
 return {ok:true,message:"PlayStation 1 instalado! TV de tubo, bancada e cadeira: -R$ "+cost+"."};
}
export function setPs1HourlyPrice(s:GameState,price:number):Result{
 if(!in2002(s)||!(s.ps1Stations?.length))
  return {ok:false,message:"Compre uma bancada a partir de 2002 antes de configurar preços."};
 if(!Number.isFinite(price)||price<.5||price>ps1AllowedHourlyCeiling(s)||
   Math.abs(price*4-Math.round(price*4))>1e-8)
  return {ok:false,message:"Preço permitido entre R$ 0,50 e R$ "+
   ps1AllowedHourlyCeiling(s).toFixed(2)+", em intervalos de R$ 0,25."};
 s.ps1HourlyPrice=price;
 return {ok:true,message:"PlayStation: R$ "+price.toFixed(2)+" por hora."};
}
export function ps1AvailableStation(s:GameState):number|undefined{
 return s.ps1Stations?.findIndex((station,i)=>station.wear<PS1_WEAR_LIMIT&&
  !s.customers.some(c=>c.ps1StationIndex===i&&
   ["to_pc","sitting","using","standing"].includes(c.stage))) ?? -1
  /* índice -1 significa nenhuma vaga */ ;
}
export function ps1EnergyCostPerMinute(s:GameState):number{
 return (s.ps1Stations?.length??0)*.0008;
}
export function ps1SessionWear(s:GameState,index:number):void{
 const station=s.ps1Stations?.[index];
 if(station)station.wear=Math.min(PS1_WEAR_LIMIT,Math.round((station.wear+.035)*1000)/1000);
}
export function repairPs1Controls(s:GameState,index:number):Result{
 const station=s.ps1Stations?.[index];
 if(!station)return {ok:false,message:"Bancada inexistente."};
 if(s.customers.some(c=>c.ps1StationIndex===index&&["to_pc","sitting","using","standing"].includes(c.stage)))
  return {ok:false,message:"Aguarde o cliente sair para trocar os controles."};
 if(station.wear<10)return {ok:false,message:"Os controles ainda não precisam de manutenção."};
 if(s.cash<PS1_REPAIR_COST)return {ok:false,message:"Caixa insuficiente para a manutenção dos controles."};
 s.cash=coin(s.cash-PS1_REPAIR_COST);s.expenses=coin(s.expenses+PS1_REPAIR_COST);
 station.wear=0;
 return {ok:true,message:"Controles da bancada PS1 "+(index+1)+" revisados: -R$ "+PS1_REPAIR_COST+"."};
}
export function validPs1State(s:Partial<GameState>):boolean{
 const allowed=s.ps1Stations;
 if(allowed===undefined)return s.ps1HourlyPrice===undefined&&s.ps1Sessions===undefined&&s.ps1Revenue===undefined;
 if(!Array.isArray(allowed)||allowed.length>PS1_MAX_STATIONS||!isHistorical(s as GameState))return false;
 if(allowed.length&&yearFromMinutes(s.totalMinutes??0)<PS1_UNLOCK_YEAR)return false;
 const used=new Set<string>();
 const slots=new Set(furnitureSlots(s as GameState).filter(p=>p.surface==="floor"&&
  p.id.startsWith("floor-")&&!p.id.startsWith("floor-grid-")).map(p=>p.id));
 for(const st of allowed){
  if(!st||typeof st.slotId!=="string"||!slots.has(st.slotId)||used.has(st.slotId)||
     !Number.isFinite(st.wear)||st.wear<0||st.wear>PS1_WEAR_LIMIT)return false;
  used.add(st.slotId);
 }
 if((s.furniturePlacements??[]).some(p=>used.has(p.slotId)))return false;
 const cents=(n:number)=>Number.isFinite(n)&&Math.abs(n*100-Math.round(n*100))<1e-4;
 if(s.ps1HourlyPrice!==undefined&&(!cents(s.ps1HourlyPrice)||s.ps1HourlyPrice<.5||
     Math.abs(s.ps1HourlyPrice*4-Math.round(s.ps1HourlyPrice*4))>1e-8||
     s.ps1HourlyPrice>annualHourlyCeiling(yearFromMinutes(s.totalMinutes??0))))return false;
 if(s.ps1Sessions!==undefined&&(!Number.isInteger(s.ps1Sessions)||s.ps1Sessions<0||s.ps1Sessions>1e7))return false;
 if(s.ps1Revenue!==undefined&&(!cents(s.ps1Revenue)||s.ps1Revenue<0||s.ps1Revenue>1e9))return false;
 return true;
}
