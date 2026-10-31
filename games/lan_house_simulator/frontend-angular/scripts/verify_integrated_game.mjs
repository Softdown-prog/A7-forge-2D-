/** Browser-only cutover rehearsal: original Canvas game, actual shop ports and save.
 * Production HTML remains unchanged. Angular takes over only the HTTP test response.
 */
import {createRequire} from 'node:module';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import assert from 'node:assert/strict';
import {createGame} from '../../dist/js/sim/engine.js';
import {DAY_MINUTES,GAME_SAVE_KEY} from '../../dist/js/sim/types.js';
const tools=createRequire(resolve(import.meta.dirname,'../../.angular-browser-tools/package.json'));
const {chromium}=tools('playwright');
const gameRoot=resolve(import.meta.dirname,'../../dist');
const angularRoot=resolve(import.meta.dirname,'../dist/game-ui/browser');
const output=resolve(import.meta.dirname,'../../out/angular-integrated-browser');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8',
 '.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.json':'application/json',
 '.png':'image/png','.webp':'image/webp','.wav':'audio/wav','.ogg':'audio/ogg'};
const original=await readFile(resolve(gameRoot,'index.html'),'utf8');
const reactEntry='<script type="module" src="./js/react-entry.js"></script>';
const shopEntry='<div id="shop-catalog" class="shop-grid"></div>';
assert.equal(original.split(reactEntry).length,2,'One React bootstrap expected');
assert.equal(original.split(shopEntry).length,2,'One native catalogue expected');
const index=original.replace(reactEntry,'<script type="module" src="./__angular/main.js"></script>')
 .replace('</head>','<link rel="stylesheet" href="./__angular/styles.css"/>'+
  '<style>#shop-catalog{position:absolute!important;left:-9999px!important;'+
  'width:1px!important;height:1px!important;overflow:hidden!important;pointer-events:none!important}'+
  '#angular-shop-catalog{display:block;min-width:0}</style></head>')
 .replace(shopEntry,'<div id="angular-shop-catalog"></div>'+shopEntry);
const server=createServer(async(req,res)=>{
 try{
  const path=decodeURIComponent(new URL(req.url??'/','http://localhost').pathname);
  if(path==='/'){res.writeHead(200,{'content-type':mime['.html'],'cache-control':'no-store'});res.end(index);return;}
  const angular=path.startsWith('/__angular/');
  const root=angular?angularRoot:gameRoot;
  const target=resolve(root,'.'+(angular?path.slice('/__angular'.length):path));
  if(!target.startsWith(root+sep)){res.writeHead(403).end();return;}
  res.writeHead(200,{'content-type':mime[extname(target)]??'application/octet-stream'});
  res.end(await readFile(target));
 }catch{res.writeHead(404).end('Not found');}
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const origin='http://127.0.0.1:'+server.address().port;
await mkdir(output,{recursive:true});
let browser;
const reports=[];
try{
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 for(const width of [1280,414,360]){
  const mobile=width<700;
  const context=await browser.newContext({viewport:{width,height:900},isMobile:mobile,hasTouch:mobile});
  const fixture=createGame(2200+width,'historical');
  fixture.totalMinutes=8*360*DAY_MINUTES+35; // 2006
  fixture.cash=15000;fixture.pcPoweredOff=[true,true,true];
  fixture.offlineUntil=fixture.totalMinutes+500;
  await context.addInitScript(({key,save})=>{
   if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify(save));
   localStorage.setItem('lhs.sound','off');
   localStorage.setItem('lhs.privacy-choice.v1',JSON.stringify({version:1,choice:'rejected',at:Date.now()}));
  },{key:GAME_SAVE_KEY,save:fixture});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  const press=async selector=>mobile?selector.tap():selector.click();
  const persisted=()=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)),GAME_SAVE_KEY);
  await page.goto(origin,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.documentElement.dataset.uiFramework==='angular');
  await page.waitForFunction(()=>!document.querySelector('#menu-continue')?.disabled);
  await press(page.locator('#menu-continue'));
  await page.locator('#game-app').waitFor({state:'visible'});
  assert.equal(await page.locator('#game').count(),1,'Real Canvas game exists');
  await press(page.locator('#open-shop'));
  await press(page.locator('[data-shop-category="consoles"]'));
  const shop=page.locator('.angular-console-shop');
  await shop.waitFor({state:'visible'});
  const ps1=shop.locator(':scope > article.shop-card').first();
  const ps2=shop.locator(':scope > article.shop-card').nth(1);
  const slots=await page.locator('#angular-ps1-placement option').evaluateAll(
   nodes=>nodes.map(node=>node.value));
  assert.ok(slots.length>0,'Real PS1 positions returned');
  const ps1Position=slots.at(-1);
  await page.locator('#angular-ps1-placement').selectOption(ps1Position);
  assert.equal(await page.locator('#ps1-placement').inputValue(),ps1Position);
  assert.equal(await ps1.locator('button').isEnabled(),true);
  await press(ps1.locator('button'));
  let save=await persisted();
  assert.equal(save.ps1Stations?.length,1,'Real PS1 purchased');
  assert.equal(save.ps1Stations[0]?.slotId,ps1Position,'PS1 installed in chosen position');
  assert.ok(save.cash<fixture.cash,'PS1 purchase debits cash');
  // The original application moves to administration on first PS1 purchase.
  // Close the modal administration panel before using the topbar shop button.
  // This exercises the real modal/backdrop instead of bypassing pointer events.
  await press(page.locator('#close-admin'));
  await press(page.locator('#open-shop'));
  await press(page.locator('[data-shop-category="consoles"]'));
  await shop.waitFor({state:'visible'});
  const ps1Disc=shop.locator('.angular-console-grid').first()
   .locator('article').filter({hasText:'Turbo Circuito'}).locator('button');
  assert.equal(await ps1Disc.isEnabled(),true);
  await press(ps1Disc);
  save=await persisted();
  assert.equal(save.ps1Discs?.['turbo-circuito'],1,'Real CD PS1 purchased');
  assert.equal(save.ps1Stations[0]?.discId,'turbo-circuito','PS1 CD inserted automatically');
  const ps2Slots=await page.locator('#angular-ps2-placement option').evaluateAll(
   nodes=>nodes.map(node=>node.value));
  assert.ok(ps2Slots.length>0,'Real PS2 positions returned');
  const ps2Position=ps2Slots[0];
  await page.locator('#angular-ps2-placement').selectOption(ps2Position);
  assert.equal(await page.locator('#ps2-placement').inputValue(),ps2Position);
  assert.equal(await ps2.locator('button').isEnabled(),true);
  await press(ps2.locator('button'));
  save=await persisted();
  assert.equal(save.ps2Stations?.length,1,'Real PS2 purchased');
  assert.equal(save.ps2Stations[0]?.slotId,ps2Position,'PS2 installed in chosen position');
  const ps2Game=shop.locator('.angular-console-grid').last()
   .locator('article').filter({hasText:'Cidade em Fuga'}).locator('button');
  assert.equal(await ps2Game.isEnabled(),true);
  await press(ps2Game);
  save=await persisted();
  assert.equal(save.ps2Games?.['cidade-em-fuga'],1,'Real PS2 game purchased');
  assert.equal(save.ps2Stations[0]?.gameId,'cidade-em-fuga','PS2 media inserted');
  const afterPurchase=save.cash;
  await page.screenshot({path:resolve(output,'integrated-'+width+'.png'),fullPage:true});
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.documentElement.dataset.uiFramework==='angular');
  await page.waitForFunction(()=>!document.querySelector('#menu-continue')?.disabled);
  await press(page.locator('#menu-continue'));
  await press(page.locator('#open-shop'));
  await press(page.locator('[data-shop-category="consoles"]'));
  await shop.waitFor({state:'visible'});
  const restored=await persisted();
  assert.equal(restored.ps1Stations?.length,1,'PS1 bench persisted');
  assert.equal(restored.ps1Discs?.['turbo-circuito'],1,'PS1 disc persisted');
  assert.equal(restored.ps2Stations?.length,1,'PS2 bench persisted');
  assert.equal(restored.ps2Games?.['cidade-em-fuga'],1,'PS2 game persisted');
  assert.ok(restored.cash<=afterPurchase,'Cash was not reset after reload');
  // Exercise actual Angular admin navigation while retaining native management
  // controller as the only authority for selected area and task panels.
  await press(page.locator('#close-shop'));
  await press(page.locator('#open-admin'));
  const area=page.locator('#angular-admin-area-navigation');
  await press(area.locator('[data-angular-admin-tab="services"]'));
  assert.equal(await page.locator('#admin .admin-tabs [data-admin-tab="services"]')
   .getAttribute('aria-selected'),'true','Angular tabs delegate to native admin state');
  await page.locator('#section-services').waitFor({state:'visible'});
  await press(page.locator('#angular-service-workspace [data-angular-task="network"]'));
  assert.equal(await page.locator('#page-services-network').isVisible(),true,
   'Angular services task delegates to native management view');
  await press(area.locator('[data-angular-admin-tab="computers"]'));
  await press(page.locator('#angular-computer-workspace [data-angular-task="hardware"]'));
  assert.equal(await page.locator('#page-computers-hardware').isVisible(),true,
   'Angular computers task opens native hardware panel');
  await press(page.locator('#close-admin'));

  // Save export/import must use the original TypeScript serializer/validator,
  // never serialize game state from an Angular component.
  await press(page.locator('#open-menu'));
  await page.locator('#start-screen').waitFor({state:'visible'});
  await press(page.locator('#menu-options'));
  assert.equal(await page.locator('#menu-settings').isVisible(),true);
  await page.locator('#option-sound').check();
  assert.equal(await page.evaluate(()=>localStorage.getItem('lhs.sound')),'on',
   'Sound settings are persisted by the original preference port');
  const downloadPromise=page.waitForEvent('download');
  await press(page.locator('#save-export'));
  const download=await downloadPromise;
  assert.match(download.suggestedFilename(),/^lan-house-simulator-dia-\\d+\\.json$/);
  const exported=JSON.parse(await readFile(await download.path(),'utf8'));
  assert.equal(exported.format,'softdown-lan-house-save');
  assert.equal(exported.exportVersion,1);
  assert.equal(exported.state.ps1Stations?.length,1);
  assert.equal(exported.state.ps1Discs?.['turbo-circuito'],1);
  assert.equal(exported.state.ps2Stations?.length,1);
  assert.equal(exported.state.ps2Games?.['cidade-em-fuga'],1);

  // Exercise the actual import button and browser file chooser, not a
  // direct game engine import or handcrafted storage write.
  const fileChooserPromise=page.waitForEvent('filechooser');
  await press(page.locator('#save-import'));
  const chooser=await fileChooserPromise;
  page.once('dialog',dialog=>dialog.accept());
  await chooser.setFiles({name:'partida-integrada.json',mimeType:'application/json',
   buffer:Buffer.from(JSON.stringify(exported),'utf8')});
  await page.waitForFunction(()=>
   document.getElementById('save-message')?.textContent?.includes('Partida importada com sucesso'));
  const restoredFromFile=await persisted();
  assert.equal(restoredFromFile.ps1Stations?.length,1,'PS1 survives real file import');
  assert.equal(restoredFromFile.ps2Stations?.length,1,'PS2 survives real file import');
  assert.deepEqual(errors,[],'No runtime JS errors');
  reports.push({width,mobile,ps1Position,ps2Position,ps1Stations:restored.ps1Stations.length,
   ps2Stations:restored.ps2Stations.length,cash:restored.cash,
   adminNavigation:true,soundPreference:true,saveFileRoundtrip:true,
   runtimeErrors:errors.length});
  await context.close();
 }

 // Real engine eligibility tests: no fabricated Angular DTOs or purchase events.
 const blocked=[];
 for(const scenario of [
  {year:2002,cash:15000,width:1280,reason:'PS2 not released'},
  {year:2006,cash:0,width:414,reason:'Insufficient cash'}
 ]){
  const mobile=scenario.width<700;
  const context=await browser.newContext({
   viewport:{width:scenario.width,height:900},isMobile:mobile,hasTouch:mobile
  });
  const state=createGame(3200+scenario.year+scenario.width,'historical');
  state.totalMinutes=(scenario.year-1998)*360*DAY_MINUTES+35;
  state.cash=scenario.cash;state.pcPoweredOff=[true,true,true];
  state.offlineUntil=state.totalMinutes+500;
  await context.addInitScript(({key,save})=>{
   if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify(save));
   localStorage.setItem('lhs.sound','off');
   localStorage.setItem('lhs.privacy-choice.v1',JSON.stringify({version:1,choice:'rejected',at:Date.now()}));
  },{key:GAME_SAVE_KEY,save:state});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  const press=async target=>mobile?target.tap():target.click();
  await page.goto(origin,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.documentElement.dataset.uiFramework==='angular');
  await page.waitForFunction(()=>!document.querySelector('#menu-continue')?.disabled);
  await press(page.locator('#menu-continue'));
  await press(page.locator('#open-shop'));
  await press(page.locator('[data-shop-category="consoles"]'));
  const shop=page.locator('.angular-console-shop');
  await shop.waitFor();
  const ps1=shop.locator(':scope > article.shop-card').first().locator('button');
  const ps2=shop.locator(':scope > article.shop-card').nth(1).locator('button');
  assert.equal(await ps2.isDisabled(),true,scenario.reason+' must block PS2');
  assert.equal(await ps1.isDisabled(),scenario.cash===0,'PS1 cash gate');
  // Native disabled buttons cannot trigger purchases, even programmatically.
  await page.evaluate(()=>{
   const buttons=Array.from(document.querySelectorAll('.angular-console-shop > article.shop-card button'));
   for(const button of buttons)if(button.disabled)button.click();
  });
  const current=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),GAME_SAVE_KEY);
  assert.equal(current.ps1Stations?.length??0,0,'No locked PS1 purchase');
  assert.equal(current.ps2Stations?.length??0,0,'No locked PS2 purchase');
  assert.deepEqual(errors,[],'No runtime errors in locked shop');
  await page.screenshot({
   path:resolve(output,'locked-'+scenario.year+'-'+scenario.width+'.png'),
   fullPage:true
  });
  blocked.push({year:scenario.year,cash:scenario.cash,width:scenario.width,
   ps1Disabled:await ps1.isDisabled(),ps2Disabled:await ps2.isDisabled()});
  await context.close();
 }
 await writeFile(resolve(output,'results.json'),JSON.stringify({reports,blocked,passed:true},null,2));
 console.log('Integrated LHS Angular QA:',JSON.stringify({reports,blocked}));
}finally{
 await browser?.close();
 await new Promise(done=>server.close(done));
}
