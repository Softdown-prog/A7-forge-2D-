/** Real-game viewport QA for calendar/weather disclosure on mobile and desktop. */
import {chromium} from "playwright";
import {createServer} from "node:http";
import {mkdir,readFile} from "node:fs/promises";
import {resolve,extname,sep} from "node:path";
import assert from "node:assert/strict";

const root=resolve(import.meta.dirname,"../dist"),out=resolve(process.argv[2]??"out/time-weather");
await mkdir(out,{recursive:true});
const mime={".html":"text/html; charset=utf-8",".js":"text/javascript; charset=utf-8",
 ".css":"text/css; charset=utf-8",".svg":"image/svg+xml",".json":"application/json"};
const server=createServer(async(req,res)=>{
 try{
  const url=new URL(req.url??"/","http://localhost");
  const path=resolve(root,"."+(url.pathname==="/"?"/index.html":decodeURIComponent(url.pathname)));
  if(path!==root&&!path.startsWith(root+sep)){res.writeHead(403).end();return;}
  const bytes=await readFile(path);
  res.writeHead(200,{"content-type":mime[extname(path)]??"application/octet-stream"}).end(bytes);
 }catch{res.writeHead(404).end();}
});
await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
let browser;
try{
 browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
 for(const {name,width} of [{name:"mobile",width:390},{name:"desktop",width:1280}]){
  const context=await browser.newContext({viewport:{width,height:860}}),errors=[];
  const page=await context.newPage();
  page.on("pageerror",e=>errors.push(e.message));
  await page.goto("http://127.0.0.1:"+server.address().port+"/",{waitUntil:"domcontentloaded"});
  await page.locator("#menu-new").click();
  await page.locator("#game-app").waitFor({state:"visible"});
  const details=page.locator("#time-weather-panel");
  await details.locator("summary").waitFor({state:"visible"});
  assert.equal(await details.evaluate(el=>el.open),false);
  assert.match(await page.locator("#calendar-hud").innerText(),/Dia 1.*01\/01\/1998.*10:00/);
  assert.match(await page.locator("#weather-hud").innerText(),/Tempo firme/);
  await details.screenshot({path:resolve(out,"calendario_clima_"+name+"_fechado.png")});
  await details.locator("summary").click();
  await page.waitForFunction(()=>document.getElementById("time-weather-date")?.textContent==="01/01/1998");
  assert.equal(await details.evaluate(el=>el.open),true);
  assert.equal(await page.locator("#time-weather-hour").innerText(),"10:00");
  assert.match(await page.locator("#time-weather-outlook").innerText(),/amanhã|próximo dia/);
  const geometry=await page.evaluate(()=>{
    const panel=document.getElementById("time-weather-panel").getBoundingClientRect();
    const tiles=Array.from(document.querySelectorAll(".time-weather-tile")).map(n=>n.getBoundingClientRect());
    return {panelRight:panel.right,panelLeft:panel.left,tiles:tiles.map(x=>({left:x.left,right:x.right,width:x.width}))};
  });
  assert.ok(geometry.panelLeft>=-1&&geometry.panelRight<=width+2,
   "calendar block must fit viewport: "+JSON.stringify(geometry));
  assert.ok(geometry.tiles.every(t=>t.left>=-1&&t.right<=width+2&&t.width>=170),
   "weather tiles must stay readable: "+JSON.stringify(geometry));
  await details.screenshot({path:resolve(out,"calendario_clima_"+name+"_aberto.png")});
  await details.locator("summary").focus();await page.keyboard.press("Enter");
  await page.waitForFunction(()=>!document.getElementById("time-weather-panel")?.open);
  assert.equal(await page.locator("#autosave-state").count(),1);
  if(errors.length)throw Error(name+": "+errors.join(" | "));
  await context.close();
 }
 console.log("Calendar/weather game HUD QA: responsive layout and native keyboard toggle OK.");
}finally{
 await browser?.close();
 await new Promise(resolve=>server.close(resolve));
}
