/** Read-only object footprints and geometric validation. Navigation never imports layout commands. */
import type {GameState,Point} from "./types.js";
import {pcCount,pcPosition,entrance} from "./simulationState.js";
import {placedObject,turnPoint,vendingMachines,vendingApproach,purchaseApproach,type Rotation} from "./layout.js";
import {roomBounds} from "./room.js";
import {computerSeat,counterQueue} from "./route.js";
import {CUSTOMER_COLLISION_RADIUS} from "./checkoutQueue.js";
import {furnitureLocations,furnitureSlots} from "./furnitureLayout.js";
import {binSpots} from "./serviceLayout.js";
import {consoleFootprints,consoleApproaches} from "./consoleLayout.js";

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

export function layoutGoals(s:GameState):Point[]{return [counterQueue(s),...Array.from({length:pcCount(s)},(_,i)=>computerSeat(pcPosition(i,s))),vendingApproach("soda",s),vendingApproach("candy",s),purchaseApproach("snacks",s),
 ...consoleApproaches(s)];}

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
 if([...editableObjects(s),...consoleFootprints(s,true)].some(other=>other.id!==o.id&&other.surface==="floor"&&overlap(o,other)))return "Esta posição está ocupada por outro objeto.";
 if([...(s.interiorWalls??[]),...(s.interiorDoors??[])].some(w=>wallCutsObject(w,o)))return "O objeto atravessa uma divisória ou porta.";
 if(pointInsideObject(o,entrance(s),.3))return "Mantenha a entrada livre.";
 const ownGoal=o.kind==="counter"?0:o.kind==="pc"?1+o.index!:o.kind==="soda"?1+pcCount(s):o.kind==="candy"?2+pcCount(s):o.kind==="shelf"?3+pcCount(s):-1;
 if(layoutGoals(s).some((p,i)=>i!==ownGoal&&pointInsideObject(o,p,.2)))return "Mantenha os assentos e pontos de atendimento livres.";
 return null;
}
