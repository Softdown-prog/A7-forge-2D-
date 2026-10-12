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
  const top=iso({x:left,y},camera,z+height-5);
  const topRight=iso({x:right,y},camera,z+height-5);
  const bottomLeft=iso({x:left,y},camera,z+9);
  const bottomRight=iso({x:right,y},camera,z+9);
  // Interface de desktop fictícia, desenhada diretamente no mesmo plano do vidro CRT.
  // Usa coordenadas 0..1 para acompanhar a projeção 2:1 em qualquer tamanho de sala.
  const face=(u:number,v:number):Point=>({
    x:top.x+(topRight.x-top.x)*u+(bottomLeft.x-top.x)*v,
    y:top.y+(topRight.y-top.y)*u+(bottomLeft.y-top.y)*v
  });
  const panel=(u0:number,v0:number,u1:number,v1:number,color:string):void=>{
    polygon(ctx,[face(u0,v0),face(u1,v0),face(u1,v1),face(u0,v1)],color);
  };
  polygon(ctx,[top,topRight,bottomRight,bottomLeft],
    lit?(pulse?"#326A82":"#335D78"):"#434D5C","#495362");
  if(!lit) {
    panel(0.08,0.10,0.92,0.14,"#65717C");
    return;
  }
  // Barra superior, ícones e barra inferior: sugestão de software dos anos 1990,
  // sem desenhar logos de sistemas operacionais ou copiar interfaces.
  panel(0.04,0.05,0.96,0.20,"#7399BA");
  panel(0.04,0.85,0.96,0.96,"#A3B6BA");
  panel(0.08,0.86,0.30,0.95,"#527C77");
  for(let row=0;row<2;row++){
    for(let col=0;col<2;col++){
      const u=0.15+col*0.37,v=0.31+row*0.22;
      panel(u,v,u+0.17,v+0.10,row===0?"#E2D7AA":"#B2D8D8");
      panel(u+0.02,v+0.12,u+0.25,v+0.14,"#98BDCA");
    }
  }
  // Reflexo moderado do vidro curvo, evitando a aparência glossy.
  polygon(ctx,[face(0.72,0.20),face(0.88,0.20),
    face(0.64,0.83),face(0.55,0.83)],"rgba(222,243,244,0.12)");
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
  // Duas ranhuras no gabinete beige (leitor de disco e botão), sem microtexturas.
  for(const elevation of [49,46]){
    const slot=iso({x:p.x-0.045,y:p.y+0.403},camera,elevation);
    ctx.fillStyle="#827C73";ctx.fillRect(slot.x-4*z,slot.y,8*z,1.5*z);
  }

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

/** Overlay após o corpo: braços partem dos ombros e terminam fisicamente sobre o teclado.
 * A mesa é desenhada antes; a frente das mãos deve ser a última camada do ator sentado. */
export function drawSeatedKeyboardOverlay(ctx:CanvasRenderingContext2D,camera:Projection,
  p:Point,time:number,skin:string,sleeve:string,weight=1):void{
  const factor=Math.min(1,Math.max(0,weight));
  if(factor<=0)return;
  const z=camera.zoom,seat={x:p.x+0.35,y:p.y+0.82};
  ctx.save();ctx.globalAlpha=factor;ctx.lineCap="round";
  for(const side of [-1,1]){
    const shoulder=iso({x:seat.x+side*0.12,y:seat.y},camera,46);
    const elbow=iso({x:seat.x+side*0.16,y:seat.y-0.22},camera,39);
    const touch=iso({x:p.x+0.31+side*0.11,y:p.y+0.44},camera,36.5);
    const beat=Math.sin(time*7+side*1.3)*1.25*z;
    const key={x:touch.x,y:touch.y+beat};
    ctx.strokeStyle="#26344A";ctx.lineWidth=8*z;
    ctx.beginPath();ctx.moveTo(shoulder.x,shoulder.y);ctx.lineTo(elbow.x,elbow.y);
    ctx.lineTo(key.x,key.y);ctx.stroke();
    ctx.strokeStyle=sleeve;ctx.lineWidth=5.8*z;
    ctx.beginPath();ctx.moveTo(shoulder.x,shoulder.y);ctx.lineTo(elbow.x,elbow.y);
    ctx.stroke();
    ctx.strokeStyle=skin;ctx.lineWidth=4*z;
    ctx.beginPath();ctx.moveTo(elbow.x,elbow.y);ctx.lineTo(key.x,key.y);ctx.stroke();
    ctx.fillStyle=skin;ctx.beginPath();
    ctx.ellipse(key.x,key.y,3.6*z,2.5*z,0,0,Math.PI*2);ctx.fill();
  }
  ctx.restore();
}
