import type {GameState,Result} from "./types.js";
export type FurnitureKind="poster"|"plant"|"table";
export const SHOP_CATALOG=[
 {id:"expand",label:"Ampliar salão",category:"Expansão",description:"Libera espaço para mais dois PCs."},
 {id:"computer",label:"Computador com mesa",category:"Computadores",description:"Instala um computador completo."},
 {id:"poster",label:"Pôster",category:"Decoração",description:"Pôster geométrico de parede."},
 {id:"plant",label:"Planta",category:"Decoração",description:"Vaso com folhagens."},
 {id:"table",label:"Mesinha",category:"Móveis",description:"Mesa lateral decorativa."}
] as const;
export function shopPrice(s:GameState,id:string):number{
 return id==="expand"?650+s.expansionLevel*450:id==="computer"?320:id==="poster"?45:id==="plant"?85:id==="table"?140:0;
}
export function buyComputer(s:GameState):Result{
 const count=s.installedPcs??(3+s.expansionLevel*2),capacity=3+s.expansionLevel*2;
 if(count>=capacity)return {ok:false,message:"Amplie o salão antes de instalar outro PC."};
 const cost=shopPrice(s,"computer");
 if(s.cash<cost)return {ok:false,message:"Caixa insuficiente para o PC."};
 s.cash-=cost;s.expenses+=cost;s.installedPcs=count+1;
 (s.pcWear??=[])[count]=0;(s.pcTiers??=[])[count]=1;
 return {ok:true,message:"Novo PC instalado: -R$ "+cost+"."};
}
export function buyFurniture(s:GameState,kind:FurnitureKind):Result{
 const limits={poster:2,plant:2,table:1};
 if(!Object.prototype.hasOwnProperty.call(limits,kind))return {ok:false,message:"Móvel inválido."};
 const count=s.furniture?.[kind]??0;
 if(count>=limits[kind])return {ok:false,message:"Limite desse móvel atingido."};
 const cost=shopPrice(s,kind);
 if(s.cash<cost)return {ok:false,message:"Caixa insuficiente."};
 s.cash-=cost;s.expenses+=cost;
 (s.furniture??={poster:0,plant:0,table:0})[kind]=count+1;
 return {ok:true,message:"Móvel instalado: -R$ "+cost+"."};
}

/** Discrete build slots avoid the fixed NPC aisle (y=4.48), PCs and entrance. */
export interface PlacementSlot {id:string;x:number;y:number;surface:"wall"|"floor"}
export const FURNITURE_SLOTS:ReadonlyArray<PlacementSlot>=[
 {id:"wall-1",x:2.1,y:0.01,surface:"wall"},{id:"wall-2",x:4.35,y:0.01,surface:"wall"},
 {id:"floor-1",x:0.65,y:5.17,surface:"floor"},{id:"floor-2",x:2.45,y:5.17,surface:"floor"},
 {id:"floor-3",x:4.30,y:5.17,surface:"floor"},{id:"floor-4",x:6.15,y:5.17,surface:"floor"}
];
const LEGACY_SLOTS:Record<FurnitureKind,string[]>={poster:["wall-1","wall-2"],plant:["floor-1","floor-4"],table:["floor-2"]};
export function occupiedFurnitureSlots(s:GameState):Set<string>{
 const occupied=new Set((s.furniturePlacements??[]).map(p=>p.slotId));
 for(const kind of ["poster","plant","table"] as const){
  const positioned=(s.furniturePlacements??[]).filter(p=>p.kind===kind).length;
  const legacy=Math.max(0,(s.furniture?.[kind]??0)-positioned);
  for(let i=0;i<legacy;i++)if(LEGACY_SLOTS[kind][i])occupied.add(LEGACY_SLOTS[kind][i]!);
 }
 return occupied;
}
export function availablePlacementSlots(s:GameState,kind:FurnitureKind):PlacementSlot[]{
 if(kind!=="poster"&&kind!=="plant"&&kind!=="table")return [];
 const occupied=occupiedFurnitureSlots(s),surface=kind==="poster"?"wall":"floor";
 return FURNITURE_SLOTS.filter(slot=>slot.surface===surface&&!occupied.has(slot.id));
}
/** Deduct money only when a selected slot is confirmed. */
export function placeFurniture(s:GameState,kind:FurnitureKind,slotId:string):Result{
 if(!availablePlacementSlots(s,kind).some(slot=>slot.id===slotId))
  return {ok:false,message:"Posição ocupada ou incompatível com o móvel."};
 const bought=buyFurniture(s,kind);
 if(!bought.ok)return bought;
 (s.furniturePlacements??=[]).push({kind,slotId});
 return {ok:true,message:"Móvel instalado: -R$ "+shopPrice(s,kind)+"."};
}
export function validFurniturePlacements(s:GameState):boolean{
 if(s.furniturePlacements===undefined)return true;
 if(!Array.isArray(s.furniturePlacements)||s.furniturePlacements.length>5)return false;
 const used=new Set<string>(),counts:Record<FurnitureKind,number>={poster:0,plant:0,table:0};
 for(const p of s.furniturePlacements){
  if(!p||typeof p!=="object"||(p.kind!=="poster"&&p.kind!=="plant"&&p.kind!=="table"))return false;
  const slot=FURNITURE_SLOTS.find(v=>v.id===p.slotId);
  if(!slot||((p.kind==="poster")!==(slot.surface==="wall"))||used.has(p.slotId))return false;
  used.add(p.slotId);counts[p.kind]++;
  if(counts[p.kind]>(s.furniture?.[p.kind]??0))return false;
 }
 return counts.poster<=2&&counts.plant<=2&&counts.table<=1;
}
