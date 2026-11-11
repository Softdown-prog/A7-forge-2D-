import type {ActorContext} from "../actorArt.js";

/** Fone com arco anatômico, conchas separadas e microfone articulado.
 * Em perspectiva de costas e perfil preserva os mesmos pontos de ancoragem. */
export function drawNeonHeadset(ctx:ActorContext,headX:number,
 headY:number,_back:boolean,sideways:boolean,time:number):void{
 ctx.save();ctx.translate(headX,headY);
 // Proporções calibradas para não engolir a cabeça de um ator em zoom alto.
 ctx.scale(.80,.82);
 const glow=.55+.45*Math.sin(time*2.5),cyan="#63f4ef",pink="#f18be3";
 const cup=(x:number,y:number,width=7.2,height=11.4)=>{
  ctx.save();ctx.shadowColor=cyan;ctx.shadowBlur=4*glow;
  ctx.beginPath();ctx.ellipse(x,y,width+2.3,height+2.2,0,0,Math.PI*2);
  ctx.fillStyle="#0c1924";ctx.fill();ctx.shadowBlur=0;
  ctx.lineWidth=1.7;ctx.strokeStyle="#697c8c";ctx.stroke();
  const grad=ctx.createLinearGradient(x-8,y-10,x+8,y+10);
  grad.addColorStop(0,"#5d7082");grad.addColorStop(.35,"#1b2b3c");
  grad.addColorStop(.8,"#0c1725");grad.addColorStop(1,"#4f6575");
  ctx.beginPath();ctx.ellipse(x,y,width,height,0,0,Math.PI*2);ctx.fillStyle=grad;ctx.fill();
  ctx.lineWidth=2.4;ctx.strokeStyle=glow>.7?cyan:pink;ctx.stroke();
  ctx.beginPath();ctx.ellipse(x-1,y-1,width*.48,height*.51,0,0,Math.PI*2);
  ctx.fillStyle="#18394a";ctx.fill();
  ctx.beginPath();ctx.moveTo(x-3,y-2);ctx.lineTo(x,y-5);ctx.lineTo(x+3,y-2);ctx.lineTo(x,y+3);
  ctx.closePath();ctx.fillStyle=pink;ctx.fill();
  ctx.beginPath();ctx.ellipse(x-2,y-5,width*.23,height*.13,-.3,0,Math.PI*2);
  ctx.fillStyle="rgba(235,254,255,.8)";ctx.fill();
  ctx.restore();
 };
 // Banda dupla curvada acima da cabeça, com almofada interna.
 ctx.save();ctx.lineCap="round";
 ctx.beginPath();ctx.moveTo(-14,0);ctx.bezierCurveTo(-16,-25,-9,-31,0,-31);
 ctx.bezierCurveTo(10,-32,16,-23,14,0);
 ctx.lineWidth=7.4;ctx.strokeStyle="#081724";ctx.stroke();
 ctx.beginPath();ctx.moveTo(-14,0);ctx.bezierCurveTo(-16,-25,-9,-31,0,-31);
 ctx.bezierCurveTo(10,-32,16,-23,14,0);
 ctx.lineWidth=3;ctx.strokeStyle="#8496a6";ctx.stroke();
 ctx.beginPath();ctx.moveTo(-10,-18);ctx.quadraticCurveTo(0,-29,10,-18);
 ctx.strokeStyle=glow>.7?cyan:pink;ctx.lineWidth=1.9;ctx.stroke();
 ctx.beginPath();ctx.moveTo(-6,-26);ctx.quadraticCurveTo(0,-29,6,-26);
 ctx.strokeStyle="#b9c7d5";ctx.lineWidth=3.2;ctx.stroke();
 ctx.restore();
 if(sideways){cup(12,1,7.5,11.8);cup(-11,0,3.4,8.5);}
 else {cup(-13,1);cup(13,1);}
 // Haste de microfone, conector e espuma redonda.
 const origin=sideways?14:-13,dir=sideways?1:-1;
 ctx.beginPath();ctx.moveTo(origin,8);ctx.quadraticCurveTo(origin+dir*2,18,origin+dir*12,19);
 ctx.strokeStyle="#243847";ctx.lineWidth=3.5;ctx.stroke();
 ctx.beginPath();ctx.moveTo(origin,8);ctx.quadraticCurveTo(origin+dir*2,18,origin+dir*12,19);
 ctx.strokeStyle="#8797a9";ctx.lineWidth=1.35;ctx.stroke();
 ctx.beginPath();ctx.ellipse(origin+dir*13,19,4.5,3,0,0,Math.PI*2);
 ctx.fillStyle="#15283b";ctx.fill();ctx.strokeStyle=pink;ctx.lineWidth=1.2;ctx.stroke();
 ctx.restore();
}
