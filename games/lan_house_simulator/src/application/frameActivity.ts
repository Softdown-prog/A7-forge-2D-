/** Pure eligibility for advancing LHS time and capturing motion in an animation frame. */
export interface FrameActivityInput{
 readonly playing:boolean;
 readonly accountOpen:boolean;
 readonly beforeCampaignEnd:boolean;
 readonly editingLayout:boolean;
 readonly placingFurniture:boolean;
 readonly relocatingFurniture:boolean;
 readonly editingWalls:boolean;
 readonly installingAnnexPc:boolean;
}
export interface FrameActivity{
 /** May advance simulated minutes, including the last frame that finalizes a campaign. */
 readonly advanceSimulation:boolean;
 /** May capture interpolated movements before simulation advances. */
 readonly captureMotion:boolean;
}
export function frameActivitySnapshot(input:FrameActivityInput):FrameActivity{
 const advanceSimulation=input.playing&&!input.accountOpen&&!input.editingLayout&&
  !input.placingFurniture&&!input.relocatingFurniture&&!input.editingWalls&&!input.installingAnnexPc;
 return {
  advanceSimulation,
  // Preserve the historical end-of-campaign distinction: finalization may run
  // even after no more movement should be interpolated.
  captureMotion:advanceSimulation&&input.beforeCampaignEnd
 };
}
