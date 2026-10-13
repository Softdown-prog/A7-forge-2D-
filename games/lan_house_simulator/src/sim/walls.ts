import type {GameState,Point,Result} from "./types.js";
import {entrance,pcCount,pcPosition} from "./engine.js";
import {hallwayRoute,COUNTER_QUEUE,computerSeat} from "./route.js";
import {vendingApproach} from "./layout.js";
import {roomBounds} from "./room.js";

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
 const start=entrance(s),counter=COUNTER_QUEUE;
 const services:Point[]=[...Array.from({length:pcCount(s)},(_,i)=>computerSeat(pcPosition(i))),
   vendingApproach("soda"),vendingApproach("candy")];
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
export function canBuildWall(s:GameState,w:WallSegment):boolean{
 return validWallPosition(s,w)&&!(s.interiorWalls??[]).some(p=>wallId(p)===wallId(w))&&!wallBlocksCustomers(s,w);
}
export function buildWall(s:GameState,w:WallSegment):Result{
 if(!canBuildWall(s,w))return {ok:false,message:"Parede indisponível: limite, ocupação ou passagem de clientes."};
 if((s.interiorWalls?.length??0)>=MAX_INTERIOR_WALLS)return {ok:false,message:"Limite de divisórias atingido."};
 if(s.cash<WALL_COST)return {ok:false,message:"Caixa insuficiente para construir parede."};
 s.cash-=WALL_COST;s.expenses+=WALL_COST;
 (s.interiorWalls??=[]).push({...w});
 return {ok:true,message:"Parede interna construída: -R$ "+WALL_COST+"."};
}
export function removeWall(s:GameState,w:WallSegment):Result{
 const index=(s.interiorWalls??[]).findIndex(p=>wallId(p)===wallId(w));
 if(index<0)return {ok:false,message:"Nenhuma parede nessa posição."};
 s.interiorWalls!.splice(index,1);
 return {ok:true,message:"Divisória removida sem custo. Não há reembolso de materiais."};
}
export function validInteriorWalls(s:GameState):boolean{
 if(s.interiorWalls===undefined)return true;
 if(!Array.isArray(s.interiorWalls)||s.interiorWalls.length>MAX_INTERIOR_WALLS)return false;
 const used=new Set<string>();
 for(const w of s.interiorWalls){
   if(!validWallPosition(s,w)||used.has(wallId(w))||wallBlocksCustomers(s,w))return false;
   used.add(wallId(w));
 }
 return true;
}
/** Component count of tile cells separated by internal partitions; useful for future rooms. */
export function wallZoneCount(s:GameState):number{
 const b=roomBounds(s),blocked=new Set((s.interiorWalls??[]).map(wallId));
 const visited=new Set<string>(),key=(x:number,y:number)=>x+":"+y;
 let zones=0;
 for(let y=b.minY;y<b.maxY;y++)for(let x=b.minX;x<b.maxX;x++){
  if(visited.has(key(x,y)))continue;
  zones++;
  const queue:[[number,number]]=[[x,y]];visited.add(key(x,y));
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
