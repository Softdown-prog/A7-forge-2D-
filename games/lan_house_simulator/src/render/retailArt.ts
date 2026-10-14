import type {Point} from "../sim/types.js";
import {iso,polygon,raisedCuboid,type Projection} from "./isometric.js";
import {VENDING_WIDTH,VENDING_DEPTH} from "../sim/layout.js";

type MachineKind="soda"|"candy";
export const RETAIL_DISPLAY_CAPACITY={soda:9,candy:12,snacks:20} as const;
export function visibleRetailStock(stock:number,capacity:number):number{
 return Number.isFinite(stock)?Math.max(0,Math.min(capacity,Math.floor(stock))):0;
}
function line(c:CanvasRenderingContext2D,points:Point[],color:string,width:number):void{
 c.beginPath();points.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.strokeStyle=color;c.lineWidth=width;c.lineCap="round";c.lineJoin="round";c.stroke();
}
function rounded(c:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,r:number,color:string|CanvasGradient,stroke?:string):void{
 c.beginPath();c.roundRect(x,y,w,h,r);c.fillStyle=color;c.fill();
 if(stroke){c.strokeStyle=stroke;c.lineWidth=1;c.stroke();}
}
function box(c:CanvasRenderingContext2D,cam:Projection,x:number,y:number,w:number,d:number,z:number,h:number,top:string,front:string,side:string):void{
 if(cam.rotation){raisedCuboid(c,cam,x,y,w,d,z,h,[top,front,side]);return;}
 const at=(x:number,y:number,z:number)=>iso({x,y},cam,z);
 polygon(c,[at(x+w,y,z),at(x+w,y+d,z),at(x+w,y+d,z+h),at(x+w,y,z+h)],side,"#41574f");
 polygon(c,[at(x,y+d,z),at(x+w,y+d,z),at(x+w,y+d,z+h),at(x,y+d,z+h)],front,"#41574f");
 polygon(c,[at(x,y,z+h),at(x+w,y,z+h),at(x+w,y+d,z+h),at(x,y+d,z+h)],top,"#6d7e6c");
}
function face(c:CanvasRenderingContext2D,cam:Projection,x:number,y:number,span:number,z:number,h:number,axis:"x"|"y",paint:()=>void):void{
 // A face turned away from the fixed camera is hidden by the cabinet.
 if(cam.rotation){const a=iso({x,y},cam),b=iso(axis==="x"?{x:x+.1,y}:{x,y:y+.1},cam);if(b.y<=a.y)return;}
 // u always moves right on screen, so lettering is never mirrored on the rack.
 const a=iso(axis==="x"?{x,y:y+span}:{x,y},cam,z+h);
 const b=iso(axis==="x"?{x,y}:{x:x+span,y},cam,z+h);
 const d=iso(axis==="x"?{x,y:y+span}:{x,y},cam,z);
 c.save();c.transform((b.x-a.x)/96,(b.y-a.y)/96,0,(d.y-a.y)/180,a.x,a.y);paint();c.restore();
}
function caption(c:CanvasRenderingContext2D,text:string,x:number,y:number,size:number,color:string,maxWidth=90):void{
 c.fillStyle=color;c.font="bold "+size+"px Arial,sans-serif";c.textAlign="center";c.fillText(text,x,y,maxWidth);
}
function can(c:CanvasRenderingContext2D,x:number,y:number,color:string):void{
 const shade=c.createLinearGradient(x,0,x+12,0);shade.addColorStop(0,"#53655f");shade.addColorStop(.25,color);shade.addColorStop(.72,color);shade.addColorStop(1,"#425955");
 rounded(c,x,y,12,22,3,shade);
 c.fillStyle="#c5d0c4";c.beginPath();c.ellipse(x+6,y+1,5.4,1.7,0,0,Math.PI*2);c.fill();
 c.strokeStyle="#5d756f";c.lineWidth=.8;c.stroke();c.fillStyle="#536d68";c.fillRect(x+5,y,3,1);
 c.fillStyle="#eee8c9";c.beginPath();c.ellipse(x+6,y+11,4,5,0,0,Math.PI*2);c.fill();
 line(c,[{x:x+5,y:y+8},{x:x+8,y:y+11},{x:x+5,y:y+14}],color,1.3);
 line(c,[{x:x+2,y:y+5},{x:x+2,y:y+17}],"rgba(245,243,214,.4)",1);
}
function sweet(c:CanvasRenderingContext2D,x:number,y:number,color:string,index:number):void{
 if(index%3===0){
  polygon(c,[{x,y:y+6},{x:x+3,y:y+10},{x,y:y+15}],color);
  polygon(c,[{x:x+14,y:y+6},{x:x+11,y:y+10},{x:x+14,y:y+15}],color);
  rounded(c,x+2,y+5,10,12,3,color,"#527060");
 }else rounded(c,x+1,y+3,12,17,2,color,"#527060");
 rounded(c,x+3,y+8,8,7,1,"#eee5c4");
 c.fillStyle=index%2?"#735148":"#997441";c.fillRect(x+5,y+10,4,3);
 line(c,[{x:x+2,y:y+4},{x:x+11,y:y+4}],"#f1dca6",1);
}
function paintMachine(c:CanvasRenderingContext2D,cam:Projection,p:Point,kind:MachineKind,quantity:number,pulse:number):void{
 const soda=kind==="soda",h=soda?106:94,w=VENDING_WIDTH,d=VENDING_DEPTH,z=cam.zoom;
 const top=soda?"#ce7771":"#dbbc78",front=soda?"#a4484b":"#b38a4e",side=soda?"#72383d":"#806943";
 const at=(x:number,y:number,h:number)=>iso({x:p.x+x,y:p.y+y},cam,h);
 c.save();c.lineJoin="round";
 const ground=at(w/2,d/2,0);c.fillStyle="rgba(20,39,36,.23)";c.beginPath();c.ellipse(ground.x,ground.y+4*z,27*z,10*z,0,0,Math.PI*2);c.fill();
 for(const [x,y] of [[.065,.07],[w-.105,.07],[.065,d-.09],[w-.105,d-.09]])box(c,cam,p.x+x!,p.y+y!,.065,.06,0,5,"#65746b","#384c48","#2a403e");
 box(c,cam,p.x,p.y,w,d,4,h-4,top,front,side);
 // Rounded door lip, roof seam, hinges and a recessed side service panel.
 line(c,[at(w,.04,h-2),at(w,d-.025,h-2),at(.02,d-.025,h-2)],"#e8b493",1.1*z);
 face(c,cam,p.x+w+.002,p.y+.06,d-.12,22,h-36,"x",()=>{
  rounded(c,5,10,87,156,4,side,"#52665b");
  for(let row=0;row<7;row++)rounded(c,15,89+row*6,62,2,1,"#46594f");
  for(const y of [20,154]){c.fillStyle="#baa77c";c.beginPath();c.arc(13,y,1.5,0,Math.PI*2);c.fill();}
 });
 face(c,cam,p.x,p.y+d+.004,w,4,h-5,"y",()=>{
  rounded(c,1,0,94,177,5,front,"#384f47");
  rounded(c,4,3,88,172,4,soda?"#ba5b58":"#c6a15c");
  line(c,[{x:6,y:167},{x:6,y:6},{x:88,y:6}],"rgba(249,222,179,.4)",1.2);
  rounded(c,9,8,78,19,3,"#e5d3a6","#86784f");
  caption(c,soda?"BEBIDAS":"DOCES",48,21,12,"#3e5a4c");
  // The glass and every product share the door's exact isometric plane.
  rounded(c,9,31,61,109,4,"#556e64","#ede1b7");
  rounded(c,12,34,55,102,3,"#1e3839");
  c.save();c.beginPath();c.roundRect(13,35,53,99,2);c.clip();
  const glass=c.createLinearGradient(0,35,0,134);glass.addColorStop(0,"#264c4a");glass.addColorStop(1,"#172f32");c.fillStyle=glass;c.fillRect(13,35,53,99);
  const cols=soda?3:4,palette=soda?["#bf6560","#79a69e","#d5b366"]:["#d7af74","#ac8291","#81a98b","#719aaf"];
  for(let row=0;row<3;row++){
   const y=41+row*30;
   for(let col=0;col<cols;col++){
    const i=row*cols+col;if(i>=quantity)continue;
    const x=soda?17+col*16:15+col*12;
    if(soda)can(c,x,y,palette[(row+col)%palette.length]!);else sweet(c,x,y+1,palette[(row+col)%palette.length]!,i);
   }
   rounded(c,14,y+23,52,3,1,"#8b9b7c");
   if(!soda)for(let col=0;col<4;col++){
    c.strokeStyle="#a5ae97";c.lineWidth=.75;c.beginPath();c.ellipse(21+col*12,y+19,4.5,2,0,0,Math.PI*2);c.stroke();
   }
   for(let col=0;col<cols;col++){c.fillStyle="#d6d5b5";c.fillRect(18+col*(soda?16:12),y+24,5,1);}
  }
  polygon(c,[{x:15,y:36},{x:23,y:36},{x:61,y:131},{x:53,y:131}],"rgba(213,234,215,.1)");c.restore();
  // Selector, coin slot and return button are separate physical controls.
  rounded(c,74,36,14,81,3,"#d9c697","#746e4e");rounded(c,76,40,10,13,1,"#254843");
  caption(c,quantity?"OK":"--",81,49,7,quantity?(pulse?"#c1ddae":"#a1c796"):"#dbb06e");
  rounded(c,78,58,6,2,1,"#4c5f52");
  for(let row=0;row<3;row++)for(let col=0;col<2;col++){
   rounded(c,76+col*5,68+row*8,4,5,1,"#8d9f7e","#617460");
   c.fillStyle="#eae5c2";c.fillRect(77+col*5,69+row*8,1,1);
  }
  c.fillStyle="#557367";c.beginPath();c.arc(81,105,3,0,Math.PI*2);c.fill();
  for(const y of [32,127])rounded(c,2,y,3,12,1,"#b4b598","#69786b");
  // Preserve the pickup anchor near x + .33, height 17.
  rounded(c,21,145,53,22,4,"#657568","#e4d4aa");rounded(c,25,150,45,13,3,"#152f31");
  rounded(c,26,151,43,3,1,"#a6ab8c");line(c,[{x:29,y:161},{x:66,y:161}],"#496359",1.2);
  for(let i=0;i<4;i++)rounded(c,7+i*4,157,2,9,1,"#785f49");
  rounded(c,4,171,88,5,1,"#41584c");
 });c.restore();
}
function bag(c:CanvasRenderingContext2D,cam:Projection,x:number,y:number,z:number,color:string,index:number):void{
 const span=.145,height=13.5,at=(x:number,y:number,h:number)=>iso({x,y},cam,h);
 polygon(c,[at(x,y,z),at(x-.09,y+.015,z+1),at(x-.085,y+.015,z+height-1),at(x,y,z+height)],"#886745","#556452");
 polygon(c,[at(x,y,z+height),at(x-.085,y+.015,z+height-1),at(x-.085,y+span-.015,z+height-1),at(x,y+span,z+height)],"#dec68d","#776c4e");
 face(c,cam,x,y,span,z,height,"x",()=>{
  c.beginPath();c.moveTo(10,2);c.lineTo(86,2);c.bezierCurveTo(90,52,98,85,90,175);c.lineTo(6,175);c.bezierCurveTo(-1,83,7,48,10,2);c.closePath();c.fillStyle=color;c.fill();
  c.strokeStyle="#5e664e";c.lineWidth=3;c.stroke();
  polygon(c,[{x:11,y:12},{x:23,y:12},{x:19,y:162},{x:9,y:166}],"rgba(252,237,187,.28)");
  polygon(c,[{x:80,y:14},{x:87,y:14},{x:90,y:165},{x:76,y:158}],"rgba(49,62,44,.18)");
  rounded(c,16,55,64,52,15,"#f0dfaa");caption(c,"CROC",48,83,32,"#56664a",56);
  c.fillStyle="#c5a565";c.beginPath();c.ellipse(42,94,13,7,-.25,0,Math.PI*2);c.fill();
  c.fillStyle="#d9bb75";c.beginPath();c.ellipse(59,91,10,6,.3,0,Math.PI*2);c.fill();
  line(c,[{x:12,y:10},{x:84,y:10}],"#f5dfa5",4);line(c,[{x:10,y:170},{x:88,y:170}],"#d6bd7e",4);
  for(let i=0;i<6;i++){c.fillStyle="#e5cf96";c.fillRect(17+i*11,5,2,8);}
  rounded(c,31,126,34,8,3,index%2?"#e3c578":"#d9dda9");
 });
}
function paintShelf(c:CanvasRenderingContext2D,cam:Projection,p:Point,quantity:number):void{
 const w=.46,d=1.22,z=cam.zoom,at=(x:number,y:number,h:number)=>iso({x:p.x+x,y:p.y+y},cam,h);
 c.save();c.lineJoin="round";
 const ground=at(w/2,d/2,0);c.fillStyle="rgba(20,40,32,.18)";c.beginPath();c.ellipse(ground.x,ground.y,39*z,13*z,0,0,Math.PI*2);c.fill();
 // Rear posts and perforated back frame; the aisle-facing front stays open.
 for(const y of [.035,d-.035])line(c,[at(.035,y,3),at(.035,y,97)],"#4b6c59",3.7*z);
 line(c,[at(.035,.035,91),at(.035,d-.035,91)],"#7e9780",2.2*z);
 for(let row=0;row<7;row++)line(c,[at(.036,.08,19+row*10),at(.036,d-.08,19+row*10)],"rgba(85,108,81,.35)",.7*z);
 const palette=["#d1a34c","#b86a58","#80a56e","#6e94ad","#b28b9b"];
 for(let row=0;row<4;row++){
  const height=17+row*20;
  box(c,cam,p.x+.025,p.y+.025,w-.05,d-.05,height-2,2,"#c3cab0","#7b9275","#96a387");
  for(let i=4;i>=0;i--){
   const index=(3-row)*5+i;if(index>=quantity)continue;
   bag(c,cam,p.x+w-.037,p.y+.10+i*.215,height+.8,palette[(i+row*2)%palette.length]!,index);
  }
  // Low guard rail and blank price tickets belong to the front shelf edge.
  line(c,[at(w-.016,.035,height+1),at(w-.016,d-.035,height+1)],"#476951",1.7*z);
  face(c,cam,p.x+w-.01,p.y+.04,d-.08,height-2.5,3.3,"x",()=>{
   c.fillStyle="#718567";c.fillRect(0,0,96,180);
   for(let i=0;i<5;i++){rounded(c,5+i*18,27,11,130,5,"#ebe1b8");c.fillStyle="#8b9370";c.fillRect(7+i*18,72,7,12);}
  });
 }
 for(const y of [.035,d-.035]){
  line(c,[at(w-.025,y,3),at(w-.025,y,94)],"#557860",3*z);
  box(c,cam,p.x+w-.055,p.y+y-.015,.09,.08,0,3,"#819378","#405f49","#526e50");
 }
 box(c,cam,p.x+.025,p.y+.025,w-.05,d-.05,94,3,"#b2bca0","#6d8768","#829675");
 // A shaped header and inset lettering follow the long X+ face of the rack.
 face(c,cam,p.x+w+.002,p.y+.035,d-.07,95,13,"x",()=>{
  rounded(c,0,0,96,180,10,"#c9aa63","#647450");rounded(c,3,12,90,151,8,"#ead69d");
  caption(c,"SALGADINHOS",48,91,80,"#48644b",87);caption(c,"CROC DO BAIRRO",48,151,43,"#867746",83);
 });c.restore();
}

const sprites=new WeakMap<CanvasRenderingContext2D,Map<string,HTMLCanvasElement>>();
function drawCached(c:CanvasRenderingContext2D,cam:Projection,p:Point,keyParts:unknown[],paint:(target:CanvasRenderingContext2D)=>void,useCache:boolean):void{
 const transform=c.getTransform();
 if(!useCache||typeof document==="undefined"||c.globalAlpha!==1||c.globalCompositeOperation!=="source-over"||(c.filter&&c.filter!=="none")||
  transform.a!==1||transform.b!==0||transform.c!==0||transform.d!==1||transform.e!==0||transform.f!==0){paint(c);return;}
 const anchor=iso(p,cam),ix=Math.floor(anchor.x),iy=Math.floor(anchor.y),z=cam.zoom;
 const key=JSON.stringify([z,anchor.x-ix,anchor.y-iy,cam.rotation??0,...keyParts]);
 let cache=sprites.get(c);if(!cache){cache=new Map();sprites.set(c,cache);}
 let sprite=cache.get(key);const padX=Math.ceil((cam.rotation?150:90)*z)+4,padY=Math.ceil((cam.rotation?180:116)*z)+4;
 if(!sprite){
  sprite=document.createElement("canvas");sprite.width=Math.ceil((cam.rotation?300:184)*z)+8;sprite.height=Math.ceil((cam.rotation?300:181)*z)+8;
  const target=sprite.getContext("2d");if(!target){paint(c);return;}
  target.translate(padX-ix,padY-iy);paint(target);
  cache.set(key,sprite);if(cache.size>96)cache.delete(cache.keys().next().value!);
 }else{cache.delete(key);cache.set(key,sprite);}
 c.drawImage(sprite,ix-padX,iy-padY);
}
export function drawVendingMachine(c:CanvasRenderingContext2D,cam:Projection,p:Point,kind:MachineKind,time:number,stock:number=RETAIL_DISPLAY_CAPACITY[kind],useCache=true):void{
 const quantity=visibleRetailStock(stock,RETAIL_DISPLAY_CAPACITY[kind]),pulse=quantity?Math.floor(time*1.2)%2:0;
 drawCached(c,cam,p,[kind,quantity,pulse],target=>paintMachine(target,cam,p,kind,quantity,pulse),useCache);
}
export function drawSnackShelf(c:CanvasRenderingContext2D,cam:Projection,minX=0,stock:number=RETAIL_DISPLAY_CAPACITY.snacks,useCache=true,position?:Point):void{
 const p=position??{x:minX+.23,y:2.92},quantity=visibleRetailStock(stock,RETAIL_DISPLAY_CAPACITY.snacks);
 drawCached(c,cam,p,["snacks",quantity],target=>paintShelf(target,cam,p,quantity),useCache);
}
