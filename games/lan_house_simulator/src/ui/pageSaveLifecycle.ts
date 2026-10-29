/** Browser lifecycle adapter for the same local save callback used by the game.
 * No save serialization, cloud requests, or gameplay state lives in this module.
 */
export interface PageSaveLifecycleOptions {
 readonly win:Pick<Window,"addEventListener">;
 readonly doc:Pick<Document,"addEventListener"|"hidden">;
 readonly every:(callback:()=>void,intervalMs:number)=>void;
 readonly save:()=>void;
}
/** Register exactly once at bootstrap; callers own any repeated setup prevention. */
export function installPageSaveLifecycle(options:PageSaveLifecycleOptions):void {
 options.every(options.save,8000);
 options.win.addEventListener("beforeunload",options.save);
 // Mobile tabs may be discarded without beforeunload.
 options.win.addEventListener("pagehide",options.save);
 options.doc.addEventListener("visibilitychange",()=>{
  if(options.doc.hidden)options.save();
 });
}
