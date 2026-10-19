import type {GameState,Item,Point} from "./types.js";
import {purchaseApproach,vendingMachines,placedObject} from "./layout.js";
import {roomBounds} from "./room.js";
import {editableObjects,objectRect} from "./editableObjects.js";
import {counterQueueSlot,MAX_COUNTER_QUEUE,CUSTOMER_COLLISION_RADIUS} from "./checkoutQueue.js";
import {navigableRoute} from "./navigation.js";
import {crowdRoute} from "./crowdNavigation.js";
import {layoutGoals} from "./editableObjects.js";
import {AISLE_Y} from "./route.js";
import {entrance} from "./engine.js";

const cache=new WeakMap<GameState,{key:string;slots:Map<Item,Point[]>}>();
/** Encaixes separados para cada atendimento, sem tomar assentos ou lugares do caixa. */
export function retailQueueSlots(s:GameState,item:Item):Point[]{
 const key=JSON.stringify([s.expansionLevel,s.roomExtensions,s.installedPcs,s.annexPcs,s.objectPlacements,s.furniture,s.furniturePlacements,s.interiorWalls,s.interiorDoors]);
 let entry=cache.get(s);if(!entry||entry.key!==key){entry={key,slots:new Map()};cache.set(s,entry);}
 const existing=entry.slots.get(item);if(existing)return existing;
 const goal=purchaseApproach(item,s),b=roomBounds(s),objects=editableObjects(s).filter(o=>o.surface==="floor").map(objectRect);
 const reserved=[...Array.from({length:MAX_COUNTER_QUEUE},(_,i)=>counterQueueSlot(i,s)),...layoutGoals(s).filter(p=>Math.hypot(p.x-goal.x,p.y-goal.y)>.01)];
 const origin=item==="snacks"?placedObject(s,"shelf",{x:b.minX+.23,y:2.92}):vendingMachines(s).find(m=>m.kind===item)!;
 const center={x:origin.x+(item==="snacks"?.23:.33),y:origin.y+(item==="snacks"?.61:.295)},length=Math.hypot(goal.x-center.x,goal.y-center.y),normal={x:(goal.x-center.x)/length,y:(goal.y-center.y)/length};
 const candidates:Point[]=[];
 for(let n=1;n<14;n++)candidates.push({x:goal.x+normal.x*n*.72,y:goal.y+normal.y*n*.72});
 for(let radius=1;radius<=5;radius++)for(let i=0;i<8;i++){const angle=i*Math.PI/4;candidates.push({x:goal.x+Math.cos(angle)*radius*.72,y:goal.y+Math.sin(angle)*radius*.72});}
 // Keep room for all 14 visitors even when the aisle excludes ray/ring slots.
 // These extra candidates are considered only after the established slots.
 const fallback:Point[]=[];
 for(let y=b.minY+.25;y<b.maxY;y+=.5)for(let x=b.minX+.25;x<b.maxX;x+=.5)fallback.push({x,y});
 fallback.sort((a,d)=>Math.hypot(a.x-goal.x,a.y-goal.y)-Math.hypot(d.x-goal.x,d.y-goal.y));
 candidates.push(...fallback);
 const slots=[goal],exit=entrance(s),laneRadius=CUSTOMER_COLLISION_RADIUS+.13;
 // Waiting shoppers must not form a solid wall across the shared aisle or
 // the final approach to the door. The service point itself is transient.
 const blocksExitLane=(p:Point)=>Math.abs(p.y-AISLE_Y)<laneRadius||
  (p.y>AISLE_Y&&p.y<exit.y+laneRadius&&Math.abs(p.x-exit.x)<laneRadius);
 for(const p of candidates){
  if(blocksExitLane(p))continue;
  if(p.x<b.minX+.2||p.x>b.maxX-.2||p.y<b.minY+.2||p.y>b.maxY-.2||slots.some(q=>Math.hypot(p.x-q.x,p.y-q.y)<.64)||reserved.some(q=>Math.hypot(p.x-q.x,p.y-q.y)<.55)||objects.some(r=>p.x>r.minX-.13&&p.x<r.maxX+.13&&p.y>r.minY-.13&&p.y<r.maxY+.13))continue;
  if(navigableRoute(s,goal,p)){slots.push(p);if(slots.length>=14)break;}
 }
 entry.slots.set(item,slots);return slots;
}
export function refreshRetailQueues(s:GameState):void{
 for(const item of ["soda","candy","snacks"] as const){
  const line=s.customers.filter(c=>c.stage==="shopping"&&(c.desiredItem??"soda")===item).sort((a,b)=>a.id-b.id);if(!line.length)continue;
  const slots=retailQueueSlots(s,item);
  for(const [index,c] of line.entries()){
   const destination=slots[index];if(!destination)continue;
   const final=c.route?.at(-1)??c.target;
   if(c.retailQueueItem===item&&c.retailQueueIndex===index&&Math.hypot(final.x-destination.x,final.y-destination.y)<.005)continue;
   // A rota clássica passa obrigatoriamente pelo corredor principal
   // (y=4,48). Em alta lotação, várias filas de compras o bloqueavam
   // de ponta a ponta. Planejar o caminho levando em conta os corpos
   // impede que clientes aguardem em fila no próprio corredor.
   const path=Math.hypot(c.x-destination.x,c.y-destination.y)<.05
    ?[destination]
    :crowdRoute(s,c,destination)??crowdRoute(s,c,destination,.25)??
      navigableRoute(s,c,destination);
   if(!path?.length)continue;
   c.retailQueueItem=item;c.retailQueueIndex=index;c.target=path[0]!;c.route=path.slice(1);
  }
 }
}
export function firstRetailCustomer(s:GameState,item:Item):number|undefined{
 return s.customers.filter(c=>c.stage==="shopping"&&(c.desiredItem??"soda")===item).sort((a,b)=>a.id-b.id)[0]?.id;
}
