import {editableObjects,objectRect} from "./editableObjects.js";
import type {Customer,GameState,Point} from "./types.js";
import {roomBounds} from "./room.js";
import {canTraverseLocalStep} from "./navigation.js";
import {CUSTOMER_COLLISION_RADIUS} from "./checkoutQueue.js";
import {pcCount,pcPosition} from "./engine.js";
import {vendingMachines,VENDING_WIDTH,VENDING_DEPTH} from "./layout.js";
import {furnitureLocations,furnitureSlots} from "./shop.js";

/** Desvio temporário quando o corredor fica congestionado. Os corpos atuais
 * entram como obstáculos; os passos continuam sendo executados pelo motor. */
export function crowdRoute(s:GameState,c:Customer,destination:Point,step:.5|.25=.5):Point[]|null{
 const b=roomBounds(s);
 const custom=s.objectPlacements?.some(p=>!p.id.startsWith("built-poster:")),objects=custom?editableObjects(s).filter(o=>o.surface==="floor").map(objectRect):[];
 const bodies=s.customers.filter(other=>other.id!==c.id);
 const desks=Array.from({length:pcCount(s)},(_,i)=>pcPosition(i,s));
 const slots=new Map(furnitureSlots(s).map(p=>[p.id,p]));
 const furniture=furnitureLocations(s).filter(p=>p.kind!=="poster").map(item=>{
  const p=slots.get(item.slotId);return p?{...p,r:item.kind==="table"?.4:.28}:null;
 }).filter((p):p is NonNullable<typeof p>=>!!p&&p.surface==="floor");
 const clear=(p:Point)=>p.x>b.minX+.1&&p.x<b.maxX-.1&&p.y>b.minY+.1&&p.y<b.maxY-.1&&
  bodies.every(o=>Math.hypot(p.x-o.x,p.y-o.y)>=CUSTOMER_COLLISION_RADIUS+.00001)&&
  (!custom||Math.hypot(p.x-destination.x,p.y-destination.y)<.22||objects.every(r=>!(p.x>r.minX-.03&&p.x<r.maxX+.03&&p.y>r.minY-.03&&p.y<r.maxY+.03)))&&
  (custom||desks.every(d=>!(p.x>d.x-.08&&p.x<d.x+1.05&&p.y>d.y-.08&&p.y<d.y+.60)))&&
  (custom||vendingMachines(s).every(d=>!(p.x>d.x-.08&&p.x<d.x+VENDING_WIDTH+.08&&p.y>d.y-.08&&p.y<d.y+VENDING_DEPTH+.08)))&&
  furniture.every(o=>Math.hypot(p.x-o.x,p.y-o.y)>o.r);
 if(!clear(destination))return null; // Não disputar um assento/atendimento ocupado.
 const segmentClear=(a:Point,d:Point)=>{
  if(!canTraverseLocalStep(s,a,d))return false;
  const n=Math.max(1,Math.ceil(Math.hypot(d.x-a.x,d.y-a.y)/.08));
  for(let i=1;i<=n;i++)if(!clear({x:a.x+(d.x-a.x)*i/n,y:a.y+(d.y-a.y)*i/n}))return false;
  return true;
 };
 const start={x:c.x,y:c.y};
 if(segmentClear(start,destination))return [{...destination}];
 const cols=Math.ceil((b.maxX-b.minX)/step),rows=Math.ceil((b.maxY-b.minY)/step);
 const point=(key:number):Point=>({x:b.minX+step/2+(key%cols)*step,y:b.minY+step/2+Math.floor(key/cols)*step});
 const queue:number[]=[],prev=new Map<number,number>();
 // Não saltar para a célula mais próxima através de uma parede ou de um corpo.
 for(let y=Math.max(0,Math.floor((c.y-b.minY)/step)-1);y<Math.min(rows,Math.floor((c.y-b.minY)/step)+2);y++)
  for(let x=Math.max(0,Math.floor((c.x-b.minX)/step)-1);x<Math.min(cols,Math.floor((c.x-b.minX)/step)+2);x++){
   const key=y*cols+x,p=point(key);
   if(Math.hypot(p.x-c.x,p.y-c.y)<=.75&&segmentClear(start,p)){queue.push(key);prev.set(key,-1);}
  }
 queue.sort((a,d)=>Math.hypot(point(a).x-c.x,point(a).y-c.y)-Math.hypot(point(d).x-c.x,point(d).y-c.y));
 for(let index=0;index<queue.length;index++){
  const key=queue[index]!,at=point(key);
  if(Math.hypot(at.x-destination.x,at.y-destination.y)<=.75&&segmentClear(at,destination)){
   const result:Point[]=[{...destination}];let current=key;
   while(current!==-1){result.push(point(current));current=prev.get(current)!;}
   return result.reverse();
  }
  for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
   const x=key%cols+dx!,y=Math.floor(key/cols)+dy!,next=y*cols+x;
   if(x<0||x>=cols||y<0||y>=rows||prev.has(next))continue;
   if(segmentClear(at,point(next))){prev.set(next,key);queue.push(next);}
  }
 }
 return null;
}
