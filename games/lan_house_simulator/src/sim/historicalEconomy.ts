import type {GameState} from "./types.js";
import {DAY_MINUTES} from "./types.js";
import {hardwareFor} from "./hardware.js";
import {hardwarePart} from "./hardwareCatalog.js";
import {installedWindows,WINDOWS_ERAS} from "./era.js";
import {gpuSpec,installedGpu} from "./gpu.js";
import {lcdSpec,installedLcd} from "./computerModels.js";

/** IPCA oficial do IBGE, acumulado em cada ano civil (%).
 * Quando o ano ainda não foi encerrado, a simulação congela o último
 * índice conhecido: não inventar números para o futuro. */
export const IPCA_ANNUAL:Readonly<Record<number,number>>={
 1998:1.65,1999:8.94,2000:5.97,2001:7.67,2002:12.53,
 2003:9.30,2004:7.60,2005:5.69,2006:3.14,2007:4.46,
 2008:5.90,2009:4.31,2010:5.91,2011:6.50,2012:5.84,
 2013:5.91,2014:6.41,2015:10.67,2016:6.29,2017:2.95,
 2018:3.75,2019:4.31,2020:4.52,2021:10.06,2022:5.79,
 2023:4.62,2024:4.83,2025:4.26
};
export const SESSION_PACKAGES=[30,45,60,90,120,180,240] as const;
export const MIN_HOURLY_PRICE=.50;
export const MAX_HOURLY_PRICE_1998=3; // Teto de design, NÃO tarifa histórica regulamentada.
const roundMoney=(amount:number)=>Math.round(amount*100)/100;
export function yearFromMinutes(minutes:number):number{
 return 1998+Math.floor(Math.max(0,minutes)/(DAY_MINUTES*360));
}
export function priceIndex(year:number):number{
 let factor=1;
 for(let y=1998;y<Math.min(2026,Math.max(1998,year));y++)
  factor*=1+(IPCA_ANNUAL[y]??0)/100;
 return factor;
}
export function ipcaLastYear(year:number):number|null{
 return Object.prototype.hasOwnProperty.call(IPCA_ANNUAL,year-1)?IPCA_ANNUAL[year-1]!:null;
}
export function annualHourlyCeiling(year:number):number{
 return Math.floor(MAX_HOURLY_PRICE_1998*priceIndex(year)*4+1e-7)/4;
}
function countPcs(s:GameState):number{
 const original=Math.max(3,Math.min(3+s.expansionLevel*2,s.installedPcs??(3+s.expansionLevel*2)));
 return original+(s.annexPcs?.length??0);
}
/** Ano ponderado das partes essenciais da estação e do Windows;
 * um PC 2010 com Windows 98 continua abaixo de seu potencial. */
export function stationVintage(s:GameState,index:number):number{
 const parts=hardwareFor(s,index);
 const cpu=hardwarePart(parts.cpu),ram=hardwarePart(parts.ram),
  board=hardwarePart(parts.motherboard),storage=hardwarePart(parts.storage);
 const os=WINDOWS_ERAS.find(p=>p.id===installedWindows(s,index));
 const gpu=gpuSpec(installedGpu(s,index));
 const lcd=lcdSpec(installedLcd(s,index));
 return .24*(cpu?.year??1998)+.16*(ram?.year??1998)+
  .12*(board?.year??1998)+.13*(storage?.year??1998)+
  .25*(os?.year??1998)+.07*(gpu?.year??1998)+
  .03*(lcd?.year??1998);
}
export function qualityMultiplier(s:GameState):number{
 const year=yearFromMinutes(s.totalMinutes),count=countPcs(s);
 const average=Array.from({length:count},(_,i)=>stationVintage(s,i))
  .reduce((total,y)=>total+y,0)/count;
 const gap=Math.max(0,year-average-3);
 return Math.max(.4,Math.min(1,1-gap*.065));
}
export function allowableHourlyPrice(s:GameState):number{
 const ceiling=annualHourlyCeiling(yearFromMinutes(s.totalMinutes));
 return Math.max(MIN_HOURLY_PRICE,Math.floor(ceiling*qualityMultiplier(s)*4+1e-7)/4);
}
/** Default fixed-price comparisons normalize denominations so that a
 * 2000s R$ 5 rate does not mean the same as R$ 5 in 1998. */
export function priceIn1998Terms(s:Pick<GameState,"totalMinutes">,price:number):number{
 return price/priceIndex(yearFromMinutes(s.totalMinutes));
}
export function sessionPrice(price:number,minutes:number):number{
 return roundMoney(Math.max(0,price)*Math.max(0,minutes)/60);
}
export function normalizedHourlyPrice(s:Pick<GameState,"totalMinutes">,price:number):number{
 return priceIn1998Terms(s,price)*4; // R$ 3/h em 1998 equivale à referência 12.
}
export function clampPriceToEra(s:GameState):boolean{
 const max=allowableHourlyPrice(s);
 const corrected=Math.min(max,Math.max(MIN_HOURLY_PRICE,s.pricePerHour));
 if(Math.abs(s.pricePerHour-corrected)<1e-8)return false;
 s.pricePerHour=corrected;
 return true;
}
export function suggestedHourlyPrice(s:GameState):number{
 return Math.min(allowableHourlyPrice(s),Math.floor(2.5*priceIndex(yearFromMinutes(s.totalMinutes))*4)/4);
}
export function referenceWage1998():number{return 130;}
