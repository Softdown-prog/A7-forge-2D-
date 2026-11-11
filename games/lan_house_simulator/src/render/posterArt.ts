import type {Projection} from "./isometric.js";
import {iso} from "./isometric.js";
import type {PosterKind,PosterDesign} from "./posters/types.js";
export type {PosterKind} from "./posters/types.js";
import {coasterPoster} from "./posters/coaster.js";
import {tacticalPoster} from "./posters/tactical.js";
import {golfPoster} from "./posters/golf.js";
import {artilleryPoster} from "./posters/artillery.js";
import {cityPoster} from "./posters/city.js";
import {terminalPoster} from "./posters/terminal.js";
import {arcadePoster} from "./posters/arcade.js";

export const POSTER_KINDS:readonly PosterKind[]=["coaster","tactical","golf","artillery","city","terminal","arcade"];
export const POSTER_WIDTH=96,POSTER_HEIGHT=112;
const posterDefinitions:Record<PosterKind,PosterDesign>={
 coaster:coasterPoster,
 tactical:tacticalPoster,
 golf:golfPoster,
 artillery:artilleryPoster,
 city:cityPoster,
 terminal:terminalPoster,
 arcade:arcadePoster
};
/** Original vector illustrations and lettering, painted by the game itself. */
export function drawPosterPlate(c:CanvasRenderingContext2D,kind:PosterKind):void{
 const poster=posterDefinitions[kind];
 const [base,accent,paper]=poster.palette;
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
 poster.paint(c,paper);
 c.restore();
 // Titles live on the same paper plane as the illustration.
 c.fillStyle=base;c.fillRect(6,79,82,26);line(c,[[12,81],[82,81]],accent,1);
 c.textAlign="center";c.fillStyle=paper;
 const name=poster.title;c.font="900 "+(kind==="coaster"?9.2:name.length>1?13.5:16)+"px Arial,sans-serif";
 name.forEach((text,i)=>c.fillText(text,47,name.length===1?96:91+i*12,78));
 c.fillStyle=paper;c.fillRect(6,104.5,82,4.5);
 c.fillStyle=base;c.font="600 4.5px Arial,sans-serif";c.fillText(poster.caption,47,108.2,80);
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
