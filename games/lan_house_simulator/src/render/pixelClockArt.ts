import {iso,type Projection} from "./isometric.js";
import {DAY_MINUTES,OPEN_HOUR,type Point} from "../sim/types.js";

/** Uses the game's official 10:00–22:00 day cycle. Pure: no RNG or save state. */
export function pixelClockDisplay(totalMinutes:number):string{
 if(!Number.isFinite(totalMinutes)||totalMinutes<0)return "--:--";
 const minute=OPEN_HOUR*60+(Math.floor(totalMinutes)%DAY_MINUTES);
 return String(Math.floor(minute/60)).padStart(2,"0")+":"+String(minute%60).padStart(2,"0");
}
export function pixelClockBrightness(totalMinutes:number):"day"|"closing"{
 if(!Number.isFinite(totalMinutes)||totalMinutes<0)return "closing";
 return Math.floor(totalMinutes)%DAY_MINUTES>=660?"closing":"day";
}
const digitBits=[63,6,91,79,102,109,125,7,127,111] as const;
const segments:readonly [number,number,number,number][]=[
 [3,0,12,3],[15,3,3,11],[15,17,3,11],[3,28,12,3],
 [0,17,3,11],[0,3,3,11],[3,14,12,3]
];
/** Animated wall decoration; draws on the existing Canvas with no DOM or extra sprite. */
export function drawPixelClock(ctx:CanvasRenderingContext2D,cam:Projection,p:Point,
 totalMinutes:number,seconds:number):void{
 const a=iso(p,cam,143),b=iso({x:p.x+1.32,y:p.y},cam,143),d=iso(p,cam,96);
 ctx.save();
 ctx.transform((b.x-a.x)/142,(b.y-a.y)/142,(d.x-a.x)/64,(d.y-a.y)/64,a.x,a.y);
 ctx.fillStyle="rgba(3,11,24,.35)";ctx.fillRect(4,5,142,64);
 ctx.fillStyle="#263b4a";ctx.fillRect(0,0,142,64);
 ctx.fillStyle="#5b7386";ctx.fillRect(2,2,138,60);
 ctx.fillStyle="#0a192a";ctx.fillRect(5,5,132,54);
 ctx.fillStyle="#112939";ctx.fillRect(8,8,126,48);
 ctx.fillStyle="#719caf";ctx.font="bold 8px Arial,sans-serif";
 ctx.fillText("LHS / PIXEL TIME",12,17);
 const bright=pixelClockBrightness(totalMinutes)==="day";
 const on=bright?"#7afbe4":"#508d90",off="#1b4150";
 const digits=pixelClockDisplay(totalMinutes).replace(":","");
 for(let k=0;k<4;k++){
  const x=[20,41,79,100][k]!;
  const n=Number(digits[k]),mask=Number.isInteger(n)?digitBits[n]??0:0;
  for(let bit=0;bit<7;bit++){
   const [sx,sy,sw,sh]=segments[bit]!;
   ctx.fillStyle=(mask&(1<<bit))?on:off;
   ctx.fillRect(x+sx,21+sy,sw,sh);
  }
 }
 const blink=Number.isFinite(seconds)?Math.floor(Math.max(0,seconds)*1.6)%2===0:true;
 ctx.fillStyle=blink?on:off;
 ctx.fillRect(68,29,4,4);ctx.fillRect(68,41,4,4);
 ctx.fillStyle=bright?"#d68dcb":"#795b78";
 ctx.fillRect(10,57,122,2);
 for(const x of [8,134])for(const y of [7,57]){
  ctx.fillStyle="#95a5ac";ctx.fillRect(x,y,2,2);
 }
 ctx.restore();
}
