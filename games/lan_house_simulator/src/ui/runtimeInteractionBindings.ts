/** Browser-only runtime interactions. All stateful game/menu actions are injected.
 * Keeps keyboard precedence and immediate time-weather refresh on expansion.
 */
export interface RuntimeInteractionActions {
 playing():boolean;
 editorOpen():boolean;
 closeEditor():void;
 editingPlacement():boolean;
 stopPlacement():void;
 showMenu():void;
 refreshTimeWeather():void;
}
export function installRuntimeInteractionBindings(
 doc:Pick<Document,"getElementById"|"addEventListener">,
 actions:RuntimeInteractionActions
):void {
 // Refresh on opening, not on closing; preserve the second live DOM lookup.
 doc.getElementById("time-weather-panel")?.addEventListener("toggle",()=>{
  const panel=doc.getElementById("time-weather-panel");
  if(panel?.hasAttribute("open"))actions.refreshTimeWeather();
 });
 doc.addEventListener("keydown",e=>{
  if(e.key!=="Escape"||!actions.playing())return;
  if(actions.editorOpen())actions.closeEditor();
  else if(actions.editingPlacement())actions.stopPlacement();
  else actions.showMenu();
 });
}
