import type { Point,ActorDirection } from "../sim/types.js";
export type { ActorDirection } from "../sim/types.js";

/** Four world directions used by the 2:1 fixed camera, never screen-space mirroring alone. */
/** Rendered orientation on the 2:1 isometric screen, not in the world grid. */
export type ActorScreenView = "front"|"back"|"profile-left"|"profile-right"|
 "front-left"|"front-right"|"back-left"|"back-right";
const AT_REST:Record<ActorDirection,ActorScreenView>={
 north:"back-right",south:"front-left",east:"front-right",west:"back-left"
};
/** x_screen=(x-y)*64, y_screen=(x+y)*32. Diagonal world detours
 * may face the viewer or move screen-horizontally, unlike cardinal steps. */
export function screenViewForMotion(dx:number,dy:number,previous:ActorDirection="south"):ActorScreenView{
 if(!Number.isFinite(dx)||!Number.isFinite(dy)||Math.abs(dx)+Math.abs(dy)<.0001)return AT_REST[previous];
 const sx=dx-dy,sy=(dx+dy)*.5;
 if(Math.abs(sx)>Math.abs(sy)*2.7)return sx<0?"profile-left":"profile-right";
 if(Math.abs(sy)>Math.abs(sx)*2.7)return sy<0?"back":"front";
 return sy<0?(sx<0?"back-left":"back-right"):(sx<0?"front-left":"front-right");
}
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
