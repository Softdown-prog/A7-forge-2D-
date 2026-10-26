/**
 * Interface de aplicação para compras e operações das estações.
 * A UI não conhece GameState nem as funções internas da simulação.
 * Cada comando resolve o estado atual, inclusive após importar um save.
 */
import type {GameState,Result} from "../sim/types.js";
import {pcCount} from "../sim/engine.js";
import {buyPlatform,buyPart,HARDWARE_LABELS,type HardwareKind} from "../sim/hardware.js";
import {buyGpu,GPU_CATALOG,type GpuId} from "../sim/gpu.js";
import {WINDOWS_ERAS,licenseWindows,type WindowsEdition} from "../sim/era.js";
import {LCD_CATALOG,buyLcdKit,type LcdId} from "../sim/computerModels.js";
import {toggleStationPower} from "../sim/stationPower.js";
import {repairComputer,upgradeComputer} from "../sim/economy.js";

export interface StationActionsPort {
 count():number;
 isHardwareTab(tab:string):boolean;
 isHardwareKind(kind:string):boolean;
 isWindowsEdition(id:string):boolean;
 isGpuId(id:string):boolean;
 isLcdId(id:string):boolean;
 platform(index:number,id:string):Result;
 component(index:number,kind:string,id:string):Result;
 gpu(index:number,id:string):Result;
 windows(index:number,id:string):Result;
 lcd(index:number,id:string):Result;
 power(index:number):Result;
 repair(index:number):Result;
 upgrade(index:number):Result;
}
const invalid:Result={ok:false,message:"Estação ou item inválido."};
const validIndex=(state:GameState,index:number)=>Number.isInteger(index)&&index>=0&&index<pcCount(state);
const isKind=(kind:string):kind is HardwareKind=>Object.hasOwn(HARDWARE_LABELS,kind);
const isEdition=(id:string):id is WindowsEdition=>WINDOWS_ERAS.some(x=>x.id===id);
const isGpu=(id:string):id is GpuId=>GPU_CATALOG.some(x=>x.id===id);
const isLcd=(id:string):id is LcdId=>LCD_CATALOG.some(x=>x.id===id);
export function createStationActionsPort(getState:()=>GameState):StationActionsPort{
 return {
  count:()=>pcCount(getState()),
  isHardwareTab:tab=>tab==="platform"||isKind(tab),
  isHardwareKind:isKind,isWindowsEdition:isEdition,isGpuId:isGpu,isLcdId:isLcd,
  platform(index,id){const s=getState();return validIndex(s,index)&&id?buyPlatform(s,index,id):invalid;},
  component(index,kind,id){const s=getState();return validIndex(s,index)&&isKind(kind)&&!!id?buyPart(s,index,kind,id):invalid;},
  gpu(index,id){const s=getState();return validIndex(s,index)&&isGpu(id)?buyGpu(s,index,id):invalid;},
  windows(index,id){const s=getState();return validIndex(s,index)&&isEdition(id)?licenseWindows(s,index,id):invalid;},
  lcd(index,id){const s=getState();return validIndex(s,index)&&isLcd(id)?buyLcdKit(s,index,id):invalid;},
  power(index){const s=getState();return validIndex(s,index)?toggleStationPower(s,index):invalid;},
  repair(index){const s=getState();return validIndex(s,index)?repairComputer(s,index):invalid;},
  upgrade(index){const s=getState();return validIndex(s,index)?upgradeComputer(s,index):invalid;}
 };
}
