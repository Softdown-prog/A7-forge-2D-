/** Original procedural PlayStation 2 covers for the 2006–2010 catalogue.
 * UI-only: the PS2 economy, save format and CRT gameplay are unchanged.
 * Canvas PNG is preferred; bundled SVG artwork is the offline/headless fallback.
 */
import {stroke} from "./ps2Covers/primitives.js";
import {PS2_COVER_DRAWINGS} from "./ps2Covers/registry.js";

export interface Ps2CoverGame{
 readonly id:string;readonly title:string;readonly genre:string;readonly releaseYear?:number;
}
const W=420,H=560;
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
function draw(ctx:CanvasRenderingContext2D,game:Ps2CoverGame,theme:Theme):void{
 const bg=ctx.createLinearGradient(0,0,420,560);
 bg.addColorStop(0,theme.bg);bg.addColorStop(.62,theme.mid);bg.addColorStop(1,theme.bg);
 ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
 // Deterministic diagonals keep the background interesting without imports.
 for(let i=0;i<13;i++)stroke(ctx,[[i*40-110,120],[i*50+30,400]],theme.accent+"33",2);
 const painter=PS2_COVER_DRAWINGS[game.id];
 if(typeof painter==="function")painter(ctx);
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
