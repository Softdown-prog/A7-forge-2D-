import type {Point} from "../../sim/types.js";
import {iso,polygon,type Projection} from "../isometric.js";
import {path,plane} from "./primitives.js";

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
