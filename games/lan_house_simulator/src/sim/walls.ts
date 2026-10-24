import type {GameState,Point,Result} from "./types.js";
import {entrance,pcCount,pcPosition} from "./engine.js";
import {hallwayRoute,COUNTER_QUEUE,computerSeat} from "./route.js";
import {vendingApproach,purchaseApproach} from "./layout.js";
import {roomBounds} from "./room.js";
import {navigableRoute,routesForCurrentCustomers} from "./navigation.js";
import {editableObjects,wallCutsObject} from "./editableObjects.js";
import {counterQueue} from "./route.js";
import {activeRetailQueuesReachable,refreshRetailQueues} from "./retailQueue.js";
import {CUSTOMER_COLLISION_RADIUS} from "./checkoutQueue.js";

export type WallAxis="x"|"y";
export type WallSegment={axis:WallAxis;x:number;y:number};
export const WALL_COST=30;
export const MAX_INTERIOR_WALLS=220;
export function wallId(w:WallSegment):string{return w.axis+":"+w.x+":"+w.y;}
export function wallEndpoints(w:WallSegment):[Point,Point]{
 return [{x:w.x,y:w.y},w.axis==="x"?{x:w.x+1,y:w.y}:{x:w.x,y:w.y+1}];
}
/** Only interior tile edges can become partitions. Never build over the exterior entrance. */
export function validWallPosition(s:GameState,w:WallSegment):boolean{
 if(!w||(w.axis!=="x"&&w.axis!=="y")||!Number.isInteger(w.x)||!Number.isInteger(w.y))return false;
 const b=roomBounds(s);
 return w.axis==="x"?
    w.x>=b.minX&&w.x<b.maxX&&w.y>b.minY&&w.y<b.maxY:
    w.y>=b.minY&&w.y<b.maxY&&w.x>b.minX&&w.x<b.maxX;
}
export function wallCandidates(s:GameState):WallSegment[]{
 const b=roomBounds(s),walls:WallSegment[]=[];
 for(let y=b.minY+1;y<b.maxY;y++)for(let x=b.minX;x<b.maxX;x++)walls.push({axis:"x",x,y});
 for(let x=b.minX+1;x<b.maxX;x++)for(let y=b.minY;y<b.maxY;y++)walls.push({axis:"y",x,y});
 return walls;
}
/** True only when the NPC path crosses the wall plane within the tile edge. */
function crossesWall(w:WallSegment,a:Point,b:Point):boolean{
 const eps=1e-6;
 if(w.axis==="x"){
   const d=b.y-a.y;
   if(Math.abs(d)<eps)return false;
   const t=(w.y-a.y)/d;
   if(t<=eps||t>=1-eps)return false;
   const x=a.x+(b.x-a.x)*t;
   return x>w.x+eps&&x<w.x+1-eps;
 }
 const d=b.x-a.x;
 if(Math.abs(d)<eps)return false;
 const t=(w.x-a.x)/d;
 if(t<=eps||t>=1-eps)return false;
 const y=a.y+(b.y-a.y)*t;
 return y>w.y+eps&&y<w.y+1-eps;
}
function crossesRoute(w:WallSegment,points:Point[]):boolean{
 for(let i=1;i<points.length;i++)if(crossesWall(w,points[i-1]!,points[i]!))return true;
 return false;
}
/** Protects routes already in use; no new wall may cut the original movement logic. */
export function wallBlocksCustomers(s:GameState,w:WallSegment):boolean{
 const start=entrance(s),counter=counterQueue(s);
 const services:Point[]=[...Array.from({length:pcCount(s)},(_,i)=>computerSeat(pcPosition(i,s))),
   vendingApproach("soda",s),vendingApproach("candy",s),purchaseApproach("snacks",s)];
 const pairs:Array<[Point,Point]>=[[start,counter],[counter,start]];
 for(const service of services){
   pairs.push([counter,service],[service,start]);
 }
 for(const [a,b] of pairs){
   if(crossesRoute(w,[a,...hallwayRoute(a,b)]))return true;
 }
 for(const customer of s.customers){
   if(crossesRoute(w,[{x:customer.x,y:customer.y},customer.target,...(customer.route??[])]))return true;
 }
 return false;
}
/** Obras não podem atravessar a área ocupada pelos clientes.
 * Mantém a colisão idêntica à caminhada; nunca move ou expulsa pessoas.
 */
export function wallTouchesCustomer(s:GameState,w:WallSegment):boolean{
 const [a,b]=wallEndpoints(w),dx=b.x-a.x,dy=b.y-a.y;
 return s.customers.some(c=>{
  const t=Math.max(0,Math.min(1,((c.x-a.x)*dx+(c.y-a.y)*dy)/(dx*dx+dy*dy)));
  return Math.hypot(c.x-(a.x+t*dx),c.y-(a.y+t*dy))<CUSTOMER_COLLISION_RADIUS;
 });
}
export function canBuildWall(s:GameState,w:WallSegment):boolean{
 if(!validWallPosition(s,w)||wallTouchesCustomer(s,w)||(s.interiorWalls??[]).some(p=>wallId(p)===wallId(w))||
    (s.interiorDoors??[]).some(p=>wallId(p)===wallId(w)))return false;
 if(editableObjects(s).some(o=>o.surface==="floor"&&wallCutsObject(w,o)))return false;
 // Preserva a alcançabilidade de todos os serviços e de clientes ativos.
 const next={...s,interiorWalls:[...(s.interiorWalls??[]),w]};
 const goals:Point[]=[counterQueue(s),...Array.from({length:pcCount(s)},(_,i)=>computerSeat(pcPosition(i,s))),
 vendingApproach("soda",s),vendingApproach("candy",s),purchaseApproach("snacks",s)];
 for(const goal of goals)if(!navigableRoute(next,entrance(s),goal))return false;
 for(const c of s.customers)if(!navigableRoute(next,c,c.route?.at(-1)??c.target))return false;
 if(!activeRetailQueuesReachable(next))return false;
 return true;
}
export function buildWall(s:GameState,w:WallSegment):Result{
 if(!canBuildWall(s,w))return {ok:false,message:"Parede indisponível: limite, ocupação ou passagem de clientes."};
 if((s.interiorWalls?.length??0)>=MAX_INTERIOR_WALLS)return {ok:false,message:"Limite de divisórias atingido."};
 if(s.cash<WALL_COST)return {ok:false,message:"Caixa insuficiente para construir parede."};
 s.cash-=WALL_COST;s.expenses+=WALL_COST;
 (s.interiorWalls??=[]).push({...w});
 routesForCurrentCustomers(s);refreshRetailQueues(s);
 return {ok:true,message:"Parede interna construída: -R$ "+WALL_COST+"."};
}
export function removeWall(s:GameState,w:WallSegment):Result{
 const index=(s.interiorWalls??[]).findIndex(p=>wallId(p)===wallId(w));
 if(index<0)return {ok:false,message:"Nenhuma parede nessa posição."};
 s.interiorWalls!.splice(index,1);
 routesForCurrentCustomers(s);refreshRetailQueues(s);
 return {ok:true,message:"Divisória removida sem custo. Não há reembolso de materiais."};
}
export const DOOR_COST=80;
export function installInteriorDoor(s:GameState,w:WallSegment):Result{
 if(!validWallPosition(s,w))return {ok:false,message:"Segmento de porta inválido."};
 const index=(s.interiorWalls??[]).findIndex(p=>wallId(p)===wallId(w));
 if(index<0)return {ok:false,message:"Construa primeiro a divisória que receberá a porta."};
 if(s.cash<DOOR_COST)return {ok:false,message:"Caixa insuficiente para instalar uma porta."};
 s.interiorWalls!.splice(index,1);
 (s.interiorDoors??=[]).push({...w});
 s.cash-=DOOR_COST;s.expenses+=DOOR_COST;
 routesForCurrentCustomers(s);refreshRetailQueues(s);
 return {ok:true,message:"Porta interna instalada: -R$ "+DOOR_COST+"."};
}
export function removeInteriorDoor(s:GameState,w:WallSegment):Result{
 const index=(s.interiorDoors??[]).findIndex(p=>wallId(p)===wallId(w));
 if(index<0)return {ok:false,message:"Não há porta nesse local."};
 s.interiorDoors!.splice(index,1);
 routesForCurrentCustomers(s);refreshRetailQueues(s);
 return {ok:true,message:"Porta interna removida. Passagem livre."};
}
export function removablePartitions(s:GameState):Array<WallSegment&{id:string;label:string;kind:"wall"|"door"}>{
 return (["wall","door"] as const).flatMap(kind=>((kind==="wall"?s.interiorWalls:s.interiorDoors)??[]).map((w,i)=>({...w,kind,id:kind+":"+wallId(w),label:(kind==="wall"?"Divisória ":"Porta interna ")+(i+1)+" · "+w.x+", "+w.y+" · "+(w.axis==="x"?"horizontal":"vertical")})));
}
export function removePartition(s:GameState,id:string):Result{
 const partition=removablePartitions(s).find(p=>p.id===id);
 if(!partition)return {ok:false,message:"Selecione uma divisória ou porta existente."};
 return partition.kind==="door"?removeInteriorDoor(s,partition):removeWall(s,partition);
}
export function validInteriorDoors(s:GameState):boolean{
 if(s.interiorDoors===undefined)return true;
 if(!Array.isArray(s.interiorDoors)||s.interiorDoors.length>MAX_INTERIOR_WALLS)return false;
 const existing=new Set((s.interiorWalls??[]).map(wallId)),seen=new Set<string>();
 for(const door of s.interiorDoors){
  if(!validWallPosition(s,door)||existing.has(wallId(door))||seen.has(wallId(door)))return false;
  seen.add(wallId(door));
 }
 return true;
}
export function validInteriorWalls(s:GameState):boolean{
 if(s.interiorWalls===undefined)return true;
 if(!Array.isArray(s.interiorWalls)||s.interiorWalls.length>MAX_INTERIOR_WALLS)return false;
 const used=new Set<string>();
 for(const w of s.interiorWalls){
   if(!validWallPosition(s,w)||used.has(wallId(w)))return false;
   used.add(wallId(w));
 }
 // A parede pode exigir desvio pela porta. Valida alcançabilidade, não a rota reta.
 const destinations:Point[]=[counterQueue(s),...Array.from({length:pcCount(s)},(_,i)=>
   computerSeat(pcPosition(i,s))),vendingApproach("soda",s),vendingApproach("candy",s),purchaseApproach("snacks",s)];
 for(const destination of destinations){
   if(!navigableRoute(s,entrance(s),destination))return false;
 }
 return true;
}
/** Component count of tile cells separated by internal partitions; useful for future rooms. */
export function wallZoneCount(s:GameState):number{
 const b=roomBounds(s),blocked=new Set([...(s.interiorWalls??[]),...(s.interiorDoors??[])].map(wallId));
 const visited=new Set<string>(),key=(x:number,y:number)=>x+":"+y;
 let zones=0;
 for(let y=b.minY;y<b.maxY;y++)for(let x=b.minX;x<b.maxX;x++){
  if(visited.has(key(x,y)))continue;
  zones++;
  const queue:Array<[number,number]>=[[x,y]];visited.add(key(x,y));
  for(let index=0;index<queue.length;index++){
    const [cx,cy]=queue[index]!;
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
      const nx=cx+dx,ny=cy+dy;
      if(nx<b.minX||nx>=b.maxX||ny<b.minY||ny>=b.maxY||visited.has(key(nx,ny)))continue;
      const edge:WallSegment=dx!==0?{axis:"y",x:Math.max(cx,nx),y:cy}:{axis:"x",x:cx,y:Math.max(cy,ny)};
      if(blocked.has(wallId(edge)))continue;
      visited.add(key(nx,ny));queue.push([nx,ny]);
    }
  }
 }
 return zones;
}
