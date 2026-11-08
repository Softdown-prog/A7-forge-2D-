import {iso,polygon,raisedCuboid,type Projection} from "./isometric.js";
import type {Point} from "../sim/types.js";
import {drawRasterCached,rasterCacheUsable} from "./rasterCache.js";
import {contactShadow,faceVisible as visible,flatEllipse} from "./planeArt.js";

const COPIER={x:1.48,y:.065,w:.22,d:.31,base:55.3,height:46};
const BAYS=4;
const bayTop=(i:number)=>COPIER.base+COPIER.height-14-i*8;
/** Shaded rainbow of a recordable disc surface, from one edge of the disc to the other. */
function discSheen(ctx:CanvasRenderingContext2D,cam:Projection,cx:number,cy:number,r:number,z:number):CanvasGradient{
 const a=iso({x:cx-r,y:cy-r},cam,z),b=iso({x:cx+r,y:cy+r},cam,z);
 const g=ctx.createLinearGradient(a.x,a.y,b.x,b.y);
 g.addColorStop(0,"#f3f4e6");g.addColorStop(.28,"#9fcdbd");g.addColorStop(.46,"#c4b6d8");g.addColorStop(.62,"#f6e5bb");g.addColorStop(.82,"#9dc3ae");g.addColorStop(1,"#e9ecda");
 return g;
}
/** Disc lying on a horizontal plane: sheen, rim, a bright inner ring and the centre hole. */
function drawDisc(ctx:CanvasRenderingContext2D,cam:Projection,cx:number,cy:number,r:number,z:number,hole:string):void{
 flatEllipse(ctx,cam,cx,cy,r,r,z,discSheen(ctx,cam,cx,cy,r,z),"#6f9487",26);
 flatEllipse(ctx,cam,cx,cy,r*.72,r*.72,z+.05,"rgba(236,240,222,.0)","rgba(240,244,226,.7)",22);
 flatEllipse(ctx,cam,cx,cy,r*.22,r*.22,z+.1,hole,"#759c8b",12);
}
function paintCopierBody(ctx:CanvasRenderingContext2D,cam:Projection,counter:Point):void{
 const {w,d,base,height}=COPIER,x=counter.x+COPIER.x,y=counter.y+COPIER.y;
 ctx.save();ctx.lineJoin="round";ctx.lineCap="round";
 contactShadow(ctx,cam,x,y,w,d,base-.1,.26);
 // Plinth and the tall pale case.
 raisedCuboid(ctx,cam,x-.004,y-.004,w+.008,d+.008,base,3,["#7d8f84","#566a5f","#48594f"]);
 raisedCuboid(ctx,cam,x,y,w,d,base+3,height-3,["#eceddf","#bfcdb9","#8b9f90"]);
 const fp=(u:number,z:number,out=.003)=>iso({x:x+u*w,y:y+d+out},cam,z);
 const q=(u0:number,z0:number,u1:number,z1:number,fill:string|CanvasGradient,stroke?:string,out=.003)=>
  polygon(ctx,[fp(u0,z0,out),fp(u1,z0,out),fp(u1,z1,out),fp(u0,z1,out)],fill,stroke);
 if(visible(cam,"front")){
  // Display: dark bezel, green glass and two status lines.
  const dTop=base+height-4.5,dBot=base+height-12;
  q(.1,dBot,.9,dTop,"#2a3d35","#1b2a24");
  q(.15,dBot+1,.85,dTop-1,"#9bcf84","#243a2e",.004);
  q(.2,dTop-3.2,.7,dTop-2.2,"#2d5a3c",undefined,.005);
  q(.2,dTop-5.6,.52,dTop-4.8,"#4a7a50",undefined,.005);
  q(.18,dBot+1.1,.5,dBot+3.5,"rgba(255,255,255,.22)",undefined,.005);
  // Four drive bays: faceplate, tray slot, eject button and a status LED.
  for(let i=0;i<BAYS;i++){
   const top=bayTop(i),bot=top-6.6;
   q(.08,bot,.92,top,i===0?"#cfd6c4":"#d9decd","#7d9283");
   q(.16,top-3.4,.84,top-2.4,"#2c3d36",undefined,.004);
   q(.16,top-2.4,.84,top-2.1,"rgba(255,255,255,.35)",undefined,.004);
   q(.62,bot+.6,.78,bot+1.8,"#8da294",undefined,.004);
   const led=fp(.86,bot+3.1,.005);ctx.fillStyle="#6f8f6e";ctx.beginPath();ctx.arc(led.x,led.y,Math.max(.8,1.05*cam.zoom),0,Math.PI*2);ctx.fill();
  }
  // Intake grille and a badge near the bottom.
  for(let i=0;i<3;i++)q(.16,base+4.6+i*1.6,.84,base+5.5+i*1.6,"#4f6458",undefined,.004);
  q(.3,base+11.6,.7,base+12.6,"#86a08b",undefined,.004);
 }
 // Vertical vent slots on the side faces, and a fan grille on the rear.
 const slots=(sx:number,face:"right"|"left")=>{
  ctx.strokeStyle="#4a6255";ctx.lineWidth=Math.max(.6,.9*cam.zoom);
  for(let i=0;i<5;i++){
   const yy=y+.05+i*.05,a=iso({x:sx,y:yy},cam,base+10),b=iso({x:sx,y:yy},cam,base+32);
   ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
  }
  void face;
 };
 if(visible(cam,"right"))slots(x+w+.002,"right");
 if(visible(cam,"left"))slots(x-.002,"left");
 if(visible(cam,"back")){
  const cx=x+w/2,yy=y-.003,zc=base+26;
  ctx.beginPath();
  for(let i=0;i<22;i++){const t=i/22*Math.PI*2,pt=iso({x:cx+Math.cos(t)*.07,y:yy},cam,zc+Math.sin(t)*7.5);if(i)ctx.lineTo(pt.x,pt.y);else ctx.moveTo(pt.x,pt.y);}
  ctx.closePath();ctx.fillStyle="#52665a";ctx.fill();ctx.strokeStyle="#2f4238";ctx.lineWidth=Math.max(.7,cam.zoom);ctx.stroke();
  ctx.strokeStyle="#7f968a";ctx.lineWidth=Math.max(.5,.7*cam.zoom);
  for(const k of [-.04,0,.04]){const a=iso({x:cx+k,y:yy},cam,zc-6),b=iso({x:cx+k,y:yy},cam,zc+6);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}
 }
 // Top: a label plate and a spindle with a stack of blank discs.
 polygon(ctx,[iso({x:x+.03,y:y+.025},cam,base+height+.15),iso({x:x+w-.03,y:y+.025},cam,base+height+.15),
  iso({x:x+w-.03,y:y+.075},cam,base+height+.15),iso({x:x+.03,y:y+.075},cam,base+height+.15)],"#6f8c74","#4c6a55");
 const cx=x+w/2,cy=y+d*.58,top0=base+height+.2;
 for(let k=0;k<5;k++)flatEllipse(ctx,cam,cx,cy,.056,.056,top0+k*.75,k%2?"#b4cbc5":"#d7e5df","#7ea09a",20);
 drawDisc(ctx,cam,cx,cy,.056,top0+5*.75,"#ecf0dc");
 {const a=iso({x:cx,y:cy},cam,top0+5*.75),b=iso({x:cx,y:cy},cam,top0+5*.75+5);
  ctx.strokeStyle="#52665a";ctx.lineWidth=Math.max(.8,1.2*cam.zoom);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}
 ctx.restore();
}
/** Miniatura da mesma torre óptica usada na vitrine.
 * Instalada SOBRE o balcão (não cria objeto nem colisão) após a compra.
 * Corpo estático em cache de raster; LED, barra do visor e gaveta com disco ao vivo. */
export function drawCounterDiscCopier(ctx:CanvasRenderingContext2D,cam:Projection,
 counter:Point,active=false,time=0,useCache=true):void{
 const z=cam.zoom,anchor=iso(counter,cam);
 if(useCache&&rasterCacheUsable(ctx)){
  drawRasterCached(ctx,"counter-copier",{
   key:[z,cam.rotation??0].join(":"),anchorX:anchor.x,anchorY:anchor.y,snap:"round",limit:8,
   padX:Math.ceil(160*z)+4,padY:Math.ceil(210*z)+4,width:Math.ceil(320*z)+8,height:Math.ceil(300*z)+8
  },target=>paintCopierBody(target,cam,counter));
 }else paintCopierBody(ctx,cam,counter);
 const {w,d,base,height}=COPIER,x=counter.x+COPIER.x,y=counter.y+COPIER.y;
 if(!visible(cam,"front")&&!active)return;
 ctx.save();ctx.lineJoin="round";ctx.lineCap="round";
 const fp=(u:number,zz:number,out=.003)=>iso({x:x+u*w,y:y+d+out},cam,zz);
 if(visible(cam,"front")){
  // Bay LED: green when idle, blinking amber while a disc is being written.
  const bot=bayTop(0)-6.6,led=fp(.86,bot+3.1,.006);
  ctx.fillStyle=active&&Math.sin(time*13)>0?"#f4cf71":"#9ad07c";
  ctx.beginPath();ctx.arc(led.x,led.y,Math.max(.9,1.2*z),0,Math.PI*2);ctx.fill();
  if(active){
   // Progress bar crawling along the display.
   const dTop=base+height-4.5,dBot=base+height-12,frac=.25+.55*(.5+.5*Math.sin(time*3.1));
   polygon(ctx,[fp(.2,dBot+3.6,.006),fp(.2+.6*frac,dBot+3.6,.006),fp(.2+.6*frac,dBot+5.4,.006),fp(.2,dBot+5.4,.006)],"#1f4f31");
   void dTop;
  }
 }
 if(active&&visible(cam,"front")){
  // The tray slides out carrying a disc, in the plane of the first bay.
  const advance=.02+.075*(.5+.5*Math.sin(time*6.4)),zt=bayTop(0)-3,hw=w*.42;
  const cx=x+w/2;
  polygon(ctx,[iso({x:cx-hw,y:y+d},cam,zt),iso({x:cx+hw,y:y+d},cam,zt),iso({x:cx+hw,y:y+d+advance+.07},cam,zt),iso({x:cx-hw,y:y+d+advance+.07},cam,zt)],"#7c8f85","#42564b");
  drawDisc(ctx,cam,cx,y+d+advance+.03,.045,zt+.4,"#7c8f85");
 }
 ctx.restore();
}

/** Ilustração da loja: a instalação no balcão reutiliza as formas da torre. */
export function drawDiscCopier(ctx:CanvasRenderingContext2D,width=320,height=180):void{
 ctx.save();ctx.scale(width/320,height/180);
 const polygon=(points:number[][],fill:string)=>{ctx.fillStyle=fill;ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x!,y!):ctx.moveTo(x!,y!));ctx.closePath();ctx.fill();};
 ctx.fillStyle="#e6ead6";ctx.fillRect(0,0,320,180);
 const glow=ctx.createRadialGradient(160,135,5,160,135,140);glow.addColorStop(0,"#b6c8a2");glow.addColorStop(1,"#e6ead6");ctx.fillStyle=glow;ctx.fillRect(0,0,320,180);
 ctx.fillStyle="#405d4230";ctx.beginPath();ctx.ellipse(166,158,76,13,0,0,Math.PI*2);ctx.fill();
 // Tampo, lateral sombreada e frente metálica com quatro gravadores ópticos.
 polygon([[116,28],[184,18],[220,37],[150,49]],"#f1eedc");
 polygon([[184,18],[220,37],[220,142],[184,159]],"#9caa92");
 polygon([[116,28],[184,18],[184,159],[116,149]],"#d2d6c0");
 ctx.strokeStyle="#637a62";ctx.lineWidth=1;ctx.strokeRect(119,30,62,117);
 ctx.fillStyle="#2b463a";ctx.fillRect(124,35,51,25);ctx.fillStyle="#97bf76";ctx.fillRect(129,40,41,10);
 ctx.fillStyle="#274332";ctx.font="bold 5px monospace";ctx.fillText("LHS COPY / READY",131,47);
 for(let i=0;i<3;i++){ctx.fillStyle=i===0?"#a9cf80":"#7c9176";ctx.beginPath();ctx.arc(132+i*12,55,1.8,0,Math.PI*2);ctx.fill();}
 for(let i=0;i<4;i++){
  const y=65+i*17;ctx.fillStyle="#889680";ctx.fillRect(123,y,54,15);ctx.fillStyle="#edecda";ctx.fillRect(125,y+1,50,12);
  ctx.fillStyle="#415e4b";ctx.fillRect(129,y+5,40,1);ctx.fillStyle="#a0ac90";ctx.fillRect(129,y+3,40,1);
  ctx.fillStyle="#607c53";ctx.fillRect(162,y+9,6,2);ctx.fillStyle="#b6d58d";ctx.fillRect(170,y+9,2,2);
  ctx.fillStyle="#788773";ctx.font="4px monospace";ctx.fillText(i===0?"MASTER":"WRITE 0"+i,129,y+11);
 }
 ctx.fillStyle="#789168";ctx.beginPath();ctx.arc(132,139,3,0,Math.PI*2);ctx.fill();ctx.fillStyle="#4d6a50";ctx.font="bold 5px monospace";ctx.fillText("CD + DVD",142,141);
 for(let i=0;i<6;i++){polygon([[192,59+i*5],[210,51+i*5],[210,53+i*5],[192,61+i*5]],"#74896f");}
 polygon([[119,149],[132,151],[132,155],[119,154]],"#3c5145");polygon([[170,158],[182,160],[182,164],[170,163]],"#3c5145");
 // Mídias e caixas deixam clara a função da máquina em tamanhos pequenos.
 polygon([[71,139],[104,132],[122,145],[87,155]],"#36584b");polygon([[71,139],[87,155],[87,162],[71,146]],"#294336");polygon([[87,155],[122,145],[122,152],[87,162]],"#7b9371");
 ctx.save();ctx.translate(86,121);ctx.scale(1,.6);const disc=ctx.createLinearGradient(-22,-22,22,22);
 disc.addColorStop(0,"#f1f2e2");disc.addColorStop(.25,"#9ac5b5");disc.addColorStop(.46,"#c2b4d5");disc.addColorStop(.62,"#f5e4ba");disc.addColorStop(1,"#94b9a5");
 ctx.fillStyle=disc;ctx.beginPath();ctx.arc(0,0,23,0,Math.PI*2);ctx.fill();ctx.strokeStyle="#6e9385";ctx.lineWidth=1;ctx.stroke();ctx.strokeStyle="#ecefdb";ctx.beginPath();ctx.arc(0,0,17,0,Math.PI*2);ctx.stroke();
 ctx.fillStyle="#e6ead6";ctx.beginPath();ctx.arc(0,0,5,0,Math.PI*2);ctx.fill();ctx.strokeStyle="#759c8b";ctx.stroke();ctx.restore();
 ctx.fillStyle="#314f3e";ctx.font="bold 9px monospace";ctx.fillText("COPIADORA",237,85);ctx.font="8px monospace";ctx.fillText("CD / DVD",237,99);
 ctx.fillStyle="#6f835d";ctx.font="7px monospace";ctx.fillText("DESDE 2001",237,116);
 ctx.restore();
}
