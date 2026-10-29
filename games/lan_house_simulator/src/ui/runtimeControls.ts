/** Delegated DOM actions and navigation. No simulation state, economy rules or frame timing. */
import type { GamePorts } from "../application/gamePorts.js";
import type { GameElements } from "./gameElements.js";
import { installGameLicensingControls } from "./gameLicensingControls.js";
import type { GamePanels } from "./gamePanels.js";
import { type HardwareTab } from "./hardwarePanel.js";
import { installNoticeControls } from "./noticeControls.js";
import type { PlacementController } from "./placementController.js";
import { iconMarkup } from "./presentation.js";
import { installPricingControls } from "./pricingControls.js";
import { installPs1Controls } from "./ps1Controls.js";
import { installRuntimeInteractionBindings } from "./runtimeInteractionBindings.js";
import type { RuntimeSessionController } from "./runtimeSessionController.js";
import type { RuntimeUiState } from "./runtimeUiState.js";
import { createServiceAccessInspectionCache } from "./serviceAccessInspectionCache.js";
import { installServiceControls } from "./serviceControls.js";
import { installShopControls } from "./shopControls.js";
import { installStationControls } from "./stationControls.js";
import { renderTimeWeatherPanel } from "./timeWeatherPanel.js";
export interface RuntimeControlsOptions {elements:GameElements;state:RuntimeUiState;ports:GamePorts;panels:GamePanels;placement:PlacementController;session:RuntimeSessionController;editor:{readonly active:boolean;open(onlyPartitions?:boolean):void;close():void};window:Window;inspection:ReturnType<typeof createServiceAccessInspectionCache<ReturnType<GamePorts["accessIssues"]>[number]>>}
export function installRuntimeControls(options:RuntimeControlsOptions):void{
 const {elements:e,state,ports,panels,placement,session,editor:layoutEditor,window:win}=options;
 const {document,canvas,shopCatalog,noticesList,maintenancePanel,gpuList,gpuPcChoice,licensePanel,gpuGamePanel,eraGamePanel}=e;
 const {noticeActions,ps1Actions}=ports;
 const renderUI=()=>panels.render(),save=()=>session.save(),stopPlacement=()=>placement.stop(),showMenu=()=>session.showMenu();
 const activateAdminTab=panels.activateAdminTab,managementPanels=panels.managementPanels,shopPanels=panels.shopPanels;
 const inspectServiceAccess=(force=false)=>options.inspection.inspect(force);
function button(id:string, handler:()=>void):void {
  const el=document.getElementById(id);
  if(el) el.addEventListener("click", () => {
    if(!(el instanceof HTMLButtonElement) || !el.disabled){
      
      handler();
    }
  });
}
button("open-notices",()=>{state.windows.noticesOpen=!state.windows.noticesOpen;if(state.windows.noticesOpen){state.windows.adminOpen=false;state.windows.shopOpen=false;noticeActions.review();}renderUI();save();});
button("close-notices",()=>{state.windows.noticesOpen=false;renderUI();});

installNoticeControls(noticesList,noticeActions,{
 onResult:result=>{ports.recordResult(result);renderUI();save();},
 onRead:()=>{renderUI();save();},
 navigate:destination=>{
  state.windows.noticesOpen=false;state.windows.adminOpen=true;
  if(destination==="windows"){activateAdminTab("licenses");managementPanels.select("licenses","windows");}
  else {activateAdminTab("services");managementPanels.select("services","network");}
  renderUI();
 }
});
button("open-admin",()=>{if(layoutEditor.active)layoutEditor.close();state.windows.adminOpen=!state.windows.adminOpen;if(state.windows.adminOpen){state.windows.noticesOpen=false;state.windows.shopOpen=false;state.placement.placingKind=null;state.placement.wallMode=null;state.placement.installingAnnexPc=false;state.placement.relocating=false;state.placement.relocationFrom=null;state.placement.hoveredPlacement=null;}renderUI();});
button("open-shop",()=>{if(layoutEditor.active)layoutEditor.close();state.windows.shopOpen=!state.windows.shopOpen;if(state.windows.shopOpen){state.windows.noticesOpen=false;state.windows.adminOpen=false;state.placement.placingKind=null;state.placement.wallMode=null;state.placement.installingAnnexPc=false;state.placement.relocating=false;state.placement.relocationFrom=null;state.placement.hoveredPlacement=null;}renderUI();});
button("close-shop",()=>{state.windows.shopOpen=false;renderUI();});
button("demolish-walls",()=>{
 if(!(ports.status().partitionsCount))return;
 layoutEditor.open(true);
});
button("rotate-furniture",()=>placement.rotate());
button("organize-furniture",()=>layoutEditor.open());

installShopControls(shopCatalog,ports.shopActions,{
 onPlacement:id=>placement.start(id),
 onPurchase:(result,id)=>{
  ports.recordResult(result);
  if(result.ok&&id==="ps1"&&(ports.status().ps1Count)===1){
   state.windows.shopOpen=false;state.windows.adminOpen=true;activateAdminTab("consoles");managementPanels.select("consoles","stations");
  }
  renderUI();save();
 }
});
button("close-admin",()=>{state.windows.adminOpen=false;renderUI();});
button("ps1-open-shop",()=>{
 state.windows.adminOpen=false;state.windows.shopOpen=true;shopPanels?.select("consoles");renderUI();
 (document.querySelector(".ps1-shop-heading")??document.getElementById("shop-catalog"))?.scrollIntoView({block:"start",behavior:"instant"});
});
installPs1Controls({
 stations:document.getElementById("ps1-stations"),
 shopCatalog
},ps1Actions,(result,policy)=>{
 ports.recordResult(result);renderUI();
 if(policy==="always"||result.ok)save();
});
installServiceControls(ports.serviceActions,{
 onResult:(result,policy)=>{
  ports.recordResult(result);
  renderUI();
  if(policy==="always"||result.ok)save();
 }
});
button("show-service-access",()=>{
 const issues=inspectServiceAccess(true);
 if(!issues.length)return;
 state.serviceAccessVisible=true;
 state.windows.adminOpen=false;renderUI();
 canvas.parentElement?.scrollIntoView({block:"nearest",behavior:"instant"});
});
button("hide-service-access",()=>{state.serviceAccessVisible=false;renderUI();});
installGameLicensingControls({
 eraGames:eraGamePanel,
 gpuGames:gpuGamePanel
},ports.gameLicensing,result=>{
 ports.recordResult(result);renderUI();save();
});
// Controles unificados em abas, sem criar novos painéis sobre o jogo.
// Motor e interface comunicam por uma porta tipada. Nunca guardar um GameState antigo.
installStationControls({
 maintenance:maintenancePanel,
 gpuCatalog:gpuList,
 gpuChoices:gpuPcChoice,
 windowsLicenses:licensePanel
},ports.stationActions,{
 selectedStation:()=>state.selection.selectedLcdPc,
 selectedGpu:()=>state.selection.selectedGpuPc,
 selectStation:index=>{state.selection.selectedLcdPc=index;state.selection.selectedGpuPc=index;renderUI();},
 selectGpu:index=>{state.selection.selectedGpuPc=index;state.selection.selectedLcdPc=index;renderUI();},
 selectHardwareTab:tab=>{state.selection.selectedHardwareTab=tab as HardwareTab;renderUI();},
 onResult:result=>{ports.recordResult(result);renderUI();save();}
});
installPricingControls(ports.pricingPort,{
 onResult:result=>{ports.recordResult(result);renderUI();save();},
 onMigration:()=>{renderUI();save();},
 confirmMigration:()=>win.confirm("Ativar o modelo histórico nesta partida? O preço da hora será limitado pelo ano e pelas máquinas, mas saldo, compras e resultados antigos não serão reescritos. Esta mudança não pode ser desfeita neste save."),
 openRetailCatalogue:()=>{activateAdminTab("stock");managementPanels.select("stock","catalog");renderUI();}
});
installRuntimeInteractionBindings(document,{
 playing:()=>state.isPlaying,
 editorOpen:()=>layoutEditor.active,
 closeEditor:()=>layoutEditor.close(),
 editingPlacement:()=>!!(state.placement.placingKind||state.placement.relocating||state.placement.wallMode||state.placement.installingAnnexPc),
 stopPlacement:()=>stopPlacement(),
 showMenu:()=>showMenu(),
 refreshTimeWeather:()=>renderTimeWeatherPanel(ports.timeWeather(),iconMarkup)
});

 button("placement-cancel",()=>placement.stop());button("confirm-wall",()=>placement.confirmWall());button("turn-wall",()=>placement.turnWall());
}
