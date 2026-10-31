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
  p(0,0,1,1,"#245077");p(0,.12,1,.23,"#6099b4");
  for(let i=0;i<6;i++){p(i*.19,.11,.14,.24,i%2?"#406a83":"#315672");p(i*.19+.05,.16,.035,.05,"#ffd78b");}
  p(0,.34,1,.66,"#555e73");p(.42,.34,.17,.66,"#6d7185");
  for(let i=0;i<4;i++)p(.493,(i*.31+phase*.025)%1,.018,.12,"#fdf1c4");
  const carX=.19+Math.sin(tick*.13)*.14;
  p(carX,.72,.26,.15,"#ff755e");p(carX+.05,.67,.16,.07,"#bdf4f1");
  p(carX+.03,.85,.055,.09,"#252e3b");p(carX+.19,.85,.055,.09,"#252e3b");
 }else if(id==="arena-dos-guardioes"){
  p(0,0,1,1,"#1c394e");p(0,.12,1,.48,"#527a94");p(0,.62,1,.38,"#354b64");
  for(let i=0;i<5;i++)p(i*.22,.16,.035,.46,"#92d6dc");
  const push=Math.sin(tick*.18)*.10;
  p(.20+push,.36,.16,.31,"#77f0de");p(.235+push,.27,.08,.13,"#d5e3d0");
  p(.66-push,.35,.15,.32,"#ef78c8");p(.69-push,.26,.09,.12,"#f4d7d7");
  if(phase%12<5){p(.43,.43,.10,.14,"#fff0a5");p(.47,.36,.03,.29,"#d3f9ef");}
  p(.04,.06,.43,.055,"#5fd5c8");p(.54,.06,.43,.055,"#e77eae");
 }else if(id==="futsal-de-bairro"){
  p(0,0,1,1,"#347c58");
  for(let i=0;i<5;i++)p(0,i*.21,1,.10,"#48a573");
  p(.04,.12,.92,.023,"#f4ead8");p(.04,.86,.92,.023,"#f4ead8");
  p(.04,.12,.025,.76,"#f4ead8");p(.94,.12,.025,.76,"#f4ead8");
  p(.48,.12,.025,.76,"#f4ead8");p(.35,.47,.29,.022,"#f4ead8");
  const move=Math.sin(tick*.15)*.16;
  dot(.29+move,.48,"#ffe58f",.12);dot(.71-move,.36,"#8ddcf5",.12);
  dot(.49+Math.sin(tick*.2)*.22,.45+Math.cos(tick*.17)*.19,"#ffffff",.065);
 }else if(id==="cosmos-2006"){
  p(0,0,1,1,"#192757");p(0,.50,1,.5,"#3c5a9a");
  for(let i=0;i<9;i++)dot((i*.137+phase*.003)%1,(i*.271)%1,"#d4ebfa",.019);
  p(.12,.78,.76,.13,"#5476ae");
  const ship=.38+Math.sin(tick*.12)*.22;
  p(ship,.62,.20,.13,"#a1f4f0");p(ship+.07,.52,.06,.12,"#f5fff1");
  p(ship+.035,.76,.048,.11,"#e7b779");p(ship+.12,.76,.048,.11,"#e7b779");
  p((phase*.025)%1,.17,.08,.10,"#ff9aab");
 }else{
  p(0,0,1,1,"#323269");p(0,.76,1,.24,"#695d92");
  for(let i=0;i<4;i++){
   p(.13+i*.20,.06,.165,.80,i%2?"#6477b3":"#4b629a");
   const y=(phase*.036+i*.19)%0.76;
   p(.15+i*.20,y,.12,.08,["#8affdb","#ffd58b","#eeaaff","#b5dafa"][i]!);
  }
  p(.10,.82,.80,.032,"#e7eee6");p(.14,.91,.22,.04,"#b6e4de");
  p(.55,.91,.23,.04,"#f4d79c");
 }
 // A gentle raster effect helps keep the visual style coherent across sets.
 p(0,.29,1,.012,"rgba(12,18,32,.10)");
 p(0,.61,1,.012,"rgba(12,18,32,.10)");
}
