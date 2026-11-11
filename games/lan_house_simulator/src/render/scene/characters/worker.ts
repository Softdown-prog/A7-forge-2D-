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
import {drawCleanerTool} from "./cleanerTool.js";
import {drawTechnicianTool} from "./technicianTool.js";

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
      if(kind==="cleaner")drawCleanerTool(ctx,motion);else drawTechnicianTool(ctx,motion);
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
