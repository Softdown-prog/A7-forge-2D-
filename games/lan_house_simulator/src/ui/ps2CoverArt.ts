/** Five original procedural PlayStation 2 cover artworks.
 * UI-only: the PS2 economy, save format and CRT gameplay are unchanged.
 * Canvas PNG is preferred; bundled SVG artwork is the offline/headless fallback.
 */
export interface Ps2CoverGame{
 readonly id:string;readonly title:string;readonly genre:string;
}
const W=420,H=560;
type Point=readonly [number,number];
type Theme={bg:string;mid:string;accent:string;glow:string;lines:readonly [string,string]};
const themes:Record<string,Theme>={
 "cidade-em-fuga":{bg:"#081a33",mid:"#206080",accent:"#ff8357",glow:"#ffd9a3",lines:["CIDADE EM","FUGA"]},
 "arena-dos-guardioes":{bg:"#1c1437",mid:"#65529c",accent:"#75e8da",glow:"#ffe0a5",lines:["ARENA DOS","GUARDIÕES"]},
 "futsal-de-bairro":{bg:"#0d3040",mid:"#238873",accent:"#f7d178",glow:"#f0ffda",lines:["FUTSAL DE","BAIRRO"]},
 "cosmos-2006":{bg:"#091b40",mid:"#425da5",accent:"#85dcff",glow:"#ffbd9b",lines:["COSMOS","2006"]},
 "batida-de-rua":{bg:"#21113a",mid:"#913973",accent:"#ffcb63",glow:"#92f1ff",lines:["BATIDA DE","RUA"]}
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
 }
 const fade=ctx.createLinearGradient(0,371,0,560);
 fade.addColorStop(0,"#09132600");fade.addColorStop(.3,"#091326ee");fade.addColorStop(1,"#050918");
 ctx.fillStyle=fade;ctx.fillRect(0,371,420,189);
 ctx.fillStyle="#0a1024ed";ctx.fillRect(0,0,420,48);
 ctx.textAlign="left";ctx.textBaseline="alphabetic";
 ctx.fillStyle="#eef5ff";ctx.font="bold 19px Arial,sans-serif";
 ctx.fillText("SOFTDOWN",18,30);
 ctx.fillStyle=theme.glow;ctx.font="bold 12px Arial,sans-serif";ctx.textAlign="right";
 ctx.fillText("DVD-ROM · PS2 · 2006",403,29);
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
 const key=game.id+"\u0000"+game.title+"\u0000"+game.genre;
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
