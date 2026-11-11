import type {WorkerMotion} from "../../workerMotion.js";

/** Maleta e chave de fenda: render exclusivo do técnico. */
export function drawTechnicianTool(ctx:CanvasRenderingContext2D,motion:WorkerMotion):void{
        const tip=motion.toolTip,grip=motion.nearHand;
        // Maleta aberta no chão: a mão esquerda sustenta enquanto a direita
        // gira a ferramenta. Evita desenhar um segundo PC sobre a estação.
        ctx.fillStyle="#394F53";ctx.strokeStyle="#263843";ctx.lineWidth=1.6;
        ctx.fillRect(15,-14,24,13);ctx.strokeRect(15,-14,24,13);
        ctx.fillStyle="#E0C27A";ctx.fillRect(17,-12,20,4);
        ctx.fillStyle="#879CA0";ctx.fillRect(18,-7,6,3);ctx.fillRect(27,-7,7,3);
        // Chave de fenda acompanha a oscilação do punho até a maleta.
        ctx.strokeStyle="#A9BDCB";ctx.lineWidth=2;
        ctx.beginPath();ctx.moveTo(grip.x,grip.y+4);ctx.lineTo(tip.x,tip.y);ctx.stroke();
        ctx.strokeStyle="#D7AF60";ctx.lineWidth=4;
        ctx.beginPath();ctx.moveTo(grip.x,grip.y+3);ctx.lineTo(grip.x+2,grip.y+10);ctx.stroke();
        ctx.fillStyle=motion.pulse>.2?"#F3CE7F":"#9CABAB";
        ctx.fillRect(34,-16,3,3);
        if(motion.pulse>.74){
          ctx.strokeStyle="#F3D17A";ctx.lineWidth=1.2;
          ctx.beginPath();ctx.moveTo(tip.x+2,tip.y-3);ctx.lineTo(tip.x+5,tip.y-6);ctx.stroke();
        }
}
