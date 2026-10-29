/** Owns placement interaction state; never reads or mutates the simulation directly. */
import type { FurnitureKind } from "../application/contracts.js";
import type { GamePorts } from "../application/gamePorts.js";
import type { ScenePicker } from "../render/scenePicking.js";
import type { RuntimeUiState } from "./runtimeUiState.js";
import { resetPlacementUi } from "./runtimeUiState.js";
export interface PlacementControllerOptions {canvas:HTMLCanvasElement;state:RuntimeUiState;ports:GamePorts;picker:ScenePicker;hitOwner(x:number,y:number):boolean;renderUI():void;save():void;stopKeyboard():void;click():void}
export function createPlacementController(options:PlacementControllerOptions){
 const {canvas,state,ports,picker,hitOwner,renderUI,save,stopKeyboard}=options,placementActions=ports.placementActions;
 const placementNames:Record<FurnitureKind,string>={poster:"pôster",plant:"planta",table:"mesinha"};
 const getCanvasPoint=picker.point,pickWall=picker.wall,pickAnnexPc=picker.annex,pickFurnitureSlot=picker.furniture;
 const soundscape={click:options.click};
function stopPlacement():void{
 state.placement.placingKind=null;state.placement.relocating=false;state.placement.relocationFrom=null;state.placement.hoveredPlacement=null;state.placement.wallMode=null;state.placement.hoveredWall=null;state.placement.pendingWall=null;state.placement.installingAnnexPc=false;state.placement.hoveredAnnexPc=null;state.placement.placementNotice="";renderUI();
}
canvas.addEventListener("pointermove",e=>{
 if(!state.placement.placingKind&&!state.placement.relocating&&!state.placement.wallMode&&!state.placement.installingAnnexPc)return;
 const at=getCanvasPoint(e);
 if(state.placement.installingAnnexPc){state.placement.hoveredAnnexPc=pickAnnexPc(at.x,at.y)?.id??null;return;}
 if(state.placement.wallMode){state.placement.hoveredWall=pickWall(at.x,at.y);return;}
 state.placement.hoveredPlacement=pickFurnitureSlot(at.x,at.y)?.id??null;
});
canvas.addEventListener("pointerleave",()=>{state.placement.hoveredPlacement=null;state.placement.hoveredWall=null;state.placement.hoveredAnnexPc=null;});
canvas.addEventListener("click",e=>{
  const {x,y}=getCanvasPoint(e);
  if(state.placement.relocating||state.placement.placingKind||state.placement.wallMode||state.placement.installingAnnexPc)soundscape.click();
  if(state.placement.installingAnnexPc){
    const slot=pickAnnexPc(x,y),result=slot?placementActions.installAnnex(slot.id):
      {ok:false,message:"Escolha um espaço sinalizado para o PC no anexo."};
    state.placement.placementNotice=result.message;
    if(result.ok){ports.recordResult(result);stopPlacement();save();}
    else renderUI();
    return;
  }
  if(state.placement.wallMode){
    const wall=pickWall(x,y);
    if(!wall){state.placement.placementNotice="Toque em uma das linhas do chão para escolher o trecho da divisória.";renderUI();return;}
    state.placement.pendingWall=wall;state.placement.hoveredWall=wall;state.placement.placementNotice="Segmento selecionado. Confira a prévia e toque em Confirmar segmento.";
    renderUI();return;
  }
  if(state.placement.relocating){
    const slot=pickFurnitureSlot(x,y);
    if(!slot){state.placement.placementNotice="Escolha um móvel ou uma posição sinalizada.";renderUI();return;}
    const owned=placementActions.furniture().find(p=>p.slotId===slot.id);
    if(!state.placement.relocationFrom){
      if(!owned){state.placement.placementNotice="Selecione primeiro o móvel que deseja mover.";renderUI();return;}
      state.placement.relocationFrom=slot.id;state.placement.placementNotice="Agora escolha um destino verde para "+placementNames[owned.kind]+".";
      renderUI();return;
    }
    if(slot.id===state.placement.relocationFrom){state.placement.relocationFrom=null;state.placement.placementNotice="Selecione outro móvel para reorganizar.";renderUI();return;}
    if(owned){
      state.placement.relocationFrom=slot.id;state.placement.placementNotice="Selecionado: "+placementNames[owned.kind]+". Escolha um destino verde.";
      renderUI();return;
    }
    const result=placementActions.move(state.placement.relocationFrom,slot.id);
    if(result.ok){ports.recordResult(result);stopPlacement();save();}
    else{state.placement.placementNotice=result.message;renderUI();}
    return;
  }
  if(state.placement.placingKind){
    const kind=state.placement.placingKind,slot=pickFurnitureSlot(x,y);
    if(!slot){state.placement.placementNotice="Clique em uma das posições sinalizadas.";renderUI();return;}
    const result=placementActions.place(kind,slot.id,state.placement.purchaseRotation);
    if(result.ok){ports.recordResult(result);stopPlacement();save();}
    else{state.placement.placementNotice=result.message;renderUI();}
    return;
  }
  if(hitOwner(x,y)){soundscape.click();state.windows.adminOpen=!state.windows.adminOpen;if(state.windows.adminOpen)state.windows.shopOpen=false;renderUI();}
});
 return {stop:stopPlacement,
  start(id:FurnitureKind|"wall"|"door"|"computer-annex"){
   resetPlacementUi(state);

  if(id==="computer-annex"){
   state.placement.installingAnnexPc=true;state.placement.wallMode=null;state.placement.placingKind=null;state.placement.relocating=false;state.placement.hoveredAnnexPc=null;state.placement.placementNotice="";
  }else if(id==="wall"||id==="door"){
   state.placement.wallMode=id==="door"?"door":"build";state.placement.installingAnnexPc=false;state.placement.placingKind=null;state.placement.relocating=false;state.placement.hoveredWall=null;state.placement.pendingWall=null;state.placement.placementNotice="";
  }else{
   state.placement.placingKind=id;state.placement.purchaseRotation=0;state.placement.hoveredPlacement=null;state.placement.placementNotice="";stopKeyboard();
  }
  state.windows.shopOpen=false;state.windows.adminOpen=false;renderUI();
  canvas.parentElement?.scrollIntoView({block:"nearest",behavior:"instant"});
  },
  rotate(){
 if(state.placement.placingKind&&state.placement.placingKind!=="poster"){state.placement.purchaseRotation=((state.placement.purchaseRotation+1)%4) as 0|1|2|3;renderUI();return;}
 if(!state.placement.relocating||!state.placement.relocationFrom)return;
 const result=placementActions.rotate(state.placement.relocationFrom);
 ports.recordResult(result);renderUI();
 if(result.ok)save();},
  confirmWall(){
 if(!state.placement.pendingWall||!state.placement.wallMode)return;const wall=state.placement.pendingWall;
 const result=placementActions.confirmWall(state.placement.wallMode,wall);
 state.placement.placementNotice=result.message;if(result.ok){ports.recordResult(result);save();state.placement.pendingWall=null;}renderUI();},
  turnWall(){const wall=state.placement.pendingWall;if(wall){state.placement.pendingWall={...wall,axis:wall.axis==="x"?"y":"x"};state.placement.hoveredWall=state.placement.pendingWall;renderUI();}}
 };
}
export type PlacementController=ReturnType<typeof createPlacementController>;
