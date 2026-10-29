/** Presentation coordinator for computer maintenance, hardware, LCDs and ledger.
 * The active game, purchases and save handling stay in the application bootstrap.
 */
import {renderPcMaintenancePanel} from "./pcMaintenancePanel.js";

export type ComputerAdminPage="operations"|"hardware"|"windows"|"monitors"|"ledger";
export interface AdminComputerSectionsOptions {
 readonly adminOpen:boolean;
 readonly computersTab:boolean;
 readonly ledgerActive:()=>boolean;
 readonly currentPage:()=>string|undefined;
 readonly maintenanceChanged:()=>boolean;
 readonly selectedStation:()=>number;
 readonly clampSelectedStation:()=>void;
 readonly renderLedger:(host:HTMLTableSectionElement)=>void;
 readonly renderOperations:(host:HTMLDivElement)=>void;
 readonly renderHardware:(host:HTMLDivElement,page:"hardware"|"windows")=>void;
 readonly renderMonitors:(host:HTMLDivElement)=>void;
 readonly renderComputerSummary:(host:HTMLDivElement)=>void;
 readonly decorate:(host:HTMLDivElement)=>void;
 readonly reconcile:(existing:Element,next:Element)=>void;
 readonly doc:Document;
}
export function renderAdminComputerSections(options:AdminComputerSectionsOptions):void {
 const ledger=options.doc.querySelector<HTMLTableSectionElement>("#station-ledger-rows");
 if(ledger&&options.adminOpen&&options.computersTab&&options.ledgerActive())
  options.renderLedger(ledger);
 const host=options.doc.getElementById("pc-maintenance");
 if(host&&options.adminOpen&&options.computersTab&&!options.ledgerActive()&&options.maintenanceChanged()){
  const page=options.currentPage();
  renderPcMaintenancePanel(host,{
   build:maintenance=>{
    if(page==="operations")options.renderOperations(maintenance);
    options.clampSelectedStation();
    if(page==="hardware"||page==="windows")options.renderHardware(maintenance,page);
    if(page==="monitors")options.renderMonitors(maintenance);
    options.renderComputerSummary(maintenance);
   },
   decorate:options.decorate,
   reconcile:options.reconcile,
   selectedStation:options.selectedStation
  },options.doc);
 }
}
