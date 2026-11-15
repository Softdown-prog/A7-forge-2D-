/** PS2 Canvas illustration: lendas-do-vulcao (original commands). */
import {circle,polygon} from "./primitives.js";

export function paintLendasDoVulcao(c:CanvasRenderingContext2D):void{
  circle(c,316,134,72,"#f5aa86");
  polygon(c,[[0,373],[96,294],[170,360],[235,196],[315,356],[420,280],[420,467],[0,467]],"#432942");
  polygon(c,[[176,356],[235,199],[301,363],[260,336],[238,297],[216,334]],"#ed674e");
  for(let i=0;i<7;i++)circle(c,181+i*25,209+(i*37)%126,3+i%3,"#ffd190");
  polygon(c,[[70,375],[147,281],[196,327],[226,393]],"#94758a");
  polygon(c,[[170,315],[228,253],[293,305],[367,275],[327,335],[249,356]],"#c7a1a4");
  circle(c,330,309,9,"#ffe7a7");
}
