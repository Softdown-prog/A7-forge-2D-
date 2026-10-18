import type {Ps1DiscId} from "../sim/ps1.js";

/** Uma tela CRT de 2002 usa desenhos procedurais minúsculos, sem sprites,
 * áudio ou trabalho assíncrono. Unidades normalizadas 0..1: independem do zoom. */
export type Ps1ScreenTile={x:number;y:number;w:number;h:number;color:string};
export type Ps1ScreenScene={discId:Ps1DiscId;background:string;tiles:Ps1ScreenTile[]};

/** Passos discretos (6 Hz) dão movimento arcade, e não exigem 60 atualizações. */
export function ps1ScreenScene(discId:Ps1DiscId,seconds:number):Ps1ScreenScene{
 const t=Number.isFinite(seconds)?Math.max(0,seconds):0;
 const tick=Math.floor(t*6);
 const phase=tick%12;
 const tiles:Ps1ScreenTile[]=[];
 const put=(x:number,y:number,w:number,h:number,color:string)=>{
  const left=Math.max(0,Math.min(1,x)),top=Math.max(0,Math.min(1,y));
  const right=Math.max(left,Math.min(1,x+w)),bottom=Math.max(top,Math.min(1,y+h));
  if(right>left&&bottom>top)tiles.push({x:left,y:top,w:right-left,h:bottom-top,color});
 };
 const blink=(tick%6)<3;
 const block=(x:number,y:number,color:string)=>{
  put(x,y,.14,.13,color);put(x+.025,y+.017,.055,.021,"#f5ffff");
  put(x+.11,y+.023,.026,.10,"#263a56");
 };
 switch(discId){
 case "turbo-circuito":{
  // Horizonte, pista em perspectiva, faixas móveis e carros adversários.
  put(0,0,1,.38,"#408bc7");
  put(.03,.17,.15,.13,"#8ed6e5");put(.66,.08,.22,.12,"#e3dd9f");
  put(0,.34,1,.12,"#50758c");put(0,.43,1,.57,"#277469");
  for(let j=0;j<6;j++){
   const y=.39+j*.105;
   put(.25-j*.039,y,.5+j*.078,.12,j%2?"#303e4d":"#344653");
  }
  for(let j=0;j<4;j++){
   const y=.42+((j*.26+tick*.065)%.59);
   put(.49,y,.025,Math.min(.105,1-y),"#ffeb97");
  }
  const opponentY=.43+(tick%22)/22*.30;
  put(.34,opponentY,.12,.10,"#ffe57e");
  put(.35,opponentY+.07,.02,.032,"#172735");
  put(.43,opponentY+.07,.02,.032,"#172735");
  const wiggle=(phase<6?phase:12-phase)*.009;
  put(.52+wiggle,.77,.27,.19,"#eb5942");
  put(.56+wiggle,.79,.18,.055,"#9eebeb");
  put(.54+wiggle,.93,.045,.06,"#181c33");
  put(.75+wiggle,.93,.045,.06,"#181c33");
  put(.62+wiggle,.98,.07,.02,"#fff3c7");
  break;
 }
 case "gol-de-rua":{
  // Quadra urbana, duas camisas e bola alternando passes/chutes.
  put(0,0,1,1,"#2d995c");
  put(.04,.06,.92,.05,"#d4eccb");put(.04,.89,.92,.045,"#d4eccb");
  put(.04,.06,.025,.87,"#d4eccb");put(.93,.06,.026,.87,"#d4eccb");
  put(.07,.46,.86,.024,"#b2dcc3");
  put(.3,.06,.4,.18,"#6cd6cb");put(.36,.1,.28,.04,"#f2ffff");
  put(.37,.18,.024,.1,"#eef9f3");put(.61,.18,.025,.1,"#eef9f3");
  put(.35,.26,.3,.023,"#effff1");
  const run=(tick%18)/18;
  put(.25+Math.sin(t*2)*.075,.50,.16,.21,"#fbdd58");
  put(.28+Math.sin(t*2)*.075,.46,.09,.08,"#d69f74");
  put(.66-run*.18,.31,.14,.19,"#4aaaff");
  put(.69-run*.18,.28,.08,.06,"#ebbd91");
  const ballX=.37+run*.34,ballY=.77-run*.49;
  put(ballX,ballY,.11,.095,"#f9f6ea");
  put(ballX+.04,ballY+.02,.034,.034,"#283346");
  if(run>.7&&blink)put(.47,.07,.09,.08,"#fef9b1");
  break;
 }
 case "ilha-dos-cristais":{
  // Plataforma mística: cristais cintilam e o explorador salta.
  put(0,0,1,.62,"#274f83");
  put(.08,.13,.045,.055,"#c2f4ff");put(.78,.19,.04,.045,"#91ecfa");
  put(.13,.38,.23,.21,"#3b6289");
  put(.55,.31,.38,.29,"#3b6289");
  put(0,.66,1,.34,"#1a514b");
  put(0,.66,1,.07,"#63ad96");
  put(.18,.45,.25,.07,"#83c0b3");
  put(.64,.35,.27,.07,"#85c1bd");
  for(const [x,y] of [[.31,.30],[.66,.15],[.78,.52]]){
   put(x,y,.09,.18,blink?"#cdb4ff":"#79dce6");
   put(x+.03,y-.06,.03,.07,"#effaff");
   put(x+.024,y+.06,.027,.055,"#567cb3");
  }
  const heroX=.08+phase*.053,heroY=phase>=4&&phase<=7?.37:.49;
  put(heroX,heroY,.11,.18,"#f8d292");
  put(heroX+.02,heroY+.04,.06,.049,"#2e475e");
  put(heroX+.019,heroY-.046,.082,.057,"#355549");
  if(blink)put(.88,.18,.046,.059,"#fff4b2");
  break;
 }
 case "luta-neon":{
  // Arena, dois lutadores, golpes e barras de energia que oscilam.
  put(0,0,1,.67,"#311d63");put(0,.67,1,.33,"#252c4b");
  put(0,.62,1,.045,"#dc4cab");
  for(let i=0;i<5;i++)put(i*.24,.71,.12,.02,"#7059a2");
  put(.05,.08,.41,.076,"#131a39");
  put(.54,.08,.41,.076,"#131a39");
  put(.06,.09,.34-(tick%12)*.008,.048,"#45e7ef");
  put(.59,.09,.35-(tick%15)*.007,.048,"#ec54b8");
  const attack=phase>=5&&phase<=8;
  const lead=attack?.075:0;
  put(.20+lead,.41,.17,.30,"#3391bb");put(.24+lead,.35,.10,.11,"#a5f2f4");
  put(.17+lead,.71,.073,.17,"#2b6685");put(.35+lead,.71,.072,.17,"#2b6685");
  put(.62-lead,.41,.18,.30,"#b448ad");put(.65-lead,.35,.11,.11,"#fcc1db");
  put(.64-lead,.71,.07,.17,"#68246d");put(.79-lead,.71,.07,.17,"#68246d");
  put(.32+lead,.46,.13+lead,.078,"#61e9ff");
  put(.50-lead,.46,.14+lead,.078,"#f666cb");
  if(attack){
   put(.47,.40,.08,.20,"#fff0c5");
   put(.435,.47,.15,.06,"#fff0c5");
  }
  break;
 }
 case "cosmo-blocos":{
  // Tabuleiro de combinação: peças caem e o fundo gira entre estrelas.
  put(0,0,1,1,"#1d2858");
  put(.04,.16,.92,.76,"#101f40");
  put(.09,.2,.82,.036,"#7791bb");
  const colors=["#6edfc2","#ea7baa","#ffcf74","#9d87f3","#70baf1"];
  for(let row=0;row<4;row++)for(let col=0;col<5;col++){
   if((col===2&&row===0)||(col===4&&row<2))continue;
   const color=colors[(col*2+row+Math.floor(t/4))%colors.length];
   block(.095+col*.164,.82-row*.143,color);
  }
  const drop=(tick%14)/14;
  block(.423,.24+drop*.28,colors[(Math.floor(t/2)+2)%colors.length]);
  put(.09,.16,.13,.06,"#dff7fa");
  put(.76,.16,.13,.06,blink?"#ffeb9c":"#bd9eea");
  break;
 }
 }
 return {discId,background:"#142a36",tiles};
}
