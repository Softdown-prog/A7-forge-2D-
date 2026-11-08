/** Canvas composition only. Simulation time is advanced exclusively by GameFramePort. */
import type { PopupQueues } from "../application/frameFeedbackPort.js";
import { createMenuScenePreview } from "../application/menuScenePreviewPort.js";
import type { ServiceAccessIssue } from "../sim/serviceAccess.js";
import type { GameState } from "../sim/types.js";
import { paintFeedbackPopups } from "./feedbackPopupPainter.js";
import { drawLayoutEditorOverlay,drawPlacementInteractionOverlays } from "./interactionOverlays.js";
import { cameraForGame } from "./isometric.js";
import { createMenuPreviewPainter } from "./menuPreviewPainter.js";
import { SceneMotion } from "./motion.js";
import { SceneRenderer } from "./scene.js";
import { fitSceneBackingStore,sceneBackingScale,SCENE_WIDTH } from "./sceneSurface.js";
/** Keep the bitmap at the display's resolution: CSS size × device pixel ratio,
 * quantized and capped by sceneBackingScale. Painters never see this scale. */
function createSurfaceFitter(canvas:HTMLCanvasElement,ctx:CanvasRenderingContext2D){
 const win=typeof window!=="undefined"?window:undefined;
 const coarse=typeof matchMedia==="function"?matchMedia("(pointer:coarse)"):null;
 let last=0;
 return ()=>{
  const css=canvas.clientWidth||0;
  const scale=sceneBackingScale(css||SCENE_WIDTH,win?.devicePixelRatio??1,!!coarse?.matches);
  if(scale!==last||canvas.width!==Math.round(SCENE_WIDTH*scale)){last=scale;fitSceneBackingStore(canvas,ctx,scale);}
 };
}
export function createGameScene(canvas:HTMLCanvasElement,menuCanvas:HTMLCanvasElement|null,source:()=>GameState,popupQueues:PopupQueues){
 const view=canvas.getContext("2d");if(!view)throw new Error("Canvas 2D indisponível");
 const renderer=new SceneRenderer(view),sceneMotion=new SceneMotion(),menuView=menuCanvas?.getContext("2d");
 const fitScene=createSurfaceFitter(canvas,view),fitMenu=menuCanvas&&menuView?createSurfaceFitter(menuCanvas,menuView):()=>{};
 const menuRenderer=menuView?new SceneRenderer(menuView):null,menuPreview=createMenuScenePreview();
 const menuPreviewPainter=createMenuPreviewPainter(elapsed=>menuRenderer?.draw(menuPreview,elapsed));
 fitMenu();menuPreviewPainter.paintInitial();
 return {
  resetMotion:()=>sceneMotion.reset(),captureMotion:()=>sceneMotion.capture(source()),camera:()=>cameraForGame(source()),
  hasMenuRenderer:()=>!!menuRenderer,menuAvailable:()=>menuPreviewPainter.available(),
  drawScene:(elapsed:number)=>{fitScene();renderer.draw(sceneMotion.sample(source()),elapsed);},
  drawAccessOverlay:(issues:readonly ServiceAccessIssue[],elapsed:number)=>renderer.drawServiceAccessOverlay(source(),issues,elapsed),
  drawEditorOverlay:(elapsed:number,input:Parameters<typeof drawLayoutEditorOverlay>[3])=>drawLayoutEditorOverlay(renderer,source(),elapsed,input),
  drawPlacementOverlay:(input:Parameters<typeof drawPlacementInteractionOverlays>[2])=>drawPlacementInteractionOverlays(renderer,source(),input),
  drawEffects:(dt:number,visible:boolean)=>paintFeedbackPopups(view,()=>cameraForGame(source()),popupQueues,dt,visible),
  paintMenu:(elapsed:number,painted:()=>void)=>{if(menuRenderer){fitMenu();menuPreviewPainter.paintFrame(elapsed,painted);}},
  hitOwner:(x:number,y:number)=>renderer.hitOwner(x,y)
 };
}
export type GameScene=ReturnType<typeof createGameScene>;
