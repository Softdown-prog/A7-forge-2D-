import {installMerchandisePanel} from "./ui/merchandisePanel.js";
import {createMerchandisePort} from "./application/merchandisePort.js";
import {createPricingPort} from "./application/pricingPort.js";
import {createServiceActionsPort} from "./application/serviceActionsPort.js";
import {createGameLicensingPort} from "./application/gameLicensingPort.js";
import {installGameLicensingControls} from "./ui/gameLicensingControls.js";
import {createPs1ActionsPort} from "./application/ps1ActionsPort.js";
import {createPs1AdminPort} from "./application/ps1AdminPort.js";
import {createGpuDownloadMetersPort} from "./application/gpuDownloadMetersPort.js";
import {refreshGpuDownloadMeters} from "./ui/gpuDownloadMeters.js";
import {createWindowsLicensePort} from "./application/windowsLicensePort.js";
import {renderWindowsLicensePanel} from "./ui/windowsLicensePanel.js";
import {renderPs1AdminPanel} from "./ui/ps1AdminPanel.js";
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
import {quotePrinter} from "./sim/printService.js";
import {quoteDiscCopier,DISC_COPIER_YEAR} from "./sim/discCopy.js";
import {drawDiscCopier} from "./render/discCopierArt.js";
import {createDeskPricingPort} from "./application/deskPricingPort.js";
import {createCommerceNetworkPort} from "./application/commerceNetworkPort.js";
import {renderCommerceNetworkPanel} from "./ui/commerceNetworkPanel.js";
import {renderDiscPricing,renderPrintPricing} from "./ui/deskPricingPanel.js";
import {drawPrinterShop} from "./render/printerArt.js";
import {drawPs1Station} from "./render/ps1Art.js";
import {PS1_UNLOCK_YEAR,PS1_MAX_STATIONS,ps1PlacementSlots,
 ps1StationPoint,PS1_CD_CATALOG,ps1DiscPrice,ps1DiscCopies,
 ps1PlacementLabel} from "./sim/ps1.js";
import {installGameViewport} from "./ui/gameViewport.js";
import {createLayoutEditor} from "./ui/layoutEditor.js";
import {createLayoutEditorPort} from "./application/layoutEditorPort.js";
import {createPlacementActionsPort} from "./application/placementActionsPort.js";
import {editableObjects} from "./sim/editableObjects.js";
import {createGameSessionPort} from "./application/gameSessionPort.js";
import {installSaveFileControls} from "./ui/saveFileControls.js";
import {createMenuScreens,installMenuControls,type GameCampaignMode} from "./ui/gameMenuControls.js";
import {createFrameSchedule} from "./application/frameSchedule.js";
import {createPanelRevisionCache} from "./application/panelRevisionCache.js";
import {createFrameFeedbackPort} from "./application/frameFeedbackPort.js";
import {SHOP_CATALOG,shopPrice,furnitureLimit,availablePlacementSlots,type FurnitureKind,type PlacementSlot} from "./sim/shop.js";
import {roomBounds,MAX_EXTENSION_LEVEL,type ExtensionDirection} from "./sim/room.js";
import {WALL_COST,wallZoneCount,type WallSegment} from "./sim/walls.js";
import {ANNEX_PC_COST,type AnnexComputerSlot} from "./sim/stations.js";
import { createGame, displayTime, online, pcCount, stepGame, isValidSave, applyResult } from "./sim/engine.js";
import {createFinancialBalancePort} from "./application/financialBalancePort.js";
import {createFinancialAdminOverviewPort} from "./application/financialAdminOverviewPort.js";
import {renderFinancialAdminTotals,renderFinancialAdminActivity} from "./ui/financialAdminOverviewPanel.js";
import {createStaffStatusPort} from "./application/staffStatusPort.js";
import {renderStaffStatusPanel} from "./ui/staffStatusPanel.js";
import {renderFinancialBalance,renderFinancialBillWatch} from "./ui/financialBalancePanel.js";
import {createMonthlyFinancePort} from "./application/monthlyFinancePort.js";
import {renderMonthlyFinancePanel} from "./ui/monthlyFinancePanel.js";
import {createStationLedgerPort} from "./application/stationLedgerPort.js";
import {renderStationLedgerRows} from "./ui/stationLedgerPanel.js";
import {createPricingInsightsPort} from "./application/pricingInsightsPort.js";
import {renderHourlyPricingInsights,renderEnergyYearOutlook} from "./ui/pricingInsightsPanel.js";
import {yearFromMinutes,clampPriceToEra} from "./sim/historicalEconomy.js";
import {createHourlyPriceStatusPort} from "./application/hourlyPriceStatusPort.js";
import {createRetailPriceStatusPort} from "./application/retailPriceStatusPort.js";
import {renderRetailPriceControls} from "./ui/retailPriceControlsPanel.js";
import {renderHourlyPriceStatus,renderSessionPackages} from "./ui/hourlyPriceStatusPanel.js";
import { DAY_MINUTES, type GameState } from "./sim/types.js";
import {GAME_LAST_MINUTE} from "./sim/mailCalendar.js";
import { SceneRenderer } from "./render/scene.js";
import {SceneMotion} from "./render/motion.js";
import {createPromotionStatusPort} from "./application/promotionStatusPort.js";
import {renderPromotionStatus} from "./ui/promotionStatusPanel.js";
import { cameraForGame, iso } from "./render/isometric.js";
import { roomWidth,pcPosition } from "./sim/engine.js";
import {computerSeat} from "./sim/route.js";
import {iconMarkup,catalogueIcon,decorateControls,presentLiveState,presentComputerOperations,syncWindowChrome,installWindowNavigation} from "./ui/presentation.js";
import {installShopPanels,shopCategory} from "./ui/shopPanels.js";
import {shopPlacementStatus,shopPurchaseButtonText} from "./ui/shopGuidance.js";
import {installManagementPanels} from "./ui/managementPanels.js";
import {installFridayMeetupPanel} from "./ui/fridayMeetupPanel.js";
import {installNightTournamentHud} from "./ui/nightTournamentHud.js";
import {renderCustomerFeedback} from "./ui/customerFeedbackPanel.js";
import {customerFeedbackSnapshot} from "./application/customerFeedbackSnapshot.js";
import {syncPanelChildren} from "./ui/panelChildren.js";
import { Soundscape } from "./audio/soundscape.js";
import {consumeNewMail,mailBaseline} from "./audio/mailNotification.js";
import {unreadNotices} from "./sim/notices.js";
import {createNoticeInboxPort} from "./application/noticeInboxPort.js";
import {renderNoticeInbox} from "./ui/noticeInboxPanel.js";
import {gameYear,INTERNET_ERAS} from "./sim/era.js";
import {createGpuCatalogPort} from "./application/gpuCatalogPort.js";
import {renderGpuCatalogPanel} from "./ui/gpuCatalogPanel.js";
import {createGpuGamesCatalogPort} from "./application/gpuGamesCatalogPort.js";
import {renderGpuGamesCatalog} from "./ui/gpuGamesCatalogPanel.js";
import {createBasicGamesLicenseStatusPort} from "./application/basicGamesLicenseStatusPort.js";
import {renderBasicGamesLicenseStatus} from "./ui/basicGamesLicenseStatusPanel.js";
import {createClassicGamesCatalogPort} from "./application/classicGamesCatalogPort.js";
import {renderClassicGamesCatalog} from "./ui/classicGamesCatalogPanel.js";
import {createEventLogPort} from "./application/eventLogPort.js";
import {renderEventLog} from "./ui/eventLogPanel.js";
import {pcUnderRepair} from "./sim/services.js";
import {createPcOperationsPort} from "./application/pcOperationsPort.js";
import {renderPcOperations} from "./ui/pcOperationsPanel.js";
import {renderPcMaintenancePanel} from "./ui/pcMaintenancePanel.js";
import {serviceAccessIssues,type ServiceAccessIssue} from "./sim/serviceAccess.js";
import {serviceAccessStatusSnapshot} from "./application/serviceAccessStatusPort.js";
import {renderServiceAccessStatus,renderServiceAccessOverlayStatus} from "./ui/serviceAccessStatusPanel.js";
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
const shopArtwork=new Map<string,string>();
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
 const organize=document.querySelector<HTMLButtonElement>("#organize-furniture");
 if(organize){const count=layoutEditorPort.objects().length;organize.disabled=false;organize.textContent="Organizar salão: "+count+" objetos";}
 const demolish=document.querySelector<HTMLButtonElement>("#demolish-walls");
 if(demolish){const count=(game.interiorWalls?.length??0)+(game.interiorDoors?.length??0);
  demolish.disabled=!count;demolish.textContent="Remover paredes e portas ("+count+")";}
 const cash=document.getElementById("shop-cash");
 if(cash){
   const b=roomBounds(game),e=game.roomExtensions??{west:0,east:0,south:0};
   cash.textContent="Caixa R$ "+game.cash+" · PCs "+pcCount(game)+"/"+(3+game.expansionLevel*2+placementActions.annexSlots().length)+
     " · Tamanho do salão "+(b.maxX-b.minX)+"×"+(b.maxY-b.minY)+" · Ampliações: esquerda "+e.west+"/5 · direita "+e.east+"/5 · fundos "+(e.north??0)+"/5 · Salas "+wallZoneCount(game);
 }
 shopCatalog.replaceChildren();
 for(const item of SHOP_CATALOG){
  if(shopCategory(item.id)!==shopPanels?.current())continue;
  const card=document.createElement("article");card.className="shop-card";
  const art=document.createElement("div");art.className="shop-art";art.dataset.item=item.id;art.setAttribute("aria-hidden","true");art.innerHTML=iconMarkup(catalogueIcon(item.id));
  if(item.id==="disc-copier"||item.id==="printer"||item.id==="ps1"){
   art.replaceChildren();
   if(shopArtwork.has(item.id)){const image=document.createElement("img");image.src=shopArtwork.get(item.id)!;image.alt="";art.append(image);}
   else{const preview=document.createElement("canvas");
   preview.width=640;preview.height=360;
   const ctx=preview.getContext("2d");
   if(ctx){
    if(item.id==="printer")drawPrinterShop(ctx,640,360);
    else if(item.id==="disc-copier")drawDiscCopier(ctx,640,360);
    else{
     ctx.fillStyle="#edf1e7";ctx.fillRect(0,0,640,360);
     const preview={originX:250,originY:125,zoom:1.75};
     drawPs1Station(ctx,preview,{x:0,y:0},0,true,0);
    }
   }
   shopArtwork.set(item.id,preview.toDataURL());
   const image=document.createElement("img");image.src=shopArtwork.get(item.id)!;image.alt="";art.append(image);
   }
  }
  const title=document.createElement("h3");title.textContent=item.label;
  const category=document.createElement("small");category.textContent=item.category;
  const description=document.createElement("p");description.textContent=item.description;
  const placementHint=shopPlacementStatus(game,item.id);
  const hint=document.createElement("small");hint.className="shop-purchase-status";
  if(placementHint)hint.textContent=placementHint;
  const button=document.createElement("button");button.type="button";button.dataset.buy=item.id;
  const max=(item.id==="poster"||item.id==="plant"||item.id==="table")?furnitureLimit(game,item.id):0;
  const count=game.furniture?.[item.id as FurnitureKind]??0;
  const ext=item.id.startsWith("extend-")?item.id.slice(7) as ExtensionDirection:null;
  const full=item.id==="door"?!(game.interiorWalls?.length):
     item.id==="computer-annex"?!placementActions.availableAnnex().length:
     item.id==="ps1"?(game.ps1Stations?.length??0)>=PS1_MAX_STATIONS||!ps1PlacementSlots(game).length:
     ext?(game.roomExtensions?.[ext]??0)>=MAX_EXTENSION_LEVEL:
     item.id==="expand"?game.expansionLevel>=2:
     item.id==="computer"?((game.installedPcs??(3+game.expansionLevel*2))>=3+game.expansionLevel*2):
     max>0&&(count>=max||!availablePlacementSlots(game,item.id as FurnitureKind).length);
  const price=shopPrice(game,item.id);
  button.disabled=full||game.cash<price;
  button.textContent=shopPurchaseButtonText(item.id,full,game.cash<price,price,max>0);
  if(item.id==="printer"){
   const quote=quotePrinter(game);button.disabled=!quote.ok;button.title=quote.message;
   button.textContent=game.printer?"Adquirida · serviço ativo":game.cash<price?"Caixa insuficiente · R$ "+price:"Comprar · R$ "+price;
  }
  if(item.id==="disc-copier"){
   const quote=quoteDiscCopier(game);button.disabled=!quote.ok;button.title=quote.message;
   button.textContent=game.discCopier?"Adquirida · serviço ativo":gameYear(game)<DISC_COPIER_YEAR?"🔒 Disponível em 2001":game.cash<price?"Caixa insuficiente · R$ "+price:"Comprar · R$ "+price;
  }
  if(item.id==="ps1"){
    const free=ps1PlacementSlots(game),placement=document.createElement("select");
    placement.id="ps1-placement";
    placement.hidden=true; // valor técnico apenas para a compra, nunca exibido ao jogador
    if(!free.some(spot=>spot.id===selectedPs1PlacementId))
      selectedPs1PlacementId=free[0]?.id??null;
    for(const spot of free){
     const option=document.createElement("option");option.value=spot.id;
     option.textContent=ps1PlacementLabel(spot);
     placement.append(option);
    }
    placement.value=selectedPs1PlacementId??"";
    const locationSelector=document.createElement("div");
    locationSelector.className="ps1-location-selector";
    const locationName=document.createElement("output");
    locationName.id="ps1-location-name";
    locationName.className="ps1-location-name";
    locationName.setAttribute("aria-live","polite");
    const previous=document.createElement("button");
    previous.type="button";previous.className="slice ps1-location-arrow";
    previous.textContent="◀";
    previous.setAttribute("aria-label","Escolher o local anterior para a bancada");
    const next=document.createElement("button");
    next.type="button";next.className="slice ps1-location-arrow";
    next.textContent="▶";
    next.setAttribute("aria-label","Escolher o próximo local para a bancada");
    const updateLocation=(offset:number):void=>{
      if(!free.length)return;
      const index=Math.max(0,free.findIndex(spot=>spot.id===selectedPs1PlacementId));
      const spot=free[(index+offset+free.length)%free.length]!;
      selectedPs1PlacementId=spot.id;
      placement.value=spot.id;
      locationName.textContent=ps1PlacementLabel(spot);
    };
    previous.disabled=free.length<2;next.disabled=free.length<2;
    previous.addEventListener("click",()=>updateLocation(-1));
    next.addEventListener("click",()=>updateLocation(1));
    updateLocation(0);
    locationSelector.append(previous,locationName,next);
    button.disabled=game.economyVersion!==2||gameYear(game)<PS1_UNLOCK_YEAR||full||game.cash<price;
    button.textContent=game.economyVersion!==2||gameYear(game)<PS1_UNLOCK_YEAR?
     "🔒 Disponível em 2002":full?"Sem espaço livre":
     game.cash<price?"Caixa insuficiente · R$ "+price:"Comprar conjunto · R$ "+price;
    const locationHelp=document.createElement("small");
    locationHelp.className="ps1-placement-help";
    locationHelp.textContent="Escolha um local no salão: norte é o fundo, sul é a entrada, oeste é a esquerda e leste é a direita.";
    card.append(art,category,title,description,placement,locationSelector,locationHelp,button);
  }else{
   card.append(art,category,title,description);
   if(placementHint)card.append(hint);
   card.append(button);
  }
  if(max>0){const owned=document.createElement("span");owned.textContent="Instalados: "+count+" · posições livres: "+availablePlacementSlots(game,item.id as FurnitureKind).length;card.append(owned);}
  shopCatalog.append(card);
 }
 // CDs físicos do PS1: não são licenças nem são vendidos ao cliente final.
 // Uma cópia pode alimentar apenas uma bancada por vez.
 if(shopPanels?.current()==="consoles"&&game.economyVersion===2&&gameYear(game)>=PS1_UNLOCK_YEAR){
  const label=document.createElement("h3");label.className="ps1-shop-heading";
  label.textContent="Jogos de PlayStation 1 · CDs físicos";
  shopCatalog.append(label);
  const note=document.createElement("p");note.className="catalog-game-note ps1-shop-note";
  note.textContent="Compre um CD definitivo para começar a atender. Cada cópia equipa apenas uma bancada por vez; os títulos são fictícios e não exigem licenciamento por PC.";
  shopCatalog.append(note);
  for(const disc of PS1_CD_CATALOG){
   const price=ps1DiscPrice(game,disc.id);
   const copies=ps1DiscCopies(game,disc.id);
   const card=document.createElement("article");card.className="shop-card ps1-cd-shop-card";
   const art=document.createElement("div");art.className="ps1-cd-art";
   art.setAttribute("aria-hidden","true");
   const jewel=document.createElement("div");jewel.className="ps1-cd-jewel";
   const cover=document.createElement("img");cover.className="ps1-cd-cover";
   cover.src="assets/ps1/covers/"+disc.id+".svg";
   cover.alt="";cover.loading="lazy";cover.decoding="async";
   cover.width=420;cover.height=560;
   const spine=document.createElement("span");spine.className="ps1-cd-spine";
   jewel.append(cover,spine);
   art.append(jewel);
   const category=document.createElement("small");category.textContent="CD de PS1 · "+disc.genre;
   const title=document.createElement("h3");title.textContent=disc.title;
   const description=document.createElement("p");
   description.textContent="Cópias no acervo: "+copies+
    " · compra definitiva, sem renovação.";
   const button=document.createElement("button");button.type="button";
   button.dataset.buyPs1Disc=disc.id;
   const unavailable=!(game.ps1Stations?.length);
   const full=copies>=PS1_MAX_STATIONS;
   button.disabled=unavailable||full||game.cash<price;
   button.textContent=unavailable?"Instale uma bancada primeiro":full?
    "Acervo completo":game.cash<price?"Caixa insuficiente · "+price.toLocaleString("pt-BR",{style:"currency",currency:"BRL"}):
    "Comprar CD · "+price.toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
   card.append(art,category,title,description,button);
   shopCatalog.append(card);
  }
  // CDs perto do console, e não escondidos após todas as decorações/expansões.
  const consoleCard=shopCatalog.querySelector('button[data-buy="ps1"]')?.closest(".shop-card");
  if(consoleCard){
   let previous=consoleCard;
   for(const child of Array.from(shopCatalog.querySelectorAll(".ps1-shop-heading, .ps1-shop-note, .ps1-cd-shop-card"))){
    previous.after(child);
    previous=child;
   }
  }
 }
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
const eventLogPort=createEventLogPort(()=>game);
function renderUI(liveOnly=false):void {
  nightTournamentHud.render(game);
  if(adminOpen&&activeAdminTab==="finance"&&managementPanels.active("finance","events"))
   fridayMeetupPanel.render();
  // TypeScript não propaga a checagem inicial de nulidade para callbacks posteriores.
  if (!status || !admin || !events || !controls) return;
  admin.hidden=!adminOpen;
  const mailbox=document.getElementById("notices");if(mailbox)mailbox.hidden=!noticesOpen;
  const unread=unreadNotices(game),badge=document.getElementById("notices-count");
  if(badge){badge.hidden=unread===0;badge.textContent=String(unread);}
  document.getElementById("open-notices")?.setAttribute("aria-expanded",String(noticesOpen));
  if(noticesList&&noticesOpen&&panelChanged("notices",[game.cash,game.notices,game.contentFilterInstalled,game.pcWindowsLicenses,game.licensedGames,game.electricalDeadlineDay,game.electricalInspectionFineApplied],!liveOnly)){
    renderNoticeInbox(noticesList,noticeInboxPort.snapshot(),document,iconMarkup);
  }
  if(placementToolbar)placementToolbar.hidden=!(placingKind||relocating||wallMode||installingAnnexPc);
  const rotateButton=document.querySelector<HTMLButtonElement>("#rotate-furniture");
  const moving=placementActions.furniture().find(p=>p.slotId===relocationFrom);
  if(rotateButton){rotateButton.hidden=!(placingKind&&placingKind!=="poster")&&(!relocating||!moving);rotateButton.disabled=placingKind?placingKind==="poster":!moving||moving.kind==="poster";}
 const confirmWall=document.querySelector<HTMLButtonElement>("#confirm-wall"),turnWall=document.querySelector<HTMLButtonElement>("#turn-wall");
 if(confirmWall){confirmWall.hidden=!wallMode;confirmWall.disabled=!pendingWall||(wallMode==="build"&&!placementActions.canBuild(pendingWall));}if(turnWall){turnWall.hidden=wallMode!=="build";turnWall.disabled=!pendingWall;}

  if(stage)stage.classList.toggle("placing",Boolean(placingKind||relocating||wallMode||installingAnnexPc));
  if(placementHelp)placementHelp.textContent=installingAnnexPc?
    (placementNotice||"Escolha um círculo verde numa área ampliada (esquerda, direita ou fundos). PC completo: R$ "+ANNEX_PC_COST+". A cobrança só ocorre ao selecionar a vaga."):
    wallMode?
    (placementNotice||(wallMode==="build"?"Selecione a borda, confira a prévia e confirme. Cada segmento custa R$ "+WALL_COST+".":"Toque numa divisória para "+(wallMode==="door"?"instalar uma porta: R$ 80.":"remover parede ou porta."))):
    relocating?
    (placementNotice||(relocationFrom?"Escolha o destino verde ou toque em Girar para mudar a orientação.":"Toque no móvel em dourado e escolha a nova posição. Sem custos.")):
    placingKind?(placementNotice||"Escolha uma posição verde para "+placementNames[placingKind]+". Clique para comprar e instalar; cancelar não cobra nada."):"";
  if(shop)shop.hidden=!shopOpen;
  const shopButton=document.querySelector<HTMLButtonElement>("#open-shop");
  if(shopButton)shopButton.setAttribute("aria-expanded",String(shopOpen));
  renderShop(!liveOnly);
  activateAdminTab(activeAdminTab);
  if(adminOpen)managementPanels.syncUnlocks();
  renderTimeWeatherPanel(timeWeatherSnapshot(game),iconMarkup);
  const year=gameYear(game);
  const setText=(id:string,value:string):void=>{const node=document.getElementById(id);if(node&&!node.closest(".admin-section[hidden],.management-page[hidden]")&&node.textContent!==value)node.textContent=value;};
  if(adminOpen){
  const stationRevision=[year,game.cash,game.economyVersion,game.pcTiers,game.pcWindows,game.pcWindowsLicenses,game.pcPoweredOff,game.pcGpus,game.pcLcdModels,game.pcComponents,Array.from({length:pcCount(game)},(_,i)=>stationOccupied(game,i)),game.repairJobs?.map(j=>[j.pc,j.phase,Math.floor(j.progress/j.duration*4)])];
  const money=(n:number):string=>"R$ "+n.toLocaleString("pt-BR");
  const historical=game.economyVersion===2;
  const financialAdminOverview=financialAdminOverviewPort.snapshot();
  renderFinancialBalance(financialBalancePort.balance(),setText,document);
  if(activeAdminTab==="finance"&&managementPanels.active("finance","feedback")){
   const host=document.getElementById("customer-feedback-panel");
   if(host&&panelChanged("customerFeedback",
     [Math.floor(game.totalMinutes/720),game.customerFeedback],!liveOnly))
    renderCustomerFeedback(host,customerFeedbackSnapshot(game));
  }
  if(activeAdminTab==="finance"&&managementPanels.active("finance","balance")){
   renderFinancialBillWatch(financialBalancePort.billWatch(),document);
  }
  renderFinancialAdminTotals(financialAdminOverview,setText);
  // Compatibilidade: saves de épocas anteriores podem ter valores antigos.
  clampPriceToEra(game);
  const hourlyPriceStatus=hourlyPriceStatusPort.snapshot();
  renderHourlyPriceStatus(hourlyPriceStatus,setText,document);
  const durations=document.getElementById("session-package-prices");
  if(durations&&adminOpen&&activeAdminTab==="prices"&&managementPanels.active("prices","hourly")&&panelChanged("durations",[game.pricePerHour,historical],!liveOnly)){
   renderSessionPackages(hourlyPriceStatus.packages,durations,document);
  }
  if(activeAdminTab==="prices"&&managementPanels.active("prices","insights")){
   renderHourlyPricingInsights(pricingInsightsPort.hourly(),setText);
  }
  renderEnergyYearOutlook(pricingInsightsPort.energy(),setText);
  if(retailControls&&adminOpen&&activeAdminTab==="prices"&&managementPanels.active("prices","retail")&&panelChanged("retail",[game.retailPrices],!liveOnly)){
   renderRetailPriceControls(retailControls,retailPriceStatusPort.snapshot(),iconMarkup,document,syncPanelChildren);
  }
  const serviceAvailability=deskPricingPort.installed();
  const discPanel=document.getElementById("disc-copy-panel");
  if(discPanel)discPanel.hidden=!serviceAvailability.discs;
  if(discControls&&serviceAvailability.discs&&activeAdminTab==="prices"&&managementPanels.active("prices","discs")){
   const view=deskPricingPort.discs();
   if(view)renderDiscPricing(discControls,view,setText,iconMarkup,document,syncPanelChildren);
  }
  const printPanel=document.getElementById("print-service-panel");
  if(printPanel)printPanel.hidden=!serviceAvailability.printer;
  if(printControls&&serviceAvailability.printer&&activeAdminTab==="prices"&&managementPanels.active("prices","printing")){
   const view=deskPricingPort.printing();
   if(view)renderPrintPricing(printControls,view,setText,document,syncPanelChildren);
  }
  if(adminOpen&&activeAdminTab==="stock")merchandisePanel.render();
  renderCommerceNetworkPanel(commerceNetworkPort.snapshot(),setText,document);
  setText("pc",pcOperationsPort.summary());
  const stationLedgerRows=document.querySelector<HTMLTableSectionElement>("#station-ledger-rows");
  if(stationLedgerRows&&adminOpen&&activeAdminTab==="computers"&&managementPanels.active("computers","ledger"))
    renderStationLedgerRows(stationLedgerRows,stationLedgerPort);
  const liveMaintenance=document.getElementById("pc-maintenance");
  if(liveMaintenance&&adminOpen&&activeAdminTab==="computers"&&!managementPanels.active("computers","ledger")&&panelChanged("computers",[managementPanels.current("computers"),selectedLcdPc,selectedHardwareTab,stationRevision,managementPanels.active("computers","operations")?game.pcWear?.map(Math.round):null],!liveOnly)){
    const page=managementPanels.current("computers");
    renderPcMaintenancePanel(liveMaintenance,{
     build:maintenance=>{
      if(page==="operations")renderPcOperations(maintenance,pcOperationsPort.rows(),document);
      selectedLcdPc=Math.min(selectedLcdPc,pcCount(game)-1);
      if(page==="hardware"||page==="windows")maintenance.append(renderHardwarePanel(game,selectedLcdPc,year,selectedHardwareTab,page));
      if(page==="monitors")renderLcdMonitorsPanel(maintenance,lcdMonitorsPort.snapshot(selectedLcdPc),lcdPreview,document);
      presentComputerOperations(computerOperationsSnapshot(game),maintenance);
     },
     decorate:decorateControls,
     reconcile:syncPanelChildren,
     selectedStation:()=>selectedLcdPc
    },document);
  }
  if(gpuPcChoice&&gpuList&&adminOpen&&activeAdminTab==="gpus"&&panelChanged("gpuPcChoice",[stationRevision,selectedGpuPc],!liveOnly)){
    selectedGpuPc=Math.min(selectedGpuPc,pcCount(game)-1);
    renderGpuCatalogPanel(gpuPcChoice,gpuList,gpuCatalogPort.snapshot(selectedGpuPc),setText,document,syncPanelChildren);
  }
  renderBasicGamesLicenseStatus(basicGamesLicenseStatusPort.snapshot(),setText,document);
  if(licensePanel&&adminOpen&&activeAdminTab==="licenses"&&managementPanels.active("licenses","windows")&&panelChanged("licensePanel",[stationRevision],!liveOnly))
   renderWindowsLicensePanel(licensePanel,windowsLicensePort);
  if(eraGamePanel&&adminOpen&&activeAdminTab==="licenses"&&managementPanels.active("licenses","classic")&&panelChanged("eraGamePanel",[year,stationRevision,game.licensedGames,game.licensedEraGames,game.ericSecondMailDelivered],!liveOnly)){
   renderClassicGamesCatalog(eraGamePanel,classicGamesCatalogPort.snapshot(),document,syncPanelChildren);
  }
  if(gpuGamePanel&&adminOpen&&activeAdminTab==="licenses"&&managementPanels.active("licenses","gpu")&&panelChanged("gpuGamePanel",[year,stationRevision,game.licensedGames,game.licensedGpuGames,game.pcPoweredOff,game.gpuGameInstalls,game.gpuGameInstallJobs?.map(j=>[j.pc,j.id,j.durationMinutes]),game.gpuGameDemand,online(game)],!liveOnly)){
   renderGpuGamesCatalog(gpuGamePanel,gpuGamesCatalogPort.snapshot(),document,syncPanelChildren);
  }
  refreshGpuDownloadMeters(gpuGamePanel,adminOpen&&activeAdminTab==="licenses"&&managementPanels.active("licenses","gpu"),gpuDownloadMetersPort);
  if(activeAdminTab==="consoles")renderPs1AdminPanel(ps1AdminPort,{
   showStations:adminOpen&&managementPanels.active("consoles","stations"),
   setText,money
  });
  if(activeAdminTab==="services"){
  renderStaffStatusPanel(staffStatusPort.snapshot(),setText,document);
  if(adminOpen&&activeAdminTab==="services"&&managementPanels.active("services","access")){
   const issues=inspectServiceAccess(!liveOnly);
   renderServiceAccessStatus(serviceAccessStatusSnapshot(issues),setText,document);
  }
  }
  renderFinancialAdminActivity(financialAdminOverview,setText,activeAdminTab==="finance");
  if(activeAdminTab==="finance"){
  renderMonthlyFinancePanel(monthlyFinancePort.snapshot(),setText,document);
  renderPromotionStatus(promotionStatusPort.snapshot(),setText,document);
  }
  }
  // Independente do painel administrativo: as marcações continuam visíveis
  // depois de fechar Administração para inspecionar o salão no Canvas.
  renderServiceAccessOverlayStatus(serviceAccessStatusSnapshot(serviceAccessCache),serviceAccessVisible,setText,document);
  const eventHistory=eventLogPort.snapshot();
  if(eventHistory.signature!==lastEventSignature){
   renderEventLog(events,eventHistory,document,iconMarkup);
   lastEventSignature=eventHistory.signature;
  }
  controls.setAttribute("aria-expanded",String(adminOpen));
  presentLiveState(liveStatusSnapshot(game,internetName()),adminOpen?activeAdminTab:null);
}
const frameSchedule=createFrameSchedule();
let lastScroll=-1000,lastInput=-1000,uiPointerHeld=false,sceneVisible=true;
new IntersectionObserver(entries=>{sceneVisible=entries[0]?.isIntersecting??false;}).observe(canvas);
document.addEventListener("scroll",()=>{lastScroll=performance.now();},{capture:true,passive:true});
document.addEventListener("pointerdown",()=>{uiPointerHeld=true;lastInput=performance.now();},{capture:true,passive:true});
for(const type of ["pointerup","pointercancel"])document.addEventListener(type,()=>{uiPointerHeld=false;lastInput=performance.now();},{capture:true,passive:true});
window.addEventListener("blur",()=>{uiPointerHeld=false;});
let wasSimulating=false;
const coarsePointer=window.matchMedia("(pointer:coarse)");
const reduceMotion=window.matchMedia("(prefers-reduced-motion: reduce)");
function frame(timestamp:number):void {
  const {dt,elapsed}=frameSchedule.begin(timestamp);
  const accountOpen=document.getElementById("player-account")?.hasAttribute("open")===true;
  const simulating=isPlaying&&!accountOpen&&game.totalMinutes<GAME_LAST_MINUTE&&!layoutEditor.active&&!placingKind&&!relocating&&!wallMode&&!installingAnnexPc;
  if(wasSimulating!==simulating){sceneMotion.reset();wasSimulating=simulating;}
  if(simulating&&game.leftoverMinutes+dt*4.0>=1)sceneMotion.capture(game);
  if(isPlaying&&!accountOpen&&!layoutEditor.active&&!placingKind&&!relocating&&!wallMode&&!installingAnnexPc)stepGame(game,dt*4.0);
  // Detect new mail from every delivery path, not from opening the envelope.
  const arrivedMail=isPlaying?consumeNewMail(knownMailIds,game.notices):0;
  if(arrivedMail>0&&!document.hidden)soundscape.mail();
  frameFeedback.payments(isPlaying);
  if(game.served>previousServed)previousServed=game.served;
  frameFeedback.sales(isPlaying);
  frameFeedback.prints(isPlaying);
  frameFeedback.keyboards(isPlaying);
  if(game.purchases>previousPurchases)previousPurchases=game.purchases;
  frameFeedback.speech(isPlaying);
  const paintScene=frameSchedule.scene(timestamp,{
   playing:isPlaying,accountOpen,visible:sceneVisible,hidden:document.hidden,
   adminOpen,shopOpen,noticesOpen,coarse:coarsePointer.matches
  });
  if(paintScene)renderer.draw(sceneMotion.sample(game),elapsed);
  if(paintScene&&serviceAccessVisible)renderer.drawServiceAccessOverlay(game,inspectServiceAccess(),elapsed);
  if(paintScene&&layoutEditor.active)renderer.drawLayoutOverlay(game,layoutEditor.selected,layoutEditor.draft,elapsed);
  if(frameSchedule.menu(timestamp,{
   playing:isPlaying,accountOpen,hasRenderer:!!menuRenderer,previewAvailable:menuPreviewAvailable,
   hidden:document.hidden,reduceMotion:reduceMotion.matches
  })&&menuRenderer){
   try{menuRenderer.draw(menuPreview,elapsed);frameSchedule.menuPainted(timestamp);}
   catch{menuPreviewAvailable=false;}
  }
  if(isPlaying){paintPayments(dt,paintScene);paintSales(dt,paintScene);paintSpeech(dt,paintScene);}
  if(paintScene&&layoutEditor.active&&layoutEditor.wall)renderer.drawWallPreview(game,layoutEditor.wall,true);
  if(paintScene&&placingKind)renderer.drawPlacementCandidates(game,placingKind,hoveredPlacement,purchaseRotation);
  if(paintScene&&relocating)renderer.drawRelocationCandidates(game,relocationFrom,hoveredPlacement);
  if(paintScene&&wallMode){
    if(wallMode==="door")renderer.drawDoorCandidates(game,pendingWall??hoveredWall);
    else renderer.drawWallPreview(game,pendingWall??hoveredWall,wallMode==="remove");
  }
  if(paintScene&&installingAnnexPc)renderer.drawAnnexPcCandidates(game,hoveredAnnexPc);
  if(frameSchedule.hud(timestamp,{playing:isPlaying,accountOpen,lastScroll,pointerHeld:uiPointerHeld,lastInput}))
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
