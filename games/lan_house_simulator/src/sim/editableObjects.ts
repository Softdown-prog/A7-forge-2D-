import type {GameState,Point,Result} from "./types.js";
import {pcCount,pcPosition,entrance} from "./engine.js";
import {placedObject,turnPoint,counterPoint,vendingMachines,vendingApproach,purchaseApproach,type Rotation} from "./layout.js";
import {roomBounds} from "./room.js";
import {computerSeat,counterQueue} from "./route.js";
import {counterQueueSlot,counterQueueCustomers,CUSTOMER_COLLISION_RADIUS} from "./checkoutQueue.js";
import {navigableRoute,routesForCurrentCustomers} from "./navigation.js";
import {furnitureLocations,furnitureSlots,removeFurniture} from "./shop.js";
import {binSpots} from "./services.js";
export interface EditableObject extends Point{id:string;label:string;kind:"pc"|"counter"|"soda"|"candy"|"shelf"|"bin"|"poster"|"plant"|"table";rotation:Rotation;w:number;d:number;index?:number;surface:"floor"|"wall";axis?:"x"|"y";span?:number;posterKind?:"terminal"|"arcade"|"coaster"|"tactical"|"golf"|"artillery"|"city"}
export function builtPosters(s:GameState):EditableObject[]{
 const b=roomBounds(s),items:Array<[Point,"x"|"y",EditableObject["posterKind"]]>=[
 [{x:b.minX+.82,y:b.minY},"x","terminal"],[{x:Math.max(b.minX+3.25,b.maxX-2.2),y:b.minY},"x","arcade"],
 ...([.27,1.4,2.53,3.66,4.79] as const).map((y,i)=>[{x:b.minX+.012,y},"y",(["coaster","tactical","golf","artillery","city"] as const)[i]] as [Point,"y",EditableObject["posterKind"]])];
 return items.map<EditableObject>(([p,axis,posterKind],i)=>{const saved=placedObject(s,"built-poster:"+i,p),r=saved.rotation??(axis==="y"?3:0);return {id:"built-poster:"+i,label:"Pôster · "+({terminal:"Terminal",arcade:"Arcade",coaster:"Montanha-russa",tactical:"Tático",golf:"Golfe",artillery:"Artilharia",city:"City Horizon"})[posterKind!],kind:"poster",...saved,rotation:r,w:.96,d:0,surface:"wall",axis:r===3?"y":"x",span:axis==="x"?.92:.96,posterKind};}).filter((_,i)=>!s.removedBuiltPosters?.includes(i));
}
export function fixedLayoutObjects(s:GameState):EditableObject[]{
 const b=roomBounds(s),counter=placedObject(s,"counter",{x:.9,y:1.42}),shelf=placedObject(s,"shelf",{x:b.minX+.23,y:2.92});
 return [
 ...Array.from({length:pcCount(s)},(_,i)=>({id:"pc:"+i,label:"PC "+(i+1)+" · mesa e cadeira",kind:"pc" as const,...pcPosition(i,s),rotation:pcPosition(i,s).rotation??0,w:1.1,d:.7,index:i,surface:"floor" as const})),
 {id:"counter",label:"Balcão e administrador",kind:"counter",...counter,rotation:counter.rotation??0,w:1.75,d:.72,surface:"floor"},
 ...vendingMachines(s).map(p=>({id:p.kind,label:p.kind==="soda"?"Máquina de refrigerantes":"Máquina de doces",...p,rotation:p.rotation??0,w:.66,d:.59,surface:"floor" as const})),
 {id:"shelf",label:"Prateleira de salgadinhos",kind:"shelf",...shelf,rotation:shelf.rotation??0,w:.46,d:1.22,surface:"floor"},
 ...binSpots(s).map((p,i)=>({id:"bin:"+i,label:"Lixeira "+(i+1),kind:"bin" as const,...p,rotation:(p as {rotation?:Rotation}).rotation??0,w:.22,d:.22,surface:"floor" as const}))];
}
export function editableObjects(s:GameState):EditableObject[]{
 const slots=new Map(furnitureSlots(s).map(p=>[p.id,p]));
 return [...fixedLayoutObjects(s),...builtPosters(s),...furnitureLocations(s).flatMap((item,i)=>{
 const slot=slots.get(item.slotId);return slot?[{id:"decor:"+item.slotId,label:({plant:"Planta",table:"Mesinha",poster:"Pôster comprado"})[item.kind]+" "+(i+1),kind:item.kind,x:slot.x,y:slot.y,rotation:item.rotation??0,w:item.kind==="table"?.55:item.kind==="poster"?.65:.32,d:item.kind==="table"?.4:item.kind==="poster"?0:.32,surface:slot.surface,axis:slot.axis??"x"}]:[];
 })];
}
export function objectCorners(o:EditableObject):Point[]{
 const pivot={x:o.x+o.w/2,y:o.y+o.d/2};
 return [[0,0],[o.w,0],[o.w,o.d],[0,o.d]].map(([dx,dy])=>turnPoint({x:o.x+dx!,y:o.y+dy!},pivot,o.rotation));
}
export function objectRect(o:EditableObject):{minX:number;maxX:number;minY:number;maxY:number}{
 const c=objectCorners(o);return {minX:Math.min(...c.map(p=>p.x)),maxX:Math.max(...c.map(p=>p.x)),minY:Math.min(...c.map(p=>p.y)),maxY:Math.max(...c.map(p=>p.y))};
}
export function pointInsideObject(o:EditableObject,p:Point,padding=0):boolean{
 const r=objectRect(o);return p.x>r.minX-padding&&p.x<r.maxX+padding&&p.y>r.minY-padding&&p.y<r.maxY+padding;
}
/** O corpo circular ocupa espaço também fora do retângulo visual do móvel.
 * Distância ao ponto mais próximo da caixa rotacionada: evita instalar
 * equipamentos/móveis parcialmente dentro de um visitante em movimento.
 */
export function objectTouchesCustomer(o:EditableObject,p:Point):boolean{
 const r=objectRect(o);
 const nearX=Math.max(r.minX,Math.min(r.maxX,p.x));
 const nearY=Math.max(r.minY,Math.min(r.maxY,p.y));
 return Math.hypot(p.x-nearX,p.y-nearY)<CUSTOMER_COLLISION_RADIUS;
}
export function layoutGoals(s:GameState):Point[]{return [counterQueue(s),...Array.from({length:pcCount(s)},(_,i)=>computerSeat(pcPosition(i,s))),vendingApproach("soda",s),vendingApproach("candy",s),purchaseApproach("snacks",s)];}
function overlap(a:EditableObject,b:EditableObject):boolean{
 const r=objectRect(a),q=objectRect(b),gap=.03;
 return r.minX<q.maxX-gap&&r.maxX>q.minX+gap&&r.minY<q.maxY-gap&&r.maxY>q.minY+gap;
}
export function wallCutsObject(w:{axis:"x"|"y";x:number;y:number},o:EditableObject):boolean{
 const r=objectRect(o),eps=.025;
 return w.axis==="x"?w.y>r.minY+eps&&w.y<r.maxY-eps&&w.x<r.maxX-eps&&w.x+1>r.minX+eps:
 w.x>r.minX+eps&&w.x<r.maxX-eps&&w.y<r.maxY-eps&&w.y+1>r.minY+eps;
}
export function layoutPlacementIssue(s:GameState,o:EditableObject):string|null{
 if(!Number.isFinite(o.x)||!Number.isFinite(o.y)||![0,1,2,3].includes(o.rotation))return "Posição inválida.";
 const b=roomBounds(s);
 if(o.surface==="wall"){
  if(o.id.startsWith("decor:"))return null; // Vetted purchased-poster slots.
  const north=o.rotation===0&&Math.abs(o.y-b.minY)<.06&&o.x>=b.minX&&o.x+.96<=b.maxX;
  const west=o.rotation===3&&Math.abs(o.x-b.minX)<.06&&o.y>=b.minY&&o.y+.96<=b.maxY;
  if(!north&&!west)return "Pôster deve ficar na parede dos fundos ou lateral.";
  const axis=o.rotation===3?"y":"x",value=axis==="x"?o.x:o.y;
  if(editableObjects(s).some(p=>p.id!==o.id&&p.surface==="wall"&&(p.axis??"x")===axis&&value<(axis==="x"?p.x:p.y)+p.w&&value+o.w>(axis==="x"?p.x:p.y)))return "Há outro pôster nessa posição da parede.";
  return null;
 }
 const r=objectRect(o);
 if(r.minX<b.minX+.03||r.maxX>b.maxX-.03||r.minY<b.minY+.03||r.maxY>b.maxY-.03)return "O objeto precisa caber inteiro no salão.";
 if(editableObjects(s).some(other=>other.id!==o.id&&other.surface==="floor"&&overlap(o,other)))return "Esta posição está ocupada por outro objeto.";
 if([...(s.interiorWalls??[]),...(s.interiorDoors??[])].some(w=>wallCutsObject(w,o)))return "O objeto atravessa uma divisória ou porta.";
 if(pointInsideObject(o,entrance(s),.3))return "Mantenha a entrada livre.";
 const ownGoal=o.kind==="counter"?0:o.kind==="pc"?1+o.index!:o.kind==="soda"?1+pcCount(s):o.kind==="candy"?2+pcCount(s):o.kind==="shelf"?3+pcCount(s):-1;
 if(layoutGoals(s).some((p,i)=>i!==ownGoal&&pointInsideObject(o,p,.2)))return "Mantenha os assentos e pontos de atendimento livres.";
 return null;
}
export function validateObjectPlacements(s:GameState):boolean{
 if(s.removedBuiltPosters!==undefined&&(!Array.isArray(s.removedBuiltPosters)||s.removedBuiltPosters.length>7||new Set(s.removedBuiltPosters).size!==s.removedBuiltPosters.length||!s.removedBuiltPosters.every(i=>Number.isInteger(i)&&i>=0&&i<7)))return false;
 if(s.objectPlacements===undefined)return true;
 if(!Array.isArray(s.objectPlacements)||s.objectPlacements.length>50)return false;
 const allowed=new Set([...fixedLayoutObjects(s),...builtPosters(s)].map(o=>o.id)),seen=new Set<string>();
 for(const p of s.objectPlacements){if(!p||!allowed.has(p.id)||seen.has(p.id)||![0,1,2,3].includes(p.rotation)||!Number.isFinite(p.x)||!Number.isFinite(p.y))return false;seen.add(p.id);
  const object=editableObjects(s).find(o=>o.id===p.id);if(!object||layoutPlacementIssue(s,object))return false;
 }
 for(const goal of layoutGoals(s))if(!navigableRoute(s,entrance(s),goal))return false;
 return true;
}
/** Só decorações são descartadas: estações e serviços mantêm seus contratos ativos. */
export function layoutRemovalIssue(s:GameState,id:string):string|null{
 const object=editableObjects(s).find(o=>o.id===id);
 if(!object)return "Selecione um item instalado.";
 return id.startsWith("decor:")||id.startsWith("built-poster:")?null:"Este equipamento atende clientes; use mover ou girar para reorganizá-lo.";
}
export function removeLayoutObject(s:GameState,id:string):Result{
 const issue=layoutRemovalIssue(s,id);if(issue)return {ok:false,message:issue};
 if(id.startsWith("decor:"))return removeFurniture(s,id.slice(6));
 const index=Number(id.slice("built-poster:".length));
 s.removedBuiltPosters=[...(s.removedBuiltPosters??[]),index];
 if(s.objectPlacements)s.objectPlacements=s.objectPlacements.filter(p=>p.id!==id);
 return {ok:true,message:"Pôster retirado do salão. A mudança foi salva."};
}
export function moveLayoutObject(s:GameState,id:string,destination:Point,rotation:Rotation):Result{
 const original=editableObjects(s).find(o=>o.id===id);if(!original)return {ok:false,message:"Objeto inexistente."};
 if(original.kind==="pc"&&(s.customers.some(c=>c.pcIndex===original.index&&["to_pc","sitting","using","standing"].includes(c.stage))||s.repairJobs?.some(j=>j.pc===original.index)))return {ok:false,message:"Espere o cliente ou técnico liberar esse PC antes de movê-lo."};
 if(original.kind==="bin"&&s.cleaningJob)return {ok:false,message:"Aguarde a limpeza terminar antes de mover a lixeira."};
 const target={...original,...destination,rotation};
 if(target.surface==="floor"&&s.customers.some(c=>objectTouchesCustomer(target,c)))return {ok:false,message:"Espere o cliente sair da posição escolhida."};
 let candidate:GameState;
 if(id.startsWith("decor:")){
  const slot=furnitureSlots(s).filter(p=>p.surface===original.surface).find(p=>Math.hypot(p.x-target.x,p.y-target.y)<.12);
  if(!slot)return {ok:false,message:"Escolha um encaixe de decoração livre."};
  candidate={...s,furniturePlacements:furnitureLocations(s).map(p=>p.slotId===id.slice(6)?{...p,slotId:slot.id,rotation}:{...p})};
  if(candidate.furniturePlacements!.filter(p=>p.slotId===slot.id).length>1)return {ok:false,message:"Posição ocupada."};
 }else candidate={...s,objectPlacements:[...(s.objectPlacements??[]).filter(p=>p.id!==id),{id,x:destination.x,y:destination.y,rotation}]};
 const issue=layoutPlacementIssue(s,target);if(issue)return {ok:false,message:issue};
 if(id==="counter")for(const [i,c] of counterQueueCustomers(candidate).entries())if(!navigableRoute(candidate,c,counterQueueSlot(i,candidate)))return {ok:false,message:"A fila atual não cabe aqui. Escolha outra posição ou aguarde o atendimento."};
 for(const goal of layoutGoals(candidate))if(!navigableRoute(candidate,entrance(candidate),goal))return {ok:false,message:"Deixe uma passagem para todos os PCs, balcão e máquinas."};
 for(const c of candidate.customers){const end=c.stage==="shopping"?purchaseApproach(c.desiredItem??"soda",candidate):c.route?.at(-1)??c.target;if(!navigableRoute(candidate,c,end))return {ok:false,message:"Esta mudança prende um cliente; deixe uma passagem."};}
 if(id.startsWith("decor:"))s.furniturePlacements=candidate.furniturePlacements;else s.objectPlacements=candidate.objectPlacements;
 if(id==="counter")for(const [i,c] of counterQueueCustomers(s).entries()){c.stage="arriving";c.target=counterQueueSlot(i,s);c.route=[];c.queueIndex=i;}
 if(id==="soda"||id==="candy"||id==="shelf")for(const c of s.customers)if(c.stage==="shopping"){c.target=purchaseApproach(c.desiredItem??"soda",s);c.route=[];}
 routesForCurrentCustomers(s);
 return {ok:true,message:"Posição atualizada: "+original.label+". Mudança gratuita e salva."};
}
