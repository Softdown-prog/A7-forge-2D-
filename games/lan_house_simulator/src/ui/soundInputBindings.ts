/** One delegated audio binding set for the entire game DOM.
 * Every method is called on its owning sound mixer, so browser/native
 * audio methods retain their original receiver and unlock gesture.
 */
export interface SoundInputPort {
 preload():void;
 unlock():void;
 click():void;
 stopKeyboard():void;
}
export function installSoundInputBindings(
 doc:Pick<Document,"addEventListener"|"hidden">,
 audio:SoundInputPort
):void {
 audio.preload();
 // Capture phase allows unlock before buttons/gestures use audio.
 doc.addEventListener("pointerdown",()=>audio.unlock(),{capture:true});
 doc.addEventListener("keydown",e=>{
  if(e.key==="Enter"||e.key===" ")audio.unlock();
 },{capture:true});
 doc.addEventListener("click",event=>{
  const target=event.target;
  if(!(target instanceof Element))return;
  const control=target.closest("button");
  if(control instanceof HTMLButtonElement&&!control.disabled)audio.click();
 },{capture:true});
 doc.addEventListener("visibilitychange",()=>{
  if(doc.hidden)audio.stopKeyboard();
 });
}
