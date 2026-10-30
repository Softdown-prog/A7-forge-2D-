/** Browser frame adapter: simulation, events, presentation, HUD, then the next RAF. */
import { createFrameSchedule } from "../application/frameSchedule.js";
import { createFrameSimulationCoordinator } from "../application/frameSimulationCoordinator.js";
import type { GameFramePort } from "../application/gameFramePort.js";
import type { GamePorts } from "../application/gamePorts.js";
import type { GameScene } from "../render/gameScene.js";
import { installFrameInteractionTracker } from "./frameInteractionTracker.js";
import { createFramePresentationCoordinator } from "./framePresentationCoordinator.js";
import { createFrameViewportState } from "./frameViewportState.js";
import type { createLayoutEditor } from "./layoutEditor.js";
import type { RuntimeUiState } from "./runtimeUiState.js";
import type { createServiceAccessInspectionCache } from "./serviceAccessInspectionCache.js";
export interface RuntimeLoopOptions {
 document:Document;window:Window;canvas:HTMLCanvasElement;state:RuntimeUiState;framePort:GameFramePort;scene:GameScene;editor:ReturnType<typeof createLayoutEditor>;
 inspection:ReturnType<typeof createServiceAccessInspectionCache<ReturnType<GamePorts["accessIssues"]>[number]>>;
 renderUI(liveOnly?:boolean):void;
}
export function createRuntimeLoop(options:RuntimeLoopOptions){
 const {document,window:win,canvas,state,framePort,scene,editor:layoutEditor}=options;
 const frameSchedule=createFrameSchedule(),framePresentation=createFramePresentationCoordinator(frameSchedule);
 const frameViewport=createFrameViewportState(canvas,callback=>new IntersectionObserver(callback),query=>win.matchMedia(query));
 const frameInteraction=installFrameInteractionTracker(document,win,()=>performance.now());
 const frameSimulation=createFrameSimulationCoordinator({resetMotion:scene.resetMotion,captureMotion:scene.captureMotion,advance:framePort.advance});
 let running=false,request:number|null=null;
 function frame(timestamp:number):void{
  if(!running)return;
  const {dt,elapsed}=frameSchedule.begin(timestamp),accountOpen=document.getElementById("player-account")?.hasAttribute("open")===true;
  const simulation=framePort.snapshot();
  frameSimulation.run({playing:state.isPlaying,accountOpen,beforeCampaignEnd:simulation.beforeCampaignEnd,
   editingLayout:layoutEditor.active,placingFurniture:!!state.placement.placingKind,relocatingFurniture:state.placement.relocating,editingWalls:!!state.placement.wallMode,installingAnnexPc:state.placement.installingAnnexPc},dt,simulation.leftoverMinutes);
  framePort.dispatch(state.isPlaying,document.hidden);
  framePresentation.render({timestamp,
   sceneFlags:{playing:state.isPlaying,accountOpen,visible:frameViewport.visible(),hidden:document.hidden,...state.windows,coarse:frameViewport.coarsePointer()},
   menuFlags:{playing:state.isPlaying,accountOpen,hasRenderer:scene.hasMenuRenderer(),previewAvailable:scene.menuAvailable(),hidden:document.hidden,reduceMotion:frameViewport.reducedMotion()},
   hudFlags:{playing:state.isPlaying,accountOpen,...frameInteraction.snapshot()},accessVisible:state.serviceAccessVisible,
   drawScene:()=>scene.drawScene(elapsed),drawAccessOverlay:()=>scene.drawAccessOverlay(options.inspection.inspect(),elapsed),
   drawEditorOverlay:visible=>scene.drawEditorOverlay(elapsed,{visible,active:layoutEditor.active,selected:layoutEditor.selected,draft:layoutEditor.draft}),
   paintMenu:painted=>scene.paintMenu(elapsed,painted),
   drawEffects:visible=>{if(state.isPlaying)scene.drawEffects(dt,visible);},
   drawPlacementOverlay:visible=>scene.drawPlacementOverlay({visible,editWall:layoutEditor.active?layoutEditor.wall:null,...state.placement}),
   refreshHud:()=>options.renderUI(true)
  });
  request=win.requestAnimationFrame(frame);
 }
 return {start(){if(running)return;running=true;request=win.requestAnimationFrame(frame);},stop(){running=false;if(request!==null)win.cancelAnimationFrame(request);request=null;}};
}
export type RuntimeLoop=ReturnType<typeof createRuntimeLoop>;
