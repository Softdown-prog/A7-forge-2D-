import type {EditableObject} from "./editableObjects.js";
import {stationPoweredOn} from "./stationPower.js";
import {layoutGoals} from "./editableObjects.js";
import {navigableRoute,routesForCurrentCustomers} from "./navigation.js";
import {entrance} from "./engine.js";
import {fixedLayoutObjects,pointInsideObject,builtPosters,layoutPlacementIssue} from "./editableObjects.js";
import type {GameState,Result} from "./types.js";
import {roomBounds,expansionPrice} from "./room.js";
import {WALL_COST} from "./walls.js";
import {annexComputerSlots,ANNEX_PC_COST,availableAnnexComputers} from "./stations.js";
import {installedLcd} from "./computerModels.js";
import {emptyStationAccount} from "./stationAccounting.js";
import {DISC_COPIER_COST} from "./discCopy.js";
import {PRINTER_COST} from "./printService.js";
export type FurnitureKind="poster"|"plant"|"table";
export const SHOP_CATALOG=[
 {id:"expand",label:"Ampliar área principal",category:"Expansão",description:"Aumenta em duas faixas a largura da área principal, sempre no mesmo sentido (sem sorteio). Libera duas vagas de PC e aumenta os custos fixos mensais."},
 {id:"computer",label:"Instalar PC na área principal",category:"Computadores",description:"Computador completo com mesa e cadeira, instalado automaticamente na próxima vaga da área principal. Para abrir duas vagas, use Ampliar área principal."},
 {id:"computer-annex",label:"Instalar PC na ampliação",category:"Computadores",description:"O mesmo computador completo, mas você escolhe uma vaga no mapa. Primeiro amplie à esquerda, à direita ou nos fundos; o PC só é cobrado ao escolher a vaga."},
 {id:"disc-copier",label:"Copiadora de CDs e DVDs",category:"Serviços · 2001",description:"Ativa cópias no balcão. Você define o preço por CD e DVD; cada venda inclui o custo da mídia. Não ocupa espaço no salão."},
 {id:"printer",label:"Impressora de documentos",category:"Serviços",description:"Ofereça impressão de documentos no balcão. Você define o preço por página; papel e tinta são descontados por pedido. Não ocupa espaço no salão nesta etapa."},
 {id:"ps1",label:"Bancada de PlayStation 1",category:"Videogames · 2002",description:"TV de tubo, PS1, bancada e uma cadeira. Escolha uma posição livre no salão. Uma sessão por vez. Compre CDs de jogo separadamente para começar a atender; cada cópia equipa uma bancada."},
 {id:"extend-west",label:"Ampliar à esquerda",category:"Construção",description:"Você escolhe a esquerda: adiciona duas faixas e abre uma vaga para PC na ampliação. O PC é comprado separadamente."},
 {id:"extend-east",label:"Ampliar à direita",category:"Construção",description:"Você escolhe a direita: adiciona duas faixas e abre uma vaga para PC na ampliação. O PC é comprado separadamente."},
 {id:"extend-north",label:"Ampliar os fundos",category:"Construção",description:"Você escolhe os fundos, atrás do balcão: adiciona duas faixas e abre uma vaga para PC na ampliação. A porta de entrada não muda."},
 {id:"wall",label:"Construir divisórias",category:"Construção",description:"Escolha a posição de cada trecho. Mantém livres as passagens para clientes."},
 {id:"door",label:"Instalar porta interna",category:"Construção",description:"Converte uma divisória em passagem para clientes."},
 {id:"poster",label:"Pôster",category:"Decoração",description:"Pôster geométrico de parede."},
 {id:"plant",label:"Planta",category:"Decoração",description:"Vaso com folhagens."},
 {id:"table",label:"Mesinha",category:"Móveis",description:"Mesa lateral decorativa."}
] as const;
export function shopPrice(s:GameState,id:string):number{
 if(id==="disc-copier")return DISC_COPIER_COST;
 if(id==="printer")return PRINTER_COST;
 if(id==="ps1")return 560;
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
 const shifted=s.objectPlacements?.map(p=>p.id.startsWith("pc:")&&Number(p.id.slice(3))>=count?{...p,id:"pc:"+(Number(p.id.slice(3))+1)}:p);
 const candidate={...s,installedPcs:count+1,objectPlacements:shifted};
 const nextPc=fixedLayoutObjects(candidate).find(o=>o.id==="pc:"+count)!;
 if(layoutPlacementIssue(candidate,nextPc)||layoutGoals(candidate).some(p=>!navigableRoute(candidate,entrance(candidate),p)))return {ok:false,message:"O encaixe do novo PC está bloqueado. Reorganize o salão antes de instalar."};
 if(shifted)s.objectPlacements=shifted;
 // Ao inserir um PC original depois de PCs anexos, preservar os índices existentes.
 for(const visitor of s.customers)if(visitor.pcIndex!==null&&visitor.pcIndex>=count)visitor.pcIndex++;
 for(const job of s.repairJobs??[])if(job.pc>=count)job.pc++;
 for(const job of s.gpuGameInstallJobs??[])if(job.pc>=count)job.pc++;
 (s.pcWear??=[]).splice(count,0,0);
 (s.pcTiers??=[]).splice(count,0,1);
 (s.pcWindows??=[]).splice(count,0,"win98");
 (s.pcWindowsLicenses??=[]).splice(count,0,false);
 (s.pcGpus??=[]).splice(count,0,null);
 // PC inserido ANTES dos anexos desloca as licenças de software por índice,
 // exatamente como GPU/Windows/contabilidade; PC novo começa sem instalações.
 if(s.gpuGameInstalls){
  const size=count+(s.annexPcs?.length??0);
  const installs=Array.from({length:size},(_,i)=>[...(s.gpuGameInstalls?.[i]??[])]);
  installs.splice(count,0,[]);
  s.gpuGameInstalls=installs;
 }
 // Um PC original inserido antes dos anexos também desloca seus estados de energia.
 if(s.pcPoweredOff){
  const power=Array.from({length:count+(s.annexPcs?.length??0)},(_,i)=>!stationPoweredOn(s,i));
  power.splice(count,0,false);s.pcPoweredOff=power;
 }
 if(s.stationLedger){
  while(s.stationLedger.length<count+(s.annexPcs?.length??0))
   s.stationLedger.push(emptyStationAccount());
  s.stationLedger.splice(count,0,emptyStationAccount());
 }
 s.pcLcdModels=Array.from({length:count+(s.annexPcs?.length??0)},(_,i)=>installedLcd(s,i));
 s.pcLcdModels.splice(count,0,null);
 if(s.pcComponents){s.pcComponents=Array.from({length:count+(s.annexPcs?.length??0)},(_,i)=>s.pcComponents?.[i]??null);s.pcComponents.splice(count,0,null);}
 s.cash-=cost;s.expenses+=cost;s.installedPcs=count+1;
 return {ok:true,message:"Novo PC instalado: -R$ "+cost+"."};
}
export function furnitureLimit(s:GameState,kind:FurnitureKind):number{
 return furnitureSlots(s).filter(p=>p.surface===(kind==="poster"?"wall":"floor")).length;
}
function decorationIssue(s:GameState,candidate:GameState,kind:FurnitureKind,slot:PlacementSlot,rotation:0|1|2|3=0):string|null{
 if(kind!=="poster"){
  const object:EditableObject={id:"new-decoration",label:"Decoração",kind,x:slot.x,y:slot.y,rotation,w:kind==="table"?.55:.32,d:kind==="table"?.4:.32,surface:"floor"};
  if(s.customers.some(c=>pointInsideObject(object,c,.15)))return "Aguarde o cliente sair dessa posição.";
  const issue=layoutPlacementIssue(s,object);if(issue)return issue;
 }
 for(const c of s.customers)if(!navigableRoute(candidate,c,c.route?.at(-1)??c.target))return "Esta posição prende um cliente. Escolha outro encaixe.";
 return layoutGoals(candidate).some(p=>!navigableRoute(candidate,entrance(candidate),p))?"Esta posição bloqueia uma passagem.":null;
}
export function buyFurniture(s:GameState,kind:FurnitureKind):Result{
 const limits={poster:furnitureLimit(s,"poster"),plant:furnitureLimit(s,"plant"),table:furnitureLimit(s,"table")};
 if(!Object.prototype.hasOwnProperty.call(limits,kind))return {ok:false,message:"Móvel inválido."};
 const count=s.furniture?.[kind]??0;
 const slot=availablePlacementSlots(s,kind)[0];if(!slot)return {ok:false,message:"Sem espaço livre para esse móvel. Mova objetos ou amplie o salão."};
 if(count>=limits[kind])return {ok:false,message:"Limite desse móvel atingido."};
 const cost=shopPrice(s,kind);
 if(s.cash<cost)return {ok:false,message:"Caixa insuficiente."};
 const existing=furnitureLocations(s);
 const candidate={...s,furniture:{...(s.furniture??{poster:0,plant:0,table:0}),[kind]:count+1},furniturePlacements:[...existing,{kind,slotId:slot.id}]};
 const issue=decorationIssue(s,candidate,kind,slot);if(issue)return {ok:false,message:issue};
 s.cash-=cost;s.expenses+=cost;
 s.furniturePlacements=[...existing,{kind,slotId:slot.id}];
 (s.furniture??={poster:0,plant:0,table:0})[kind]=count+1;
 routesForCurrentCustomers(s);
 return {ok:true,message:"Móvel instalado: -R$ "+cost+"."};
}

/** Discrete build slots avoid the fixed NPC aisle (y=4.48), PCs and entrance. */
export interface PlacementSlot {id:string;x:number;y:number;surface:"wall"|"floor";axis?:"x"|"y"}
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
 const floorReserved=result.filter(p=>p.surface==="floor");
 // Half-tile floor positions provide physical capacity instead of one item per type.
 for(let iy=Math.ceil((bounds.minY-.15)/.75);.25+iy*.75<bounds.maxY-.65;iy++)for(let ix=Math.ceil((bounds.minX-.15)/.75);.25+ix*.75<bounds.maxX-.65;ix++){
  const x=.25+ix*.75,y=.25+iy*.75;
  if(floorReserved.some(p=>Math.hypot(p.x-x,p.y-y)<.65))continue;
  result.push({id:"floor-grid-"+x+":"+y,x,y,surface:"floor"});
 }
 for(let i=Math.ceil((bounds.minX-.15)/.85);.15+i*.85<bounds.maxX-.8;i++){const x=Number((.15+i*.85).toFixed(2));if(!result.some(p=>p.surface==="wall"&&Math.abs(p.x-x)<.65))result.push({id:"wall-grid-"+x,x,y:bounds.minY+.01,surface:"wall"});}
 for(let i=Math.ceil((bounds.minY-.15)/.85);.15+i*.85<bounds.maxY-.8;i++){const y=Number((.15+i*.85).toFixed(2));result.push({id:"wall-side-"+y,x:bounds.minX+.012,y,surface:"wall",axis:"y"});}
 return result;
}

export function occupiedFurnitureSlots(s:GameState):Set<string>{
 const occupied=new Set((s.furniturePlacements??[]).map(p=>p.slotId));
 for(const station of s.ps1Stations??[])occupied.add(station.slotId);
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
 return furnitureSlots(s).filter(slot=>slot.surface===surface&&!occupied.has(slot.id)&&
  (surface==="wall"?builtPosters(s).every(o=>o.axis!==(slot.axis??"x")||(slot.axis==="y"?(slot.y+.65<=o.y||slot.y>=o.y+o.w):(Math.abs(o.y-slot.y)>.06||slot.x+.65<=o.x||slot.x>=o.x+o.w))):fixedLayoutObjects(s).every(o=>!pointInsideObject(o,{x:slot.x+.25,y:slot.y+.2},.38))&&layoutGoals(s).every(p=>Math.hypot(p.x-slot.x-.25,p.y-slot.y-.2)>.55)));
}
/** Deduct money only when a selected slot is confirmed. */
export function placeFurniture(s:GameState,kind:FurnitureKind,slotId:string,rotation:0|1|2|3=0):Result{
 if(![0,1,2,3].includes(rotation))return {ok:false,message:"Giro inválido."};
 if(!availablePlacementSlots(s,kind).some(slot=>slot.id===slotId))
  return {ok:false,message:"Posição ocupada ou incompatível com o móvel."};
 const count=s.furniture?.[kind]??0,cost=shopPrice(s,kind);if(s.cash<cost)return {ok:false,message:"Caixa insuficiente."};
 const existing=furnitureLocations(s),candidate={...s,furniture:{...(s.furniture??{poster:0,plant:0,table:0}),[kind]:count+1},furniturePlacements:[...existing,{kind,slotId,rotation}]};
 const issue=decorationIssue(s,candidate,kind,furnitureSlots(s).find(p=>p.id===slotId)!,rotation);if(issue)return {ok:false,message:issue};
 s.cash-=cost;s.expenses+=cost;s.furniture=candidate.furniture;s.furniturePlacements=candidate.furniturePlacements;routesForCurrentCustomers(s);
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
/** Retira uma unidade e libera seu encaixe. Materiais já comprados não geram reembolso. */
export function removeFurniture(s:GameState,slotId:string):Result{
 const furniture=furnitureLocations(s),item=furniture.find(p=>p.slotId===slotId);
 if(!item||(s.furniture?.[item.kind]??0)<1)return {ok:false,message:"Não há um móvel instalado nessa posição."};
 s.furniturePlacements=furniture.filter(p=>p.slotId!==slotId);
 s.furniture={...(s.furniture??{poster:0,plant:0,table:0}),[item.kind]:s.furniture![item.kind]-1};
 routesForCurrentCustomers(s);
 return {ok:true,message:"Item removido. Espaço liberado, sem custo nem reembolso."};
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

/** Giro gratuito e persistente em 4 direções para itens soltos; pôster acompanha a parede do encaixe. */
export function rotateFurniture(s:GameState,slotId:string):Result{
 if(!validFurniturePlacements(s))return {ok:false,message:"Dados de móveis inválidos."};
 const furniture=furnitureLocations(s),item=furniture.find(p=>p.slotId===slotId);
 if(!item)return {ok:false,message:"Selecione um móvel instalado."};
 if(item.kind==="poster")return {ok:false,message:"Pôster de parede não gira; a rotação vale para móveis de piso."};
 const value=(((item.rotation??0)+1)%4) as 0|1|2|3;
 s.furniturePlacements=furniture.map(p=>p.slotId===slotId?{...p,rotation:value}:{...p});
 return {ok:true,message:"Móvel girado para a direção "+["norte","leste","sul","oeste"][value]+", sem custo."};
}
