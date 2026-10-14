import type {GameState} from "../sim/types.js";
import {editableObjects,moveLayoutObject,layoutPlacementIssue,layoutRemovalIssue,removeLayoutObject,type EditableObject} from "../sim/editableObjects.js";
import {removablePartitions,removePartition,wallEndpoints} from "../sim/walls.js";
import {furnitureSlots} from "../sim/shop.js";
import {roomBounds} from "../sim/room.js";
import {cameraForGame,iso} from "../render/isometric.js";
export function createLayoutEditor(canvas:HTMLCanvasElement,getState:()=>GameState,onOpen:()=>void,onChange:()=>void){
 const panel=document.querySelector<HTMLElement>("#layout-editor"),select=document.querySelector<HTMLSelectElement>("#layout-object"),message=document.querySelector<HTMLElement>("#layout-message"),confirm=document.querySelector<HTMLButtonElement>("#layout-confirm");
 const remove=document.querySelector<HTMLButtonElement>("#layout-remove"),removalPanel=document.querySelector<HTMLElement>("#layout-removal"),removalMessage=document.querySelector<HTMLElement>("#layout-removal-message");
 let active=false,selected:string|null=null,draft:EditableObject|null=null,removalPending=false,partitionsOnly=false;
 const partition=()=>removablePartitions(getState()).find(w=>w.id===selected)??null;
 const update=()=>{
  if(!panel||!select)return;panel.hidden=!active;
  if(active){
   const objects=document.createElement("optgroup"),walls=document.createElement("optgroup");objects.label="Objetos do salão";walls.label="Divisórias e portas";
   objects.append(...editableObjects(getState()).map(o=>new Option(o.label,o.id)));walls.append(...removablePartitions(getState()).map(w=>new Option(w.label,w.id)));
   select.replaceChildren(new Option(partitionsOnly?"Escolha uma divisória ou porta":"Escolha um item ou divisória",""),...(!partitionsOnly?[objects]:[]),walls);select.value=selected??"";
  }
  const issue=draft?layoutPlacementIssue(getState(),draft):null;
  if(confirm)confirm.disabled=removalPending||!draft||!!issue;
  const rotation=document.querySelector<HTMLButtonElement>("#layout-rotate");if(rotation)rotation.disabled=removalPending||!draft||draft.surface==="wall";
  const wall=partition(),removable=!!wall||!!selected&&!layoutRemovalIssue(getState(),selected);
  if(remove){remove.disabled=!removable;remove.textContent=wall?"Remover "+(wall.kind==="door"?"porta":"divisória"):"Remover item";}
  if(removalPanel)removalPanel.hidden=!removalPending;
  if(removalMessage&&removalPending)removalMessage.textContent="Remover "+(wall?.label??draft?.label??"este item")+"? O espaço será liberado. Não há custo nem reembolso.";
  if(message)message.textContent=wall?"Divisória selecionada e destacada no mapa. Use Remover e confirme para liberar a passagem.":issue??(draft?(draft.surface==="wall"?"Toque na parede desejada e confirme, ou use Remover item.":"Toque no destino, gire se quiser e confirme. "+(removable?"Este item também pode ser removido.":"Este equipamento atende clientes e pode ser reposicionado.")):"Selecione pelo toque ou pela lista. A partida fica pausada durante a edição.");
 };
 const choose=(id:string|null)=>{removalPending=false;selected=id;draft=editableObjects(getState()).find(o=>o.id===id)??null;update();};
 select?.addEventListener("change",()=>choose(select.value||null));
 document.getElementById("layout-rotate")?.addEventListener("click",()=>{if(draft&&draft.surface!=="wall"){draft={...draft,rotation:((draft.rotation+1)%4) as 0|1|2|3};update();}});
 document.getElementById("layout-deselect")?.addEventListener("click",()=>choose(null));
 const close=()=>{active=false;selected=null;draft=null;removalPending=false;update();onChange();};
 document.getElementById("layout-close")?.addEventListener("click",close);
 remove?.addEventListener("click",()=>{if(!selected||remove.disabled)return;removalPending=true;update();});
 document.getElementById("layout-removal-cancel")?.addEventListener("click",()=>{removalPending=false;update();});
 document.getElementById("layout-removal-confirm")?.addEventListener("click",()=>{
  if(!removalPending||!selected)return;
  const result=partition()?removePartition(getState(),selected):removeLayoutObject(getState(),selected);
  if(result.ok){choose(null);onChange();}else{removalPending=false;update();}
  if(message)message.textContent=result.message;
 });
 confirm?.addEventListener("click",()=>{if(!draft||!selected)return;const result=moveLayoutObject(getState(),selected,draft,draft.rotation);if(message)message.textContent=result.message;if(result.ok){draft=null;selected=null;onChange();update();if(message)message.textContent=result.message;}});
 canvas.addEventListener("click",e=>{
  if(!active)return;e.preventDefault();e.stopImmediatePropagation();
  if(removalPending)return;
  const rect=canvas.getBoundingClientRect(),x=(e.clientX-rect.left)/rect.width*canvas.width,y=(e.clientY-rect.top)/rect.height*canvas.height,s=getState(),cam=cameraForGame(s);
  if(!draft){let best:string|null=null,score=Infinity;
   if(!partitionsOnly)for(const o of editableObjects(s)){const p=iso({x:o.x+o.w/2,y:o.y+o.d/2},cam,o.surface==="wall"?135:o.kind==="pc"?50:o.kind==="counter"?45:o.kind==="soda"||o.kind==="candy"||o.kind==="shelf"?50:20),d=Math.hypot(x-p.x,y-p.y);if(d<score){best=o.id;score=d;}}
   for(const wall of removablePartitions(s))for(const height of [0,38,76]){
    const [a,b]=wallEndpoints(wall),pa=iso(a,cam,height),pb=iso(b,cam,height),dx=pb.x-pa.x,dy=pb.y-pa.y,t=Math.max(0,Math.min(1,((x-pa.x)*dx+(y-pa.y)*dy)/Math.max(1,dx*dx+dy*dy))),distance=Math.hypot(x-pa.x-t*dx,y-pa.y-t*dy);
    if(distance<score&&distance<22*canvas.width/rect.width){best=wall.id;score=distance;}
   }
   if(best&&score<32*canvas.width/rect.width)choose(best);return;
  }
  const u=(x-cam.originX)/(64*cam.zoom),v=(y-cam.originY)/(32*cam.zoom),world={x:(u+v)/2,y:(v-u)/2};
  if(draft.id.startsWith("decor:")){
   let closest=null,best=Infinity;
   for(const slot of furnitureSlots(s).filter(p=>p.surface===draft!.surface)){const p=iso({x:slot.x+(slot.axis==="y"?0:.25),y:slot.y+(slot.axis==="y"?.25:slot.surface==="wall"?0:.2)},cam,slot.surface==="wall"?137:0),d=Math.hypot(x-p.x,y-p.y);if(d<best){best=d;closest=slot;}}
   if(closest)draft={...draft,x:closest.x,y:closest.y,axis:closest.axis??"x",rotation:draft.surface==="wall"?(closest.axis==="y"?3:0):draft.rotation};
  }else if(draft.surface==="wall"){
   const b=roomBounds(s);let closest={x:0,y:0,rotation:0 as 0|3},best=Infinity;
   for(let p=b.minX;p<b.maxX-.96;p+=.25){const at=iso({x:p+.48,y:b.minY},cam,133),d=Math.hypot(x-at.x,y-at.y);if(d<best){best=d;closest={x:p,y:b.minY,rotation:0};}}
   for(let p=b.minY;p<b.maxY-.96;p+=.25){const at=iso({x:b.minX,y:p+.48},cam,133),d=Math.hypot(x-at.x,y-at.y);if(d<best){best=d;closest={x:b.minX,y:p,rotation:3};}}
   draft={...draft,...closest};
  }else draft={...draft,x:Math.round((world.x-draft.w/2)*4)/4,y:Math.round((world.y-draft.d/2)*4)/4};
  update();
 },{capture:true});
 return {get active(){return active;},get selected(){return selected;},get draft(){return draft;},get wall(){return partition();},open(onlyPartitions=false){onOpen();active=true;selected=null;draft=null;removalPending=false;partitionsOnly=onlyPartitions;update();panel?.scrollIntoView({block:"nearest",behavior:"instant"});select?.focus({preventScroll:true});},close};
}
