// Captura a interface REAL do Lan House Simulator no Chromium.
// Todos os jogadores entram, pagam, caminham, sentam e jogam por stepGame()
// acionado pelo loop normal de main.ts. Não há cena especial ou teletransporte.
import {chromium} from "playwright";
import {createServer} from "node:http";
import {mkdir,readFile,writeFile,rename} from "node:fs/promises";
import {extname,resolve,sep} from "node:path";
import {createGame,isValidSave} from "../dist/js/sim/engine.js";
import {licenseGames} from "../dist/js/sim/economy.js";
import {licenseWindows} from "../dist/js/sim/era.js";
import {licenseEraGame,ERIC_MULTIPLAYER_GAME_ID} from "../dist/js/sim/eraGames.js";
import {toggleStationPower} from "../dist/js/sim/stationPower.js";
import {DAY_MINUTES,GAME_SAVE_KEY} from "../dist/js/sim/types.js";
import {dismissPrivacyNotice} from "./privacyNoticeTest.mjs";

const root=resolve(import.meta.dirname,"../dist");
const output=resolve(process.argv[2]??"out/eric-multiplayer");
await mkdir(output,{recursive:true});
const mime={".html":"text/html",".js":"text/javascript",".css":"text/css",
 ".png":"image/png",".svg":"image/svg+xml",".webp":"image/webp",".ogg":"audio/ogg"};
const server=createServer(async(req,res)=>{
 try{
  const pathname=decodeURIComponent(new URL(req.url??"/","http://127.0.0.1").pathname);
  const file=resolve(root,"."+(pathname==="/"?"/index.html":pathname));
  if(file!==root&&!file.startsWith(root+sep)){res.writeHead(403).end();return;}
  res.writeHead(200,{"Content-Type":mime[extname(file)]??"application/octet-stream"});
  res.end(await readFile(file));
 }catch{res.writeHead(404).end();}
});
await new Promise(ok=>server.listen(0,"127.0.0.1",ok));

// Mesmo procedimento de contratação e licenciamento usado pelo jogo.
// A única preparação é iniciar um SAVE VÁLIDO em 2000, antes da oportunidade.
const seed=724,s=createGame(seed,"historical");
s.totalMinutes=2*360*DAY_MINUTES;
s.mailScheduleSeed=seed;
s.cash=20000;
s.reputation=10;
s.ericSecondMailDelivered=true;
function requireOk(label,result){
 if(!result.ok)throw Error(label+": "+result.message);
}
requireOk("licença básica",licenseGames(s));
for(let pc=0;pc<3;pc++){
 requireOk("desligar PC "+pc,toggleStationPower(s,pc));
 requireOk("Windows PC "+pc,licenseWindows(s,pc,"win98"));
 requireOk("religar PC "+pc,toggleStationPower(s,pc));
}
requireOk("Setor Zero",licenseEraGame(s,ERIC_MULTIPLAYER_GAME_ID));
const firstDay=2*360+1;
const day=firstDay+((seed%7-firstDay%7+7)%7);
const minute=170+seed%110;
s.totalMinutes=(day-1)*DAY_MINUTES+minute-3;
if(!isValidSave(s))throw Error("O save de 2000 não é válido.");

const result={seed,day,scenario:"2000, Setor Zero licenciado, 3 PCs reais, interface original",
 checkpoints:[],errors:[],observedRound:false,observedPaid:false,uniquePcCount:0};
let browser;
try{
 browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
 const context=await browser.newContext({
  viewport:{width:1280,height:850},deviceScaleFactor:1,
  recordVideo:{dir:output,size:{width:1280,height:850}}
 });
 const page=await context.newPage();
 page.on("pageerror",e=>result.errors.push(String(e)));
 await page.addInitScript(({key,payload})=>localStorage.setItem(key,JSON.stringify(payload)),
  {key:GAME_SAVE_KEY,payload:s});
 await page.goto("http://127.0.0.1:"+server.address().port+"/",{waitUntil:"networkidle"});
 await dismissPrivacyNotice(page);
 await page.locator("#menu-continue").click();
 await page.locator("#game-app").waitFor({state:"visible"});
 await page.locator("#game").scrollIntoViewIfNeeded();
 await page.screenshot({path:resolve(output,"eric_inicio_canvas_real.png")});
 // NÃO alterar a velocidade, a posição dos clientes, o save em execução
 // nem o DOM do salão após iniciar a partida. Apenas observar.
 for(let second=0;second<43;second++){
  await page.waitForTimeout(1000);
  if(second%2!==0)continue;
  const data=await page.evaluate(key=>{
   const raw=localStorage.getItem(key);
   if(!raw)return null;
   const state=JSON.parse(raw),visit=state.multiplayerVisit;
   const members=visit?.memberIds.map(id=>state.customers.find(c=>c.id===id)).filter(Boolean)??[];
   return {
    totalMinutes:state.totalMinutes,served:state.served,cash:state.cash,
    visit:visit?{id:visit.id,size:visit.size,paid:visit.paid===true,
      startedMinute:visit.startedMinute??null}:null,
    members:members.map(c=>({id:c.id,stage:c.stage,pc:c.pcIndex,usedMinutes:c.usedMinutes})),
    logs:state.eventLog.slice(0,10)
   };
  },GAME_SAVE_KEY);
  if(data){
   const entry={second:second+1,minute:data.totalMinutes,visit:data.visit,
    members:data.members};
   result.checkpoints.push(entry);
   if(data.visit?.paid)result.observedPaid=true;
   if(data.visit?.startedMinute!==null&&data.visit?.startedMinute!==undefined){
    result.observedRound=true;
    const pcs=data.members.map(c=>c.pc);
    result.uniquePcCount=Math.max(result.uniquePcCount,new Set(pcs).size);
   }
   if(data.logs?.some(line=>line.includes("MESMA partida em rede")))result.observedRound=true;
  }
  if([6,16,24,32,40].includes(second))
   await page.screenshot({path:resolve(output,"eric_partida_real_"+(second+1)+".png")});
 }
 // A gravação é da janela do jogo, nunca de uma composição gráfica externa.
 const webm=await page.video().path();
 await context.close();
 await rename(webm,resolve(output,"eric_setor_zero_canvas_real.webm"));
 if(result.errors.length)throw Error("Erros do Chromium: "+result.errors.join(" | "));
 if(!result.observedPaid||!result.observedRound||result.uniquePcCount<2)
  throw Error("Partida conjunta não comprovada pela telemetria do save: "+
   JSON.stringify({paid:result.observedPaid,round:result.observedRound,pcs:result.uniquePcCount}));
 console.log("OK: rodada LAN observada na interface real do jogo; PCs="+result.uniquePcCount);
}finally{
 await writeFile(resolve(output,"eric_gameplay_evidencias.json"),JSON.stringify(result,null,2));
 if(browser)await browser.close();
 await new Promise(ok=>server.close(ok));
}
