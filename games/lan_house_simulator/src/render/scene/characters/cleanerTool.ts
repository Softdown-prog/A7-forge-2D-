import type {WorkerMotion} from "../../workerMotion.js";

/** Vassoura e cerdas: render exclusivo do faxineiro, sem interferir no técnico. */
export function drawCleanerTool(ctx:CanvasRenderingContext2D,motion:WorkerMotion):void{
        const tip=motion.toolTip,grip=motion.nearHand;
        // Sombras curtas da vassoura no chão; cabeça em contato com os pés.
        ctx.strokeStyle="rgba(51,50,40,.2)";ctx.lineWidth=4;
        ctx.beginPath();ctx.moveTo(tip.x-13,tip.y+2);ctx.lineTo(tip.x+13,tip.y+2);ctx.stroke();
        // Cabo e anéis, alinhados aos dedos da mão superior e inferior.
        ctx.strokeStyle="#34444A";ctx.lineWidth=4;
        ctx.beginPath();ctx.moveTo(grip.x-1,grip.y-5);ctx.lineTo(tip.x,tip.y-2);ctx.stroke();
        ctx.strokeStyle="#A87E51";ctx.lineWidth=2.8;
        ctx.beginPath();ctx.moveTo(grip.x-1,grip.y-5);ctx.lineTo(tip.x,tip.y-2);ctx.stroke();
        ctx.fillStyle="#C0AC76";ctx.strokeStyle="#46544D";ctx.lineWidth=1.2;
        ctx.beginPath();ctx.moveTo(tip.x-12,tip.y-4);ctx.lineTo(tip.x+12,tip.y-4);
        ctx.lineTo(tip.x+15,tip.y+1);ctx.lineTo(tip.x-15,tip.y+1);
        ctx.closePath();ctx.fill();ctx.stroke();
        // Cerdas se curvam discretamente a cada passada.
        for(let b=-11;b<=11;b+=3){
          ctx.strokeStyle=b%2===0?"#9C8D66":"#DAC394";ctx.lineWidth=1.3;
          ctx.beginPath();ctx.moveTo(tip.x+b,tip.y);ctx.lineTo(tip.x+b+motion.pulse*2,tip.y+5);ctx.stroke();
        }
        if(Math.abs(motion.pulse)>.65){
          ctx.strokeStyle="rgba(187,177,139,.48)";ctx.lineWidth=1.5;
          for(let j=0;j<2;j++){
            ctx.beginPath();ctx.moveTo(tip.x-20-j*4,tip.y+3+j*2);
            ctx.lineTo(tip.x-25-j*4,tip.y+4+j*2);ctx.stroke();
          }
        }
}
