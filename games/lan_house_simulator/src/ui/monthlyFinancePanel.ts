/** DOM-only update: preserve nodes, focus and mobile scrolling. */
import type {MonthlyFinanceSnapshot} from "../application/monthlyFinancePort.js";
export function renderMonthlyFinancePanel(
 view:MonthlyFinanceSnapshot,
 setText:(id:string,value:string)=>void,
 dom:Pick<Document,"getElementById">
):void {
 setText("pc-utilization",view.utilization);
 setText("previous-occupancy",view.previousOccupancy);
 const info=dom.getElementById("last-bill-info");
 if(info)info.textContent=view.billInfo;
 const details=dom.getElementById("last-bill-details");
 if(details)details.hidden=view.receipt===null;
 if(view.receipt){
  setText("last-bill-rent",view.receipt.rent);
  setText("last-bill-internet",view.receipt.internet);
  setText("last-bill-energy",view.receipt.energy);
  setText("last-bill-maintenance",view.receipt.maintenance);
  setText("last-bill-wages",view.receipt.wages);
  setText("last-bill-total",view.receipt.total);
 }
 setText("monthly-statement",view.statement);
 setText("capacity-advice",view.capacityAdvice);
}
