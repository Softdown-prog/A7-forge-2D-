/** Era/catalog queries. Installation commands live in era.ts. */
import type {GameState} from "./types.js";
import {DAY_MINUTES} from "./types.js";
import {GAME_LAST_YEAR,GAME_FIRST_YEAR,DAYS_PER_YEAR} from "./mailCalendar.js";


/** O jogo usa 12 meses de 30 dias para avançar um ano. */
export function gameYear(state:Pick<GameState,"totalMinutes">):number{
 return Math.min(GAME_LAST_YEAR,GAME_FIRST_YEAR+Math.floor(Math.max(0,state.totalMinutes)/(DAY_MINUTES*DAYS_PER_YEAR)));
}

export const INTERNET_ERAS=[
 {tier:1,name:"Discada",year:1998,cost:0},
 {tier:2,name:"Via rádio",year:2002,cost:250},
 {tier:3,name:"Fibra óptica",year:2007,cost:500}
] as const;

export const WINDOWS_ERAS=[
 {id:"win98",name:"Windows 98",year:1998,cost:120},
 {id:"win2000",name:"Windows 2000",year:2000,cost:180},
 {id:"winxp",name:"Windows XP",year:2001,cost:260},
 {id:"winvista",name:"Windows Vista",year:2007,cost:350},
 {id:"win7",name:"Windows 7",year:2009,cost:420},
 {id:"win8",name:"Windows 8",year:2012,cost:460},
 {id:"win10",name:"Windows 10",year:2015,cost:520},
 {id:"win11",name:"Windows 11",year:2021,cost:620}
] as const;

export type WindowsEdition=(typeof WINDOWS_ERAS)[number]["id"];

export function installedWindows(s:GameState,index:number):WindowsEdition{
 const edition=s.pcWindows?.[index];
 return WINDOWS_ERAS.some(x=>x.id===edition)?edition as WindowsEdition:"win98";
}

export function windowsLicenseCost(edition:WindowsEdition):number{
 return WINDOWS_ERAS.find(x=>x.id===edition)!.cost;
}

export function internetUnlockYear(tier:number):number{
 return INTERNET_ERAS.find(x=>x.tier===tier)?.year??Number.POSITIVE_INFINITY;
}
