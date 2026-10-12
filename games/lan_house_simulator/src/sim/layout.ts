import type { Point } from "./types.js";

/** Uma fonte única para posições físicas e atendimento das máquinas. */
export interface VendingMachinePlacement extends Point {
  kind: "soda" | "candy";
}
export const VENDING_WIDTH=0.66;
export const VENDING_DEPTH=0.59;
export const VENDING_MACHINES: readonly VendingMachinePlacement[]=[
  {kind:"soda",x:5.22,y:0.18},
  {kind:"candy",x:6.02,y:0.18}
];
/** Fila centrada em frente às duas vitrines, fora da área das máquinas. */
export const VENDING_APPROACH:Point={
  x:(VENDING_MACHINES[0]!.x+VENDING_MACHINES[1]!.x+VENDING_WIDTH)/2,
  y:VENDING_MACHINES[0]!.y+VENDING_DEPTH+0.88
};
