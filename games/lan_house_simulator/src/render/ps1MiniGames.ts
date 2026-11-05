import type {Ps1DiscId} from "../sim/ps1.js";

/** Desenha minijogos SOMENTE no visor isométrico do CRT. Cada jogo tem uma
 * identidade de cor e animação própria. Não são jogos interativos, nem vídeos:
 * são pequenas cenas vetoriais de custo constante por quadro. */
export type ScreenPixel=(x:number,y:number,width:number,height:number,color:string)=>void;
export type Ps1MiniGameFrame={disc:Ps1DiscId;tick:number;phase:number;accent:string};
const palette:Record<Ps1DiscId,string>={
 "turbo-circuito":"#f6b35c",
 "gol-de-rua":"#eff4d3",
 "ilha-dos-cristais":"#91eaf4",
 "luta-neon":"#ff78d0",
 "cosmo-blocos":"#b6a0ff",
 "rally-do-deserto":"#ffbd69",
 "sombras-do-castelo":"#b6b5f9",
 "defensores-do-espaco":"#70ddff",
 "selva-perdida":"#91f6a8",
 "dragoes-de-aco":"#f69d84",
 "ritmo-da-cidade":"#f6c8ff",
 "agentes-da-noite":"#a4e2f2",
 "oceano-profundo":"#75d9e9"
};
export function ps1MiniGameFrame(disc:Ps1DiscId,seconds:number):Ps1MiniGameFrame{
 const safe=Number.isFinite(seconds)?Math.max(0,seconds):0;
 const tick=Math.floor(safe*8);
 return {disc,tick,phase:tick%32,accent:palette[disc]};
}

/** Cenas de CRT originais para os oito jogos lançados depois do lote inicial.
 * Mantém geometria simples (sem animações por imagem, texturas ou requisições). */
function drawLaterPs1MiniGame(
 pixel:(x:number,y:number,w:number,h:number,c:string)=>void,disc:Ps1DiscId,t:number
):void{
 const r=pixel,phase=t%32;
 const dot=(x:number,y:number,c:string,size=.05)=>r(x,y,size,size,c);
 switch(disc){
 case "rally-do-deserto":{
  r(0,0,1,1,"#f2a96a");r(0,.28,1,.72,"#d98055");
  r(0,.37,.4,.14,"#f8d692");r(.57,.34,.43,.17,"#f4ca88");
  r(.33,.40,.35,.6,"#82565c");
  const d=(phase%8)*.07;
  r(.47,.4+d,.04,.07,"#ffeab8");r(.47,.77,.05,.19,"#ffeab8");
  r(.32+Math.sin(t*.25)*.12,.66,.25,.13,"#4a7497");
  r(.35+Math.sin(t*.25)*.12,.6,.19,.08,"#e4f8fa");
  r(.34+Math.sin(t*.25)*.12,.76,.045,.07,"#292f43");
  r(.52+Math.sin(t*.25)*.12,.76,.045,.07,"#292f43");break;
 }
 case "sombras-do-castelo":{
  r(0,0,1,1,"#222145");r(0,.69,1,.31,"#3c3349");
  dot(.74,.09,"#e7e9f4",.18);
  for(const x of [.07,.28,.54,.73]){
   r(x,.34,.18,.44,"#131c38");r(x-.02,.29,.22,.08,"#131c38");
   r(x+.05,.44,.05,.11,"#f4c67c");
  }
  const x=.16+(phase/32)*.57;
  r(x,.65,.08,.17,"#8ad5e1");r(x+.02,.59,.045,.06,"#f9e0ba");
  r(x-.03,.82,.14,.04,"#1d293f");break;
 }
 case "defensores-do-espaco":{
  r(0,0,1,1,"#101e4a");
  for(let i=0;i<13;i++)dot((i*29%89)/100,((i*19+t)%91)/100,"#d0f3ff",.015);
  const x=.42+Math.sin(t*.21)*.28;
  r(x,.71,.18,.12,"#6ce3f5");r(x+.055,.64,.075,.09,"#f8e7ae");
  r(x-.025,.81,.06,.12,"#ed85a5");r(x+.16,.81,.06,.12,"#ed85a5");
  for(let i=0;i<3;i++){
   const ey=.16+i*.17+(phase%6)*.01;
   r(.15+i*.26,ey,.15,.065,"#f88ba5");
  }
  r(x+.085,.36,.026,.2,"#f9f3a3");break;
 }
 case "selva-perdida":{
  r(0,0,1,1,"#163d43");r(.04,.12,.27,.73,"#32745b");
  r(.69,.12,.24,.74,"#275e51");
  for(let i=0;i<6;i++){
   r(i*.18,.04,.10,.28,i%2?"#327a57":"#41875b");
   r(i*.18+.02,.2,.05,.31,"#4c7149");
  }
  r(0,.72,1,.27,"#345d42");r(.36,.64,.35,.07,"#bb9162");
  const x=.34+Math.sin(t*.16)*.19;
  r(x,.59,.09,.12,"#f2c977");r(x+.01,.53,.06,.07,"#f5d7a8");
  r(x+.03,.71,.03,.14,"#353c45");break;
 }
 case "dragoes-de-aco":{
  r(0,0,1,1,"#342c58");r(0,.65,1,.35,"#5f4049");
  for(let i=0;i<5;i++)r(i*.24,.37+(i%3)*.09,.14,.45,"#263452");
  const x=.32+Math.sin(t*.12)*.06;
  r(x,.38,.35,.19,"#bd8c94");r(x+.26,.27,.18,.14,"#efbd93");
  r(x+.38,.3,.055,.05,"#f7e9a2");
  r(x-.17,.37,.29,.11,"#8cc3c8");r(x+.18,.46,.11,.25,"#6a9ab5");
  r(x+.02,.52,.06,.21,"#59677f");r(.02,.79,.96,.05,"#e99788");
  break;
 }
 case "ritmo-da-cidade":{
  r(0,0,1,1,"#241d4b");r(0,.76,1,.24,"#472a5a");
  for(let i=0;i<11;i++){
   const h=.1+Math.abs(Math.sin(t*.17+i*.73))*.45;
   r(.06+i*.08,.68-h,.055,h,i%2===0?"#ef76bd":"#7ad7f6");
  }
  dot(.41,.18,"#ffffff",.20);dot(.47,.24,"#2c2d58",.08);
  r(.39,.45,.22,.04,"#f9e3a1");
  for(let i=0;i<5;i++)dot(.12+i*.17,.85,"#b7a7f3",.035);
  break;
 }
 case "agentes-da-noite":{
  r(0,0,1,1,"#102437");r(0,.55,1,.45,"#1b3644");
  for(let i=0;i<7;i++){
   r(i*.16,.31+(i%3)*.09,.12,.56,"#182d40");
   for(let j=0;j<3;j++)dot(i*.16+.025,.42+j*.12,"#fbd17a",.02);
  }
  r(.26,.78,.54,.06,"#365369");
  const x=.12+phase/32*.64;
  r(x,.61,.07,.2,"#85b6c0");r(x+.01,.56,.06,.07,"#bfd3d0");
  r(x-.03,.81,.12,.045,"#0b192d");break;
 }
 case "oceano-profundo":{
  r(0,0,1,1,"#0a3658");r(0,.75,1,.25,"#15445a");
  for(let i=0;i<11;i++)dot(((i*19)%93)/100,((t+i*12)%93)/100,"#95edeb",.025);
  const x=.24+Math.sin(t*.11)*.13,y=.43+Math.cos(t*.12)*.12;
  r(x,y,.45,.19,"#e9bc69");r(x+.35,y+.04,.13,.12,"#bce5dc");
  r(x+.11,y+.04,.07,.07,"#204c66");r(x+.21,y+.04,.07,.07,"#204c66");
  r(x+.2,y-.07,.05,.09,"#e9bc69");
  for(let i=0;i<3;i++){
   const fx=.12+i*.31,fy=.34+i*.13;
   r(fx,fy,.065,.038,"#95e8dc");r(fx+.05,fy-.018,.04,.07,"#95e8dc");
  }break;
 }
 default:r(0,0,1,1,"#192445");
 }
}

const between=(n:number,a=0,b=1)=>Math.max(a,Math.min(b,n));
/** Recorta cada retângulo à área 0..1 do visor antes da projeção 2.5D. */
export function drawPs1MiniGame(pixel:ScreenPixel,disc:Ps1DiscId,seconds:number):void{
 const f=ps1MiniGameFrame(disc,seconds),t=f.tick,phase=f.phase;
 const r=(x:number,y:number,w:number,h:number,color:string)=>{
  const x0=between(x),y0=between(y),x1=between(x+w),y1=between(y+h);
  if(x1>x0&&y1>y0)pixel(x0,y0,x1-x0,y1-y0,color);
 };
 const dot=(x:number,y:number,color:string,size=.07)=>r(x,y,size,size,color);
 if(disc==="turbo-circuito"){
  // Perspectiva de uma estrada noturna e carro mudando de faixa.
  r(0,0,1,1,"#162942");r(0,.01,1,.24,"#28566a");
  r(0,.22,.27,.17,"#1a3549");r(.70,.20,.3,.19,"#152c41");
  r(0,.39,1,.61,"#243842");
  r(.12,.39,.76,.61,"#353c4b");
  r(.17,.39,.66,.04,"#f6b36a");
  r(.03,.40,.09,.60,"#28624f");r(.89,.40,.11,.60,"#2b6254");
  const stripeY=.42+(t%10)*.054;
  r(.46,stripeY,.07,.14,"#f6ebbb");r(.46,stripeY-.34,.07,.11,"#f6ebbb");
  const lane=Math.sin(t*.22)*.18,carX=between(.43+lane,.13,.73);
  const rivalY=.35+(phase/32)*.35;
  r(.64,rivalY,.13,.14,"#f5d783");r(.66,rivalY+.04,.09,.09,"#c64151");
  r(carX,.72,.25,.20,"#ee604e");
  r(carX+.038,.70,.17,.065,"#b0f6f6");r(carX+.04,.89,.05,.07,"#171e2c");
  r(carX+.175,.89,.05,.07,"#171e2c");r(carX+.05,.80,.15,.035,"#ffe1b0");
  r(.05,.06,.24,.045,"#fce4a8");r(.05,.12,.12,.035,"#f59960");
 }else if(disc==="gol-de-rua"){
  // Visão aérea de campo, dois jogadores, bola em movimento e gol.
  r(0,0,1,1,"#296a4d");
  for(let i=0;i<5;i++)r(0,i*.2,1,.095,i%2?"#327b51":"#439260");
  r(.07,.12,.035,.76,"#e8e8b8");r(.89,.12,.035,.76,"#e8e8b8");
  r(.08,.12,.84,.025,"#e5e9ce");r(.08,.865,.84,.025,"#e5e9ce");
  r(.48,.14,.025,.74,"#f0f4d8");r(.37,.46,.25,.032,"#f0f4d8");
  r(.32,.09,.36,.075,"#f2efe2");r(.36,.095,.28,.05,"#35575b");
  const shift=Math.sin(t*.21)*.17;
  dot(.30+shift,.49,"#f6d05d",.13);dot(.32+shift,.62,"#2b3551",.10);
  dot(.63-shift*.5,.28,"#79d2f9",.13);dot(.64-shift*.5,.4,"#25354a",.10);
  const ballX=.44+Math.sin(t*.34)*.27,ballY=.44+Math.cos(t*.25)*.16;
  dot(ballX,ballY,"#fffbf0",.083);dot(ballX+.027,ballY+.027,"#263645",.02);
  r(.12,.03,.19,.052,"#f8efbf");r(.66,.03,.21,.052,"#e0efff");
 }else if(disc==="ilha-dos-cristais"){
  // Plataforma mística com aventureiro saltando entre ruínas e gemas.
  r(0,0,1,1,"#222d63");r(0,.18,1,.40,"#385383");
  dot(.08,.13,"#caefff",.035);dot(.76,.09,"#d7efff",.04);
  r(.05,.70,.52,.28,"#26635b");r(.57,.66,.43,.32,"#24525f");
  r(.06,.67,.50,.055,"#70bba6");r(.57,.63,.43,.055,"#7fc4a2");
  r(.16,.39,.11,.28,"#263e5a");r(.19,.35,.07,.07,"#cbd9b5");
  r(.72,.35,.10,.28,"#334a64");r(.70,.32,.15,.06,"#ccd9c7");
  const crystalX=.60+Math.sin(t*.17)*.065;
  r(crystalX,.32,.095,.26,phase%8<4?"#b3a3fa":"#7aeaf9");
  r(crystalX+.026,.22,.043,.13,"#d3f9ff");
  const jump=Math.max(0,Math.sin(t*.28))*.13,walk=(phase/32)*.23;
  r(.21+walk,.57-jump,.083,.13,"#d4bc84");
  r(.20+walk,.53-jump,.11,.06,"#443b4c");
  r(.23+walk,.70-jump,.05,.06,"#222944");
  r(.07,.90,.17,.04,"#adead6");
 }else if(disc==="luta-neon"){
  // Arena com dois lutadores, esquiva e golpe com flash de impacto.
  r(0,0,1,1,"#291c4c");r(0,.15,1,.58,"#402658");
  for(let i=0;i<6;i++)r(i*.18,.09,.025,.54,i%2?"#ac4c9d":"#5fc4d2");
  r(0,.68,1,.32,"#272542");r(0,.68,1,.037,"#fa79bb");
  const move=Math.sin(t*.24)*.12,attack=phase%12<4;
  const blueX=.18+move,pinkX=.69-move;
  r(blueX,.38,.16,.30,"#5ad1e7");r(blueX+.035,.26,.10,.14,"#c9faff");
  r(blueX-.025,.54,.075,.09,"#357dba");
  r(blueX+.03,.67,.04,.15,"#24476d");r(blueX+.11,.67,.04,.15,"#24476d");
  r(pinkX,.36,.16,.32,"#db63b4");r(pinkX+.03,.25,.11,.14,"#ffe0ee");
  r(pinkX+.11,.49,.09,.075,"#a93c89");
  r(pinkX+.02,.68,.04,.15,"#572e71");r(pinkX+.11,.68,.04,.15,"#572e71");
  if(attack){r(.47,.37,.10,.13,"#fff7d4");r(.48,.31,.035,.26,"#aefafa");}
  r(.05,.065,.40,.05,"#61d9e6");r(.55,.065,.40,.05,"#e877bd");
  r(.05,.065,.22,.05,"#d1ffff");r(.70,.065,.25,.05,"#ffd9f2");
 }else if(disc==="cosmo-blocos"){
  // Cosmo Blocos: grade retro, peças caindo, próxima peça e linha cheia.
  r(0,0,1,1,"#171d48");r(.23,.07,.59,.89,"#263366");
  for(let i=0;i<=6;i++)r(.23+i*.098,.07,.012,.88,"#4b5688");
  for(let i=0;i<=8;i++)r(.23,.07+i*.11,.59,.012,"#4b5688");
  r(.24,.84,.18,.105,"#6bdbcf");r(.43,.84,.19,.105,"#f6bd6b");
  r(.63,.84,.17,.105,"#bc85f2");
  r(.33,.73,.1,.10,"#f395aa");r(.43,.73,.10,.10,"#f395aa");
  r(.54,.73,.10,.10,"#96dcd4");r(.64,.73,.10,.10,"#96dcd4");
  const drop=(phase/32)*.54;
  const blocks:[[number,number],[number,number],[number,number],[number,number]]=[
    [.45,drop],[.55,drop],[.45,drop+.10],[.35,drop+.10]
  ];
  for(const [x,y] of blocks)r(x,.09+y,.095,.098,phase%6===0?"#fdf2bf":"#bda3f8");
  r(.035,.15,.13,.05,"#9eecf4");r(.045,.24,.08,.08,"#f5ca87");
  r(.045,.35,.08,.08,"#f5ca87");r(.82,.11,.13,.05,"#f9df9c");
 }else{
  drawLaterPs1MiniGame(r,disc,t);
 }
 // Reflexos/linhas de varredura suaves, para manter a linguagem de CRT.
 r(0,.24,1,.014,"rgba(12,23,36,.13)");
 r(0,.53,1,.014,"rgba(12,23,36,.13)");
}
