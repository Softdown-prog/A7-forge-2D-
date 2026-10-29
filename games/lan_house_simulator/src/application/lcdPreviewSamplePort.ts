/** An isolated, disposable sample state for LCD catalog illustrations.
 * It must never share the active campaign or advance the simulation.
 */
import {createGame} from "../sim/engine.js";
import type {GameState} from "../sim/types.js";
import type {LcdId} from "../sim/computerModels.js";

export function createLcdPreviewSample(id:LcdId):GameState {
 const sample=createGame();
 sample.pcTiers=[3,3,3];
 sample.pcLcdModels=[id,null,null];
 return sample;
}
