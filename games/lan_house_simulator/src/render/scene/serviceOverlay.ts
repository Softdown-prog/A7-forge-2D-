import type {GameState} from "../../sim/types.js";
import type {ServiceAccessIssue} from "../../sim/serviceAccess.js";
import {cameraForGame,iso} from "../isometric.js";

  export function drawServiceAccessOverlay(ctx:CanvasRenderingContext2D,s:GameState,issues:readonly ServiceAccessIssue[],time:number):void{
    const cam=cameraForGame(s),z=cam.zoom;
    ctx.save();
    ctx.textAlign="center";ctx.textBaseline="middle";
    for(const [i,issue] of issues.entries()){
      const ground=iso(issue.point,cam,3);
      const at=iso(issue.point,cam,85);
      const pulse=1+Math.sin(time*3+i*1.7)*.09;
      ctx.lineWidth=Math.max(2,2.6*z);
      ctx.strokeStyle="#ffe4a6";
      ctx.fillStyle="rgba(184,60,47,.24)";
      ctx.beginPath();ctx.ellipse(ground.x,ground.y,23*z*pulse,12*z*pulse,0,0,Math.PI*2);
      ctx.fill();ctx.stroke();
      const label=issue.label.toUpperCase()+" · SEM PASSAGEM";
      const font=Math.max(10,Math.min(13,12*z));
      ctx.font="700 "+font+"px system-ui,sans-serif";
      const width=ctx.measureText(label).width+14;
      const x=Math.max(width/2+4,Math.min(1000-width/2-4,at.x));
      const y=Math.max(15,Math.min(590,at.y-(i%2)*14));
      ctx.fillStyle="rgba(89,30,28,.96)";
      ctx.fillRect(x-width/2,y-14,width,28);
      ctx.strokeStyle="#ffc58a";ctx.lineWidth=1.5;
      ctx.strokeRect(x-width/2,y-14,width,28);
      ctx.fillStyle="#fff0d9";
      ctx.fillText(label,x,y);
    }
    ctx.restore();
  }
