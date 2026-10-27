/** Existing staff buttons, text and meters are updated in place to preserve mobile gestures. */
import type {StaffStatusSnapshot} from "../application/staffStatusPort.js";

export function renderStaffStatusPanel(
 view:StaffStatusSnapshot,
 setText:(id:string,value:string)=>void,
 doc:Pick<Document,"querySelector"|"getElementById">
):void {
 const cleaner=doc.querySelector<HTMLButtonElement>("#clean-bins");
 if(cleaner)cleaner.textContent=view.cleanerControl;
 const technician=doc.querySelector<HTMLButtonElement>("#hire-technician");
 if(technician)technician.textContent=view.technicianControl;
 setText("staff-summary",view.summary);
 setText("cleaner-activity",view.cleanerActivity);
 setText("technician-activity",view.technicianActivity);
 for(const [id,progress] of [
  ["cleaner-progress",view.cleanerProgress],
  ["technician-progress",view.technicianProgress]
 ] as const){
  const meter=doc.getElementById(id);
  if(meter instanceof HTMLProgressElement){
   meter.hidden=progress===null;
   meter.value=progress??0;
  }
 }
 setText("bin-status",view.binSummary);
 const cleanNow=doc.querySelector<HTMLButtonElement>("#clean-bins-now");
 if(cleanNow){
  cleanNow.textContent=view.cleaningLabel;
  cleanNow.disabled=view.cleaningDisabled;
 }
}
