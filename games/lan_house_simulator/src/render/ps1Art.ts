import type {Point} from "../sim/types.js";
import {cuboid,iso,polygon,raisedCuboid,type Projection} from "./isometric.js";

/** Isometric CRT videogame kit: banco de madeira, TV de tubo,
 * console, controle e cadeira. Tudo geométrico, sem sprites externos. */
export function drawPs1Station(
 ctx:CanvasRenderingContext2D,cam:Projection,p:Point,wear:number,active:boolean,t:number
):void{
 const {x,y}=p,z=cam.zoom;
 const ground=iso({x:x+.58,y:y+.58},cam,0);
 ctx.save();
 ctx.fillStyle="rgba(18,24,22,.27)";ctx.beginPath();
 ctx.ellipse(ground.x,ground.y,55*z,18*z,0,0,Math.PI*2);ctx.fill();
 // Bancada: quatro pernas, tampo com madeira e borda clara.
 for(const dx of [.06,.95])for(const dy of [.05,.38])
  raisedCuboid(ctx,cam,x+dx,y+dy,.12,.12,0,24,["#856142","#60442f","#765337"]);
 raisedCuboid(ctx,cam,x,y,1.12,.57,24,7,["#cfa476","#77543a","#aa7a52"]);
 // Gabinete CRT: corpo escuro com volume real.
 raisedCuboid(ctx,cam,x+.15,y+.045,.50,.31,31,35,["#67696c","#32383d","#44484a"]);
 // Vidro na frente, borda, brilho e luz do jogo.
 const a=iso({x:x+.21,y:y+.355},cam,61),b=iso({x:x+.59,y:y+.355},cam,61);
 const c=iso({x:x+.59,y:y+.355},cam,40),d=iso({x:x+.21,y:y+.355},cam,40);
 polygon(ctx,[a,b,c,d],"#121c1b","#abb8a7");
 const pulse=active?.12*Math.sin(t*4):0;
 polygon(ctx,[iso({x:x+.245,y:y+.357},cam,58),iso({x:x+.55,y:y+.357},cam,58),
  iso({x:x+.55,y:y+.357},cam,43),iso({x:x+.245,y:y+.357},cam,43)],
  active?"#24664a":"#2d3940");
 ctx.fillStyle=active?"#91e5ab":"#7b8d8c";
 const target=iso({x:x+.4,y:y+.363},cam,50+pulse);
 ctx.fillRect(target.x-3*z,target.y-2*z,6*z,4*z);
 // Console retangular cinza, leitor de CD circular sobre a tampa.
 raisedCuboid(ctx,cam,x+.75,y+.13,.30,.28,31,7,["#b8b6af","#777975","#989993"]);
 const disc=iso({x:x+.89,y:y+.25},cam,39);
 ctx.fillStyle="#6c6b69";ctx.beginPath();ctx.ellipse(disc.x,disc.y,10*z,4*z,0,0,2*Math.PI);ctx.fill();
 ctx.fillStyle="#d8d5c9";ctx.font="bold "+Math.max(8,9*z)+"px system-ui";
 const badge=iso({x:x+.91,y:y+.43},cam,30);ctx.textAlign="center";ctx.fillText("PS1",badge.x,badge.y);
 // Cadeira de tecido escuro, encosto e pés.
 for(const dx of [.26,.64])raisedCuboid(ctx,cam,x+dx,y+.67,.10,.11,0,19,["#474b50","#303638","#43484d"]);
 raisedCuboid(ctx,cam,x+.18,y+.61,.66,.31,17,7,["#354b53","#1b323b","#29414a"]);
 raisedCuboid(ctx,cam,x+.18,y+.88,.66,.09,22,27,["#2d464e","#1b3038","#274049"]);
 if(wear>=100){
  const warn=iso({x:x+.57,y:y+.2},cam,88);ctx.font="bold "+Math.max(10,11*z)+"px system-ui";
  ctx.textAlign="center";ctx.fillStyle="#e9a765";ctx.fillText("!",warn.x,warn.y);
 }
 ctx.restore();
}
/** Controle pequeno nas mãos do cliente sentado, sem teclado de computador. */
export function drawPs1Controller(ctx:CanvasRenderingContext2D,cam:Projection,seat:Point,t:number):void{
 const p=iso(seat,cam,47),z=cam.zoom;
 ctx.save();ctx.translate(p.x,p.y);ctx.rotate(Math.sin(t*4)*.05);
 ctx.fillStyle="#414246";ctx.strokeStyle="#abb8ac";ctx.lineWidth=Math.max(1,z);
 ctx.beginPath();ctx.ellipse(0,0,12*z,5*z,0,0,Math.PI*2);ctx.fill();ctx.stroke();
 ctx.fillStyle="#dcbf8e";
 for(const side of [-1,1]){ctx.beginPath();ctx.ellipse(side*11*z,0,5*z,4*z,0,0,Math.PI*2);ctx.fill();}
 ctx.fillStyle="#b7dbaa";ctx.beginPath();ctx.arc(5*z,-1*z,1.7*z,0,Math.PI*2);ctx.fill();
 ctx.restore();
}
