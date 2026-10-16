import type {GameState,Point} from "./types.js";
import {roomBounds} from "./room.js";
import {pcCount,pcPosition} from "./engine.js";
import {furnitureLocations,furnitureSlots} from "./shop.js";
import {vendingMachines,counterPoint} from "./layout.js";
import {canTraverseLocalStep} from "./navigation.js";
/** Grade para funcionários: desvios em torno de bancadas, PCs, máquinas, móveis e divisórias.
 * Pontos de partida e chegada podem estar junto aos móveis; nunca atravessa parede fechada. */
export function workerRoute(s:GameState,from:Point,to:Point):Point[]|null{
 const b=roomBounds(s),step=.5;
 const obstacles:Array<{x:number;y:number;r:number}>=[
  ...Array.from({length:pcCount(s)},(_,i)=>({...pcPosition(i,s),r:.38})),
  ...vendingMachines(s).map(m=>({x:m.x,y:m.y,r:.34})),
  {...counterPoint(s,{x:1.45,y:1.05}),r:.42}
 ];
 const slots=new Map(furnitureSlots(s).map(slot=>[slot.id,slot]));
 for(const item of furnitureLocations(s)){
  const p=slots.get(item.slotId);
  if(p && p.surface==="floor")obstacles.push({x:p.x,y:p.y,r:item.kind==="table"?.40:.28});
 }
 const inside=(p:Point)=>p.x>=b.minX+.1&&p.x<b.maxX-.1&&p.y>=b.minY+.1&&p.y<b.maxY-.1;
 const clear=(p:Point)=>inside(p)&&obstacles.every(o=>Math.hypot(p.x-o.x,p.y-o.y)>o.r);
 const key=(a:number,c:number)=>a+","+c,point=(a:number,c:number):Point=>({x:b.minX+.25+a*step,y:b.minY+.25+c*step});
 const cols=Math.max(1,Math.ceil((b.maxX-b.minX)/step)),rows=Math.max(1,Math.ceil((b.maxY-b.minY)/step));
 const closest=(p:Point)=>{let best:[number,number]|null=null,dist=Infinity;
  for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){const q=point(x,y);
   // O ponto de ancoragem deve pertencer à mesma zona da origem/destino.
   // Sem isso, a grade pode saltar uma divisória logo no primeiro passo.
   if(!clear(q)||!canTraverseLocalStep(s,p,q))continue;
   const d=Math.hypot(p.x-q.x,p.y-q.y);
   if(d<dist){dist=d;best=[x,y];}
  }return best;};
 const start=closest(from),finish=closest(to);if(!start||!finish)return null;
 const akey=key(...start),bkey=key(...finish),queue:[number,number][]=[start],prev=new Map<string,string>(),seen=new Set([akey]);
 const canCross=(a:Point,c:Point)=>canTraverseLocalStep(s,a,c);
 for(let i=0;i<queue.length&&!seen.has(bkey);i++){
  const [x,y]=queue[i]!;
  for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
   const nx=x+dx,ny=y+dy,k=key(nx,ny);
   if(nx<0||ny<0||nx>=cols||ny>=rows||seen.has(k)||!clear(point(nx,ny))||!canCross(point(x,y),point(nx,ny)))continue;
   seen.add(k);prev.set(k,key(x,y));queue.push([nx,ny]);
  }
 }
 if(!seen.has(bkey))return null;
 const result:Point[]=[];let k=bkey;
 while(k!==akey){const [x,y]=k.split(",").map(Number);result.push(point(x!,y!));k=prev.get(k)!;}
 result.reverse();
 // Nas plantas livres, ir diretamente ao primeiro desvio mantém a fluidez
 // original. Só inserimos o nó inicial se pular para o primeiro waypoint
 // atravessaria uma divisória (especialmente em posição não alinhada à grade).
 if(!result.length){
  // Origem e destino próximos: não obrigar um desvio artificial à grade.
  if(clear(to)&&canCross(from,to))return [{...to}];
  result.push(point(...start));
 }else if(!canCross(from,result[0]!))result.unshift(point(...start));
 const endpoint=result.at(-1)!;
 if(!canCross(endpoint,to))return null;
 if(clear(to))result.push({...to});
 return result;
}
