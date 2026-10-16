import type {Point} from "./types.js";
import {stationPoint,type PlacedPoint} from "./layout.js";

/** Âncoras no piso, fora das mesas e do volume da lixeira.
 * A direção do PC é respeitada mesmo após o jogador girar a estação. */
export function technicianWorkPoint(pc:PlacedPoint):Point{
 return stationPoint(pc,.95,1.20);
}
export function technicianContactPoint(pc:PlacedPoint):Point{
 return stationPoint(pc,.55,.60);
}
export function cleanerWorkPoint(bin:Point):Point{
 return {x:bin.x+.46,y:bin.y+.40};
}
/** Posição gráfica do funcionário não pode mudar só no render: o ponto
 * em que ele anda e aquele no qual fica parado são sempre o mesmo. */
export function workerGroundDistance(a:Point,b:Point):number{
 return Math.hypot(a.x-b.x,a.y-b.y);
}
