/** PS2 Canvas illustration: batida-de-rua (original commands). */
import {circle,polygon,stroke} from "./primitives.js";

export function paintBatidaDeRua(c:CanvasRenderingContext2D):void{
 circle(c,314,140,89,"#ffa3ce");
 for(let i=0;i<14;i++){
  const x=7+i*31,h=47+(i*29)%151;
  c.fillStyle=i%3===0?"#80edee":i%3===1?"#ffe18b":"#f593c8";
  c.fillRect(x,391-h,21,h);
 }
 polygon(c,[[73,258],[347,258],[363,406],[57,406]],"#21264f");
 polygon(c,[[91,273],[330,273],[341,388],[81,388]],"#4f3d77");
 for(const x of [154,274]){
  circle(c,x,332,50,"#151c46");circle(c,x,332,38,"#81d8e2");
  circle(c,x,332,22,"#28204c");circle(c,x,332,9,"#e9c6fd");
 }
 stroke(c,[[194,292],[232,292]],"#fddda1",9);
 for(let i=0;i<11;i++)stroke(c,[[22+i*35,410],[39+i*35,424]],"#ffbe7e",3);
}
