/** Original procedural PlayStation 2 covers for the 2006–2010 catalogue.
 * UI-only: the PS2 economy, save format and CRT gameplay are unchanged.
 * Canvas PNG is preferred; bundled SVG artwork is the offline/headless fallback.
 */
export interface Ps2CoverGame{
 readonly id:string;readonly title:string;readonly genre:string;readonly releaseYear?:number;
}
const W=420,H=560;
type Point=readonly [number,number];
type Theme={bg:string;mid:string;accent:string;glow:string;lines:readonly [string,string]};
const themes:Record<string,Theme>={
 "cidade-em-fuga":{bg:"#081a33",mid:"#206080",accent:"#ff8357",glow:"#ffd9a3",lines:["CIDADE EM","FUGA"]},
 "arena-dos-guardioes":{bg:"#1c1437",mid:"#65529c",accent:"#75e8da",glow:"#ffe0a5",lines:["ARENA DOS","GUARDIÕES"]},
 "futsal-de-bairro":{bg:"#0d3040",mid:"#238873",accent:"#f7d178",glow:"#f0ffda",lines:["FUTSAL DE","BAIRRO"]},
 "cosmos-2006":{bg:"#091b40",mid:"#425da5",accent:"#85dcff",glow:"#ffbd9b",lines:["COSMOS","2006"]},
 "batida-de-rua":{bg:"#21113a",mid:"#913973",accent:"#ffcb63",glow:"#92f1ff",lines:["BATIDA DE","RUA"]},
 "pistas-da-montanha":{bg:"#19324c",mid:"#4596b0",accent:"#ffc069",glow:"#d0fbff",lines:["PISTAS DA","MONTANHA"]},
 "templo-da-aurora":{bg:"#352347",mid:"#b16677",accent:"#f7da8a",glow:"#b6f8e3",lines:["TEMPLO DA","AURORA"]},
 "robos-da-fronteira":{bg:"#172943",mid:"#486ca2",accent:"#88f1d7",glow:"#f6b6a5",lines:["ROBÔS DA","FRONTEIRA"]},
 "misterio-do-farol":{bg:"#132841",mid:"#416b85",accent:"#ffe1a0",glow:"#c4f9ed",lines:["MISTÉRIO DO","FAROL"]},
 "lendas-do-vulcao":{bg:"#33203b",mid:"#b34a46",accent:"#ffd17d",glow:"#f0cac1",lines:["LENDAS DO","VULCÃO"]},
 "volei-na-praia":{bg:"#16526f",mid:"#56adad",accent:"#ffe59d",glow:"#dcfff5",lines:["VÔLEI NA","PRAIA"]},
 "corrida-no-gelo":{bg:"#16344f",mid:"#6eaabb",accent:"#e5f9ff",glow:"#ffe5a2",lines:["CORRIDA NO","GELO"]},
 "cidade-dos-inventores":{bg:"#322b51",mid:"#ae7c75",accent:"#ffdb8b",glow:"#b5ffff",lines:["CIDADE DOS","INVENTORES"]},
 "guardioes-do-oceano":{bg:"#082e50",mid:"#2a929f",accent:"#a2f5df",glow:"#f0e5a0",lines:["GUARDIÕES DO","OCEANO"]},
 "batidas-do-futuro":{bg:"#1b1848",mid:"#6446a6",accent:"#f9a5ed",glow:"#93f7f0",lines:["BATIDAS DO","FUTURO"]}
};
const cache=new Map<string,string>();
function polygon(c:CanvasRenderingContext2D,points:readonly Point[],color:string):void{
 c.fillStyle=color;c.beginPath();c.moveTo(...points[0]!);
 for(const p of points.slice(1))c.lineTo(...p);
 c.closePath();c.fill();
}
function stroke(c:CanvasRenderingContext2D,points:readonly Point[],color:string,width=3):void{
 c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.moveTo(...points[0]!);
 for(const p of points.slice(1))c.lineTo(...p);
 c.stroke();
}
function circle(c:CanvasRenderingContext2D,x:number,y:number,r:number,color:string):void{
 c.fillStyle=color;c.beginPath();c.arc(x,y,r,0,2*Math.PI);c.fill();
}
function paintCity(c:CanvasRenderingContext2D):void{
 circle(c,318,148,82,"#ffad85");
 // Skyscrapers, headlights and a high-speed getaway on wet asphalt.
 for(let i=0;i<11;i++){
  const x=i*43,top=150+(i*29)%112;
  c.fillStyle=i%2?"#102b48":"#194365";c.fillRect(x,top,42,295-top);
  for(let j=0;j<4;j++){c.fillStyle="#ffdf9f8a";c.fillRect(x+8,top+13+j*30,10,9);}
 }
 polygon(c,[[163,291],[264,291],[434,462],[-25,462]],"#1b2d48");
 stroke(c,[[160,292],[-20,458]],"#63c6da",8);
 stroke(c,[[264,292],[429,457]],"#68d7dc",8);
 for(let i=0;i<6;i++)stroke(c,[[208,310+i*24],[217,314+i*27]],"#fbe5ba",3+i);
 polygon(c,[[92,361],[133,329],[288,329],[335,363],[353,411],[66,411]],"#ed685e");
 polygon(c,[[143,339],[173,300],[257,300],[294,339]],"#a9e7e5");
 polygon(c,[[84,370],[147,370],[145,393],[78,393]],"#ffecb1");
 polygon(c,[[280,370],[339,370],[346,393],[275,393]],"#ffecb1");
 for(const x of [109,316])circle(c,x,410,25,"#112239");
}
function paintArena(c:CanvasRenderingContext2D):void{
 circle(c,315,152,83,"#e4b7ff");
 polygon(c,[[0,269],[72,228],[133,270],[214,203],[282,265],[359,208],[420,252],[420,454],[0,454]],"#34274b");
 for(let i=0;i<8;i++){
  const x=i*57;
  c.fillStyle=i%2?"#68d8d380":"#f9c78c88";c.fillRect(x,255+(i%3)*16,12,144);
 }
 polygon(c,[[0,388],[420,388],[420,463],[0,463]],"#262646");
 for(let i=0;i<8;i++)stroke(c,[[i*65,387],[210+(i*65-210)*2,464]],"#7ef0e980",3);
 // Two original armored guardians facing across the fighting ring.
 polygon(c,[[113,326],[148,274],[178,309],[194,383],[165,423],[92,411]],"#73e0d6");
 circle(c,145,262,25,"#d1f7f5");
 polygon(c,[[116,261],[130,231],[161,235],[175,263]],"#245c80");
 polygon(c,[[251,311],[287,264],[319,301],[341,405],[262,423],[232,378]],"#e58cbd");
 circle(c,287,252,25,"#ffe5c3");
 polygon(c,[[256,252],[279,218],[307,237],[322,260]],"#8a4593");
 stroke(c,[[181,330],[256,292]],"#ffdf99",12);
 stroke(c,[[191,324],[244,293]],"#ffffff",3);
}
function paintFutsal(c:CanvasRenderingContext2D):void{
 circle(c,320,138,80,"#ffe09a");
 for(let i=0;i<10;i++){
  const x=i*44,top=185+(i%3)*25;
  c.fillStyle=i%2?"#1a5056":"#1a414f";c.fillRect(x,top,44,190);
  for(let j=0;j<4;j++){c.fillStyle="#ffdf9190";c.fillRect(x+12,top+12+j*29,9,11);}
 }
 polygon(c,[[0,341],[420,309],[420,468],[0,468]],"#237957");
 for(let i=0;i<5;i++)stroke(c,[[0,364+i*22],[420,333+i*22]],"#bffac088",3);
 stroke(c,[[32,250],[170,233],[180,363],[32,384],[32,250]],"#edf4dc",7);
 for(let i=0;i<6;i++)stroke(c,[[32+i*25,248-i*3],[32+i*25,380-i*3]],"#e1f6db66",2);
 circle(c,280,356,76,"#f6f1df");
 polygon(c,[[282,311],[314,334],[300,372],[262,372],[245,335]],"#182e45");
 for(let i=0;i<5;i++){
  const a=i*2*Math.PI/5;
  stroke(c,[[282+Math.cos(a)*30,356+Math.sin(a)*30],[282+Math.cos(a)*63,356+Math.sin(a)*63]],"#17283b",8);
 }
 stroke(c,[[196,339],[146,304],[117,291]],"#ebedbc",5);
}
function paintCosmos(c:CanvasRenderingContext2D):void{
 circle(c,310,139,99,"#7b80c8");
 circle(c,301,133,65,"#9fb8e9");
 circle(c,317,113,22,"#eac9d0");
 for(let i=0;i<46;i++){
  const x=15+(i*83)%387,y=55+(i*47)%344;
  circle(c,x,y,1+(i%3)*.8,"#e1f8ff");
 }
 polygon(c,[[211,197],[249,290],[362,372],[257,357],[211,423],[163,357],[59,372],[176,290]],"#85d0e5");
 polygon(c,[[211,213],[232,312],[211,391],[190,312]],"#dbf7ff");
 polygon(c,[[154,352],[166,389],[156,445],[126,387]],"#ffb78b");
 polygon(c,[[267,352],[293,387],[267,445],[255,389]],"#ffb78b");
 stroke(c,[[211,208],[211,320]],"#f5f0c3",4);
 for(const [x,y] of [[74,234],[324,293],[101,382]] as const){
  polygon(c,[[x-29,y],[x,y-17],[x+30,y],[x,y+17]],"#ffb6c5");
  circle(c,x,y,6,"#fff5c9");
 }
}
function paintRhythm(c:CanvasRenderingContext2D):void{
 circle(c,314,140,89,"#ffa3ce");
 for(let i=0;i<14;i++){
  const x=7+i*31,h=47+(i*29)%151;
  c.fillStyle=i%3===0?"#80edee":i%3===1?"#ffe18b":"#f593c8";
  c.fillRect(x,391-h,21,h);
 }
 polygon(c,[[73,258],[347,258],[363,406],[57,406]],"#21264f");
 polygon(c,[[91,273],[330,273],[341,388],[81,388]],"#4f3d77");
 for(const x of [154,274]){
  circle(c,x,332,50,"#151c46");circle(c,x,332,38,"#81d8e2");
  circle(c,x,332,22,"#28204c");circle(c,x,332,9,"#e9c6fd");
 }
 stroke(c,[[194,292],[232,292]],"#fddda1",9);
 for(let i=0;i<11;i++)stroke(c,[[22+i*35,410],[39+i*35,424]],"#ffbe7e",3);
}

/** Every yearly release gets its own composition; the original five remain unchanged. */
function paintAnnual(c:CanvasRenderingContext2D,id:string):void{
 switch(id){
 case "pistas-da-montanha":{
  circle(c,326,137,67,"#ffe5ae");
  polygon(c,[[0,330],[92,156],[185,334],[278,137],[420,335],[420,462],[0,462]],"#607a8c");
  polygon(c,[[0,366],[104,231],[206,349],[312,237],[420,370],[420,460],[0,460]],"#39596a");
  polygon(c,[[172,247],[258,247],[420,461],[0,461]],"#383a4e");
  stroke(c,[[177,250],[0,462]],"#f8dca9",6);stroke(c,[[258,250],[418,462]],"#f8dca9",6);
  polygon(c,[[100,363],[139,328],[283,328],[331,371],[338,409],[86,409]],"#f9a958");
  polygon(c,[[149,333],[176,306],[260,306],[288,333]],"#d6f3e8");
  for(const x of [118,300])circle(c,x,410,21,"#192c3e");break;
 }
 case "templo-da-aurora":{
  circle(c,301,144,109,"#ffe4a5");
  polygon(c,[[0,339],[90,261],[142,312],[243,229],[336,310],[420,242],[420,469],[0,469]],"#6c5073");
  polygon(c,[[70,298],[214,202],[362,298]],"#f7dda0");
  c.fillStyle="#c8ac96";c.fillRect(87,298,257,153);
  for(const x of [103,161,219,277]){c.fillStyle="#6b607c";c.fillRect(x,296,28,139);
   c.fillStyle="#ffe5b4";c.fillRect(x-9,293,45,12);}
  polygon(c,[[188,451],[190,338],[242,338],[240,451]],"#4e4b65");
  for(let i=0;i<4;i++)stroke(c,[[0,447-i*18],[420,447-i*18]],"#edc99999",3);break;
 }
 case "robos-da-fronteira":{
  circle(c,325,143,76,"#a0c8ec");
  for(let i=0;i<10;i++){c.fillStyle=i%2?"#3a5671":"#2a4d6b";c.fillRect(i*46,215+(i%3)*19,43,194);}
  polygon(c,[[70,409],[96,276],[168,276],[200,409]],"#79d7d0");
  c.fillStyle="#d1f5ec";c.fillRect(105,249,59,61);c.fillStyle="#1e344d";c.fillRect(113,273,43,11);
  circle(c,128,280,5,"#f9d489");circle(c,148,280,5,"#f9d489");
  polygon(c,[[233,406],[254,239],[325,239],[352,406]],"#e3a6b1");
  c.fillStyle="#edd8c8";c.fillRect(254,214,71,56);c.fillStyle="#1d3e5a";c.fillRect(263,239,52,9);
  stroke(c,[[160,324],[255,295]],"#aaf8f1",9);stroke(c,[[168,319],[247,298]],"#ffffff",2);break;
 }
 case "misterio-do-farol":{
  circle(c,330,126,69,"#d6e6ec");
  polygon(c,[[0,364],[88,276],[177,328],[261,262],[420,358],[420,463],[0,463]],"#29465c");
  polygon(c,[[156,431],[185,198],[240,198],[272,431]],"#d7cbb1");
  c.fillStyle="#f9e2b8";c.fillRect(179,184,71,18);c.fillStyle="#26364d";c.fillRect(193,158,42,33);
  circle(c,211,180,18,"#ffe7ac");
  polygon(c,[[211,164],[420,73],[420,252],[214,198]],"#ffe6a855");
  polygon(c,[[0,389],[420,368],[420,466],[0,466]],"#27647a");
  for(let i=0;i<5;i++)stroke(c,[[i*99,406+i*7],[i*99+75,400+i*7]],"#8fe5e299",4);break;
 }
 case "lendas-do-vulcao":{
  circle(c,316,134,72,"#f5aa86");
  polygon(c,[[0,373],[96,294],[170,360],[235,196],[315,356],[420,280],[420,467],[0,467]],"#432942");
  polygon(c,[[176,356],[235,199],[301,363],[260,336],[238,297],[216,334]],"#ed674e");
  for(let i=0;i<7;i++)circle(c,181+i*25,209+(i*37)%126,3+i%3,"#ffd190");
  polygon(c,[[70,375],[147,281],[196,327],[226,393]],"#94758a");
  polygon(c,[[170,315],[228,253],[293,305],[367,275],[327,335],[249,356]],"#c7a1a4");
  circle(c,330,309,9,"#ffe7a7");break;
 }
 case "volei-na-praia":{
  circle(c,314,132,85,"#ffe7a3");
  polygon(c,[[0,285],[420,285],[420,341],[0,341]],"#61b6be");
  polygon(c,[[0,333],[420,326],[420,466],[0,466]],"#dfbf86");
  stroke(c,[[210,260],[210,438]],"#f5f8e9",8);
  for(let y=280;y<433;y+=21)stroke(c,[[103,y],[318,y]],"#f6faf2a0",2);
  stroke(c,[[102,277],[318,277]],"#faf9e5",6);
  circle(c,162,348,24,"#faaf8c");circle(c,270,345,24,"#8bdfe6");
  stroke(c,[[162,376],[132,419]],"#345c7c",13);stroke(c,[[270,373],[304,413]],"#345c7c",13);
  circle(c,222,242,28,"#f9f7e4");stroke(c,[[207,224],[237,261]],"#2f7295",5);break;
 }
 case "corrida-no-gelo":{
  circle(c,326,138,73,"#effbff");
  polygon(c,[[0,315],[97,194],[170,291],[247,143],[348,307],[420,226],[420,458],[0,458]],"#98c8d6");
  polygon(c,[[97,194],[124,238],[77,232]],"#f5ffff");
  polygon(c,[[247,143],[292,213],[212,201]],"#f5ffff");
  polygon(c,[[161,276],[266,276],[420,468],[0,468]],"#648d9d");
  for(let i=0;i<6;i++)stroke(c,[[211,307+i*26],[214,315+i*28]],"#effff8",6+i);
  polygon(c,[[90,363],[146,331],[280,331],[338,363],[349,404],[79,404]],"#56d5da");
  polygon(c,[[146,332],[179,300],[256,300],[290,332]],"#ddf8fc");
  for(const x of [117,316])circle(c,x,405,20,"#2a4a5f");break;
 }
 case "cidade-dos-inventores":{
  circle(c,323,132,73,"#f6ca9d");
  for(let i=0;i<10;i++){c.fillStyle=i%2?"#4b4c72":"#665777";c.fillRect(i*43,187+(i%3)*25,41,226);}
  for(const [x,y,r] of [[128,309,59],[285,266,48],[232,368,45]] as const){
   circle(c,x,y,r,"#e8c58d");circle(c,x,y,r*.70,"#5b4c65");circle(c,x,y,r*.35,"#f3d7a2");
   for(let i=0;i<8;i++){const a=i*Math.PI/4;
    stroke(c,[[x+Math.cos(a)*r*.64,y+Math.sin(a)*r*.64],[x+Math.cos(a)*r*1.23,y+Math.sin(a)*r*1.23]],"#f9d18e",8);}
  }
  stroke(c,[[105,225],[330,184]],"#8fe7e6",6);break;
 }
 case "guardioes-do-oceano":{
  circle(c,320,126,77,"#99e7ed");
  for(let i=0;i<28;i++)circle(c,20+(i*73)%388,78+(i*41)%350,2+(i%4),"#c0fcf7");
  polygon(c,[[0,389],[80,340],[160,391],[262,320],[348,390],[420,342],[420,465],[0,465]],"#17697a");
  polygon(c,[[92,316],[141,264],[283,264],[340,319],[295,349],[134,349]],"#e3c98c");
  for(const x of [156,228,294]){circle(c,x,319,23,"#216985");circle(c,x,319,12,"#a0f4e8");}
  polygon(c,[[332,300],[396,263],[396,351],[328,343]],"#cae5bb");
  for(const [x,y] of [[46,238],[360,209],[62,358]] as const){
   polygon(c,[[x-20,y],[x,y-13],[x+21,y],[x,y+13]],"#dcfbcb");
  }break;
 }
 case "batidas-do-futuro":{
  circle(c,310,132,88,"#c398f5");
  for(let i=0;i<15;i++){c.fillStyle=i%3===0?"#88ede6":i%3===1?"#f0a9da":"#ffdb98";
   c.fillRect(5+i*29,372-(51+i*37%158),18,51+i*37%158);}
  polygon(c,[[58,245],[362,245],[354,418],[66,418]],"#1a275a");
  for(const x of [140,280]){
   circle(c,x,326,62,"#161b41");circle(c,x,326,44,"#8adfe5");circle(c,x,326,24,"#583d8e");
   circle(c,x,326,9,"#f1dbfc");
  }
  stroke(c,[[193,264],[227,264]],"#ffe4a1",9);
  for(let i=0;i<5;i++)stroke(c,[[65+i*72,430],[104+i*72,443]],"#9feff7",5);
  break;
 }
 }
}

function draw(ctx:CanvasRenderingContext2D,game:Ps2CoverGame,theme:Theme):void{
 const bg=ctx.createLinearGradient(0,0,420,560);
 bg.addColorStop(0,theme.bg);bg.addColorStop(.62,theme.mid);bg.addColorStop(1,theme.bg);
 ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
 // Deterministic diagonals keep the background interesting without imports.
 for(let i=0;i<13;i++)stroke(ctx,[[i*40-110,120],[i*50+30,400]],theme.accent+"33",2);
 switch(game.id){
  case "cidade-em-fuga":paintCity(ctx);break;
  case "arena-dos-guardioes":paintArena(ctx);break;
  case "futsal-de-bairro":paintFutsal(ctx);break;
  case "cosmos-2006":paintCosmos(ctx);break;
  case "batida-de-rua":paintRhythm(ctx);break;
  default:paintAnnual(ctx,game.id);break;
 }
 const fade=ctx.createLinearGradient(0,371,0,560);
 fade.addColorStop(0,"#09132600");fade.addColorStop(.3,"#091326ee");fade.addColorStop(1,"#050918");
 ctx.fillStyle=fade;ctx.fillRect(0,371,420,189);
 ctx.fillStyle="#0a1024ed";ctx.fillRect(0,0,420,48);
 ctx.textAlign="left";ctx.textBaseline="alphabetic";
 ctx.fillStyle="#eef5ff";ctx.font="bold 19px Arial,sans-serif";
 ctx.fillText("SOFTDOWN",18,30);
 ctx.fillStyle=theme.glow;ctx.font="bold 12px Arial,sans-serif";ctx.textAlign="right";
 ctx.fillText("DVD-ROM · PS2 · "+(game.releaseYear??2006),403,29);
 ctx.textAlign="left";ctx.textBaseline="top";
 for(let i=0;i<2;i++){
  const label=theme.lines[i];
  ctx.font="900 45px Arial,sans-serif";
  ctx.fillStyle=i===0?"#ffffff":theme.accent;
  ctx.shadowColor="#020818";ctx.shadowBlur=8;
  ctx.save();ctx.translate(20,411+i*53);
  const textWidth=ctx.measureText(label).width;
  if(textWidth>378)ctx.scale(378/textWidth,1);
  ctx.fillText(label,0,0);
  ctx.restore();
 }
 ctx.shadowBlur=0;
 ctx.fillStyle="#d6e2f2";ctx.font="bold 11px Arial,sans-serif";
 ctx.fillText(game.genre.toLocaleUpperCase("pt-BR")+" · JOGO ORIGINAL",21,536);
 ctx.strokeStyle="#d7e3f6cc";ctx.lineWidth=6;ctx.strokeRect(3,3,W-6,H-6);
}
/** No network access: one deterministic 420x560 PNG per original PS2 game. */
export function ps2ProceduralCover(game:Ps2CoverGame,doc?:Pick<Document,"createElement">):string{
 const theme=Object.prototype.hasOwnProperty.call(themes,game.id)?themes[game.id]:undefined;
 const safeId=theme?game.id:"cidade-em-fuga";
 const fallback="assets/ps2/covers/"+safeId+".svg";
 if(!theme)return fallback;
 const key=game.id+"\u0000"+game.title+"\u0000"+game.genre+"\u0000"+(game.releaseYear??2006);
 const saved=cache.get(key);if(saved)return saved;
 const target=doc??(typeof document!=="undefined"?document:undefined);
 if(!target)return fallback;
 try{
  const canvas=target.createElement("canvas") as HTMLCanvasElement;
  if(typeof canvas.getContext!=="function"||typeof canvas.toDataURL!=="function")return fallback;
  canvas.width=W;canvas.height=H;
  const ctx=canvas.getContext("2d");if(!ctx)return fallback;
  draw(ctx,game,theme);
  const png=canvas.toDataURL("image/png");
  if(!png.startsWith("data:image/png;base64,"))return fallback;
  cache.set(key,png);return png;
 }catch{return fallback;}
}
