/** PS2 Canvas illustration: corrida-no-gelo (original commands). */
import {circle,polygon,stroke} from "./primitives.js";

export function paintCorridaNoGelo(c:CanvasRenderingContext2D):void{
  circle(c,326,138,73,"#effbff");
  polygon(c,[[0,315],[97,194],[170,291],[247,143],[348,307],[420,226],[420,458],[0,458]],"#98c8d6");
  polygon(c,[[97,194],[124,238],[77,232]],"#f5ffff");
  polygon(c,[[247,143],[292,213],[212,201]],"#f5ffff");
  polygon(c,[[161,276],[266,276],[420,468],[0,468]],"#648d9d");
  for(let i=0;i<6;i++)stroke(c,[[211,307+i*26],[214,315+i*28]],"#effff8",6+i);
  polygon(c,[[90,363],[146,331],[280,331],[338,363],[349,404],[79,404]],"#56d5da");
  polygon(c,[[146,332],[179,300],[256,300],[290,332]],"#ddf8fc");
  for(const x of [117,316])circle(c,x,405,20,"#2a4a5f");
}
