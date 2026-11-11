import type {GameState,Point} from "../sim/types.js";
import {iso,polygon,cuboid,type Projection} from "./isometric.js";
import {pcBroken} from "../sim/engine.js";
import {stationPoweredOn} from "../sim/stationPower.js";
import {installedGpu} from "../sim/gpu.js";
import {installedLcd,type LcdId} from "../sim/computerModels.js";
import {cosmeticAvailable} from "../sim/premiumCosmetics.js";
import {yearFromMinutes} from "../sim/historicalEconomy.js";
import {isLinuxPc} from "../sim/linuxQuest.js";
import {linuxMachineFor} from "../sim/linuxMachines.js";
import {pcActivityForStation,pcScreenFrame} from "./pcScreenActivities.js";
import {drawRasterCached,rasterCacheUsable} from "./rasterCache.js";
import type {ComputerAppearance,ComputerMode} from "./computers/types.js";
import {raisedBox,path,plane,round} from "./computers/primitives.js";
import {lcdMaterials,drawLcdMonitor} from "./computers/lcdMonitor.js";
import {drawCrtMonitor} from "./computers/crtMonitor.js";
import {drawNeonChair} from "./computers/neonChair.js";
import {drawOfficeChair} from "./computers/officeChair.js";

export type {ComputerAppearance,ComputerMode} from "./computers/types.js";
export {drawNeonChair} from "./computers/neonChair.js";

const gpuColors:Record<string,string>={gpu05:"#75aa85",gpu07:"#c1a15f",gpu09:"#6dabb8",gpu11:"#a393bc",gpu13:"#ba7773"};

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
 if(lcd)drawLcdMonitor(c,cam,p,a);else drawCrtMonitor(c,cam,p,a);
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
 if(a.premiumChair)drawNeonChair(c,cam,p,occupied,a.pulse);
 else drawOfficeChair(c,cam,p,occupied);
 c.restore();
}

// Native-resolution sprites retain the camera's exact subpixel phase. A frame
// only blits unchanged furniture; screen activity updates the sprite at 1.7 Hz.
export function drawRetroComputer(ctx:CanvasRenderingContext2D,camera:Projection,p:Point,index:number,t:number,isOnline:boolean,
 s:GameState,useCache=true):void{
 const appearance=computerAppearance(s,index,t,isOnline);
 if(!useCache||!rasterCacheUsable(ctx)){paintComputer(ctx,camera,p,index,appearance);return;}
 const base=iso(p,camera),z=camera.zoom;
 drawRasterCached(ctx,"retro-computer",{
  key:JSON.stringify([index,z,camera.rotation??0,appearance]),
  anchorX:base.x,anchorY:base.y,snap:"floor",limit:64,
  padX:Math.ceil((camera.rotation?130:76)*z)+3,padY:Math.ceil((camera.rotation?120:91)*z)+3,
  width:Math.ceil((camera.rotation?260:158)*z)+6,height:Math.ceil((camera.rotation?240:154)*z)+6
 },target=>paintComputer(target,camera,p,index,appearance));
}
/** Station state resolved from the simulation only; shared by the painter and the glow. */
export function computerAppearance(s:GameState,index:number,t:number,isOnline:boolean):ComputerAppearance{
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
 return {tier,linuxModel:linuxMachineFor(s,index),occupied,mode,
  pulse:mode==="busy"||premiumChair?Math.floor(t*1.7+index)%2:0,
  gpu:installedGpu(s,index),lcd:installedLcd(s,index),premiumChair,premiumKeyboard,keyboardPhase,
  activity,activityFrame};
}
/** Screen glass of each monitor as a quad in scene coordinates, from the same plane
 * mapping the monitor painters use. Null when the glass faces away from the camera
 * (rotations 1 and 2) or the geometry is degenerate. */
export function monitorScreenQuad(cam:Projection,p:Point,lcd:LcdId|null):Point[]|null{
 if(cam.rotation===1||cam.rotation===2)return null;
 let x:number,y:number,w:number,z:number,h:number,x0:number,y0:number,x1:number,y1:number;
 if(lcd){
  const n=["lcd05","lcd08","lcd12","lcd17","lcd24"].indexOf(lcd);if(n<0)return null;
  const width=[.52,.62,.67,.70,.74][n]!,depth=[.095,.075,.045,.035,.04][n]!;
  const edge=[8,6,4,2.5,2.5][n]!,foot=[12,10,7,6,6][n]!;
  x=p.x+.44-width/2;y=p.y+.12+depth+.003;w=width;z=43;h=[28,25,27,28,30][n]!;
  x0=edge;y0=edge;x1=96-edge;y1=100-foot;
 }else{
  // CRT: monitor box at (.22,-.05) sized .46 x .36, glass inset 15..82 by 16..76.
  x=p.x+.22;y=p.y-.05+.36+.005;w=.46;z=36;h=39;x0=15;y0=16;x1=82;y1=76;
 }
 const a=iso({x,y},cam,z+h),b=iso({x:x+w,y},cam,z+h),d=iso({x,y},cam,z);
 const at=(u:number,v:number):Point=>({x:a.x+(b.x-a.x)*u/96,y:a.y+(b.y-a.y)*u/96+(d.y-a.y)*v/100});
 const quad=[at(x0,y0),at(x1,y0),at(x1,y1),at(x0,y1)];
 return quad.every(q=>Number.isFinite(q.x)&&Number.isFinite(q.y))?quad:null;
}
/** Colour and strength of the light a monitor throws on its desk; null when dark. */
export function screenGlow(a:Pick<ComputerAppearance,"mode"|"activity"|"lcd">):{color:string;strength:number}|null{
 if(a.mode==="powered-off"||a.mode==="maintenance")return null;
 if(a.mode==="offline")return {color:"#7fa2b4",strength:.10};
 const color=a.activity==="linux-terminal"?"#9ff0b4":a.activity==="game"||a.activity==="lan"?"#ffd9a0":
  a.activity==="video"?"#b9d4ff":a.lcd?"#bfe3ea":"#9fdccd";
 return {color,strength:a.mode==="busy"?.3:.15};
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

