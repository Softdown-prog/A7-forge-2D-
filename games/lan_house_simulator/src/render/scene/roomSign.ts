import {SCENE_THEME as theme} from "../theme.js";
import type {Projection} from "../isometric.js";

/** Branding plate painted after scene lighting, above depth-sorted furniture. */
  export function drawRoomSign(ctx:CanvasRenderingContext2D,camera:Projection,w:number):void {
    // Plaqueta de marca na área vazia do fundo: não cobre quadros nem clientes.
    const x=28,y=28,label=w>8?"SALÃO AMPLIADO":"PRIMEIRAS CONEXÕES";
    ctx.save();
    // Terminal plate: soft drop shadow, rounded corners, brushed gradient and a bevel.
    // Soft drop shadow from stacked translucent plates: shadowBlur is avoided on purpose,
    // this plate is repainted every frame and blur is costly on low-end Android.
    for(const [grow,drop,alpha] of [[5,6,.07],[3,5,.09],[1,3,.14]] as const){
      ctx.fillStyle="rgba(0,0,0,"+alpha+")";ctx.beginPath();ctx.roundRect(x-grow,y+drop-grow,210+grow*2,50+grow*2,6+grow);ctx.fill();
    }
    const plate=ctx.createLinearGradient(x,y,x,y+50);
    plate.addColorStop(0,"rgba(34,60,54,0.94)");plate.addColorStop(1,"rgba(22,40,37,0.94)");
    ctx.fillStyle=plate;ctx.beginPath();ctx.roundRect(x,y,210,50,6);ctx.fill();
    ctx.strokeStyle="#5e7b52";ctx.lineWidth=1;ctx.beginPath();ctx.roundRect(x+.5,y+.5,209,49,6);ctx.stroke();
    ctx.strokeStyle="rgba(255,255,255,.08)";ctx.beginPath();ctx.moveTo(x+6,y+1.5);ctx.lineTo(x+204,y+1.5);ctx.stroke();
    ctx.fillStyle=theme.mint;ctx.fillRect(x+13,y+14,9,9);
    ctx.fillStyle=theme.amber;ctx.fillRect(x+20,y+22,4,4);
    ctx.fillStyle="rgba(185,215,163,.35)";ctx.fillRect(x+13,y+42,184,1);
    ctx.font="bold 17px Trebuchet MS, sans-serif";ctx.fillStyle=theme.paper;
    ctx.fillText("LAN HOUSE",x+35,y+24);
    ctx.font="bold 9px Courier New, monospace";ctx.fillStyle=theme.mint;
    ctx.fillText(label,x+35,y+39);
    ctx.restore();
    void camera;
  }
