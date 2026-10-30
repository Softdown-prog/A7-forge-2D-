/** Five original PS2-era visual loops; display-only, never interactive gameplay.
 * Coordinates belong to the TV viewport [0,1], independent of zoom or FPS.
 */
import type {Ps2GameId} from "../sim/ps2.js";
import type {ScreenPixel} from "./ps1MiniGames.js";

const clip=(n:number)=>Math.max(0,Math.min(1,n));
export function ps2MiniGameTick(seconds:number):number{
 return Math.floor(Math.max(0,Number.isFinite(seconds)?seconds:0)*10);
}
export function drawPs2MiniGame(pixel:ScreenPixel,id:Ps2GameId,seconds:number):void{
 const tick=ps2MiniGameTick(seconds),phase=tick%48;
 const p=(x:number,y:number,w:number,h:number,color:string)=>{
  const left=clip(x),top=clip(y),right=clip(x+w),bottom=clip(y+h);
  if(right>left&&bottom>top)pixel(left,top,right-left,bottom-top,color);
 };
 const dot=(x:number,y:number,color:string,size=.065)=>p(x,y,size,size,color);
 if(id==="cidade-em-fuga"){
  p(0,0,1,1,"#172e49");p(0,.12,1,.23,"#3b6884");
  for(let i=0;i<6;i++){p(i*.19,.11,.14,.24,i%2?"#36566d":"#27465d");p(i*.19+.05,.16,.035,.05,"#e8bd79");}
  p(0,.34,1,.66,"#424858");p(.42,.34,.17,.66,"#565967");
  for(let i=0;i<4;i++)p(.493,(i*.31+phase*.025)%1,.018,.12,"#e8d7a1");
  const carX=.19+Math.sin(tick*.13)*.14;
  p(carX,.72,.26,.15,"#eb6356");p(carX+.05,.67,.16,.07,"#a7dde6");
  p(carX+.03,.85,.055,.09,"#252e3b");p(carX+.19,.85,.055,.09,"#252e3b");
 }else if(id==="arena-dos-guardioes"){
  p(0,0,1,1,"#192b3d");p(0,.12,1,.48,"#31506a");p(0,.62,1,.38,"#283747");
  for(let i=0;i<5;i++)p(i*.22,.16,.035,.46,"#76a5bc");
  const push=Math.sin(tick*.18)*.10;
  p(.20+push,.36,.16,.31,"#6ac5c4");p(.235+push,.27,.08,.13,"#d5e3d0");
  p(.66-push,.35,.15,.32,"#cd70b0");p(.69-push,.26,.09,.12,"#f4d7d7");
  if(phase%12<5){p(.43,.43,.10,.14,"#f3e6a8");p(.47,.36,.03,.29,"#d3f9ef");}
  p(.04,.06,.43,.055,"#5fd5c8");p(.54,.06,.43,.055,"#e77eae");
 }else if(id==="futsal-de-bairro"){
  p(0,0,1,1,"#317859");
  for(let i=0;i<5;i++)p(0,i*.21,1,.10,"#3b8862");
  p(.04,.12,.92,.023,"#f4ead8");p(.04,.86,.92,.023,"#f4ead8");
  p(.04,.12,.025,.76,"#f4ead8");p(.94,.12,.025,.76,"#f4ead8");
  p(.48,.12,.025,.76,"#f4ead8");p(.35,.47,.29,.022,"#f4ead8");
  const move=Math.sin(tick*.15)*.16;
  dot(.29+move,.48,"#ebdc86",.12);dot(.71-move,.36,"#77c6e5",.12);
  dot(.49+Math.sin(tick*.2)*.22,.45+Math.cos(tick*.17)*.19,"#faf6e9",.065);
 }else if(id==="cosmos-2006"){
  p(0,0,1,1,"#111c40");p(0,.50,1,.5,"#253765");
  for(let i=0;i<9;i++)dot((i*.137+phase*.003)%1,(i*.271)%1,"#d4ebfa",.019);
  p(.12,.78,.76,.13,"#344775");
  const ship=.38+Math.sin(tick*.12)*.22;
  p(ship,.62,.20,.13,"#8ac7e2");p(ship+.07,.52,.06,.12,"#e1e9e1");
  p(ship+.035,.76,.048,.11,"#e7b779");p(ship+.12,.76,.048,.11,"#e7b779");
  p((phase*.025)%1,.17,.08,.10,"#ed8693");
 }else{
  p(0,0,1,1,"#212449");p(0,.76,1,.24,"#46416a");
  for(let i=0;i<4;i++){
   p(.13+i*.20,.06,.165,.80,i%2?"#454f80":"#34436b");
   const y=(phase*.036+i*.19)%0.76;
   p(.15+i*.20,y,.12,.08,["#78dccb","#e9bd77","#d88acc","#8fbee8"][i]!);
  }
  p(.10,.82,.80,.032,"#e7eee6");p(.14,.91,.22,.04,"#b6e4de");
  p(.55,.91,.23,.04,"#f4d79c");
 }
 // A gentle raster effect helps keep the visual style coherent across sets.
 p(0,.29,1,.012,"rgba(12,18,32,.10)");
 p(0,.61,1,.012,"rgba(12,18,32,.10)");
}
