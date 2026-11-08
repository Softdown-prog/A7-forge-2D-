import {iso,polygon,raisedCuboid,type Projection} from "./isometric.js";
import type {Point} from "../sim/types.js";
import {drawRasterCached,rasterCacheUsable} from "./rasterCache.js";
import {contactShadow,faceVisible as visible} from "./planeArt.js";

const PRINTER={x:.84,y:.075,w:.51,d:.28,base:55.2};
/** Position of a point on the front face (u across, v up), just outside the body. */
function frontPoint(cam:Projection,counter:Point,u:number,z:number,out=.003):Point{
 return iso({x:counter.x+PRINTER.x+u*PRINTER.w,y:counter.y+PRINTER.y+PRINTER.d+out},cam,z);
}
function quad(ctx:CanvasRenderingContext2D,pts:Point[],fill:string|CanvasGradient,stroke?:string):void{polygon(ctx,pts,fill,stroke);}
/** Static body of the counter printer: everything that does not move or blink. */
function paintPrinterBody(ctx:CanvasRenderingContext2D,cam:Projection,counter:Point):void{
 const {x:px,y:py,w,d,base}=PRINTER,x=counter.x+px,y=counter.y+py;
 ctx.save();ctx.lineJoin="round";ctx.lineCap="round";
 contactShadow(ctx,cam,x,y,w,d,base-.1,.24);
 // Rear paper tray: a stack of sheets leaning back. Drawn after the body when the
 // camera looks from behind, so it always sits on the correct side of the case.
 const tray=():void=>{
  const a=iso({x:x+.07,y:y+.045},cam,base+13),b=iso({x:x+.44,y:y+.045},cam,base+13);
  const c1=iso({x:x+.44,y:y+.005},cam,base+21),d1=iso({x:x+.07,y:y+.005},cam,base+21);
  quad(ctx,[a,b,c1,d1],"#faf6e8","#a9b2a2");
  const e=iso({x:x+.09,y:y+.036},cam,base+13),f=iso({x:x+.42,y:y+.036},cam,base+13);
  const g=iso({x:x+.42,y:y+.004},cam,base+19),h=iso({x:x+.09,y:y+.004},cam,base+19);
  ctx.strokeStyle="rgba(130,150,138,.45)";ctx.lineWidth=Math.max(.6,.8*cam.zoom);
  for(const t of [.25,.5,.75]){ctx.beginPath();ctx.moveTo(e.x+(h.x-e.x)*t,e.y+(h.y-e.y)*t);ctx.lineTo(f.x+(g.x-f.x)*t,f.y+(g.y-f.y)*t);ctx.stroke();}
  // Rear support rail.
  quad(ctx,[iso({x:x+.05,y:y+.03},cam,base+13),iso({x:x+.07,y:y+.03},cam,base+13),iso({x:x+.07,y:y+.0},cam,base+23),iso({x:x+.05,y:y+.0},cam,base+23)],"#6c7b73","#46564e");
  quad(ctx,[iso({x:x+.44,y:y+.03},cam,base+13),iso({x:x+.46,y:y+.03},cam,base+13),iso({x:x+.46,y:y+.0},cam,base+23),iso({x:x+.44,y:y+.0},cam,base+23)],"#6c7b73","#46564e");
 };
 const trayMid=iso({x:x+.25,y:y+.02},cam,base+20).y,bodyMid=iso({x:x+w/2,y:y+d/2},cam,base+8).y;
 const trayBehind=trayMid<bodyMid;
 if(trayBehind)tray();
 // Dark plinth, then the pale case.
 raisedCuboid(ctx,cam,x,y,w,d,base,4.5,["#76847c","#52615a","#43524c"]);
 raisedCuboid(ctx,cam,x+.004,y+.004,w-.008,d-.008,base+4.5,9.6,["#e7e7d9","#a9b3aa","#84958c"]);
 // Scanner lid with a rim, a lighter glass and a grab handle on the front edge.
 raisedCuboid(ctx,cam,x+.028,y+.03,w-.056,d-.062,base+14.1,2.4,["#d9ddd0","#b1bcb3","#97a69d"]);
 polygon(ctx,[iso({x:x+.06,y:y+.055},cam,base+16.55),iso({x:x+w-.06,y:y+.055},cam,base+16.55),
  iso({x:x+w-.06,y:y+d-.05},cam,base+16.55),iso({x:x+.06,y:y+d-.05},cam,base+16.55)],"#4f5b56","#a9b3a8");
 const glass=ctx.createLinearGradient(...(()=>{const a=iso({x:x+.07,y:y+.06},cam,base+16.7),b=iso({x:x+w-.07,y:y+d-.055},cam,base+16.7);return [a.x,a.y,b.x,b.y] as const;})());
 glass.addColorStop(0,"#d3e1d8");glass.addColorStop(.55,"#9fb7ab");glass.addColorStop(1,"#c3d6cb");
 polygon(ctx,[iso({x:x+.075,y:y+.065},cam,base+16.7),iso({x:x+w-.075,y:y+.065},cam,base+16.7),
  iso({x:x+w-.075,y:y+d-.06},cam,base+16.7),iso({x:x+.075,y:y+d-.06},cam,base+16.7)],glass);
 ctx.strokeStyle="rgba(255,255,255,.55)";ctx.lineWidth=Math.max(.6,.9*cam.zoom);
 {const a=iso({x:x+.12,y:y+.075},cam,base+16.8),b=iso({x:x+.2,y:y+d-.07},cam,base+16.8);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}
 {const a=iso({x:x+.18,y:y+d-.012},cam,base+14.8),b=iso({x:x+.33,y:y+d-.012},cam,base+14.8);
  ctx.strokeStyle="#58665f";ctx.lineWidth=Math.max(1,2*cam.zoom);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}
 if(visible(cam,"front")){
  // Output slot and tray, paper left in the tray, control panel with LCD and buttons.
  quad(ctx,[frontPoint(cam,counter,.07,base+5.6),frontPoint(cam,counter,.69,base+5.6),frontPoint(cam,counter,.69,base+10.4),frontPoint(cam,counter,.07,base+10.4)],"#2f3f39","#223029");
  quad(ctx,[frontPoint(cam,counter,.1,base+5.8),frontPoint(cam,counter,.66,base+5.8),frontPoint(cam,counter,.66,base+6.6),frontPoint(cam,counter,.1,base+6.6)],"#1b2622");
  quad(ctx,[frontPoint(cam,counter,.73,base+5.2),frontPoint(cam,counter,.96,base+5.2),frontPoint(cam,counter,.96,base+12.4),frontPoint(cam,counter,.73,base+12.4)],"#3a4a44","#26342e");
  quad(ctx,[frontPoint(cam,counter,.755,base+8.6,.004),frontPoint(cam,counter,.935,base+8.6,.004),frontPoint(cam,counter,.935,base+11.6,.004),frontPoint(cam,counter,.755,base+11.6,.004)],"#9bd18b","#1d2a24");
  quad(ctx,[frontPoint(cam,counter,.765,base+10.6,.005),frontPoint(cam,counter,.86,base+10.6,.005),frontPoint(cam,counter,.86,base+11,.005),frontPoint(cam,counter,.765,base+11,.005)],"#2c4a35");
  for(let i=0;i<3;i++){const b=frontPoint(cam,counter,.775+i*.06,base+6.9,.005);ctx.fillStyle=i===2?"#d8b45f":"#9fb0a5";ctx.beginPath();ctx.arc(b.x,b.y,Math.max(.8,1.15*cam.zoom),0,Math.PI*2);ctx.fill();}
  // Brand strip on the left of the case.
  quad(ctx,[frontPoint(cam,counter,.07,base+11.7),frontPoint(cam,counter,.3,base+11.7),frontPoint(cam,counter,.3,base+12.6),frontPoint(cam,counter,.07,base+12.6)],"#6a7a71");
  // A stack of printed sheets resting in the output tray, slightly fanned out.
  const t=(u:number,v:number,z:number)=>iso({x:x+u*w,y:y+d+v},cam,z);
  quad(ctx,[t(.12,.0,base+6.4),t(.62,.0,base+6.4),t(.64,.075,base+5.6),t(.1,.075,base+5.6)],"#f6f1df","#aaa391");
  quad(ctx,[t(.15,.0,base+6.9),t(.6,.0,base+6.9),t(.63,.06,base+6.2),t(.13,.06,base+6.2)],"#fffaea","#b9b29f");
  ctx.strokeStyle="#9fb0a5";ctx.lineWidth=Math.max(.5,.7*cam.zoom);
  for(const v of [.018,.034,.05]){const a=t(.2,v,base+6.5),b=t(.55,v,base+6.5);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}
 }
 // Vents on whichever long side is visible.
 const side=(face:"right"|"left")=>{
  const sx=face==="right"?x+w+.002:x-.002;
  ctx.strokeStyle="#677970";ctx.lineWidth=Math.max(.6,.9*cam.zoom);
  for(let i=0;i<4;i++){const a=iso({x:sx,y:y+.05+i*.05},cam,base+9.2),b=iso({x:sx,y:y+.05+i*.05},cam,base+12.2);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}
 };
 if(visible(cam,"right"))side("right");
 if(visible(cam,"left"))side("left");
 if(!trayBehind)tray();
 ctx.restore();
}
/** Impressora multifuncional compacta: receita geométrica, sem PNG externo.
 * O mesmo equipamento aparece no catálogo e sobre o balcão após a compra.
 * O corpo estático vai para o cache de raster; só o LED e a folha em saída são ao vivo. */
export function drawCounterPrinter(ctx:CanvasRenderingContext2D,cam:Projection,counter:Point,active=false,phase=0,useCache=true):void{
 const z=cam.zoom,anchor=iso(counter,cam);
 if(useCache&&rasterCacheUsable(ctx)){
  drawRasterCached(ctx,"counter-printer",{
   key:[z,cam.rotation??0].join(":"),anchorX:anchor.x,anchorY:anchor.y,snap:"round",limit:8,
   padX:Math.ceil(160*z)+4,padY:Math.ceil(170*z)+4,width:Math.ceil(320*z)+8,height:Math.ceil(240*z)+8
  },target=>paintPrinterBody(target,cam,counter));
 }else paintPrinterBody(ctx,cam,counter);
 const {x:px,y:py,w,d,base}=PRINTER,x=counter.x+px,y=counter.y+py;
 ctx.save();
 // Status LED on the control panel: green when ready, amber while printing.
 if(visible(cam,"front")){
  const led=frontPoint(cam,counter,.9,base+6.9,.005);
  ctx.fillStyle=active&&Math.sin(phase*12)>0?"#f0ce75":"#8bd68e";
  ctx.beginPath();ctx.arc(led.x,led.y,Math.max(1,1.4*z),0,Math.PI*2);ctx.fill();
 }
 if(active){
  // The sheet advances out of the slot; a thin bright line shows the scanner head moving.
  const feed=.04+.08*(.5+.5*Math.sin(phase*6));
  const t=(u:number,v:number,zz:number)=>iso({x:x+u*w,y:y+d+v},cam,zz);
  polygon(ctx,[t(.2,0,base+8.2),t(.56,0,base+8.2),t(.56,feed,base+6.2),t(.2,feed,base+6.2)],"#fff8e4","#b2a995");
  const a=t(.26,feed*.58,base+7.2),b=t(.5,feed*.58,base+7.2);
  ctx.strokeStyle="#a0afa5";ctx.lineWidth=Math.max(.7,z);
  ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
  const sweep=.5+.5*Math.sin(phase*7);
  const s1=iso({x:x+.075+sweep*(w-.15),y:y+.07},cam,base+16.9),s2=iso({x:x+.075+sweep*(w-.15),y:y+d-.065},cam,base+16.9);
  ctx.strokeStyle="rgba(250,255,230,.85)";ctx.lineWidth=Math.max(.8,1.4*z);
  ctx.beginPath();ctx.moveTo(s1.x,s1.y);ctx.lineTo(s2.x,s2.y);ctx.stroke();
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
