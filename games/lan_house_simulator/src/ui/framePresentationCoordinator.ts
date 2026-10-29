/** Presentation-only schedule gates; live render callbacks come from the bootstrap. */
import type {SceneFlags,MenuFlags,HudFlags} from "../application/frameSchedule.js";
import {renderFrameVisualLayers} from "./frameVisualLayers.js";

export interface FramePresentationSchedule {
 scene(timestamp:number,flags:SceneFlags):boolean;
 menu(timestamp:number,flags:MenuFlags):boolean;
 menuPainted(timestamp:number):void;
 hud(timestamp:number,flags:HudFlags):boolean;
}
export interface FramePresentationInput {
 readonly timestamp:number;
 readonly sceneFlags:SceneFlags;
 readonly menuFlags:MenuFlags;
 readonly hudFlags:HudFlags;
 readonly accessVisible:boolean;
 readonly drawScene:()=>void;
 readonly drawAccessOverlay:()=>void;
 readonly drawEditorOverlay:(visible:boolean)=>void;
 readonly paintMenu:(painted:()=>void)=>void;
 readonly drawEffects:(visible:boolean)=>void;
 readonly drawPlacementOverlay:(visible:boolean)=>void;
 readonly refreshHud:()=>void;
}
export function createFramePresentationCoordinator(schedule:FramePresentationSchedule){
 return {
  render(input:FramePresentationInput):void{
   const paintScene=schedule.scene(input.timestamp,input.sceneFlags);
   renderFrameVisualLayers({
    sceneVisible:paintScene,accessVisible:input.accessVisible,
    drawScene:input.drawScene,
    drawAccessOverlay:input.drawAccessOverlay,
    drawEditorOverlay:()=>input.drawEditorOverlay(paintScene),
    drawMenuPreview:()=>{
     if(schedule.menu(input.timestamp,input.menuFlags))
      input.paintMenu(()=>schedule.menuPainted(input.timestamp));
    },
    drawEffects:()=>input.drawEffects(paintScene),
    drawPlacementOverlay:()=>input.drawPlacementOverlay(paintScene)
   });
   if(schedule.hud(input.timestamp,input.hudFlags))input.refreshHud();
  }
 };
}
