import type { Customer, GameState, Point } from "./types.js";
import { COUNTER_QUEUE } from "./route.js";

/** A fila dobra no corredor frontal; seus lugares nunca se sobrepõem. */
export const COUNTER_QUEUE_GAP = 0.66;
export const MAX_COUNTER_QUEUE = 10;
export const CUSTOMER_COLLISION_RADIUS = 0.43;

export function counterQueueSlot(index:number):Point {
  const n=Math.max(0,Math.floor(index));
  if(n<=4)return {x:COUNTER_QUEUE.x,y:COUNTER_QUEUE.y+n*COUNTER_QUEUE_GAP};
  return {x:COUNTER_QUEUE.x+(n-4)*COUNTER_QUEUE_GAP,
    y:COUNTER_QUEUE.y+4*COUNTER_QUEUE_GAP};
}

export function counterQueueCustomers(state:GameState):Customer[] {
  return state.customers.filter(c=>c.stage==="arriving"||c.stage==="waiting")
    .sort((a,b)=>a.id-b.id);
}

export function counterQueueIndex(state:GameState,customer:Customer):number {
  return counterQueueCustomers(state).findIndex(c=>c.id===customer.id);
}

export function queueSlotsAreSeparated(count=MAX_COUNTER_QUEUE):boolean {
  const points=Array.from({length:count},(_,i)=>counterQueueSlot(i));
  return points.every((point,i)=>points.every((other,j)=>i===j||
    Math.hypot(point.x-other.x,point.y-other.y)>=CUSTOMER_COLLISION_RADIUS+0.18));
}
