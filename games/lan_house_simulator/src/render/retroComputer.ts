import type { GameState, Point } from "../sim/types.js";
import { iso, polygon, cuboid, type Projection } from "./isometric.js";

/**
 * Estudos geométricos para um PC de época Windows 98.
 * Canvas 2D puro: nenhum asset é considerado aprovado e nenhuma marca é desenhada.
 */
function raisedBox(ctx:CanvasRenderingContext2D,camera:Projection,
  x:number,y:number,w:number,d:number,z:number,height:number,
  top:string,front:string,side:string):void {
  const low=(px:number,py:number)=>iso({x:px,y:py},camera,z);
  const high=(px:number,py:number)=>iso({x:px,y:py},camera,z+height);
  polygon(ctx,[low(x+w,y),low(x+w,y+d),high(x+w,y+d),high(x+w,y)],side,"#756C61");
  polygon(ctx,[low(x,y+d),low(x+w,y+d),high(x+w,y+d),high(x,y+d)],front,"#6D665D");
  polygon(ctx,[high(x,y),high(x+w,y),high(x+w,y+d),high(x,y+d)],top,"#8D8273");
}

function screenFace(ctx:CanvasRenderingContext2D,camera:Projection,
  x:number,y:number,w:number,z:number,height:number,lit:boolean,pulse:number):void {
  const left=x+0.065,right=x+w-0.065;
  const top=iso({x:left,y},camera,z+height-5),
    topRight=iso({x:right,y},camera,z+height-5),
    bottomRight=iso({x:right,y},camera,z+9),
    bottomLeft=iso({x:left,y},camera,z+9);
  polygon(ctx,[top,topRight,bottomRight,bottomLeft],lit?(pulse?"#75BCD3":"#679DAD"):"#59616C","#3A5059");
  if(lit){
    const a=iso({x:left+0.025,y:y+0.003},camera,z+height-10);
    const b=iso({x:right-0.025,y:y+0.003},camera,z+height-10);
    ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);
    ctx.strokeStyle="#DBEDE1";ctx.lineWidth=Math.max(0.6,camera.zoom);ctx.stroke();
  }
}

export function drawRetroComputer(ctx:CanvasRenderingContext2D,camera:Projection,
  p:Point,index:number,t:number,isOnline:boolean,s:GameState):void {
  const z=camera.zoom;
  const occupied=s.customers.some(c=>c.pcIndex===index &&
    (c.stage==="sitting"||c.stage==="using"||c.stage==="standing"));

  // Sombra, gabinete inferior e mesa única com apoio robusto.
  const ground=iso({x:p.x+0.35,y:p.y+0.38},camera);
  ctx.fillStyle="rgba(23,28,40,0.20)";
  ctx.beginPath();ctx.ellipse(ground.x,ground.y,37*z,15*z,0,0,Math.PI*2);ctx.fill();
  cuboid(ctx,camera,p.x-0.16,p.y-0.18,0.95,0.78,34,
    ["#CCA27D","#7F5D52","#9B7257"]);
  // Faixa frontal do tampo, com madeira levemente mais clara.
  const railY=p.y+0.6;
  polygon(ctx,[
    iso({x:p.x-0.16,y:railY},camera,34),iso({x:p.x+0.79,y:railY},camera,34),
    iso({x:p.x+0.79,y:railY},camera,29),iso({x:p.x-0.16,y:railY},camera,29)
  ],"#DBAF7D","#895F4F");
  // CPU bege ao lado do monitor: típica bancada de final dos anos 1990.
  raisedBox(ctx,camera,p.x-0.12,p.y+0.06,0.22,0.34,35,20,
    "#E7DAB8","#BFB297","#A79D8E");
  const power=iso({x:p.x+0.015,y:p.y+0.405},camera,43);
  ctx.fillStyle="#8CC8AD";ctx.fillRect(power.x-1.6*z,power.y-1.5*z,3*z,3*z);

  // Monitor CRT volumoso: corpo trapezoidal simplificado e tela orientada para a cadeira.
  const mx=p.x+0.22,my=p.y-0.05,mw=0.46,md=0.36,mz=36,mh=39;
  raisedBox(ctx,camera,mx,my,mw,md,mz,mh,
    "#E9DFCC","#CFC2AB","#AEACA0");
  screenFace(ctx,camera,mx,my+md+0.005,mw,mz,mh,isOnline,Math.floor(t*1.7+index)%2);
  const led=iso({x:mx+mw-0.07,y:my+md+0.01},camera,mz+5);
  ctx.fillStyle=isOnline?"#75E7A8":"#7A6668";
  ctx.fillRect(led.x-1*z,led.y-1*z,3*z,3*z);

  // Teclado em cima do tampo. Sem texturas nem logos de sistemas operacionais.
  const keyX=p.x+0.15,keyY=p.y+0.38;
  polygon(ctx,[
    iso({x:keyX,y:keyY},camera,35),iso({x:keyX+0.42,y:keyY},camera,35),
    iso({x:keyX+0.42,y:keyY+0.12},camera,35),iso({x:keyX,y:keyY+0.12},camera,35)
  ],"#DDCEB4","#847F78");
  for(let k=0;k<5;k++){
    const dot=iso({x:keyX+0.05+k*0.073,y:keyY+0.065},camera,35.8);
    ctx.fillStyle="#8A8175";ctx.fillRect(dot.x-1*z,dot.y-1*z,2*z,2*z);
  }

  // Silhueta de cadeira de escritório: rodízios, suporte, encosto e assento.
  const cx=p.x+0.35,cy=p.y+0.87;
  const base=iso({x:cx,y:cy},camera,4);
  const left=iso({x:cx-0.25,y:cy},camera,2);
  const right=iso({x:cx+0.25,y:cy},camera,2);
  ctx.strokeStyle="#27374C";ctx.lineWidth=3.5*z;
  ctx.beginPath();ctx.moveTo(left.x,left.y);ctx.lineTo(base.x,base.y);
  ctx.lineTo(right.x,right.y);ctx.stroke();
  for(const foot of [left,right]){
    ctx.beginPath();ctx.ellipse(foot.x,foot.y,2.8*z,2*z,0,0,Math.PI*2);
    ctx.fillStyle="#1F2B3B";ctx.fill();
  }
  const seat=iso({x:cx,y:cy},camera,25);
  ctx.beginPath();ctx.moveTo(base.x,base.y);ctx.lineTo(seat.x,seat.y);
  ctx.strokeStyle="#35435A";ctx.lineWidth=4*z;ctx.stroke();
  // Plano vertical amplo; melhora leitura também em resolução pequena.
  const by=cy+0.19;
  polygon(ctx,[
    iso({x:cx-0.26,y:by},camera,55),iso({x:cx+0.26,y:by},camera,55),
    iso({x:cx+0.26,y:by},camera,28),iso({x:cx-0.26,y:by},camera,28)
  ],"#506985","#263A55");
  polygon(ctx,[
    iso({x:cx-0.20,y:by+0.006},camera,49),
    iso({x:cx+0.20,y:by+0.006},camera,49),
    iso({x:cx+0.20,y:by+0.006},camera,35),
    iso({x:cx-0.20,y:by+0.006},camera,35)
  ],"#657D97");
  ctx.fillStyle="#3B506C";ctx.beginPath();
  ctx.ellipse(seat.x,seat.y,19*z,9*z,0,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle="#27394F";ctx.lineWidth=1.5*z;ctx.stroke();
  if(!occupied){
    for(const side of [-1,1]){
      const arm=iso({x:cx+side*0.25,y:cy-0.04},camera,30);
      ctx.beginPath();ctx.ellipse(arm.x,arm.y,5*z,3*z,0,0,Math.PI*2);
      ctx.fillStyle="#516987";ctx.fill();
    }
  }
}
