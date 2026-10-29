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
export function createGameScene(canvas:HTMLCanvasElement,menuCanvas:HTMLCanvasElement|null,source:()=>GameState,popupQueues:PopupQueues){
 const view=canvas.getContext("2d");if(!view)throw new Error("Canvas 2D indisponível");
 const renderer=new SceneRenderer(view),sceneMotion=new SceneMotion(),menuView=menuCanvas?.getContext("2d");
 const menuRenderer=menuView?new SceneRenderer(menuView):null,menuPreview=createMenuScenePreview();
 const menuPreviewPainter=createMenuPreviewPainter(elapsed=>menuRenderer?.draw(menuPreview,elapsed));
 menuPreviewPainter.paintInitial();
 return {
  resetMotion:()=>sceneMotion.reset(),captureMotion:()=>sceneMotion.capture(source()),camera:()=>cameraForGame(source()),
  hasMenuRenderer:()=>!!menuRenderer,menuAvailable:()=>menuPreviewPainter.available(),
  drawScene:(elapsed:number)=>renderer.draw(sceneMotion.sample(source()),elapsed),
  drawAccessOverlay:(issues:readonly ServiceAccessIssue[],elapsed:number)=>renderer.drawServiceAccessOverlay(source(),issues,elapsed),
  drawEditorOverlay:(elapsed:number,input:Parameters<typeof drawLayoutEditorOverlay>[3])=>drawLayoutEditorOverlay(renderer,source(),elapsed,input),
  drawPlacementOverlay:(input:Parameters<typeof drawPlacementInteractionOverlays>[2])=>drawPlacementInteractionOverlays(renderer,source(),input),
  drawEffects:(dt:number,visible:boolean)=>paintFeedbackPopups(view,()=>cameraForGame(source()),popupQueues,dt,visible),
  paintMenu:(elapsed:number,painted:()=>void)=>{if(menuRenderer)menuPreviewPainter.paintFrame(elapsed,painted);},
  hitOwner:(x:number,y:number)=>renderer.hitOwner(x,y)
 };
}
export type GameScene=ReturnType<typeof createGameScene>;
