import type {GameState,Result} from "./types.js";
import {roomBounds,expansionPrice} from "./room.js";
import {WALL_COST} from "./walls.js";
import {annexComputerSlots,ANNEX_PC_COST,availableAnnexComputers} from "./stations.js";
export type FurnitureKind="poster"|"plant"|"table";
export const SHOP_CATALOG=[
 {id:"expand",label:"Ampliar salão",category:"Expansão",description:"Libera espaço para mais dois PCs."},
 {id:"computer",label:"Computador com mesa",category:"Computadores",description:"Instala um computador completo."},
 {id:"computer-annex",label:"PC no anexo",category:"Computadores",description:"Escolha uma posição livre nas áreas ampliadas para instalar uma estação."},
 {id:"extend-west",label:"Ampliar à esquerda",category:"Construção",description:"Adiciona uma faixa de 2 tiles a oeste."},
 {id:"extend-east",label:"Ampliar à direita",category:"Construção",description:"Adiciona uma faixa de 2 tiles a leste."},
 {id:"extend-north",label:"Ampliar os fundos",category:"Construção",description:"Adiciona 2 tiles para o norte, atrás do balcão. Porta sul fixa."},
 {id:"wall",label:"Construir divisórias",category:"Construção",description:"Parede interna de 1 tile, encaixe no grid e proteção de rotas."},
 {id:"door",label:"Instalar porta interna",category:"Construção",description:"Converte uma divisória em passagem para clientes."},
 {id:"poster",label:"Pôster",category:"Decoração",description:"Pôster geométrico de parede."},
 {id:"plant",label:"Planta",category:"Decoração",description:"Vaso com folhagens."},
 {id:"table",label:"Mesinha",category:"Móveis",description:"Mesa lateral decorativa."}
] as const;
export function shopPrice(s:GameState,id:string):number{
 if(id==="wall")return WALL_COST;
 if(id==="door")return 80;
 if(id==="computer-annex")return ANNEX_PC_COST;
 if(id==="extend-west")return expansionPrice(s,"west");
 if(id==="extend-east")return expansionPrice(s,"east");
 if(id==="extend-north")return expansionPrice(s,"north");
 return id==="expand"?650+s.expansionLevel*450:id==="computer"?320:id==="poster"?45:id==="plant"?85:id==="table"?140:0;
}
export function buyComputer(s:GameState):Result{
 const count=s.installedPcs??(3+s.expansionLevel*2),capacity=3+s.expansionLevel*2;
 if(count>=capacity)return {ok:false,message:"Amplie o salão antes de instalar outro PC."};
 const cost=shopPrice(s,"computer");
 if(s.cash<cost)return {ok:false,message:"Caixa insuficiente para o PC."};
 // Ao inserir um PC original depois de PCs anexos, preservar os índices existentes.
 for(const visitor of s.customers)if(visitor.pcIndex!==null&&visitor.pcIndex>=count)visitor.pcIndex++;
 (s.pcWear??=[]).splice(count,0,0);
 (s.pcTiers??=[]).splice(count,0,1);
 (s.pcWindows??=[]).splice(count,0,"win98");
 (s.pcWindowsLicenses??=[]).splice(count,0,false);
 s.cash-=cost;s.expenses+=cost;s.installedPcs=count+1;
 return {ok:true,message:"Novo PC instalado: -R$ "+cost+"."};
}
export function furnitureLimit(s:GameState,kind:FurnitureKind):number{
 const e=s.roomExtensions??{west:0,east:0,south:0,north:0};
 const north=e.north??0;
 return kind==="poster"?2+e.west+e.east+north:
   kind==="plant"?2+e.west+e.east+2*e.south+2*north:
   kind==="table"?1+e.west+e.east+e.south+north:0;
}
export function buyFurniture(s:GameState,kind:FurnitureKind):Result{
 const limits={poster:furnitureLimit(s,"poster"),plant:furnitureLimit(s,"plant"),table:furnitureLimit(s,"table")};
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
/** Pontos novos só surgem após pagar por cada ala; IDs originais não mudam. */
export function furnitureSlots(s:GameState):PlacementSlot[]{
 const bounds=roomBounds(s);
 const result=FURNITURE_SLOTS.map(slot=>slot.surface==="wall"?{...slot,y:bounds.minY+0.01}:slot);
 const e=s.roomExtensions??{west:0,east:0,south:0};
 for(let i=1;i<=e.west;i++){
   result.push({id:"floor-west-"+i,x:-2*i+0.42,y:5.17,surface:"floor"});
   result.push({id:"wall-west-"+i,x:-2*i+0.45,y:bounds.minY+0.01,surface:"wall"});
 }
 for(let i=1;i<=e.east;i++){
   result.push({id:"floor-east-"+i,x:8+2*s.expansionLevel+2*(i-1)+0.48,y:5.17,surface:"floor"});
   result.push({id:"wall-east-"+i,x:8+2*s.expansionLevel+2*(i-1)+0.52,y:bounds.minY+0.01,surface:"wall"});
 }
 for(let i=1;i<=(e.north??0);i++){
   result.push({id:"floor-north-"+i+"-a",x:1.0,y:-2*i+0.7,surface:"floor"});
   result.push({id:"floor-north-"+i+"-b",x:3.0,y:-2*i+0.7,surface:"floor"});
   result.push({id:"wall-north-"+i,x:[0.25,1.12,5.15,6.12,7.05][i-1]!,y:bounds.minY+0.01,surface:"wall"});
 }
 for(let i=1;i<=e.south;i++){
   result.push({id:"floor-south-"+i+"-a",x:Math.max(bounds.minX+1.1,1.05),y:6+2*(i-1)+0.9,surface:"floor"});
   result.push({id:"floor-south-"+i+"-b",x:Math.max(bounds.minX+2.9,3.05),y:6+2*(i-1)+0.9,surface:"floor"});
 }
 return result;
}

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
 return furnitureSlots(s).filter(slot=>slot.surface===surface&&!occupied.has(slot.id));
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
 if(!Array.isArray(s.furniturePlacements)||s.furniturePlacements.length>furnitureSlots(s).length)return false;
 const used=new Set<string>(),counts:Record<FurnitureKind,number>={poster:0,plant:0,table:0};
 for(const p of s.furniturePlacements){
  if(!p||typeof p!=="object"||(p.kind!=="poster"&&p.kind!=="plant"&&p.kind!=="table"))return false;
  const slot=furnitureSlots(s).find(v=>v.id===p.slotId);
  if(!slot||((p.kind==="poster")!==(slot.surface==="wall"))||used.has(p.slotId))return false;
  used.add(p.slotId);counts[p.kind]++;
  if(counts[p.kind]>(s.furniture?.[p.kind]??0))return false;
 }
 return s.furniturePlacements.every(p=>p.rotation===undefined||([0,1,2,3] as number[]).includes(p.rotation))&&
  counts.poster<=furnitureLimit(s,"poster")&&counts.plant<=furnitureLimit(s,"plant")&&counts.table<=furnitureLimit(s,"table");
}

/** Lista os móveis instalados, inclusive os legados sem furniturePlacements.
 * Os mesmos encaixes são usados para detectar ocupação e para salvar mudanças. */
export function furnitureLocations(s:GameState):Array<{kind:FurnitureKind;slotId:string;rotation?:0|1|2|3}>{
 const result:Array<{kind:FurnitureKind;slotId:string;rotation?:0|1|2|3}>=[...(s.furniturePlacements??[])];
 for(const kind of ["poster","plant","table"] as const){
  const explicit=result.filter(p=>p.kind===kind).length;
  const remaining=Math.max(0,(s.furniture?.[kind]??0)-explicit);
  for(let i=0;i<remaining;i++){
   const slotId=LEGACY_SLOTS[kind][i];
   if(slotId)result.push({kind,slotId});
  }
 }
 return result;
}
/** Uma transação de mudança de lugar nunca cobra novamente nem altera a posse. */
export function relocateFurniture(s:GameState,fromSlotId:string,toSlotId:string):Result{
 if(fromSlotId===toSlotId)return {ok:false,message:"Escolha um destino diferente da posição atual."};
 if(!validFurniturePlacements(s))return {ok:false,message:"Os móveis salvos precisam ser verificados."};
 const furniture=furnitureLocations(s);
 const from=furniture.find(p=>p.slotId===fromSlotId);
 if(!from)return {ok:false,message:"Não há um móvel nessa posição."};
 if(!availablePlacementSlots(s,from.kind).some(slot=>slot.id===toSlotId))
   return {ok:false,message:"Destino ocupado ou incompatível com o móvel."};
 // Normaliza móveis antigos apenas após confirmação válida; cancelar não toca no save.
 s.furniturePlacements=furniture.map(item=>
  item.slotId===fromSlotId?{...item,slotId:toSlotId}:{...item});
 return {ok:true,message:"Móvel reposicionado sem custo adicional."};
}

/** Giro gratuito e persistente em 4 direções para itens soltos; pôster continua na parede norte. */
export function rotateFurniture(s:GameState,slotId:string):Result{
 if(!validFurniturePlacements(s))return {ok:false,message:"Dados de móveis inválidos."};
 const furniture=furnitureLocations(s),item=furniture.find(p=>p.slotId===slotId);
 if(!item)return {ok:false,message:"Selecione um móvel instalado."};
 if(item.kind==="poster")return {ok:false,message:"Pôster de parede não gira; a rotação vale para móveis de piso."};
 const value=(((item.rotation??0)+1)%4) as 0|1|2|3;
 s.furniturePlacements=furniture.map(p=>p.slotId===slotId?{...p,rotation:value}:{...p});
 return {ok:true,message:"Móvel girado para a direção "+["norte","leste","sul","oeste"][value]+", sem custo."};
}
