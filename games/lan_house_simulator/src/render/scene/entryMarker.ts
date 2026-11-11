import type {GameState} from "../../sim/types.js";
import {iso,polygon,type Projection} from "../isometric.js";
import {cosmeticAvailable} from "../../sim/premiumCosmetics.js";
import {yearFromMinutes} from "../../sim/historicalEconomy.js";
import {drawNeonOpenSign,neonOpenLit} from "../neonOpenArt.js";

/** Physical entrance threshold and optional illuminated welcome sign. */
  export function drawEntryMarker(ctx:CanvasRenderingContext2D,camera:Projection,s:GameState):void {
    // Somente limiar de entrada dentro do salão; não há rua, fachada externa ou chuva.
    const x=7.5,y=6,z=camera.zoom;
    // Doormat just inside the threshold: ribbed fibre, worn centre, no exterior.
    polygon(ctx,[
      iso({x:x-0.62,y:y-0.78},camera,.4),iso({x:x+0.62,y:y-0.78},camera,.4),
      iso({x:x+0.62,y:y-0.28},camera,.4),iso({x:x-0.62,y:y-0.28},camera,.4)
    ],"#6f5a48","#4e3f33");
    ctx.save();ctx.strokeStyle="rgba(214,190,150,.35)";ctx.lineWidth=Math.max(.7,1*z);
    for(let i=1;i<7;i++){const a=iso({x:x-0.62,y:y-0.78+i*.07},camera,.5),b=iso({x:x+0.62,y:y-0.78+i*.07},camera,.5);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}
    ctx.restore();
    polygon(ctx,[
      iso({x:x-0.45,y:y-0.24},camera),iso({x:x+0.45,y:y-0.24},camera),
      iso({x:x+0.45,y},camera),iso({x:x-0.45,y},camera)
    ],"#D8B98D","#856F62");
    const left=iso({x:x-0.45,y},camera),right=iso({x:x+0.45,y},camera);
    ctx.beginPath();ctx.moveTo(left.x,left.y);ctx.lineTo(right.x,right.y);
    ctx.strokeStyle="#FFF0BC";ctx.lineWidth=4*camera.zoom;ctx.stroke();
    const mid=iso({x,y:y-0.45},camera);
    polygon(ctx,[{x:mid.x-10,y:mid.y+5},{x:mid.x+10,y:mid.y+5},
      {x:mid.x,y:mid.y-6}],"#F1D49B");
    // Placa premium montada sobre a entrada: nenhuma colisão ou espaço extra.
    if(cosmeticAvailable("neon-open-sign",yearFromMinutes(s.totalMinutes)))
      drawNeonOpenSign(ctx,camera,{x,y:y-.37},s.totalMinutes*.1,neonOpenLit(s.totalMinutes));
  }
