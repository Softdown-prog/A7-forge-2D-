/** Pure presentation: preserve existing text nodes and visibility rules. */
import type {HourlyPricingInsightView,EnergyOutlookView} from "../application/pricingInsightsPort.js";

export function renderHourlyPricingInsights(
 view:HourlyPricingInsightView,
 setText:(id:string,value:string)=>void
):void {
 setText("price-demand-insight",view.demand);
 setText("price-satisfaction-insight",view.satisfaction);
 setText("price-caution",view.caution);
 setText("price-scenario-lower",view.lower);
 setText("price-scenario-current",view.current);
 setText("price-scenario-higher",view.higher);
}
export function renderEnergyYearOutlook(
 view:EnergyOutlookView,
 setText:(id:string,value:string)=>void
):void {
 setText("energy-year-outlook",view.label);
}
