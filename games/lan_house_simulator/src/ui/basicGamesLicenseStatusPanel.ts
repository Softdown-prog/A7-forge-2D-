/** Displays only the licensed state and purchase action already wired elsewhere. */
import type {BasicGamesLicenseStatus} from "../application/basicGamesLicenseStatusPort.js";
export function renderBasicGamesLicenseStatus(
 status:BasicGamesLicenseStatus,
 setText:(id:string,value:string)=>void,
 doc:Pick<Document,"querySelector">
):void{
 setText("license-status",status.statusLabel);
 const button=doc.querySelector<HTMLButtonElement>("#license");
 if(button){
  button.hidden=status.buttonHidden;
  button.disabled=status.buttonDisabled;
  button.textContent=status.buttonLabel;
 }
}
