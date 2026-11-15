/** PS2 Canvas illustration: guardioes-do-oceano (original commands). */
import {circle,polygon} from "./primitives.js";

export function paintGuardioesDoOceano(c:CanvasRenderingContext2D):void{
  circle(c,320,126,77,"#99e7ed");
  for(let i=0;i<28;i++)circle(c,20+(i*73)%388,78+(i*41)%350,2+(i%4),"#c0fcf7");
  polygon(c,[[0,389],[80,340],[160,391],[262,320],[348,390],[420,342],[420,465],[0,465]],"#17697a");
  polygon(c,[[92,316],[141,264],[283,264],[340,319],[295,349],[134,349]],"#e3c98c");
  for(const x of [156,228,294]){circle(c,x,319,23,"#216985");circle(c,x,319,12,"#a0f4e8");}
  polygon(c,[[332,300],[396,263],[396,351],[328,343]],"#cae5bb");
  for(const [x,y] of [[46,238],[360,209],[62,358]] as const){
   polygon(c,[[x-20,y],[x,y-13],[x+21,y],[x,y+13]],"#dcfbcb");
  }
}
