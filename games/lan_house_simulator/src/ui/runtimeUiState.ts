/** All visual selections are session-local and never serialized as GameState. */
import type { FurnitureKind,WallSegment } from "../application/contracts.js";
import type { HardwareTab } from "../application/hardwarePanelPort.js";
export interface PlacementUiState {
 placingKind:FurnitureKind|null;wallMode:"build"|"remove"|"door"|null;
 installingAnnexPc:boolean;hoveredAnnexPc:string|null;hoveredWall:WallSegment|null;
 relocating:boolean;relocationFrom:string|null;hoveredPlacement:string|null;
 placementNotice:string;purchaseRotation:0|1|2|3;pendingWall:WallSegment|null;
}
export interface RuntimeUiState {
 isPlaying:boolean;hasSavedGame:boolean;
 windows:{adminOpen:boolean;shopOpen:boolean;noticesOpen:boolean;activeAdminTab:string};
 selection:{selectedGpuPc:number;selectedLcdPc:number;selectedHardwareTab:HardwareTab;selectedPs1PlacementId:string|null};
 placement:PlacementUiState;serviceAccessVisible:boolean;
}
export function createRuntimeUiState(hasSavedGame=false):RuntimeUiState{
 return {isPlaying:false,hasSavedGame,windows:{adminOpen:false,shopOpen:false,noticesOpen:false,activeAdminTab:"prices"},
  selection:{selectedGpuPc:0,selectedLcdPc:0,selectedHardwareTab:"platform",selectedPs1PlacementId:null},
  placement:{placingKind:null,wallMode:null,installingAnnexPc:false,hoveredAnnexPc:null,hoveredWall:null,relocating:false,relocationFrom:null,hoveredPlacement:null,placementNotice:"",purchaseRotation:0,pendingWall:null},serviceAccessVisible:false};
}
export function resetPlacementUi(state:RuntimeUiState):void{
 Object.assign(state.placement,{placingKind:null,wallMode:null,installingAnnexPc:false,hoveredAnnexPc:null,hoveredWall:null,relocating:false,relocationFrom:null,hoveredPlacement:null,placementNotice:"",pendingWall:null});
}
