/** Event ordering for a single animation frame, independent of the sim, DOM and sound mixer.
 * Consume mail after stepGame; never process queued effects when the game is paused.
 * The caller owns the current save and the counters (safe after importing a different save).
 */
export interface FrameEffectConsumer {
 payments(playing:boolean):void;
 sales(playing:boolean):void;
 prints(playing:boolean):void;
 keyboards(playing:boolean):void;
 speech(playing:boolean):void;
}
export interface FrameEventDispatchOptions {
 readonly playing:boolean;
 readonly countNewMail:()=>number;
 readonly isDocumentHidden:()=>boolean;
 readonly notifyMail:()=>void;
 readonly feedback:FrameEffectConsumer;
 readonly updateServed:()=>void;
 readonly updatePurchases:()=>void;
}
export function dispatchFrameEvents(options:FrameEventDispatchOptions):void {
 const arrivedMail=options.playing?options.countNewMail():0;
 if(arrivedMail>0&&!options.isDocumentHidden())options.notifyMail();
 options.feedback.payments(options.playing);
 options.updateServed();
 options.feedback.sales(options.playing);
 options.feedback.prints(options.playing);
 options.feedback.keyboards(options.playing);
 options.updatePurchases();
 options.feedback.speech(options.playing);
}
