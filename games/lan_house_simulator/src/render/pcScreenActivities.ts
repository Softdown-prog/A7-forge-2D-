/** Microcenas para telas CRT/LCD dos computadores: nenhum asset, vídeo,
 * requisição de rede ou aleatoriedade por quadro. O visitante escolhe um
 * visual por sessão (ID do cliente + estação), com transição discreta. */
import type {GameState} from "../sim/types.js";
export type PcScreenActivity="game"|"video"|"browser"|"chat"|"music"|"editor"|"lan";
export type PcScreenPixel=(x:number,y:number,w:number,h:number,color:string)=>void;
const early:readonly PcScreenActivity[]=["game","browser","chat","editor","music"];
const late:readonly PcScreenActivity[]=["game","video","browser","chat","music","editor"];
const clip=(n:number)=>Math.max(0,Math.min(1,n));
/** Seleção determinística: cliente fixo = atividade fixa até sair da estação.
 * Video online só aparece em 2005+ (telas na década de 1990 continuam coerentes). */
export function pcActivityForSession(customerId:number,pcIndex:number,year:number):PcScreenActivity{
 const pool=year>=2005?late:early;
 const id=Number.isSafeInteger(customerId)?Math.max(0,customerId):0;
 const pc=Number.isSafeInteger(pcIndex)?Math.max(0,pcIndex):0;
 // multiplicação modular em 32 bits sem alterar o gerador RNG da simulação
 const hash=Math.imul(id+17,2654435761)^Math.imul(pc+11,1597334677);
 return pool[(hash>>>0)%pool.length]!;
}
/** Escolhe a atividade REAL da estação, não uma cena paralela de vídeo.
 * Os PCs dos participantes mostram a mesma partida tática em rede local.
 */
export function pcActivityForStation(s:GameState,pc:number,year:number):PcScreenActivity|null{
 const customer=s.customers.find(c=>c.pcIndex===pc&&c.stage==="using");
 if(!customer)return null;
 if(customer.multiplayerVisitId!==undefined&&
    s.multiplayerVisit?.id===customer.multiplayerVisitId&&
    s.multiplayerVisit.startedMinute!==undefined)return "lan";
 return pcActivityForSession(customer.id,pc,year);
}
export function pcScreenFrame(seconds:number):number{
 return Math.floor(Math.max(0,Number.isFinite(seconds)?seconds:0)*2.5);
}
/** Desenha somente dentro das coordenadas normalizadas da superfície 0..1.
 * O pixel callback projeta essa superfície no monitor isométrico.
 * 2,5 atualizações/segundo, detalhes constantes; sem timers/eventos/DOM. */
export function drawPcScreenActivity(
 pixel:PcScreenPixel,activity:PcScreenActivity,frame:number
):void{
 const t=Number.isFinite(frame)?Math.max(0,Math.floor(frame)):0;
 const r=(x:number,y:number,w:number,h:number,color:string)=>{
  const x0=clip(x),y0=clip(y),x1=clip(x+w),y1=clip(y+h);
  if(x1>x0&&y1>y0)pixel(x0,y0,x1-x0,y1-y0,color);
 };
 const shift=(t%16)/16,beat=t%8;
 if(activity==="lan"){
  // Setor Zero: microcena tática original e sincronizada entre monitores.
  // É atividade visual de um mesmo jogo em rede, não um FPS independente.
  r(0,0,1,1,"#152834");r(0,0,1,.16,"#254355");
  r(.05,.045,.30,.055,"#a3d6d5");r(.67,.045,.26,.055,"#d7bd89");
  r(.04,.21,.92,.69,"#344f56");
  // Grade do mapa vista de cima, com corredores, obstáculos e caixas.
  for(let i=0;i<5;i++)r(.10+i*.18,.21,.012,.65,"#405f63");
  for(let i=0;i<4;i++)r(.05,.28+i*.18,.88,.012,"#405f63");
  r(.17,.32,.22,.14,"#8b816e");r(.62,.59,.22,.13,"#827d6b");
  r(.44,.29,.11,.20,"#737d79");r(.45,.68,.10,.15,"#797a69");
  // Duas equipes que avançam e trocam posições no MESMO mapa.
  const mx=Math.sin(t*.24)*.13,my=Math.cos(t*.18)*.09;
  r(.25+mx,.52+my,.085,.11,"#7fd0c5");
  r(.273+mx,.54+my,.035,.044,"#d9f3db");
  r(.70-mx,.42-my,.085,.11,"#e4a279");
  r(.722-mx,.44-my,.035,.044,"#f5d6aa");
  // Tiros curtos e indicador de placar: nunca desenhar fora da tela.
  if(t%8<4)r(.37+mx,.55+my,.18,.018,"#e7d58b");
  else r(.57-mx,.48-my,.12,.018,"#e7a88d");
  r(.05,.93,.36,.035,"#6aaeb9");r(.59,.93,.36,.035,"#bf866f");
  r(.44,.93,.12,.034,"#f5ead0");
 }else if(activity==="game"){
  // Jogo de plataforma: nuvens, obstáculos e protagonista pulando.
  r(0,0,1,1,"#163451");r(0,.12,1,.62,"#316d93");
  r(.04,.16,.21,.045,"#d2ecf0");r(.70,.23,.24,.045,"#e4ecda");
  r(0,.73,1,.27,"#245c59");r(0,.70,1,.045,"#6ec7a0");
  for(let i=0;i<3;i++){
   const x=((i*.41-shift*.39+1)%1);
   r(x,.54,.11,.18,i%2?"#735aa2":"#5b7186");r(x-.025,.52,.16,.035,"#afd0a0");
  }
  const jump=(beat>=2&&beat<=5)?(beat===3||beat===4?.18:.10):0;
  r(.40,.56-jump,.12,.17,"#eea15f");r(.425,.50-jump,.07,.075,"#ffe6b4");
  r(.42,.73-jump,.035,.08,"#264e77");r(.49,.73-jump,.036,.08,"#264e77");
  r(.80-shift*.15,.48,.075,.11,"#f7d06e");
  r(.07,.065,.28,.045,"#f9e8b2");r(.08,.125,.16,.024,"#f6b768");
 }else if(activity==="video"){
  // Janela de vídeo: barra de reprodução, movimento de cena e controles.
  r(0,0,1,1,"#1b283d");r(.03,.035,.94,.095,"#344e68");
  r(.08,.067,.26,.025,"#b9d8e2");r(.78,.063,.12,.035,"#d79e9e");
  r(.07,.17,.86,.60,"#102838");
  r(.07,.17,.86,.22,"#497b94");r(.07,.39,.86,.38,"#305861");
  const light=.13+Math.sin(t*.45)*.09;
  r(.63,.22,.18,.16,"#e0b37f");
  r(.10,.51,.83,.26,"#27475b");
  r(.30+light,.41,.19,.29,"#b67a76");
  r(.34+light,.35,.12,.12,"#efc8a7");
  r(.55-light*.4,.44,.16,.26,"#6da5ad");
  r(.57-light*.4,.38,.12,.10,"#e9bea5");
  r(.10,.79,.80,.046,"#52606b");r(.10,.79,.08+shift*.68,.046,"#e78389");
  r(.10,.86,.07,.07,"#d7e7e6");
  r(.22,.88,.32,.025,"#aec4cd");r(.78,.87,.10,.043,"#a7d1d1");
 }else if(activity==="browser"){
  // Navegador com abas, campo de busca, scroll e blocos de conteúdo.
  r(0,0,1,1,"#e0e7d7");r(0,0,1,.16,"#35596a");
  r(.04,.03,.23,.075,"#a9c9cc");r(.30,.035,.19,.068,"#4c8092");
  r(.03,.17,.94,.105,"#f3f1de");r(.14,.195,.66,.052,"#a5c4c4");
  r(.03,.30,.94,.63,"#e8e6d7");
  r(.08,.34,.84,.20,"#83b4b3");r(.12,.365,.24,.11,"#c9dbce");
  r(.43,.365,.40,.035,"#f5f4e8");r(.43,.42,.29,.027,"#f3f3e5");
  for(let i=0;i<3;i++){
   const y=.59+i*.11;
   r(.08,y,.19,.08,["#d49f8e","#8caeae","#b8a9d0"][i]!);
   r(.32,y+.015,.50-.04*(i%2),.024,"#6a8986");
   r(.32,y+.052,.35,.019,"#bdc8bd");
  }
  r(.955,.32,.018,.58,"#bdc9c1");r(.955,.32+shift*.43,.018,.14,"#7c9c9a");
  r(.78,.84,.07,.035,beat%2?"#8dac97":"#66999d");
 }else if(activity==="chat"){
  // Mensageiro e contato online: bolhas de conversa e cursor piscando.
  r(0,0,1,1,"#e1e8dc");r(0,0,1,.14,"#397567");
  r(.045,.04,.16,.067,"#b1d8c9");r(.28,.055,.30,.027,"#e1e8d9");
  r(.04,.17,.27,.79,"#c8d6ca");r(.08,.22,.17,.11,"#6fa9a2");
  for(let i=0;i<4;i++){
   r(.08,.37+i*.13,.17,.08,i===((t>>3)%4)?"#8fa4ce":"#a8c5b7");
  }
  r(.34,.17,.62,.65,"#f6f4e8");
  r(.40,.25,.35,.085,"#adcfcb");
  r(.53,.39,.38,.085,"#89c1ad");
  r(.40,.53,.27,.085,"#b7d1d0");
  if(beat>=3)r(.58,.66,.34,.076,"#91c5af");
  r(.34,.84,.62,.12,"#d6e3d6");r(.38,.88,.37,.026,"#769696");
  if(beat%2===0)r(.76,.87,.012,.046,"#366869");
 }else if(activity==="music"){
  // Player de música com equalizador pulsante.
  r(0,0,1,1,"#131e34");r(0,0,1,.14,"#283b59");
  r(.07,.052,.40,.04,"#c0bddc");r(.08,.21,.35,.37,"#5c4d87");
  r(.12,.25,.27,.28,"#ae79b9");r(.20,.32,.11,.12,"#f2bfce");
  r(.50,.23,.39,.045,"#d3e0d9");r(.50,.31,.27,.028,"#879cb3");
  for(let i=0;i<9;i++){
   const h=.08+((i*7+t*3)%11)/11*.34;
   r(.09+i*.095,.82-h,.056,h,i%3===0?"#f1a3d5":i%3===1?"#8adada":"#b39de7");
  }
  r(.13,.87,.73,.032,"#496a7a");r(.13,.87,(beat+2)/12*.73,.032,"#8fded0");
  r(.47,.91,.06,.056,"#e3eff0");r(.31,.92,.06,.04,"#96b5c4");r(.62,.92,.06,.04,"#96b5c4");
 }else{
  // Editor de texto/código: digitação, linhas e painéis.
  r(0,0,1,1,"#182b38");r(0,0,1,.13,"#406073");
  r(.04,.055,.12,.031,"#9ed4cb");r(.23,.055,.25,.031,"#d3d3b8");
  r(.04,.18,.19,.70,"#264454");
  for(let i=0;i<5;i++)r(.07,.21+i*.125,.12,.035,i%2?"#699f96":"#7c8aa1");
  r(.27,.18,.69,.70,"#152a37");
  for(let i=0;i<8;i++){
   const len=.23+((i*5+3)%7)*.064;
   r(.30,.215+i*.075,.06,.026,"#577989");
   r(.39,.215+i*.075,len,.026,
    ["#91cfbb","#deba80","#8cb6cf","#c2a2d3"][i%4]!);
  }
  const row=(t>>2)%8;
  r(.39+Math.min(shift*.35,.29),.215+row*.075,.015,.038,"#f4e9cf");
  r(.28,.91,.64,.033,"#3e5e6b");
 }
 // Discreta varredura que mantém a linguagem de tubo de época.
 r(0,.49,1,.011,"rgba(10,25,36,.10)");
}