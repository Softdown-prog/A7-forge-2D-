import type {GameState,Result} from "./types.js";
import {gameYear} from "./era.js";

export const GPU_CATALOG=[
 {id:"gpu05",name:"PixelForce 6600",year:2005,cost:440,power:0.18,bonus:0.035,theme:"emerald"},
 {id:"gpu07",name:"PixelForce 8800",year:2007,cost:790,power:0.34,bonus:0.060,theme:"amber"},
 {id:"gpu09",name:"PixelForce 260",year:2009,cost:1150,power:0.49,bonus:0.085,theme:"cyan"},
 {id:"gpu11",name:"PixelForce 560",year:2011,cost:1590,power:0.62,bonus:0.11,theme:"violet"},
 {id:"gpu13",name:"PixelForce 770",year:2013,cost:2250,power:0.78,bonus:0.14,theme:"crimson"}
] as const;
export type GpuId=(typeof GPU_CATALOG)[number]["id"];
export function installedGpu(s:GameState,index:number):GpuId|null {
 const id=s.pcGpus?.[index];
 return GPU_CATALOG.some(x=>x.id===id)?id as GpuId:null;
}
export function gpuSpec(id:GpuId|null){
 return GPU_CATALOG.find(x=>x.id===id)??null;
}
export function gpuBonus(s:GameState,index:number):number{
 return gpuSpec(installedGpu(s,index))?.bonus??0;
}
export function buyGpu(s:GameState,index:number,id:GpuId):Result{
 const count=Math.max(3,Math.min(3+s.expansionLevel*2,s.installedPcs??(3+s.expansionLevel*2)))+(s.annexPcs?.length??0);
 if(!Number.isInteger(index)||index<0||index>=count)return {ok:false,message:"PC inexistente."};
 const spec=GPU_CATALOG.find(x=>x.id===id);
 if(!spec)return {ok:false,message:"Placa de vídeo desconhecida."};
 if(gameYear(s)<spec.year)return {ok:false,message:spec.name+" desbloqueia em "+spec.year+"."};
 const old=gpuSpec(installedGpu(s,index));
 if(old && old.year>=spec.year)return {ok:false,message:"Esta máquina já possui placa igual ou superior."};
 if(s.cash<spec.cost)return {ok:false,message:"Caixa insuficiente: R$ "+spec.cost+"."};
 s.cash-=spec.cost;s.expenses+=spec.cost;
 (s.pcGpus??=[])[index]=id;
 return {ok:true,message:"PC "+(index+1)+" equipado com "+spec.name+": -R$ "+spec.cost+"."};
}
