/** World-facing direction, independent of projection or drawing. */
import type {Point,ActorDirection} from "./types.js";
export type {ActorDirection} from "./types.js";

export function directionFromDelta(dx:number,dy:number,previous:ActorDirection="south"):ActorDirection {
  if(Math.abs(dx)+Math.abs(dy)<0.0001)return previous;
  if(Math.abs(dx)>Math.abs(dy))return dx>0?"east":"west";
  return dy>0?"south":"north";
}

export function movementDirection(from:Point,to:Point,previous:ActorDirection="south"):ActorDirection {
  return directionFromDelta(to.x-from.x,to.y-from.y,previous);
}
