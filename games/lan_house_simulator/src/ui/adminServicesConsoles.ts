/** DOM-only composition for console and service administration.
 * Projections and route inspection remain owned by the current game bootstrap.
 */
import type {Ps1AdminPort} from "../application/ps1AdminPort.js";
import type {StaffStatusPort} from "../application/staffStatusPort.js";
import type {ServiceAccessStatus} from "../application/serviceAccessStatusPort.js";
import {renderPs1AdminPanel} from "./ps1AdminPanel.js";
import {renderStaffStatusPanel} from "./staffStatusPanel.js";
import {renderServiceAccessStatus} from "./serviceAccessStatusPanel.js";

export interface AdminServicesConsolesOptions {
 readonly consolesTab:boolean;
 readonly servicesTab:boolean;
 readonly showPs1Stations:()=>boolean;
 readonly showServiceAccess:()=>boolean;
 /** Inspect routes lazily: never while other service pages are visible. */
 readonly accessSnapshot:()=>ServiceAccessStatus;
 readonly ps1:Ps1AdminPort;
 readonly staff:StaffStatusPort;
 readonly setText:(id:string,value:string)=>void;
 readonly money:(value:number)=>string;
 readonly doc:Document;
}
export function renderAdminServicesConsoles(options:AdminServicesConsolesOptions):void {
 if(options.consolesTab)
  renderPs1AdminPanel(options.ps1,{
   showStations:options.showPs1Stations(),
   setText:options.setText,
   money:options.money
  });
 if(options.servicesTab){
  renderStaffStatusPanel(options.staff.snapshot(),options.setText,options.doc);
  if(options.showServiceAccess())
   renderServiceAccessStatus(options.accessSnapshot(),options.setText,options.doc);
 }
}
