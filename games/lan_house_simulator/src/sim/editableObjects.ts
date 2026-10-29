export {EditableObject,builtPosters,fixedLayoutObjects,editableObjects,objectCorners,objectRect,pointInsideObject,objectTouchesCustomer,layoutGoals,wallCutsObject,layoutPlacementIssue} from "./layoutGeometry.js";
import {EditableObject,builtPosters,fixedLayoutObjects,editableObjects,objectCorners,objectRect,pointInsideObject,objectTouchesCustomer,layoutGoals,wallCutsObject,layoutPlacementIssue} from "./layoutGeometry.js";
import type {GameState,Point,Result} from "./types.js";
import {pcCount,pcPosition,entrance} from "./simulationState.js";
import {placedObject,turnPoint,counterPoint,vendingMachines,vendingApproach,purchaseApproach,type Rotation} from "./layout.js";
import {roomBounds} from "./room.js";
import {computerSeat,counterQueue} from "./route.js";
import {counterQueueSlot,counterQueueCustomers,CUSTOMER_COLLISION_RADIUS} from "./checkoutQueue.js";
import {navigableRoute,routesForCurrentCustomers} from "./navigation.js";
import {activeRetailQueuesReachable,refreshRetailQueues} from "./retailQueue.js";
import {furnitureLocations,furnitureSlots} from "./furnitureLayout.js";
import {removeFurniture} from "./shop.js";

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
 if(!activeRetailQueuesReachable(candidate))
  return {ok:false,message:"Esta mudança bloqueia a fila de compras. Deixe passagem para os clientes."};
 if(id.startsWith("decor:"))s.furniturePlacements=candidate.furniturePlacements;else s.objectPlacements=candidate.objectPlacements;
 if(id==="counter")for(const [i,c] of counterQueueCustomers(s).entries()){c.stage="arriving";c.target=counterQueueSlot(i,s);c.route=[];c.queueIndex=i;}
 // Preservar filas de outros produtos; só a fila da máquina movida perde
 // a atribuição anterior. O motor escolhe um novo lugar real para cada comprador.
 if(id==="soda"||id==="candy"||id==="shelf"){
  const changed=id==="shelf"?"snacks":id;
  for(const c of s.customers)if(c.stage==="shopping"&&
      (c.desiredItem??"soda")===changed){
   c.retailQueueItem=undefined;c.retailQueueIndex=undefined;
  }
 }
 routesForCurrentCustomers(s);
 refreshRetailQueues(s);
 return {ok:true,message:"Posição atualizada: "+original.label+". Mudança gratuita e salva."};
}
