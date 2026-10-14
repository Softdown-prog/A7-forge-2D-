/** Ilustração exclusiva da loja; a copiadora não faz parte da cena nem de suas colisões. */
export function drawDiscCopier(ctx:CanvasRenderingContext2D,width=320,height=180):void{
 ctx.save();ctx.scale(width/320,height/180);
 const polygon=(points:number[][],fill:string)=>{ctx.fillStyle=fill;ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x!,y!):ctx.moveTo(x!,y!));ctx.closePath();ctx.fill();};
 ctx.fillStyle="#e6ead6";ctx.fillRect(0,0,320,180);
 const glow=ctx.createRadialGradient(160,135,5,160,135,140);glow.addColorStop(0,"#b6c8a2");glow.addColorStop(1,"#e6ead6");ctx.fillStyle=glow;ctx.fillRect(0,0,320,180);
 ctx.fillStyle="#405d4230";ctx.beginPath();ctx.ellipse(166,158,76,13,0,0,Math.PI*2);ctx.fill();
 // Tampo, lateral sombreada e frente metálica com quatro gravadores ópticos.
 polygon([[116,28],[184,18],[220,37],[150,49]],"#f1eedc");
 polygon([[184,18],[220,37],[220,142],[184,159]],"#9caa92");
 polygon([[116,28],[184,18],[184,159],[116,149]],"#d2d6c0");
 ctx.strokeStyle="#637a62";ctx.lineWidth=1;ctx.strokeRect(119,30,62,117);
 ctx.fillStyle="#2b463a";ctx.fillRect(124,35,51,25);ctx.fillStyle="#97bf76";ctx.fillRect(129,40,41,10);
 ctx.fillStyle="#274332";ctx.font="bold 5px monospace";ctx.fillText("LHS COPY / READY",131,47);
 for(let i=0;i<3;i++){ctx.fillStyle=i===0?"#a9cf80":"#7c9176";ctx.beginPath();ctx.arc(132+i*12,55,1.8,0,Math.PI*2);ctx.fill();}
 for(let i=0;i<4;i++){
  const y=65+i*17;ctx.fillStyle="#889680";ctx.fillRect(123,y,54,15);ctx.fillStyle="#edecda";ctx.fillRect(125,y+1,50,12);
  ctx.fillStyle="#415e4b";ctx.fillRect(129,y+5,40,1);ctx.fillStyle="#a0ac90";ctx.fillRect(129,y+3,40,1);
  ctx.fillStyle="#607c53";ctx.fillRect(162,y+9,6,2);ctx.fillStyle="#b6d58d";ctx.fillRect(170,y+9,2,2);
  ctx.fillStyle="#788773";ctx.font="4px monospace";ctx.fillText(i===0?"MASTER":"WRITE 0"+i,129,y+11);
 }
 ctx.fillStyle="#789168";ctx.beginPath();ctx.arc(132,139,3,0,Math.PI*2);ctx.fill();ctx.fillStyle="#4d6a50";ctx.font="bold 5px monospace";ctx.fillText("CD + DVD",142,141);
 for(let i=0;i<6;i++){polygon([[192,59+i*5],[210,51+i*5],[210,53+i*5],[192,61+i*5]],"#74896f");}
 polygon([[119,149],[132,151],[132,155],[119,154]],"#3c5145");polygon([[170,158],[182,160],[182,164],[170,163]],"#3c5145");
 // Mídias e caixas deixam clara a função da máquina em tamanhos pequenos.
 polygon([[71,139],[104,132],[122,145],[87,155]],"#36584b");polygon([[71,139],[87,155],[87,162],[71,146]],"#294336");polygon([[87,155],[122,145],[122,152],[87,162]],"#7b9371");
 ctx.save();ctx.translate(86,121);ctx.scale(1,.6);const disc=ctx.createLinearGradient(-22,-22,22,22);
 disc.addColorStop(0,"#f1f2e2");disc.addColorStop(.25,"#9ac5b5");disc.addColorStop(.46,"#c2b4d5");disc.addColorStop(.62,"#f5e4ba");disc.addColorStop(1,"#94b9a5");
 ctx.fillStyle=disc;ctx.beginPath();ctx.arc(0,0,23,0,Math.PI*2);ctx.fill();ctx.strokeStyle="#6e9385";ctx.lineWidth=1;ctx.stroke();ctx.strokeStyle="#ecefdb";ctx.beginPath();ctx.arc(0,0,17,0,Math.PI*2);ctx.stroke();
 ctx.fillStyle="#e6ead6";ctx.beginPath();ctx.arc(0,0,5,0,Math.PI*2);ctx.fill();ctx.strokeStyle="#759c8b";ctx.stroke();ctx.restore();
 ctx.fillStyle="#314f3e";ctx.font="bold 9px monospace";ctx.fillText("COPIADORA",237,85);ctx.font="8px monospace";ctx.fillText("CD / DVD",237,99);
 ctx.fillStyle="#6f835d";ctx.font="7px monospace";ctx.fillText("DESDE 2001",237,116);
 ctx.restore();
}
