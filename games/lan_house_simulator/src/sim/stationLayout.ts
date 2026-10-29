/** Read-only annex geometry and save validation, without installation commands. */
import type {GameState} from "./types.js";
import type {PlacedPoint} from "./layout.js";


export interface AnnexComputerSlot {id:string;position:PlacedPoint;wing:"west"|"east"|"north"}

export const ANNEX_PC_COST=320;

/** Uma bancada independente por faixa construída; não desloca os PCs originais. */
export function annexComputerSlots(s:GameState):AnnexComputerSlot[]{
 const e=s.roomExtensions??{west:0,east:0,south:0,north:0};
 const slots:AnnexComputerSlot[]=[];
 // Bancadas na ala oeste acompanham a parede lateral: o monitor fica junto
 // dela e a cadeira aponta para o interior do salão, não para a parede.
 for(let i=1;i<=e.west;i++)slots.push({id:"pc-west-"+i,wing:"west",position:{x:-2*i+0.18,y:1.42,rotation:3}});
 for(let i=1;i<=e.east;i++)slots.push({id:"pc-east-"+i,wing:"east",position:{x:8+2*s.expansionLevel+2*(i-1)+0.22,y:1.42}});
 for(let i=1;i<=(e.north??0);i++)slots.push({id:"pc-north-"+i,wing:"north",position:{x:5.0,y:-2*i+0.13}});
 return slots;
}

export function annexComputerPosition(s:GameState,slotId:string):PlacedPoint|null{
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
