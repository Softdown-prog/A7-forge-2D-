/** DOM-only menu controller. Engine, save and audio actions are injected. */
export type GameCampaignMode="classic"|"historical";
export interface MenuElements {
 startScreen:HTMLElement;gameApp:HTMLElement;
 continueButton:HTMLButtonElement;exportButton:HTMLButtonElement;
 settingsPanel:HTMLElement;soundToggle:HTMLInputElement;
 newButton:HTMLElement|null;resetButton:HTMLElement|null;
 optionsButton:HTMLElement|null;openMenuButton:HTMLElement|null;
 auxiliaryPanels:readonly (HTMLElement|null)[];
}
export interface MenuActions {
 hasSave():boolean;
 newCampaign(mode:GameCampaignMode):void;
 continueCampaign():void;
 leaveGame():void;
 setSound(enabled:boolean):void;
 confirm(message:string):boolean;
}
export function createMenuScreens(roots:MenuElements){
 return {
  showMenu(hasSave:boolean){
   roots.startScreen.hidden=false;roots.gameApp.hidden=true;
   roots.continueButton.disabled=!hasSave;roots.exportButton.disabled=!hasSave;
   for(const panel of roots.auxiliaryPanels)if(panel)panel.hidden=true;
  },
  showGame(){roots.startScreen.hidden=true;roots.gameApp.hidden=false;}
 };
}
export function installMenuControls(roots:MenuElements,actions:MenuActions):void{
 roots.newButton?.addEventListener("click",()=>{
  if(actions.hasSave()&&!actions.confirm("Criar uma nova partida e substituir o progresso salvo?"))return;
  actions.newCampaign("historical");
 });
 roots.resetButton?.addEventListener("click",()=>{
  if(actions.confirm("Recomeçar o sonho da lan house? O progresso salvo será apagado."))
   actions.newCampaign("classic");
 });
 roots.continueButton.addEventListener("click",()=>{if(actions.hasSave())actions.continueCampaign();});
 roots.optionsButton?.addEventListener("click",()=>{
  roots.settingsPanel.hidden=!roots.settingsPanel.hidden;
  roots.optionsButton?.setAttribute("aria-expanded",String(!roots.settingsPanel.hidden));
 });
 roots.soundToggle.addEventListener("change",()=>actions.setSound(roots.soundToggle.checked));
 roots.openMenuButton?.addEventListener("click",actions.leaveGame);
}
