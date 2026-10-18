import {iso,polygon,type Projection} from "./isometric.js";
import type {Point} from "../sim/types.js";

/** Aquário mural VIP: não possui colisão, slot nem custo operacional.
 * Posição é relativa à parede do salão e toda a animação deriva do tempo
 * de render; nenhum RNG, alocação de sprite ou estado de save por frame. */
export function drawVipAquarium(
 c:CanvasRenderingContext2D,cam:Projection,p:Point,time:number
):void{
 const w=1.22,d=.41,bottom=65,top=116,z=cam.zoom;
 const at=(dx:number,dy:number,h:number)=>iso({x:p.x+dx,y:p.y+dy},cam,h);
 const A=at(0,0,bottom),B=at(w,0,bottom),
  C=at(w,d,bottom),D=at(0,d,bottom),
  E=at(0,0,top),F=at(w,0,top),
  G=at(w,d,top),H=at(0,d,top);
 c.save();c.lineJoin="round";c.lineCap="round";
 // Cantoneiras de parede: equipamento fica elevado e não ocupa caminho.
 for(const dx of [.22,1.02]){
  const wall=at(dx,0,61),lower=at(dx,.24,56);
  c.strokeStyle="#223a4a";c.lineWidth=4.5*z;
  c.beginPath();c.moveTo(wall.x,wall.y);c.lineTo(lower.x,lower.y);c.stroke();
  c.strokeStyle="#9aabba";c.lineWidth=1.3*z;
  c.beginPath();c.moveTo(wall.x-1.1*z,wall.y);c.lineTo(lower.x-1.1*z,lower.y);c.stroke();
 }
 polygon(c,[A,B,C,D],"#263a52","#708899");
 polygon(c,[D,C,G,H],"#0f4260","#629ba3");
 polygon(c,[B,C,G,F],"#16455b","#629ba3");
 // Interior tridimensional; os vidros são translúcidos mas delimitam a água.
 polygon(c,[D,C,G,H],"rgba(33,159,183,.45)","rgba(166,241,242,.62)");
 polygon(c,[B,C,G,F],"rgba(25,125,165,.46)","rgba(122,221,236,.65)");
 const floor=[at(.04,.035,bottom+2),at(w-.03,.035,bottom+2),
  at(w-.03,d-.025,bottom+2),at(.04,d-.025,bottom+2)];
 polygon(c,floor,"#b1aa8f","#6b8c94");
 // Rochas facetadas e jardins de algas com sombra colorida.
 const rock=(x:number,y:number,rr:number,color:string)=>{
  const center=at(x,y,bottom+2);
  polygon(c,[{x:center.x-rr*z,y:center.y},{x:center.x-rr*.55*z,y:center.y-rr*.8*z},
   {x:center.x+rr*.4*z,y:center.y-rr*1.06*z},{x:center.x+rr*z,y:center.y-rr*.2*z},
   {x:center.x+rr*.5*z,y:center.y+rr*.2*z}],color,"#34516b");
 };
 rock(.16,.24,7.8,"#56627f");rock(.61,.2,6,"#d0a3a1");rock(1.06,.24,6.5,"#4d717d");
 for(const x of [.24,.38,.91,1.09]){
  const foot=at(x,.30,bottom+3);
  c.beginPath();c.moveTo(foot.x,foot.y);
  c.quadraticCurveTo(foot.x+(3+Math.sin(time+x*6)*2)*z,foot.y-11*z,foot.x+2*z,foot.y-18*z);
  c.strokeStyle=x>.7?"#6fdfaa":"#7ddfb9";c.lineWidth=2.25*z;c.stroke();
  c.beginPath();c.moveTo(foot.x+z,foot.y-9*z);
  c.quadraticCurveTo(foot.x-8*z,foot.y-17*z,foot.x-4*z,foot.y-21*z);
  c.strokeStyle="#3aa3a3";c.lineWidth=1.2*z;c.stroke();
 }
 // Bolhas espaçadas: não surgem partículas novas por frame.
 for(let k=0;k<6;k++){
  const travel=((time*.1+k*.176)%1+1)%1;
  const center=at(.32+(k%2)*.41,.31,bottom+9+travel*35);
  c.beginPath();c.ellipse(center.x,center.y,Math.max(.65,(1.3+k%3*.42)*z),
   Math.max(.65,(1.4+k%3*.45)*z),0,0,Math.PI*2);
  c.strokeStyle="rgba(205,255,254,.78)";c.lineWidth=Math.max(.5,z*.8);c.stroke();
 }
 const fish=(id:number,phase:number,height:number,color:string,fin:string)=>{
  const lane=(.22+id*.26)+Math.sin(time*(.46+id*.13)+phase)*.13;
  const x=Math.max(.12,Math.min(1.07,lane));
  const pnt=at(x,d+.012,bottom+height+Math.cos(time*.9+phase)*2);
  const flip=Math.cos(time*(.46+id*.13)+phase)>=0?1:-1;
  c.save();c.translate(pnt.x,pnt.y);c.scale(flip*z,z);
  c.fillStyle="rgba(3,26,46,.20)";
  c.beginPath();c.ellipse(0,2,10,4,0,0,Math.PI*2);c.fill();
  c.fillStyle=fin;c.beginPath();c.moveTo(-7,0);c.lineTo(-13,-5);c.lineTo(-13,5);c.closePath();c.fill();
  c.fillStyle=color;c.beginPath();c.ellipse(0,0,8,4.2,0,0,Math.PI*2);c.fill();
  c.fillStyle=fin;c.beginPath();c.moveTo(-1,-3);c.lineTo(2,-8);c.lineTo(5,-3);c.closePath();c.fill();
  c.strokeStyle="rgba(251,255,241,.78)";c.lineWidth=.85;
  c.beginPath();c.moveTo(-1,-2);c.lineTo(3,-2);c.stroke();
  c.fillStyle="#183c50";c.beginPath();c.arc(5,-.9,1.25,0,Math.PI*2);c.fill();
  c.fillStyle="#ffffff";c.beginPath();c.arc(5.5,-1.3,.45,0,Math.PI*2);c.fill();
  c.restore();
 };
 fish(0,0,29,"#ffc77c","#ed877a");
 fish(1,2.3,16,"#80ecdc","#408ebf");
 fish(2,4.8,36,"#f6a2d1","#b377c1");
 // Orla RGB RGB é discreta e desenhada sem shadowBlur (custo baixo no Android).
 const colors=["#67e3dc","#92aceb","#efb0dc","#ffd2a6"];
 const strip=(from:Point,to:Point,color:string,width:number)=>{
  c.beginPath();c.moveTo(from.x,from.y);c.lineTo(to.x,to.y);
  c.strokeStyle=color;c.lineWidth=width*z;c.stroke();
 };
 const phase=(Math.floor(time*.65)%colors.length+colors.length)%colors.length;
 strip(D,C,colors[phase]!,3.3);strip(C,G,colors[(phase+1)%4]!,2.8);
 strip(H,G,colors[(phase+2)%4]!,2.8);strip(E,H,colors[(phase+3)%4]!,1.7);
 // Tampas em aço pintado, perfil com tampa central destacada.
 polygon(c,[E,F,G,H],"#2b4359","#849baf");
 polygon(c,[at(.07,.06,top+2.3),at(w-.07,.06,top+2.3),
   at(w-.07,d-.045,top+2.3),at(.07,d-.045,top+2.3)],"#4c6375","#1a314b");
 strip(at(.08,.035,top+2.8),at(w-.08,.035,top+2.8),"#b1e6ef",1.25);
 // Reflexo diagonal na face principal, mantido sob o vidro frontal.
 const refl=[at(.10,d+.016,top-5),at(.22,d+.016,top-5),
  at(.43,d+.016,bottom+8),at(.32,d+.016,bottom+8)];
 polygon(c,refl,"rgba(223,255,255,.14)");
 strip(at(.09,d+.02,top-8),at(.12,d+.02,bottom+8),"rgba(211,255,251,.38)",1.25);
 c.restore();
}
