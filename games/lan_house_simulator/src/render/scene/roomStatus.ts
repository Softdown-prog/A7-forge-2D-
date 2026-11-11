import type {GameState} from "../../sim/types.js";
import {pcCount} from "../../sim/simulationState.js";
import {SCENE_THEME as theme} from "../theme.js";

/** Internal room status plate (not part of the global HUD). */
  export function drawRoomStatus(ctx:CanvasRenderingContext2D,s:GameState):void {
    ctx.save();
    for(const [grow,drop,alpha] of [[4,4,.07],[2,3,.1]] as const){
      ctx.fillStyle="rgba(0,0,0,"+alpha+")";ctx.beginPath();ctx.roundRect(18-grow,558+drop-grow,310+grow*2,29+grow*2,5+grow);ctx.fill();
    }
    ctx.fillStyle="rgba(25,46,42,.9)";ctx.beginPath();ctx.roundRect(18,558,310,29,5);ctx.fill();
    ctx.strokeStyle="rgba(94,123,82,.8)";ctx.lineWidth=1;ctx.beginPath();ctx.roundRect(18.5,558.5,309,28,5);ctx.stroke();
    ctx.fillStyle=theme.mint;ctx.fillRect(29,571,5,5);
    ctx.fillStyle="rgba(185,215,163,.35)";ctx.fillRect(28,570,7,7);ctx.fillStyle=theme.mint;ctx.fillRect(29,571,5,5);
    ctx.fillStyle=theme.paper;ctx.font="bold 10px Courier New, monospace";
    ctx.fillText(pcCount(s)+" ESTAÇÕES  /  "+s.customers.length+" CLIENTES",44,576);ctx.restore();
  }
