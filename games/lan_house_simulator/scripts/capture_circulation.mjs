// Grava a aplicação real, incluindo seu requestAnimationFrame e transações.
// Nenhum ator é reposicionado depois de carregar a fixture de estresse.
import {chromium} from "playwright";
import {spawn,execFileSync} from "node:child_process";
import {mkdir,writeFile,rm} from "node:fs/promises";
import {resolve} from "node:path";
import {circulationScenario} from "./circulation_scenario.mjs";
import {stepGame} from "../dist/js/sim/engine.js";
import {GAME_SAVE_KEY} from "../dist/js/sim/types.js";

const output=resolve(process.argv[2]??"out/validation"),duration=48000;
await mkdir(output,{recursive:true});
const server=spawn(process.execPath,[resolve(import.meta.dirname,"serve.mjs")],{stdio:["ignore","pipe","inherit"]});
let browser;
try{
 await new Promise((ok,reject)=>{server.stdout.once("data",ok);server.once("error",reject);server.once("exit",code=>reject(Error("Servidor encerrou: "+code)));});
 browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
 const errors=[],summary={fixture:"seed 1998, capital de teste R$ 10000, obras pagas, oito clientes na fila, três PCs quebrados",durationMs:duration,audio:false};
 for(const config of [{name:"desktop",width:1280,height:850},{name:"mobile",width:414,height:920}]){
  const context=await browser.newContext({viewport:{width:config.width,height:config.height},deviceScaleFactor:1,
   ...(config.name==="desktop"?{recordVideo:{dir:resolve(output,"recording"),size:{width:1280,height:850}}}:{isMobile:true,hasTouch:true})});
  const state=circulationScenario();stepGame(state,35);
  await context.addInitScript(({key,state})=>{localStorage.setItem(key,JSON.stringify(state));localStorage.setItem("lhs.sound","off");},{key:GAME_SAVE_KEY,state});
  const page=await context.newPage();page.on("pageerror",e=>errors.push(String(e)));
  await page.goto("http://127.0.0.1:4173",{waitUntil:"networkidle"});
  await page.locator("#menu-continue").click();await page.locator("#game-app").waitFor({state:"visible"});
  await page.locator("#game").scrollIntoViewIfNeeded();
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+3);
  if(overflow)throw Error("Página com overflow horizontal: "+config.name);
  await page.screenshot({path:resolve(output,"lhs_circulation_"+config.name+".png")});
  if(config.name==="desktop"){
   const video=page.video();
   // Oito segundos por trecho também permitem conferir o save produzido pela UI.
   for(let i=0;i<6;i++){
    await page.waitForTimeout(duration/6);
    if(i===2)await page.screenshot({path:resolve(output,"lhs_circulation_desktop_later.png")});
   }
   const final=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),GAME_SAVE_KEY);
   if(final.totalMinutes<state.totalMinutes+120||final.served<=state.served)
    throw Error("Gravação sem avanço real de simulação/atendimento");
   summary.startMinute=state.totalMinutes;summary.endMinute=final.totalMinutes;
   summary.served=final.served;summary.purchases=final.purchases;
   await context.close();
   const raw=await video.path();
   execFileSync("ffmpeg",["-y","-i",raw,"-an","-c:v","libx264","-threads","2","-preset","veryfast","-crf","23","-pix_fmt","yuv420p","-movflags","+faststart",resolve(output,"lhs_circulation_runtime.mp4")],{stdio:"ignore"});
   const seconds=Number(execFileSync("ffprobe",["-v","error","-show_entries","format=duration","-of","default=noprint_wrappers=1:nokey=1",resolve(output,"lhs_circulation_runtime.mp4")],{encoding:"utf8"}).trim());
   if(!Number.isFinite(seconds)||seconds<duration/1000)throw Error("MP4 incompleto");
   summary.videoSeconds=seconds;
   await rm(resolve(output,"recording"),{recursive:true,force:true});
  }else await context.close();
 }
 if(errors.length)throw Error("Erros de navegador: "+errors.join("; "));
 await writeFile(resolve(output,"lhs_circulation_runtime.json"),JSON.stringify(summary,null,2)+"\n");
 console.log("Circulação: vídeo contínuo da aplicação real + inspeção desktop/mobile.");
}finally{await browser?.close();server.kill();}
