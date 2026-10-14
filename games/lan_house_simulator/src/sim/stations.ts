import type {GameState,Point,Result} from "./types.js";
import {COUNTER_QUEUE,computerSeat} from "./route.js";
import {navigableRoute} from "./navigation.js";
import {emptyStationAccount} from "./stationAccounting.js";

export interface AnnexComputerSlot {id:string;position:Point;wing:"west"|"east"|"north"}
export const ANNEX_PC_COST=320;
/** Uma bancada independente por faixa construída; não desloca os PCs originais. */
export function annexComputerSlots(s:GameState):AnnexComputerSlot[]{
 const e=s.roomExtensions??{west:0,east:0,south:0,north:0};
 const slots:AnnexComputerSlot[]=[];
 for(let i=1;i<=e.west;i++)slots.push({id:"pc-west-"+i,wing:"west",position:{x:-2*i+0.30,y:1.42}});
 for(let i=1;i<=e.east;i++)slots.push({id:"pc-east-"+i,wing:"east",position:{x:8+2*s.expansionLevel+2*(i-1)+0.22,y:1.42}});
 for(let i=1;i<=(e.north??0);i++)slots.push({id:"pc-north-"+i,wing:"north",position:{x:5.0,y:-2*i+0.13}});
 return slots;
}
export function annexComputerPosition(s:GameState,slotId:string):Point|null{
 return annexComputerSlots(s).find(slot=>slot.id===slotId)?.position??null;
}
export function availableAnnexComputers(s:GameState):AnnexComputerSlot[]{
 const installed=new Set((s.annexPcs??[]).map(pc=>pc.slotId));
 return annexComputerSlots(s).filter(slot=>!installed.has(slot.id));
}
export function validAnnexComputers(s:GameState):boolean{
 if(s.annexPcs===undefined)return true;
 if(!Array.isArray(s.annexPcs)||s.annexPcs.length>15)return false;
 const valid=new Set(annexComputerSlots(s).map(x=>x.id)),seen=new Set<string>();
 for(const pc of s.annexPcs){
   if(!pc||typeof pc.slotId!=="string"||!valid.has(pc.slotId)||seen.has(pc.slotId))return false;
   seen.add(pc.slotId);
 }
 return true;
}
export function installAnnexComputer(s:GameState,slotId:string):Result{
 if(!availableAnnexComputers(s).some(slot=>slot.id===slotId))
   return {ok:false,message:"Posição de PC indisponível nesta ampliação."};
 if(s.cash<ANNEX_PC_COST)return {ok:false,message:"Caixa insuficiente para instalar computador."};
 const slot=annexComputerSlots(s).find(p=>p.id===slotId)!;
 if(!navigableRoute(s,COUNTER_QUEUE,computerSeat(slot.position)))
  return {ok:false,message:"Esta sala precisa de uma passagem acessível antes de instalar o PC."};
 const legacy=Math.max(3,Math.min(3+s.expansionLevel*2,s.installedPcs??3+s.expansionLevel*2));
 const index=legacy+(s.annexPcs?.length??0);
 s.cash-=ANNEX_PC_COST;s.expenses+=ANNEX_PC_COST;
 (s.annexPcs??=[]).push({slotId});
 if(s.stationLedger){
  while(s.stationLedger.length<index)s.stationLedger.push(emptyStationAccount());
  s.stationLedger[index]=emptyStationAccount();
 }
 (s.pcTiers??=[])[index]=1;
 (s.pcGpus??=[])[index]=null;
 if(s.pcLcdModels)s.pcLcdModels[index]=null;
 (s.pcWear??=[])[index]=0;
 return {ok:true,message:"PC instalado no anexo: -R$ "+ANNEX_PC_COST+"."};
}
