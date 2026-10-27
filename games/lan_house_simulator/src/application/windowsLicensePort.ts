/** Read-only licensing view of the current game (safe after save import). */
import type {GameState} from "../sim/types.js";
import {pcCount} from "../sim/engine.js";
import {gameYear,WINDOWS_ERAS,installedWindows} from "../sim/era.js";
import {windowsHardwareIssues} from "../sim/hardware.js";
import {stationPoweredOn} from "../sim/stationPower.js";
import {stationOccupied} from "../sim/computerModels.js";

export interface WindowsLicenseChoice {
 id:string;label:string;disabled:boolean;title:string;
}
export interface WindowsLicenseRow{
 index:number;title:string;choices:ReadonlyArray<WindowsLicenseChoice>;
}
export interface WindowsLicensePort{rows():ReadonlyArray<WindowsLicenseRow>}
export function createWindowsLicensePort(getState:()=>GameState):WindowsLicensePort{
 return {rows(){
  const s=getState(),year=gameYear(s);
  return Array.from({length:pcCount(s)},(_,index)=>{
   const edition=WINDOWS_ERAS.find(w=>w.id===installedWindows(s,index))!;
   const licensed=s.pcWindowsLicenses?.[index]===true;
   return {
    index,title:"PC "+(index+1)+" · "+edition.name+(licensed?" · licenciado":" · sem licença"),
    choices:WINDOWS_ERAS.map(item=>{
     const already=licensed&&edition.id===item.id;
     const reasons=windowsHardwareIssues(s,index,item.id);
     return {
      id:item.id,
      label:item.name+" · "+(year<item.year?"🔒 "+item.year:already?"Instalado":"R$ "+item.cost),
      disabled:year<item.year||already||s.cash<item.cost||reasons.length>0||
       stationPoweredOn(s,index)||stationOccupied(s,index)||
       !!s.repairJobs?.some(job=>job.pc===index),
      title:reasons.join(" ")
     };
    })
   };
  });
 }};
}
