import {installMerchandisePanel} from "./ui/merchandisePanel.js";
import {createMerchandisePort} from "./application/merchandisePort.js";
import {createPricingPort} from "./application/pricingPort.js";
import {createServiceActionsPort} from "./application/serviceActionsPort.js";
import {createGameLicensingPort} from "./application/gameLicensingPort.js";
import {installGameLicensingControls} from "./ui/gameLicensingControls.js";
import {createPs1ActionsPort} from "./application/ps1ActionsPort.js";
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
import {quotePrinter,printPaperInkCost,pagesPrintedToday,PRINT_MAX_PRICE} from "./sim/printService.js";
import {quoteDiscCopier,discMediaCost,discCopiesToday,DISC_COPIER_YEAR,DISC_COPIES_PER_DAY,MAX_DISC_PRICE} from "./sim/discCopy.js";
import {drawDiscCopier} from "./render/discCopierArt.js";
import {printEconomy,discEconomy} from "./sim/serviceEconomy.js";
import {drawPrinterShop} from "./render/printerArt.js";
import {drawPs1Station} from "./render/ps1Art.js";
import {PS1_UNLOCK_YEAR,PS1_MAX_STATIONS,ps1PlacementSlots,
 ps1HourPrice,ps1AllowedHourlyCeiling,ps1StationPoint,
 PS1_CD_CATALOG,ps1DiscPrice,ps1DiscCopies,ps1PlayableDisc,ps1PlacementLabel,
 ps1SecondSeatPrice,ps1OpenSeat} from "./sim/ps1.js";
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
import {SHOP_CATALOG,shopPrice,furnitureLimit,availablePlacementSlots,type FurnitureKind,type PlacementSlot} from "./sim/shop.js";
import {roomBounds,MAX_EXTENSION_LEVEL,type ExtensionDirection} from "./sim/room.js";
import {WALL_COST,wallZoneCount,type WallSegment} from "./sim/walls.js";
import {ANNEX_PC_COST,type AnnexComputerSlot} from "./sim/stations.js";
import { createGame, displayTime, online, pcCount, stepGame, isValidSave, applyResult } from "./sim/engine.js";
import { basicGamesLicenseCost, supplierLevel, wholesaleCost, monthlyBills, energyMonthlyEstimate, productPrice } from "./sim/economy.js";
import {financialSnapshot,monthlyClosingSnapshot} from "./sim/financialClarity.js";
import {computerOccupancyPercent,expansionAdvice} from "./sim/financialReview.js";
import {stationAccountingSummary} from "./sim/stationAccounting.js";
import {hourlyPriceInsight,hourlyPriceScenarios,energyYearOutlook} from "./sim/pricingInsights.js";
import {annualHourlyCeiling,allowableHourlyPrice,priceIndex,yearFromMinutes,
 SESSION_PACKAGES,sessionPrice,clampPriceToEra,ipcaLastYear,MIN_HOURLY_PRICE} from "./sim/historicalEconomy.js";
import { DAY_MINUTES, type GameState } from "./sim/types.js";
import {GAME_LAST_MINUTE} from "./sim/mailCalendar.js";
import { SceneRenderer } from "./render/scene.js";
import {SceneMotion} from "./render/motion.js";
import { promotionCost, isPromotionActive, promotionCanAttractVisitors, promotionAdmissionMinutesRemaining } from "./sim/promotion.js";
import { cameraForGame, iso } from "./render/isometric.js";
import { roomWidth, pcWear, pcBroken,pcPosition } from "./sim/engine.js";
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
import {unreadNotices,missingWindowsLicenses} from "./sim/notices.js";
import {decisionOptions} from "./sim/decisions.js";
import {gameYear,INTERNET_ERAS,WINDOWS_ERAS,installedWindows} from "./sim/era.js";
import {GPU_CATALOG,installedGpu,gpuSpec} from "./sim/gpu.js";
import {GPU_GAME_CATALOG,quoteGpuGame,gpuGameHourlyRate,gpuGameInstalledOnPc,gpuGameAttraction,gpuGameInstallJob,gpuGameInstallPausedReason,gpuGameDownloadSlots} from "./sim/gpuGames.js";
import {gpuDemandReport,gpuLicenseCoverage} from "./sim/gpuDemand.js";
import {ERA_GAME_CATALOG,quoteEraGame,eraGameVisitorMultiplier,
 ERIC_MULTIPLAYER_GAME_ID,multiplayerGameKnown,multiplayerEligiblePcs} from "./sim/eraGames.js";
import {gamePopularityPercent} from "./sim/gamePopularity.js";
import {pcUnderRepair,binStatus} from "./sim/services.js";
import {staffActivity,workPhaseLabel} from "./sim/staffPresentation.js";
import {serviceAccessIssues,type ServiceAccessIssue} from "./sim/serviceAccess.js";
import {employeeHired,employeeDailyWage} from "./sim/staff.js";
import {serviceVisitCost} from "./sim/historicalEconomy.js";
import {LCD_CATALOG,installedLcd,lcdSpec,stationModelName,stationOccupied,type LcdId} from "./sim/computerModels.js";
import {drawRetroComputer} from "./render/retroComputer.js";
import {windowsHardwareIssues,hardwareFor,buildParts,requiredPsuWatts} from "./sim/hardware.js";
import {renderHardwarePanel,type HardwareTab} from "./ui/hardwarePanel.js";
import {stationPoweredOn,stationHasCustomer} from "./sim/stationPower.js";

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
/** Atualiza apenas o texto e o medidor dos downloads a cada minuto do jogo.
 * Não reconstruir o catálogo inteiro ao mudar 1%: preserva foco, toque e
 * posição de rolagem no painel mobile. */
function refreshGpuDownloadMeters():void{
 if(!gpuGamePanel||!adminOpen||activeAdminTab!=="licenses"||!managementPanels.active("licenses","gpu"))return;
 const slots=gpuGameDownloadSlots(game);
 const running=game.gpuGameInstallJobs?.filter(job=>!gpuGameInstallPausedReason(game,job.pc)).length??0;
 const bandwidth=gpuGamePanel.querySelector<HTMLElement>("[data-gpu-bandwidth]");
 if(bandwidth)bandwidth.textContent="Internet nível "+game.internetTier+": até "+slots+
  " PC(s) transferindo por minuto do jogo. "+running+" download(s) apto(s) a avançar"+
  (running>slots?"; a conexão divide a banda por rodízio.":".");
 for(const label of Array.from(gpuGamePanel.querySelectorAll<HTMLElement>("[data-gpu-download-status]"))){
  const pc=Number(label.dataset.gpuGamePc),job=gpuGameInstallJob(game,pc);
  if(!job||job.id!==label.dataset.gpuDownloadStatus)continue;
  const reason=gpuGameInstallPausedReason(game,pc);
  const remaining=job.durationMinutes-job.elapsedMinutes;
  label.textContent="PC "+(pc+1)+" · "+Math.floor(job.elapsedMinutes/job.durationMinutes*100)+"%"+
   (reason?" · Pausado: "+reason:" · "+remaining+" min de transferência pendentes"+
    (running>slots?" · banda compartilhada":""));
 }
 for(const meter of Array.from(gpuGamePanel.querySelectorAll<HTMLProgressElement>("[data-gpu-download-progress]"))){
  const pc=Number(meter.dataset.gpuGamePc),job=gpuGameInstallJob(game,pc);
  if(job&&job.id===meter.dataset.gpuDownloadProgress)meter.value=job.elapsedMinutes;
 }
}
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
    noticesList.replaceChildren();
    if(!(game.notices?.length)){const empty=document.createElement("p");empty.textContent="Nenhuma mensagem recebida por enquanto.";noticesList.append(empty);}
    for(const n of game.notices??[]){
      const card=document.createElement("article");card.className="notice-letter notice-"+n.severity+(n.read?" read":"");
      const title=document.createElement("h3");title.textContent=n.title;title.insertAdjacentHTML("afterbegin",iconMarkup(n.severity==="urgent"?"warning":"mail"));
      const date=document.createElement("small");date.textContent="Dia "+n.day;
      const body=document.createElement("p");body.textContent=n.body;
      const actions=document.createElement("div");actions.className="action-row wrap";
      if(!n.read){const mark=document.createElement("button");mark.className="slice";mark.dataset.noticeRead=n.id;mark.textContent="Marcar como lida";actions.append(mark);}
      const action=document.createElement("button");action.className="slice";
      if(n.id==="safety"&&!game.contentFilterInstalled){action.dataset.noticeAction="programmer";action.textContent="Contratar programador · R$ 320";action.disabled=game.cash<320;actions.append(action);}
      if((n.id==="windows"||n.id==="windows-fine")&&missingWindowsLicenses(game)>0){action.dataset.noticeAction="windows";action.textContent="Regularizar Windows";actions.append(action);}
      if((n.id==="games"||n.id==="copyright")&&!game.licensedGames){action.dataset.noticeAction="games";action.textContent="Regularizar jogos · "+basicGamesLicenseCost(game).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});actions.append(action);}
      const record=game.storyRecords?.find(r=>n.id===r.id||n.id===r.id+":followup");
      if(record&&(record.stage==="pending"||record.stage==="ending")){
        const progress=document.createElement("small");
        progress.className="notice-followup-hint";
        progress.textContent=record.stage==="pending"
          ?"Consequências em acompanhamento: nova carta a partir do dia "+record.dueDay+"."
          :"O resultado será registrado na correspondência a partir do dia "+record.dueDay+".";
        actions.append(progress);
      }
      const options=decisionOptions(n.id,game);
      if(n.id==="electrical-inspection"&&game.electricalDeadlineDay!==undefined&&!n.resolved){
        const pending=document.createElement("strong");
        pending.textContent=game.electricalInspectionFineApplied
          ?"Prazo vencido: multa já aplicada. Ainda é necessário regularizar."
          :(game.electricalExtensionUsed?"Prazo prorrogado até o dia ":"Prazo para regularizar até o dia ")+game.electricalDeadlineDay+".";
        actions.append(pending);
      }
      if(options.length){
        if(n.resolved){const done=document.createElement("strong");done.textContent="✓ Decisão tomada: "+(options.find(o=>o.id===n.resolved)?.label??n.resolved);actions.append(done);}
        else for(const option of options){
          if(n.id==="electrical-inspection"&&option.id==="electrical-defer"&&(game.electricalExtensionUsed||game.electricalInspectionFineApplied))continue;
          const choice=document.createElement("button");choice.className="slice";choice.type="button";choice.dataset.decision=n.id;choice.dataset.choice=option.id;choice.textContent=option.label+" — "+option.description;choice.title=option.description;choice.disabled=option.cost>0&&game.cash<option.cost;actions.append(choice);}
      }
      card.append(title,date,body,actions);noticesList.append(card);
    }
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
  const monetaryIndex=priceIndex(year);
  const historical=game.economyVersion===2;
  const monthlyRent=Math.round((270+game.expansionLevel*170)*(historical?monetaryIndex:1));
  const monthlyInternet=Math.round((110+(game.internetTier-1)*85)*(historical?monetaryIndex:1));
  const monthlyEnergy=game.energyAccrued!==undefined?Math.round(game.energyAccrued):energyMonthlyEstimate(game);
  const monthlyMaintenance=Math.round((75+game.expansionLevel*35)*(historical?monetaryIndex:1));
   const wages=game.employeePayrollAccrued??0;
  const statement=financialSnapshot(game);
  const inCurrency=(n:number)=>n.toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
  setText("admin-cash",money(game.cash));
  setText("management-summary-value","Caixa "+money(game.cash)+" · contas/mês "+money(monthlyBills(game)));
  setText("admin-profit",money(statement.netResult));
  const resultFigure=document.getElementById("admin-profit");
  if(resultFigure)resultFigure.classList.toggle("balance-negative",statement.netResult<0);
  setText("balance-opening",inCurrency(statement.openingCash));
  setText("balance-income",inCurrency(statement.income));
  setText("balance-outgoing",inCurrency(statement.outgoing));
  setText("balance-available",inCurrency(statement.availableCash));
  const unexplained=document.getElementById("balance-reconciliation");
  if(unexplained){
   unexplained.hidden=statement.differenceCents===0;
   if(statement.differenceCents!==0)unexplained.textContent="Atenção: o caixa deste salvamento difere em "+
    inCurrency(statement.differenceCents/100)+
    " do cálculo pelo capital inicial e pelos lançamentos. Confira o histórico em Finanças.";
  }
  if(activeAdminTab==="finance"&&managementPanels.active("finance","feedback")){
   const host=document.getElementById("customer-feedback-panel");
   if(host&&panelChanged("customerFeedback",
     [Math.floor(game.totalMinutes/720),game.customerFeedback],!liveOnly))
    renderCustomerFeedback(host,customerFeedbackSnapshot(game));
  }
  if(activeAdminTab==="finance"&&managementPanels.active("finance","balance")){
  const closing=monthlyClosingSnapshot(game);
  const dueLabel=document.getElementById("bill-watch-title");
  const dueStatus=document.getElementById("bill-watch-status");
  const dueBox=document.getElementById("bill-watch");
  if(closing.campaignEnding){
   if(dueLabel)dueLabel.textContent="Calendário encerrando";
   if(dueStatus)dueStatus.textContent="A campanha termina neste dia; não há outro fechamento agendado.";
  }else{
   if(dueLabel)dueLabel.textContent="Próximo fechamento em "+closing.daysRemaining+
    (closing.daysRemaining===1?" dia do jogo":" dias do jogo");
   if(dueStatus)dueStatus.textContent="Provisão acumulada até agora: "+inCurrency(closing.provision)+
    ". "+(closing.coversProvision?"O caixa atual cobre este valor.":"Se a cobrança fosse agora, faltariam "+
      inCurrency(closing.shortfall)+".");
  }
  if(dueBox)dueBox.classList.toggle("bill-watch-warning",
   !closing.campaignEnding&&!closing.coversProvision&&closing.daysRemaining<=7);
  }
  setText("admin-bills",money(monthlyBills(game)));
  setText("admin-served",String(game.served+(game.printer?.walkIns??0)+(game.discCopier?.walkIns??0)));
  setText("monthly-breakdown","Contas: aluguel "+money(monthlyRent)+" · internet "+money(monthlyInternet)+" · energia acumulada "+money(monthlyEnergy)+" · manutenção "+money(monthlyMaintenance)+" · salários acumulados "+money(wages)+" · projeção energia/mês "+money(energyMonthlyEstimate(game))+". Diárias cobradas apenas nos dias com atendimento efetivo.");
  // Compatibilidade: saves de épocas anteriores podem ter valores antigos.
  clampPriceToEra(game);
  const marketMax=annualHourlyCeiling(year);
  const max=allowableHourlyPrice(game);
  const inReais=(v:number):string=>v.toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
  const perHour=inReais(game.pricePerHour);
  setText("price",perHour+"/h");
  const migration=document.getElementById("migrate-historical-pricing");
  if(migration instanceof HTMLButtonElement)migration.hidden=historical;
  setText("year-price-ceiling",historical?
    year+" · teto nominal da época "+inReais(marketMax)+"/h":
    "Modo clássico: tarifa histórica disponível apenas em novas partidas.");
  setText("equipment-price-ceiling",historical?
    "Máquinas e Windows instalados: até "+inReais(max)+"/h. Modernizar pode liberar uma tarifa maior.":
    "Esta partida conserva a economia anterior e seus preços.");
  setText("annual-ipca",historical?"IPCA anual aplicado aos custos fixos, energia e atacado. Índice acumulado desde 1998: "+
    ((priceIndex(year)-1)*100).toFixed(1)+"%"+(ipcaLastYear(year)!==null?
    " · variação do ano anterior "+ipcaLastYear(year)!.toFixed(2)+"%.":" · último ano sem dado oficial: congelado."):
    "Partida clássica: inflação antiga de energia (+3% ao ano); sem indexação do IPCA.");
  const durations=document.getElementById("session-package-prices");
  if(durations&&adminOpen&&activeAdminTab==="prices"&&managementPanels.active("prices","hourly")&&panelChanged("durations",[game.pricePerHour,historical],!liveOnly)){
   durations.replaceChildren();
   for(const min of (historical?SESSION_PACKAGES:[30,45,60,90])){
    const li=document.createElement("li");
    li.textContent=(min<60?min+" minutos":Number(min/60).toLocaleString("pt-BR")+" h")+
      " — "+inReais(sessionPrice(game.pricePerHour,min));
    durations.append(li);
   }
  }
  const priceDown=document.getElementById("price-down"),priceUp=document.getElementById("price-up");
  if(priceDown instanceof HTMLButtonElement)priceDown.disabled=game.pricePerHour-(historical?.5:2)<(historical?MIN_HOURLY_PRICE:4);
  if(priceUp instanceof HTMLButtonElement)priceUp.disabled=game.pricePerHour+(historical?.5:2)>max;
  if(activeAdminTab==="prices"&&managementPanels.active("prices","insights")){
  const priceInsight=hourlyPriceInsight(game);
  const priceDemandLabel=priceInsight.relativeDemandPercent===0?"menos de 1%":priceInsight.relativeDemandPercent+"%";
  setText("price-demand-insight","Procura relativa pelo modelo: "+priceDemandLabel+" (R$ 12/h = 100%).");
  setText("price-satisfaction-insight","Avaliação estimada em PC básico, sem espera ou queda: "+priceInsight.assessment+".");
  setText("price-caution",priceInsight.caution);
  const scenarios=hourlyPriceScenarios(game);
  const scenarioLine=(delta:-2|-0.5|0|0.5|2,title:string):string=>{
    const candidate=scenarios.find(p=>p.delta===delta);
    return candidate?title+" · R$ "+(historical?candidate.price.toFixed(2):String(candidate.price))+"/h · procura "+candidate.demandIndex+
      "% · receita bruta potencial "+candidate.grossIntakeIndex+"%":
      title+" · fora do teto de "+inReais(max)+"/h.";
  };
  setText("price-scenario-lower",historical?scenarioLine(-.5,"Reduzir R$ 0,50"):scenarioLine(-2,"Reduzir R$ 2"));
  setText("price-scenario-current",scenarioLine(0,"Manter"));
  setText("price-scenario-higher",historical?scenarioLine(.5,"Aumentar R$ 0,50"):scenarioLine(2,"Aumentar R$ 2"));
  }
  const nextEnergy=energyYearOutlook(game);
  setText("energy-year-outlook",historical?
    "IPCA na virada "+nextEnergy.currentYear+" → "+nextEnergy.nextYear+
    ": "+(nextEnergy.changePercent>0?"+":"")+nextEnergy.changePercent.toLocaleString("pt-BR")+
    "% aplicado ao custo energético e às demais contas indexadas, mantendo as máquinas iguais.":
    "Energia na virada "+nextEnergy.currentYear+" → "+nextEnergy.nextYear+
    ": "+(nextEnergy.changePercent>0?"+":"")+nextEnergy.changePercent.toLocaleString("pt-BR")+
    "% de tarifa, mantendo os mesmos PCs e a carga ociosa. Demais contas fixas não recebem inflação automática.");
  if(retailControls&&adminOpen&&activeAdminTab==="prices"&&managementPanels.active("prices","retail")&&panelChanged("retail",[game.retailPrices],!liveOnly)){
   const nextRetail=document.createElement("div");
   for(const [item,label] of [["soda","Refrigerante"],["candy","Doce"],["snacks","Salgadinho"]] as const){
    const line=document.createElement("div");line.className="price-control";
    const name=document.createElement("span");name.textContent=label;name.insertAdjacentHTML("afterbegin",iconMarkup(item));
    const actions=document.createElement("div");actions.className="price-actions";
    for(const delta of [-1,1]){
      const button=document.createElement("button");button.type="button";button.dataset.item=item;
      button.dataset.delta=String(delta);button.textContent=delta<0?"−":"+";
      button.setAttribute("aria-label",(delta<0?"Reduzir ":"Aumentar ")+label);
      if(delta<0)button.disabled=productPrice(game,item)<=1;
      else button.disabled=productPrice(game,item)>=40;
      if(delta===1){
        const amount=document.createElement("strong");amount.textContent=money(productPrice(game,item));actions.append(amount);
      }
      actions.append(button);
    }
    line.append(name,actions);nextRetail.append(line);
   }
   const catalogLink=document.createElement("button");catalogLink.type="button";catalogLink.id="retail-full-catalog";catalogLink.className="slice";
   catalogLink.textContent="Ver todas as mercadorias e margens no Estoque";nextRetail.append(catalogLink);
   syncPanelChildren(retailControls,nextRetail);
  }
  const discPanel=document.getElementById("disc-copy-panel");
  if(discPanel)discPanel.hidden=!game.discCopier;
  if(discControls&&game.discCopier&&activeAdminTab==="prices"&&managementPanels.active("prices","discs")){
   const nextDiscs=document.createElement("div");
   for(const kind of ["cd","dvd"] as const){
    const row=document.createElement("div");row.className="price-control";
    const name=document.createElement("span");name.innerHTML=iconMarkup("disc");name.append("Cópia de "+kind.toUpperCase());
    const actions=document.createElement("div");actions.className="price-actions";
    for(const delta of [-1,1]){
     if(delta===1){const amount=document.createElement("strong");amount.textContent=inReais(game.discCopier.prices[kind]);actions.append(amount);}
     const b=document.createElement("button");b.type="button";b.className="slice";b.dataset.discKind=kind;b.dataset.delta=String(delta);b.textContent=delta<0?"−":"+";
     b.setAttribute("aria-label",(delta<0?"Reduzir":"Aumentar")+" preço da cópia de "+kind.toUpperCase());
     b.disabled=delta<0?game.discCopier.prices[kind]<=1:game.discCopier.prices[kind]>=MAX_DISC_PRICE;actions.append(b);
    }
    const cost=document.createElement("small");cost.className="disc-copy-cost";const margin=game.discCopier.prices[kind]-discMediaCost(game,kind);
    cost.textContent="Mídia: "+inReais(discMediaCost(game,kind))+" · resultado por cópia: "+inReais(margin)+(margin<0?" · este preço dá prejuízo":"");
    row.append(name,actions,cost);nextDiscs.append(row);
   }
   syncPanelChildren(discControls,nextDiscs);
   const copier=game.discCopier,report=discEconomy(game)!;
   setText("disc-copy-summary",copier.cdCopies+" CDs · "+copier.dvdCopies+" DVDs · faturamento "+inReais(copier.revenue)+" · mídias "+inReais(copier.expenses)+" · resultado operacional "+inReais(report.operatingResult)+" · "+
     (copier.walkIns??0)+(copier.walkIns===1?" cliente atendido":" clientes atendidos")+" exclusivamente para cópias.");
   setText("disc-copy-capacity",discCopiesToday(game)+" de "+DISC_COPIES_PER_DAY+" cópias feitas hoje. "+
     (report.fullyRecovered?"Investimento inicial recuperado; saldo líquido "+inReais(report.netAfterInvestment)+".":"Faltam "+inReais(report.remainingInvestment)+" para recuperar os R$ 900 da máquina.")+
     " Procura avulsa potencial: "+report.expectedWalkInAttemptsPerDay.toLocaleString("pt-BR")+" entradas/dia antes de filas, orçamento e capacidade; não são vendas garantidas.");
  }
  const printPanel=document.getElementById("print-service-panel");
  if(printPanel)printPanel.hidden=!game.printer;
  if(printControls&&game.printer&&activeAdminTab==="prices"&&managementPanels.active("prices","printing")){
   const nextPrint=document.createElement("div");
   const row=document.createElement("div");row.className="price-control";
   const label=document.createElement("span");label.textContent="Preço por página";
   const actions=document.createElement("div");actions.className="price-actions";
   const printStep=game.economyVersion===2?.5:1;
   for(const delta of [-printStep,printStep]){
    if(delta>.0){const amount=document.createElement("strong");amount.textContent=inReais(game.printer.price);actions.append(amount);}
    const button=document.createElement("button");button.type="button";button.className="slice";
    button.dataset.printDelta=String(delta);button.textContent=delta<0?"−":"+";
    button.disabled=delta<0?game.printer.price<=(game.economyVersion===2?.5:1):game.printer.price>=PRINT_MAX_PRICE;
    button.setAttribute("aria-label",(delta<0?"Reduzir":"Aumentar")+" preço da impressão");
    actions.append(button);
   }
   const expense=document.createElement("small");expense.className="disc-copy-cost";
   const printMargin=game.printer.price-printPaperInkCost(game);
   expense.textContent="Papel e tinta: "+inReais(printPaperInkCost(game))+" por página · margem: "+inReais(printMargin)+
     (printMargin<0?" · atenção: este preço dá prejuízo":printMargin===0?" · sem margem para recuperar a máquina":"");
   row.append(label,actions,expense);nextPrint.append(row);syncPanelChildren(printControls,nextPrint);
   const report=printEconomy(game)!;
   setText("print-service-summary",game.printer.pages+" páginas realizadas · faturamento "+inReais(game.printer.revenue)+
     " · materiais "+inReais(game.printer.expenses)+" · resultado operacional "+inReais(report.operatingResult)+
     " · "+(game.printer.walkIns??0)+(game.printer.walkIns===1?" cliente atendido":" clientes atendidos")+" exclusivamente para imprimir.");
   setText("print-service-capacity",pagesPrintedToday(game)+" de 35 páginas hoje. "+
     (report.fullyRecovered?"Investimento inicial recuperado; saldo líquido "+inReais(report.netAfterInvestment)+".":"Faltam "+inReais(report.remainingInvestment)+" para recuperar os R$ 320 da impressora.")+
     " Procura avulsa potencial: "+report.expectedWalkInAttemptsPerDay.toLocaleString("pt-BR")+" entradas/dia antes de filas, orçamento e capacidade; não são vendas garantidas.");
  }
  if(adminOpen&&activeAdminTab==="stock")merchandisePanel.render();
  setText("supplier-status",supplierLevel(game)===2?"Fornecedor parceiro · 20% de desconto nos novos lotes":"Fornecedor básico · preços de atacado normais");
  const supplierButton=document.querySelector<HTMLButtonElement>("#supplier-up");
  if(supplierButton)supplierButton.disabled=supplierLevel(game)===2;
  setText("stock-soda"," + Bebidas R$ "+wholesaleCost(game,"soda"));
  setText("stock-candy","+ Doces R$ "+wholesaleCost(game,"candy"));
  setText("stock-snacks","+ Salgados R$ "+wholesaleCost(game,"snacks"));
  setText("internet", internetName()+" · Nível "+game.internetTier+(online(game)?" · Online":" · Sem conexão até "+(game.offlineUntil-game.totalMinutes)+" min de jogo"));
  const internetUp=document.querySelector<HTMLButtonElement>("#internet-up");
  if(internetUp){
    const next=INTERNET_ERAS[game.internetTier];
    internetUp.disabled=!next || year<next.year || game.cash<250*game.internetTier;
    internetUp.textContent=!next?"Internet no nível máximo":next.name+" · "+(year<next.year?"🔒 Disponível em "+next.year:"R$ "+(250*game.internetTier));
  }
  const repair=document.querySelector<HTMLButtonElement>("#internet-repair");
  if(repair){repair.disabled=online(game);repair.textContent="Chamar técnico · R$ "+(75+25*(game.internetTier-1));}
  const broken=Array.from({length:pcCount(game)},(_,i)=>i).filter(i=>pcBroken(game,i)).length;
  const poweredOff=Array.from({length:pcCount(game)},(_,i)=>i).filter(i=>!stationPoweredOn(game,i)).length;
  setText("pc", pcCount(game)+" computadores · "+game.customers.filter(c=>c.stage==="using").length+" ocupados · "+poweredOff+" desligados · "+broken+" em manutenção");
  const stationLedgerRows=document.querySelector<HTMLTableSectionElement>("#station-ledger-rows");
  if(stationLedgerRows&&adminOpen&&activeAdminTab==="computers"&&managementPanels.active("computers","ledger")){
    const rows:HTMLTableRowElement[]=[];
    const currency=(value:number):string=>value.toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
    for(let i=0;i<pcCount(game);i++){
      const account=stationAccountingSummary(game,i);
      const row=document.createElement("tr");
      const cells=[
        "PC "+(i+1),String(account.sessions),String(account.vipSessions),
        Math.floor(account.occupiedMinutes).toLocaleString("pt-BR"),
        currency(account.sessionRevenue),currency(account.energyShare),
        currency(account.sessionRevenue-account.energyShare)
      ];
      for(let j=0;j<cells.length;j++){
        const cell=j===0?document.createElement("th"):document.createElement("td");
        if(j===0)(cell as HTMLTableCellElement).scope="row";
        cell.textContent=cells[j]!;
        row.append(cell);
      }
      rows.push(row);
    }
    const next=document.createElement("tbody");next.append(...rows);syncPanelChildren(stationLedgerRows,next);
  }
  const liveMaintenance=document.getElementById("pc-maintenance");
  if(liveMaintenance&&adminOpen&&activeAdminTab==="computers"&&!managementPanels.active("computers","ledger")&&panelChanged("computers",[managementPanels.current("computers"),selectedLcdPc,selectedHardwareTab,stationRevision,managementPanels.active("computers","operations")?game.pcWear?.map(Math.round):null],!liveOnly)){
    const page=managementPanels.current("computers");
    // Build offscreen; update the existing controls without collapsing the panel
    // or disconnecting the focused category on every sale/wear refresh.
    const maintenance=document.createElement("div");
    const focused=document.activeElement;
    const lcdFocus=focused instanceof HTMLButtonElement&&liveMaintenance.contains(focused)
      ?focused.id?'#'+focused.id:focused.dataset.lcdBuy!==undefined?'[data-lcd-buy="'+focused.dataset.lcdBuy+'"]'
      :focused.dataset.lcdSelect!==undefined?'[data-lcd-select="'+focused.dataset.lcdSelect+'"]':null:null;
    if(page==="operations"){
    const header=document.createElement("strong");header.textContent="Operação e manutenção por computador";maintenance.replaceChildren(header);
    const powerHint=document.createElement("p");powerHint.className="station-power-hint";
    powerHint.textContent="Desligue uma estação livre para economizar energia e instalar melhorias. Religue para receber clientes.";
    maintenance.append(powerHint);
    for(let i=0;i<pcCount(game);i++){
      const wear=pcWear(game,i);
      const line=document.createElement("div");
      const isOn=stationPoweredOn(game,i),busy=stationHasCustomer(game,i);
      line.dataset.panelKey="operation-"+i;
      line.className="pc-operation"+(isOn?"":" is-powered-off");
      const label=document.createElement("span");
      label.textContent="PC "+(i+1)+" · "+(isOn?"LIGADO":"DESLIGADO")+" · desgaste "+Math.round(wear)+"%"+(pcBroken(game,i)?" · MANUTENÇÃO":"");
      const power=document.createElement("button");power.type="button";power.dataset.pcPower=String(i);
      power.id="pc-power-"+i;power.className="pc-power-toggle";power.textContent=isOn?"Desligar estação":"Ligar estação";
      power.disabled=isOn?busy:!!game.repairJobs?.some(j=>j.pc===i&&j.phase!=="leaving");
      power.title=isOn&&busy?"Aguarde o cliente sair para desligar.":isOn?"Economize energia e libere atualizações.":"Religue para receber clientes.";
      const repair=document.createElement("button");repair.type="button";repair.dataset.pcRepair=String(i);
      const job=game.repairJobs?.find(j=>j.pc===i);
      repair.textContent=job?"Técnico · "+workPhaseLabel("technician",job)+(job.phase==="working"?" · "+Math.floor(job.progress/job.duration*100)+"%":""):
     employeeHired(game,"technician")?"Solicitar reparo · equipe contratada":"Chamar técnico avulso · "+money(serviceVisitCost(game,"repair",wear));
      repair.disabled=wear<1||!!job||game.customers.some(c=>c.pcIndex===i&&["using","sitting","standing","to_pc"].includes(c.stage));
      if(job){const meter=document.createElement("progress");meter.max=job.duration;meter.value=job.progress;meter.setAttribute("aria-label","Reparo do PC "+(i+1));line.append(meter);}
      const upgrade=document.createElement("button");upgrade.type="button";upgrade.dataset.pcUpgrade=String(i);
      const tier=game.pcTiers?.[i]??1;
      const hardwareYear=tier===1?2000:2003;
      upgrade.textContent=tier>=3?"Ver Peças e configuração":("Kit CRT "+hardwareYear+" · "+(year<hardwareYear?"🔒 "+hardwareYear:"R$ "+(tier*240)));
      upgrade.disabled=tier>=3||year<hardwareYear||game.cash<tier*240||isOn||busy||!!job;
      label.textContent+=" · hardware nível "+tier;
      line.append(label,power,repair,upgrade);maintenance.appendChild(line);
    }
    }
    selectedLcdPc=Math.min(selectedLcdPc,pcCount(game)-1);
    if(page==="hardware"||page==="windows")maintenance.append(renderHardwarePanel(game,selectedLcdPc,year,selectedHardwareTab,page));
    if(page==="monitors"){
    const kits=document.createElement("section");kits.className="lcd-upgrades";
    const title=document.createElement("h3");title.textContent="Da era CRT aos LCDs";
    const hint=document.createElement("p");hint.className="lcd-note";
    hint.textContent="Escolha a estação para renovar. Kits exigem hardware nível 3. Novas gerações chegam com os anos; a troca custa o valor integral e preserva GPU, licenças e desgaste.";
    const choices=document.createElement("nav");choices.className="gpu-stations";choices.setAttribute("aria-label","Estação para instalar kit LCD");
    for(let i=0;i<pcCount(game);i++){
      const choice=document.createElement("button");choice.type="button";choice.dataset.lcdSelect=String(i);
      choice.className="gpu-station"+(selectedLcdPc===i?" selected":"");choice.textContent="PC "+(i+1);
      choice.setAttribute("aria-pressed",String(selectedLcdPc===i));choices.append(choice);
    }
    const current=lcdSpec(installedLcd(game,selectedLcdPc));
    const installed=document.createElement("p");installed.className="lcd-note";
    installed.textContent="PC "+(selectedLcdPc+1)+" · instalado: "+stationModelName(game,selectedLcdPc)+" · ano "+year;
    installed.dataset.lcdCurrent="";
    const catalog=document.createElement("section");catalog.className="lcd-catalog";
    for(const model of LCD_CATALOG){
      const locked=year<model.year,owned=current?.id===model.id,older=!!current&&current.year>model.year;
      const busy=stationOccupied(game,selectedLcdPc)||!!game.repairJobs?.some(job=>job.pc===selectedLcdPc);
      const isOn=stationPoweredOn(game,selectedLcdPc);
      const needsHardware=(game.pcTiers?.[selectedLcdPc]??1)<3;
      const card=document.createElement("article");card.className="lcd-card"+(locked?" lcd-locked":"");
      const art=document.createElement("img");art.src=lcdPreview(model.id);art.alt="Estação "+model.name;art.width=320;art.height=190;
      const info=document.createElement("div");info.className="gpu-info";
      const name=document.createElement("strong");name.textContent=model.year+" · "+model.name;
      const description=document.createElement("small");description.textContent=model.description;
      const benefit=document.createElement("small");
      benefit.textContent="Satisfação +"+Math.round((model.bonus-(current?.bonus??0))*1000)/10+" p.p. · economia de energia em relação ao CRT.";
      if(owned||older)benefit.textContent="Satisfação do kit: +"+Math.round(model.bonus*1000)/10+" p.p. em relação ao CRT.";
      const buy=document.createElement("button");buy.type="button";buy.dataset.lcdBuy=model.id;
      buy.textContent=owned?"Instalado":older?"Geração anterior":locked?"🔒 Chega em "+model.year:needsHardware?"Requer hardware 3":busy?"Estação ocupada":isOn?"Desligue a estação":game.cash<model.cost?"Caixa insuficiente · R$ "+model.cost:"Instalar · R$ "+model.cost;
      buy.disabled=owned||older||locked||needsHardware||busy||isOn||game.cash<model.cost;
      info.append(name,description,benefit,buy);card.append(art,info);catalog.append(card);
    }
    kits.append(title,hint,choices,installed,catalog);maintenance.append(kits);
    }
    presentComputerOperations(computerOperationsSnapshot(game),maintenance);
    decorateControls(maintenance);
    syncPanelChildren(liveMaintenance,maintenance);
    if(lcdFocus&&(!(focused instanceof HTMLButtonElement)||!focused.isConnected||focused.disabled)){
      const restored=liveMaintenance.querySelector<HTMLButtonElement>(lcdFocus);
      const fallback=lcdFocus.startsWith("#hardware-")?liveMaintenance.querySelector<HTMLButtonElement>("#hardware-select-"+selectedLcdPc):liveMaintenance.querySelector<HTMLButtonElement>('.lcd-upgrades [aria-pressed="true"]');
      (restored&&!restored.disabled?restored:fallback)?.focus({preventScroll:true});
    }
  }
  if(gpuPcChoice&&gpuList&&adminOpen&&activeAdminTab==="gpus"&&panelChanged("gpuPcChoice",[stationRevision,selectedGpuPc],!liveOnly)){
    selectedGpuPc=Math.min(selectedGpuPc,pcCount(game)-1);
    const nextGpuChoice=document.createElement("div");const nextGpuList=document.createElement("div");
    for(let i=0;i<pcCount(game);i++){
      const control=document.createElement("button");control.type="button";
      control.dataset.gpuSelect=String(i);
      control.className="gpu-station"+(selectedGpuPc===i?" selected":"");
      control.textContent="PC "+(i+1)+(stationPoweredOn(game,i)?" · ligado":" · desligado")+(installedGpu(game,i)?" · GPU":" · sem GPU");
      control.setAttribute("aria-pressed",String(selectedGpuPc===i));
      nextGpuChoice.append(control);
    }
    const current=gpuSpec(installedGpu(game,selectedGpuPc));
    setText("gpu-replacement-note",current
      ?"PC "+(selectedGpuPc+1)+": "+current.name+" instalada. Trocar custa o valor integral da nova placa e substitui a antiga sem desconto. Compare o ganho adicional indicado em cada cartão."
      :"PC "+(selectedGpuPc+1)+" sem GPU dedicada. Cada compra acrescenta satisfação e consumo ao computador selecionado.");
    for(const model of GPU_CATALOG){
      const locked=year<model.year,owned=current?.id===model.id;
      const obsolete=!!current&&current.year>=model.year&&!owned;
      const card=document.createElement("article");card.className="gpu-card"+(locked?" gpu-locked":"");
      const art=document.createElement("img");art.src="./assets/gpu/"+model.id+".svg";
      art.alt="Placa de vídeo "+model.name+" com circuito, dissipador e ventilador";art.loading="lazy";
      const info=document.createElement("div");info.className="gpu-info";
      const title=document.createElement("strong");title.textContent=model.name+" · "+model.year;
      const gain=Math.max(0,model.bonus-(current?.bonus??0));
      const num=(value:number)=>value.toFixed(3).replace(".",",");
      const details=document.createElement("small");
      const neededPsu=requiredPsuWatts(hardwareFor(game,selectedGpuPc),model.id);
      const powerOk=buildParts(hardwareFor(game,selectedGpuPc)).psu.watts!>=neededPsu;
      details.textContent="R$ "+model.cost+" · bônus de satisfação "+num(model.bonus)+
        " · ganho adicional "+num(gain)+" · consumo relativo "+num(model.power)+" · fonte necessária "+neededPsu+" W";
      const button=document.createElement("button");button.type="button";button.className="slice";
      button.dataset.gpuBuy=model.id;
      button.textContent=locked?"🔒 Disponível em "+model.year:owned?"Instalada":obsolete?"Modelo anterior":!powerOk?"Requer fonte de "+neededPsu+" W":"Comprar · R$ "+model.cost;
      button.disabled=locked||owned||obsolete||!powerOk||stationPoweredOn(game,selectedGpuPc)||stationOccupied(game,selectedGpuPc)||!!game.repairJobs?.some(j=>j.pc===selectedGpuPc)||game.cash<model.cost;
      info.append(title,details,button);card.append(art,info);nextGpuList.append(card);
    }
   syncPanelChildren(gpuPcChoice,nextGpuChoice);
   syncPanelChildren(gpuList,nextGpuList);
  }
  const basicLicensePrice=basicGamesLicenseCost(game);
  setText("license-status",game.licensedGames
    ?"Jogos regularizados · licença permanente, sem renovação anual."
    :"Catálogo sem regularização — risco de multa. Taxa única: "+inCurrency(basicLicensePrice)+".");
  const basicLicenseButton=document.querySelector<HTMLButtonElement>("#license");
  if(basicLicenseButton){
    basicLicenseButton.hidden=game.licensedGames;
    basicLicenseButton.disabled=game.cash<basicLicensePrice;
    basicLicenseButton.textContent="Regularizar jogos · "+inCurrency(basicLicensePrice);
  }
  if(licensePanel&&adminOpen&&activeAdminTab==="licenses"&&managementPanels.active("licenses","windows")&&panelChanged("licensePanel",[stationRevision],!liveOnly)){
    const nextWindows=document.createElement("div");
    for(let i=0;i<pcCount(game);i++){
      const line=document.createElement("div");line.className="price-control";
      const title=document.createElement("strong");
      const edition=WINDOWS_ERAS.find(w=>w.id===installedWindows(game,i))!;
      const isLicensed=game.pcWindowsLicenses?.[i]===true;
      title.textContent="PC "+(i+1)+" · "+edition.name+(isLicensed?" · licenciado":" · sem licença");
      const choices=document.createElement("div");choices.className="action-row wrap";
      for(const item of WINDOWS_ERAS){
        const btn=document.createElement("button");btn.type="button";btn.className="slice";
        btn.dataset.winPc=String(i);btn.dataset.winEdition=item.id;
        const already=isLicensed&&edition.id===item.id;
        const reasons=windowsHardwareIssues(game,i,item.id);
        btn.textContent=item.name+" · "+(year<item.year?"🔒 "+item.year:already?"Instalado":"R$ "+item.cost);
        btn.disabled=year<item.year||already||game.cash<item.cost||reasons.length>0||stationPoweredOn(game,i)||stationOccupied(game,i)||!!game.repairJobs?.some(j=>j.pc===i);
        btn.title=reasons.join(" ");
        choices.appendChild(btn);
      }
      line.append(title,choices);nextWindows.appendChild(line);
    }
   syncPanelChildren(licensePanel,nextWindows);
  }
  if(eraGamePanel&&adminOpen&&activeAdminTab==="licenses"&&managementPanels.active("licenses","classic")&&panelChanged("eraGamePanel",[year,stationRevision,game.licensedGames,game.licensedEraGames,game.ericSecondMailDelivered],!liveOnly)){
    const nextEraGames=document.createElement("div");
    const owned=game.licensedEraGames??[];
    const summary=document.createElement("p");summary.className="era-game-summary";
    const visibleTitles=ERA_GAME_CATALOG.filter(title=>title.year<=1999||
      (year>=2000&&multiplayerGameKnown(game)));
    summary.textContent=owned.length+" de "+visibleTitles.length+" títulos licenciados · bônus atual de procura: +"+(Math.round((eraGameVisitorMultiplier(game)-1)*10000)/100).toLocaleString("pt-BR")+"%. Novidades atraem mais; títulos antigos conservam 25% de apelo nostálgico. Licenças permanentes.";
    nextEraGames.append(summary);
    for(const releaseYear of [1998,1999,...(year>=2000&&multiplayerGameKnown(game)?[2000]:[])]){
      const section=document.createElement("section");section.className="era-game-section";
      const groupTitle=document.createElement("h4");
      const titles=ERA_GAME_CATALOG.filter(title=>title.year===releaseYear);
      groupTitle.textContent=releaseYear+" · "+titles.filter(title=>owned.some(id=>id===title.id)).length+" de "+titles.length+" jogos";
      const grid=document.createElement("div");grid.className="era-game-grid";
      for(const title of titles){
        const quote=quoteEraGame(game,title.id),bought=owned.some(id=>id===title.id),locked=year<title.year;
        const multiplayer=title.id===ERIC_MULTIPLAYER_GAME_ID;
        const card=document.createElement("article");card.className="era-game-card"+(locked?" era-game-locked":"")+(bought?" era-game-owned":"");
        const cover=document.createElement("div");cover.className="era-game-cover";cover.dataset.theme=title.theme;
        const release=document.createElement("small");release.className="era-cover-release";release.textContent="SOFTDOWN · "+title.year;
        const symbol=document.createElement("span");symbol.className="era-cover-symbol";symbol.setAttribute("aria-hidden","true");symbol.textContent=title.symbol;
        const coverName=document.createElement("strong");coverName.className="era-cover-title";coverName.textContent=title.name;
        const genre=document.createElement("small");genre.className="era-cover-genre";genre.textContent=title.genre+" · EDIÇÃO PC";
        cover.append(release,symbol,coverName,genre);
        const details=document.createElement("div");details.className="era-game-details";
        const name=document.createElement("strong");name.textContent=title.name;
        const info=document.createElement("p");info.textContent=title.description;
        const meta=document.createElement("small");
       meta.textContent=title.genre+" · "+title.year+" · licença da lan house · R$ "+title.cost+
        " · "+(locked?"popularidade no lançamento: 100%":"popularidade em "+year+": "+gamePopularityPercent(title.year,year)+"%");
        const status=document.createElement("small");status.className="era-game-status";
        status.textContent=(bought?"✓ Licença permanente":quote.ok?"Pronto para licenciar":quote.message)+
        (locked?"":" · potencial de procura por título: +"+(gamePopularityPercent(title.year,year)*.015).toLocaleString("pt-BR",{maximumFractionDigits:3})+"% (com Windows licenciado)");
        if(multiplayer)status.textContent+=" · PCs aptos agora: "+multiplayerEligiblePcs(game).length+" (mínimo 2).";
        const button=document.createElement("button");button.type="button";button.className="slice";button.dataset.eraGameBuy=title.id;
        button.textContent=bought?"✓ Licenciado":locked?"🔒 Chega em "+title.year:quote.ok?"Licenciar · R$ "+title.cost:"Indisponível";
        button.disabled=!quote.ok;button.title=quote.message;
        details.append(name,info,meta,status,button);card.append(cover,details);grid.append(card);
      }
      section.append(groupTitle,grid);nextEraGames.append(section);
    }
   syncPanelChildren(eraGamePanel,nextEraGames);
  }
  if(gpuGamePanel&&adminOpen&&activeAdminTab==="licenses"&&managementPanels.active("licenses","gpu")&&panelChanged("gpuGamePanel",[year,stationRevision,game.licensedGames,game.licensedGpuGames,game.pcPoweredOff,game.gpuGameInstalls,game.gpuGameInstallJobs?.map(j=>[j.pc,j.id,j.durationMinutes]),game.gpuGameDemand,online(game)],!liveOnly)){
    const nextGpuGames=document.createElement("div");
    if(game.gpuGameInstallJobs?.length){
      const overview=document.createElement("section");
      overview.className="gpu-download-overview";
      overview.setAttribute("aria-label","Downloads de jogos em andamento");
      const title=document.createElement("strong");
      title.textContent="Downloads em andamento · "+game.gpuGameInstallJobs.length;
      const intro=document.createElement("p");
      intro.textContent="O progresso continua com o painel fechado. Cancele aqui mesmo se a GPU ou o Windows deixar de ser compatível.";
      const bandwidth=document.createElement("p");
      bandwidth.dataset.gpuBandwidth="";
      overview.append(title,intro,bandwidth);
      for(const job of [...game.gpuGameInstallJobs].sort((a,b)=>a.pc-b.pc)){
       const record=document.createElement("div");record.className="gpu-download-entry";
       const spec=GPU_GAME_CATALOG.find(x=>x.id===job.id);
       const heading=document.createElement("span");
       heading.textContent="PC "+(job.pc+1)+" · "+(spec?.name??"Jogo avançado");
       const label=document.createElement("small");
       label.className="catalog-game-note";
       label.dataset.gpuDownloadStatus=job.id;
       label.dataset.gpuGamePc=String(job.pc);
       const meter=document.createElement("progress");
       meter.max=job.durationMinutes;meter.value=job.elapsedMinutes;
       meter.dataset.gpuDownloadProgress=job.id;
       meter.dataset.gpuGamePc=String(job.pc);
       meter.setAttribute("aria-label","Resumo do download no PC "+(job.pc+1));
       const cancel=document.createElement("button");
       cancel.type="button";cancel.className="slice";
       cancel.dataset.gpuGameCancel=job.id;
       cancel.dataset.gpuGamePc=String(job.pc);
       cancel.textContent="Cancelar · PC "+(job.pc+1);
       record.append(heading,label,meter,cancel);
       overview.append(record);
      }
      nextGpuGames.append(overview);
    }
    if(game.economyVersion!==2||year<2005){
      const note=document.createElement("p");
      note.textContent=game.economyVersion!==2
       ?"Os jogos com GPU são um recurso do modo histórico."
       :"Novos jogos que exigem placa de vídeo chegam em 2005.";
      nextGpuGames.append(note);
    }else for(const title of GPU_GAME_CATALOG){
      const card=document.createElement("div");card.className="price-control";
      const heading=document.createElement("strong");
      heading.textContent=title.name+" · "+title.year;
      const requirements=document.createElement("p");requirements.className="catalog-game-note";
      const gpu=GPU_CATALOG.find(x=>x.id===title.minGpu);
      const os=WINDOWS_ERAS.find(x=>x.id===title.minWindows);
      requirements.textContent="Requer GPU "+(gpu?.name??title.minGpu)+
       " ou superior e "+(os?.name??title.minWindows)+" licenciado.";
      const quote=quoteGpuGame(game,title.id);
      const status=document.createElement("p");status.className="catalog-game-note";
      const bought=game.licensedGpuGames?.includes(title.id)===true;
      status.textContent=(bought?"Licenciado. ":quote.message+" ")+
       (quote.eligiblePcs.length
        ?"Compatível com PC(s) "+quote.eligiblePcs.map(i=>i+1).join(", ")+"."
        :"Nenhuma máquina compatível ainda.")+
       " Adicional máximo de R$ "+title.hourlyBonus.toFixed(2)+
       "/h, somente para clientes de jogos avançados e dentro do teto anual."+
       (year>=title.year?" Popularidade atual: "+gamePopularityPercent(title.year,year)+
       "% · procura adicional efetiva: +"+(gpuGameAttraction(game,title.id)*100).toLocaleString("pt-BR",{maximumFractionDigits:3})+
       "% (requer jogo licenciado, instalado e PC compatível ligado).":"");
      if(bought&&quote.eligiblePcs.length){
        const enabled=quote.eligiblePcs.filter(i=>gpuGameInstalledOnPc(game,i,title.id));
        status.textContent+=enabled.length
         ?" Instalado no(s) PC(s) "+enabled.map(i=>i+1).join(", ")+
          ". Valor atual por hora: "+
          enabled.map(i=>"PC "+(i+1)+" R$ "+gpuGameHourlyRate(game,i,title.id).toFixed(2)).join(" · ")+"."
         :" Nenhuma instalação ativa. Use os botões abaixo para instalar o jogo.";
      }
      const action=document.createElement("button");
      action.type="button";action.className="slice";action.dataset.gpuGameBuy=title.id;
      action.textContent=bought?"Licenciado":year<title.year
       ?"🔒 Disponível em "+title.year:"Licenciar · R$ "+title.cost;
      action.disabled=!quote.ok;
      action.title=quote.ok?"Licença para todo o estabelecimento, uso restrito a máquinas compatíveis.":quote.message;
      const measured=document.createElement("p");measured.className="catalog-game-note";
      const observed=gpuDemandReport(game).find(row=>row.id===title.id)!;
      measured.textContent=observed.requested
       ?"Procura observada: "+observed.requested+" pedidos · "+observed.played+
         " sessões no título · "+observed.basic+" sessões comuns · "+
         observed.withoutSession+" pedidos sem sessão concluída · adicional recebido "+
         observed.premiumRevenue.toLocaleString("pt-BR",{style:"currency",currency:"BRL"})+"."
       :"Procura observada: nenhum pedido registrado nesta partida.";
      const coverage=gpuLicenseCoverage(game,title.id);
      const payback=document.createElement("p");payback.className="catalog-game-note";
      if(coverage){
       const moneyPaid=(value:number)=>value.toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
       payback.textContent="Cobertura da licença por adicionais recebidos: "+
        moneyPaid(coverage.premiumRevenue)+" de "+moneyPaid(coverage.licenseCost)+
        " ("+coverage.coveragePercent.toLocaleString("pt-BR")+"%). "+
        (coverage.covered?"Os adicionais igualaram o custo nominal da licença.":
         "Faltam "+moneyPaid(coverage.remaining)+" em adicionais para igualar apenas a licença.")+
        " Não inclui GPU, Windows, energia ou demais despesas; não é lucro.";
      }
      card.append(heading,requirements,status,measured);
      if(coverage)card.append(payback);
      card.append(action);
      if(bought&&quote.eligiblePcs.length){
       const stations=document.createElement("div");stations.className="action-row wrap";
       stations.setAttribute("aria-label","Instalações de "+title.name+" por computador");
       for(const i of quote.eligiblePcs){
        const installed=gpuGameInstalledOnPc(game,i,title.id);
        const job=gpuGameInstallJob(game,i);
        const downloading=job?.id===title.id;
        const control=document.createElement("button");
        control.type="button";control.className="slice";
        if(downloading)control.dataset.gpuGameCancel=title.id;
        else control.dataset.gpuGameInstall=title.id;
        control.dataset.gpuGamePc=String(i);
        control.textContent=downloading?"Cancelar download PC "+(i+1):
         (installed?"Remover do PC ":"Instalar no PC ")+(i+1);
        const blocked=!stationPoweredOn(game,i)?"Ligue o computador para alterar os jogos.":
         stationHasCustomer(game,i)?"Aguarde o cliente sair do PC.":
         game.repairJobs?.some(j=>j.pc===i&&j.phase!=="leaving")?"Aguarde a manutenção concluir.":"";
        control.disabled=!downloading&&(!!blocked||!!job);
        control.title=downloading?"Cancelar a instalação sem custo, preservando a licença.":blocked||
         (job?"Aguarde o download atual deste PC.":"Instalação e remoção gratuitas; a licença pertence à lan house.");
        stations.append(control);
        if(downloading){
         const status=document.createElement("span");status.className="catalog-game-note";
         status.dataset.gpuDownloadStatus=title.id;
         status.dataset.gpuGamePc=String(i);
         const bar=document.createElement("progress");
         bar.max=job.durationMinutes;bar.value=job.elapsedMinutes;
         bar.dataset.gpuDownloadProgress=title.id;
         bar.dataset.gpuGamePc=String(i);
         bar.setAttribute("aria-label","Download de "+title.name+" no PC "+(i+1));
         stations.append(status,bar);
        }
       }
       const pending=quote.eligiblePcs.filter(i=>!gpuGameInstalledOnPc(game,i,title.id));
       if(pending.length){
        const ready=pending.filter(i=>!gpuGameInstallJob(game,i)&&stationPoweredOn(game,i)&&!stationHasCustomer(game,i)&&
         !game.repairJobs?.some(j=>j.pc===i&&j.phase!=="leaving"));
        const bulk=document.createElement("button");bulk.type="button";bulk.className="slice";
        bulk.dataset.gpuGameInstallAll=title.id;
        bulk.textContent="Instalar nos PCs disponíveis ("+ready.length+"/"+pending.length+")";
        bulk.disabled=ready.length===0;
        bulk.title=ready.length?"Distribuir sem cobrança. PCs ocupados/desligados ficam para depois.":
         "Aguarde PCs livres, ligados e fora de manutenção.";
        stations.append(bulk);
       }
       card.append(stations);
      }
      nextGpuGames.append(card);
    }
   syncPanelChildren(gpuGamePanel,nextGpuGames);
  }
  refreshGpuDownloadMeters();
  if(activeAdminTab==="consoles"){
  const ps1Area=document.getElementById("ps1-stations");
  const consoleReady=game.economyVersion===2&&year>=PS1_UNLOCK_YEAR;
  setText("ps1-overview",!consoleReady?
    "Disponível a partir de 2002. Compre um conjunto com TV de tubo, PS1, bancada e cadeira na loja.":
    "Bancadas instaladas: "+(game.ps1Stations?.length??0)+"/"+PS1_MAX_STATIONS+
    " · sessões atendidas: "+(game.ps1Sessions??0)+
    " · receita acumulada: "+money(game.ps1Revenue??0)+
    ". Segunda cadeira opcional por bancada: até dois jogadores simultâneos, "+
    "cada cliente paga sua sessão. Internet não é necessária para jogar.");
  setText("ps1-hourly",ps1HourPrice(game).toLocaleString("pt-BR",{style:"currency",currency:"BRL"})+"/h");
  const ownedDiscs=PS1_CD_CATALOG.reduce((sum,disc)=>sum+ps1DiscCopies(game,disc.id),0);
  const readyStations=(game.ps1Stations??[]).filter((_,i)=>ps1PlayableDisc(game,i)!==null).length;
  setText("ps1-disc-summary",(game.ps1Stations?.length??0)===0?
    "Compre a primeira bancada na loja. Depois, adquira os CDs físicos.":
    ownedDiscs===0?"Sem CDs no acervo: as bancadas não recebem clientes até você comprar pelo menos um jogo.":
    "CDs no acervo: "+ownedDiscs+" · Bancadas com jogo: "+readyStations+"/"+
    (game.ps1Stations?.length??0)+". Cada CD comprado atende uma bancada por vez.");
  for(const id of ["ps1-price-down","ps1-price-up"]){
   const button=document.getElementById(id) as HTMLButtonElement|null;
   if(button)button.disabled=!consoleReady||!(game.ps1Stations?.length)||
    (id==="ps1-price-down"?ps1HourPrice(game)<=.5:
     ps1HourPrice(game)>=ps1AllowedHourlyCeiling(game));
  }
  if(ps1Area&&adminOpen&&activeAdminTab==="consoles"&&managementPanels.active("consoles","stations")){
   ps1Area.replaceChildren();
   if(!(game.ps1Stations?.length)){const empty=document.createElement("p");empty.textContent=consoleReady?"Compre a primeira bancada na loja para receber clientes de videogame.":"As bancadas de PlayStation chegam em 2002.";ps1Area.append(empty);}
   for(const [index,station] of (game.ps1Stations??[]).entries()){
    const card=document.createElement("div");card.className="ps1-station-summary";
    const text=document.createElement("span");
    const busy=game.customers.filter(c=>c.ps1StationIndex===index&&
      ["to_pc","sitting","using","standing"].includes(c.stage));
    const occupied=busy.length>0;
    const cdId=ps1PlayableDisc(game,index);
    const cdName=PS1_CD_CATALOG.find(x=>x.id===cdId)?.title??"Nenhum CD";
    text.textContent="Bancada "+(index+1)+" · vagas: "+busy.length+"/"+(station.secondSeat?2:1)+
     " · controles: "+Math.round(station.wear)+"% de desgaste"+
     (station.wear>=100?" · Precisa de manutenção":occupied?" · Em uso":
      cdId?" · Livre":" · Sem jogo")+
     (station.secondSeat&&ps1OpenSeat(game,index)!==null?" · Aceita outro jogador":"")+
     " · Disco: "+cdName;
    const button=document.createElement("button");button.className="slice";
    button.dataset.ps1Repair=String(index);button.type="button";
    button.textContent="Revisar controles · R$ 45";
    button.disabled=occupied||station.wear<10||game.cash<45;
    const cdLabel=document.createElement("label");cdLabel.className="ps1-station-cd-label";
    cdLabel.textContent="CD inserido";
    const selector=document.createElement("select");selector.className="slice";
    selector.dataset.ps1Slot=String(index);selector.disabled=occupied;
    const empty=document.createElement("option");empty.value="";empty.textContent="Sem CD";
    selector.append(empty);
    for(const disc of PS1_CD_CATALOG){
     const copies=ps1DiscCopies(game,disc.id);
     if(!copies)continue;
     const used=(game.ps1Stations??[]).filter((st,i)=>i!==index&&st.discId===disc.id).length;
     if(used>=copies&&station.discId!==disc.id)continue;
     const option=document.createElement("option");option.value=disc.id;
     option.textContent=disc.title+" ("+copies+" cópia"+(copies===1?"":"s")+")";
     selector.append(option);
    }
    selector.value=station.discId??"";
    cdLabel.append(selector);
    const extra=document.createElement("button");extra.className="slice";
    extra.dataset.ps1SecondSeat=String(index);extra.type="button";
    const secondPrice=ps1SecondSeatPrice(game);
    extra.textContent=station.secondSeat?"Modo dupla instalado · 2 cadeiras":
      "Instalar segunda cadeira + controle · "+money(secondPrice);
    extra.disabled=!!station.secondSeat||occupied||game.cash<secondPrice;
    card.append(text,cdLabel,button,extra);ps1Area.append(card);
   }
  }
  }
  if(activeAdminTab==="services"){
  const cleanerHired=employeeHired(game,"cleaner"),technicianHired=employeeHired(game,"technician");
   for(const [id,role,label] of [["clean-bins","cleaner","faxineiro"],["hire-technician","technician","técnico"]] as const){
    const el=document.querySelector<HTMLButtonElement>("#"+id);
    if(el)el.textContent=employeeHired(game,role)?"Dispensar "+label:
      "Contratar "+label+" · "+money(employeeDailyWage(game,role))+"/dia trabalhado";
   }
   setText("staff-summary","Equipe: faxineiro "+(cleanerHired?"contratado":"não contratado")+
     " · técnico "+(technicianHired?"contratado":"não contratado")+
     " · folha acumulada "+money(wages)+". Diárias: faxineiro "+money(employeeDailyWage(game,"cleaner"))+
     ", técnico "+money(employeeDailyWage(game,"technician"))+
     " · dias trabalhados neste mês: faxineiro "+(game.employeeWorkedDays?.cleaner??0)+
     ", técnico "+(game.employeeWorkedDays?.technician??0)+
     ". Contratos mensais sem diária ociosa; folha cobrada no fechamento.");
   const cleanState=staffActivity(game,"cleaner"),techState=staffActivity(game,"technician");
   setText("cleaner-activity","Faxineiro · "+cleanState.label);
   setText("technician-activity","Técnico · "+techState.label);
   for(const [id,activity] of [["cleaner-progress",cleanState],["technician-progress",techState]] as const){
    const meter=document.getElementById(id);
    if(meter instanceof HTMLProgressElement){
     meter.hidden=activity.percent===null;
     meter.value=activity.percent??0;
    }
   }
   setText("bin-status","Lixeiras: "+(game.binFill??[0,0]).map((n,i)=>{
    const state=binStatus(n);
    return (i+1)+": "+(state==="empty"?"Vazia":state==="full"?"Cheia":"Enchendo · "+Math.round(n)+"%");
  }).join(" · ")+(game.overflowWaste?" · ⚠ Lixo no chão: "+Math.round(game.overflowWaste):"")+
  " · faxineiro "+(game.cleaningJob?workPhaseLabel("cleaner",game.cleaningJob).toLowerCase():cleanerHired?"contratado":"sem contrato"));
  if(adminOpen&&activeAdminTab==="services"&&managementPanels.active("services","access")){
   const issues=inspectServiceAccess(!liveOnly);
   const summary=issues.length
    ?issues.length+" destino(s) sem passagem para atendimento."
    :"Nenhum destino com necessidade de atendimento está bloqueado.";
   setText("service-access-summary",summary);
   setText("service-access-list",issues.length
    ?issues.map(issue=>issue.label+" · sem rota desde a porta").join(" · ")
    :"Uma ocorrência futura só será verificada quando precisar de atendimento.");
   const see=document.querySelector<HTMLButtonElement>("#show-service-access");
   if(see){see.disabled=issues.length===0;see.textContent="Ver bloqueios no salão ("+issues.length+")";}
  }
  const cleanButton=document.querySelector<HTMLButtonElement>("#clean-bins-now");
   if(cleanButton){
    cleanButton.textContent=game.cleaningJob?"Faxineiro · "+workPhaseLabel("cleaner",game.cleaningJob):
      cleanerHired?"Solicitar limpeza · coberta pelo contrato":
      "Chamar faxineiro avulso · "+money(serviceVisitCost(game,"cleaning"));
    cleanButton.disabled=!!game.cleaningJob||(!(game.binFill??[]).some(x=>x>=10)&&(game.overflowWaste??0)<1)||
      (!cleanerHired&&game.cash<serviceVisitCost(game,"cleaning"));
   }
  }
  setText("finance", "Entradas R$ "+game.revenue+" · Saídas R$ "+game.expenses+
    " · Atendimentos "+(game.served+(game.printer?.walkIns??0)+(game.discCopier?.walkIns??0))+
    " (PCs "+(game.served-(game.ps1Sessions??0))+
    ((game.ps1Stations?.length??0)+(game.ps1Sessions??0)>0?
     " · PlayStation "+(game.ps1Sessions??0):"")+
    " · Impressões avulsas "+(game.printer?.walkIns??0)+
    " · Cópias avulsas "+(game.discCopier?.walkIns??0)+")");
  if(activeAdminTab==="finance"){
  const monthUsed=game.monthPcUsedMinutes??0,monthCapacity=game.monthPcCapacityMinutes??0;
  const monthPct=computerOccupancyPercent(monthUsed,monthCapacity);
  setText("pc-utilization","Ocupação neste mês: "+monthPct.toLocaleString("pt-BR")+"% dos minutos-PC disponíveis ("+monthUsed.toLocaleString("pt-BR")+"/"+monthCapacity.toLocaleString("pt-BR")+").");
  const prevCap=game.lastMonthPcCapacityMinutes??0;
  const previous=prevCap>0?computerOccupancyPercent(game.lastMonthPcUsedMinutes??0,prevCap).toLocaleString("pt-BR")+"%":"sem histórico";
  setText("previous-occupancy","Ocupação do último mês: "+previous+".");
  const hasStatement=game.lastMonthRevenue!==undefined&&game.lastMonthExpenses!==undefined;
  const lastNet=(game.lastMonthRevenue??0)-(game.lastMonthExpenses??0);
  const lastBill=game.lastPaidMonthlyBill;
  const billInfo=document.getElementById("last-bill-info");
  const billDetails=document.getElementById("last-bill-details");
  if(billInfo)billInfo.textContent=lastBill?
   "Último fechamento: mês "+String(Math.floor(((lastBill.endDay-1)%360)/30)+1).padStart(2,"0")+
   "/"+(1998+Math.floor((lastBill.endDay-1)/360))+
   " · pago "+inCurrency(lastBill.total)+
   " · caixa após pagamento "+inCurrency(lastBill.cashAfterPayment)+"."
   :"Nenhum fechamento pago nesta partida ainda. A primeira cobrança acontece após 30 dias do jogo.";
  if(billDetails)billDetails.hidden=!lastBill;
  if(lastBill){
   setText("last-bill-rent",inCurrency(lastBill.rent));
   setText("last-bill-internet",inCurrency(lastBill.internet));
   setText("last-bill-energy",inCurrency(lastBill.energy));
   setText("last-bill-maintenance",inCurrency(lastBill.maintenance));
   setText("last-bill-wages",inCurrency(lastBill.wages));
   setText("last-bill-total",inCurrency(lastBill.total));
  }
  setText("monthly-statement",hasStatement
    ?"Fechamento anterior: entradas "+money(game.lastMonthRevenue??0)+" · saídas "+money(game.lastMonthExpenses??0)+" · resultado "+money(lastNet)+". Inclui investimentos e multas pagos no período."
    :"Fechamento mensal: disponível após o primeiro mês completo desta partida.");
  setText("capacity-advice",expansionAdvice(game));
  const promoting=isPromotionActive(game);
  const admissionsOpen=promotionCanAttractVisitors(game);
  const promoPrice=promotionCost(game);
  const promoLabel=inCurrency(promoPrice);
  setText("promotion-description","Custo atual: "+promoLabel+
    ". Aumenta em 40% a chance de chegada até 20h30, desde que haja PCs ligados ou bancadas de PlayStation disponíveis. Lotação e filas reduzem o resultado; não garante clientes nem vendas.");
  setText("promotion-status",promoting
    ?admissionsOpen
      ?"Panfletagem ativa! +40% na chance de novos visitantes. Restam "+promotionAdmissionMinutesRemaining(game)+" minutos de entrada (até 20h30)."
      :"Panfletagem contratada hoje. Novos clientes não entram após 20h30; a campanha termina às 22h."
    :game.totalMinutes>=GAME_LAST_MINUTE
      ?"Calendário encerrado: não é possível contratar panfletagem."
      :admissionsOpen
        ?"Sem panfletagem hoje. Divulgue sua lan house para aumentar a procura até 20h30."
        :"Novas entradas encerradas às 20h30. A panfletagem estará disponível amanhã.");
  const promotionButton=document.querySelector<HTMLButtonElement>("#launch-promotion");
  if(promotionButton){
    promotionButton.disabled=promoting||!admissionsOpen||game.cash<promoPrice;
    promotionButton.textContent=promoting?"✓ Divulgação contratada hoje":
      !admissionsOpen?"📣 Panfletagem indisponível após 20h30":"📣 Fazer panfletagem · "+promoLabel;
  }
  setText("expansion", "Ampliação "+game.expansionLevel+"/2");
  }
  }
  // Independente do painel administrativo: as marcações continuam visíveis
  // depois de fechar Administração para inspecionar o salão no Canvas.
  const inspectToolbar=document.getElementById("service-access-toolbar");
  if(inspectToolbar)inspectToolbar.hidden=!serviceAccessVisible;
  if(serviceAccessVisible)setText("service-access-map-hint",
   serviceAccessCache.length
    ?serviceAccessCache.map(issue=>issue.label).join(", ")+": sem acesso. Abra uma porta ou reorganize o salão."
    :"Nenhum destino está bloqueado. Você pode fechar as marcações.");
  const recentEvents=game.eventLog.slice(0,6),eventSignature=JSON.stringify(recentEvents);
  if(eventSignature!==lastEventSignature){
  events.replaceChildren();
  for(const record of recentEvents){
    const li=document.createElement("li"),text=document.createElement("span");
    const match=record.match(/^(D\d+ [\d:]+) · (.*)$/);
    if(match){const time=document.createElement("time");time.textContent=match[1]!;text.append(time,document.createTextNode(match[2]!));}
    else text.textContent=record;
    li.innerHTML=iconMarkup(/pagou|Venda/.test(record)?"coins":/internet/i.test(record)?"network":/PC|computador/i.test(record)?"computer":"mail");
    li.append(text);events.appendChild(li);
  }
  lastEventSignature=eventSignature;
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
  const payments=isPlaying?(game.paymentEffects?.splice(0)??[]):[];
  for(const payment of payments){
    paymentPopups.push({...payment,age:0});
    if(paymentPopups.length>12)paymentPopups.shift();
    soundscape.income("payment");
  }
  if(game.served>previousServed)previousServed=game.served;
  const sales=isPlaying?(game.saleEffects?.splice(0)??[]):[];
  for(const sale of sales){
    if(Number.isFinite(sale.amount) && Number.isFinite(sale.x) && Number.isFinite(sale.y)){
      salePopups.push({amount:sale.amount!,x:sale.x!,y:sale.y!,age:0});
      if(salePopups.length>12)salePopups.shift();
    }
    // Payment sound is emitted by real confirmed sales, not UI clicks.
    soundscape.income("sale");
    if(sale.item==="soda")soundscape.soda();
    else soundscape.candy();
  }
  // Impressão paga (avulsa ou na sessão): chance e cooldown no mixer.
  for(const print of (isPlaying?(game.printEffects?.splice(0)??[]):[])){
   if(Number.isInteger(print.customerId))soundscape.printer();
  }
  // A gentle 3.5-second phrase once a visitor starts a PC session.
  for(const started of (isPlaying?(game.keyboardEffects?.splice(0)??[]):[])){
    if(Number.isInteger(started.customerId)&&Number.isInteger(started.pcIndex))soundscape.keyboard();
  }
  if(game.purchases>previousPurchases)previousPurchases=game.purchases;
  for(const speech of (isPlaying?(game.speechEffects?.splice(0)??[]):[])){
    speechPopups.push({...speech,age:0});
    if(speechPopups.length>8)speechPopups.shift();
  }
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
