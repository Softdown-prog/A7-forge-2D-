/** Presentation only: leave the existing button attached to its delegated click handler. */
import type {PromotionSnapshot} from "../application/promotionStatusPort.js";

export function renderPromotionStatus(
 view:PromotionSnapshot,
 setText:(id:string,value:string)=>void,
 dom:Pick<Document,"querySelector">
):void {
 setText("promotion-description",view.description);
 setText("promotion-status",view.status);
 const button=dom.querySelector<HTMLButtonElement>("#launch-promotion");
 if(button){
  button.disabled=view.buttonDisabled;
  button.textContent=view.buttonLabel;
 }
}
