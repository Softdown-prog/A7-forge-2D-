import {installMerchandisePanel} from "./ui/merchandisePanel.js";
import {createMerchandisePort} from "./application/merchandisePort.js";
import {createPricingPort} from "./application/pricingPort.js";
import {createServiceActionsPort} from "./application/serviceActionsPort.js";
import {createGameLicensingPort} from "./application/gameLicensingPort.js";
import {installGameLicensingControls} from "./ui/gameLicensingControls.js";
import {createPs1ActionsPort} from "./application/ps1ActionsPort.js";
import {createPs1AdminPort} from "./application/ps1AdminPort.js";
import {createPs1ShopDiscPort} from "./application/ps1ShopDiscPort.js";
import {createPs1ShopPlacementPort} from "./application/ps1ShopPlacementPort.js";
import {createPs1ShopOfferPort} from "./application/ps1ShopOfferPort.js";
import {renderPs1ShopOfferButton} from "./ui/ps1ShopOfferButton.js";
import {createShopServiceOffersPort} from "./application/shopServiceOffersPort.js";
import {createShopOverviewPort} from "./application/shopOverviewPort.js";
import {renderShopOverview} from "./ui/shopOverviewPanel.js";
import {renderAdminPricingSections} from "./ui/adminPricingSections.js";
import {renderAdminFinanceSummary,renderAdminFinanceActivity} from "./ui/adminFinanceSections.js";
import {createVisibleAdminTextWriter,formatAdminMoney,renderAdminWindowVisibility,renderShopWindowVisibility,renderAdminDisclosure} from "./ui/adminShell.js";
import {createShopCatalogOffersPort} from "./application/shopCatalogOffersPort.js";
import {renderShopCatalogOfferButton} from "./ui/shopCatalogOfferButton.js";
import {createShopCatalogCard,appendStandardShopCatalogCard,appendShopCatalogOwned} from "./ui/shopCatalogCard.js";
import {renderShopServiceOffer} from "./ui/shopServiceOfferButton.js";
import {renderPs1ShopPlacement} from "./ui/ps1ShopPlacementPicker.js";
import {renderPs1ShopDiscCatalog} from "./ui/ps1ShopDiscCatalog.js";
import {createGpuDownloadMetersPort} from "./application/gpuDownloadMetersPort.js";
import {createWindowsLicensePort} from "./application/windowsLicensePort.js";
import {renderAdminServicesConsoles} from "./ui/adminServicesConsoles.js";
import {createShopActionsPort} from "./application/shopActionsPort.js";
import {installShopControls} from "./ui/shopControls.js";
import {createNoticeActionsPort} from "./application/noticeActionsPort.js";
import {installNoticeControls} from "./ui/noticeControls.js";
import {installPs1Controls} from "./ui/ps1Controls.js";
import {installServiceControls} from "./ui/serviceControls.js";
import {createStationActionsPort} from "./application/stationActionsPort.js";
import {installStationControls} from "./ui/stationControls.js";
import {installPricingControls} from "./ui/pricingControls.js";
import {timeWeatherSnapshot} from "./application/timeWeatherSnapshot.js";
import {liveStatusSnapshot,computerOperationsSnapshot} from "./application/presentationModels.js";
import {mountCloudControls} from "./ui/cloudControls.js";
import {renderTimeWeatherPanel} from "./ui/timeWeatherPanel.js";
import {createDeskPricingPort} from "./application/deskPricingPort.js";
import {createCommerceNetworkPort} from "./application/commerceNetworkPort.js";
import {renderCommerceNetworkPanel} from "./ui/commerceNetworkPanel.js";
import {renderDeskServicePanels} from "./ui/deskPricingPanel.js";
import {ps1StationPoint} from "./sim/ps1.js";
import {installGameViewport} from "./ui/gameViewport.js";
import {createLayoutEditor} from "./ui/layoutEditor.js";
import {createLayoutEditorPort} from "./application/layoutEditorPort.js";
import {createPlacementActionsPort} from "./application/placementActionsPort.js";
import {placementStatusSnapshot} from "./application/placementStatusPort.js";
import {renderPlacementStatus} from "./ui/placementStatusPanel.js";
import {editableObjects} from "./sim/editableObjects.js";
import {createGameSessionPort} from "./application/gameSessionPort.js";
import {installSaveFileControls} from "./ui/saveFileControls.js";
import {createMenuScreens,installMenuControls,type GameCampaignMode} from "./ui/gameMenuControls.js";
import {createFrameSchedule} from "./application/frameSchedule.js";
import {installFrameInteractionTracker} from "./ui/frameInteractionTracker.js";
import {frameActivitySnapshot} from "./application/frameActivity.js";
import {createPanelRevisionCache} from "./application/panelRevisionCache.js";
import {createFrameFeedbackPort} from "./application/frameFeedbackPort.js";
import {dispatchFrameEvents} from "./application/frameEventDispatch.js";
import {SHOP_CATALOG,type FurnitureKind,type PlacementSlot} from "./sim/shop.js";
import {WALL_COST,type WallSegment} from "./sim/walls.js";
import {ANNEX_PC_COST,type AnnexComputerSlot} from "./sim/stations.js";
import { createGame, displayTime, online, pcCount, stepGame, isValidSave, applyResult } from "./sim/engine.js";
import {createFinancialBalancePort} from "./application/financialBalancePort.js";
import {createFinancialAdminOverviewPort} from "./application/financialAdminOverviewPort.js";
import {createStaffStatusPort} from "./application/staffStatusPort.js";
import {createMonthlyFinancePort} from "./application/monthlyFinancePort.js";
import {createStationLedgerPort} from "./application/stationLedgerPort.js";
import {renderStationLedgerRows} from "./ui/stationLedgerPanel.js";
import {createPricingInsightsPort} from "./application/pricingInsightsPort.js";
import {yearFromMinutes,clampPriceToEra} from "./sim/historicalEconomy.js";
import {createHourlyPriceStatusPort} from "./application/hourlyPriceStatusPort.js";
import {createRetailPriceStatusPort} from "./application/retailPriceStatusPort.js";
import { DAY_MINUTES, type GameState } from "./sim/types.js";
import {GAME_LAST_MINUTE} from "./sim/mailCalendar.js";
import { SceneRenderer } from "./render/scene.js";
import {drawLayoutEditorOverlay,drawPlacementInteractionOverlays} from "./render/interactionOverlays.js";
import {SceneMotion} from "./render/motion.js";
import {renderFrameVisualLayers} from "./ui/frameVisualLayers.js";
import {createPromotionStatusPort} from "./application/promotionStatusPort.js";
import { cameraForGame, iso } from "./render/isometric.js";
import { roomWidth,pcPosition } from "./sim/engine.js";
import {computerSeat} from "./sim/route.js";
import {iconMarkup,decorateControls,presentLiveState,presentComputerOperations,syncWindowChrome,installWindowNavigation} from "./ui/presentation.js";
import {installShopPanels,shopCategory} from "./ui/shopPanels.js";
import {installManagementPanels} from "./ui/managementPanels.js";
import {installFridayMeetupPanel} from "./ui/fridayMeetupPanel.js";
import {installNightTournamentHud} from "./ui/nightTournamentHud.js";
import {customerFeedbackSnapshot} from "./application/customerFeedbackSnapshot.js";
import {syncPanelChildren} from "./ui/panelChildren.js";
import { Soundscape } from "./audio/soundscape.js";
import {consumeNewMail,mailBaseline} from "./audio/mailNotification.js";
import {createNoticeWindowStatusPort} from "./application/noticeWindowStatusPort.js";
import {renderNoticeWindowStatus} from "./ui/noticeWindowStatusPanel.js";
import {createNoticeInboxPort} from "./application/noticeInboxPort.js";
import {renderNoticeInbox} from "./ui/noticeInboxPanel.js";
import {gameYear,INTERNET_ERAS} from "./sim/era.js";
import {createGpuCatalogPort} from "./application/gpuCatalogPort.js";
import {createGpuGamesCatalogPort} from "./application/gpuGamesCatalogPort.js";
import {createBasicGamesLicenseStatusPort} from "./application/basicGamesLicenseStatusPort.js";
import {createClassicGamesCatalogPort} from "./application/classicGamesCatalogPort.js";
import {createEventLogPort} from "./application/eventLogPort.js";
import {renderEventLog} from "./ui/eventLogPanel.js";
import {pcUnderRepair} from "./sim/services.js";
import {createPcOperationsPort} from "./application/pcOperationsPort.js";
import {renderPcOperations} from "./ui/pcOperationsPanel.js";
import {renderAdminComputerSections} from "./ui/adminComputerSections.js";
import {renderAdminGpuLicenseSections} from "./ui/adminGpuLicenseSections.js";
import {serviceAccessIssues,type ServiceAccessIssue} from "./sim/serviceAccess.js";
import {serviceAccessStatusSnapshot} from "./application/serviceAccessStatusPort.js";
import {renderServiceAccessOverlayStatus} from "./ui/serviceAccessStatusPanel.js";
import {stationOccupied,type LcdId} from "./sim/computerModels.js";
import {createLcdMonitorsPort} from "./application/lcdMonitorsPort.js";
import {renderLcdMonitorsPanel} from "./ui/lcdMonitorsPanel.js";
import {drawRetroComputer} from "./render/retroComputer.js";
import {renderHardwarePanel,type HardwareTab} from "./ui/hardwarePanel.js";

// Catalog illustrations use the same station renderer as the playable scene.
// Generate once per model; live admin refreshes reuse these images.
const lcdPreviews=new Map<LcdId,string>();
function lcdPreview(id:LcdId):string{
 const cached=lcdPreviews.get(id);if(cached)return cached;
 const surface=document.createElement("canvas");surface.width=320;surface.height=190;
 const context=surface.getContext("2d");if(!context)return "";
 const sample=createGame();sample.pcTiers=[3,3,3];sample.pcLcdModels=[id,null,null];
 context.fillStyle="#dce5cf";context.fillRect(0,0,320,190);
 drawRetroComputer(context,{originX:150,originY:118,zoom:1.25},{x:0,y:0},0,0,true,sample,false);
 const url=surface.toDataURL();lcdPreviews.set(id,url);return url;
}

const canvas = document.querySelector<HTMLCanvasElement>("#game");
const admin = document.querySelector<HTMLElement>("#admin");
const shop=document.querySelector<HTMLElement>("#shop");
const shopCatalog=document.querySelector<HTMLElement>("#shop-catalog");
const events = document.querySelector<HTMLElement>("#events");
const status = document.querySelector<HTMLElement>("#status");
const controls = document.querySelector<HTMLElement>("#open-admin");
if (!canvas || !admin || !events || !status || !controls) throw new Error("DOM do jogo incompleto");
const view = canvas.getContext("2d");
if (!view) throw new Error("Canvas 2D indisponível");
const renderer = new SceneRenderer(view);
const sceneMotion=new SceneMotion();
const menuCanvas=document.querySelector<HTMLCanvasElement>("#menu-scene"),menuView=menuCanvas?.getContext("2d");
const menuRenderer=menuView?new SceneRenderer(menuView):null;
// Presentation-only preview: the player's save is never simulated by the menu.
const menuPreview=createGame(98);
menuPreview.customers=[0,1].map(i=>{
 const seat=computerSeat(pcPosition(i,menuPreview));
 return {id:i+1,x:seat.x,y:seat.y,target:seat,route:[],stage:"using",costume:"regular",pcIndex:i,
  facing:"north",usedMinutes:0,waitingMinutes:0,offlineWait:0,happy:true};
});
// A arte do menu é ornamental: um erro no Canvas nunca pode bloquear
// os botões de continuar, abrir partida, exportar ou acessar as configurações.
let menuPreviewAvailable=true;
try{menuRenderer?.draw(menuPreview,0);}catch{menuPreviewAvailable=false;}

/** O correio ganha um sorteio novo por partida; o RNG da simulação continua independente. */
const sessionPort=createGameSessionPort({
 getItem:key=>localStorage.getItem(key),
 setItem:(key,value)=>localStorage.setItem(key,value),
 removeItem:key=>localStorage.removeItem(key)
},()=>game);
/** Mail schedule is unique per new game. The sim RNG remains independent. */
function newGameForPlayer(seed=72421,mode:"classic"|"historical"="historical"):GameState{
 const mailSeed=typeof crypto!=="undefined"&&typeof crypto.getRandomValues==="function"
  ?crypto.getRandomValues(new Uint32Array(1))[0]??(seed>>>0)
  :(Date.now()^Math.floor(Math.random()*0x100000000))>>>0;
 return sessionPort.newGame(seed,mode,mailSeed);
}
const startupSave=sessionPort.startup();
let game=startupSave.state??newGameForPlayer(72421,"historical");
let knownMailIds=mailBaseline(game.notices);
function resetMailAudioBaseline():void{knownMailIds=mailBaseline(game.notices);}
const startScreen=document.querySelector<HTMLElement>("#start-screen");
const gameApp=document.querySelector<HTMLElement>("#game-app");
const continueButton=document.querySelector<HTMLButtonElement>("#menu-continue");
const settingsPanel=document.querySelector<HTMLElement>("#menu-settings");
const soundToggle=document.querySelector<HTMLInputElement>("#option-sound");
if(!startScreen||!gameApp||!continueButton||!settingsPanel||!soundToggle)throw new Error("Menu inicial incompleto");
let isPlaying=false;
let hasSavedGame=startupSave.source!=="none";
let soundEnabled=true;
try{soundEnabled=localStorage.getItem("lhs.sound")!=="off";}catch{}
soundToggle.checked=soundEnabled;
const soundscape=new Soundscape(soundEnabled);
soundscape.preload();
// Reuse a single mixer for dynamic controls and keyboard activation alike.
document.addEventListener("pointerdown",()=>soundscape.unlock(),{capture:true});
document.addEventListener("keydown",e=>{
 if(e.key==="Enter"||e.key===" ")soundscape.unlock();
},{capture:true});
document.addEventListener("click",event=>{
 const target=event.target;
 if(!(target instanceof Element))return;
 const control=target.closest("button");
 if(control instanceof HTMLButtonElement&&!control.disabled)soundscape.click();
},{capture:true});
document.addEventListener("visibilitychange",()=>{
 if(document.hidden)soundscape.stopKeyboard();
});
continueButton.disabled=!hasSavedGame;
const importFile=document.querySelector<HTMLInputElement>("#save-import-file");
const saveMessage=document.querySelector<HTMLElement>("#save-message");
const exportButton=document.querySelector<HTMLButtonElement>("#save-export");
if(!importFile||!saveMessage||!exportButton)throw Error("Controles de save ausentes");
const autosaveState=document.querySelector<HTMLElement>("#autosave-state");
const autosaveIndicator=document.querySelector<HTMLElement>(".hud-autosave");
let autosaveFailed=false;
exportButton.disabled=!hasSavedGame;
function announceSave(message:string):void{saveMessage!.textContent=message;}
if(startupSave.source==="backup")announceSave("Save principal danificado: cópia local anterior recuperada. Exporte o JSON para maior segurança.");
else if(startupSave.invalidPrimary)announceSave("O save local está inválido e não há cópia recuperável. O arquivo danificado não foi apagado.");
installSaveFileControls({
 importFile,
 importButton:document.getElementById("save-import"),
 exportButton,
 canExport:()=>hasSavedGame,
 exportSnapshot:()=>sessionPort.exportSnapshot(),
 notify:announceSave,
 importText:async json=>{
  const state=sessionPort.parseImport(json);
  if(!window.confirm("Importar esta partida? O progresso salvo neste navegador será substituído."))return;
  // Persist before showing the new save; failure keeps the current campaign.
  sessionPort.replace(state);
  game=state;hasSavedGame=true;resetMailAudioBaseline();game.keyboardEffects?.splice(0);
  soundscape.stopKeyboard();
  previousServed=game.served;previousPurchases=game.purchases;
  paymentPopups.length=0;salePopups.length=0;speechPopups.length=0;
  continueButton!.disabled=false;exportButton!.disabled=false;
  announceSave("Partida importada com sucesso. Clique em Continuar.");
 }
});
mountCloudControls(saveMessage,()=>game,(state)=>{
 sessionPort.replace(state);
 game=state;hasSavedGame=true;resetMailAudioBaseline();game.keyboardEffects?.splice(0);sceneMotion.reset();soundscape.stopKeyboard();
 previousServed=game.served;previousPurchases=game.purchases;
 paymentPopups.length=0;salePopups.length=0;speechPopups.length=0;
 continueButton!.disabled=false;exportButton!.disabled=false;
 announceSave("Partida da nuvem restaurada. Clique em Continuar.");
});
const menuElements={
 startScreen,gameApp,continueButton,exportButton,settingsPanel,soundToggle,
 newButton:document.getElementById("menu-new"),resetButton:document.getElementById("reset-game"),
 optionsButton:document.getElementById("menu-options"),openMenuButton:document.getElementById("open-menu"),
 auxiliaryPanels:["admin","shop","notices"].map(id=>document.getElementById(id))
};
const menuScreens=createMenuScreens(menuElements);
function showMenu():void{
 // Salvar ANTES de isPlaying=false, inclusive se o jogador sair entre os ciclos de 8s.
 if(isPlaying)save();
 if(layoutEditor.active)layoutEditor.close();
 sceneMotion.reset();
 soundscape.stopKeyboard();
 isPlaying=false;menuScreens.showMenu(hasSavedGame);
 adminOpen=false;shopOpen=false;noticesOpen=false;placingKind=null;wallMode=null;hoveredWall=null;installingAnnexPc=false;hoveredAnnexPc=null;relocating=false;relocationFrom=null;hoveredPlacement=null;
 syncWindowChrome();
}
function beginPlay():void{
 sceneMotion.reset();
 game.keyboardEffects?.splice(0); // Do not replay events restored from a save.
 resetMailAudioBaseline(); // Existing saved mail never replays.
 isPlaying=true;menuScreens.showGame();
 renderUI();
}
function newPlayerCampaign(mode:GameCampaignMode):void{
 const fresh=newGameForPlayer(72421,mode);
 try{sessionPort.replace(fresh);}
 catch{
  announceSave(mode==="historical"?"Não foi possível gravar uma nova partida. A anterior foi preservada.":
   "Falha ao salvar reinício. Progresso anterior preservado.");
  return;
 }
 game=fresh;resetMailAudioBaseline();hasSavedGame=true;
 previousServed=0;previousPurchases=0;
 paymentPopups.length=0;salePopups.length=0;speechPopups.length=0;
 if(mode==="historical"){exportButton!.disabled=false;beginPlay();}
 else renderUI();
}
installMenuControls(menuElements,{
 hasSave:()=>hasSavedGame,
 newCampaign:newPlayerCampaign,
 continueCampaign:beginPlay,
 leaveGame:showMenu,
 confirm:message=>window.confirm(message),
 setSound:enabled=>{
  soundEnabled=enabled;soundscape.setEnabled(enabled);
  try{localStorage.setItem("lhs.sound",enabled?"on":"off");}catch{}
 }
});
// Populate the expanded view immediately on touch or keyboard, rather than
// waiting for the next throttled HUD refresh.
document.getElementById("time-weather-panel")?.addEventListener("toggle",()=>{
 const panel=document.getElementById("time-weather-panel");
 if(panel?.hasAttribute("open"))renderTimeWeatherPanel(timeWeatherSnapshot(game),iconMarkup);
});
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&isPlaying){if(layoutEditor.active)layoutEditor.close();else if(placingKind||relocating||wallMode||installingAnnexPc)stopPlacement();else showMenu();}});
let shopOpen=false;
let placingKind:FurnitureKind|null=null;
let wallMode:"build"|"remove"|"door"|null=null;
let installingAnnexPc=false;
let hoveredAnnexPc:string|null=null;
let hoveredWall:WallSegment|null=null;
let relocating=false;
let relocationFrom:string|null=null;
let hoveredPlacement:string|null=null;
let placementNotice="";
let purchaseRotation:0|1|2|3=0;
let selectedPs1PlacementId:string|null=null; // escolha estável entre atualizações do painel
let pendingWall:WallSegment|null=null;
const layoutEditorPort=createLayoutEditorPort(()=>game,cameraForGame);
const placementActions=createPlacementActionsPort(()=>game);
const layoutEditor=createLayoutEditor(canvas,layoutEditorPort,()=>{stopPlacement();shopOpen=false;adminOpen=false;noticesOpen=false;soundscape.stopKeyboard();renderUI();},()=>{save();renderUI();});
installGameViewport(canvas);

let adminOpen = false;
let noticesOpen=false;
let activeAdminTab="prices";
// Diagnóstico visual transitório: nunca entra no GameState nem no save.
let serviceAccessVisible=false,serviceAccessAt=-10000;
let serviceAccessCache:ServiceAccessIssue[]=[];
function inspectServiceAccess(force=false):readonly ServiceAccessIssue[]{
 const now=performance.now();
 if(force||now-serviceAccessAt>1600){
  serviceAccessCache=serviceAccessIssues(game);
  serviceAccessAt=now;
 }
 return serviceAccessCache;
}
let previousServed = game.served;
let previousPurchases = game.purchases;
let lastEventSignature="";
// Playback is handled by the shared Soundscape. No repeated HTMLAudioElements.
const paymentPopups:Array<{amount:number;x:number;y:number;age:number}>=[];
const salePopups:Array<{amount:number;x:number;y:number;age:number}>=[];
const speechPopups:Array<{text:string;x:number;y:number;kind:"complaint"|"praise";age:number}>=[];
const frameFeedback=createFrameFeedbackPort(()=>game,soundscape,{
 payments:paymentPopups,sales:salePopups,speech:speechPopups
});
function paintPayments(dt:number,visible=true):void {
  const camera=cameraForGame(game);
  for(let i=paymentPopups.length-1;i>=0;i--){
    const effect=paymentPopups[i]!;
    effect.age+=dt;
    if(effect.age>=1.35){paymentPopups.splice(i,1);continue;}
    if(!visible)continue;
    const at=iso({x:effect.x,y:effect.y},camera,94);
    const alpha=Math.min(1,(1.35-effect.age)/0.4);
    view!.save();view!.globalAlpha=alpha;
    view!.textAlign="center";view!.lineWidth=3.2;
    view!.font="bold 20px system-ui,sans-serif";
    const label="+R$ "+effect.amount;
    const height=effect.age*43;
    view!.strokeStyle="#103622";view!.fillStyle="#70F0A6";
    view!.strokeText(label,at.x,at.y-height);
    view!.fillText(label,at.x,at.y-height);
    view!.restore();
  }
}

function paintSales(dt:number,visible=true):void {
 const camera=cameraForGame(game);
 for(let i=salePopups.length-1;i>=0;i--){
  const effect=salePopups[i]!;
  effect.age+=dt;
  if(effect.age>=1.35){salePopups.splice(i,1);continue;}
  if(!visible)continue;
  const at=iso({x:effect.x,y:effect.y},camera,110);
  view!.save();
  view!.globalAlpha=Math.min(1,(1.35-effect.age)/0.4);
  view!.textAlign="center";view!.lineWidth=3;
  view!.font="bold 17px system-ui,sans-serif";
  view!.strokeStyle="#103622";view!.fillStyle="#70F0A6";
  const label="+R$ "+effect.amount,y=at.y-effect.age*38;
  view!.strokeText(label,at.x,y);view!.fillText(label,at.x,y);
  view!.restore();
 }
}

function paintSpeech(dt:number,visible=true):void {
 const camera=cameraForGame(game);
 for(let i=speechPopups.length-1;i>=0;i--){
  const b=speechPopups[i]!;
  b.age+=dt;if(b.age>=2.6){speechPopups.splice(i,1);continue;}
  if(!visible)continue;
  const p=iso({x:b.x,y:b.y},camera,146);
  const alpha=Math.min(1,(2.6-b.age)/0.4);
  view!.save();view!.globalAlpha=alpha;view!.font="bold 13px system-ui,sans-serif";
  const width=Math.min(190,view!.measureText(b.text).width+20);
  const x=p.x-width/2,y=p.y-b.age*12-25;
  view!.fillStyle=b.kind==="praise"?"#e3f9e9":"#fff2df";
  view!.strokeStyle=b.kind==="praise"?"#227348":"#9c5238";
  view!.lineWidth=2;
  view!.beginPath();view!.roundRect(x,y,width,27,8);view!.fill();view!.stroke();
  view!.fillStyle="#26302c";view!.textAlign="center";
  view!.fillText(b.text,p.x,y+18,width-12);
  view!.restore();
 }
}
const internetNames = INTERNET_ERAS.map(x=>x.name);
function internetName(): string { return internetNames[game.internetTier-1] ?? "Desconhecida"; }
function save(): void {
  if(!isPlaying)return;
  try {
    sessionPort.persist();hasSavedGame=true;exportButton!.disabled=false;
    if(autosaveState)autosaveState.textContent="Salvo neste navegador";
    autosaveIndicator?.removeAttribute("data-state");
    if(autosaveFailed)announceSave("Salvamento automático restabelecido neste navegador.");
    autosaveFailed=false;
  }catch{
    autosaveFailed=true;
    if(autosaveState)autosaveState.textContent="Falha ao salvar — exporte sua partida";
    autosaveIndicator?.setAttribute("data-state","error");
    announceSave("Falha ao salvar no navegador. Exporte a partida em JSON para evitar perda de progresso.");
  }
}
function button(id:string, handler:()=>void):void {
  const el=document.getElementById(id);
  if(el) el.addEventListener("click", () => {
    if(!(el instanceof HTMLButtonElement) || !el.disabled){
      
      handler();
    }
  });
}
button("open-notices",()=>{noticesOpen=!noticesOpen;if(noticesOpen){adminOpen=false;shopOpen=false;noticeActions.review();}renderUI();save();});
button("close-notices",()=>{noticesOpen=false;renderUI();});
const noticesList=document.querySelector<HTMLElement>("#notices-list");
const noticeActions=createNoticeActionsPort(()=>game);
installNoticeControls(noticesList,noticeActions,{
 onResult:result=>{applyResult(game,result);renderUI();save();},
 onRead:()=>{renderUI();save();},
 navigate:destination=>{
  noticesOpen=false;adminOpen=true;
  if(destination==="windows"){activateAdminTab("licenses");managementPanels.select("licenses","windows");}
  else {activateAdminTab("services");managementPanels.select("services","network");}
  renderUI();
 }
});
button("open-admin",()=>{if(layoutEditor.active)layoutEditor.close();adminOpen=!adminOpen;if(adminOpen){noticesOpen=false;shopOpen=false;placingKind=null;wallMode=null;installingAnnexPc=false;relocating=false;relocationFrom=null;hoveredPlacement=null;}renderUI();});
button("open-shop",()=>{if(layoutEditor.active)layoutEditor.close();shopOpen=!shopOpen;if(shopOpen){noticesOpen=false;adminOpen=false;placingKind=null;wallMode=null;installingAnnexPc=false;relocating=false;relocationFrom=null;hoveredPlacement=null;}renderUI();});
button("close-shop",()=>{shopOpen=false;renderUI();});
button("demolish-walls",()=>{
 if(!((game.interiorWalls?.length??0)+(game.interiorDoors?.length??0)))return;
 layoutEditor.open(true);
});
button("rotate-furniture",()=>{
 if(placingKind&&placingKind!=="poster"){purchaseRotation=((purchaseRotation+1)%4) as 0|1|2|3;renderUI();return;}
 if(!relocating||!relocationFrom)return;
 const result=placementActions.rotate(relocationFrom);
 applyResult(game,result);renderUI();
 if(result.ok)save();
});
button("organize-furniture",()=>layoutEditor.open());

const ps1Actions=createPs1ActionsPort(()=>game);
const ps1AdminPort=createPs1AdminPort(()=>game);
const ps1ShopDiscPort=createPs1ShopDiscPort(()=>game);
const ps1ShopPlacementPort=createPs1ShopPlacementPort(()=>game);
const ps1ShopOfferPort=createPs1ShopOfferPort(()=>game);
const shopServiceOffersPort=createShopServiceOffersPort(()=>game);
const shopCatalogOffersPort=createShopCatalogOffersPort(()=>game,()=>placementActions.availableAnnex().length);
const shopOverviewPort=createShopOverviewPort(()=>game,()=>layoutEditorPort.objects().length,()=>placementActions.annexSlots().length);
installShopControls(shopCatalog,createShopActionsPort(()=>game),{
 onPlacement:id=>{
  if(id==="computer-annex"){
   installingAnnexPc=true;wallMode=null;placingKind=null;relocating=false;hoveredAnnexPc=null;placementNotice="";
  }else if(id==="wall"||id==="door"){
   wallMode=id==="door"?"door":"build";installingAnnexPc=false;placingKind=null;relocating=false;hoveredWall=null;pendingWall=null;placementNotice="";
  }else{
   placingKind=id;purchaseRotation=0;hoveredPlacement=null;placementNotice="";soundscape.stopKeyboard();
  }
  shopOpen=false;adminOpen=false;renderUI();
  canvas.parentElement?.scrollIntoView({block:"nearest",behavior:"instant"});
 },
 onPurchase:(result,id)=>{
  applyResult(game,result);
  if(result.ok&&id==="ps1"&&(game.ps1Stations?.length??0)===1){
   shopOpen=false;adminOpen=true;activateAdminTab("consoles");managementPanels.select("consoles","stations");
  }
  renderUI();save();
 }
});
button("close-admin",()=>{adminOpen=false;renderUI();});
button("ps1-open-shop",()=>{
 adminOpen=false;shopOpen=true;shopPanels?.select("consoles");renderUI();
 (document.querySelector(".ps1-shop-heading")??document.getElementById("shop-catalog"))?.scrollIntoView({block:"start",behavior:"instant"});
});
installPs1Controls({
 stations:document.getElementById("ps1-stations"),
 shopCatalog
},ps1Actions,(result,policy)=>{
 applyResult(game,result);renderUI();
 if(policy==="always"||result.ok)save();
});
installServiceControls(createServiceActionsPort(()=>game),{
 onResult:(result,policy)=>{
  applyResult(game,result);
  renderUI();
  if(policy==="always"||result.ok)save();
 }
});
button("show-service-access",()=>{
 const issues=inspectServiceAccess(true);
 if(!issues.length)return;
 serviceAccessVisible=true;
 adminOpen=false;renderUI();
 canvas.parentElement?.scrollIntoView({block:"nearest",behavior:"instant"});
});
button("hide-service-access",()=>{serviceAccessVisible=false;renderUI();});
let selectedGpuPc=0;
const gpuList=document.getElementById("gpu-catalog"),gpuPcChoice=document.getElementById("gpu-pc-choice");
const licensePanel=document.getElementById("windows-license-list");
const gpuGamePanel=document.getElementById("gpu-game-catalog");
const eraGamePanel=document.getElementById("era-game-catalog");
installGameLicensingControls({
 eraGames:eraGamePanel,
 gpuGames:gpuGamePanel
},createGameLicensingPort(()=>game),result=>{
 applyResult(game,result);renderUI();save();
});
// Controles unificados em abas, sem criar novos painéis sobre o jogo.
const maintenancePanel=document.querySelector<HTMLElement>("#pc-maintenance");
let selectedLcdPc=0;
let selectedHardwareTab:HardwareTab="platform";
if(!maintenancePanel)throw new Error("Manutenção ausente no painel");
// Motor e interface comunicam por uma porta tipada. Nunca guardar um GameState antigo.
installStationControls({
 maintenance:maintenancePanel,
 gpuCatalog:gpuList,
 gpuChoices:gpuPcChoice,
 windowsLicenses:licensePanel
},createStationActionsPort(()=>game),{
 selectedStation:()=>selectedLcdPc,
 selectedGpu:()=>selectedGpuPc,
 selectStation:index=>{selectedLcdPc=index;selectedGpuPc=index;renderUI();},
 selectGpu:index=>{selectedGpuPc=index;selectedLcdPc=index;renderUI();},
 selectHardwareTab:tab=>{selectedHardwareTab=tab as HardwareTab;renderUI();},
 onResult:result=>{applyResult(game,result);renderUI();save();}
});
const shopPanels=shop?installShopPanels(shop,()=>renderUI()):null;
const nightTournamentHud=installNightTournamentHud();
const fridayMeetupPanel=installFridayMeetupPanel(admin,()=>game,
 result=>{applyResult(game,result);renderUI();save();});
const managementPanels=installManagementPanels(admin,()=>renderUI(),()=>yearFromMinutes(game.totalMinutes));
const tabs=Array.from(admin.querySelectorAll<HTMLButtonElement>("[data-admin-tab]"));
const adminSections=Array.from(admin.querySelectorAll<HTMLElement>("[data-section]"));
function activateAdminTab(tab:string):void{
 activeAdminTab=tab;
 managementPanels.syncArea(tab);
 for(const button of tabs){const active=button.dataset.adminTab===tab;button.classList.toggle("active",active);button.setAttribute("aria-selected",String(active));button.tabIndex=active?0:-1;}
 for(const section of adminSections)section.hidden=section.dataset.section!==tab;
}
for(const tab of tabs)tab.addEventListener("click",()=>{activateAdminTab(tab.dataset.adminTab??"prices");admin.scrollTop=0;renderUI();});
const merchandisePanel=installMerchandisePanel(createMerchandisePort(()=>game),r=>{applyResult(game,r);renderUI();save();});
installPricingControls(createPricingPort(()=>game),{
 onResult:result=>{applyResult(game,result);renderUI();save();},
 onMigration:()=>{renderUI();save();},
 confirmMigration:()=>window.confirm("Ativar o modelo histórico nesta partida? O preço da hora será limitado pelo ano e pelas máquinas, mas saldo, compras e resultados antigos não serão reescritos. Esta mudança não pode ser desfeita neste save."),
 openRetailCatalogue:()=>{activateAdminTab("stock");managementPanels.select("stock","catalog");renderUI();}
});
 // These stable DOM roots are still used by the panel renderer for reconciliation.
const retailControls=document.getElementById("retail-price-controls");
const discControls=document.getElementById("disc-copy-price-controls");
const printControls=document.getElementById("print-price-controls");
activateAdminTab(activeAdminTab);
const placementToolbar=document.getElementById("placement-toolbar");
const placementHelp=document.getElementById("placement-help");
const stage=canvas.closest<HTMLElement>(".stage");
const placementNames:Record<FurnitureKind,string>={poster:"pôster",plant:"planta",table:"mesinha"};
function stopPlacement():void{
 placingKind=null;relocating=false;relocationFrom=null;hoveredPlacement=null;wallMode=null;hoveredWall=null;pendingWall=null;installingAnnexPc=false;hoveredAnnexPc=null;placementNotice="";renderUI();
}
document.getElementById("placement-cancel")?.addEventListener("click",stopPlacement);
document.getElementById("confirm-wall")?.addEventListener("click",()=>{
 if(!pendingWall||!wallMode)return;const wall=pendingWall;
 const result=placementActions.confirmWall(wallMode,wall);
 placementNotice=result.message;if(result.ok){applyResult(game,result);save();pendingWall=null;}renderUI();
});
document.getElementById("turn-wall")?.addEventListener("click",()=>{if(pendingWall){pendingWall={...pendingWall,axis:pendingWall.axis==="x"?"y":"x"};hoveredWall=pendingWall;renderUI();}});

function getCanvasPoint(e:MouseEvent|PointerEvent):{x:number;y:number}{
 const element=canvas!;
 const bounds=element.getBoundingClientRect();
 return {x:(e.clientX-bounds.left)/bounds.width*element.width,
         y:(e.clientY-bounds.top)/bounds.height*element.height};
}
function pickWall(x:number,y:number):WallSegment|null{
 const camera=cameraForGame(game),available=wallMode?placementActions.walls(wallMode):[];
 let nearest:WallSegment|null=null,best=Infinity;
 for(const segment of available){
   const [a,b]=placementActions.endpoints(segment);
   for(const height of (wallMode==="build"?[0]:[0,38,76])){
     const pa=iso(a,camera,height),pb=iso(b,camera,height);
     const dx=pb.x-pa.x,dy=pb.y-pa.y,scale=Math.max(1,dx*dx+dy*dy);
     const t=Math.max(0,Math.min(1,((x-pa.x)*dx+(y-pa.y)*dy)/scale));
     const d=Math.hypot(x-pa.x-t*dx,y-pa.y-t*dy);
     if(d<best){best=d;nearest=segment;}
   }
 }
 return best<=Math.max(12,22*canvas!.width/canvas!.getBoundingClientRect().width)?nearest:null;
}
function pickAnnexPc(x:number,y:number):AnnexComputerSlot|null{
 const camera=cameraForGame(game);let nearest:AnnexComputerSlot|null=null,best=Infinity;
 for(const slot of placementActions.annexSlots()){
  const p=iso({x:slot.position.x+0.35,y:slot.position.y+0.55},camera,4);
  const d=Math.hypot(x-p.x,y-p.y);
  if(d<best){best=d;nearest=slot;}
 }
 return best<Math.max(22,33*camera.zoom)?nearest:null;
}
function pickFurnitureSlot(x:number,y:number):PlacementSlot|null{
 if(!placingKind&&!relocating)return null;
 const moving=placementActions.furniture().find(p=>p.slotId===relocationFrom);
 const surface=placingKind?(placingKind==="poster"?"wall":"floor"):moving?(moving.kind==="poster"?"wall":"floor"):null;
 const camera=cameraForGame(game);
 let nearest:PlacementSlot|null=null,distance=Infinity;
 for(const slot of placementActions.slots()){
  if(surface&&slot.surface!==surface)continue;
  if(relocating&&!moving&&!placementActions.furniture().some(p=>p.slotId===slot.id))continue;
  const at=slot.surface==="wall"?iso({x:slot.x+(slot.axis==="y"?0:.33),y:slot.y+(slot.axis==="y"?.33:0)},camera,137):
      iso({x:slot.x+0.25,y:slot.y+0.20},camera,9);
  const dist=Math.hypot(x-at.x,y-at.y);
  if(dist<distance){distance=dist;nearest=slot;}
 }
 // O zoom CSS do visor reduz a área tocável real. Usar um raio em
 // pixels de tela para que os encaixes sejam selecionáveis no celular.
 const rect=canvas!.getBoundingClientRect();
 const cssPixels=canvas!.width/Math.max(1,rect.width);
 const coarse=window.matchMedia("(pointer:coarse)").matches;
 return distance<=Math.max((coarse?48:23)*cssPixels,38*camera.zoom)?nearest:null;
}
canvas.addEventListener("pointermove",e=>{
 if(!placingKind&&!relocating&&!wallMode&&!installingAnnexPc)return;
 const at=getCanvasPoint(e);
 if(installingAnnexPc){hoveredAnnexPc=pickAnnexPc(at.x,at.y)?.id??null;return;}
 if(wallMode){hoveredWall=pickWall(at.x,at.y);return;}
 hoveredPlacement=pickFurnitureSlot(at.x,at.y)?.id??null;
});
canvas.addEventListener("pointerleave",()=>{hoveredPlacement=null;hoveredWall=null;hoveredAnnexPc=null;});
canvas.addEventListener("click",e=>{
  const {x,y}=getCanvasPoint(e);
  if(relocating||placingKind||wallMode||installingAnnexPc)soundscape.click();
  if(installingAnnexPc){
    const slot=pickAnnexPc(x,y),result=slot?placementActions.installAnnex(slot.id):
      {ok:false,message:"Escolha um espaço sinalizado para o PC no anexo."};
    placementNotice=result.message;
    if(result.ok){applyResult(game,result);stopPlacement();save();}
    else renderUI();
    return;
  }
  if(wallMode){
    const wall=pickWall(x,y);
    if(!wall){placementNotice="Toque em uma das linhas do chão para escolher o trecho da divisória.";renderUI();return;}
    pendingWall=wall;hoveredWall=wall;placementNotice="Segmento selecionado. Confira a prévia e toque em Confirmar segmento.";
    renderUI();return;
  }
  if(relocating){
    const slot=pickFurnitureSlot(x,y);
    if(!slot){placementNotice="Escolha um móvel ou uma posição sinalizada.";renderUI();return;}
    const owned=placementActions.furniture().find(p=>p.slotId===slot.id);
    if(!relocationFrom){
      if(!owned){placementNotice="Selecione primeiro o móvel que deseja mover.";renderUI();return;}
      relocationFrom=slot.id;placementNotice="Agora escolha um destino verde para "+placementNames[owned.kind]+".";
      renderUI();return;
    }
    if(slot.id===relocationFrom){relocationFrom=null;placementNotice="Selecione outro móvel para reorganizar.";renderUI();return;}
    if(owned){
      relocationFrom=slot.id;placementNotice="Selecionado: "+placementNames[owned.kind]+". Escolha um destino verde.";
      renderUI();return;
    }
    const result=placementActions.move(relocationFrom,slot.id);
    if(result.ok){applyResult(game,result);stopPlacement();save();}
    else{placementNotice=result.message;renderUI();}
    return;
  }
  if(placingKind){
    const kind=placingKind,slot=pickFurnitureSlot(x,y);
    if(!slot){placementNotice="Clique em uma das posições sinalizadas.";renderUI();return;}
    const result=placementActions.place(kind,slot.id,purchaseRotation);
    if(result.ok){applyResult(game,result);stopPlacement();save();}
    else{placementNotice=result.message;renderUI();}
    return;
  }
  if(renderer.hitOwner(x,y)){soundscape.click();adminOpen=!adminOpen;if(adminOpen)shopOpen=false;renderUI();}
});
const panelChanged=createPanelRevisionCache();
function renderShop(force=true):void{
 if(!shopOpen)return;
 if(!shopCatalog)return;
 if(!panelChanged("shop",[shopPanels?.current(),game.cash,game.discCopier,game.printer,game.ps1Stations,game.ps1Discs,gameYear(game),game.expansionLevel,game.installedPcs,game.annexPcs,game.roomExtensions,game.furniture,game.furniturePlacements,game.objectPlacements,game.removedBuiltPosters,game.interiorWalls,game.interiorDoors],force))return;
 renderShopOverview(shopOverviewPort.snapshot(),document);
 shopCatalog.replaceChildren();
 for(const item of SHOP_CATALOG){
  if(shopCategory(item.id)!==shopPanels?.current())continue;
  const fields=createShopCatalogCard(item,document);
  const {card,art,category,title,description,button}=fields;
  const offer=shopCatalogOffersPort.snapshot(item.id);
  const placementHint=offer.placementHint;
  renderShopCatalogOfferButton(button,offer);
  if(item.id==="printer"||item.id==="disc-copier"){
   renderShopServiceOffer(button,shopServiceOffersPort.snapshot(item.id));
  }
  if(item.id==="ps1"){
    renderPs1ShopOfferButton(button,ps1ShopOfferPort.snapshot());
    renderPs1ShopPlacement(card,{art,category,title,description,button},
      ps1ShopPlacementPort.snapshot(),selectedPs1PlacementId,id=>{selectedPs1PlacementId=id;},document);
  }else{
   appendStandardShopCatalogCard(fields,placementHint,document);
  }
  if(offer.ownedText!==null)appendShopCatalogOwned(card,offer.ownedText,document);
  shopCatalog.append(card);
 }
 renderPs1ShopDiscCatalog(shopCatalog,ps1ShopDiscPort,shopPanels?.current()==="consoles",document);

}
const gpuDownloadMetersPort=createGpuDownloadMetersPort(()=>game);
const windowsLicensePort=createWindowsLicensePort(()=>game);
const stationLedgerPort=createStationLedgerPort(()=>game);
const monthlyFinancePort=createMonthlyFinancePort(()=>game);
const promotionStatusPort=createPromotionStatusPort(()=>game);
const financialBalancePort=createFinancialBalancePort(()=>game);
const financialAdminOverviewPort=createFinancialAdminOverviewPort(()=>game);
const staffStatusPort=createStaffStatusPort(()=>game);
const pricingInsightsPort=createPricingInsightsPort(()=>game);
const hourlyPriceStatusPort=createHourlyPriceStatusPort(()=>game);
const retailPriceStatusPort=createRetailPriceStatusPort(()=>game);
const deskPricingPort=createDeskPricingPort(()=>game);
const commerceNetworkPort=createCommerceNetworkPort(()=>game);
const pcOperationsPort=createPcOperationsPort(()=>game);
const lcdMonitorsPort=createLcdMonitorsPort(()=>game);
const gpuCatalogPort=createGpuCatalogPort(()=>game);
const classicGamesCatalogPort=createClassicGamesCatalogPort(()=>game);
const gpuGamesCatalogPort=createGpuGamesCatalogPort(()=>game);
const basicGamesLicenseStatusPort=createBasicGamesLicenseStatusPort(()=>game);
const noticeInboxPort=createNoticeInboxPort(()=>game);
const noticeWindowStatusPort=createNoticeWindowStatusPort(()=>game);
const eventLogPort=createEventLogPort(()=>game);
function renderUI(liveOnly=false):void {
  nightTournamentHud.render(game);
  if(adminOpen&&activeAdminTab==="finance"&&managementPanels.active("finance","events"))
   fridayMeetupPanel.render();
  // TypeScript não propaga a checagem inicial de nulidade para callbacks posteriores.
  if (!status || !admin || !events || !controls) return;
  renderAdminWindowVisibility(admin,adminOpen);
  renderNoticeWindowStatus(noticeWindowStatusPort.snapshot(noticesOpen),document);
  if(noticesList&&noticesOpen&&panelChanged("notices",[game.cash,game.notices,game.contentFilterInstalled,game.pcWindowsLicenses,game.licensedGames,game.electricalDeadlineDay,game.electricalInspectionFineApplied],!liveOnly)){
    renderNoticeInbox(noticesList,noticeInboxPort.snapshot(),document,iconMarkup);
  }
  const moving=placementActions.furniture().find(p=>p.slotId===relocationFrom);
  const placementStatus=placementStatusSnapshot({
   placingKind,placingName:placingKind?placementNames[placingKind]:null,
   relocating,relocationFrom,selectedFurnitureKind:moving?.kind??null,
   wallMode,hasPendingWall:!!pendingWall,
   canBuildPendingWall:wallMode==="build"&&!!pendingWall&&placementActions.canBuild(pendingWall),
   installingAnnexPc,notice:placementNotice,wallCost:WALL_COST,annexPcCost:ANNEX_PC_COST
  });
  renderPlacementStatus(placementStatus,{toolbar:placementToolbar,stage,help:placementHelp},document);
  renderShopWindowVisibility(shop,shopOpen,document);
  renderShop(!liveOnly);
  activateAdminTab(activeAdminTab);
  if(adminOpen)managementPanels.syncUnlocks();
  renderTimeWeatherPanel(timeWeatherSnapshot(game),iconMarkup);
  const year=gameYear(game);
  const setText=createVisibleAdminTextWriter(document);
  if(adminOpen){
  const stationRevision=[year,game.cash,game.economyVersion,game.pcTiers,game.pcWindows,game.pcWindowsLicenses,game.pcPoweredOff,game.pcGpus,game.pcLcdModels,game.pcComponents,Array.from({length:pcCount(game)},(_,i)=>stationOccupied(game,i)),game.repairJobs?.map(j=>[j.pc,j.phase,Math.floor(j.progress/j.duration*4)])];
  const money=formatAdminMoney;
  const historical=game.economyVersion===2;
  const financialAdminOverview=financialAdminOverviewPort.snapshot();
  renderAdminFinanceSummary({
   overview:financialAdminOverview,balance:financialBalancePort,
   financeTab:activeAdminTab==="finance",
   pageActive:page=>managementPanels.active("finance",page),
   feedbackChanged:()=>panelChanged("customerFeedback",
    [Math.floor(game.totalMinutes/720),game.customerFeedback],!liveOnly),
   feedback:()=>customerFeedbackSnapshot(game),
   setText,doc:document
  });
  // Compatibilidade: saves de épocas anteriores podem ter valores antigos.
  clampPriceToEra(game);
  const hourlyPriceStatus=hourlyPriceStatusPort.snapshot();
  renderAdminPricingSections({
   hourly:hourlyPriceStatus,
   insights:pricingInsightsPort,retail:retailPriceStatusPort,
   pricingTab:activeAdminTab==="prices",
   active:page=>managementPanels.active("prices",page),
   packagesChanged:()=>panelChanged("durations",[game.pricePerHour,historical],!liveOnly),
   retailChanged:()=>panelChanged("retail",[game.retailPrices],!liveOnly),
   retailControls,setText,iconMarkup,doc:document,sync:syncPanelChildren
  });
  renderDeskServicePanels(deskPricingPort,{
   pricingTab:activeAdminTab==="prices",
   isActive:page=>managementPanels.active("prices",page),
   discControls,printControls,setText,iconMarkup,doc:document,sync:syncPanelChildren
  });
  if(adminOpen&&activeAdminTab==="stock")merchandisePanel.render();
  renderCommerceNetworkPanel(commerceNetworkPort.snapshot(),setText,document);
  setText("pc",pcOperationsPort.summary());
  renderAdminComputerSections({
   adminOpen,computersTab:activeAdminTab==="computers",
   ledgerActive:()=>managementPanels.active("computers","ledger"),
   currentPage:()=>managementPanels.current("computers"),
   maintenanceChanged:()=>panelChanged("computers",[managementPanels.current("computers"),selectedLcdPc,selectedHardwareTab,stationRevision,managementPanels.active("computers","operations")?game.pcWear?.map(Math.round):null],!liveOnly),
   selectedStation:()=>selectedLcdPc,
   clampSelectedStation:()=>{selectedLcdPc=Math.min(selectedLcdPc,pcCount(game)-1);},
   renderLedger:host=>renderStationLedgerRows(host,stationLedgerPort),
   renderOperations:host=>renderPcOperations(host,pcOperationsPort.rows(),document),
   renderHardware:(host,page)=>host.append(renderHardwarePanel(game,selectedLcdPc,year,selectedHardwareTab,page)),
   renderMonitors:host=>renderLcdMonitorsPanel(host,lcdMonitorsPort.snapshot(selectedLcdPc),lcdPreview,document),
   renderComputerSummary:host=>presentComputerOperations(computerOperationsSnapshot(game),host),
   decorate:decorateControls,reconcile:syncPanelChildren,doc:document
  });
  renderAdminGpuLicenseSections({
   adminOpen,gpuTab:activeAdminTab==="gpus",licensesTab:activeAdminTab==="licenses",
   gpuPcChoice,gpuList,licensePanel,eraGamePanel,gpuGamePanel,
   gpuChanged:()=>panelChanged("gpuPcChoice",[stationRevision,selectedGpuPc],!liveOnly),
   selectedGpuIndex:()=>{selectedGpuPc=Math.min(selectedGpuPc,pcCount(game)-1);return selectedGpuPc;},
   licensePageActive:page=>managementPanels.active("licenses",page),
   windowsChanged:()=>panelChanged("licensePanel",[stationRevision],!liveOnly),
   classicChanged:()=>panelChanged("eraGamePanel",[year,stationRevision,game.licensedGames,game.licensedEraGames,game.ericSecondMailDelivered],!liveOnly),
   gpuGamesChanged:()=>panelChanged("gpuGamePanel",[year,stationRevision,game.licensedGames,game.licensedGpuGames,game.pcPoweredOff,game.gpuGameInstalls,game.gpuGameInstallJobs?.map(j=>[j.pc,j.id,j.durationMinutes]),game.gpuGameDemand,online(game)],!liveOnly),
   gpuCatalog:gpuCatalogPort,basicGames:basicGamesLicenseStatusPort,
   windows:windowsLicensePort,classic:classicGamesCatalogPort,
   gpuGames:gpuGamesCatalogPort,downloads:gpuDownloadMetersPort,
   setText,doc:document,sync:syncPanelChildren
  });
  renderAdminServicesConsoles({
   consolesTab:activeAdminTab==="consoles",
   servicesTab:activeAdminTab==="services",
   showPs1Stations:()=>adminOpen&&managementPanels.active("consoles","stations"),
   showServiceAccess:()=>adminOpen&&managementPanels.active("services","access"),
   accessSnapshot:()=>serviceAccessStatusSnapshot(inspectServiceAccess(!liveOnly)),
   ps1:ps1AdminPort,staff:staffStatusPort,setText,money,doc:document
  });
  renderAdminFinanceActivity({
   overview:financialAdminOverview,monthly:monthlyFinancePort,promotion:promotionStatusPort,
   financeTab:activeAdminTab==="finance",setText,doc:document
  });
  }
  // Independente do painel administrativo: as marcações continuam visíveis
  // depois de fechar Administração para inspecionar o salão no Canvas.
  renderServiceAccessOverlayStatus(serviceAccessStatusSnapshot(serviceAccessCache),serviceAccessVisible,setText,document);
  const eventHistory=eventLogPort.snapshot();
  if(eventHistory.signature!==lastEventSignature){
   renderEventLog(events,eventHistory,document,iconMarkup);
   lastEventSignature=eventHistory.signature;
  }
  renderAdminDisclosure(controls,adminOpen);
  presentLiveState(liveStatusSnapshot(game,internetName()),adminOpen?activeAdminTab:null);
}
const frameSchedule=createFrameSchedule();
let sceneVisible=true;
new IntersectionObserver(entries=>{sceneVisible=entries[0]?.isIntersecting??false;}).observe(canvas);
const frameInteraction=installFrameInteractionTracker(document,window,()=>performance.now());
let wasSimulating=false;
const coarsePointer=window.matchMedia("(pointer:coarse)");
const reduceMotion=window.matchMedia("(prefers-reduced-motion: reduce)");
function frame(timestamp:number):void {
  const {dt,elapsed}=frameSchedule.begin(timestamp);
  const accountOpen=document.getElementById("player-account")?.hasAttribute("open")===true;
  const {captureMotion:simulating,advanceSimulation}=frameActivitySnapshot({
   playing:isPlaying,accountOpen,beforeCampaignEnd:game.totalMinutes<GAME_LAST_MINUTE,
   editingLayout:layoutEditor.active,placingFurniture:!!placingKind,
   relocatingFurniture:relocating,editingWalls:!!wallMode,installingAnnexPc
  });
  if(wasSimulating!==simulating){sceneMotion.reset();wasSimulating=simulating;}
  if(simulating&&game.leftoverMinutes+dt*4.0>=1)sceneMotion.capture(game);
  if(advanceSimulation)stepGame(game,dt*4.0);
  // Detect new mail after advancing the simulation; effect ordering is now in application.
  dispatchFrameEvents({
   playing:isPlaying,
   countNewMail:()=>consumeNewMail(knownMailIds,game.notices),
   isDocumentHidden:()=>document.hidden,
   notifyMail:()=>soundscape.mail(),
   feedback:frameFeedback,
   updateServed:()=>{if(game.served>previousServed)previousServed=game.served;},
   updatePurchases:()=>{if(game.purchases>previousPurchases)previousPurchases=game.purchases;}
  });
  const paintScene=frameSchedule.scene(timestamp,{
   playing:isPlaying,accountOpen,visible:sceneVisible,hidden:document.hidden,
   adminOpen,shopOpen,noticesOpen,coarse:coarsePointer.matches
  });
  renderFrameVisualLayers({
   sceneVisible:paintScene,accessVisible:serviceAccessVisible,
   drawScene:()=>renderer.draw(sceneMotion.sample(game),elapsed),
   drawAccessOverlay:()=>renderer.drawServiceAccessOverlay(game,inspectServiceAccess(),elapsed),
   drawEditorOverlay:()=>drawLayoutEditorOverlay(renderer,game,elapsed,{
    visible:paintScene,active:layoutEditor.active,selected:layoutEditor.selected,draft:layoutEditor.draft
   }),
   drawMenuPreview:()=>{
    if(frameSchedule.menu(timestamp,{
     playing:isPlaying,accountOpen,hasRenderer:!!menuRenderer,
     previewAvailable:menuPreviewAvailable,
     hidden:document.hidden,reduceMotion:reduceMotion.matches
    })&&menuRenderer){
     try{menuRenderer.draw(menuPreview,elapsed);frameSchedule.menuPainted(timestamp);}
     catch{menuPreviewAvailable=false;}
    }
   },
   drawEffects:()=>{if(isPlaying){paintPayments(dt,paintScene);paintSales(dt,paintScene);paintSpeech(dt,paintScene);}},
   drawPlacementOverlay:()=>drawPlacementInteractionOverlays(renderer,game,{
    visible:paintScene,editWall:layoutEditor.active?layoutEditor.wall:null,
    placingKind,hoveredPlacement,purchaseRotation,relocating,relocationFrom,
    wallMode,pendingWall,hoveredWall,installingAnnexPc,hoveredAnnexPc
   })
  });

  if(frameSchedule.hud(timestamp,{playing:isPlaying,accountOpen,...frameInteraction.snapshot()}))
   renderUI(true);
  requestAnimationFrame(frame);
}
setInterval(save,8000);
window.addEventListener("beforeunload",save);
// Em celulares, a aba pode ser descartada sem disparar beforeunload.
// Persistência permanece local: nenhuma requisição para a nuvem.
window.addEventListener("pagehide",save);
document.addEventListener("visibilitychange",()=>{if(document.hidden)save();});
decorateControls();installWindowNavigation();
showMenu();
requestAnimationFrame(frame);
