import {selectAdminArea,selectTask} from './management_navigation.mjs';
import {chromium} from "playwright";
import {spawn} from "node:child_process";
import {mkdir,writeFile} from "node:fs/promises";
import {resolve} from "node:path";
import assert from "node:assert/strict";
import {createGame} from "../dist/js/sim/engine.js";
import {DAY_MINUTES,GAME_SAVE_KEY} from "../dist/js/sim/types.js";
import {buyPs1Station,buyPs1Disc,ps1PlacementSlots,ps1Seat} from "../dist/js/sim/ps1.js";

const out=resolve(process.argv[2]??"out/ps1");
await mkdir(out,{recursive:true});
const server=spawn(process.execPath,[resolve(import.meta.dirname,"serve.mjs")],{stdio:["ignore","pipe","inherit"]});
let browser;
try{
 await new Promise((good,bad)=>{server.stdout.once("data",good);server.once("error",bad);
  server.once("exit",code=>bad(Error("Local server stopped "+code)));});
 browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
 const reports=[];
 for(const width of [1280,414,360]){
  const mobile=width<700;
  const ctx=await browser.newContext({viewport:{width,height:900},isMobile:mobile,hasTouch:mobile});
  const state=createGame(900+width,"historical");
  state.totalMinutes=4*360*DAY_MINUTES;state.cash=6000;
  await ctx.addInitScript(({key,state})=>{
   localStorage.setItem(key,JSON.stringify(state));localStorage.setItem("lhs.sound","off");
  },{key:GAME_SAVE_KEY,state});
  const page=await ctx.newPage(),errors=[];
  page.on("pageerror",e=>errors.push(String(e)));
  const click=async selector=>mobile?await page.locator(selector).tap():await page.locator(selector).click();
  await page.goto("http://127.0.0.1:4173",{waitUntil:"networkidle"});
  await click("#menu-continue");await click("#open-shop");
  await page.locator('[data-shop-category="consoles"]').click();
  const buy=page.locator('[data-buy="ps1"]');
  assert.equal(await buy.isEnabled(),true,"PS1 purchasable in 2002");
  assert.ok(await page.locator("#ps1-placement option").count()>0,"bench placement slots");
  await click('[data-buy="ps1"]');
  // A primeira compra abre Administração → Videogames automaticamente.
  // A loja fechada não recalcula o texto de saldo; reabrimos pelo atalho.
  assert.match(await page.locator("#ps1-overview").innerText(),/Bancadas instaladas: 1\/3/);
  await selectTask(page,"consoles","discs");await click("#ps1-open-shop");
  assert.match(await page.locator("#shop-cash").innerText(),/Caixa R\$ 5440/);
  await click('[data-buy-ps1-disc="turbo-circuito"]');
  assert.match(await page.locator(".ps1-cd-shop-card").filter({hasText:"Turbo Circuito"}).innerText(),/Cópias no acervo: 1/);
  await page.screenshot({path:resolve(out,"ps1_shop_"+width+".png")});
  await click("#close-shop");
  await click("#open-admin");await selectAdminArea(page,'consoles');
  assert.match(await page.locator("#ps1-overview").innerText(),/Bancadas instaladas: 1\/3/);
  await selectTask(page,"consoles","pricing");await click("#ps1-price-up");
  assert.match(await page.locator("#ps1-hourly").innerText(),/2,75/);
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
  assert.ok(overflow<=3,"console panel overflow "+width+": "+overflow);
  await page.locator("#section-consoles").screenshot({path:resolve(out,"ps1_admin_"+width+".png")});
  // Outra partida salva com cliente usando o controle no salão; exercício
  // do render real e da posição do personagem sobre a cadeira.
  const active=createGame(1100+width,"historical");active.totalMinutes=4*360*DAY_MINUTES;
  active.cash=5000;
  const slot=ps1PlacementSlots(active)[0];
  assert.ok(slot);assert.equal(buyPs1Station(active,slot.id).ok,true);
  assert.equal(buyPs1Disc(active,"turbo-circuito").ok,true);
  const seat=ps1Seat(active,0);assert.ok(seat);
  active.customers=[{
   id:5,x:seat.x,y:seat.y,target:seat,stage:"using",costume:"regular",
   pcIndex:null,ps1StationIndex:0,usedMinutes:12,sessionMinutes:45,waitingMinutes:0,
   offlineWait:0,happy:true,wallet:20
  }];
  const playback=await browser.newContext({viewport:{width,height:900},isMobile:mobile,hasTouch:mobile});
  await playback.addInitScript(({key,state})=>{
   localStorage.setItem(key,JSON.stringify(state));localStorage.setItem("lhs.sound","off");
  },{key:GAME_SAVE_KEY,state:active});
  const playPage=await playback.newPage();
  playPage.on("pageerror",e=>errors.push(String(e)));
  await playPage.goto("http://127.0.0.1:4173",{waitUntil:"networkidle"});
  if(mobile)await playPage.locator("#menu-continue").tap();
  else await playPage.locator("#menu-continue").click();
  await playPage.screenshot({path:resolve(out,"ps1_playing_"+width+".png")});
  assert.deepEqual(errors,[],"browser PS1 UI has no runtime errors");
  reports.push({width,consoleBought:true,ps1Price:2.75,overflow,actorSeated:true});
  await playback.close();await ctx.close();
 }
 await writeFile(resolve(out,"ps1_smoke.json"),JSON.stringify({reports,passed:true},null,2));
 console.log(JSON.stringify({reports,passed:true}));
}finally{await browser?.close();server.kill();}
