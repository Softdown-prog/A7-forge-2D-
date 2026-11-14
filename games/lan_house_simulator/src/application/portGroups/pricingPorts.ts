/** Pricing, retail and promotion application ports. Domain rules stay in sim/. */
import type {GameState} from "../../sim/types.js";
import {createPromotionStatusPort} from "../promotionStatusPort.js";
import {createPricingInsightsPort} from "../pricingInsightsPort.js";
import {createHourlyPriceStatusPort} from "../hourlyPriceStatusPort.js";
import {createRetailPriceStatusPort} from "../retailPriceStatusPort.js";
import {createDeskPricingPort} from "../deskPricingPort.js";
import {createPricingPort} from "../pricingPort.js";

/** Compose both commands and projections without capturing a particular save. */
export function createPricingPorts(getState:()=>GameState){
 return {
  promotionStatusPort:createPromotionStatusPort(getState),
  pricingInsightsPort:createPricingInsightsPort(getState),
  hourlyPriceStatusPort:createHourlyPriceStatusPort(getState),
  retailPriceStatusPort:createRetailPriceStatusPort(getState),
  deskPricingPort:createDeskPricingPort(getState),
  pricingPort:createPricingPort(getState)
 };
}
