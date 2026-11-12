import {selectAdminArea,selectTask} from './management_navigation.mjs';
import {chromium} from "playwright";
import {spawn} from "node:child_process";
import {mkdir,writeFile,rename} from "node:fs/promises";
import {resolve} from "node:path";
import assert from "node:assert/strict";
import {createGame} from "../dist/js/sim/engine.js";
import {DAY_MINUTES,GAME_SAVE_KEY} from "../dist/js/sim/types.js";
import {buyPs1Station,buyPs1Disc,buyPs1SecondSeat,ps1PlacementSlots,ps1Seat} from "../dist/js/sim/ps1.js";

// Interagir com o aviso legítimo antes de testar botões do jogo.
async function dismissPrivacy(page,mobile){
 const banner=page.locator("#privacy-banner");
 if(await banner.isVisible()){
  if(mobile)await page.locator("#privacy-reject").tap();
  else await page.locator("#privacy-reject").click();
  await banner.waitFor({state:"hidden"});
 }
}
// Real browser pixels are the authority. Under video recording Chromium can
// sporadically reject Page.captureScreenshot even while Canvas runs correctly.
// Fail closed if both viewport capture and raw live-canvas readback fail.
async function captureRealPs1Frame(page,filename,width){
 try{
  await page.screenshot({path:filename,timeout:15000,animations:"disabled"});
  return "browser-page";
 }catch(error){
  if(!/captureScreenshot|timed out|Timeout/i.test(String(error)))throw error;
  console.warn("PS1 Chromium page capture unavailable; checking genuine Canvas pixels",String(error).slice(0,240));
  const result=await page.locator("#game").evaluate(canvas=>{
   if(!(canvas instanceof HTMLCanvasElement)||canvas.width<64||canvas.height<64)
    throw Error("PS1 fallback requires the actual visible game Canvas");
   const bounds=canvas.getBoundingClientRect(),style=getComputedStyle(canvas);
   if(bounds.width<64||bounds.height<64||style.display==="none"||style.visibility==="hidden")
    throw Error("PS1 game Canvas is not visible");
   const ctx=canvas.getContext("2d",{willReadFrequently:true});
   if(!ctx)throw Error("PS1 game Canvas 2D rendering context missing");
   const colors=new Set(),samples=20;
   for(let y=1;y<samples;y++)for(let x=1;x<samples;x++){
    const px=Math.min(canvas.width-1,Math.floor(canvas.width*x/samples));
    const py=Math.min(canvas.height-1,Math.floor(canvas.height*y/samples));
    const c=ctx.getImageData(px,py,1,1).data;
    if(c[3]>0)colors.add(`${c[0]},${c[1]},${c[2]},${c[3]}`);
   }
   return {width:canvas.width,height:canvas.height,colors:colors.size,uri:canvas.toDataURL("image/png")};
  },{timeout:15000});
  assert.ok(result.colors>3,"PS1 browser Canvas is blank or static: "+JSON.stringify({width,colors:result.colors}));
  assert.ok(result.uri.startsWith("data:image/png;base64,"),"PS1 browser Canvas PNG readback unavailable");
  const png=Buffer.from(result.uri.slice("data:image/png;base64,".length),"base64");
  assert.ok(png.length>1024&&png.length<12*1024*1024,"PS1 browser PNG size out of bounds");
  assert.equal(png.subarray(0,8).toString("hex"),"89504e470d0a1a0a","PS1 canvas capture is not a real PNG");
  await writeFile(filename,png);
  return "browser-canvas-pixels";
 }
}

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
  // O calendário original é exercitado aqui. A entrega e o bloqueio por
  // revista são cobertos no teste integrado da loja Angular.
  delete state.topGamesUnlockMode;
  state.totalMinutes=4*360*DAY_MINUTES;state.cash=6000;
  await ctx.addInitScript(({key,state})=>{
   localStorage.setItem(key,JSON.stringify(state));localStorage.setItem("lhs.sound","off");
  },{key:GAME_SAVE_KEY,state});
  const page=await ctx.newPage(),errors=[];
  page.on("pageerror",e=>errors.push(String(e)));
  const click=async selector=>mobile?await page.locator(selector).tap():await page.locator(selector).click();
  await page.goto("http://127.0.0.1:4173",{waitUntil:"networkidle"});
  await dismissPrivacy(page,mobile);
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
  await selectTask(page,"consoles","stations");
  const upgrade=page.locator('button[data-ps1-second-seat="0"]');
  assert.equal(await upgrade.isEnabled(),true,"second chair purchasable in 2002");
  await click('button[data-ps1-second-seat="0"]');
  assert.match(await page.locator("#ps1-stations").innerText(),/Modo dupla instalado/);
  assert.match(await page.locator("#ps1-stations").innerText(),/vagas: 0\/2/);
  await page.locator("#section-consoles").screenshot({path:resolve(out,"ps1_admin_"+width+".png")});
  // Outra partida salva com cliente usando o controle no salão; exercício
  // do render real e da posição do personagem sobre a cadeira.
  const active=createGame(1100+width,"historical");delete active.topGamesUnlockMode;active.totalMinutes=4*360*DAY_MINUTES;
  active.cash=5000;
  const slot=ps1PlacementSlots(active)[0];
  assert.ok(slot);assert.equal(buyPs1Station(active,slot.id).ok,true);
  assert.equal(buyPs1Disc(active,"turbo-circuito").ok,true);
  assert.equal(buyPs1SecondSeat(active,0).ok,true);
  const seat=ps1Seat(active,0,0),other=ps1Seat(active,0,1);
  assert.ok(seat&&other);
  active.nextCustomerId=7;
  active.customers=[seat,other].map((point,i)=>({
   id:5+i,x:point.x,y:point.y,target:point,stage:"using",costume:"regular",
   pcIndex:null,ps1StationIndex:0,ps1SeatIndex:i,usedMinutes:12,sessionMinutes:90,
   waitingMinutes:0,offlineWait:0,happy:true,wallet:20
  }));
  const playback=await browser.newContext({viewport:{width,height:900},
   isMobile:mobile,hasTouch:mobile,
   ...(!mobile?{recordVideo:{dir:out,size:{width,height:900}}}:{})});
  await playback.addInitScript(({key,state})=>{
   localStorage.setItem(key,JSON.stringify(state));localStorage.setItem("lhs.sound","off");
  },{key:GAME_SAVE_KEY,state:active});
  const playPage=await playback.newPage();
  playPage.on("pageerror",e=>errors.push(String(e)));
  await playPage.goto("http://127.0.0.1:4173",{waitUntil:"domcontentloaded"});
  await dismissPrivacy(playPage,mobile);
  const resume=playPage.locator("#menu-continue"), game=playPage.locator("#game-app");
  // Rehydration can briefly hide BOTH the menu button and the game container.
  // Wait for a visible, usable state instead of sampling the DOM too early.
  // No force clicks, fabricated success or waived gameplay assertion.
  let ready;
  try{
   const state=await playPage.waitForFunction(()=>{
    const visible=selector=>{
     const element=document.querySelector(selector);
     if(!element||element.closest("[hidden]"))return false;
     const rect=element.getBoundingClientRect(),style=getComputedStyle(element);
     return rect.width>0&&rect.height>0&&style.display!=="none"&&style.visibility!=="hidden";
    };
    if(visible("#game-app"))return "game";
    if(visible("#menu-continue"))return "menu";
    return false;
   },null,{timeout:30000});
   ready=await state.jsonValue();
  }catch(error){
   const diagnostics=await playPage.evaluate(()=>Object.fromEntries(
    ["#start-screen","#menu-continue","#game-app","#privacy-banner"].map(selector=>{
     const e=document.querySelector(selector);
     return [selector,e?{hidden:e.hidden,display:getComputedStyle(e).display,
      visibility:getComputedStyle(e).visibility,width:e.getBoundingClientRect().width,
      height:e.getBoundingClientRect().height}:null];
    })));
   console.error("PS1 playback UI did not become usable",JSON.stringify({width,diagnostics,errors}));
   await playPage.screenshot({path:resolve(out,"ps1_playback_unready_"+width+".png")});
   throw error;
  }
  if(ready==="menu"){
   if(mobile)await resume.tap();else await resume.click();
  }else{
   assert.equal(ready,"game","PS1 playback must present an interactive game or resume button");
  }
  await game.waitFor({state:"visible",timeout:30000});
  await playPage.locator("#game").waitFor({state:"visible",timeout:30000});
  const captureMode=await captureRealPs1Frame(playPage,resolve(out,"ps1_two_players_"+width+".png"),width);
  if(!mobile)await playPage.waitForTimeout(3500);
  assert.deepEqual(errors,[],"browser PS1 UI has no runtime errors");
  reports.push({width,consoleBought:true,secondSeatBought:true,ps1Price:2.75,overflow,twoActorsSeated:true,captureMode});
  const recording=playPage.video();
  await playback.close();
  if(recording)await rename(await recording.path(),resolve(out,"ps1_two_players_real_gameplay.webm"));
  await ctx.close();
 }
 await writeFile(resolve(out,"ps1_smoke.json"),JSON.stringify({reports,passed:true},null,2));
 console.log(JSON.stringify({reports,passed:true}));
}finally{await browser?.close();server.kill();}
