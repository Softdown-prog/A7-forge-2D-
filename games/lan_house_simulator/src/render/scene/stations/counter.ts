import type {GameState} from "../../../sim/types.js";
import type {PlacedPoint} from "../../../sim/layout.js";
import {objectCamera,type Projection} from "../../isometric.js";
import {drawCounter} from "../../counterArt.js";
import {drawCounterPrinter} from "../../printerArt.js";
import {printingAnimationActive} from "../../../sim/printService.js";
import {copyingAnimationActive} from "../../../sim/discCopy.js";
import {drawCounterDiscCopier} from "../../discCopierArt.js";

/** The counter alone is reused for edit-mode previews without paid peripherals. */
  export function drawCounterSurface(ctx:CanvasRenderingContext2D,camera:Projection,p:PlacedPoint={x:.9,y:1.42}):void {
    drawCounter(ctx,objectCamera(camera,p,1.75,.72,p.rotation),p);
  }

/** Draws the counter, then printer and disc copier in their original visual order. */
export function drawSceneCounter(
 ctx:CanvasRenderingContext2D,camera:Projection,counter:PlacedPoint,s:GameState,elapsedSeconds:number
):void {
 drawCounterSurface(ctx,camera,counter);
 if(s.printer)drawCounterPrinter(ctx,objectCamera(camera,counter,1.75,.72,counter.rotation),
   counter,printingAnimationActive(s),elapsedSeconds);
 if(s.discCopier)drawCounterDiscCopier(ctx,objectCamera(camera,counter,1.75,.72,counter.rotation),
   counter,copyingAnimationActive(s),elapsedSeconds);
}
