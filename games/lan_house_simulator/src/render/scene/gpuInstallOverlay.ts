import type {GameState} from "../../sim/types.js";
import {pcPosition} from "../../sim/engine.js";
import {gpuGameInstallPausedReason} from "../../sim/gpuGames.js";
import {iso,type Projection} from "../isometric.js";

  export function drawGpuInstallMarkers(ctx:CanvasRenderingContext2D,s:GameState,camera:Projection,elapsedSeconds:number):void{
    if(!s.gpuGameInstallJobs?.length)return;
    ctx.save();ctx.textAlign="center";ctx.textBaseline="middle";
    for(const job of s.gpuGameInstallJobs){
      const pc=pcPosition(job.pc,s),at=iso({x:pc.x+.40,y:pc.y+.28},camera,92);
      const w=Math.max(27,42*camera.zoom),h=Math.max(4,5*camera.zoom);
      const x=at.x-w/2,y=at.y-15*camera.zoom,pct=job.elapsedMinutes/job.durationMinutes;
      const paused=!!gpuGameInstallPausedReason(s,job.pc);
      ctx.fillStyle="rgba(15,27,35,.92)";
      ctx.fillRect(x-3,y-18*camera.zoom,w+6,18*camera.zoom+h+6);
      ctx.fillStyle=paused?"#f6b96e":"#dbf7ea";
      ctx.font="bold "+Math.max(9,10*camera.zoom)+"px system-ui,sans-serif";
      ctx.fillText(paused?"PAUSA":Math.floor(pct*100)+"%",at.x,y-8*camera.zoom);
      ctx.fillStyle="#4c5a60";ctx.fillRect(x,y,w,h);
      ctx.fillStyle=paused?"#dd9754":"#69d5a4";ctx.fillRect(x,y,w*pct,h);
      if(!paused&&pct>0){
        ctx.save();ctx.beginPath();ctx.rect(x,y,w*pct,h);ctx.clip();
        const shine=x+(elapsedSeconds*15%(w+12))-12;
        ctx.fillStyle="rgba(244,255,252,.5)";ctx.fillRect(shine,y,5,h);
        ctx.restore();
      }
    }
    ctx.restore();
  }
