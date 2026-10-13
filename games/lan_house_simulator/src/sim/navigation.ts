import type {GameState,Point} from "./types.js";
import {roomBounds} from "./room.js";
import {hallwayRoute} from "./route.js";

/** Grade de navegação separada do desenho; portas permitem passagem, paredes bloqueiam. */
function barrierId(axis:"x"|"y",x:number,y:number):string{return axis+":"+x+":"+y;}
function tile(p:Point,b:{minX:number;maxX:number;minY:number;maxY:number}):[number,number]{
 return [Math.max(b.minX,Math.min(b.maxX-1,Math.floor(p.x))),
         Math.max(b.minY,Math.min(b.maxY-1,Math.floor(p.y)))];
}
export function navigableRoute(s:GameState,from:Point,to:Point):Point[]|null{
 const walls=s.interiorWalls??[];
 if(!walls.length)return hallwayRoute(from,to);
 const b=roomBounds(s);
 const blocked=new Set(walls.map(w=>barrierId(w.axis,w.x,w.y)));
 const doorways=new Set((s.interiorDoors??[]).map(w=>barrierId(w.axis,w.x,w.y)));
 for(const key of doorways)blocked.delete(key);
 const fromCell=tile(from,b),toCell=tile(to,b),key=(x:number,y:number)=>x+":"+y;
 const first=key(...fromCell),last=key(...toCell);
 if(first===last)return [{...to}];
 const queue:Array<[number,number]>=[fromCell],visited=new Set([first]);
 const parent=new Map<string,string>();
 let found=false;
 for(let i=0;i<queue.length&&!found;i++){
  const [x,y]=queue[i]!;
  for(const [dx,dy] of [[0,1],[-1,0],[1,0],[0,-1]]){
   const nx=x+dx,ny=y+dy,nkey=key(nx,ny);
   if(nx<b.minX||nx>=b.maxX||ny<b.minY||ny>=b.maxY||visited.has(nkey))continue;
   const edge=dx?barrierId("y",Math.max(x,nx),y):barrierId("x",x,Math.max(y,ny));
   if(blocked.has(edge))continue;
   parent.set(nkey,key(x,y));visited.add(nkey);queue.push([nx,ny]);
   if(nkey===last){found=true;break;}
  }
 }
 if(!visited.has(last))return null;
 const cells:Array<[number,number]>=[];
 let current=last;
 while(current!==first){
  const [x,y]=current.split(":").map(Number);
  cells.push([x!,y!]);current=parent.get(current)!;
 }
 cells.reverse();
 const waypoints:Point[]=[{x:fromCell[0]+0.5,y:fromCell[1]+0.5}];
 for(const [x,y] of cells)waypoints.push({x:x+0.5,y:y+0.5});
 waypoints.push({...to});
 return waypoints.filter((p,i)=>i===waypoints.length-1||
   Math.hypot(p.x-(i?waypoints[i-1]!.x:from.x),p.y-(i?waypoints[i-1]!.y:from.y))>0.05);
}
export function routesForCurrentCustomers(s:GameState):void{
 for(const c of s.customers){
  if(!["arriving","to_pc","shopping","leaving"].includes(c.stage))continue;
  const destination=c.route?.at(-1)??c.target;
  const path=navigableRoute(s,{x:c.x,y:c.y},destination);
  if(path?.length){c.target=path[0]!;c.route=path.slice(1);}
 }
}
