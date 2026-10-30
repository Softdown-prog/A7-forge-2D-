/** Coordinates selective DOM presentation; every business value is supplied by application ports. */
import type { GamePorts } from "../application/gamePorts.js";
import { createPanelRevisionCache } from "../application/panelRevisionCache.js";
import { placementStatusSnapshot } from "../application/placementStatusPort.js";
import { serviceAccessStatusSnapshot } from "../application/serviceAccessStatusPort.js";
import { createAdminAreaTabs } from "./adminAreaTabs.js";
import { renderAdminComputerSections } from "./adminComputerSections.js";
import { renderAdminFinanceActivity,renderAdminFinanceSummary } from "./adminFinanceSections.js";
import { renderAdminGpuLicenseSections } from "./adminGpuLicenseSections.js";
import { renderAdminPricingSections } from "./adminPricingSections.js";
import {renderPs2AdminPanel} from "./ps2Panels.js";
import { renderAdminServicesConsoles } from "./adminServicesConsoles.js";
import { createVisibleAdminTextWriter,formatAdminMoney,renderAdminDisclosure,renderAdminWindowVisibility,renderShopWindowVisibility } from "./adminShell.js";
import { renderCommerceNetworkPanel } from "./commerceNetworkPanel.js";
import { renderDeskServicePanels } from "./deskPricingPanel.js";
import { renderEventLog } from "./eventLogPanel.js";
import { createEventLogRefresh } from "./eventLogRefresh.js";
import { installFridayMeetupPanel } from "./fridayMeetupPanel.js";
import type { GameElements } from "./gameElements.js";
import { renderHardwarePanel } from "./hardwarePanel.js";
import { renderLcdMonitorsPanel } from "./lcdMonitorsPanel.js";
import { installManagementPanels } from "./managementPanels.js";
import { installMerchandisePanel } from "./merchandisePanel.js";
import { installNightTournamentHud } from "./nightTournamentHud.js";
import { createNoticeWindowRefresh } from "./noticeWindowRefresh.js";
import { syncPanelChildren } from "./panelChildren.js";
import { renderPcOperations } from "./pcOperationsPanel.js";
import { renderPlacementStatus } from "./placementStatusPanel.js";
import { decorateControls,iconMarkup,presentComputerOperations,presentLiveState } from "./presentation.js";
import type { RuntimeUiState } from "./runtimeUiState.js";
import { createServiceAccessInspectionCache } from "./serviceAccessInspectionCache.js";
import { renderServiceAccessOverlayStatus } from "./serviceAccessStatusPanel.js";
import { createShopCatalogRefresh } from "./shopCatalogRefresh.js";
import { renderShopCatalog } from "./shopCatalogRenderer.js";
import { renderShopOverview } from "./shopOverviewPanel.js";
import { installShopPanels } from "./shopPanels.js";
import { renderStationLedgerRows } from "./stationLedgerPanel.js";
import { renderTimeWeatherPanel } from "./timeWeatherPanel.js";
export interface GamePanelsOptions {elements:GameElements;state:RuntimeUiState;ports:GamePorts;save():void;lcdPreview:Parameters<typeof renderLcdMonitorsPanel>[2];inspection:ReturnType<typeof createServiceAccessInspectionCache<ReturnType<GamePorts["accessIssues"]>[number]>>}
export function createGamePanels(options:GamePanelsOptions){
 const {elements:e,state,ports,save,lcdPreview,inspection:serviceAccessInspection}=options;
 const {document,admin,shop,shopCatalog,events,status,controls,noticesList,retailControls,discControls,printControls,placementToolbar,placementHelp,stage,gpuPcChoice,gpuList,licensePanel,eraGamePanel,gpuGamePanel}=e;
 const {
ps1AdminPort,ps1ShopDiscPort,ps1ShopPlacementPort,ps1ShopOfferPort,shopServiceOffersPort,shopCatalogOffersPort,shopOverviewPort,gpuDownloadMetersPort,windowsLicensePort,stationLedgerPort,stationRevisionPort,adminPanelRevisionsPort,monthlyFinancePort,promotionStatusPort,financialBalancePort,financialAdminOverviewPort,staffStatusPort,pricingInsightsPort,hourlyPriceStatusPort,retailPriceStatusPort,deskPricingPort,commerceNetworkPort,pcOperationsPort,lcdMonitorsPort,hardwarePanelPort,gpuCatalogPort,classicGamesCatalogPort,gpuGamesCatalogPort,basicGamesLicenseStatusPort,noticeInboxPort,noticeWindowStatusPort,noticeInboxRevisionPort,eventLogPort,shopCatalogRevisionPort,nightTournamentHudPort}=ports;
 const placementActions=ports.placementActions;
 const SHOP_CATALOG=ports.catalog,WALL_COST=ports.rules.wallCost,ANNEX_PC_COST=ports.rules.annexPcCost;
 const placementNames={poster:"pôster",plant:"planta",table:"mesinha"};
 const inspectServiceAccess=(force=false)=>serviceAccessInspection.inspect(force);
 const shopPanels=shop?installShopPanels(shop,()=>renderUI()):null;
 const nightTournamentHud=installNightTournamentHud();
 const fridayMeetupPanel=installFridayMeetupPanel(admin,ports.fridayMeetupPort,result=>{ports.recordResult(result);renderUI();save();});
 const managementPanels=installManagementPanels(admin,()=>renderUI(),()=>ports.status().year);
 const adminTabs=createAdminAreaTabs(admin,tab=>{state.windows.activeAdminTab=tab;managementPanels.syncArea(tab);},()=>renderUI());
 function activateAdminTab(tab:string):void{adminTabs.activate(tab);}
 const merchandisePanel=installMerchandisePanel(ports.merchandisePort,result=>{ports.recordResult(result);renderUI();save();});
 activateAdminTab(state.windows.activeAdminTab);
const panelChanged=createPanelRevisionCache();
const shopCatalogRefresh=createShopCatalogRefresh({
 isOpen:()=>state.windows.shopOpen,
 host:()=>shopCatalog,
 revision:()=>shopCatalogRevisionPort.snapshot(shopPanels?.current()),
 changed:(revision,force)=>panelChanged("shop",revision,force),
 render:host=>renderShopCatalog({
  host,doc:document,items:SHOP_CATALOG,
  currentCategory:()=>shopPanels?.current(),
  renderOverview:()=>renderShopOverview(shopOverviewPort.snapshot(),document),
  offer:id=>shopCatalogOffersPort.snapshot(id),
  service:id=>shopServiceOffersPort.snapshot(id),
  ps1Offer:()=>ps1ShopOfferPort.snapshot(),
  ps1Slots:()=>ps1ShopPlacementPort.snapshot(),
  selectedPs1Slot:()=>state.selection.selectedPs1PlacementId,
  selectPs1Slot:id=>{state.selection.selectedPs1PlacementId=id;},
  discs:ps1ShopDiscPort,ps2:ports.ps2Port
 })
});
function renderShop(force=true):void{shopCatalogRefresh.refresh(force);}
const noticeWindowRefresh=createNoticeWindowRefresh({
 status:noticeWindowStatusPort,inbox:noticeInboxPort,host:()=>noticesList,
 changed:force=>panelChanged("notices",noticeInboxRevisionPort.snapshot(),force),
 doc:document,iconMarkup
});
const eventLogRefresh=createEventLogRefresh(()=>eventLogPort.snapshot(),snapshot=>renderEventLog(events,snapshot,document,iconMarkup));
function renderUI(liveOnly=false):void {
  nightTournamentHud.render(nightTournamentHudPort.snapshot());
  if(state.windows.adminOpen&&state.windows.activeAdminTab==="finance"&&managementPanels.active("finance","events"))
   fridayMeetupPanel.render();
  // TypeScript não propaga a checagem inicial de nulidade para callbacks posteriores.
  if (!status || !admin || !events || !controls) return;
  renderAdminWindowVisibility(admin,state.windows.adminOpen);
  noticeWindowRefresh.refresh(state.windows.noticesOpen,!liveOnly);
  const moving=placementActions.furniture().find(p=>p.slotId===state.placement.relocationFrom);
  const placementStatus=placementStatusSnapshot({
   placingKind:state.placement.placingKind,placingName:state.placement.placingKind?placementNames[state.placement.placingKind]:null,
   relocating:state.placement.relocating,relocationFrom:state.placement.relocationFrom,selectedFurnitureKind:moving?.kind??null,
   wallMode:state.placement.wallMode,hasPendingWall:!!state.placement.pendingWall,
   canBuildPendingWall:state.placement.wallMode==="build"&&!!state.placement.pendingWall&&placementActions.canBuild(state.placement.pendingWall),
   installingAnnexPc:state.placement.installingAnnexPc,notice:state.placement.placementNotice,wallCost:WALL_COST,annexPcCost:ANNEX_PC_COST
  });
  renderPlacementStatus(placementStatus,{toolbar:placementToolbar,stage,help:placementHelp},document);
  renderShopWindowVisibility(shop,state.windows.shopOpen,document);
  renderShop(!liveOnly);
  activateAdminTab(state.windows.activeAdminTab);
  if(state.windows.adminOpen)managementPanels.syncUnlocks();
  renderTimeWeatherPanel(ports.timeWeather(),iconMarkup);
  const year=ports.status().year;
  const setText=createVisibleAdminTextWriter(document);
  if(state.windows.adminOpen){
  const stationRevision=stationRevisionPort.snapshot(year);
  const money=formatAdminMoney;
  const financialAdminOverview=financialAdminOverviewPort.snapshot();
  renderAdminFinanceSummary({
   overview:financialAdminOverview,balance:financialBalancePort,
   financeTab:state.windows.activeAdminTab==="finance",
   pageActive:page=>managementPanels.active("finance",page),
   feedbackChanged:()=>panelChanged("customerFeedback",adminPanelRevisionsPort.feedback(),!liveOnly),
   feedback:()=>ports.feedback(),
   setText,doc:document
  });
  // Compatibilidade: saves de épocas anteriores podem ter valores antigos.
  ports.normalizeLegacyPricing();
  const hourlyPriceStatus=hourlyPriceStatusPort.snapshot();
  renderAdminPricingSections({
   hourly:hourlyPriceStatus,
   insights:pricingInsightsPort,retail:retailPriceStatusPort,
   pricingTab:state.windows.activeAdminTab==="prices",
   active:page=>managementPanels.active("prices",page),
   packagesChanged:()=>panelChanged("durations",adminPanelRevisionsPort.packages(),!liveOnly),
   retailChanged:()=>panelChanged("retail",adminPanelRevisionsPort.retail(),!liveOnly),
   retailControls,setText,iconMarkup,doc:document,sync:syncPanelChildren
  });
  renderDeskServicePanels(deskPricingPort,{
   pricingTab:state.windows.activeAdminTab==="prices",
   isActive:page=>managementPanels.active("prices",page),
   discControls,printControls,setText,iconMarkup,doc:document,sync:syncPanelChildren
  });
  if(state.windows.adminOpen&&state.windows.activeAdminTab==="stock")merchandisePanel.render();
  renderCommerceNetworkPanel(commerceNetworkPort.snapshot(),setText,document);
  setText("pc",pcOperationsPort.summary());
  renderAdminComputerSections({
   adminOpen:state.windows.adminOpen,computersTab:state.windows.activeAdminTab==="computers",
   ledgerActive:()=>managementPanels.active("computers","ledger"),
   currentPage:()=>managementPanels.current("computers"),
   maintenanceChanged:()=>panelChanged("computers",adminPanelRevisionsPort.computerMaintenance(managementPanels.current("computers"),state.selection.selectedLcdPc,state.selection.selectedHardwareTab,stationRevision,managementPanels.active("computers","operations")),!liveOnly),
   selectedStation:()=>state.selection.selectedLcdPc,
   clampSelectedStation:()=>{state.selection.selectedLcdPc=Math.min(state.selection.selectedLcdPc,ports.status().pcCount-1);},
   renderLedger:host=>renderStationLedgerRows(host,stationLedgerPort),
   renderOperations:host=>renderPcOperations(host,pcOperationsPort.rows(),document),
   renderHardware:(host,page)=>host.append(renderHardwarePanel(hardwarePanelPort.snapshot(state.selection.selectedLcdPc,state.selection.selectedHardwareTab,page))),
   renderMonitors:host=>renderLcdMonitorsPanel(host,lcdMonitorsPort.snapshot(state.selection.selectedLcdPc),lcdPreview,document),
   renderComputerSummary:host=>presentComputerOperations(ports.computerOperations(),host),
   decorate:decorateControls,reconcile:syncPanelChildren,doc:document
  });
  renderAdminGpuLicenseSections({
   adminOpen:state.windows.adminOpen,gpuTab:state.windows.activeAdminTab==="gpus",licensesTab:state.windows.activeAdminTab==="licenses",
   gpuPcChoice,gpuList,licensePanel,eraGamePanel,gpuGamePanel,
   gpuChanged:()=>panelChanged("gpuPcChoice",adminPanelRevisionsPort.gpuChoice(stationRevision,state.selection.selectedGpuPc),!liveOnly),
   selectedGpuIndex:()=>{state.selection.selectedGpuPc=Math.min(state.selection.selectedGpuPc,ports.status().pcCount-1);return state.selection.selectedGpuPc;},
   licensePageActive:page=>managementPanels.active("licenses",page),
   windowsChanged:()=>panelChanged("licensePanel",adminPanelRevisionsPort.windows(stationRevision),!liveOnly),
   classicChanged:()=>panelChanged("eraGamePanel",adminPanelRevisionsPort.classicGames(year,stationRevision),!liveOnly),
   gpuGamesChanged:()=>panelChanged("gpuGamePanel",adminPanelRevisionsPort.gpuGames(year,stationRevision),!liveOnly),
   gpuCatalog:gpuCatalogPort,basicGames:basicGamesLicenseStatusPort,
   windows:windowsLicensePort,classic:classicGamesCatalogPort,
   gpuGames:gpuGamesCatalogPort,downloads:gpuDownloadMetersPort,
   setText,doc:document,sync:syncPanelChildren
  });
  if(state.windows.adminOpen&&state.windows.activeAdminTab==="consoles")renderPs2AdminPanel(ports.ps2Port,managementPanels.active("consoles","stations"),document);
  renderAdminServicesConsoles({
   consolesTab:state.windows.activeAdminTab==="consoles",
   servicesTab:state.windows.activeAdminTab==="services",
   showPs1Stations:()=>state.windows.adminOpen&&managementPanels.active("consoles","stations"),
   showServiceAccess:()=>state.windows.adminOpen&&managementPanels.active("services","access"),
   accessSnapshot:()=>serviceAccessStatusSnapshot(inspectServiceAccess(!liveOnly)),
   ps1:ps1AdminPort,staff:staffStatusPort,setText,money,doc:document
  });
  renderAdminFinanceActivity({
   overview:financialAdminOverview,monthly:monthlyFinancePort,promotion:promotionStatusPort,
   financeTab:state.windows.activeAdminTab==="finance",setText,doc:document
  });
  }
  // Independente do painel administrativo: as marcações continuam visíveis
  // depois de fechar Administração para inspecionar o salão no Canvas.
  renderServiceAccessOverlayStatus(serviceAccessStatusSnapshot(serviceAccessInspection.snapshot()),state.serviceAccessVisible,setText,document);
  eventLogRefresh.refresh();
  renderAdminDisclosure(controls,state.windows.adminOpen);
  presentLiveState(ports.liveStatus(),state.windows.adminOpen?state.windows.activeAdminTab:null);
}
 return {render:renderUI,activateAdminTab,managementPanels,shopPanels};
}
export type GamePanels=ReturnType<typeof createGamePanels>;
