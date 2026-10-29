/** Projection and hit testing only. Returned IDs are interpreted by UI controllers. */
import type { AnnexComputerSlot,FurnitureKind,PlacementSlot,WallSegment } from "../application/contracts.js";
import type { PlacementActionsPort } from "../application/placementActionsPort.js";
import { iso,type Projection } from "./isometric.js";
export interface PickingSelection {placingKind:FurnitureKind|null;relocating:boolean;relocationFrom:string|null;wallMode:"build"|"remove"|"door"|null}
export function createScenePicker(canvas:HTMLCanvasElement,placementActions:PlacementActionsPort,getCamera:()=>Projection,selection:()=>PickingSelection,coarsePointer:()=>boolean){
function getCanvasPoint(e:MouseEvent|PointerEvent):{x:number;y:number}{
 const element=canvas!;
 const bounds=element.getBoundingClientRect();
 return {x:(e.clientX-bounds.left)/bounds.width*element.width,
         y:(e.clientY-bounds.top)/bounds.height*element.height};
}
function pickWall(x:number,y:number):WallSegment|null{
 const camera=getCamera(),wallMode=selection().wallMode,available=wallMode?placementActions.walls(wallMode):[];
 let nearest:WallSegment|null=null,best=Infinity;
 for(const segment of available){
   const [a,b]=placementActions.endpoints(segment);
   for(const height of (selection().wallMode==="build"?[0]:[0,38,76])){
     const pa=iso(a,camera,height),pb=iso(b,camera,height);
     const dx=pb.x-pa.x,dy=pb.y-pa.y,scale=Math.max(1,dx*dx+dy*dy);
     const t=Math.max(0,Math.min(1,((x-pa.x)*dx+(y-pa.y)*dy)/scale));
     const d=Math.hypot(x-pa.x-t*dx,y-pa.y-t*dy);
     if(d<best){best=d;nearest=segment;}
   }
 }
 return best<=Math.max(12,22*canvas!.width/canvas!.getBoundingClientRect().width)?nearest:null;
}
function pickAnnexPc(x:number,y:number):AnnexComputerSlot|null{
 const camera=getCamera();let nearest:AnnexComputerSlot|null=null,best=Infinity;
 for(const slot of placementActions.annexSlots()){
  const p=iso({x:slot.position.x+0.35,y:slot.position.y+0.55},camera,4);
  const d=Math.hypot(x-p.x,y-p.y);
  if(d<best){best=d;nearest=slot;}
 }
 return best<Math.max(22,33*camera.zoom)?nearest:null;
}
function pickFurnitureSlot(x:number,y:number):PlacementSlot|null{
 if(!selection().placingKind&&!selection().relocating)return null;
 const moving=placementActions.furniture().find(p=>p.slotId===selection().relocationFrom);
 const surface=selection().placingKind?(selection().placingKind==="poster"?"wall":"floor"):moving?(moving.kind==="poster"?"wall":"floor"):null;
 const camera=getCamera();
 let nearest:PlacementSlot|null=null,distance=Infinity;
 for(const slot of placementActions.slots()){
  if(surface&&slot.surface!==surface)continue;
  if(selection().relocating&&!moving&&!placementActions.furniture().some(p=>p.slotId===slot.id))continue;
  const at=slot.surface==="wall"?iso({x:slot.x+(slot.axis==="y"?0:.33),y:slot.y+(slot.axis==="y"?.33:0)},camera,137):
      iso({x:slot.x+0.25,y:slot.y+0.20},camera,9);
  const dist=Math.hypot(x-at.x,y-at.y);
  if(dist<distance){distance=dist;nearest=slot;}
 }
 // O zoom CSS do visor reduz a área tocável real. Usar um raio em
 // pixels de tela para que os encaixes sejam selecionáveis no celular.
 const rect=canvas!.getBoundingClientRect();
 const cssPixels=canvas!.width/Math.max(1,rect.width);
 const coarse=coarsePointer();
 return distance<=Math.max((coarse?48:23)*cssPixels,38*camera.zoom)?nearest:null;
}
 return {point:getCanvasPoint,wall:pickWall,annex:pickAnnexPc,furniture:pickFurnitureSlot};
}
export type ScenePicker=ReturnType<typeof createScenePicker>;
