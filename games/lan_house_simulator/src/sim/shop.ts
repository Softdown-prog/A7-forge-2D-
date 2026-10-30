export { FURNITURE_SLOTS,FurnitureKind,furnitureLimit,furnitureLocations,furnitureSlots,occupiedFurnitureSlots,PlacementSlot } from "./furnitureLayout.js";
import { installedLcd } from "./computerModels.js";
import { DISC_COPIER_COST } from "./discCopy.js";
import type { EditableObject } from "./editableObjects.js";
import { FurnitureKind,furnitureLimit,furnitureLocations,furnitureSlots,occupiedFurnitureSlots,PlacementSlot } from "./furnitureLayout.js";
import { builtPosters,fixedLayoutObjects,layoutGoals,layoutPlacementIssue,objectTouchesCustomer,pointInsideObject } from "./layoutGeometry.js";
import { navigableRoute,routesForCurrentCustomers } from "./navigation.js";
import { PRINTER_COST } from "./printService.js";
import { activeRetailQueuesReachable,refreshRetailQueues } from "./retailQueue.js";
import { expansionPrice } from "./room.js";
import { entrance } from "./simulationState.js";
import { emptyStationAccount } from "./stationAccounting.js";
import { stationPoweredOn } from "./stationPower.js";
import { ANNEX_PC_COST } from "./stations.js";
import type { GameState,Result } from "./types.js";
import { WALL_COST } from "./walls.js";
export const SHOP_CATALOG=[
 {id:"expand",label:"Ampliar área principal",category:"Expansão",description:"Aumenta em duas faixas a largura da área principal, sempre no mesmo sentido (sem sorteio). Libera duas vagas de PC e aumenta os custos fixos mensais."},
 {id:"computer",label:"Instalar PC na área principal",category:"Computadores",description:"Computador completo com mesa e cadeira, instalado automaticamente na próxima vaga da área principal. Para abrir duas vagas, use Ampliar área principal."},
 {id:"computer-annex",label:"Instalar PC na ampliação",category:"Computadores",description:"O mesmo computador completo, mas você escolhe uma vaga no mapa. Primeiro amplie à esquerda, à direita ou nos fundos; o PC só é cobrado ao escolher a vaga."},
 {id:"disc-copier",label:"Copiadora de CDs e DVDs",category:"Serviços · 2001",description:"Ativa cópias no balcão. Você define o preço por CD e DVD; cada venda inclui o custo da mídia. Não ocupa espaço no salão."},
 {id:"printer",label:"Impressora de documentos",category:"Serviços",description:"Ofereça impressão de documentos no balcão. Você define o preço por página; papel e tinta são descontados por pedido. Não ocupa espaço no salão nesta etapa."},
 {id:"ps1",label:"Bancada de PlayStation 1",category:"Videogames · 2002",description:"TV de tubo, PS1, bancada e uma cadeira. Escolha uma posição livre no salão. Adicione uma segunda cadeira na administração para receber dois jogadores. Compre CDs de jogo separadamente para começar a atender; cada cópia equipa uma bancada."},
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
/** Previews the same candidate and shifted annex station IDs as a real purchase.
 * Never mutates the active save, changes RNG or charges money.
 */
function plannedMainComputer(s:GameState,count:number):{
 shifted:GameState["objectPlacements"];issue:string|null;
}{
 const shifted=s.objectPlacements?.map(p=>p.id.startsWith("pc:")&&Number(p.id.slice(3))>=count?{...p,id:"pc:"+(Number(p.id.slice(3))+1)}:p);
 const candidate={...s,installedPcs:count+1,objectPlacements:shifted};
 const nextPc=fixedLayoutObjects(candidate).find(o=>o.id==="pc:"+count);
 if(!nextPc)return {shifted,issue:"Não foi possível localizar a próxima vaga do computador."};
 const placement=layoutPlacementIssue(candidate,nextPc);
 if(placement)return {shifted,issue:"Próximo PC sem encaixe: "+placement+" Reorganize o salão."};
 if(layoutGoals(candidate).some(p=>!navigableRoute(candidate,entrance(candidate),p)))
  return {shifted,issue:"O próximo PC bloquearia uma passagem. Reorganize o salão."};
 return {shifted,issue:null};
}
/** Read-only placement quote, shared by the shop and actual purchase. */
export function nextComputerPlacementIssue(s:GameState):string|null{
 const count=s.installedPcs??(3+s.expansionLevel*2),capacity=3+s.expansionLevel*2;
 if(count>=capacity)return "Amplie o salão antes de instalar outro PC.";
 return plannedMainComputer(s,count).issue;
}
export function buyComputer(s:GameState):Result{
 const count=s.installedPcs??(3+s.expansionLevel*2),capacity=3+s.expansionLevel*2;
 if(count>=capacity)return {ok:false,message:"Amplie o salão antes de instalar outro PC."};
 const cost=shopPrice(s,"computer");
 if(s.cash<cost)return {ok:false,message:"Caixa insuficiente para o PC."};
 const {shifted,issue}=plannedMainComputer(s,count);
 if(issue)return {ok:false,message:issue};
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
function decorationIssue(s:GameState,candidate:GameState,kind:FurnitureKind,slot:PlacementSlot,rotation:0|1|2|3=0,editingSlotId?:string):string|null{
 if(kind!=="poster"){
  const object:EditableObject={id:editingSlotId?"decor:"+editingSlotId:"new-decoration",label:"Decoração",kind,x:slot.x,y:slot.y,rotation,w:kind==="table"?.55:.32,d:kind==="table"?.4:.32,surface:"floor"};
  if(s.customers.some(c=>objectTouchesCustomer(object,c)))return "Aguarde o cliente sair dessa posição.";
  // During relocation/rotation the candidate contains this same decoration:
  // validate the new geometry, excluding its own previous footprint.
  const issue=layoutPlacementIssue(editingSlotId?candidate:s,object);if(issue)return issue;
 }
 for(const c of s.customers)if(!navigableRoute(candidate,c,c.route?.at(-1)??c.target))return "Esta posição prende um cliente. Escolha outro encaixe.";
 if(!activeRetailQueuesReachable(candidate))
  return "Esta posição bloqueia um lugar da fila de compras.";
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
 routesForCurrentCustomers(s);refreshRetailQueues(s);
 return {ok:true,message:"Móvel instalado: -R$ "+cost+"."};
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
 s.cash-=cost;s.expenses+=cost;s.furniture=candidate.furniture;s.furniturePlacements=candidate.furniturePlacements;
 routesForCurrentCustomers(s);refreshRetailQueues(s);
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
/** Retira uma unidade e libera seu encaixe. Materiais já comprados não geram reembolso. */
export function removeFurniture(s:GameState,slotId:string):Result{
 const furniture=furnitureLocations(s),item=furniture.find(p=>p.slotId===slotId);
 if(!item||(s.furniture?.[item.kind]??0)<1)return {ok:false,message:"Não há um móvel instalado nessa posição."};
 s.furniturePlacements=furniture.filter(p=>p.slotId!==slotId);
 s.furniture={...(s.furniture??{poster:0,plant:0,table:0}),[item.kind]:s.furniture![item.kind]-1};
 routesForCurrentCustomers(s);refreshRetailQueues(s);
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
 const rotation=from.rotation??0;
 const next=furniture.map(item=>item.slotId===fromSlotId?{...item,slotId:toSlotId}:item);
 const candidate:GameState={...s,furniturePlacements:next};
 const slot=furnitureSlots(s).find(p=>p.id===toSlotId)!;
 const issue=decorationIssue(s,candidate,from.kind,slot,rotation,toSlotId);
 if(issue)return {ok:false,message:issue};
 // Somente aplicar após validar pessoas, serviços e as filas da nova posição.
 s.furniturePlacements=next;
 routesForCurrentCustomers(s);refreshRetailQueues(s);
 return {ok:true,message:"Móvel reposicionado sem custo adicional."};
}

/** Giro gratuito e persistente em 4 direções para itens soltos; pôster acompanha a parede do encaixe. */
export function rotateFurniture(s:GameState,slotId:string):Result{
 if(!validFurniturePlacements(s))return {ok:false,message:"Dados de móveis inválidos."};
 const furniture=furnitureLocations(s),item=furniture.find(p=>p.slotId===slotId);
 if(!item)return {ok:false,message:"Selecione um móvel instalado."};
 if(item.kind==="poster")return {ok:false,message:"Pôster de parede não gira; a rotação vale para móveis de piso."};
 const value=(((item.rotation??0)+1)%4) as 0|1|2|3;
 const next=furniture.map(p=>p.slotId===slotId?{...p,rotation:value}:p);
 const candidate:GameState={...s,furniturePlacements:next};
 const slot=furnitureSlots(s).find(p=>p.id===slotId)!;
 const issue=decorationIssue(s,candidate,item.kind,slot,value,slotId);
 if(issue)return {ok:false,message:issue};
 s.furniturePlacements=next;
 routesForCurrentCustomers(s);refreshRetailQueues(s);
 return {ok:true,message:"Móvel girado para a direção "+["norte","leste","sul","oeste"][value]+", sem custo."};
}
