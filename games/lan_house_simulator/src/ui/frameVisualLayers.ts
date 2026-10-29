/** Presentation-only layers of a single animation frame.
 * Retains the original scene/editor/menu/effects/placement draw order.
 * All game state, Canvas instances, time gates and mutations remain with the caller.
 */
export interface FrameVisualLayers {
 readonly sceneVisible:boolean;
 readonly accessVisible:boolean;
 readonly drawScene:()=>void;
 readonly drawAccessOverlay:()=>void;
 readonly drawEditorOverlay:()=>void;
 readonly drawMenuPreview:()=>void;
 readonly drawEffects:()=>void;
 readonly drawPlacementOverlay:()=>void;
}
/** The editor and placement indicators must still paint when the world is paused. */
export function renderFrameVisualLayers(layers:FrameVisualLayers):void {
 if(layers.sceneVisible)layers.drawScene();
 if(layers.sceneVisible&&layers.accessVisible)layers.drawAccessOverlay();
 layers.drawEditorOverlay();
 layers.drawMenuPreview();
 layers.drawEffects();
 layers.drawPlacementOverlay();
}
