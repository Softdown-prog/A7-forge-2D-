import type { Point } from "./types.js";
import { VENDING_APPROACH } from "./layout.js";

/** Circulação simples e determinística pelo corredor frontal. */
export const AISLE_Y = 4.48;
export const COUNTER_QUEUE: Point = { x: 1.55, y: 2.56 };
export const VENDING_QUEUE: Point = VENDING_APPROACH;
export function computerSeat(computer: Point): Point {
  return { x: computer.x + 0.35, y: computer.y + 0.82 };
}
/**
 * Não deslocar os visitantes diretamente através de mesas e computadores:
 * percorrer o corredor y=4.48 e só então aproximar-se do alvo.
 * O array é uma lista ordenada de destinos, sem objetos do runtime ou Canvas.
 */
export function hallwayRoute(from: Point, to: Point): Point[] {
  const points: Point[] = [];
  if (Math.abs(from.y - AISLE_Y) > 0.01) points.push({ x: from.x, y: AISLE_Y });
  if (Math.abs(from.x - to.x) > 0.01) points.push({ x: to.x, y: AISLE_Y });
  if (Math.abs(to.y - AISLE_Y) > 0.01) points.push({ x: to.x, y: to.y });
  return points.length ? points : [{ x: to.x, y: to.y }];
}
