export { NightPrizePresentation,nightPrizePresentation,prizeAmountText } from "../application/nightPresentation.js";
import { nightPrizePresentation,prizeAmountText } from "../application/nightPresentation.js";
/** Comprovante visual da premiação já paga pelo motor exatamente às 7h.
 * É leitura de GameState, não um novo sistema financeiro ou uma transferência.
 */
import type { GameState } from "../sim/types.js";
import { iso,type Projection } from "./isometric.js";
/** Medalha e comprovante presos à posição do verdadeiro vencedor no Canvas.
 * A posição acompanha o cliente enquanto ele deixa o estabelecimento.
 */
export function drawNightPrizePresentation(
 ctx:CanvasRenderingContext2D,s:GameState,camera:Projection,time:number
):void{
 const prize=nightPrizePresentation(s);
 if(!prize)return;
 const n=s.nightMeetup!;
 const winner=s.customers.find(c=>c.id===prize.winnerId&&
  c.nightMeetupDay===n.fridayDay);
 if(!winner)return;
 const at=iso({x:winner.x,y:winner.y},camera,133);
 const z=Math.max(.75,camera.zoom),label="PRÊMIO PAGO · "+prizeAmountText(prize.amount);
 ctx.save();
 ctx.globalAlpha=Math.max(.25,1-prize.ageMinutes/12);
 ctx.font="bold "+Math.max(10,Math.round(12*z))+"px system-ui,sans-serif";
 ctx.textAlign="center";ctx.textBaseline="middle";
 const width=Math.min(ctx.canvas.width-8,Math.max(126,ctx.measureText(label).width+22*z));
 const height=25*z;
 const x=Math.max(width/2+4,Math.min(ctx.canvas.width-width/2-4,at.x));
 const y=Math.max(height/2+4,Math.min(ctx.canvas.height-height/2-4,at.y));
 ctx.fillStyle="rgba(55,41,16,.95)";
 ctx.fillRect(x-width/2,y-height/2,width,height);
 ctx.strokeStyle="#f7d681";ctx.lineWidth=2*z;
 ctx.strokeRect(x-width/2,y-height/2,width,height);
 ctx.fillStyle="#fff1c0";ctx.fillText(label,x,y,width-12);
 for(let i=0;i<6;i++){
  const angle=i*Math.PI/3+time*.6;
  const radius=(21+3*Math.sin(time*2+i))*z;
  const px=x+Math.cos(angle)*(width/2+8*z);
  const py=y+Math.sin(angle)*radius;
  ctx.fillStyle=i%2?"#98e6ef":"#ffe08b";
  ctx.beginPath();ctx.arc(px,py,2*z,0,Math.PI*2);ctx.fill();
 }
 ctx.restore();
}
