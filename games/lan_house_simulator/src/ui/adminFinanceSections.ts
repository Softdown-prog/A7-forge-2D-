/** Finance tab composition. The UI consumes read ports and never imports the motor. */
import type {FinancialAdminOverview} from "../application/financialAdminOverviewPort.js";
import type {FinancialBalancePort} from "../application/financialBalancePort.js";
import type {MonthlyFinancePort} from "../application/monthlyFinancePort.js";
import type {PromotionStatusPort} from "../application/promotionStatusPort.js";
import type {FeedbackSnapshot} from "../application/customerFeedbackSnapshot.js";
import {renderFinancialBalance,renderFinancialBillWatch} from "./financialBalancePanel.js";
import {renderFinancialAdminTotals,renderFinancialAdminActivity} from "./financialAdminOverviewPanel.js";
import {renderMonthlyFinancePanel} from "./monthlyFinancePanel.js";
import {renderPromotionStatus} from "./promotionStatusPanel.js";
import {renderCustomerFeedback} from "./customerFeedbackPanel.js";

type TextWriter=(id:string,value:string)=>void;

export interface AdminFinanceSummaryOptions{
 readonly overview:FinancialAdminOverview;
 readonly balance:FinancialBalancePort;
 readonly financeTab:boolean;
 readonly pageActive:(page:"feedback"|"balance")=>boolean;
 readonly feedbackChanged:()=>boolean;
 readonly feedback:()=>FeedbackSnapshot;
 readonly setText:TextWriter;
 readonly doc:Pick<Document,"getElementById">;
}
export function renderAdminFinanceSummary(options:AdminFinanceSummaryOptions):void{
 renderFinancialBalance(options.balance.balance(),options.setText,options.doc);
 if(options.financeTab&&options.pageActive("feedback")){
  const host=options.doc.getElementById("customer-feedback-panel");
  if(host&&options.feedbackChanged())renderCustomerFeedback(host,options.feedback());
 }
 if(options.financeTab&&options.pageActive("balance"))
  renderFinancialBillWatch(options.balance.billWatch(),options.doc);
 renderFinancialAdminTotals(options.overview,options.setText);
}

export interface AdminFinanceActivityOptions{
 readonly overview:FinancialAdminOverview;
 readonly monthly:MonthlyFinancePort;
 readonly promotion:PromotionStatusPort;
 readonly financeTab:boolean;
 readonly setText:TextWriter;
 readonly doc:Pick<Document,"getElementById"|"querySelector">;
}
export function renderAdminFinanceActivity(options:AdminFinanceActivityOptions):void{
 renderFinancialAdminActivity(options.overview,options.setText,options.financeTab);
 if(options.financeTab){
  renderMonthlyFinancePanel(options.monthly.snapshot(),options.setText,options.doc);
  renderPromotionStatus(options.promotion.snapshot(),options.setText,options.doc);
 }
}
