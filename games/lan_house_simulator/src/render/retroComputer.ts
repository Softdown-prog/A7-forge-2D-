import type {GameState,Point} from "../sim/types.js";
import {iso,polygon,cuboid,raisedCuboid,type Projection} from "./isometric.js";
import {pcBroken} from "../sim/engine.js";
import {stationPoweredOn} from "../sim/stationPower.js";
import {installedGpu} from "../sim/gpu.js";
import {installedLcd,type LcdId} from "../sim/computerModels.js";
import {cosmeticAvailable} from "../sim/premiumCosmetics.js";
import {yearFromMinutes} from "../sim/historicalEconomy.js";
import {isLinuxPc} from "../sim/linuxQuest.js";
import {linuxMachineFor,type LinuxMachineId} from "../sim/linuxMachines.js";
import {drawPcScreenActivity,pcActivityForStation,pcScreenFrame,type PcScreenActivity} from "./pcScreenActivities.js";

type ComputerMode="ready"|"busy"|"offline"|"maintenance"|"powered-off";
interface ComputerAppearance{tier:number;linuxModel:LinuxMachineId|null;occupied:boolean;mode:ComputerMode;pulse:number;gpu:string|null;lcd:LcdId|null;premiumChair:boolean;premiumKeyboard:boolean;keyboardPhase:number;activity:PcScreenActivity|null;activityFrame:number}
const lcdMaterials:Record<LcdId,{top:string;front:string;side:string;accent:string}>={
 lcd05:{top:"#d4dcd9",front:"#a5b6b5",side:"#71888a",accent:"#75a5a8"},
 lcd08:{top:"#535d60",front:"#39474b",side:"#26383d",accent:"#98b9b7"},
 lcd12:{top:"#677579",front:"#3a5058",side:"#283e46",accent:"#68b9c4"},
 lcd17:{top:"#64706f",front:"#364846",side:"#253b38",accent:"#d7b477"},
 lcd24:{top:"#384d55",front:"#243c47",side:"#172e39",accent:"#8bb8bd"}
};
const gpuColors:Record<string,string>={gpu05:"#75aa85",gpu07:"#c1a15f",gpu09:"#6dabb8",gpu11:"#a393bc",gpu13:"#ba7773"};
function raisedBox(c:CanvasRenderingContext2D,cam:Projection,x:number,y:number,w:number,d:number,z:number,h:number,
 top:string,front:string,side:string):void{
 if(cam.rotation){raisedCuboid(c,cam,x,y,w,d,z,h,[top,front,side]);return;}
 const at=(px:number,py:number,pz:number)=>iso({x:px,y:py},cam,pz);
 polygon(c,[at(x+w,y,z),at(x+w,y+d,z),at(x+w,y+d,z+h),at(x+w,y,z+h)],side,"#6c665b");
 polygon(c,[at(x,y+d,z),at(x+w,y+d,z),at(x+w,y+d,z+h),at(x,y+d,z+h)],front,"#756650");
 polygon(c,[at(x,y,z+h),at(x+w,y,z+h),at(x+w,y+d,z+h),at(x,y+d,z+h)],top,"#9a896f");
}
function path(c:CanvasRenderingContext2D,points:readonly Point[],color:string,width:number):void{
 c.beginPath();points.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));
 c.strokeStyle=color;c.lineWidth=width;c.lineCap="round";c.lineJoin="round";c.stroke();
}
function plane(c:CanvasRenderingContext2D,cam:Projection,x:number,y:number,w:number,z:number,h:number,
 paint:()=>void):void{
 if(cam.rotation===1||cam.rotation===2)return;
 const a=iso({x,y},cam,z+h),b=iso({x:x+w,y},cam,z+h),d=iso({x,y},cam,z);
 c.save();c.transform((b.x-a.x)/96,(b.y-a.y)/96,0,(d.y-a.y)/100,a.x,a.y);paint();c.restore();
}
function round(c:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,r:number,color:string,outline?:string):void{
 c.beginPath();c.roundRect(x,y,w,h,r);c.fillStyle=color;c.fill();
 if(outline){c.strokeStyle=outline;c.lineWidth=1.5;c.stroke();}
}
function lcdMonitor(c:CanvasRenderingContext2D,cam:Projection,p:Point,a:ComputerAppearance):void{
 const id=a.lcd!;const n=["lcd05","lcd08","lcd12","lcd17","lcd24"].indexOf(id);
 const colors=lcdMaterials[id],z=cam.zoom,at=(x:number,y:number,h:number)=>iso({x:p.x+x,y:p.y+y},cam,h);
 // Width follows the horizontal face in isometric world units (sqrt(64²+32²));
 // heights keep a 4:3 first LCD and genuinely wide later panels.
 const width=[.52,.62,.67,.70,.74][n]!,height=[28,25,27,28,30][n]!;
 const x=.44-width/2,y=.12,depth=[.095,.075,.045,.035,.04][n]!,bottom=43;
 // Each stand has its own silhouette; all stay on the existing desk footprint.
 if(n===0)raisedBox(c,cam,p.x+.27,p.y+.09,.34,.20,34.5,1.8,colors.top,colors.front,colors.side);
 else if(n===1)raisedBox(c,cam,p.x+.30,p.y+.11,.28,.19,34.5,1.4,colors.top,colors.front,colors.side);
 else if(n===2){const base=at(.44,.21,35);c.fillStyle=colors.front;c.beginPath();c.ellipse(base.x,base.y,12*z,5*z,0,0,Math.PI*2);c.fill();}
 else if(n===3)raisedBox(c,cam,p.x+.30,p.y+.10,.28,.21,34.5,1.3,"#b5c1ba",colors.top,colors.side);
 else for(const side of [-1,1])path(c,[at(.44,.16,36),at(.44+side*.20,.28,35)],colors.top,3*z);
 path(c,[at(.44,.16,36),at(.44,.16,bottom+9)],n===3?"#b7c7c1":colors.front,(n===0?5:3.2)*z);
 raisedBox(c,cam,p.x+x,p.y+y,width,depth,bottom,height,colors.top,colors.front,colors.side);
 plane(c,cam,p.x+x,p.y+y+depth+.003,width,bottom,height,()=>{
  round(c,0,0,96,100,n<2?3:1.5,colors.front,"#1f393d");
  const edge=[8,6,4,2.5,2.5][n]!,foot=[12,10,7,6,6][n]!;
  round(c,edge,edge,96-edge*2,100-edge-foot,1,"#17333f");
  c.save();c.beginPath();c.rect(edge+1,edge+1,94-edge*2,98-edge-foot);c.clip();
  if(a.mode==="powered-off"){c.fillStyle="#10191b";c.fillRect(0,0,96,100);}else if(a.mode==="maintenance"){
   c.fillStyle="#243941";c.fillRect(0,0,96,100);
   path(c,[{x:34,y:30},{x:49,y:47},{x:62,y:34}],"#e0b77a",5);
   c.fillStyle="#d3a560";c.fillRect(30,61,38,4);
  }else if(a.mode==="offline"){
   c.fillStyle="#233c47";c.fillRect(0,0,96,100);
   round(c,30,32,36,25,2,"#879e9c");
   path(c,[{x:37,y:64},{x:59,y:64}],"#c7ac76",3);
   path(c,[{x:41,y:40},{x:55,y:51}],"#896d52",3);
  }else if((a.mode==="busy"||(a.mode==="ready"&&a.activity==="linux-terminal"))&&a.activity){
   const x0=edge+1,y0=edge+1;
   const w=94-edge*2,h=98-edge-foot;
   drawPcScreenActivity((x,y,ww,hh,color)=>{
     c.fillStyle=color;c.fillRect(x0+x*w,y0+y*h,ww*w,hh*h);
   },a.activity,a.activityFrame);
  }else if(n===4){
   c.fillStyle="#193a4e";c.fillRect(0,0,96,100);
   polygon(c,[{x:0,y:72},{x:47,y:24},{x:96,y:73},{x:96,y:94},{x:0,y:94}],"#275870");
   for(let i=0;i<4;i++)path(c,[{x:16+i*21,y:90},{x:47,y:30}],"#4d8791",1);
   path(c,[{x:3,y:74},{x:93,y:74}],"#84afa3",2);
   const target=a.mode==="busy"&&a.pulse?59:48;
   path(c,[{x:target-4,y:47},{x:target+4,y:47}],"#e4c181",1.5);
   path(c,[{x:target,y:43},{x:target,y:51}],"#e4c181",1.5);
   c.fillStyle="#d9b976";c.fillRect(8,12,24,4);c.fillStyle="#8cb6b6";c.fillRect(8,19,16,3);
  }else{
   c.fillStyle=["#467e94","#40697d","#3c8591","#467b71"][n]!;c.fillRect(0,0,96,100);
   polygon(c,[{x:0,y:77},{x:35,y:33},{x:96,y:70},{x:96,y:95},{x:0,y:95}],n<2?"#719a7c":"#63a498");
   polygon(c,[{x:0,y:88},{x:57,y:62},{x:96,y:81},{x:96,y:95},{x:0,y:95}],"#3f746c");
   for(let i=0;i<3;i++){c.fillStyle=i===1?"#e2c17b":"#bed5c6";c.fillRect(12,16+i*15,6,7);}
   round(c,29,24,n===0?54:40,46,2,"#e5e7d5");
   c.fillStyle=n<2?"#335e7e":"#407b79";c.fillRect(30,25,n===0?52:38,7);
   c.fillStyle="#86ada1";c.fillRect(34,39,n===0?40:27,5);
   c.fillStyle="#b1c5b0";c.fillRect(34,49,24,3);
   c.fillStyle=a.mode==="busy"&&a.pulse?"#d9b573":"#6b9d8d";c.fillRect(34,58,a.pulse?26:16,4);
   if(n>0){round(c,73,38,17,31,1,"#aec6ba");c.fillStyle="#54786f";c.fillRect(75,42,12,4);c.fillRect(75,51,9,2);}
   c.fillStyle=n===3?"#284e4a":"#b9c5ad";c.fillRect(edge,85,96-edge*2,7);
   c.fillStyle="#e5d8b5";c.fillRect(n===3?39:12,87,16,3);
  }
  polygon(c,[{x:9,y:6},{x:22,y:6},{x:60,y:90},{x:50,y:90}],"rgba(238,245,223,.07)");c.restore();
  c.fillStyle=colors.accent;c.fillRect(40,96-foot/2,15,1.5);
  c.fillStyle=a.mode==="powered-off"?"#536963":a.mode==="maintenance"?"#dfb166":a.mode==="offline"?"#a38f63":"#87c4ae";
  c.fillRect(87,95,2,2);
 });
}
function monitor(c:CanvasRenderingContext2D,cam:Projection,p:Point,a:ComputerAppearance):void{
 const {tier,mode,pulse}=a,z=cam.zoom;
 const mx=p.x+.22,my=p.y-.05,mw=.46,md=.36,mz=36,mh=39;
 const top=a.linuxModel==="linux-dev-99"?"#607986":a.linuxModel?"#a6bfb8":tier===3?"#d3dedb":tier===2?"#eee0bc":"#f0e6d0";
 const side=a.linuxModel==="linux-dev-99"?"#405866":a.linuxModel?"#688b7d":tier===3?"#879fa0":tier===2?"#b9a57c":"#b7b1a0";
 const at=(x:number,y:number,h:number)=>iso({x,y},cam,h);
 if(cam.rotation===1||cam.rotation===2){
  raisedBox(c,cam,mx,my,mw,md,mz,mh,top,side,side);
  for(let i=0;i<5;i++)path(c,[at(mx+.08,my,mz+10+i*4),at(mx+mw-.08,my,mz+10+i*4)],"#75867b",1*z);
  raisedBox(c,cam,mx+.09,my+.12,.29,.27,34.5,3,"#dcd3bc","#a69f8a","#8f968a");return;
 }
 // CRT back narrows and slopes away from the broad front bezel.
 polygon(c,[at(mx+mw,my+md,mz),at(mx+mw-.055,my,mz+5),
  at(mx+mw-.055,my,mz+mh-5),at(mx+mw,my+md,mz+mh)],side,"#7b7d72");
 polygon(c,[at(mx,my+md,mz+mh),at(mx+.055,my,mz+mh-5),
  at(mx+mw-.055,my,mz+mh-5),at(mx+mw,my+md,mz+mh)],top,"#938c7a");
 path(c,[at(mx+.065,my+.055,mz+mh-4),at(mx+mw-.075,my+.055,mz+mh-4)],"#f9f0d8",1*z);
 for(let i=0;i<4;i++)path(c,[at(mx+mw-.027,my+.075+i*.045,mz+17),
  at(mx+mw-.015,my+.095+i*.045,mz+26)],"#747e75",.9*z);
 raisedBox(c,cam,mx+.09,my+.12,.29,.27,34.5,3,"#dcd3bc","#a69f8a","#8f968a");
 plane(c,cam,mx,my+md+.005,mw,mz,mh,()=>{
  const bezel=a.linuxModel==="linux-dev-99"?"#576f80":a.linuxModel?"#a8c8b5":tier===3?"#c6d6d3":tier===2?"#e4d4ac":"#e8deca";
  round(c,0,0,96,100,7,bezel,"#807b6c");
  path(c,[{x:6,y:89},{x:6,y:8},{x:86,y:8}],"#fff4df",2);
  path(c,[{x:91,y:13},{x:91,y:91},{x:13,y:91}],"#b6af99",2);
  round(c,10,11,77,70,7,"#8a9384");round(c,13,14,71,64,6,"#122f33","#526e65");
  c.save();c.beginPath();c.roundRect(15,16,67,60,5);c.clip();
  if(mode==="powered-off"){c.fillStyle="#10191b";c.fillRect(15,16,67,60);}else if(mode==="maintenance"){
   c.fillStyle="#263c3c";c.fillRect(15,16,67,60);
   path(c,[{x:34,y:34},{x:49,y:49},{x:59,y:38}],"#d7ae65",5);
   c.fillStyle="#d7ae65";c.fillRect(33,56,30,4);
  }else if((mode==="busy"||(mode==="ready"&&a.activity==="linux-terminal"))&&a.activity){
   drawPcScreenActivity((x,y,w,h,color)=>{
     c.fillStyle=color;c.fillRect(15+x*67,16+y*60,w*67,h*60);
   },a.activity,a.activityFrame);
  }else{
   c.fillStyle=mode==="offline"?"#284249":"#3a7c7c";c.fillRect(15,16,67,60);
   polygon(c,[{x:15,y:63},{x:47,y:30},{x:82,y:55},{x:82,y:76},{x:15,y:76}],"#32716a");
   c.fillStyle="#8eafa4";c.fillRect(15,69,67,7);c.fillStyle="#d9d5af";c.fillRect(18,70,16,4);
   for(let i=0;i<3;i++){c.fillStyle=i===1?"#e7cc8e":"#e5e2c2";c.fillRect(20,22+i*13,7,7);}
   round(c,34,26,41,35,2,"#d8dfcc","#51746e");
   c.fillStyle="#315d6e";c.fillRect(35,27,39,7);
   c.fillStyle=mode==="offline"?"#c09765":"#8baaa2";c.fillRect(39,40,29,5);
   c.fillStyle="#a5bdb0";c.fillRect(39,48,23,3);
   c.fillStyle=mode==="busy"&&pulse?"#d0b675":"#689181";c.fillRect(39,54,mode==="busy"&&pulse?27:17,3);
  }
  polygon(c,[{x:18,y:17},{x:35,y:17},{x:62,y:76},{x:53,y:76}],"rgba(245,246,212,.08)");c.restore();
  round(c,16,86,33,4,2,"#a49e8c");
  c.fillStyle=mode==="powered-off"?"#536963":mode==="maintenance"?"#d19a53":mode==="offline"?"#beaa72":"#7fae86";c.fillRect(77,88,5,3);
  round(c,84,87,5,6,2,"#aea994");
 });
}
/**
 * Cadeira gaming premium procedural, no MESMO footprint da cadeira comum.
 * Projeção e material divididos em camadas: base metálica, fibra escura,
 * espuma anatômica, apoio lombar, costuras e fitas de LED RGB.
 * Sem nova colisão, arquivo de sprite nem mudança em conforto/receita.
 */
export function drawNeonChair(c:CanvasRenderingContext2D,cam:Projection,p:Point,
 occupied:boolean,pulse:number):void{
 const z=cam.zoom, cx=.35,cy=.87,at=(x:number,y:number,h:number)=>iso({x:p.x+x,y:p.y+y},cam,h);
 const base=at(cx,cy,4),seat=at(cx,cy,25);
 const led=pulse?"#f36fd7":"#60ecdf",ledSoft=pulse?"#ba69da":"#69bec4";
 for(const [dx,dy] of [[-.25,0],[.25,0],[0,-.23],[0,.23],[.18,.18]]){
  const tip=at(cx+dx!,cy+dy!,2);
  path(c,[base,tip],"#29303d",3*z);
  path(c,[base,tip],"#697b85",1.1*z);
  c.fillStyle="#19222b";c.beginPath();c.ellipse(tip.x,tip.y,3.8*z,2.7*z,0,0,Math.PI*2);c.fill();
  c.strokeStyle="#98b5b9";c.lineWidth=.7*z;c.stroke();
 }
 path(c,[base,seat],"#1b2832",6.3*z);
 path(c,[base,seat],"#a8c5cc",1.35*z);
 const spine=at(cx,cy+.19,31),neck=at(cx,cy+.19,55);
 path(c,[spine,neck],"#182a34",4*z);
 // Em câmera girada, garantir estrutura aparente mesmo nos dois ângulos
 // em que o helper de plano original não desenha a superfície.
 if(cam.rotation===1||cam.rotation===2){
  const upperLeft=at(cx-.28,cy+.18,63),upperRight=at(cx+.28,cy+.18,63);
  const lowerLeft=at(cx-.28,cy+.18,28),lowerRight=at(cx+.28,cy+.18,28);
  polygon(c,[upperLeft,upperRight,lowerRight,lowerLeft],"#1e3143","#647c8d");
  const upMid=at(cx,cy+.18,60),lowMid=at(cx,cy+.18,31);
  path(c,[upperLeft,lowerLeft],led,3*z);
  path(c,[upperRight,lowerRight],led,3*z);
  path(c,[upMid,lowMid],"#3f5768",8*z);
  path(c,[upMid,lowMid],"#7f9dad",1.1*z);
  c.fillStyle=led;c.beginPath();c.ellipse(upMid.x,upMid.y+9*z,4.2*z,3.2*z,0,0,Math.PI*2);c.fill();
 }
 // Encosto curvado em um plano isométrico ortográfico.
 plane(c,cam,p.x+cx-.28,p.y+cy+.18,.56,28,35,()=>{
  c.save();
  c.shadowColor=ledSoft;c.shadowBlur=6;
  c.beginPath();c.moveTo(8,20);c.lineTo(0,10);c.quadraticCurveTo(1,2,16,1);
  c.lineTo(38,0);c.quadraticCurveTo(49,6,58,0);c.lineTo(82,1);
  c.quadraticCurveTo(96,1,96,12);c.lineTo(88,24);
  c.lineTo(86,86);c.quadraticCurveTo(79,100,48,100);
  c.quadraticCurveTo(18,100,11,86);c.closePath();
  c.fillStyle="#101924";c.fill();c.shadowBlur=0;
  c.lineWidth=3;c.strokeStyle="#080e16";c.stroke();
  c.beginPath();c.moveTo(13,19);c.lineTo(7,11);c.lineTo(19,7);c.lineTo(39,8);
  c.lineTo(48,17);c.lineTo(58,8);c.lineTo(77,7);c.lineTo(88,12);c.lineTo(81,21);
  c.lineTo(79,79);c.quadraticCurveTo(75,89,48,91);c.quadraticCurveTo(23,90,18,78);c.closePath();
  const leather=c.createLinearGradient(0,0,96,100);
  leather.addColorStop(0,"#526575");leather.addColorStop(.23,"#263849");
  leather.addColorStop(.61,"#192634");leather.addColorStop(1,"#475968");
  c.fillStyle=leather;c.fill();
  c.lineWidth=2;c.strokeStyle="#637787";c.stroke();
  // Flancos de carbono e contorno eletroluminescente.
  c.beginPath();c.moveTo(13,18);c.lineTo(18,28);c.lineTo(20,76);
  c.quadraticCurveTo(26,88,33,89);
  c.moveTo(83,18);c.lineTo(77,28);c.lineTo(76,76);c.quadraticCurveTo(71,88,64,89);
  c.strokeStyle=led;c.lineWidth=4;c.stroke();
  c.strokeStyle="rgba(245,254,255,.85)";c.lineWidth=.8;c.stroke();
  // Apoio cervical vazado e almofada com logotipo próprio.
  c.beginPath();c.roundRect(36,13,24,12,4);
  c.fillStyle="#111b26";c.fill();c.strokeStyle="#849cae";c.lineWidth=1.6;c.stroke();
  c.beginPath();c.roundRect(32,32,32,15,6);
  c.fillStyle="#152332";c.fill();c.strokeStyle="#7898a9";c.stroke();
  c.beginPath();c.moveTo(39,38);c.lineTo(48,34);c.lineTo(57,38);
  c.lineTo(48,43);c.closePath();c.fillStyle=led;c.fill();
  // Duas peças lombares e costura em losangos.
  c.beginPath();c.moveTo(32,52);c.lineTo(48,59);c.lineTo(64,52);c.lineTo(68,76);
  c.quadraticCurveTo(48,85,28,76);c.closePath();
  c.fillStyle="#273747";c.fill();c.strokeStyle="#8093a0";c.lineWidth=1;c.stroke();
  c.strokeStyle="rgba(194,216,224,.52)";c.lineWidth=.8;
  for(let i=0;i<3;i++){
   c.beginPath();c.moveTo(29+i*13,60);c.lineTo(42+i*13,72);c.stroke();
  }
  c.restore();
 });
 // Assento largo chanfrado, sem deslocar o contato com o quadril do ator.
 c.fillStyle="#0d1720";c.beginPath();c.ellipse(seat.x,seat.y+4*z,22.5*z,10.5*z,0,0,Math.PI*2);c.fill();
 c.fillStyle="#304656";c.beginPath();c.ellipse(seat.x,seat.y,21.3*z,9*z,0,0,Math.PI*2);c.fill();
 c.strokeStyle="#101c28";c.lineWidth=3*z;c.stroke();
 c.strokeStyle=led;c.lineWidth=1.8*z;c.beginPath();
 c.ellipse(seat.x,seat.y,20*z,8.2*z,0,.08*Math.PI,.88*Math.PI);c.stroke();
 c.fillStyle="#596f7c";c.beginPath();c.ellipse(seat.x-3*z,seat.y-2*z,14*z,4.6*z,0,0,Math.PI*2);c.fill();
 // Apoios de braço externos ficam visíveis apenas sem cliente.
 if(!occupied)for(const side of [-1,1]){
  const support=at(cx+side*.25,cy-.04,18),arm=at(cx+side*.25,cy-.04,31);
  path(c,[support,arm],"#17242e",3.8*z);
  path(c,[support,arm],"#718793",1*z);
  c.fillStyle="#263b4b";c.beginPath();c.ellipse(arm.x,arm.y,7.5*z,3.3*z,0,0,Math.PI*2);c.fill();
  c.strokeStyle=led;c.lineWidth=1*z;c.stroke();
 }
}

function paintComputer(c:CanvasRenderingContext2D,cam:Projection,p:Point,index:number,a:ComputerAppearance):void{
 const {tier,occupied,mode,gpu,lcd}=a,z=cam.zoom;
 const kit=lcd?lcdMaterials[lcd]:null;
 const linux=!!a.linuxModel,dev=a.linuxModel==="linux-dev-99";
 const accent=kit?.accent??(tier===3?"#619493":tier===2?"#bca16b":"#a99c7d");
 const at=(x:number,y:number,h=0)=>iso({x:p.x+x,y:p.y+y},cam,h);
 c.save();c.lineJoin="round";
 const ground=at(.35,.38);c.fillStyle="rgba(26,39,38,.18)";
 c.beginPath();c.ellipse(ground.x,ground.y,37*z,15*z,0,0,Math.PI*2);c.fill();
 // A real tabletop, four legs and an under-desk drawer instead of a solid block.
 for(const [x,y] of [[-.13,-.13],[.68,-.13],[-.13,.47],[.68,.47]])
  cuboid(c,cam,p.x+x!,p.y+y!,.075,.085,31,linux?["#a8bab4","#526c70","#597879"]:["#b49673","#685b50","#8b735c"]);
 raisedBox(c,cam,p.x-.12,p.y+.03,.24,.47,6,23,"#c4a180","#9c765d","#7c6657");
 path(c,[at(-.09,.505,20),at(.10,.505,20)],"#795d4e",1*z);
 path(c,[at(-.04,.51,23),at(.055,.51,23)],"#c8b790",1.6*z);
 raisedBox(c,cam,p.x-.16,p.y-.18,.95,.78,31,3,
  dev?"#879cab":linux?"#a4c1ae":"#dfbd91",
  dev?"#435c68":linux?"#598075":"#9c795c",
  dev?"#607a84":linux?"#7a998b":"#b9936d");
 path(c,[at(-.15,.602,34),at(.78,.602,34)],"#f0d2a7",1*z);
 // Contact shadows keep the peripherals grounded on the wood.
 polygon(c,[at(.17,.0,34.1),at(.73,.0,34.1),at(.73,.35,34.1),at(.17,.35,34.1)],"rgba(43,54,45,.15)");
 path(c,[at(.22,.38,35),at(.07,.19,35),at(-.02,.22,35)],"#6b7161",1.2*z);
 raisedBox(c,cam,p.x-.12,p.y+.06,dev?.23:.22,.34,35,dev?24:20,
  linux?(dev?"#708997":"#bfd2c8"):kit?.top??(tier===3?"#ccd7ce":tier===2?"#e8d7ae":"#e7deca"),
  linux?(dev?"#344c59":"#608678"):kit?.front??(tier===3?"#9eb5a8":tier===2?"#c6ad7f":"#c4b89d"),
  linux?(dev?"#526e7b":"#88a79a"):kit?.side??(tier===3?"#718d83":tier===2?"#a08d6d":"#a59e8b"));
 plane(c,cam,p.x-.12,p.y+.403,.22,35,dev?24:20,()=>{
  if(!lcd||lcd==="lcd05"||lcd==="lcd08"){
   round(c,8,9,80,17,2,kit?.top??"#b1aa96","#7d8171");c.fillStyle="#657264";c.fillRect(17,17,54,3);
   round(c,14,33,65,8,2,kit?.side??"#9c9c89");
  }else{
   round(c,9,7,76,77,3,kit!.side);
   for(const cy of lcd==="lcd24"?[28,62]:[48]){
    c.fillStyle=kit!.front;c.beginPath();c.arc(45,cy,17,0,Math.PI*2);c.fill();
    c.strokeStyle=lcd==="lcd24"?accent:"#6c8585";c.lineWidth=2;c.stroke();
    for(let i=0;i<4;i++){const r=i*Math.PI/2;c.fillStyle=kit!.top;c.beginPath();c.ellipse(45+Math.cos(r)*8,cy+Math.sin(r)*8,7,3,r+.6,0,Math.PI*2);c.fill();}
   }
   c.fillStyle=accent;c.fillRect(16,88,8,2);c.fillRect(30,88,8,2);
  }
  if(!lcd||lcd==="lcd05"||lcd==="lcd08")for(let row=0;row<3;row++){c.fillStyle="#889580";c.fillRect(15,54+row*7,44,2);}
  c.fillStyle=mode==="powered-off"?"#536963":mode==="maintenance"?"#b68449":mode==="offline"?"#b1a070":"#8fc090";c.fillRect(72,68,7,7);
  if(tier>1){c.fillStyle=accent;c.fillRect(65,44,15,14);}
  if(linux){
   // Actual case vents and drive bays, visible when Linux PC is off.
   c.fillStyle=dev?"#253b48":"#386457";c.fillRect(8,46,78,5);
   for(let i=0;i<(dev?7:4);i++){c.fillStyle="#b5dbc2";c.fillRect(14+i*10,62,5,3);}
   c.fillStyle="#9cdeaf";c.fillRect(65,81,9,8);
  }
 });
 if(gpu){const label=at(.108,.22,44);c.fillStyle=gpuColors[gpu];c.beginPath();c.ellipse(label.x,label.y,3*z,4*z,-.3,0,Math.PI*2);c.fill();}
 if(lcd)lcdMonitor(c,cam,p,a);else monitor(c,cam,p,a);
 if(linux){
  // Additional on-desk I/O module. Distinct silhouette, within existing footprint.
  raisedBox(c,cam,p.x+.60,p.y+.025,.13,.18,34.2,dev?11:7,
   dev?"#5c7886":"#90b6a4",dev?"#293f50":"#4f7b69",dev?"#3e5d6d":"#6c9180");
  const indicator=at(.68,.21,dev?42:38);
  c.fillStyle="#b5f0bd";c.beginPath();c.arc(indicator.x,indicator.y,2*z,0,Math.PI*2);c.fill();
 }
 // O mesmo teclado físico, tecla a tecla, com identidade premium RGB.
 // Posição do objeto e da digitação preservada para todos os modelos de PC.
 const keyX=p.x+.15,keyY=p.y+.38;
 if(a.premiumKeyboard){
  raisedBox(c,cam,keyX-.027,keyY-.022,.485,.174,34.35,2.2,
   "#253545","#0e1828","#131f31");
  const frame=[
   at(.121,.358,36.8),at(.608,.358,36.8),
   at(.608,.533,36.8),at(.121,.533,36.8)
  ];
  polygon(c,frame,"#1b2a3a","#5c7387");
  // Contorno de brilho discreto, legível até no zoom normal do jogo.
  const neonColors=["#65eafa","#80a4ff","#de88f7","#fb84b6",
   "#ffa97a","#f6d46d","#99e9ab","#72e6dd"];
  for(let row=0;row<3;row++)for(let col=0;col<7;col++){
   const x=keyX+.025+col*.055,y=keyY+.012+row*.035;
   const color=neonColors[(col+row*2+a.keyboardPhase)%neonColors.length]!;
   polygon(c,[iso({x,y},cam,37.25),iso({x:x+.044,y},cam,37.25),
    iso({x:x+.044,y:y+.023},cam,37.25),iso({x,y:y+.023},cam,37.25)],
    color,"#17202f");
   // Pequenos grafismos que lembram letras sem depender de fonte.
   const dot=iso({x:x+.019,y:y+.009},cam,37.45);
   c.fillStyle="rgba(255,255,255,.72)";
   c.beginPath();c.ellipse(dot.x,dot.y,Math.max(.55,z*.85),Math.max(.5,z*.58),0,0,Math.PI*2);c.fill();
  }
  // Barra de espaço de perfil baixo, keycaps Esc e setas.
  polygon(c,[at(.25,.499,37.4),at(.47,.499,37.4),
   at(.47,.513,37.4),at(.25,.513,37.4)],
   "#b6eefa","#507b8d");
  const left=at(.15,.366,37.3),right=at(.60,.366,37.3);
  path(c,[left,right],neonColors[a.keyboardPhase%neonColors.length]!,1.8*z);
  // Apoio de punho de carbono texturizado: não atrapalha as mãos dos NPCs.
  raisedBox(c,cam,keyX+.032,keyY+.137,.36,.060,34.85,.85,
   "#263748","#172535","#213449");
 }else{
  raisedBox(c,cam,keyX,keyY,.42,.12,34.7,1.1,kit?.top??"#e1d8be",kit?.side??"#aba68e",kit?.front??"#b9b59e");
  for(let row=0;row<3;row++)for(let col=0;col<7;col++){
   const x=keyX+.025+col*.05,y=keyY+.013+row*.028;
   polygon(c,[iso({x,y},cam,36),iso({x:x+.036,y},cam,36),
    iso({x:x+.036,y:y+.017},cam,36),iso({x,y:y+.017},cam,36)],
    kit?kit.front:"#f0e8d2",kit?kit.accent:"#a49f8b");
  }
 }
 polygon(c,[at(.24,.48,36),at(.44,.48,36),at(.44,.494,36),at(.24,.494,36)],"#e3dac2","#9b9884");
 polygon(c,[at(.61,.38,35),at(.77,.38,35),at(.77,.56,35),at(.61,.56,35)],"#657e72","#50695f");
 const mouse=at(.69,.46,36.5),lead=at(.66,.39,36);path(c,[lead,at(.59,.34,35),at(.57,.21,35)],"#757666",.9*z);
 c.fillStyle=kit?.top??"#e3d9c0";c.beginPath();c.ellipse(mouse.x,mouse.y,3.5*z,4.7*z,.65,0,Math.PI*2);c.fill();
 path(c,[{x:mouse.x-1*z,y:mouse.y-2.5*z},{x:mouse.x+1.2*z,y:mouse.y-.5*z}],"#9a9c86",.7*z);
 // Physical station label on the desk's front rail.
 plane(c,cam,p.x+.40,p.y+.603,.24,30,4,()=>{
  c.fillStyle=dev?"#38576d":linux?"#2e675c":"#486b5d";c.fillRect(0,0,96,100);c.fillStyle="#eee2b4";c.textAlign="center";
  c.font="bold 68px Arial,sans-serif";c.fillText(String(index+1).padStart(2,"0"),48,78);
 });
 if(mode==="powered-off"){
  // Indicação legível mesmo com a câmera na parte de trás do monitor.
  const badge=at(.44,.11,95),z=cam.zoom;
  c.save();c.fillStyle="#13231f";c.strokeStyle="#829d91";c.lineWidth=z;
  c.beginPath();c.roundRect(badge.x-33*z,badge.y-12*z,66*z,18*z,4*z);c.fill();c.stroke();
  c.fillStyle="#e8ede2";c.textAlign="center";c.textBaseline="middle";
  c.font=`bold ${Math.max(7,8*z)}px Arial,sans-serif`;c.fillText("DESLIGADO",badge.x,badge.y-3*z);
  c.restore();
 }
 if(a.premiumChair){drawNeonChair(c,cam,p,occupied,a.pulse);c.restore();return;}
 const cx=.35,cy=.87,base=at(cx,cy,4),seat=at(cx,cy,25);
 // Five caster spokes, upholstered thickness and curved backrest.
 for(const [dx,dy] of [[-.25,0],[.25,0],[0,-.23],[0,.23],[.18,.18]]){
  const foot=at(cx+dx!,cy+dy!,2);path(c,[base,foot],"#354b4b",2.5*z);
  c.fillStyle="#263d3e";c.beginPath();c.ellipse(foot.x,foot.y,2.9*z,2*z,0,0,Math.PI*2);c.fill();
 }
 path(c,[base,seat],"#506964",3.8*z);
 const by=cy+.19;
 plane(c,cam,p.x+cx-.26,p.y+by,.52,28,27,()=>{
  round(c,0,0,96,100,15,"#3c615d","#2d4949");
  round(c,6,5,84,78,12,"#719086");round(c,12,11,72,65,10,"#577b71");
  path(c,[{x:16,y:72},{x:18,y:16},{x:75,y:16}],"#8ca294",2);
 });
 c.fillStyle="#355e56";c.beginPath();c.ellipse(seat.x,seat.y+2*z,19*z,9*z,0,0,Math.PI*2);c.fill();
 c.fillStyle="#77978a";c.beginPath();c.ellipse(seat.x,seat.y,19*z,8*z,0,0,Math.PI*2);c.fill();
 c.strokeStyle="#395d55";c.lineWidth=1.2*z;c.stroke();
 if(!occupied)for(const side of [-1,1]){
  const support=at(cx+side*.25,cy-.04,18),arm=at(cx+side*.25,cy-.04,30);
  path(c,[support,arm],"#3d5a56",2*z);c.fillStyle="#486f64";c.beginPath();c.ellipse(arm.x,arm.y,5*z,3*z,0,0,Math.PI*2);c.fill();
 }
 c.restore();
}

// Native-resolution sprites retain the camera's exact subpixel phase. A frame
// only blits unchanged furniture; screen activity updates the sprite at 1.7 Hz.
const sprites=new WeakMap<CanvasRenderingContext2D,Map<string,HTMLCanvasElement>>();
export function drawRetroComputer(ctx:CanvasRenderingContext2D,camera:Projection,p:Point,index:number,t:number,isOnline:boolean,
 s:GameState,useCache=true):void{
 const rawTier=s.pcTiers?.[index]??1;
 const tier=Number.isInteger(rawTier)?Math.max(1,Math.min(3,rawTier)):1;
 const occupied=s.customers.some(c=>c.pcIndex===index&&["sitting","using","standing"].includes(c.stage));
 const candidate=pcActivityForStation(s,index,yearFromMinutes(s.totalMinutes));
 // Partida LAN local continua visível mesmo quando cai a internet externa.
 const mode:ComputerMode=!stationPoweredOn(s,index)?"powered-off":pcBroken(s,index)?"maintenance":
  !isOnline&&candidate!=="lan"&&candidate!=="linux-terminal"?"offline":occupied?"busy":"ready";
 const premiumChair=cosmeticAvailable("chair-gamer-neon",yearFromMinutes(s.totalMinutes));
 const premiumKeyboard=cosmeticAvailable("keyboard-rainbow-rgb",yearFromMinutes(s.totalMinutes));
 const keyboardPhase=premiumKeyboard?Math.floor(t*3+index)%8:0;
 // O visitante define o conteúdo, jamais o quadro: alternar de atividade
 // só ocorre entre sessões. Nenhuma alteração do RNG ou do save.
 const activity=mode==="busy"||(mode==="ready"&&isLinuxPc(s,index))?candidate:null;
 const activityFrame=activity?pcScreenFrame(t):0;
 const appearance:ComputerAppearance={tier,linuxModel:linuxMachineFor(s,index),occupied,mode,
  pulse:mode==="busy"||premiumChair?Math.floor(t*1.7+index)%2:0,
  gpu:installedGpu(s,index),lcd:installedLcd(s,index),premiumChair,premiumKeyboard,keyboardPhase,
  activity,activityFrame};
 if(!useCache||typeof document==="undefined"||ctx.globalAlpha!==1){paintComputer(ctx,camera,p,index,appearance);return;}
 const base=iso(p,camera),ix=Math.floor(base.x),iy=Math.floor(base.y),z=camera.zoom;
 const fx=base.x-ix,fy=base.y-iy;
 const key=JSON.stringify([index,z,fx,fy,camera.rotation??0,appearance]);
 let cache=sprites.get(ctx);if(!cache){cache=new Map();sprites.set(ctx,cache);}
 let sprite=cache.get(key);
 const padX=Math.ceil((camera.rotation?130:76)*z)+3,padY=Math.ceil((camera.rotation?120:91)*z)+3;
 if(!sprite){
  sprite=document.createElement("canvas");sprite.width=Math.ceil((camera.rotation?260:158)*z)+6;sprite.height=Math.ceil((camera.rotation?240:154)*z)+6;
  const buffer=sprite.getContext("2d");
  if(!buffer){paintComputer(ctx,camera,p,index,appearance);return;}
  // Keep the original world-coordinate arithmetic; an integer translation
  // preserves rasterization at the exact live pixel phase, including text.
  buffer.translate(padX-ix,padY-iy);
  paintComputer(buffer,camera,p,index,appearance);
  cache.set(key,sprite);if(cache.size>64)cache.delete(cache.keys().next().value!);
 }else{cache.delete(key);cache.set(key,sprite);}
 ctx.drawImage(sprite,ix-padX,iy-padY);
}

/** Arms start at the shoulders and finish on the actual keyboard plane. */
export function drawSeatedKeyboardOverlay(ctx:CanvasRenderingContext2D,camera:Projection,
 p:Point,time:number,skin:string,sleeve:string,weight=1):void{
 const factor=Math.min(1,Math.max(0,weight));if(factor<=0)return;
 const z=camera.zoom,seat={x:p.x+.35,y:p.y+.82};ctx.save();ctx.globalAlpha=factor;ctx.lineCap="round";
 for(const side of [-1,1]){
  const shoulder=iso({x:seat.x+side*.12,y:seat.y},camera,46);
  const elbow=iso({x:seat.x+side*.16,y:seat.y-.22},camera,39);
  const touch=iso({x:p.x+.31+side*.11,y:p.y+.44},camera,36.5);
  const key={x:touch.x,y:touch.y+Math.sin(time*7+side*1.3)*1.25*z};
  path(ctx,[shoulder,elbow,key],"#263c3e",8.7*z);
  path(ctx,[shoulder,elbow],sleeve,6.6*z);path(ctx,[elbow,key],skin,4.6*z);
  path(ctx,[{x:shoulder.x-1*z,y:shoulder.y-1*z},{x:elbow.x-1*z,y:elbow.y-1*z}],"rgba(245,230,198,.2)",1.1*z);
  ctx.fillStyle=skin;ctx.beginPath();ctx.ellipse(key.x,key.y,3.9*z,2.7*z,0,0,Math.PI*2);ctx.fill();
 }
 ctx.restore();
}
