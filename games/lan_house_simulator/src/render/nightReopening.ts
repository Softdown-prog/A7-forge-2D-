export { NightReopeningPresentation,nightReopeningPresentation } from "../application/nightPresentation.js";
import { nightReopeningPresentation } from "../application/nightPresentation.js";
/** Transição visual do fim do corujão, lida do motor original.
 * A madrugada continua com totalMinutes congelado na sexta até as 10h;
 * esta apresentação não avança calendário, não altera NPCs nem saves.
 */
import type { GameState } from "../sim/types.js";
/** Placa pequena no salão isométrico, sem objetos nem colisão no mapa. */
export function drawNightReopening(
 ctx:CanvasRenderingContext2D,s:GameState,time:number
):void{
 const state=nightReopeningPresentation(s);
 if(!state)return;
 const opened=state.phase==="open",service=state.phase==="service",
  closing=state.phase==="closing",width=332,height=80;
 const x=ctx.canvas.width-width-18,y=20;
 const pulse=opened?0.8+0.2*Math.sin(time*2):1;
 ctx.save();
 ctx.fillStyle="rgba(16,31,39,.93)";
 ctx.fillRect(x,y,width,height);
 ctx.lineWidth=1.7;
 ctx.strokeStyle=opened?"#d9d07f":service?"#81c8aa":closing?"#f0b475":"#80bacc";
 ctx.strokeRect(x+.9,y+.9,width-1.8,height-1.8);
 ctx.textAlign="left";ctx.textBaseline="middle";
 ctx.globalAlpha=pulse;
 ctx.fillStyle=opened?"#ffeb9a":service?"#a8eac4":closing?"#ffd1a4":"#b7ecdf";
 ctx.font="bold 15px system-ui,sans-serif";
 ctx.fillText(state.title,x+14,y+22,width-25);
 ctx.globalAlpha=1;
 ctx.fillStyle="#f1f6f0";ctx.font="12px system-ui,sans-serif";
 ctx.fillText(state.details,x+14,y+48,width-25);
 ctx.fillStyle="rgba(255,255,255,.14)";
 ctx.fillRect(x+14,y+65,width-28,5);
 ctx.fillStyle=opened?"#f3d377":"#82d7c5";
 ctx.fillRect(x+14,y+65,(width-28)*Math.max(0,Math.min(1,state.progress)),5);
 ctx.restore();
}
