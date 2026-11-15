/** PS2 Canvas illustration: robos-da-fronteira (original commands). */
import {circle,polygon,stroke} from "./primitives.js";

export function paintRobosDaFronteira(c:CanvasRenderingContext2D):void{
  circle(c,325,143,76,"#a0c8ec");
  for(let i=0;i<10;i++){c.fillStyle=i%2?"#3a5671":"#2a4d6b";c.fillRect(i*46,215+(i%3)*19,43,194);}
  polygon(c,[[70,409],[96,276],[168,276],[200,409]],"#79d7d0");
  c.fillStyle="#d1f5ec";c.fillRect(105,249,59,61);c.fillStyle="#1e344d";c.fillRect(113,273,43,11);
  circle(c,128,280,5,"#f9d489");circle(c,148,280,5,"#f9d489");
  polygon(c,[[233,406],[254,239],[325,239],[352,406]],"#e3a6b1");
  c.fillStyle="#edd8c8";c.fillRect(254,214,71,56);c.fillStyle="#1d3e5a";c.fillRect(263,239,52,9);
  stroke(c,[[160,324],[255,295]],"#aaf8f1",9);stroke(c,[[168,319],[247,298]],"#ffffff",2);
}
