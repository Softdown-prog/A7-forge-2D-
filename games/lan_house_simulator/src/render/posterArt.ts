import type {Projection} from "./isometric.js";
import {iso} from "./isometric.js";

export type PosterKind="coaster"|"tactical"|"golf"|"artillery"|"city"|"terminal"|"arcade";
export const POSTER_KINDS:readonly PosterKind[]=["coaster","tactical","golf","artillery","city","terminal","arcade"];
export const POSTER_WIDTH=96,POSTER_HEIGHT=112;
const palettes:Record<PosterKind,[string,string,string]>={
 coaster:["#204c49","#efb75f","#fff0c9"],tactical:["#203344","#db954b","#fff0d1"],
 golf:["#42879a","#f3d77b","#fff7db"],artillery:["#4a4269","#eca47a","#f6edd1"],
 city:["#215852","#e6b778","#fff0c7"],terminal:["#244c40","#bdd48d","#fff0c9"],
 arcade:["#433e68","#df967b","#fff0c7"]
};
const titles:Record<PosterKind,readonly string[]>={
 coaster:["ROLLERCOASTER","TYCOON"],tactical:["COUNTER","STRIKE"],golf:["PANGYA"],
 artillery:["GUNBOUND"],city:["CITY","HORIZON"],terminal:["LAN HOUSE"],arcade:["JOGOS"]
};
const captions:Record<PosterKind,string>={coaster:"UM PARQUE DE IDEIAS",tactical:"ENTRE PARA A PARTIDA",
 golf:"VENTO A FAVOR",artillery:"MIRE NAS ESTRELAS",city:"CONSTRUA SEU FUTURO",terminal:"PRIMEIRAS CONEXÕES",arcade:"MAIS UMA FASE"};
function poly(c:CanvasRenderingContext2D,points:readonly number[][],color:string):void{
 c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x!,y!):c.moveTo(x!,y!));c.closePath();c.fillStyle=color;c.fill();
}
function disk(c:CanvasRenderingContext2D,x:number,y:number,r:number,color:string):void{
 c.fillStyle=color;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();
}
function line(c:CanvasRenderingContext2D,points:readonly number[][],color:string,width=2):void{
 c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x!,y!):c.moveTo(x!,y!));c.strokeStyle=color;c.lineWidth=width;c.stroke();
}
/** Original vector illustrations and lettering, painted by the game itself. */
export function drawPosterPlate(c:CanvasRenderingContext2D,kind:PosterKind):void{
 const [base,accent,paper]=palettes[kind];c.save();c.lineJoin="round";c.lineCap="round";
 c.fillStyle="#715c4e";c.fillRect(0,0,96,112);
 c.fillStyle="#ddc9a4";c.fillRect(0,0,94,110);
 c.fillStyle=paper;c.fillRect(2,2,90,106);
 c.fillStyle=base;c.fillRect(5,5,84,101);
 c.save();c.beginPath();c.rect(6,6,82,73);c.clip();
 if(kind==="coaster"){
  c.fillStyle="#e7bf78";c.fillRect(6,6,82,73);disk(c,69,24,15,"#f9e3aa");
  poly(c,[[6,65],[18,48],[24,62],[34,51],[46,67],[88,60],[88,80],[6,80]],"#668c73");
  line(c,[[12,70],[12,44],[31,27],[44,33],[62,53],[81,40]],"#64786b",2);
  for(const x of [20,36,54,70])line(c,[[x,41],[x,79]],"#557b69",1.5);
  c.beginPath();c.moveTo(4,64);c.bezierCurveTo(19,61,11,22,31,25);
  c.bezierCurveTo(52,25,47,66,65,56);c.bezierCurveTo(74,52,78,39,92,43);
  c.strokeStyle="#214d4a";c.lineWidth=5;c.stroke();c.strokeStyle="#fff0c9";c.lineWidth=1.4;c.stroke();
  for(const [x,y] of [[22,26],[30,24],[38,29]]){
   c.fillStyle="#b85b49";c.fillRect(x!,y!,8,5);disk(c,x!+2,y!+6,1.5,"#203b3c");disk(c,x!+6,y!+6,1.5,"#203b3c");
  }
  poly(c,[[7,80],[10,65],[15,74],[20,62],[25,80]],"#315f52");
 }else if(kind==="tactical"){
  poly(c,[[5,6],[88,6],[88,51],[5,74]],"#bc8049");
  poly(c,[[5,6],[46,6],[5,51]],"#e8bd77");
  for(const [x,h] of [[10,24],[24,34],[60,28],[74,39]]){
   c.fillStyle="#6c665b";c.fillRect(x!,76-h!,10,h!);
   c.fillStyle="#d6b677";c.fillRect(x!+2,79-h!,3,4);
  }
  // Silhouette of a player: large shapes remain readable on the wall.
  disk(c,47,30,7,"#263747");poly(c,[[36,39],[53,37],[60,58],[54,65],[32,65]],"#253747");
  poly(c,[[35,58],[43,62],[39,80],[30,80]],"#182c3c");
  poly(c,[[48,59],[56,58],[63,80],[53,80]],"#182c3c");
  line(c,[[38,43],[30,53],[44,58]],"#263747",7);line(c,[[54,42],[61,48],[73,44]],"#263747",7);
  line(c,[[38,43],[47,42],[50,55]],"#648079",2);
  c.strokeStyle="#f4d39a";c.lineWidth=1;c.strokeRect(69,17,9,9);
  line(c,[[73.5,14],[73.5,29]],"#f4d39a",1);line(c,[[66,21.5],[81,21.5]],"#f4d39a",1);
 }else if(kind==="golf"){
  c.fillStyle="#6cbbc2";c.fillRect(6,6,82,73);disk(c,69,22,11,"#fce2a0");
  line(c,[[12,23],[23,23],[27,19],[38,19]],"#f3efd6",4);
  poly(c,[[6,51],[26,44],[52,53],[73,43],[89,49],[89,80],[6,80]],"#3f8862");
  poly(c,[[6,67],[40,55],[75,60],[88,57],[88,80],[6,80]],"#9dbb70");
  poly(c,[[41,68],[48,65],[65,70],[59,75],[44,74]],"#e7d9a6");
  line(c,[[59,33],[59,65]],"#f8edcd",2);poly(c,[[59,33],[76,38],[59,44]],"#c75f74");
  c.fillStyle="#52745e";c.beginPath();c.ellipse(32,71,12,4,0,0,Math.PI*2);c.fill();
  disk(c,31,62,10,"#fcf5dc");disk(c,34,66,5,"#d3dacc");disk(c,28,59,5,"#fffef0");
  for(const [x,y] of [[26,63],[32,60],[35,64]])disk(c,x!,y!,1,"#b6c7c5");
 }else if(kind==="artillery"){
  c.fillStyle="#675d8e";c.fillRect(6,6,82,73);disk(c,71,25,14,"#c198ae");
  disk(c,67,21,10,"#dfaebb");
  for(const [x,y] of [[16,14],[38,24],[17,37],[52,10]]){
   line(c,[[x!-2,y!],[x!+2,y!]],paper,1);line(c,[[x!,y!-2],[x!,y!+2]],paper,1);
  }
  poly(c,[[6,63],[27,57],[48,65],[75,53],[89,59],[89,80],[6,80]],"#d99774");
  c.fillStyle="#293f58";c.fillRect(22,55,36,14);disk(c,28,68,7,"#263447");disk(c,51,68,7,"#263447");
  disk(c,28,68,3,"#a3bdaa");disk(c,51,68,3,"#a3bdaa");
  poly(c,[[28,54],[32,45],[47,43],[57,52],[54,59],[25,59]],"#b9c686");
  line(c,[[47,48],[62,36]],"#d4d898",8);line(c,[[49,46],[61,36]],"#7d9b77",2);
  disk(c,68,30,5,"#f2dc9e");disk(c,67,28,2,"#fff4d2");
 }else if(kind==="city"){
  c.fillStyle="#76a39a";c.fillRect(6,6,82,73);disk(c,72,21,13,"#f0c782");
  poly(c,[[6,54],[48,37],[90,55],[50,79],[6,69]],"#527e72");
  line(c,[[7,65],[50,46],[88,61]],"#d0c295",5);line(c,[[30,79],[68,51]],"#c5b48b",4);
  for(const [x,y,w,h,color] of [[20,55,13,20,"#dcbe8c"],[39,46,16,31,"#e8d8ae"],[62,57,11,23,"#e3bf86"]] as const){
   poly(c,[[x,y],[x+w,y-5],[x+w,y-h-5],[x,y-h]],color);
   poly(c,[[x+w,y-5],[x+w+7,y],[x+w+7,y-h],[x+w,y-h-5]],"#6a7770");
   poly(c,[[x,y-h],[x+w,y-h-5],[x+w+7,y-h],[x+7,y-h+5]],"#f3dfb3");
   for(let k=0;k<Math.floor(h/8);k++)line(c,[[x+4,y-h+8+k*7],[x+w-3,y-h+5+k*7]],"#4d7977",2);
  }
  for(const [x,y] of [[13,65],[75,70],[53,75]]){line(c,[[x!,y!],[x!,y!-7]],"#4d5d45",2);disk(c,x!,y!-8,5,"#b1c786");}
 }else{
  c.fillStyle=kind==="terminal"?"#628778":"#786488";c.fillRect(6,6,82,73);
  disk(c,72,21,16,kind==="terminal"?"#9eae78":"#be8496");
  poly(c,[[12,70],[78,70],[69,79],[20,79]],"#253c42");
  c.fillStyle="#233e3d";c.fillRect(20,21,58,44);
  c.fillStyle="#d9d9ac";c.fillRect(16,17,58,44);
  c.fillStyle="#254f49";c.fillRect(21,22,48,31);
  c.fillStyle="#8bb784";c.fillRect(25,26,40,23);
  if(kind==="terminal"){
   line(c,[[32,32],[38,37],[32,42]],"#214d41",3);line(c,[[43,42],[51,42]],"#214d41",3);
  }else{
   poly(c,[[46,27],[49,34],[57,35],[51,41],[53,48],[46,44],[39,48],[41,40],[35,35],[43,34]],"#fff0c7");
   disk(c,58,29,2,"#d28680");
  }
  c.fillStyle="#bac393";c.fillRect(37,61,15,5);c.fillRect(30,66,30,4);
  c.fillStyle="#d9cda7";c.fillRect(21,73,46,4);
 }
 c.restore();
 // Titles live on the same paper plane as the illustration.
 c.fillStyle=base;c.fillRect(6,79,82,26);line(c,[[12,81],[82,81]],accent,1);
 c.textAlign="center";c.fillStyle=paper;
 const name=titles[kind];c.font="900 "+(kind==="coaster"?9.2:name.length>1?13.5:16)+"px Arial,sans-serif";
 name.forEach((text,i)=>c.fillText(text,47,name.length===1?96:91+i*12,78));
 c.fillStyle=paper;c.fillRect(6,104.5,82,4.5);
 c.fillStyle=base;c.font="600 4.5px Arial,sans-serif";c.fillText(captions[kind],47,108.2,80);
 c.strokeStyle="rgba(255,249,224,.6)";c.lineWidth=1;c.strokeRect(1.5,1.5,91,107);
 c.restore();
}

export interface PosterPlacement{x:number;y:number;axis:"x"|"y";span:number;top:number;height:number}
/** Affine wall projection: illustrations, frame and text share one perspective. */
export function drawWallPoster(c:CanvasRenderingContext2D,camera:Projection,p:PosterPlacement,kind:PosterKind):void{
 const left=p.axis==="y"?{x:p.x,y:p.y+p.span}:{x:p.x,y:p.y};
 const right=p.axis==="y"?{x:p.x,y:p.y}:{x:p.x+p.span,y:p.y};
 const origin=iso(left,camera,p.top),u=iso(right,camera,p.top),down=iso(left,camera,p.top-p.height);
 c.save();c.transform((u.x-origin.x)/96,(u.y-origin.y)/96,(down.x-origin.x)/112,(down.y-origin.y)/112,origin.x,origin.y);
 c.fillStyle="rgba(49,40,41,.22)";c.fillRect(2.5,3,96,112);
 drawPosterPlate(c,kind);c.restore();
}
export function purchasedPosterKind(index:number):PosterKind{
 const collection:readonly PosterKind[]=["city","arcade","coaster","golf","artillery","tactical"];
 return collection[Math.abs(Math.trunc(index))%collection.length]!;
}
