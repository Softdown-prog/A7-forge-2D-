import type { Point } from "../sim/types.js";

/** Four world directions used by the 2:1 fixed camera, never screen-space mirroring alone. */
export type ActorDirection = "north" | "south" | "east" | "west";
export function directionFromDelta(dx:number,dy:number,previous:ActorDirection="south"):ActorDirection {
  if(Math.abs(dx)+Math.abs(dy)<0.0001)return previous;
  if(Math.abs(dx)>Math.abs(dy))return dx>0?"east":"west";
  return dy>0?"south":"north";
}
export function movementDirection(from:Point,to:Point,previous:ActorDirection="south"):ActorDirection {
  return directionFromDelta(to.x-from.x,to.y-from.y,previous);
}
/** PC faces +Y into the aisle; its user must face -Y toward the monitor. */
export const COMPUTER_DIRECTION:ActorDirection="north";
