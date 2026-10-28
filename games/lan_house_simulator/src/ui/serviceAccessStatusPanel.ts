/** Display-only administrative status and Canvas overlay toolbar. */
import type {ServiceAccessStatus} from "../application/serviceAccessStatusPort.js";
export function renderServiceAccessStatus(
 status:ServiceAccessStatus,
 setText:(id:string,value:string)=>void,
 doc:Pick<Document,"querySelector">
):void{
 setText("service-access-summary",status.summary);
 setText("service-access-list",status.destinations);
 const button=doc.querySelector<HTMLButtonElement>("#show-service-access");
 if(button){
  button.disabled=status.showDisabled;
  button.textContent=status.showLabel;
 }
}
export function renderServiceAccessOverlayStatus(
 status:ServiceAccessStatus,
 visible:boolean,
 setText:(id:string,value:string)=>void,
 doc:Pick<Document,"getElementById">
):void{
 const toolbar=doc.getElementById("service-access-toolbar");
 if(toolbar)toolbar.hidden=!visible;
 if(visible)setText("service-access-map-hint",status.mapHint);
}
