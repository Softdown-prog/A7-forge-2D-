/** DOM-only visibility and media preference tracker for the animation frame.
 * The game simulation never depends on these browser presentation hints.
 * Factories are injected to retain native Window receiver semantics.
 */
export interface FrameIntersection {
 readonly isIntersecting:boolean;
}
export interface FrameMediaQuery {
 readonly matches:boolean;
}
export interface FrameViewportObserver {
 observe(target:Element):void;
}
export interface FrameViewportState {
 visible():boolean;
 coarsePointer():boolean;
 reducedMotion():boolean;
}
export function createFrameViewportState(
 canvas:HTMLCanvasElement,
 makeObserver:(callback:(entries:readonly FrameIntersection[])=>void)=>FrameViewportObserver,
 matchMedia:(query:string)=>FrameMediaQuery
):FrameViewportState {
 // Start visible until an observation is delivered, just like the old frame loop.
 let sceneVisible=true;
 makeObserver(entries=>{sceneVisible=entries[0]?.isIntersecting??false;}).observe(canvas);
 const coarse=matchMedia("(pointer:coarse)");
 const reduced=matchMedia("(prefers-reduced-motion: reduce)");
 return {
  visible:()=>sceneVisible,
  coarsePointer:()=>coarse.matches,
  reducedMotion:()=>reduced.matches
 };
}
