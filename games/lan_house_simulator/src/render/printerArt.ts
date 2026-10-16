import {iso,polygon,raisedCuboid,type Projection} from "./isometric.js";
import type {Point} from "../sim/types.js";

/** Impressora térmica/jato de tinta compacta: receita geométrica, sem PNG externo.
 * O mesmo equipamento aparece no catálogo e sobre o balcão após a compra. */
export function drawCounterPrinter(ctx:CanvasRenderingContext2D,cam:Projection,counter:Point,active=false,phase=0):void{
 const x=counter.x+.84,y=counter.y+.075,w=.51,d=.28;
 ctx.save();
 // A máquina ocupa apenas o tampo existente (altura do balcão = 55).
 raisedCuboid(ctx,cam,x,y,w,d,55.2,14,["#d8d8ca","#949e95","#75867e"]);
 // Tampa do scanner, desenhada no plano superior.
 polygon(ctx,[iso({x:x+.045,y:y+.04},cam,69.5),iso({x:x+.46,y:y+.04},cam,69.5),
  iso({x:x+.46,y:y+.21},cam,69.5),iso({x:x+.045,y:y+.21},cam,69.5)],"#515c57","#aeb6a9");
 polygon(ctx,[iso({x:x+.08,y:y+.066},cam,69.8),iso({x:x+.42,y:y+.066},cam,69.8),
  iso({x:x+.42,y:y+.19},cam,69.8),iso({x:x+.08,y:y+.19},cam,69.8)],"#b8c6bc");
 // Fenda de saída e indicador verde na face mais próxima do visitante.
 const slotA=iso({x:x+.11,y:y+.281},cam,61),slotB=iso({x:x+.41,y:y+.281},cam,61);
 ctx.strokeStyle="#314940";ctx.lineWidth=Math.max(1,2.1*cam.zoom);
 ctx.beginPath();ctx.moveTo(slotA.x,slotA.y);ctx.lineTo(slotB.x,slotB.y);ctx.stroke();
 const led=iso({x:x+.455,y:y+.28},cam,64);
 ctx.fillStyle=active&&Math.sin(phase*12)>0?"#f0ce75":"#8bd68e";
 ctx.beginPath();ctx.arc(led.x,led.y,Math.max(1,1.8*cam.zoom),0,Math.PI*2);ctx.fill();
 if(active){
  // Folha avança na mesma face, sem ultrapassar fisicamente a área de serviço.
  const feed=.04+.08*(.5+.5*Math.sin(phase*6));
  polygon(ctx,[iso({x:x+.14,y:y+.28},cam,60.9),iso({x:x+.38,y:y+.28},cam,60.9),
   iso({x:x+.38,y:y+.28+feed},cam,60.9),
   iso({x:x+.14,y:y+.28+feed},cam,60.9)],"#fff6df","#b2a995");
  const a=iso({x:x+.19,y:y+.28+feed*.58},cam,61);
  const b=iso({x:x+.33,y:y+.28+feed*.58},cam,61);
  ctx.strokeStyle="#a0afa5";ctx.lineWidth=Math.max(.7,cam.zoom);
  ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
 }
 ctx.restore();
}

/** Vitrine legível em dispositivos pequenos, no mesmo acabamento da copiadora. */
export function drawPrinterShop(ctx:CanvasRenderingContext2D,width=640,height=360):void{
 ctx.save();ctx.scale(width/320,height/180);
 const polygon2=(pts:number[][],fill:string,stroke?:string)=>{
  ctx.beginPath();pts.forEach(([x,y],i)=>i?ctx.lineTo(x!,y!):ctx.moveTo(x!,y!));
  ctx.closePath();ctx.fillStyle=fill;ctx.fill();
  if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1;ctx.stroke();}
 };
 ctx.fillStyle="#e6ead6";ctx.fillRect(0,0,320,180);
 const glow=ctx.createRadialGradient(159,132,8,159,132,140);
 glow.addColorStop(0,"#bbceb6");glow.addColorStop(1,"#e6ead6");
 ctx.fillStyle=glow;ctx.fillRect(0,0,320,180);
 ctx.fillStyle="rgba(39,65,55,.17)";ctx.beginPath();ctx.ellipse(159,150,84,12,0,0,Math.PI*2);ctx.fill();
 // Alimentador com folhas ao fundo.
 polygon2([[123,54],[192,47],[205,74],[139,81]],"#c0c9b9","#587063");
 polygon2([[135,36],[186,32],[196,75],[143,78]],"#f8f3e4","#8caa98");
 ctx.strokeStyle="#b9c8ba";ctx.lineWidth=2;
 for(let i=0;i<4;i++){ctx.beginPath();ctx.moveTo(145,46+i*6);ctx.lineTo(180,43+i*6);ctx.stroke();}
 // Carcaça 2.5D: topo e faces coerentes em perspectiva.
 polygon2([[100,85],[183,74],[218,94],[133,107]],"#f2efdf","#51665d");
 polygon2([[100,85],[133,107],[133,145],[100,122]],"#899b8b","#50675b");
 polygon2([[133,107],[218,94],[218,132],[133,145]],"#d2d8c6","#60776a");
 polygon2([[118,92],[183,84],[207,95],[142,104]],"#56675d","#a7b9a5");
 polygon2([[131,107],[210,96],[210,102],[131,113]],"#415a50");
 polygon2([[146,114],[203,106],[203,111],[146,120]],"#bfcab7");
 polygon2([[136,116],[212,104],[212,110],[136,122]],"#384f48");
 // Papel na bandeja frontal.
 polygon2([[148,118],[196,111],[209,142],[161,149]],"#f8f5e8","#9aa99b");
 for(let i=0;i<3;i++){ctx.strokeStyle="#b5beb1";ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(162,125+i*7);ctx.lineTo(191,121+i*6);ctx.stroke();}
 polygon2([[134,143],[217,130],[212,140],[135,154]],"#61796b","#3b5f51");
 polygon2([[138,143],[203,133],[199,138],[140,150]],"#92a994");
 // Comandos e luz.
 polygon2([[189,88],[209,94],[207,98],[188,92]],"#42645a");
 ctx.fillStyle="#abdb92";ctx.beginPath();ctx.arc(204,95,2,0,Math.PI*2);ctx.fill();
 ctx.fillStyle="#314f3f";ctx.font="bold 10px monospace";ctx.fillText("IMPRESSORA",15,33);
 ctx.font="7px monospace";ctx.fillStyle="#71866f";ctx.fillText("DOCUMENTOS / A4",15,47);
 ctx.fillStyle="#43604f";ctx.font="bold 8px monospace";ctx.fillText("SOFTDOWN",232,92);
 ctx.fillStyle="#6e8469";ctx.font="7px monospace";ctx.fillText("PRONTA",236,105);
 ctx.restore();
}
