/** Original PS2-era visual loops; display-only, never interactive gameplay.
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
 }else if(id==="batida-de-rua"){
  p(0,0,1,1,"#323269");p(0,.76,1,.24,"#695d92");
  for(let i=0;i<4;i++){
   p(.13+i*.20,.06,.165,.80,i%2?"#6477b3":"#4b629a");
   const y=(phase*.036+i*.19)%0.76;
   p(.15+i*.20,y,.12,.08,["#8affdb","#ffd58b","#eeaaff","#b5dafa"][i]!);
  }
  p(.10,.82,.80,.032,"#e7eee6");p(.14,.91,.22,.04,"#b6e4de");

  p(.55,.91,.23,.04,"#f4d79c");
 }else{
  // Ten yearly originals. Each shares the TV viewport but draws its own
  // distinctive environment and moving focal action.
  const palettes:Record<string,readonly [string,string,string]>={
   "pistas-da-montanha":["#406e8d","#9ac5d5","#fdb66c"],
   "templo-da-aurora":["#6a527b","#efcb8d","#a7e8d9"],
   "robos-da-fronteira":["#253c62","#5c8aaa","#85ecd3"],
   "misterio-do-farol":["#1c3d56","#6a94a5","#f6e1aa"],
   "lendas-do-vulcao":["#4f2941","#d27868","#ffcf8b"],
   "volei-na-praia":["#58aeb4","#f4cb8e","#9ae6e3"],
   "corrida-no-gelo":["#709eaf","#ddf6ff","#69dbe5"],
   "cidade-dos-inventores":["#625277","#c8a887","#f9d187"],
   "guardioes-do-oceano":["#106a84","#5db3ac","#bcf9e6"],
   "batidas-do-futuro":["#2d285c","#907ac4","#e899e7"]
  };
  const [dark,light,accent]=palettes[id]??["#25344d","#8ba9bd","#ffe3af"];
  p(0,0,1,1,dark);p(0,.12,1,.30,light);
  for(let i=0;i<7;i++)p(i*.16,.14+(i%3)*.05,.095,.13,i%2?"#446481":"#385772");
  p(0,.73,1,.27,"#253849");
  for(let i=0;i<5;i++)p(i*.23,.84,.10,.028,"#9cc4c9");
  const move=Math.sin(tick*.14)*.13,beat=Math.cos(tick*.19)*.08;
  if(id==="pistas-da-montanha"||id==="corrida-no-gelo"){
   p(0,.39,1,.57,id==="corrida-no-gelo"?"#92b7c6":"#5a6076");
   p(.47,.40,.06,.58,"#faf1cd");
   p(.20+move,.69,.35,.17,accent);p(.28+move,.62,.19,.08,"#d9f9f9");
   dot(.24+move,.83,"#192a3c",.07);dot(.46+move,.83,"#192a3c",.07);
   for(let i=0;i<4;i++)p(i*.28,.20,.15,.21,id==="corrida-no-gelo"?"#eaffff":"#628094");
  }else if(id==="templo-da-aurora"){
   p(.15,.29,.70,.50,"#cfb392");p(.12,.25,.76,.10,"#fce5ae");
   for(let i=0;i<5;i++)p(.18+i*.13,.31,.055,.40,"#6f6282");
   p(.43+move,.58,.14,.19,"#a6f0db");dot(.48+move,.50,"#ffeacc",.08);
  }else if(id==="robos-da-fronteira"){
   p(.12+move,.41,.22,.36,"#79ead9");p(.17+move,.33,.12,.14,"#e9f5e4");
   p(.66-move,.41,.22,.36,"#e6a4c6");p(.70-move,.33,.12,.14,"#f7f0d2");
   p(.20+move,.37,.045,.035,"#fff0ac");p(.74-move,.37,.045,.035,"#fff0ac");
   p(.36,.45+beat,.27,.06,"#f0db9a");
  }else if(id==="misterio-do-farol"){
   p(.46,.22,.11,.56,"#f2dcba");p(.44,.19,.15,.075,"#ffe2aa");
   p(.48,.12,.07,.10,"#223e5c");
   p(.50,.17,.50,.10,"#fff8c099");
   for(let i=0;i<5;i++)p(i*.23,.81+beat,.12,.025,"#d8f9ed");
   dot(.25+move,.69,"#fef6d1",.085);
  }else if(id==="lendas-do-vulcao"){
   p(.29,.27,.42,.51,"#714454");p(.41,.19,.18,.30,"#ff9564");
   for(let i=0;i<6;i++)dot((.15+i*.15+move*.4)%1,.42+(i%3)*.07,"#ffd48b",.046);
   p(.38+move,.62,.16,.14,"#a4c1c5");dot(.45+move,.55,"#fbecdd",.08);
  }else if(id==="volei-na-praia"){
   p(0,.39,1,.13,"#58b8c3");p(0,.52,1,.48,"#edd098");
   p(.49,.35,.025,.54,"#f7f9dc");p(.12,.39,.76,.022,"#f7f9dc");
   for(let i=0;i<5;i++)p(.12,.42+i*.065,.76,.012,"#fff8d2");
   dot(.30+move,.65,"#f59b82",.12);dot(.70-move,.65,"#a6edf1",.12);
   dot(.46+move,.28+beat,"#fff4d4",.09);
  }else if(id==="cidade-dos-inventores"){
   for(let i=0;i<5;i++)p(i*.23,.25,.12,.46,"#676382");
   for(const [x,y,size] of [[.24,.50,.18],[.56,.43,.15],[.44,.65,.13]] as const){
    dot(x+move*.15,y,accent,size);dot(x+size*.27+move*.15,y+size*.28,"#5a617d",size*.48);
   }
   dot(.45+move,.29,"#a6f5e9",.085);
  }else if(id==="guardioes-do-oceano"){
   p(0,.39,1,.58,"#276c82");
   for(let i=0;i<6;i++)dot((i*.21+phase*.002)%1,.18+(i%3)*.17,"#e1f9ef",.035);
   p(.22+move,.60,.54,.18,"#efcf9c");p(.30+move,.53,.29,.08,"#9ce3e6");
   for(let i=0;i<3;i++)dot(.35+i*.13+move,.64,"#b7fff2",.06);
   dot(.82-move,.50,"#f2e99e",.095);
  }else{
   // Batidas do Futuro: falling notes and a bright twin-speaker rhythm track.
   for(let i=0;i<4;i++){
    p(.10+i*.21,.09,.15,.74,i%2?"#8e9bc9":"#56618f");
    p(.12+i*.21,(phase*.031+i*.18)%0.74,.11,.085,["#aaffdf","#fff0b1","#f6aae9","#a9eafa"][i]!);
   }
   dot(.26+beat,.77,"#f9e6e0",.11);dot(.66-beat,.77,accent,.11);
  }
  // Two continuous HUD indicators, different from the stage palette.
  p(.04,.06,.40,.048,"#ffdc92");p(.57,.06,.38,.048,"#c6f2f5");
  dot(.86+beat*.4,.80,"#fff5be",.075);
 }
 // A gentle raster effect helps keep the visual style coherent across sets.
 p(0,.29,1,.012,"rgba(12,18,32,.10)");
 p(0,.61,1,.012,"rgba(12,18,32,.10)");
}
