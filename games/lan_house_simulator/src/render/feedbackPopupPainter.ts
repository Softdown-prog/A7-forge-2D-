/** Canvas-only animation of temporary UI feedback.
 * Uses the same appearance, expiration thresholds and draw order as the
 * original main loop. The state of the simulation is never changed.
 */
import {iso,type Projection} from "./isometric.js";
import type {PopupQueues} from "../application/frameFeedbackPort.js";

export function paintFeedbackPopups(
 context:CanvasRenderingContext2D,
 getCamera:()=>Projection,
 queues:PopupQueues,
 dt:number,
 visible:boolean
):void {
 // Request a camera for each layer, matching the previous painter calls.
 paintPayments(context,getCamera(),queues.payments,dt,visible);
 paintSales(context,getCamera(),queues.sales,dt,visible);
 paintSpeech(context,getCamera(),queues.speech,dt,visible);
}

function paintPayments(context:CanvasRenderingContext2D,camera:Projection,paymentPopups:PopupQueues["payments"],dt:number,visible:boolean):void {
  for(let i=paymentPopups.length-1;i>=0;i--){
    const effect=paymentPopups[i]!;
    effect.age+=dt;
    if(effect.age>=1.35){paymentPopups.splice(i,1);continue;}
    if(!visible)continue;
    const at=iso({x:effect.x,y:effect.y},camera,94);
    const alpha=Math.min(1,(1.35-effect.age)/0.4);
    context.save();context.globalAlpha=alpha;
    context.textAlign="center";context.lineWidth=3.2;
    context.font="bold 20px system-ui,sans-serif";
    const label="+R$ "+effect.amount;
    const height=effect.age*43;
    context.strokeStyle="#103622";context.fillStyle="#70F0A6";
    context.strokeText(label,at.x,at.y-height);
    context.fillText(label,at.x,at.y-height);
    context.restore();
  }
}

function paintSales(context:CanvasRenderingContext2D,camera:Projection,salePopups:PopupQueues["sales"],dt:number,visible:boolean):void {
 for(let i=salePopups.length-1;i>=0;i--){
  const effect=salePopups[i]!;
  effect.age+=dt;
  if(effect.age>=1.35){salePopups.splice(i,1);continue;}
  if(!visible)continue;
  const at=iso({x:effect.x,y:effect.y},camera,110);
  context.save();
  context.globalAlpha=Math.min(1,(1.35-effect.age)/0.4);
  context.textAlign="center";context.lineWidth=3;
  context.font="bold 17px system-ui,sans-serif";
  context.strokeStyle="#103622";context.fillStyle="#70F0A6";
  const label="+R$ "+effect.amount,y=at.y-effect.age*38;
  context.strokeText(label,at.x,y);context.fillText(label,at.x,y);
  context.restore();
 }
}

function paintSpeech(context:CanvasRenderingContext2D,camera:Projection,speechPopups:PopupQueues["speech"],dt:number,visible:boolean):void {
 for(let i=speechPopups.length-1;i>=0;i--){
  const b=speechPopups[i]!;
  b.age+=dt;if(b.age>=2.6){speechPopups.splice(i,1);continue;}
  if(!visible)continue;
  const p=iso({x:b.x,y:b.y},camera,146);
  const alpha=Math.min(1,(2.6-b.age)/0.4);
  context.save();context.globalAlpha=alpha;context.font="bold 13px system-ui,sans-serif";
  const width=Math.min(190,context.measureText(b.text).width+20);
  const x=p.x-width/2,y=p.y-b.age*12-25;
  context.fillStyle=b.kind==="praise"?"#e3f9e9":"#fff2df";
  context.strokeStyle=b.kind==="praise"?"#227348":"#9c5238";
  context.lineWidth=2;
  context.beginPath();context.roundRect(x,y,width,27,8);context.fill();context.stroke();
  context.fillStyle="#26302c";context.textAlign="center";
  context.fillText(b.text,p.x,y+18,width-12);
  context.restore();
 }
}
