/** Pricing area renderer: coordinates prepared read-only ports, not simulation rules. */
import type {HourlyPriceStatus} from "../application/hourlyPriceStatusPort.js";
import type {PricingInsightsPort} from "../application/pricingInsightsPort.js";
import type {RetailPriceStatusPort} from "../application/retailPriceStatusPort.js";
import {renderHourlyPriceStatus,renderSessionPackages} from "./hourlyPriceStatusPanel.js";
import {renderHourlyPricingInsights,renderEnergyYearOutlook} from "./pricingInsightsPanel.js";
import {renderRetailPriceControls} from "./retailPriceControlsPanel.js";

export interface AdminPricingSectionsOptions {
 readonly hourly:HourlyPriceStatus;
 readonly insights:PricingInsightsPort;
 readonly retail:RetailPriceStatusPort;
 readonly pricingTab:boolean;
 readonly active:(page:"hourly"|"insights"|"retail")=>boolean;
 readonly packagesChanged:()=>boolean;
 readonly retailChanged:()=>boolean;
 readonly retailControls:Element|null;
 readonly setText:(id:string,text:string)=>void;
 readonly iconMarkup:(id:string)=>string;
 readonly doc:Pick<Document,"getElementById"|"createElement">;
 readonly sync:(current:Element,next:Element)=>void;
}
export function renderAdminPricingSections(options:AdminPricingSectionsOptions):void {
 renderHourlyPriceStatus(options.hourly,options.setText,options.doc);
 const durations=options.doc.getElementById("session-package-prices");
 if(durations&&options.pricingTab&&options.active("hourly")&&options.packagesChanged())
  renderSessionPackages(options.hourly.packages,durations,options.doc);
 if(options.pricingTab&&options.active("insights"))
  renderHourlyPricingInsights(options.insights.hourly(),options.setText);
 renderEnergyYearOutlook(options.insights.energy(),options.setText);
 if(options.retailControls&&options.pricingTab&&options.active("retail")&&options.retailChanged())
  renderRetailPriceControls(options.retailControls,options.retail.snapshot(),
   options.iconMarkup,options.doc,options.sync);
}
