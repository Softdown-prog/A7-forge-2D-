import type {GameState} from "../../../sim/types.js";
import {pcPosition} from "../../../sim/engine.js";
import {binSpots,type RepairJob,type CleaningJob} from "../../../sim/services.js";
import {workPhaseLabel} from "../../../sim/staffPresentation.js";
import {technicianContactPoint} from "../../../sim/staffWorksites.js";
import type {MotionWorker} from "../../motion.js";
import {iso,type Projection} from "../../isometric.js";
import {drawActorSprite as drawActor} from "../../actorSprites.js";
import {workerMotion} from "../../workerMotion.js";
import {drawWorkContact} from "../../workEffects.js";

  export function drawSceneWorker(ctx:CanvasRenderingContext2D,camera:Projection,job:RepairJob|CleaningJob,time:number,
    kind:"technician"|"cleaner",progress:number,s:GameState):void{
    const z=camera.zoom,working=job.phase==="working";
    // Vincula visualmente o funcionário ao equipamento. As linhas e os círculos
    // são puramente gráficos: sem caminho fantasma ou mudança de posição.
    if(working){
      const target=kind==="cleaner"
       ?binSpots(s)[(job as CleaningJob).binIndex??0]
       :technicianContactPoint(pcPosition((job as RepairJob).pc,s));
      if(target){
        const floor=iso(target,camera,3),worker=iso({x:job.x,y:job.y},camera,2);
        ctx.save();
        ctx.strokeStyle=kind==="cleaner"?"rgba(154,219,171,.85)":"rgba(235,194,111,.82)";
        ctx.lineWidth=Math.max(1.3,1.8*z);
        ctx.setLineDash([5*z,4*z]);
        ctx.beginPath();ctx.moveTo(worker.x,worker.y);ctx.lineTo(floor.x,floor.y);ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle=kind==="cleaner"?"rgba(103,181,132,.13)":"rgba(239,190,99,.11)";
        ctx.beginPath();ctx.ellipse(floor.x,floor.y,16*z,9*z,0,0,Math.PI*2);
        ctx.fill();ctx.stroke();
        ctx.restore();
      }
    }
    const locomotion=(job as MotionWorker).renderMotion;
    const moving=locomotion?.moving??!!job.moving;
    drawActor(ctx,camera,{
      x:job.x,y:job.y,kind,id:kind==="cleaner"?-17:-19,
      time,pose:working?(kind==="cleaner"?"sweeping":"repairing"):moving?"walking":"idle",
      direction:job.facing??"north",
      // Workers now share the customers' ground-driven stride and isometric facing.
      // Work actions stay independent; an idle worker never walks in place.
      walkDistance:!working?locomotion?.distance:undefined,
      screenView:!working&&moving?locomotion?.view:undefined
    });
    const p=iso({x:job.x,y:job.y},camera);
    if(working){
      // Movimento de trabalho compartilhado com as mãos do personagem.
      // Mantém âncora, escala e espelhamento idênticos ao actorArt.
      const motion=workerMotion(kind==="cleaner"?"sweeping":"repairing",time);
      ctx.save();ctx.translate(p.x,p.y);
      ctx.scale(z*(job.facing==="west"?-1:1),z);
      ctx.lineCap="round";ctx.lineJoin="round";
      if(kind==="cleaner"){
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
      }else{
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
      ctx.restore();
      // O gesto da ferramenta responde no objeto trabalhado, além da pose do ator.
      // Calculado da posição real da máquina/lixeira; o render não afeta o save.
      const contact=kind==="cleaner"
        ?binSpots(s)[(job as CleaningJob).binIndex??0]
        :technicianContactPoint(pcPosition((job as RepairJob).pc,s));
      if(contact)drawWorkContact(ctx,camera,kind,contact,time);
      ctx.save();ctx.fillStyle="#142934";
      ctx.fillRect(p.x-22*z,p.y-107*z,44*z,7*z);
      ctx.fillStyle=kind==="technician"?"#E5BD59":"#8CC6B8";
      ctx.fillRect(p.x-21*z,p.y-106*z,42*z*Math.max(0,Math.min(1,progress)),5*z);
      ctx.restore();
    }
    // Etiqueta curta segue o personagem e reaproveita exatamente a fase do job.
    // Não altera a câmera, o deslocamento, a colisão ou o estado persistido.
    ctx.save();
    const caption=workPhaseLabel(kind,job).toUpperCase();
    const font=Math.max(9,10.5*z),pad=5;
    ctx.font="700 "+font+"px system-ui";
    const width=ctx.measureText(caption).width+pad*2;
    // Os dois profissionais chegam pela mesma porta; evitar etiquetas sobrepostas.
    const badgeY=p.y-(kind==="technician"?152:132)*z-font, badgeX=p.x-width/2;
    ctx.fillStyle="rgba(24,43,47,.92)";
    ctx.fillRect(badgeX,badgeY,width,font+8);
    ctx.fillStyle=working?(kind==="technician"?"#efcd82":"#b1e6da"):"#f6f0d9";
    ctx.textAlign="center";ctx.textBaseline="top";
    ctx.fillText(caption,p.x,badgeY+4);
    ctx.restore();
  }
