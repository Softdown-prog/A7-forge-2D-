import {iso,type Projection} from "./isometric.js";
import type {Point} from "../sim/types.js";
import {CLOSING_START_MINUTE} from "../sim/engine.js";
import {DAY_MINUTES} from "../sim/types.js";

/** Horário simulado: a lan house abre às 10:00 e encerra o expediente às 21:00.
 * A placa desliga quando o salão começa a fechar, não quando muda o FPS. */
export function neonOpenLit(totalMinutes:number):boolean{
 if(!Number.isFinite(totalMinutes)||totalMinutes<0)return false;
 return totalMinutes%DAY_MINUTES<CLOSING_START_MINUTE;
}
/** Placa física junto à porta, isométrica e sem novo footprint.
 * Não depende de APIs de pagamento nem modifica a simulação. */
export function drawNeonOpenSign(
 ctx:CanvasRenderingContext2D,cam:Projection,world:Point,time:number,lit:boolean
):void{
 const at=iso(world,cam,115),z=cam.zoom;
 const w=108*z,h=45*z,x=at.x-w/2,y=at.y-h/2;
 ctx.save();ctx.lineJoin="round";ctx.lineCap="round";
 // Cantoneiras metálicas e dois olhais suspensos.
 for(const dx of [-w*.34,w*.34]){
  ctx.strokeStyle="#3e4d5e";ctx.lineWidth=4*z;
  ctx.beginPath();ctx.moveTo(at.x+dx,y-8*z);ctx.lineTo(at.x+dx,y+4*z);ctx.stroke();
  ctx.strokeStyle="#9cabb2";ctx.lineWidth=1.25*z;
  ctx.beginPath();ctx.moveTo(at.x+dx-1.2*z,y-8*z);ctx.lineTo(at.x+dx-1.2*z,y+4*z);ctx.stroke();
 }
 // Moldura extrudada, cantos arredondados, face fosca.
 ctx.fillStyle="rgba(4,11,19,.3)";
 ctx.beginPath();ctx.roundRect(x+3*z,y+5*z,w,h,7*z);ctx.fill();
 ctx.fillStyle="#111b29";
 ctx.beginPath();ctx.roundRect(x,y,w,h,6.5*z);ctx.fill();
 ctx.strokeStyle="#688091";ctx.lineWidth=2.8*z;ctx.stroke();
 const metal=ctx.createLinearGradient(x,y,x+w,y+h);
 metal.addColorStop(0,"#4e6375");metal.addColorStop(.35,"#132334");
 metal.addColorStop(.7,"#23394a");metal.addColorStop(1,"#5c7384");
 ctx.fillStyle=metal;ctx.beginPath();ctx.roundRect(x+4*z,y+4*z,w-8*z,h-8*z,5*z);ctx.fill();
 ctx.fillStyle="#0b1522";ctx.beginPath();ctx.roundRect(x+8*z,y+8*z,w-16*z,h-16*z,3.5*z);ctx.fill();
 // Diodos e circuitos são parte do objeto, com luz desligada à noite.
 const power=lit?Math.max(.72,.88+.09*Math.sin(time*1.8)):.14;
 const cyan=lit?"#66fae1":"#3d676b",rose=lit?"#ff83bf":"#655061";
 if(lit){ctx.shadowBlur=14*z*power;ctx.shadowColor=cyan;}
 ctx.strokeStyle=cyan;ctx.lineWidth=1.5*z;
 ctx.beginPath();ctx.roundRect(x+11*z,y+11*z,w-22*z,h-22*z,2.2*z);ctx.stroke();
 ctx.shadowBlur=0;
 // Linha superior discreta: nome do estabelecimento.
 ctx.textAlign="center";ctx.textBaseline="middle";
 ctx.font=`700 ${Math.max(4,6.3*z)}px Arial,sans-serif`;
 ctx.fillStyle=lit?"#8ed6cc":"#536575";
 ctx.fillText("LAN HOUSE",at.x,y+14.8*z,w*.68);
 ctx.font=`900 ${Math.max(11,20*z)}px Arial,sans-serif`;
 ctx.lineWidth=4*z;
 ctx.strokeStyle="#07111b";
 ctx.strokeText("ABERTO",at.x,y+29*z,w*.76);
 if(lit){ctx.shadowBlur=9*z*power;ctx.shadowColor=rose;}
 ctx.fillStyle=rose;ctx.fillText("ABERTO",at.x,y+29*z,w*.76);
 ctx.shadowBlur=0;
 // Ponto indicador elétrico e reflexos na chapa.
 ctx.fillStyle=lit?"#f6d77a":"#46505d";
 ctx.beginPath();ctx.arc(x+13*z,y+15*z,1.6*z,0,Math.PI*2);ctx.fill();
 ctx.strokeStyle="rgba(238,252,255,.18)";ctx.lineWidth=1*z;
 ctx.beginPath();ctx.moveTo(x+11*z,y+8*z);ctx.lineTo(x+w*.45,y+8*z);ctx.stroke();
 ctx.restore();
}
