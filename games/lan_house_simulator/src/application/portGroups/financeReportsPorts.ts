/** Read-only financial projections; one live campaign getter, zero UI dependencies. */
import type {GameState} from "../../sim/types.js";
import {createStationLedgerPort} from "../stationLedgerPort.js";
import {createMonthlyFinancePort} from "../monthlyFinancePort.js";
import {createFinancialBalancePort} from "../financialBalancePort.js";
import {createFinancialAdminOverviewPort} from "../financialAdminOverviewPort.js";

/** Only composes existing ports; all accounting continues to belong to sim/. */
export function createFinanceReportsPorts(getState:()=>GameState){
 return {
  stationLedgerPort:createStationLedgerPort(getState),
  monthlyFinancePort:createMonthlyFinancePort(getState),
  financialBalancePort:createFinancialBalancePort(getState),
  financialAdminOverviewPort:createFinancialAdminOverviewPort(getState)
 };
}
