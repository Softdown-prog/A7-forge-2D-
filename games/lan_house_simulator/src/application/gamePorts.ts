/** Composition of application contracts. Every port reads the same live campaign getter. */
import { gameYear,INTERNET_ERAS } from "../sim/eraCatalog.js";
import { clampPriceToEra } from "../sim/historicalEconomy.js";
import { serviceAccessIssues } from "../sim/serviceAccess.js";
import { SHOP_CATALOG } from "../sim/shop.js";
import { applyResult,pcCount } from "../sim/simulationState.js";
import { ANNEX_PC_COST } from "../sim/stationLayout.js";
import type { GameState } from "../sim/types.js";
import { WALL_COST } from "../sim/walls.js";
import { createAdminPanelRevisionsPort } from "./adminPanelRevisionsPort.js";
import { createBasicGamesLicenseStatusPort } from "./basicGamesLicenseStatusPort.js";
import { createClassicGamesCatalogPort } from "./classicGamesCatalogPort.js";
import { createCommerceNetworkPort } from "./commerceNetworkPort.js";
import type { ActionResult } from "./contracts.js";
import { customerFeedbackSnapshot } from "./customerFeedbackSnapshot.js";
import { createDeskPricingPort } from "./deskPricingPort.js";
import { createEventLogPort } from "./eventLogPort.js";
import { createFinancialAdminOverviewPort } from "./financialAdminOverviewPort.js";
import { createFinancialBalancePort } from "./financialBalancePort.js";
import { createFridayMeetupPort } from "./fridayMeetupPort.js";
import { createGameLicensingPort } from "./gameLicensingPort.js";
import { createGpuCatalogPort } from "./gpuCatalogPort.js";
import { createGpuDownloadMetersPort } from "./gpuDownloadMetersPort.js";
import { createGpuGamesCatalogPort } from "./gpuGamesCatalogPort.js";
import { createHardwarePanelPort } from "./hardwarePanelPort.js";
import { createHourlyPriceStatusPort } from "./hourlyPriceStatusPort.js";
import { createLayoutEditorPort,type LayoutEditorCamera } from "./layoutEditorPort.js";
import { createLcdMonitorsPort } from "./lcdMonitorsPort.js";
import { createMerchandisePort } from "./merchandisePort.js";
import { createMonthlyFinancePort } from "./monthlyFinancePort.js";
import { createNightTournamentHudPort } from "./nightTournamentHudPort.js";
import { createNoticeActionsPort } from "./noticeActionsPort.js";
import { createNoticeInboxPort } from "./noticeInboxPort.js";
import { createNoticeInboxRevisionPort } from "./noticeInboxRevisionPort.js";
import { createNoticeWindowStatusPort } from "./noticeWindowStatusPort.js";
import { createPcOperationsPort } from "./pcOperationsPort.js";
import { createPlacementActionsPort } from "./placementActionsPort.js";
import { computerOperationsSnapshot,liveStatusSnapshot } from "./presentationModels.js";
import { createPricingInsightsPort } from "./pricingInsightsPort.js";
import { createPricingPort } from "./pricingPort.js";
import { createPromotionStatusPort } from "./promotionStatusPort.js";
import {createPs2Port} from "./ps2Port.js";
import { createPs1ActionsPort } from "./ps1ActionsPort.js";
import { createPs1AdminPort } from "./ps1AdminPort.js";
import { createPs1ShopDiscPort } from "./ps1ShopDiscPort.js";
import { createPs1ShopOfferPort } from "./ps1ShopOfferPort.js";
import { createPs1ShopPlacementPort } from "./ps1ShopPlacementPort.js";
import { createRetailPriceStatusPort } from "./retailPriceStatusPort.js";
import { createServiceActionsPort } from "./serviceActionsPort.js";
import { createShopActionsPort } from "./shopActionsPort.js";
import { createShopCatalogOffersPort } from "./shopCatalogOffersPort.js";
import { createShopCatalogRevisionPort } from "./shopCatalogRevisionPort.js";
import { createShopOverviewPort } from "./shopOverviewPort.js";
import { createShopServiceOffersPort } from "./shopServiceOffersPort.js";
import { createStaffStatusPort } from "./staffStatusPort.js";
import { createStationActionsPort } from "./stationActionsPort.js";
import { createStationLedgerPort } from "./stationLedgerPort.js";
import { createStationRevisionPort } from "./stationRevisionPort.js";
import { timeWeatherSnapshot } from "./timeWeatherSnapshot.js";
import { createWindowsLicensePort } from "./windowsLicensePort.js";
export function createGamePorts(getState:()=>GameState,cameraForState:(state:GameState)=>LayoutEditorCamera){
 const layoutEditorPort=createLayoutEditorPort(getState,cameraForState);
 const placementActions=createPlacementActionsPort(getState);
 const ps1Actions=createPs1ActionsPort(getState);
 const ps2Port=createPs2Port(getState);
 const ps1AdminPort=createPs1AdminPort(getState);
 const ps1ShopDiscPort=createPs1ShopDiscPort(getState);
 const ps1ShopPlacementPort=createPs1ShopPlacementPort(getState);
 const ps1ShopOfferPort=createPs1ShopOfferPort(getState);
 const shopServiceOffersPort=createShopServiceOffersPort(getState);
 const shopCatalogOffersPort=createShopCatalogOffersPort(getState,()=>placementActions.availableAnnex().length);
 const shopOverviewPort=createShopOverviewPort(getState,()=>layoutEditorPort.objects().length,()=>placementActions.annexSlots().length);
 const gpuDownloadMetersPort=createGpuDownloadMetersPort(getState);
 const windowsLicensePort=createWindowsLicensePort(getState);
 const stationLedgerPort=createStationLedgerPort(getState);
 const stationRevisionPort=createStationRevisionPort(getState);
 const adminPanelRevisionsPort=createAdminPanelRevisionsPort(getState);
 const monthlyFinancePort=createMonthlyFinancePort(getState);
 const promotionStatusPort=createPromotionStatusPort(getState);
 const financialBalancePort=createFinancialBalancePort(getState);
 const financialAdminOverviewPort=createFinancialAdminOverviewPort(getState);
 const staffStatusPort=createStaffStatusPort(getState);
 const pricingInsightsPort=createPricingInsightsPort(getState);
 const hourlyPriceStatusPort=createHourlyPriceStatusPort(getState);
 const retailPriceStatusPort=createRetailPriceStatusPort(getState);
 const deskPricingPort=createDeskPricingPort(getState);
 const commerceNetworkPort=createCommerceNetworkPort(getState);
 const pcOperationsPort=createPcOperationsPort(getState);
 const lcdMonitorsPort=createLcdMonitorsPort(getState);
 const hardwarePanelPort=createHardwarePanelPort(getState);
 const gpuCatalogPort=createGpuCatalogPort(getState);
 const classicGamesCatalogPort=createClassicGamesCatalogPort(getState);
 const gpuGamesCatalogPort=createGpuGamesCatalogPort(getState);
 const basicGamesLicenseStatusPort=createBasicGamesLicenseStatusPort(getState);
 const noticeInboxPort=createNoticeInboxPort(getState);
 const noticeWindowStatusPort=createNoticeWindowStatusPort(getState);
 const noticeInboxRevisionPort=createNoticeInboxRevisionPort(getState);
 const eventLogPort=createEventLogPort(getState);
 const noticeActions=createNoticeActionsPort(getState);
 const merchandisePort=createMerchandisePort(getState);
 const pricingPort=createPricingPort(getState);
 const serviceActions=createServiceActionsPort(getState);
 const gameLicensing=createGameLicensingPort(getState);
 const stationActions=createStationActionsPort(getState);
 const shopActions=createShopActionsPort(getState);
 const shopCatalogRevisionPort=createShopCatalogRevisionPort(getState);
 const fridayMeetupPort=createFridayMeetupPort(getState);
 const nightTournamentHudPort=createNightTournamentHudPort(getState);
 return {
  layoutEditorPort,placementActions,ps2Port,ps1Actions,ps1AdminPort,ps1ShopDiscPort,ps1ShopPlacementPort,ps1ShopOfferPort,shopServiceOffersPort,shopCatalogOffersPort,shopOverviewPort,gpuDownloadMetersPort,windowsLicensePort,stationLedgerPort,stationRevisionPort,adminPanelRevisionsPort,monthlyFinancePort,promotionStatusPort,financialBalancePort,financialAdminOverviewPort,staffStatusPort,pricingInsightsPort,hourlyPriceStatusPort,retailPriceStatusPort,deskPricingPort,commerceNetworkPort,pcOperationsPort,lcdMonitorsPort,hardwarePanelPort,gpuCatalogPort,classicGamesCatalogPort,gpuGamesCatalogPort,basicGamesLicenseStatusPort,noticeInboxPort,noticeWindowStatusPort,noticeInboxRevisionPort,eventLogPort,noticeActions,merchandisePort,pricingPort,serviceActions,gameLicensing,stationActions,shopActions,shopCatalogRevisionPort,fridayMeetupPort,nightTournamentHudPort,
  catalog:SHOP_CATALOG,rules:{wallCost:WALL_COST,annexPcCost:ANNEX_PC_COST},
  status(){const s=getState();return {year:gameYear(s),pcCount:pcCount(s),ps1Count:s.ps1Stations?.length??0,partitionsCount:(s.interiorWalls?.length??0)+(s.interiorDoors?.length??0)};},
  recordResult:(result:ActionResult)=>applyResult(getState(),result),
  normalizeLegacyPricing:()=>clampPriceToEra(getState()),
  timeWeather:()=>timeWeatherSnapshot(getState()),
  liveStatus(){const s=getState();return liveStatusSnapshot(s,INTERNET_ERAS[s.internetTier-1]?.name??"Desconhecida");},
  computerOperations:()=>computerOperationsSnapshot(getState()),
  feedback:()=>customerFeedbackSnapshot(getState()),
  accessIssues:()=>serviceAccessIssues(getState())
 };
}
export type GamePorts=ReturnType<typeof createGamePorts>;
