/** Composition root. Domain rules, DOM presentation, Canvas and lifecycle live in their own adapters. */
import { createGameApplication } from "../application/gameApplication.js";
import { createLcdPreviewSample } from "../application/lcdPreviewSamplePort.js";
import { Soundscape } from "../audio/soundscape.js";
import { createGameScene } from "../render/gameScene.js";
import { cameraForGame } from "../render/isometric.js";
import { drawLcdPreviewArtwork } from "../render/lcdPreviewArtwork.js";
import { createScenePicker } from "../render/scenePicking.js";
import { mountCloudControls } from "../ui/cloudControls.js";
import { locateGameElements } from "../ui/gameElements.js";
import { createGamePanels } from "../ui/gamePanels.js";
import { installGameViewport } from "../ui/gameViewport.js";
import { createLayoutEditor } from "../ui/layoutEditor.js";
import { createLcdPreviewCache } from "../ui/lcdPreviewCache.js";
import { createPlacementController } from "../ui/placementController.js";
import { decorateControls,installWindowNavigation } from "../ui/presentation.js";
import { installRuntimeControls } from "../ui/runtimeControls.js";
import { createRuntimeLoop } from "../ui/runtimeLoop.js";
import { createRuntimeSessionController } from "../ui/runtimeSessionController.js";
import { createRuntimeUiState } from "../ui/runtimeUiState.js";
import { createServiceAccessInspectionCache } from "../ui/serviceAccessInspectionCache.js";
import { installSoundInputBindings } from "../ui/soundInputBindings.js";
import { createSoundPreferencePort } from "../ui/soundPreferencePort.js";
import { browserMailSeed,browserSaveStore } from "./browserServices.js";
export function bootstrapGame(document:Document=globalThis.document,win:Window=window){
 const elements=locateGameElements(document),store=browserSaveStore(()=>win.localStorage);
 const preference=createSoundPreferencePort({get:store.getItem,set:store.setItem});
 const enabled=preference.read(),soundscape=new Soundscape(enabled);elements.soundToggle.checked=enabled;
 installSoundInputBindings(document,soundscape);
 const application=createGameApplication({store,mailSeed:browserMailSeed,audio:soundscape,cameraForState:cameraForGame});
 const state=createRuntimeUiState(application.session.startup.source!=="none");
 const scene=createGameScene(elements.canvas,elements.menuCanvas,application.renderSource,application.frame.popupQueues);
 const lcdPreview=createLcdPreviewCache(document,createLcdPreviewSample,drawLcdPreviewArtwork);
 const inspection=createServiceAccessInspectionCache(application.ports.accessIssues,()=>performance.now());
 // These closures are installed as event handlers; none run until composition is complete.
 const renderUI=(liveOnly=false)=>panels.render(liveOnly),save=()=>session.save();
 const editor=createLayoutEditor(elements.canvas,application.ports.layoutEditorPort,()=>{
  placement.stop();Object.assign(state.windows,{shopOpen:false,adminOpen:false,noticesOpen:false});soundscape.stopKeyboard();renderUI();
 },()=>{save();renderUI();});
 installGameViewport(elements.canvas);
 const panels=createGamePanels({elements,state,ports:application.ports,save,lcdPreview,inspection});
 const session=createRuntimeSessionController({elements,state,port:application.session,window:win,editor,renderUI,resetScene:()=>{scene.resetMotion();inspection.invalidate();},stopKeyboard:()=>soundscape.stopKeyboard(),setSound:value=>preference.update(value,soundscape)});
 const picker=createScenePicker(elements.canvas,application.ports.placementActions,scene.camera,()=>state.placement,()=>win.matchMedia("(pointer:coarse)").matches);
 const placement=createPlacementController({canvas:elements.canvas,state,ports:application.ports,picker,hitOwner:scene.hitOwner,renderUI,save,stopKeyboard:()=>soundscape.stopKeyboard(),click:()=>soundscape.click()});
 installRuntimeControls({elements,state,ports:application.ports,panels,placement,session,editor,window:win,inspection});
 mountCloudControls(elements.saveMessage,application.account);
 const loop=createRuntimeLoop({document,window:win,canvas:elements.canvas,state,framePort:application.frame,scene,editor,inspection,renderUI});
 decorateControls();installWindowNavigation();session.showMenu();loop.start();
 return {stop:()=>loop.stop()};
}
