/** PS2 prototype rules. Not yet wired to purchases, customer flow or saves.
 * 2006 is the chosen unlock year of this game, not a claim about release dates.
 */
import type {GameState} from "./types.js";
import {annualHourlyCeiling,isHistorical,priceIndex,sessionPrice,yearFromMinutes} from "./historicalEconomy.js";

export const PS2_UNLOCK_YEAR=2006;
export const PS2_MAX_STATIONS=3;
export const PS2_BASE_BENCH_PRICE=980;
export const PS2_BASE_HOURLY_RATE=4;
export const PS2_GAME_CATALOG=[
 {id:"cidade-em-fuga",title:"Cidade em Fuga",genre:"Corrida urbana",basePrice:72},
 {id:"arena-dos-guardioes",title:"Arena dos Guardiões",genre:"Ação",basePrice:79},
 {id:"futsal-de-bairro",title:"Futsal de Bairro",genre:"Esporte",basePrice:64},
 {id:"cosmos-2006",title:"Cosmos 2006",genre:"Ficção científica",basePrice:84},
 {id:"batida-de-rua",title:"Batida de Rua",genre:"Ritmo",basePrice:69}
] as const;
export type Ps2GameId=typeof PS2_GAME_CATALOG[number]["id"];
export type Ps2GameSpec=typeof PS2_GAME_CATALOG[number];
export type Ps2Station={slotId:string;wear:number;gameId?:Ps2GameId;secondSeat?:boolean};
const money=(value:number)=>Math.round(value*100)/100;
const eraFactor=(s:GameState)=>priceIndex(yearFromMinutes(s.totalMinutes))/priceIndex(PS2_UNLOCK_YEAR);
export function ps2Unlocked(s:Pick<GameState,"totalMinutes"|"economyVersion">):boolean{
 return isHistorical(s)&&yearFromMinutes(s.totalMinutes)>=PS2_UNLOCK_YEAR;
}
/** Non-mutating price previews; the future purchase flow must revalidate. */
export function ps2BenchPrice(s:GameState):number{return money(PS2_BASE_BENCH_PRICE*eraFactor(s));}
export function ps2GamePrice(s:GameState,id:Ps2GameId):number{
 const title=PS2_GAME_CATALOG.find(g=>g.id===id);
 return title?money(title.basePrice*eraFactor(s)):0;
}
export function ps2DefaultHourlyPrice(s:GameState):number{
 const year=yearFromMinutes(s.totalMinutes);
 const proposed=Math.floor(PS2_BASE_HOURLY_RATE*eraFactor(s)*4+1e-8)/4;
 return Math.min(annualHourlyCeiling(year),proposed);
}
export function ps2SessionPrice(s:GameState,minutes:number):number{
 return sessionPrice(ps2DefaultHourlyPrice(s),minutes);
}
