/** Draw one LCD catalog model using the same art as playable stations. */
import {drawRetroComputer} from "./retroComputer.js";
import type {GameState} from "../sim/types.js";

export function drawLcdPreviewArtwork(
 context:CanvasRenderingContext2D,
 sample:GameState
):void {
 context.fillStyle="#dce5cf";
 context.fillRect(0,0,320,190);
 drawRetroComputer(context,{originX:150,originY:118,zoom:1.25},
  {x:0,y:0},0,0,true,sample,false);
}
