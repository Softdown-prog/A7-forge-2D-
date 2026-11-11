import type {ProductId} from "../../sim/merchandise.js";
import type {Point} from "../../sim/types.js";
import {iso,polygon,type Projection} from "../isometric.js";
import {mixHex} from "../color.js";
import {RETAIL_DISPLAY_CAPACITY,visibleRetailStock,line,rounded,box,face,caption,drawCached} from "./primitives.js";

/** Expositor retrô inspirado nos pacotes coloridos, sem reproduzir marcas registradas.
 * Cada posição corresponde a UM item já disponível no estoque real. */
const SNACK_COLORWAYS=[
 {color:"#e3b33c",flavour:"QUEIJO"},
 {color:"#da584b",flavour:"CHURRAS"},
 {color:"#4ca383",flavour:"CEBOLA"},
 {color:"#458fc7",flavour:"SAL"},
 {color:"#b56ca5",flavour:"PIMENTA"}
] as const;
export function snackShelfBagStyle(product:ProductId="snacks",index=0):{color:string;label:string;flavour:string}{
 if(product==="cookies")return {color:"#719aaf",label:"BISC",flavour:"RECHEADO"};
 if(product==="wholegrain")return {color:"#81a98b",label:"INT",flavour:"INTEGRAL"};
 const variant=SNACK_COLORWAYS[((Math.trunc(index)%SNACK_COLORWAYS.length)+SNACK_COLORWAYS.length)%SNACK_COLORWAYS.length]!;
 return {color:variant.color,label:"CROC",flavour:variant.flavour};
}
/** Três frentes e duas embalagens recuadas por nível: cinco unidades, nunca clones. */
export function snackShelfPlacement(slot:number):{x:number;y:number;span:number;depth:number}{
 if(!Number.isInteger(slot)||slot<0||slot>=5)throw new RangeError("Shelf slot must be 0..4");
 return slot<3
  ?{x:.418,y:.075+slot*.365,span:.29,depth:.145}
  :{x:.215,y:.23+(slot-3)*.49,span:.30,depth:.135};
}
function bag(c:CanvasRenderingContext2D,cam:Projection,x:number,y:number,z:number,
 span:number,depth:number,color:string,index:number,label:string,flavour:string):void{
 const h=13.5,rear=x-depth,at=(bx:number,by:number,height:number)=>iso({x:bx,y:by},cam,height);
 const dark=mixHex(color,14,.38),light=mixHex(color,255,.30);
 const foot=at(x-depth*.54,y+span*.52,z-.4),zoom=cam.zoom;
 c.save();
 // Shelf shadow and a true back, folded side, top and front: no flat sticker.
 c.fillStyle="rgba(23,32,24,.27)";
 c.beginPath();c.ellipse(foot.x,foot.y,13*zoom,5*zoom,-.18,0,Math.PI*2);c.fill();
 polygon(c,[at(rear,y+.015,z+1.5),at(rear,y+span-.016,z+1.5),
  at(rear,y+span-.016,z+h-1.5),at(rear,y+.015,z+h-1.5)],dark);
 polygon(c,[at(x,y+span,z+.8),at(rear,y+span-.016,z+1.5),
  at(rear,y+span-.016,z+h-1.5),at(x,y+span,z+h-.6)],mixHex(color,8,.27),"#566457");
 polygon(c,[at(x,y,z+h-.6),at(rear,y+.015,z+h-1.5),
  at(rear,y+span-.016,z+h-1.5),at(x,y+span,z+h-.6)],light,"#786d50");
 // The bag front stays anchored to the existing aisle-facing X+ plane.
 face(c,cam,x,y,span,z,h,"x",()=>{
  const foil=c.createLinearGradient(0,0,96,0);
  foil.addColorStop(0,dark);foil.addColorStop(.16,light);
  foil.addColorStop(.36,color);foil.addColorStop(.78,color);foil.addColorStop(1,dark);
  c.beginPath();c.moveTo(10,3);c.lineTo(85,3);
  c.bezierCurveTo(93,42,97,86,89,176);c.lineTo(8,176);
  c.bezierCurveTo(-1,105,3,45,10,3);c.closePath();
  c.fillStyle=foil;c.fill();c.lineWidth=3;c.strokeStyle=mixHex(color,0,.4);c.stroke();
  // Sealed foil edges and irregular folds make the pillow-pack silhouette tangible.
  line(c,[{x:13,y:12},{x:82,y:12}],"#f8e8b8",5);
  line(c,[{x:10,y:166},{x:86,y:166}],dark,5);
  for(let fold=0;fold<6;fold++){
   line(c,[{x:16+fold*12,y:4},{x:14+fold*12,y:15}],"rgba(40,48,35,.28)",2);
   line(c,[{x:15+fold*12,y:165},{x:17+fold*12,y:175}],"rgba(255,236,191,.38)",2);
  }
  polygon(c,[{x:15,y:17},{x:25,y:20},{x:18,y:153},{x:11,y:156}],"rgba(255,255,233,.23)");
  polygon(c,[{x:79,y:19},{x:87,y:19},{x:90,y:157},{x:76,y:148}],"rgba(25,32,31,.13)");
  rounded(c,16,52,64,58,16,"#fae6a9","#c0a36b");
  caption(c,label,48,82,28,"#485747",62);
  // Two crunchy snack curls instead of an unlit printed rectangle.
  c.fillStyle="#dba94d";c.beginPath();c.ellipse(38,95,12,6,-.4,0,Math.PI*2);c.fill();
  c.fillStyle="#c89444";c.beginPath();c.ellipse(62,96,11,6,.4,0,Math.PI*2);c.fill();
  caption(c,flavour,48,131,16,"#fff4d4",79);
  rounded(c,30,143,36,7,2,index%2?"#fae3a2":"#eee8b8");
 });
 c.restore();
}
function paintShelf(c:CanvasRenderingContext2D,cam:Projection,p:Point,quantity:number,display?:readonly ProductId[]):void{
 const w=.46,d=1.22,z=cam.zoom,at=(x:number,y:number,h:number)=>iso({x:p.x+x,y:p.y+y},cam,h);
 c.save();c.lineJoin="round";
 const ground=at(w/2,d/2,0);c.fillStyle="rgba(20,40,32,.18)";c.beginPath();c.ellipse(ground.x,ground.y,39*z,13*z,0,0,Math.PI*2);c.fill();
 // Original footprint, four levels, back frame and metal uprights are unchanged.
 for(const y of [.035,d-.035])line(c,[at(.035,y,3),at(.035,y,97)],"#4b6c59",3.7*z);
 line(c,[at(.035,.035,91),at(.035,d-.035,91)],"#7e9780",2.2*z);
 for(let row=0;row<7;row++)line(c,[at(.036,.08,19+row*10),at(.036,d-.08,19+row*10)],"rgba(85,108,81,.35)",.7*z);
 for(let row=0;row<4;row++){
  const height=17+row*20;
  box(c,cam,p.x+.025,p.y+.025,w-.05,d-.05,height-2,2,"#c3cab0","#7b9275","#96a387");
  // Draw rear packs before the three aisle-facing packs. Slot order remains
  // stable when stock changes and each slot consumes exactly one visible unit.
  for(const i of [3,4,0,1,2]){
   const index=(3-row)*5+i;if(index>=quantity)continue;
   const product=display?.[index]??"snacks",style=snackShelfBagStyle(product,index);
   const slot=snackShelfPlacement(i);
   bag(c,cam,p.x+slot.x,p.y+slot.y,height+.8,
    slot.span,slot.depth,style.color,index,style.label,style.flavour);
  }
  // The metal guard remains in front of all packages and never blocks pickup.
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
 // Familiar snack-rack silhouette, now carrying a playful multicolour flavour strip.
 face(c,cam,p.x+w+.002,p.y+.035,d-.07,95,13,"x",()=>{
  rounded(c,0,0,96,180,10,"#c9aa63","#647450");rounded(c,3,12,90,151,8,"#ead69d");
  caption(c,"SALGADINHOS",48,84,74,"#48644b",87);
  for(let i=0;i<5;i++)rounded(c,8+i*16,105,14,24,3,SNACK_COLORWAYS[i]!.color);
  caption(c,"CROC DO BAIRRO",48,153,37,"#867746",87);
 });c.restore();
}

export function drawSnackShelf(c:CanvasRenderingContext2D,cam:Projection,minX=0,stock:number=RETAIL_DISPLAY_CAPACITY.snacks,useCache=true,position?:Point,display?:readonly ProductId[]):void{
 const p=position??{x:minX+.23,y:2.92},quantity=display?.length??visibleRetailStock(stock,RETAIL_DISPLAY_CAPACITY.snacks);
 drawCached(c,cam,p,["snacks",quantity,display],target=>paintShelf(target,cam,p,quantity,display),useCache);
}
