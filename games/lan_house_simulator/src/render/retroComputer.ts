import type {GameState,Point} from "../sim/types.js";
import {iso,polygon,cuboid,type Projection} from "./isometric.js";
import {pcBroken} from "../sim/engine.js";
import {installedGpu} from "../sim/gpu.js";

type ComputerMode="ready"|"busy"|"offline"|"maintenance";
interface ComputerAppearance{tier:number;occupied:boolean;mode:ComputerMode;pulse:number;gpu:string|null}
const gpuColors:Record<string,string>={gpu05:"#75aa85",gpu07:"#c1a15f",gpu09:"#6dabb8",gpu11:"#a393bc",gpu13:"#ba7773"};
function raisedBox(c:CanvasRenderingContext2D,cam:Projection,x:number,y:number,w:number,d:number,z:number,h:number,
 top:string,front:string,side:string):void{
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
 const a=iso({x,y},cam,z+h),b=iso({x:x+w,y},cam,z+h),d=iso({x,y},cam,z);
 c.save();c.transform((b.x-a.x)/96,(b.y-a.y)/96,0,(d.y-a.y)/100,a.x,a.y);paint();c.restore();
}
function round(c:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,r:number,color:string,outline?:string):void{
 c.beginPath();c.roundRect(x,y,w,h,r);c.fillStyle=color;c.fill();
 if(outline){c.strokeStyle=outline;c.lineWidth=1.5;c.stroke();}
}
function monitor(c:CanvasRenderingContext2D,cam:Projection,p:Point,a:ComputerAppearance):void{
 const {tier,mode,pulse}=a,z=cam.zoom;
 const mx=p.x+.22,my=p.y-.05,mw=.46,md=.36,mz=36,mh=39;
 const top=tier===3?"#d3dedb":tier===2?"#eee0bc":"#f0e6d0";
 const side=tier===3?"#879fa0":tier===2?"#b9a57c":"#b7b1a0";
 const at=(x:number,y:number,h:number)=>iso({x,y},cam,h);
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
  const bezel=tier===3?"#c6d6d3":tier===2?"#e4d4ac":"#e8deca";
  round(c,0,0,96,100,7,bezel,"#807b6c");
  path(c,[{x:6,y:89},{x:6,y:8},{x:86,y:8}],"#fff4df",2);
  path(c,[{x:91,y:13},{x:91,y:91},{x:13,y:91}],"#b6af99",2);
  round(c,10,11,77,70,7,"#8a9384");round(c,13,14,71,64,6,"#122f33","#526e65");
  c.save();c.beginPath();c.roundRect(15,16,67,60,5);c.clip();
  if(mode==="maintenance"){
   c.fillStyle="#263c3c";c.fillRect(15,16,67,60);
   path(c,[{x:34,y:34},{x:49,y:49},{x:59,y:38}],"#d7ae65",5);
   c.fillStyle="#d7ae65";c.fillRect(33,56,30,4);
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
  c.fillStyle=mode==="maintenance"?"#d19a53":mode==="offline"?"#beaa72":"#7fae86";c.fillRect(77,88,5,3);
  round(c,84,87,5,6,2,"#aea994");
 });
}
function paintComputer(c:CanvasRenderingContext2D,cam:Projection,p:Point,index:number,a:ComputerAppearance):void{
 const {tier,occupied,mode,gpu}=a,z=cam.zoom;
 const accent=tier===3?"#619493":tier===2?"#bca16b":"#a99c7d";
 const at=(x:number,y:number,h=0)=>iso({x:p.x+x,y:p.y+y},cam,h);
 c.save();c.lineJoin="round";
 const ground=at(.35,.38);c.fillStyle="rgba(26,39,38,.18)";
 c.beginPath();c.ellipse(ground.x,ground.y,37*z,15*z,0,0,Math.PI*2);c.fill();
 // A real tabletop, four legs and an under-desk drawer instead of a solid block.
 for(const [x,y] of [[-.13,-.13],[.68,-.13],[-.13,.47],[.68,.47]])
  cuboid(c,cam,p.x+x!,p.y+y!,.075,.085,31,["#b49673","#685b50","#8b735c"]);
 raisedBox(c,cam,p.x-.12,p.y+.03,.24,.47,6,23,"#c4a180","#9c765d","#7c6657");
 path(c,[at(-.09,.505,20),at(.10,.505,20)],"#795d4e",1*z);
 path(c,[at(-.04,.51,23),at(.055,.51,23)],"#c8b790",1.6*z);
 raisedBox(c,cam,p.x-.16,p.y-.18,.95,.78,31,3,"#dfbd91","#9c795c","#b9936d");
 path(c,[at(-.15,.602,34),at(.78,.602,34)],"#f0d2a7",1*z);
 // Contact shadows keep the peripherals grounded on the wood.
 polygon(c,[at(.17,.0,34.1),at(.73,.0,34.1),at(.73,.35,34.1),at(.17,.35,34.1)],"rgba(43,54,45,.15)");
 path(c,[at(.22,.38,35),at(.07,.19,35),at(-.02,.22,35)],"#6b7161",1.2*z);
 raisedBox(c,cam,p.x-.12,p.y+.06,.22,.34,35,20,
  tier===3?"#ccd7ce":tier===2?"#e8d7ae":"#e7deca",
  tier===3?"#9eb5a8":tier===2?"#c6ad7f":"#c4b89d",
  tier===3?"#718d83":tier===2?"#a08d6d":"#a59e8b");
 plane(c,cam,p.x-.12,p.y+.403,.22,35,20,()=>{
  round(c,8,9,80,17,2,"#b1aa96","#7d8171");c.fillStyle="#657264";c.fillRect(17,17,54,3);
  round(c,14,33,65,8,2,"#9c9c89");
  for(let row=0;row<3;row++){c.fillStyle="#889580";c.fillRect(15,54+row*7,44,2);}
  c.fillStyle=mode==="maintenance"?"#b68449":mode==="offline"?"#b1a070":"#8fc090";c.fillRect(72,68,7,7);
  if(tier>1){c.fillStyle=accent;c.fillRect(65,44,15,14);}
 });
 if(gpu){const label=at(.108,.22,44);c.fillStyle=gpuColors[gpu];c.beginPath();c.ellipse(label.x,label.y,3*z,4*z,-.3,0,Math.PI*2);c.fill();}
 monitor(c,cam,p,a);
 // Keyboard stays at its existing anchor so seated hands remain aligned.
 const keyX=p.x+.15,keyY=p.y+.38;
 raisedBox(c,cam,keyX,keyY,.42,.12,34.7,1.1,"#e1d8be","#aba68e","#b9b59e");
 for(let row=0;row<3;row++)for(let col=0;col<7;col++){
  const x=keyX+.025+col*.05,y=keyY+.013+row*.028;
  polygon(c,[iso({x,y},cam,36),iso({x:x+.036,y},cam,36),
   iso({x:x+.036,y:y+.017},cam,36),iso({x,y:y+.017},cam,36)],"#f0e8d2","#a49f8b");
 }
 polygon(c,[at(.24,.48,36),at(.44,.48,36),at(.44,.494,36),at(.24,.494,36)],"#e3dac2","#9b9884");
 polygon(c,[at(.61,.38,35),at(.77,.38,35),at(.77,.56,35),at(.61,.56,35)],"#657e72","#50695f");
 const mouse=at(.69,.46,36.5),lead=at(.66,.39,36);path(c,[lead,at(.59,.34,35),at(.57,.21,35)],"#757666",.9*z);
 c.fillStyle="#e3d9c0";c.beginPath();c.ellipse(mouse.x,mouse.y,3.5*z,4.7*z,.65,0,Math.PI*2);c.fill();
 path(c,[{x:mouse.x-1*z,y:mouse.y-2.5*z},{x:mouse.x+1.2*z,y:mouse.y-.5*z}],"#9a9c86",.7*z);
 // Physical station label on the desk's front rail.
 plane(c,cam,p.x+.40,p.y+.603,.24,30,4,()=>{
  c.fillStyle="#486b5d";c.fillRect(0,0,96,100);c.fillStyle="#eee2b4";c.textAlign="center";
  c.font="bold 68px Arial,sans-serif";c.fillText(String(index+1).padStart(2,"0"),48,78);
 });
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
 const mode:ComputerMode=pcBroken(s,index)?"maintenance":!isOnline?"offline":occupied?"busy":"ready";
 const appearance:ComputerAppearance={tier,occupied,mode,pulse:mode==="busy"?Math.floor(t*1.7+index)%2:0,gpu:installedGpu(s,index)};
 if(!useCache||typeof document==="undefined"||ctx.globalAlpha!==1){paintComputer(ctx,camera,p,index,appearance);return;}
 const base=iso(p,camera),ix=Math.floor(base.x),iy=Math.floor(base.y),z=camera.zoom;
 const fx=base.x-ix,fy=base.y-iy;
 const key=JSON.stringify([index,z,fx,fy,appearance]);
 let cache=sprites.get(ctx);if(!cache){cache=new Map();sprites.set(ctx,cache);}
 let sprite=cache.get(key);
 const padX=Math.ceil(76*z)+3,padY=Math.ceil(91*z)+3;
 if(!sprite){
  sprite=document.createElement("canvas");sprite.width=Math.ceil(158*z)+6;sprite.height=Math.ceil(154*z)+6;
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
