import type {GameState} from "../../sim/types.js";
import {cameraForGame,iso} from "../isometric.js";
import {annexComputerSlots,availableAnnexComputers} from "../../sim/stations.js";
import {pcCount} from "../../sim/simulationState.js";
import {drawRetroComputer} from "../retroComputer.js";

/** Annex purchase ghost and vacancy markers, with no edits to GameState. */
  export function drawAnnexPcCandidates(ctx:CanvasRenderingContext2D,s:GameState,hovered:string|null):void{
    const cam=cameraForGame(s),available=new Set(availableAnnexComputers(s).map(x=>x.id));
    ctx.save();
    for(const slot of annexComputerSlots(s)){
      const p=iso({x:slot.position.x+0.35,y:slot.position.y+0.55},cam,4);
      const free=available.has(slot.id),selected=hovered===slot.id;
      ctx.beginPath();ctx.ellipse(p.x,p.y,19*cam.zoom,11*cam.zoom,0,0,Math.PI*2);
      ctx.fillStyle=!free?"rgba(183,75,70,.78)":selected?"rgba(114,233,162,.98)":"rgba(73,160,130,.80)";
      ctx.fill();
      ctx.strokeStyle="#f6efdc";ctx.lineWidth=selected?3:1.3;ctx.stroke();
      if(selected&&free){ctx.globalAlpha=.66;
        drawRetroComputer(ctx,cam,slot.position,pcCount(s),1,true,s);
        ctx.globalAlpha=1;
      }
    }
    ctx.restore();
  }
