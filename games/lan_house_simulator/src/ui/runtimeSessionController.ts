/** Menu, save notifications and browser lifecycle; the application owns campaign replacement. */
import type { RuntimeSessionPort } from "../application/gameApplication.js";
import type { GameElements } from "./gameElements.js";
import { createMenuScreens,installMenuControls,type GameCampaignMode } from "./gameMenuControls.js";
import { installPageSaveLifecycle } from "./pageSaveLifecycle.js";
import { syncWindowChrome } from "./presentation.js";
import type { RuntimeUiState } from "./runtimeUiState.js";
import { resetPlacementUi } from "./runtimeUiState.js";
import { installSaveFileControls } from "./saveFileControls.js";
export interface RuntimeSessionOptions {
 elements:GameElements;state:RuntimeUiState;port:RuntimeSessionPort;window:Window;
 editor:{readonly active:boolean;close():void;reset():void};renderUI():void;resetScene():void;stopKeyboard():void;setSound(enabled:boolean):void;
}
export function createRuntimeSessionController(options:RuntimeSessionOptions){
 const {elements:e,state,port,editor,renderUI,resetScene,stopKeyboard}=options,document=e.document;
 const menuElements={startScreen:e.startScreen,gameApp:e.gameApp,continueButton:e.continueButton,exportButton:e.exportButton,settingsPanel:e.settingsPanel,soundToggle:e.soundToggle,
  newButton:document.getElementById("menu-new"),resetButton:document.getElementById("reset-game"),optionsButton:document.getElementById("menu-options"),openMenuButton:document.getElementById("open-menu"),auxiliaryPanels:["admin","shop","notices"].map(id=>document.getElementById(id))};
 const menuScreens=createMenuScreens(menuElements);
 let autosaveFailed=false;
 const announceSave=(message:string)=>{e.saveMessage.textContent=message;};
 e.continueButton.disabled=!state.hasSavedGame;e.exportButton.disabled=!state.hasSavedGame;
 if(port.startup.source==="backup")announceSave("Save principal danificado: cópia local anterior recuperada. Exporte o JSON para maior segurança.");
 else if(port.startup.invalidPrimary)announceSave("O save local está inválido e não há cópia recuperável. O arquivo danificado não foi apagado.");
 function save():void{
  if(!state.isPlaying)return;
  try{port.persist();state.hasSavedGame=true;e.exportButton.disabled=false;
   if(e.autosaveState)e.autosaveState.textContent="Salvo neste navegador";
   e.autosaveIndicator?.removeAttribute("data-state");
   if(autosaveFailed)announceSave("Salvamento automático restabelecido neste navegador.");autosaveFailed=false;
  }catch{autosaveFailed=true;if(e.autosaveState)e.autosaveState.textContent="Falha ao salvar — exporte sua partida";
   e.autosaveIndicator?.setAttribute("data-state","error");announceSave("Falha ao salvar no navegador. Exporte a partida em JSON para evitar perda de progresso.");}
 }
 function showMenu():void{
  // Save before leaving play, including between the eight-second checkpoints.
  if(state.isPlaying)save();if(editor.active)editor.close();resetScene();stopKeyboard();
  state.isPlaying=false;menuScreens.showMenu(state.hasSavedGame);
  Object.assign(state.windows,{adminOpen:false,shopOpen:false,noticesOpen:false});resetPlacementUi(state);syncWindowChrome();
 }
 function beginPlay():void{resetScene();port.beginPlay();state.isPlaying=true;menuScreens.showGame();renderUI();}
 function newPlayerCampaign(mode:GameCampaignMode):void{
  try{port.newCampaign(mode);}catch{announceSave(mode==="historical"?"Não foi possível gravar uma nova partida. A anterior foi preservada.":"Falha ao salvar reinício. Progresso anterior preservado.");return;}
  if(mode==="historical"){e.exportButton.disabled=false;beginPlay();}else renderUI();
 }
 port.onReplaced(reason=>{
  state.hasSavedGame=true;editor.reset();resetScene();stopKeyboard();resetPlacementUi(state);
  Object.assign(state.selection,{selectedGpuPc:0,selectedLcdPc:0,selectedHardwareTab:"platform",selectedPs1PlacementId:null});
  e.continueButton.disabled=false;e.exportButton.disabled=false;
  if(reason==="cloud")announceSave("Partida da nuvem restaurada. Clique em Continuar.");
 });
 installSaveFileControls({importFile:e.importFile,importButton:document.getElementById("save-import"),exportButton:e.exportButton,
  canExport:()=>state.hasSavedGame,exportSnapshot:()=>port.exportSnapshot(),notify:announceSave,
  importText:async json=>{
   const restore=port.prepareImport(json);
   if(!options.window.confirm("Importar esta partida? O progresso salvo neste navegador será substituído."))return;
   restore();announceSave("Partida importada com sucesso. Clique em Continuar.");
  }
 });
 installMenuControls(menuElements,{hasSave:()=>state.hasSavedGame,newCampaign:newPlayerCampaign,continueCampaign:beginPlay,leaveGame:showMenu,
  confirm:message=>options.window.confirm(message),setSound:options.setSound});
 installPageSaveLifecycle({win:options.window,doc:document,every:(callback,ms)=>options.window.setInterval(callback,ms),save});
 return {save,showMenu,beginPlay,newPlayerCampaign};
}
export type RuntimeSessionController=ReturnType<typeof createRuntimeSessionController>;
