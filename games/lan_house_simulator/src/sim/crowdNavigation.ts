import {editableObjects,objectRect} from "./editableObjects.js";
import type {Customer,GameState,Point} from "./types.js";
import {roomBounds} from "./room.js";
import {localStepValidator} from "./navigation.js";
import {CUSTOMER_COLLISION_RADIUS} from "./checkoutQueue.js";
import {pcCount,pcPosition} from "./engine.js";
import {vendingMachines,VENDING_WIDTH,VENDING_DEPTH} from "./layout.js";
import {furnitureLocations,furnitureSlots} from "./shop.js";

const NEIGHBOR_STEPS=[[1,0],[-1,0],[0,1],[0,-1]] as const;

/** Desvio temporário quando o corredor fica congestionado. Os corpos atuais
 * entram como obstáculos; os passos continuam sendo executados pelo motor. */
export function crowdRoute(s:GameState,c:Customer,destination:Point,step:.5|.25=.5):Point[]|null{
 const b=roomBounds(s),traverse=localStepValidator(s);
 const custom=s.objectPlacements?.some(p=>!p.id.startsWith("built-poster:")),objects=custom?editableObjects(s).filter(o=>o.surface==="floor").map(objectRect):[];
 const bodies=s.customers.filter(other=>other.id!==c.id);
 const desks=Array.from({length:pcCount(s)},(_,i)=>pcPosition(i,s));
 // Catálogo de máquinas é estático durante esta busca: não recriá-lo
 // para cada amostra de cada aresta da grade (milhares em salão cheio).
 const vendors=custom?[]:vendingMachines(s);
 const slots=new Map(furnitureSlots(s).map(p=>[p.id,p]));
 const furniture=furnitureLocations(s).filter(p=>p.kind!=="poster").map(item=>{
  const p=slots.get(item.slotId);return p?{...p,r:item.kind==="table"?.4:.28}:null;
 }).filter((p):p is NonNullable<typeof p>=>!!p&&p.surface==="floor");
 // Móveis e paredes permanecem sólidos; um cliente no destino é
 // temporário. Alcançar um ponto seguro próximo evita espera circular.
 const staticClear=(p:Point)=>p.x>b.minX+.1&&p.x<b.maxX-.1&&p.y>b.minY+.1&&p.y<b.maxY-.1&&
  (!custom||Math.hypot(p.x-destination.x,p.y-destination.y)<.22||objects.every(r=>!(p.x>r.minX-.03&&p.x<r.maxX+.03&&p.y>r.minY-.03&&p.y<r.maxY+.03)))&&
  (custom||desks.every(d=>!(p.x>d.x-.08&&p.x<d.x+1.05&&p.y>d.y-.08&&p.y<d.y+.60)))&&
  (custom||vendors.every(d=>!(p.x>d.x-.08&&p.x<d.x+VENDING_WIDTH+.08&&p.y>d.y-.08&&p.y<d.y+VENDING_DEPTH+.08)))&&
  furniture.every(o=>Math.hypot(p.x-o.x,p.y-o.y)>o.r);
 const clear=(p:Point)=>staticClear(p)&&
  bodies.every(o=>Math.hypot(p.x-o.x,p.y-o.y)>=CUSTOMER_COLLISION_RADIUS+.00001);
 if(!staticClear(destination))return null; // Nunca rotear para dentro de um móvel.
 const destinationOccupied=!clear(destination);
 const segmentClear=(a:Point,d:Point,allowOccupiedGoal=false)=>{
  if(!traverse(a,d))return false;
  const n=Math.max(1,Math.ceil(Math.hypot(d.x-a.x,d.y-a.y)/.08));
  for(let i=1;i<=n;i++){
   const p={x:a.x+(d.x-a.x)*i/n,y:a.y+(d.y-a.y)*i/n};
   if(!(allowOccupiedGoal?staticClear(p):clear(p)))return false;
  }
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
  if(Math.hypot(at.x-destination.x,at.y-destination.y)<=.75&&segmentClear(at,destination,destinationOccupied)){
   const result:Point[]=[{...destination}];let current=key;
   while(current!==-1){result.push(point(current));current=prev.get(current)!;}
   return result.reverse();
  }
  for(const [dx,dy] of NEIGHBOR_STEPS){
   const x=key%cols+dx!,y=Math.floor(key/cols)+dy!,next=y*cols+x;
   if(x<0||x>=cols||y<0||y>=rows||prev.has(next))continue;
   if(segmentClear(at,point(next))){prev.set(next,key);queue.push(next);}
  }
 }
 return null;
}

/** Último recurso para uma fila móvel que travou: procurar um ponto seguro
 * LATERAL e retornar ao destino original. Nunca mover/teletransportar aqui.
 * Só calcula waypoints; colisões e velocidade continuam sob o motor. */
export function crowdSideStep(s:GameState,c:Customer,goal:Point):Point[]|null{
 const dx=goal.x-c.x,dy=goal.y-c.y,length=Math.hypot(dx,dy);
 if(length<.08)return null;
 const nx=dx/length,ny=dy/length,side=c.id%2===0?1:-1;
 for(const sign of [side,-side])for(const lateral of [.70,1.05]){
  const refuge={x:c.x-ny*sign*lateral+nx*.08,y:c.y+nx*sign*lateral+ny*.08};
  // O planejamento usa exatamente os mesmos limites de sala,
  // objetos, móveis, portas e corpos já aplicados por crowdRoute.
  const path=crowdRoute(s,c,refuge,.25);
  if(path?.length&&Math.hypot(path[0]!.x-c.x,path[0]!.y-c.y)>.06)
   return path;
 }
 return null;
}
