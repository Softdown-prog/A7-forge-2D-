import type {Point} from "../../sim/types.js";
import {binStatus} from "../../sim/services.js";
import {iso,type Projection} from "../isometric.js";

  export function drawTrashBin(ctx:CanvasRenderingContext2D,camera:Projection,p:Point,fill:number):void{
    const loc=iso(p,camera),z=camera.zoom;
    const status=binStatus(fill);
    ctx.save();ctx.translate(loc.x,loc.y);ctx.lineJoin="round";
    // Sombra no chão, corpo estável (mesma âncora da projeção usada nos móveis).
    ctx.fillStyle="rgba(19,30,36,.32)";
    ctx.beginPath();ctx.ellipse(0,3*z,12*z,5*z,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle="#426F68";ctx.strokeStyle="#1A3D3F";ctx.lineWidth=1.8*z;
    ctx.beginPath();ctx.moveTo(-10*z,-21*z);ctx.lineTo(10*z,-21*z);
    ctx.lineTo(8*z,0);ctx.lineTo(-8*z,0);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.fillStyle="#90BBAA";ctx.beginPath();ctx.ellipse(0,-21*z,10*z,3.5*z,0,0,Math.PI*2);ctx.fill();
    if(status==="empty"){
      // Boca aberta, fundo escuro visível: lixeira efetivamente vazia.
      ctx.fillStyle="#1B3437";ctx.beginPath();ctx.ellipse(0,-21*z,7.5*z,2.2*z,0,0,Math.PI*2);ctx.fill();
    }else{
      // Nível cresce dentro do recipiente, com indicador frontal legível.
      const amount=Math.min(1,Math.max(0,fill/100));
      ctx.fillStyle="#A58E69";
      ctx.beginPath();ctx.ellipse(0,-20*z,7.4*z,2.4*z,0,0,Math.PI*2);ctx.fill();
      ctx.fillStyle=status==="full"?"#D28C4B":"#B0C28B";
      ctx.fillRect(-7*z,-15*z,14*z*amount,4*z);
      if(status==="full"){
        // Lixeira cheia: sacos visíveis acima da tampa, marca clara de lotação.
        ctx.fillStyle="#645F52";
        ctx.beginPath();ctx.ellipse(-4*z,-26*z,5*z,5*z,-.24,0,Math.PI*2);ctx.fill();
        ctx.fillStyle="#97866C";
        ctx.beginPath();ctx.ellipse(4*z,-27*z,5*z,5.5*z,.28,0,Math.PI*2);ctx.fill();
        ctx.strokeStyle="#CBB77D";ctx.lineWidth=1.1*z;
        ctx.beginPath();ctx.moveTo(0,-31*z);ctx.lineTo(2*z,-33*z);ctx.stroke();
        ctx.fillStyle="#E6B45A";ctx.fillRect(-9*z,-23*z,18*z,3*z);
      }
    }
    ctx.restore();
  }
