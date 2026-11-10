import {productSpec,type ProductId} from "../../sim/merchandise.js";
import type {Point} from "../../sim/types.js";
import {iso,polygon,type Projection} from "../isometric.js";
import {VENDING_WIDTH,VENDING_DEPTH} from "../../sim/layout.js";
import {RETAIL_DISPLAY_CAPACITY,visibleRetailStock,line,rounded,box,face,caption,drawCached} from "./primitives.js";
import {drawSodaCan,SODA_COLORS} from "./soda.js";
import {drawCandy,CANDY_COLORS} from "./candy.js";

type MachineKind="soda"|"candy";
function paintMachine(c:CanvasRenderingContext2D,cam:Projection,p:Point,kind:MachineKind,quantity:number,pulse:number,display?:readonly ProductId[]):void{
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
  const cols=soda?3:4,palette=soda?SODA_COLORS:CANDY_COLORS;
  for(let row=0;row<3;row++){
   const y=41+row*30;
   for(let col=0;col<cols;col++){
    const i=row*cols+col;if(i>=quantity)continue;
    const x=soda?17+col*16:15+col*12;
    const product=display?.[i]?productSpec(display[i]!)!:undefined;
    const color=product?.color??palette[(row+col)%palette.length]!;
    if(soda)drawSodaCan(c,x,y,color);else drawCandy(c,x,y+1,color,product?.id==='candy'?0:i+1);
    if(product)caption(c,product.name.slice(0,2).toUpperCase(),x+6,y+16,5,"#fff",10);
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

export function drawVendingMachine(c:CanvasRenderingContext2D,cam:Projection,p:Point,kind:MachineKind,time:number,stock:number=RETAIL_DISPLAY_CAPACITY[kind],useCache=true,display?:readonly ProductId[]):void{
 const quantity=display?.length??visibleRetailStock(stock,RETAIL_DISPLAY_CAPACITY[kind]),pulse=quantity?Math.floor(time*1.2)%2:0;
 drawCached(c,cam,p,[kind,quantity,pulse,display],target=>paintMachine(target,cam,p,kind,quantity,pulse,display),useCache);
}
