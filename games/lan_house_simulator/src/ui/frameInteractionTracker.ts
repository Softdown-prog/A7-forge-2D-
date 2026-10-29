/** Browser input activity used only to schedule the visible HUD.
 * This module does not change game time, pointer gestures or the save.
 */
export interface FrameInteractionSnapshot {
 readonly lastScroll:number;
 readonly lastInput:number;
 readonly pointerHeld:boolean;
}
export interface FrameInteractionTracker {
 snapshot():FrameInteractionSnapshot;
}
export function installFrameInteractionTracker(
 doc:Pick<Document,"addEventListener">,
 win:Pick<Window,"addEventListener">,
 now:()=>number
):FrameInteractionTracker{
 let lastScroll=-1000,lastInput=-1000,pointerHeld=false;
 doc.addEventListener("scroll",()=>{lastScroll=now();},{capture:true,passive:true});
 doc.addEventListener("pointerdown",()=>{pointerHeld=true;lastInput=now();},{capture:true,passive:true});
 for(const type of ["pointerup","pointercancel"] as const)
  doc.addEventListener(type,()=>{pointerHeld=false;lastInput=now();},{capture:true,passive:true});
 win.addEventListener("blur",()=>{pointerHeld=false;});
 return {snapshot:()=>({lastScroll,lastInput,pointerHeld})};
}
