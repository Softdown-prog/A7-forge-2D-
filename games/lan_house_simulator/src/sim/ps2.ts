/** PlayStation 2 service. 2006 is a progression decision, not a release date. */
import type {GameState,Result} from "./types.js";
import {annualHourlyCeiling,isHistorical,priceIndex,sessionPrice,yearFromMinutes} from "./historicalEconomy.js";
import {furnitureSlots} from "./furnitureLayout.js";
import {consolePoint,consoleSeat,consoleApproach,consoleBusy,consoleFootprints} from "./consoleLayout.js";
import {layoutGoals,layoutPlacementIssue,objectTouchesCustomer} from "./layoutGeometry.js";
import {navigableRoute,canTraverseLocalStep,routesForCurrentCustomers} from "./navigation.js";
import {entrance} from "./simulationState.js";
import {activeRetailQueuesReachable} from "./retailQueue.js";

export const PS2_UNLOCK_YEAR=2006;
export const PS2_MAX_STATIONS=3;
export const PS2_BASE_BENCH_PRICE=980;
export const PS2_BASE_HOURLY_RATE=4;
export const PS2_REPAIR_COST=65;
export const PS2_WEAR_LIMIT=100;
export const PS2_GAME_CATALOG=[
 {id:"cidade-em-fuga",title:"Cidade em Fuga",genre:"Corrida urbana",basePrice:72},
 {id:"arena-dos-guardioes",title:"Arena dos Guardiões",genre:"Ação",basePrice:79},
 {id:"futsal-de-bairro",title:"Futsal de Bairro",genre:"Esporte",basePrice:64},
 {id:"cosmos-2006",title:"Cosmos 2006",genre:"Ficção científica",basePrice:84},
 {id:"batida-de-rua",title:"Batida de Rua",genre:"Ritmo",basePrice:69}
] as const;
export type Ps2GameId=typeof PS2_GAME_CATALOG[number]["id"];
export type Ps2GameSpec=typeof PS2_GAME_CATALOG[number];
export type Ps2Station={slotId:string;wear:number;gameId?:Ps2GameId;secondSeat?:boolean;poweredOff?:boolean};
const money=(value:number)=>Math.round(value*100)/100;
const eraFactor=(s:GameState)=>priceIndex(yearFromMinutes(s.totalMinutes))/priceIndex(PS2_UNLOCK_YEAR);
export function ps2Unlocked(s:Pick<GameState,"totalMinutes"|"economyVersion">):boolean{
 return isHistorical(s)&&yearFromMinutes(s.totalMinutes)>=PS2_UNLOCK_YEAR;
}
export function ps2BenchPrice(s:GameState):number{return money(PS2_BASE_BENCH_PRICE*eraFactor(s));}
export function ps2GamePrice(s:GameState,id:Ps2GameId):number{
 const title=PS2_GAME_CATALOG.find(g=>g.id===id);
 return title?money(title.basePrice*eraFactor(s)):0;
}
export function ps2DefaultHourlyPrice(s:GameState):number{
 const proposed=Math.floor(PS2_BASE_HOURLY_RATE*eraFactor(s)*4+1e-8)/4;
 return Math.min(ps2AllowedHourlyCeiling(s),proposed);
}
export function ps2AllowedHourlyCeiling(s:GameState):number{return annualHourlyCeiling(yearFromMinutes(s.totalMinutes));}
export function ps2HourPrice(s:GameState):number{return s.ps2HourlyPrice??ps2DefaultHourlyPrice(s);}
export function ps2SessionPrice(s:GameState,minutes:number):number{return sessionPrice(ps2HourPrice(s),minutes);}
export function setPs2HourlyPrice(s:GameState,price:number):Result{
 if(!ps2Unlocked(s)||!s.ps2Stations?.length)return {ok:false,message:"Instale primeiro uma bancada PS2 a partir de 2006."};
 if(!Number.isFinite(price)||price<.5||price>ps2AllowedHourlyCeiling(s)||Math.abs(price*4-Math.round(price*4))>1e-8)
  return {ok:false,message:"Preço PS2 entre R$ 0,50 e R$ "+ps2AllowedHourlyCeiling(s).toFixed(2)+", em passos de R$ 0,25."};
 s.ps2HourlyPrice=price;
 return {ok:true,message:"PS2: R$ "+price.toFixed(2)+" por hora."};
}
export const ps2StationPoint=(s:GameState,i:number)=>consolePoint(s,"ps2",i);
export const ps2Seat=(s:GameState,i:number,n:0|1=0)=>consoleSeat(s,"ps2",i,n);
export const ps2SeatApproach=(s:GameState,i:number,n:0|1=0)=>consoleApproach(s,"ps2",i,n);
export const ps2StationBusy=(s:GameState,i:number)=>consoleBusy(s,"ps2",i);
export const ps2GameCopies=(s:Pick<GameState,"ps2Games">,id:Ps2GameId):number=>s.ps2Games?.[id]??0;
export const ps2ActiveCopies=(s:GameState,id:Ps2GameId,exclude=-1):number=>(s.ps2Stations??[]).filter((st,i)=>i!==exclude&&st.gameId===id).length;
export function ps2PlayableGame(s:GameState,index:number):Ps2GameId|null{
 const id=s.ps2Stations?.[index]?.gameId;
 return id&&ps2GameCopies(s,id)>0&&ps2ActiveCopies(s,id)<=ps2GameCopies(s,id)?id:null;
}
export function ps2OpenSeat(s:GameState,index:number):0|1|null{
 const st=s.ps2Stations?.[index];
 if(!ps2Unlocked(s)||!st||st.poweredOff||st.wear>=100||!ps2PlayableGame(s,index))return null;
 for(const n of (st.secondSeat?[0,1] as const:[0] as const)){
  if(consoleBusy(s,"ps2",index,n))continue;
  const side=ps2SeatApproach(s,index,n),seat=ps2Seat(s,index,n);
  if(side&&seat&&canTraverseLocalStep(s,side,seat))return n;
 }
 return null;
}
export const ps2StationAvailable=(s:GameState,i:number):boolean=>ps2OpenSeat(s,i)!==null;

/** Candidate includes the new physical table, so routes are validated BEFORE charging. */
function installationIssue(s:GameState,index:number,checkPeople:boolean):string|null{
 const body=consoleFootprints(s,true).find(o=>o.id==="console:ps2:"+s.ps2Stations?.[index]?.slotId);
 if(!body)return "Posição de PS2 inválida.";
 const issue=layoutPlacementIssue(s,body);if(issue)return issue;
 if(checkPeople&&s.customers.some(c=>objectTouchesCustomer(body,c)))return "Aguarde o cliente sair dessa posição.";
 const st=s.ps2Stations![index]!;
 for(const n of (st.secondSeat?[0,1] as const:[0] as const)){
  const side=ps2SeatApproach(s,index,n),seat=ps2Seat(s,index,n);
  if(!side||!seat||!navigableRoute(s,entrance(s),side)||!canTraverseLocalStep(s,side,seat))
   return "Deixe um corredor livre até cada cadeira do PS2.";
 }
 if(layoutGoals(s).some(p=>!navigableRoute(s,entrance(s),p)))return "O PS2 bloquearia uma passagem do salão.";
 if(checkPeople){
  if(!activeRetailQueuesReachable(s))return "O PS2 bloquearia a fila de compras.";
  for(const c of s.customers)if(!navigableRoute(s,c,c.route?.at(-1)??c.target))return "Esta posição prende um cliente.";
 }
 return null;
}
function candidate(s:GameState,slotId:string):GameState{return {...s,ps2Stations:[...(s.ps2Stations??[]),{slotId,wear:0}]};}
export function ps2PlacementSlots(s:GameState){
 const used=new Set([...(s.ps1Stations??[]),...(s.ps2Stations??[])].map(st=>st.slotId));
 return furnitureSlots(s).filter(p=>p.surface==="floor"&&p.id.startsWith("floor-")&&!p.id.startsWith("floor-grid-")&&!used.has(p.id))
  .filter(p=>!installationIssue(candidate(s,p.id),s.ps2Stations?.length??0,true));
}
export function buyPs2Station(s:GameState,slotId:string):Result{
 if(!ps2Unlocked(s))return {ok:false,message:"PlayStation 2 disponível a partir de 2006."};
 if((s.ps2Stations?.length??0)>=3)return {ok:false,message:"Limite de três bancadas PS2."};
 if(!ps2PlacementSlots(s).some(p=>p.id===slotId))return {ok:false,message:"Sem espaço ou caminho livre para PS2, TV e cadeira."};
 const price=ps2BenchPrice(s);
 if(!Number.isFinite(s.cash)||s.cash<price)return {ok:false,message:"Caixa insuficiente para a bancada PS2."};
 s.cash=money(s.cash-price);s.expenses=money(s.expenses+price);
 (s.ps2Stations??=[]).push({slotId,wear:0});
 s.ps2HourlyPrice??=ps2DefaultHourlyPrice(s);
 routesForCurrentCustomers(s);
 return {ok:true,message:"PS2, TV, bancada, cadeira e controle instalados: -R$ "+price.toFixed(2)+". Compre um jogo para atender."};
}
export function buyPs2Game(s:GameState,id:Ps2GameId):Result{
 const game=PS2_GAME_CATALOG.find(g=>g.id===id);
 if(!game)return {ok:false,message:"Jogo PS2 desconhecido."};
 if(!ps2Unlocked(s)||!s.ps2Stations?.length)return {ok:false,message:"Instale primeiro uma bancada PS2 em 2006."};
 if(ps2GameCopies(s,id)>=3)return {ok:false,message:"Já há três cópias deste jogo PS2."};
 const price=ps2GamePrice(s,id);
 if(!Number.isFinite(s.cash)||s.cash<price)return {ok:false,message:"Caixa insuficiente para "+game.title+"."};
 s.cash=money(s.cash-price);s.expenses=money(s.expenses+price);
 const stock=s.ps2Games??(s.ps2Games={});stock[id]=ps2GameCopies(s,id)+1;
 const empty=s.ps2Stations.findIndex((st,i)=>!st.gameId&&!ps2StationBusy(s,i));
 if(empty>=0)s.ps2Stations[empty]!.gameId=id;
 return {ok:true,message:game.title+" comprado: -R$ "+price.toFixed(2)+(empty>=0?" · inserido na bancada "+(empty+1)+".":".")};
}
export function setPs2StationGame(s:GameState,index:number,id:Ps2GameId|null):Result{
 const st=s.ps2Stations?.[index];if(!st)return {ok:false,message:"Bancada PS2 inexistente."};
 if(ps2StationBusy(s,index))return {ok:false,message:"Aguarde os jogadores saírem para trocar o jogo."};
 if(id!==null&&(!PS2_GAME_CATALOG.some(g=>g.id===id)||ps2ActiveCopies(s,id,index)>=ps2GameCopies(s,id)))
  return {ok:false,message:"Nenhuma cópia livre deste jogo PS2."};
 if(id===null)delete st.gameId;else st.gameId=id;
 return {ok:true,message:id===null?"PS2 sem jogo. Atendimento pausado.":"Jogo PS2 inserido na bancada "+(index+1)+"."};
}
export const ps2SecondSeatPrice=(s:GameState):number=>money(160*eraFactor(s));
export function buyPs2SecondSeat(s:GameState,index:number):Result{
 const st=s.ps2Stations?.[index];
 if(!ps2Unlocked(s)||!st)return {ok:false,message:"Bancada PS2 inexistente."};
 if(st.secondSeat)return {ok:false,message:"Este PS2 já tem duas cadeiras."};
 if(ps2StationBusy(s,index))return {ok:false,message:"Aguarde os jogadores saírem para instalar a cadeira."};
 const next={...s,ps2Stations:s.ps2Stations!.map((v,i)=>i===index?{...v,secondSeat:true}:v)};
 const issue=installationIssue(next,index,true);if(issue)return {ok:false,message:issue};
 const price=ps2SecondSeatPrice(s);if(s.cash<price)return {ok:false,message:"Caixa insuficiente para cadeira e controle PS2."};
 s.cash=money(s.cash-price);s.expenses=money(s.expenses+price);st.secondSeat=true;
 return {ok:true,message:"Segunda cadeira e controle PS2 instalados: -R$ "+price.toFixed(2)+"."};
}
export const ps2RepairPrice=(s:GameState):number=>money(PS2_REPAIR_COST*eraFactor(s));
export function repairPs2(s:GameState,index:number):Result{
 const st=s.ps2Stations?.[index];if(!st)return {ok:false,message:"Bancada PS2 inexistente."};
 if(ps2StationBusy(s,index))return {ok:false,message:"Aguarde os jogadores saírem para revisar o PS2."};
 if(st.wear<10)return {ok:false,message:"O PS2 e os controles ainda não precisam de manutenção."};
 const price=ps2RepairPrice(s);if(s.cash<price)return {ok:false,message:"Caixa insuficiente para manutenção PS2."};
 s.cash=money(s.cash-price);s.expenses=money(s.expenses+price);st.wear=0;
 return {ok:true,message:"PS2 e controles revisados: -R$ "+price.toFixed(2)+"."};
}
export function setPs2Power(s:GameState,index:number,on:boolean):Result{
 const st=s.ps2Stations?.[index];if(!st)return {ok:false,message:"Bancada PS2 inexistente."};
 if(ps2StationBusy(s,index))return {ok:false,message:"Aguarde a sessão terminar antes de desligar o PS2."};
 st.poweredOff=!on;return {ok:true,message:on?"PS2 ligado.":"PS2 desligado. Atendimento pausado."};
}
export {ps2EnergyCostPerMinute} from "./consoleEnergy.js";
export function ps2SessionWear(s:GameState,index:number):void{
 const st=s.ps2Stations?.[index];if(st)st.wear=Math.min(100,Math.round((st.wear+.025)*1000)/1000);
}
export function validPs2State(value:Partial<GameState>):boolean{
 const stations=value.ps2Stations;
 const clients=Array.isArray(value.customers)?value.customers:[];
 if(stations===undefined)return value.ps2Games===undefined&&value.ps2HourlyPrice===undefined&&value.ps2Sessions===undefined&&value.ps2Revenue===undefined&&
  clients.every(c=>c&&c.ps2StationIndex===undefined&&c.ps2SeatIndex===undefined);
 if(!Array.isArray(stations)||stations.length>3||!isHistorical(value as GameState))return false;
 if(!Number.isFinite(value.totalMinutes)||(stations.length||Object.keys(value.ps2Games??{}).length)&&!ps2Unlocked(value as GameState))return false;
 const stock=value.ps2Games;
 if(stock!==undefined){
  if(!stock||typeof stock!=="object"||Array.isArray(stock))return false;
  for(const [id,n] of Object.entries(stock))if(!PS2_GAME_CATALOG.some(g=>g.id===id)||!Number.isInteger(n)||n!<1||n!>3)return false;
 }
 const ids=new Set<string>(),copies=new Map<Ps2GameId,number>();
 const slots=new Set(furnitureSlots(value as GameState).filter(p=>p.surface==="floor"&&!p.id.startsWith("floor-grid-")).map(p=>p.id));
 for(const st of stations){
  if(!st||!slots.has(st.slotId)||ids.has(st.slotId)||!Number.isFinite(st.wear)||st.wear<0||st.wear>100||
    [st.secondSeat,st.poweredOff].some(b=>b!==undefined&&typeof b!=="boolean"))return false;
  ids.add(st.slotId);
  if(st.gameId!==undefined){
   if(!PS2_GAME_CATALOG.some(g=>g.id===st.gameId))return false;
   copies.set(st.gameId,(copies.get(st.gameId)??0)+1);
  }
 }
 for(const [id,n] of copies)if(n>ps2GameCopies(value as GameState,id))return false;
 const cents=(n:number)=>Number.isFinite(n)&&Math.abs(n*100-Math.round(n*100))<1e-4;
 if(value.ps2HourlyPrice!==undefined&&(!cents(value.ps2HourlyPrice)||value.ps2HourlyPrice<.5||value.ps2HourlyPrice>ps2AllowedHourlyCeiling(value as GameState)||Math.abs(value.ps2HourlyPrice*4-Math.round(value.ps2HourlyPrice*4))>1e-8))return false;
 if(value.ps2Sessions!==undefined&&(!Number.isInteger(value.ps2Sessions)||value.ps2Sessions<0||value.ps2Sessions>1e7))return false;
 if(value.ps2Revenue!==undefined&&(!cents(value.ps2Revenue)||value.ps2Revenue<0||value.ps2Revenue>1e9))return false;
 const occupied=new Set<string>();
 for(const c of clients){
  if(!c)return false;
  if(c.consolePaidHourly!==undefined&&(!cents(c.consolePaidHourly)||c.consolePaidHourly<.5||c.consolePaidHourly>40))return false;
  if(c.ps2StationIndex===undefined){if(c.ps2SeatIndex!==undefined)return false;continue;}
  const i=c.ps2StationIndex,n=c.ps2SeatIndex??0,st=stations[i];
  if(!Number.isInteger(i)||i<0||!st||c.pcIndex!==null||c.ps1StationIndex!==undefined||c.ps1SeatIndex!==undefined||
    (n!==0&&n!==1)||(n===1&&!st.secondSeat)||!["to_pc","sitting","using","standing"].includes(c.stage)||
    !st.gameId||st.poweredOff||!Number.isFinite(c.x)||!Number.isFinite(c.y))return false;
  const key=i+":"+n;if(occupied.has(key))return false;occupied.add(key);
 }
 // Validate geometry only after all externally supplied structures are vetted.
 if(!Array.isArray(value.furniturePlacements??[])||!Array.isArray(value.ps1Stations??[]))return false;
 const s=value as GameState;
 return stations.every((_,i)=>!installationIssue(s,i,false));
}
