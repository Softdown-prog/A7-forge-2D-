import assert from "node:assert/strict";
import {spawn} from "node:child_process";
import {mkdir} from "node:fs/promises";
import {resolve} from "node:path";
import {chromium} from "playwright";
import {createGame,isValidSave} from "../dist/js/sim/engine.js";
import {expandShop} from "../dist/js/sim/economy.js";
import {buyComputer,nextComputerPlacementIssue,shopPrice} from "../dist/js/sim/shop.js";
import {moveLayoutObject} from "../dist/js/sim/editableObjects.js";
import {fixedLayoutObjects} from "../dist/js/sim/layoutGeometry.js";
import {cameraForGame,iso} from "../dist/js/render/isometric.js";
import {GAME_SAVE_KEY} from "../dist/js/sim/types.js";
import {dismissPrivacyNotice} from "./privacyNoticeTest.mjs";

const output=resolve(process.argv[2]??"out/pc-placement");
await mkdir(output,{recursive:true});

const game=createGame(7901,"historical");
game.cash=10000;
assert.ok(expandShop(game).ok);
assert.ok(buyComputer(game).ok);
assert.ok(buyComputer(game).ok);
assert.ok(expandShop(game).ok);
assert.equal(game.installedPcs,5);
assert.ok(moveLayoutObject(game,"shelf",{x:9.25,y:1},0).ok);
const blocked=nextComputerPlacementIssue(game);
assert.match(blocked,/Próximo PC sem encaixe/);
assert.ok(isValidSave(game));
const shelf=fixedLayoutObjects(game).find(item=>item.id==="shelf");
assert.ok(shelf);
const destination={x:.25,y:3};
const floor=iso({x:destination.x+shelf.w/2,y:destination.y+shelf.d/2},cameraForGame(game));
const price=shopPrice(game,"computer");

const server=spawn(process.execPath,[resolve(import.meta.dirname,"serve.mjs")],{stdio:["ignore","pipe","inherit"]});
let browser;
try{
 await new Promise((ready,fail)=>{
  server.stdout.once("data",ready);
  server.once("error",fail);
  server.once("exit",code=>fail(new Error("Servidor encerrou com código "+code)));
 });
 browser=await chromium.launch({args:["--no-sandbox"]});
 for(const width of [1440,360]){
  const mobile=width<700;
  const context=await browser.newContext({viewport:{width,height:920},isMobile:mobile,hasTouch:mobile});
  await context.addInitScript(({key,state})=>{
   if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify(state));
   localStorage.setItem("lhs.sound","off");
  },{key:GAME_SAVE_KEY,state:game});
  const page=await context.newPage();
  page.setDefaultTimeout(10000);
  const errors=[];
  page.on("pageerror",error=>errors.push(error.message));
  const press=selector=>mobile?page.locator(selector).tap():page.locator(selector).click();
  const readSave=()=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)),GAME_SAVE_KEY);
  const buy='#angular-shop-catalog [data-buy="computer"]';
  const card=page.locator("#angular-shop-catalog .shop-card").filter({has:page.locator('[data-buy="computer"]')});
  const hint=card.locator(".shop-purchase-status");
  const waitForHint=pattern=>hint.filter({hasText:pattern}).waitFor();
  const openCatalog=async()=>{
   await press("#open-shop");
   await press('[data-shop-category="equipment"]');
  };

  await page.goto("http://127.0.0.1:4173");
  await dismissPrivacyNotice(page,mobile);
  await press("#menu-continue");
  await openCatalog();
  await waitForHint(/5\/7 PCs.*Próximo PC sem encaixe/);
  assert.equal(await page.locator(buy).isDisabled(),true);
  assert.equal(await hint.innerText(),`Área principal: 5/7 PCs. ${blocked}`);
  await card.screenshot({path:resolve(output,`blocked-${width}.png`)});
  const before=await readSave();

  await press("#organize-furniture");
  await page.locator("#layout-object").selectOption("shelf");
  const canvas=page.locator("#game");
  await canvas.scrollIntoViewIfNeeded();
  const point=await canvas.evaluate(async(element,projected)=>{
   const viewport=document.querySelector("#scene-viewport");
   const scaleX=element.clientWidth/1000,scaleY=element.clientHeight/610;
   viewport.scrollLeft=projected.x*scaleX-viewport.clientWidth/2;
   viewport.scrollTop=projected.y*scaleY-viewport.clientHeight/2;
   await new Promise(ready=>requestAnimationFrame(()=>requestAnimationFrame(ready)));
   const rect=element.getBoundingClientRect();
   return {x:rect.left+projected.x*rect.width/1000,y:rect.top+projected.y*rect.height/610};
  },floor);
  if(mobile)await page.touchscreen.tap(point.x,point.y);
  else await page.mouse.click(point.x,point.y);
  await press("#layout-confirm");
  const moved=await readSave();
  const movedShelf=moved.objectPlacements.find(item=>item.id==="shelf");
  assert.ok(movedShelf);
  assert.notDeepEqual(movedShelf,before.objectPlacements.find(item=>item.id==="shelf"));
  assert.equal(nextComputerPlacementIssue(moved),null);
  assert.equal(moved.cash,before.cash);
  assert.equal(moved.expenses,before.expenses);
  await press("#layout-close");

  await openCatalog();
  for(const installed of [5,6]){
   await waitForHint(`Área principal: ${installed}/7 PCs. Posição do próximo PC disponível.`);
   await press(buy);
   const saved=await readSave();
   const purchases=installed-4;
   assert.equal(saved.installedPcs,installed+1);
   assert.equal(saved.cash,before.cash-price*purchases);
   assert.equal(saved.expenses,before.expenses+price*purchases);
  }
  await waitForHint("Área principal: 7/7 PCs. Limite da área principal atingido.");
  assert.equal(await page.locator(buy).isDisabled(),true);
  await card.screenshot({path:resolve(output,`full-${width}.png`)});

  await page.reload();
  await press("#menu-continue");
  await openCatalog();
  await waitForHint("Área principal: 7/7 PCs. Limite da área principal atingido.");
  assert.equal(await page.locator(buy).isDisabled(),true);
  const restored=await readSave();
  assert.equal(restored.installedPcs,7);
  assert.equal(restored.cash,before.cash-price*2);
  assert.deepEqual(restored.objectPlacements,moved.objectPlacements);
  assert.deepEqual(errors,[]);
  console.log(`${mobile?"Toque":"Mouse"} ${width}px: 5/7 bloqueado, móvel reposicionado, duas compras e 7/7 salvo.`);
  await context.close();
 }
}finally{
 await browser?.close();
 server.kill();
}
