/** Browser audit for the real GPU administration screen on desktop/Android widths.
 * Purchases go through delegated UI controls, never through a test-only shop API.
 */
import {selectAdminArea} from "./management_navigation.mjs";
import {chromium} from "playwright";
import {spawn} from "node:child_process";
import {mkdir,writeFile} from "node:fs/promises";
import {resolve} from "node:path";
import assert from "node:assert/strict";
import {createGame} from "../dist/js/sim/engine.js";
import {buyPlatform} from "../dist/js/sim/hardware.js";
import {buyGpu} from "../dist/js/sim/gpu.js";
import {DAY_MINUTES,GAME_SAVE_KEY} from "../dist/js/sim/types.js";
import {withStationOff} from "../tests/station-power-fixture.mjs";

const output=resolve(process.argv[2]??"out/gpu-modern-browser");
await mkdir(output,{recursive:true});
const server=spawn(process.execPath,[resolve(import.meta.dirname,"serve.mjs")],{stdio:["ignore","pipe","inherit"]});
let browser;
try{
 await new Promise((ok,fail)=>{
  server.stdout.once("data",ok);server.once("error",fail);
  server.once("exit",code=>fail(Error("Servidor terminou: "+code)));
 });
 browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
 const results=[];
 for(const width of [1280,414,360])for(const year of [2015,2025,2030]){
  const context=await browser.newContext({viewport:{width,height:900},isMobile:width<700,hasTouch:width<700});
  const s=createGame(8100+year+width,"historical");
  s.totalMinutes=(year-1998)*360*DAY_MINUTES;s.cash=30000;
  if(year!==2015){
   assert.equal(withStationOff(s,0,()=>buyPlatform(s,0,"platform24")).ok,true);
   if(year===2030)assert.equal(withStationOff(s,0,()=>buyGpu(s,0,"gpu25")).ok,true);
  }
  s.pcPoweredOff=[true,false,false];
  const target=year===2015?"gpu15":year===2025?"gpu25":"gpu30";
  const price=year===2015?2700:year===2025?6600:9250;
  const initialCash=s.cash;
  await context.addInitScript(({key,saved})=>{
   localStorage.setItem(key,JSON.stringify(saved));
   localStorage.setItem("lhs.sound","off");
   localStorage.setItem("lhs.privacy-choice.v1",JSON.stringify({version:1,choice:"rejected",at:Date.now()}));
  },{key:GAME_SAVE_KEY,saved:s});
  const page=await context.newPage(),errors=[];
  page.on("pageerror",e=>errors.push(e.message));
  page.on("response",r=>{if(r.status()>=400)errors.push(r.status()+" "+r.url());});
  await page.goto("http://127.0.0.1:4173",{waitUntil:"domcontentloaded"});
  const press=locator=>width<700?locator.tap():locator.click();
  await page.locator("#menu-continue").waitFor({state:"visible"});
  await press(page.locator("#menu-continue"));
  await press(page.locator("#open-admin"));
  await selectAdminArea(page,"gpus");
  const catalog=page.locator("#gpu-catalog");
  await catalog.locator("article.gpu-card").first().waitFor();
  assert.equal(await catalog.locator("article.gpu-card").count(),13);
  assert.match(await page.locator("#section-gpus h3").innerText(),/2005–2030/);
  const future=page.locator('[data-gpu-buy="gpu30"]');
  assert.equal(await future.isDisabled(),year<2030,"2030 GPU must stay locked before its release");
  // Verify real original local artwork: scrolling activates loading="lazy".
  for(const id of ["gpu15","gpu25","gpu30"]){
   const image=catalog.locator('img[src*="/gpu/'+id+'.svg"]');
   assert.equal(await image.count(),1,"Missing GPU cover "+id);
   await image.scrollIntoViewIfNeeded();
   await image.evaluate(img=>img.decode());
   assert.ok(await image.evaluate(img=>img.naturalWidth>0&&img.naturalHeight>0));
  }
  const purchase=page.locator('[data-gpu-buy="'+target+'"]');
  assert.equal(await purchase.isDisabled(),false,"Selected GPU must be buyable: "+target);
  await press(purchase);
  await page.waitForFunction(({key,id})=>{
   try{return JSON.parse(localStorage.getItem(key))?.pcGpus?.[0]===id;}catch{return false;}
  },{key:GAME_SAVE_KEY,id:target},{timeout:15000});
  const saved=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),GAME_SAVE_KEY);
  assert.equal(saved.pcGpus[0],target);
  assert.equal(saved.cash,initialCash-price);
  assert.equal(await purchase.isDisabled(),true,"Purchased GPU must not charge twice");
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
  assert.ok(overflow<=3,"GPU catalog overflow on "+width+": "+overflow);
  assert.deepEqual(errors,[],"Browser runtime/network errors at "+width+"/"+year);
  await page.screenshot({path:resolve(output,"gpu_"+year+"_"+width+".png")});
  results.push({width,year,gpu:target,cash: saved.cash,originalArt:true,saved:true,overflow});
  await context.close();
 }
 await writeFile(resolve(output,"gpu_modern_browser.json"),JSON.stringify({results,passed:true},null,2));
 console.log("GPU_MODERN_BROWSER "+JSON.stringify({results,passed:true}));
}finally{await browser?.close();server.kill();}
