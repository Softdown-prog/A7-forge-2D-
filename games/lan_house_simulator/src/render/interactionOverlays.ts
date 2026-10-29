/** Visual-only overlay orchestration for the isometric salon.
 * The early editor highlight must be painted before the popups; purchase and
 * placement previews are painted after them. Neither phase changes the game.
 */
import type {SceneRenderer} from "./scene.js";
import type {GameState} from "../sim/types.js";
import type {EditableObject} from "../sim/editableObjects.js";
import type {FurnitureKind} from "../sim/shop.js";
import type {WallSegment} from "../sim/walls.js";

export interface LayoutOverlayOptions{
 readonly visible:boolean;
 readonly active:boolean;
 readonly selected:string|null;
 readonly draft:EditableObject|null;
}
export function drawLayoutEditorOverlay(
 renderer:Pick<SceneRenderer,"drawLayoutOverlay">,
 state:GameState,
 elapsed:number,
 view:LayoutOverlayOptions
):void{
 if(view.visible&&view.active)
  renderer.drawLayoutOverlay(state,view.selected,view.draft,elapsed);
}
export interface PlacementOverlayOptions{
 readonly visible:boolean;
 readonly editWall:WallSegment|null;
 readonly placingKind:FurnitureKind|null;
 readonly hoveredPlacement:string|null;
 readonly purchaseRotation:0|1|2|3;
 readonly relocating:boolean;
 readonly relocationFrom:string|null;
 readonly wallMode:"build"|"door"|"remove"|null;
 readonly pendingWall:WallSegment|null;
 readonly hoveredWall:WallSegment|null;
 readonly installingAnnexPc:boolean;
 readonly hoveredAnnexPc:string|null;
}
export function drawPlacementInteractionOverlays(
 renderer:Pick<SceneRenderer,
  "drawWallPreview"|"drawPlacementCandidates"|"drawRelocationCandidates"|"drawDoorCandidates"|"drawAnnexPcCandidates">,
 state:GameState,
 view:PlacementOverlayOptions
):void{
 if(!view.visible)return;
 if(view.editWall)renderer.drawWallPreview(state,view.editWall,true);
 if(view.placingKind)renderer.drawPlacementCandidates(state,view.placingKind,view.hoveredPlacement,view.purchaseRotation);
 if(view.relocating)renderer.drawRelocationCandidates(state,view.relocationFrom,view.hoveredPlacement);
 if(view.wallMode){
  const wall=view.pendingWall??view.hoveredWall;
  if(view.wallMode==="door")renderer.drawDoorCandidates(state,wall);
  else renderer.drawWallPreview(state,wall,view.wallMode==="remove");
 }
 if(view.installingAnnexPc)renderer.drawAnnexPcCandidates(state,view.hoveredAnnexPc);
}
