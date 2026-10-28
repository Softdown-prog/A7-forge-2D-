/** Update existing labels only; no simulation, DOM or event listeners here. */
import type {FinancialAdminOverview} from "../application/financialAdminOverviewPort.js";
export function renderFinancialAdminTotals(v:FinancialAdminOverview,setText:(id:string,value:string)=>void):void{
 setText("admin-bills",v.bills);
 setText("admin-served",v.served);
 setText("monthly-breakdown",v.breakdown);
}
export function renderFinancialAdminActivity(v:FinancialAdminOverview,setText:(id:string,value:string)=>void,finance:boolean):void{
 setText("finance",v.activity);
 if(finance)setText("expansion",v.expansion);
}
