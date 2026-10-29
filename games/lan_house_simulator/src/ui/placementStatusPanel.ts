/** Existing toolbar and Canvas-stage styling; business actions stay in main. */
import type {PlacementStatus} from "../application/placementStatusPort.js";
export interface PlacementStatusElements {
 readonly toolbar:HTMLElement|null;
 readonly stage:HTMLElement|null;
 readonly help:HTMLElement|null;
}
export function renderPlacementStatus(
 state:PlacementStatus,
 elements:PlacementStatusElements,
 doc:Pick<Document,"querySelector">
):void{
 if(elements.toolbar)elements.toolbar.hidden=!state.toolbarVisible;
 const rotate=doc.querySelector<HTMLButtonElement>("#rotate-furniture");
 if(rotate){rotate.hidden=state.rotateHidden;rotate.disabled=state.rotateDisabled;}
 const confirm=doc.querySelector<HTMLButtonElement>("#confirm-wall");
 const turn=doc.querySelector<HTMLButtonElement>("#turn-wall");
 if(confirm){confirm.hidden=state.confirmWallHidden;confirm.disabled=state.confirmWallDisabled;}
 if(turn){turn.hidden=state.turnWallHidden;turn.disabled=state.turnWallDisabled;}
 if(elements.stage)elements.stage.classList.toggle("placing",state.stagePlacing);
 if(elements.help)elements.help.textContent=state.hint;
}
