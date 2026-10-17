import type {Point} from "../sim/types.js";
import {iso,type Projection} from "./isometric.js";

/** Pequenos efeitos procedurais de contato entre ferramenta e destino.
 * Apenas leitura visual: sem RNG, jobs, despesas, timers ou saves. */
export type WorkEffectKind="cleaner"|"technician";
export interface WorkEffectFrame {pulse:number;glint:number;drift:number;opacity:number}
export function workEffectFrame(kind:WorkEffectKind,time:number):WorkEffectFrame{
 const t=Number.isFinite(time)?time:0;
 if(kind==="cleaner"){
  const pulse=Math.sin(t*8.2);
  return {pulse,glint:0,drift:pulse*5,opacity:.25+.27*Math.abs(pulse)};
 }
 const pulse=Math.sin(t*11);
 return {pulse,drift:0,glint:Math.max(0,(pulse-.28)/.72),opacity:.22+.48*Math.max(0,(pulse-.28)/.72)};
}
/** O efeito fica sobre a peça atendida, não sob os pés do funcionário.
 * Espessuras mínimas em pixels deixam os gestos legíveis no zoom menor. */
export function drawWorkContact(ctx:CanvasRenderingContext2D,camera:Projection,
 kind:WorkEffectKind,target:Point,time:number):void{
 const z=camera.zoom,frame=workEffectFrame(kind,time);
 const at=iso(target,camera,kind==="technician"?31:2);
 ctx.save();ctx.translate(at.x,at.y);
 ctx.lineCap="round";ctx.lineJoin="round";
 if(kind==="cleaner"){
  // Rastros curtos de poeira no piso e movimento lateral: sem nuvem ou partícula solta.
  ctx.strokeStyle="rgba(226,212,171,"+frame.opacity.toFixed(3)+")";
  ctx.lineWidth=Math.max(1,1.6*z);
  for(let i=0;i<3;i++){
   const x=(i-1)*7*z+frame.drift*z,y=(3+Math.abs(i-1)*2)*z;
   ctx.beginPath();ctx.moveTo(x-5*z,y+2*z);
   ctx.quadraticCurveTo(x,y-3*z,x+5*z,y+2*z);ctx.stroke();
  }
  ctx.fillStyle="rgba(166,153,112,"+(.18+.2*Math.abs(frame.pulse)).toFixed(3)+")";
  ctx.beginPath();ctx.ellipse(frame.drift*z,7*z,12*z,3*z,0,0,Math.PI*2);ctx.fill();
 }else{
  // Reflexo de metal sincronizado com a chave, nunca um raio ou solda chamativa.
  const shine=frame.glint;
  ctx.strokeStyle="rgba(255,218,134,"+(.25+.65*shine).toFixed(3)+")";
  ctx.lineWidth=Math.max(1,1.4*z);
  const radius=(3+3*shine)*z;
  ctx.beginPath();ctx.moveTo(-radius,0);ctx.lineTo(radius,0);
  ctx.moveTo(0,-radius*.65);ctx.lineTo(0,radius*.65);ctx.stroke();
  if(shine>.12){
   ctx.fillStyle="rgba(245,226,166,"+(.3+.5*shine).toFixed(3)+")";
   ctx.beginPath();ctx.arc(0,0,Math.max(1.2,1.9*z),0,Math.PI*2);ctx.fill();
  }
 }
 ctx.restore();
}
