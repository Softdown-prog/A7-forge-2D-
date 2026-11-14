/** Browser-only cutover rehearsal: original Canvas game, actual shop ports and save.
 * Production HTML remains unchanged. Angular takes over only the HTTP test response.
 */
import {createRequire} from 'node:module';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import assert from 'node:assert/strict';
import {createAngularCutoverDocument} from './cutover_document.mjs';
import {verifyPrivacyChoices} from './integrated-qa/privacy.mjs';
import {verifyMobileLayoutEditor} from './integrated-qa/mobileLayoutEditor.mjs';
import {verifyAccountDonation} from './integrated-qa/accountDonation.mjs';
import {verifyStockManagement} from './integrated-qa/stockManagement.mjs';
import {verifyConsoleReleaseGates} from './integrated-qa/consoleReleaseGates.mjs';
import {verifyTopGamesMagazineGates} from './integrated-qa/topGamesMagazineGates.mjs';
import {createGame,isValidSave} from '../../dist/js/sim/engine.js';
import {buyPs1Station} from '../../dist/js/sim/ps1.js';
import {TOP_GAMES_ISSUES} from '../../dist/js/sim/topGamesMagazines.js';
import {DAY_MINUTES,GAME_SAVE_KEY} from '../../dist/js/sim/types.js';
import {PS2_GAME_CATALOG} from '../../dist/js/sim/ps2.js';
const tools=createRequire(resolve(import.meta.dirname,'../../.angular-browser-tools/package.json'));
const {chromium}=tools('playwright');
const gameRoot=resolve(import.meta.dirname,'../../dist');
const angularRoot=resolve(import.meta.dirname,'../dist/game-ui/browser');
const output=resolve(import.meta.dirname,'../../out/angular-integrated-browser');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8',
 '.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.json':'application/json',
 '.png':'image/png','.webp':'image/webp','.wav':'audio/wav','.ogg':'audio/ogg'};
const original=await readFile(resolve(gameRoot,'index.html'),'utf8');
const index=createAngularCutoverDocument(original);
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
  const fixture=createGame(2200+width,'historical');delete fixture.topGamesUnlockMode;
  fixture.totalMinutes=8*360*DAY_MINUTES+35; // 2006
  fixture.cash=15000;fixture.pcPoweredOff=[true,true,true];
  fixture.pcWear=[19,53,82]; // Deterministic real-save wear for health UI QA.
  fixture.offlineUntil=fixture.totalMinutes+500;
  fixture.weather='rain';
  // A known real notice from the native save, not a mocked Angular snapshot.
  const mailId='y2k-warning',mailTitle='QA auditoria Angular — carta real';
  const unsafeBody='Texto de auditoria <img src=x onerror="window.__mailInjection=1">';
  fixture.notices=[{id:mailId,title:mailTitle,body:unsafeBody,
   day:Math.floor(fixture.totalMinutes/DAY_MINUTES)+1,read:false,severity:'urgent'}];
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
  assert.equal(await page.locator('#angular-save-transfer #save-export').count(),1,
   'Angular export button mounted before native bootstrap');
  assert.equal(await page.locator('#angular-save-transfer #save-import-file').count(),1,
   'Angular file picker retains stable input ID');
  assert.equal(await page.locator('#angular-menu-preferences #option-sound').count(),1,
   'Angular sound component owns the preferences');
  assert.equal(await page.locator('#save-export').count(),1,'No duplicate save DOM IDs');
  await page.waitForFunction(()=>!document.querySelector('#menu-continue')?.disabled);
  await press(page.locator('#menu-continue'));
  await page.locator('#game-app').waitFor({state:'visible'});
  assert.equal(await page.locator('#game').count(),1,'Real Canvas game exists');
  // Real Angular components receive snapshots from the actual game ports.
  // Source-of-truth is the loaded save, not a manually dispatched DOM event.
  assert.equal(await page.locator('#angular-time-weather #time-weather-panel').count(),1,
   'Exactly one Angular weather panel is mounted');
  assert.equal(await page.locator('#time-weather-panel').count(),1,'No duplicate calendar IDs');
  assert.equal(await page.locator('#angular-notice-inbox #notices').count(),1,
   'Exactly one Angular mail dialog is mounted');
  assert.equal(await page.locator('#notices').count(),1,'No duplicate mail dialog');
  await page.waitForFunction(()=>document.querySelector('#weather-hud')?.textContent?.includes('Chuva'));
  assert.match(await page.locator('#weather-hud').innerText(),/Chuva/);
  await press(page.locator('#time-weather-panel summary'));
  assert.equal(await page.locator('#time-weather-panel').getAttribute('open'),'',
   'Calendar opens using native details semantics');
  assert.match(await page.locator('#time-weather-condition').innerText(),/Chuva/);
  assert.match(await page.locator('#time-weather-effect').innerText(),/reduz a procura/);
  assert.match(await page.locator('#time-weather-date').innerText(),/2006/);
  await press(page.locator('#time-weather-panel summary'));
  assert.equal(await page.locator('#time-weather-panel').getAttribute('open'),null,
   'Calendar closes on the same toggle');
  assert.equal(await page.locator('#open-notices').getAttribute('aria-expanded'),'false');
  await press(page.locator('#open-notices'));
  const inbox=page.locator('#angular-notice-inbox #notices');
  await inbox.waitFor({state:'visible'});
  assert.equal(await inbox.getAttribute('role'),'dialog');
  assert.equal(await inbox.getAttribute('aria-modal'),'true');
  assert.equal(await page.locator('#notices-list[data-angular-owned="true"]').count(),1,
   'Native controller must not replace Angular-owned mail list');
  const letter=page.locator('#notices-list .notice-letter').filter({hasText:mailTitle});
  await letter.waitFor({state:'visible'});
  assert.equal(await letter.count(),1,'Real saved letter appears once');
  assert.match(await letter.innerText(),/Texto de auditoria <img/);
  assert.equal(await letter.locator('img').count(),0,'HTML in a letter must be escaped');
  assert.equal(await page.evaluate(()=>window.__mailInjection),undefined,
   'Untrusted letter text cannot execute JavaScript');
  const initialUnread=Number(await page.locator('#notices-count').innerText());
  assert.ok(initialUnread>=1,'Real unread notice must be counted');
  assert.equal(await page.locator('#open-notices').getAttribute('aria-expanded'),'true');
  await press(letter.locator('[data-notice-read="y2k-warning"]'));
  await page.waitForFunction(key=>{
   const saved=JSON.parse(localStorage.getItem(key)??'{}');
   return saved.notices?.some(n=>n.id==='y2k-warning'&&n.read===true);
  },GAME_SAVE_KEY);
  await page.waitForFunction(count=>
   Number(document.querySelector('#notices-count')?.textContent)===count-1,initialUnread);
  await page.waitForFunction(title=>{
   const cards=[...document.querySelectorAll('#notices-list .notice-letter')];
   const card=cards.find(node=>node.querySelector('h3')?.textContent?.includes(title));
   return card?.classList.contains('read')&&
    !card.querySelector('[data-notice-read="y2k-warning"]');
  },mailTitle,{timeout:10000});
  assert.match(await letter.getAttribute('class'),/\bread\b/);
  assert.equal(await letter.locator('[data-notice-read="y2k-warning"]').count(),0,
   'Already-read notice cannot be read again');
  await page.screenshot({path:resolve(output,'mail-'+width+'.png'),fullPage:true});
  await press(page.locator('#close-notices'));
  await inbox.waitFor({state:'hidden'});
  assert.equal(await page.locator('#open-notices').getAttribute('aria-expanded'),'false');
  if(!mobile){
   await page.locator('#open-notices').focus();
   assert.equal(await page.evaluate(()=>document.activeElement?.id),'open-notices',
    'Mail trigger must receive keyboard focus');
   await page.keyboard.press('Enter');
   await page.locator('#notices').waitFor({state:'visible'});
   assert.equal(await page.locator('#open-notices').getAttribute('aria-expanded'),'true');
   await page.keyboard.press('Escape');
   // A window handles Escape before the global gameplay shortcut. Do not
   // abandon the running campaign or force the player back through Continue.
   await page.locator('#notices').waitFor({state:'hidden'});
   assert.equal(await page.locator('#game-app').isVisible(),true,
    'Escape closes the mail dialog without leaving the game');
   assert.equal(await page.locator('#start-screen').isVisible(),false,
    'Escape must not reopen the main menu while a dialog owns focus');
  }

  await press(page.locator('#open-shop'));
  // Candidate cutover also replaces the native shop overview controls, not
  // merely the catalogue. The original TypeScript shop port still owns state
  // and command handlers; Angular creates each stable native ID once.
  const shopOverview=page.locator('#angular-shop-overview');
  assert.equal(await shopOverview.count(),1,'One Angular organization host');
  for(const id of ['shop-cash','organize-furniture','demolish-walls']){
   assert.equal(await page.locator('#'+id).count(),1,
    'Exactly one TypeScript shop control survives Angular cutover: '+id);
  }
  await page.waitForFunction(()=>{
   const cash=document.querySelector('#angular-shop-overview #shop-cash');
   const label=cash?.textContent?.trim()??'';
   return label.startsWith('Caixa R$ ')&&label.includes(' · PCs ');
  });
  // The Angular search must filter the VISIBLE Angular projection,
  // not just the hidden native command catalog.
  await press(page.locator('[data-shop-category="equipment"]'));
  await page.waitForFunction(()=>
   document.querySelector('#react-shop-categories [data-shop-category="equipment"]')?.getAttribute('aria-pressed')==='true');
  const visibleCards=page.locator('#angular-shop-catalog .angular-catalog-grid > article.shop-card');
  await page.waitForFunction(()=>document.querySelectorAll(
   '#angular-shop-catalog .angular-catalog-grid > article.shop-card').length>0);
  const originalCount=await visibleCards.count();
  assert.ok(originalCount>0,'Equipment catalog has real projected cards');
  await page.locator('#react-shop-query').fill('zzz-qa-nenhum-item-999');
  await page.waitForFunction(()=>document.querySelectorAll(
   '#angular-shop-catalog .angular-catalog-grid > article.shop-card').length===0);
  assert.equal(await visibleCards.count(),0,'Filtering removes unmatched Angular cards');
  assert.match(await page.locator('#react-shop-search').innerText(),/Nenhum cartão/);
  await press(page.getByRole('button',{name:'Limpar busca'}));
  await page.waitForFunction(expected=>document.querySelectorAll(
   '#angular-shop-catalog .angular-catalog-grid > article.shop-card').length===expected,originalCount);
  assert.equal(await visibleCards.count(),originalCount,'Clearing search restores all Angular cards');
  // Switching category must reset a live query via the native shop selection event.
  await page.locator('#react-shop-query').fill('zzz-qa-redefinir-categoria-999');
  await press(page.locator('[data-shop-category="consoles"]'));
  await page.waitForFunction(()=>
   (document.querySelector('#react-shop-query')?.value??'NOT_READY')==='');
  assert.equal(await page.locator('#react-shop-query').inputValue(),'');
  await page.waitForFunction(()=>
   document.querySelector('#react-shop-categories [data-shop-category="consoles"]')?.getAttribute('aria-pressed')==='true'&&
   document.querySelector('#react-shop-categories [data-shop-category="equipment"]')?.getAttribute('aria-pressed')==='false');
  const shop=page.locator('.angular-console-shop');
  await shop.waitFor({state:'visible'});
  // Production-style browser QA: all thirteen procedural covers must have visible,
  // decoded artwork in the actual Angular game (not just image elements).
  const ps1Covers=shop.locator('.angular-console-grid').first().locator('img.angular-ps1-cover');
  assert.equal(await ps1Covers.count(),13,'All PS1 covers are projected by 2006');
  await page.waitForFunction(()=>Array.from(document.querySelectorAll(
   '.angular-ps1-cover')).length===13 &&
   Array.from(document.querySelectorAll('.angular-ps1-cover')).every(img=>
    img.complete && img.naturalWidth===420 && img.naturalHeight===560));
  const coverSources=await ps1Covers.evaluateAll(images=>images.map(img=>img.getAttribute('src')));
  assert.ok(coverSources.every(src=>src?.startsWith('data:image/png;base64,')),
   'Procedural PS1 art must not depend on requests to external paths');
  assert.equal(new Set(coverSources).size,13,'Each PS1 game must have unique artwork');
  // PS2 yearly catalogue has seven released games in 2006. Their covers must
  // be visibly painted and fully decoded across desktop and mobile.
  const ps2Covers=shop.locator('.angular-console-grid').last().locator('img.angular-ps2-cover');
  assert.equal(await ps2Covers.count(),7,'Seven PS2 launch-year games have artwork');
  // The browser intentionally lazy-loads covers far below the PS1 catalogue.
  // Bring every real PS2 card into view to request/paint it before checking decode.
  // Otherwise waiting for offscreen loading="lazy" images can never complete.
  for(let i=0;i<await ps2Covers.count();i++){
   const image=ps2Covers.nth(i);
   await image.scrollIntoViewIfNeeded();
   try{
    await image.evaluate(img=>img.decode());
   }catch(error){
    const diagnostic=await image.evaluate(img=>({
     src:img.getAttribute('src')?.slice(0,100),complete:img.complete,
     width:img.naturalWidth,height:img.naturalHeight
    }));
    throw new Error('PS2 cover '+i+' failed to decode: '+JSON.stringify(diagnostic),{cause:error});
   }
   const dimension=await image.evaluate(img=>({width:img.naturalWidth,height:img.naturalHeight}));
   assert.ok(dimension.width>0&&dimension.height>0,
    'PS2 cover '+i+' has no decoded dimensions: '+JSON.stringify(dimension));
  }
  const ps2CoverSources=await ps2Covers.evaluateAll(images=>images.map(img=>img.getAttribute('src')));
  assert.ok(ps2CoverSources.every(src=>src?.startsWith('data:image/png;base64,')||
    ((src?.startsWith('assets/ps2/covers/')||src?.startsWith('./assets/ps2/covers/'))&&src.endsWith('.svg'))),
   'PS2 artwork must be original PNG or bundled local SVG, never external images');
  assert.equal(new Set(ps2CoverSources).size,7,'Each 2006 PS2 game needs unique artwork');
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
  assert.equal(await page.locator('#angular-time-weather #weather-hud').count(),1);
  assert.equal(await page.locator('#angular-notice-inbox #notices').count(),1);
  const reopenedMail=await persisted();
  assert.equal(reopenedMail.notices.find(n=>n.id==='y2k-warning')?.read,true,
   'Real mail read state survives a browser reload');
  assert.equal(await page.evaluate(()=>window.__mailInjection),undefined);
  assert.equal(await page.locator('#angular-save-transfer #save-export').count(),1,
   'Angular export button mounted before native bootstrap');
  assert.equal(await page.locator('#angular-save-transfer #save-import-file').count(),1,
   'Angular file picker retains stable input ID');
  assert.equal(await page.locator('#angular-menu-preferences #option-sound').count(),1,
   'Angular sound component owns the preferences');
  assert.equal(await page.locator('#save-export').count(),1,'No duplicate save DOM IDs');
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
  // A top-level area switch is authored in the native TypeScript controller;
  // Angular must mirror its accessible selected tab on the next render.
  const awaitAdminAreaParity=async chosenArea=>page.waitForFunction(chosenArea=>{
   const native=document.querySelector('#admin .admin-tabs [data-admin-tab="'+chosenArea+'"]');
   const angular=document.querySelector('#angular-admin-area-navigation [data-angular-admin-tab="'+chosenArea+'"]');
   return native?.getAttribute('aria-selected')==='true'&&
    angular?.getAttribute('aria-selected')==='true';
  },chosenArea,{timeout:5000});
  await press(area.locator('[data-angular-admin-tab="services"]'));
  await awaitAdminAreaParity('services');
  assert.equal(await page.locator('#admin .admin-tabs [data-admin-tab="services"]')
   .getAttribute('aria-selected'),'true','Angular tabs delegate to native admin state');
  await page.locator('#section-services').waitFor({state:'visible'});
  await press(page.locator('#angular-service-workspace [data-angular-task="network"]'));
  assert.equal(await page.locator('#page-services-network').isVisible(),true,
   'Angular services task delegates to native management view');
  await press(area.locator('[data-angular-admin-tab="computers"]'));
  await awaitAdminAreaParity('computers');
  await press(page.locator('#angular-computer-workspace [data-angular-task="hardware"]'));
  assert.equal(await page.locator('#page-computers-hardware').isVisible(),true,
   'Angular computers task opens native hardware panel');
  // Verify real Angular PC-health updates and native actions on each width.
  // No synthetic Angular events: all snapshots come from the active game.
  const pcWorkspace=page.locator('#angular-computer-workspace');
  const pcHealth=pcWorkspace.locator('.angular-pc-health');
  await pcHealth.waitFor({state:'visible'});
  await page.waitForFunction(()=>{
   const text=document.querySelector('#angular-computer-workspace .angular-pc-health')?.textContent??'';
   return text.includes('Instalados')&&text.includes('3')&&
    text.includes('Desligados')&&text.includes('Com defeito')&&
    text.includes('Em reparo')&&text.includes('Desgaste médio');
  },null,{timeout:10000});
  assert.match(await pcHealth.innerText(),/Desgaste médio\s*\d+%/);
  assert.ok(await pcHealth.evaluate(node=>node.scrollWidth-node.clientWidth)<=3,
   'PC health summary does not overflow at '+width+' px');

  // Angular station buttons forward to the native hardware selection.
  await page.waitForFunction(()=>
   document.querySelectorAll('#angular-computer-workspace [data-angular-station]').length>=3);
  const angularStations=pcWorkspace.locator('[data-angular-station]');
  assert.equal(await angularStations.count(),3,'Three hardware stations available');
  const beforeStation=await persisted();
  await press(pcWorkspace.locator('[data-angular-station="1"]'));
  await page.waitForFunction(()=>
   document.querySelector('#hardware-select-1')?.getAttribute('aria-pressed')==='true'&&
   document.querySelector('#angular-computer-workspace [data-angular-station="1"]')
    ?.getAttribute('aria-pressed')==='true');
  await page.evaluate(()=>document.querySelector('#hardware-select-0')?.click());
  await page.waitForFunction(()=>
   document.querySelector('#hardware-select-0')?.getAttribute('aria-pressed')==='true'&&
   document.querySelector('#angular-computer-workspace [data-angular-station="0"]')
    ?.getAttribute('aria-pressed')==='true');
  assert.equal((await persisted()).cash,beforeStation.cash,
   'Selecting a station cannot change cash');

  // Power button remains native and modifies the saved PC power state.
  await press(pcWorkspace.locator('[data-angular-task="operations"]'));
  await page.locator('#pc-power-0').waitFor({state:'visible'});
  assert.equal(await page.locator('#pc-power-0').isEnabled(),true,
   'Idle offline station can be switched on');
  await press(page.locator('#pc-power-0'));
  await page.waitForFunction(key=>{
   const save=JSON.parse(localStorage.getItem(key)??'{}');
   return save.pcPoweredOff?.[0]===false;
  },GAME_SAVE_KEY);
  await page.waitForFunction(()=>
   document.querySelector('#angular-computer-workspace .angular-pc-health')
    ?.textContent?.includes('Desligados 2'));
  await press(page.locator('#pc-power-0'));
  await page.waitForFunction(key=>{
   const save=JSON.parse(localStorage.getItem(key)??'{}');
   return save.pcPoweredOff?.[0]===true;
  },GAME_SAVE_KEY);
  await page.waitForFunction(()=>
   document.querySelector('#angular-computer-workspace .angular-pc-health')
    ?.textContent?.includes('Desligados 3'));
  assert.equal(await page.locator('[data-pc-repair="0"]').count(),1,
   'Native PC repair action remains present');
  assert.equal((await persisted()).cash,beforeStation.cash,
   'Power buttons cannot debit cash');
  assert.ok(await pcWorkspace.evaluate(node=>node.scrollWidth-node.clientWidth)<=3,
   'PC workspace stays responsive at '+width+' px');
  await page.screenshot({path:resolve(output,'pc-maintenance-'+width+'.png'),fullPage:true});

  // Navigate finance through Angular commands. The original TypeScript manager
  // still moves/shows the actual panes; no mutation or reset is performed.
  await press(area.locator('[data-angular-admin-tab="finance"]'));
  await awaitAdminAreaParity('finance');
  const financeNav=page.locator('#angular-finance-workspace');
  const nativeFinance=page.locator('#admin .admin-tabs [data-admin-tab="finance"]');
  assert.equal(await nativeFinance.getAttribute('aria-selected'),'true',
   'Angular finance area delegates to native admin state');
  const financeSnapshot=await persisted();
  // Native state changes synchronously; the zoneless Angular OnPush view
  // commits the reflected aria-pressed state on its next render turn.
  const awaitTaskParity=async (taskArea,task)=>page.waitForFunction(({area,task})=>{
   const native=document.querySelector('#section-'+area+
    ' > .management-pages button[data-panel-choice="'+task+'"]');
   const angular=document.querySelector('#angular-'+area+
    '-workspace [data-angular-task="'+task+'"]');
   return native?.getAttribute('aria-pressed')==='true'&&
    angular?.getAttribute('aria-pressed')==='true';
  },{area:taskArea,task},{timeout:5000});
  for(const task of ['balance','usage','events','promotion','feedback','restart']){
   await press(financeNav.locator('[data-angular-task="'+task+'"]'));
   await awaitTaskParity('finance',task);
   assert.equal(await page.locator('#page-finance-'+task).isVisible(),true,
    'Angular finance task opens native panel '+task);
   assert.equal(await page.locator('#section-finance > .management-page:visible').count(),1,
    'Exactly one finance task visible');
   assert.equal(await financeNav.locator('[data-angular-task="'+task+'"]')
    .getAttribute('aria-pressed'),'true','Angular selection synchronized '+task);
  }
  assert.equal(await page.locator('#reset-game').isVisible(),true,
   'Reset action stays in native management page and requires a separate click');
  // An external legacy controller can change the selected page without an
  // Angular click. Its custom event must still update the Angular button.
  await page.evaluate(()=>document.querySelector(
   '#section-finance > .management-pages button[data-panel-choice="usage"]')?.click());
  await awaitTaskParity('finance','usage');
  assert.equal(await page.locator('#page-finance-usage').isVisible(),true,
   'Native-only page change stays synchronized in Angular');
  await press(financeNav.locator('[data-angular-task="restart"]'));
  await awaitTaskParity('finance','restart');
  assert.equal(await page.locator('#reset-game').isVisible(),true,
   'Returning to restart tab does not trigger the destructive button');
  const afterFinance=await persisted();
  assert.equal(afterFinance.ps1Stations?.length,financeSnapshot.ps1Stations?.length,
   'Finance navigation cannot reset PS1 stations');
  assert.equal(afterFinance.ps2Stations?.length,financeSnapshot.ps2Stations?.length,
   'Finance navigation cannot reset PS2 stations');
  assert.equal(afterFinance.cash>=0,true,'Finance navigation must not corrupt cash');
  assert.equal(await page.locator('#admin').evaluate(el=>el.scrollWidth-el.clientWidth)<=3,true,
   'Finance task grid fits desktop and mobile without horizontal overflow');

  // The next three Angular workspaces only navigate existing native task panes.
  // They must not buy media, edit prices or license any station on a click.
  const adminTaskMatrix=[
   {area:'prices',pages:['hourly','insights','retail','printing','discs']},
   {area:'licenses',pages:['windows','classic','gpu']},
   {area:'consoles',pages:['stations','pricing','discs']}
  ];
  const beforeTaskSwitch=await persisted();
  for(const group of adminTaskMatrix){
   await press(area.locator('[data-angular-admin-tab="'+group.area+'"]'));
   await awaitAdminAreaParity(group.area);
   const nav=page.locator('#angular-'+group.area+'-workspace');
   assert.equal(await nav.count(),1,'One Angular navigation root '+group.area);
   assert.equal(await nav.evaluate(el=>el.parentElement?.id),'section-'+group.area,
    'Angular workspace must not be moved into a native page: '+group.area);
   assert.equal(await nav.isVisible(),true,
    'Angular task grid must remain visible after native management mount');
   for(const task of group.pages){
    const button=nav.locator('[data-angular-task="'+task+'"]');
    await press(button);
    await awaitTaskParity(group.area,task);
    assert.equal(await page.locator('#page-'+group.area+'-'+task).isVisible(),true,
     'Angular task forwards native '+group.area+'/'+task);
    assert.equal(await page.locator('#section-'+group.area+' > .management-page:visible').count(),1,
     'Only one native task page shown: '+group.area);
    assert.equal(await button.getAttribute('aria-pressed'),'true',
     'Angular task selection follows native manager: '+group.area+'/'+task);
   }
   assert.ok(await page.locator('#admin').evaluate(el=>el.scrollWidth-el.clientWidth)<=3,
    'No horizontal overflow in '+group.area+' at '+width);
  }
  const afterTaskSwitch=await persisted();
  assert.equal(afterTaskSwitch.ps1Discs?.['turbo-circuito'],
   beforeTaskSwitch.ps1Discs?.['turbo-circuito'],
   'Navigation alone cannot purchase another PS1 disc');
  assert.equal(afterTaskSwitch.ps2Games?.['cidade-em-fuga'],
   beforeTaskSwitch.ps2Games?.['cidade-em-fuga'],
   'Navigation alone cannot purchase a PS2 game');
  assert.equal(afterTaskSwitch.ps2Stations?.length,beforeTaskSwitch.ps2Stations?.length,
   'Console navigation cannot purchase stations');
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
  assert.match(download.suggestedFilename(),/^lan-house-simulator-dia-\d+\.json$/);
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
   adminNavigation:true,pcMaintenance:true,soundPreference:true,saveFileRoundtrip:true,
   angularMenuComponents:true,
   runtimeErrors:errors.length});
  await context.close();
 }

 const privacyChoices=await verifyPrivacyChoices({browser,origin,createGame,GAME_SAVE_KEY});

 const layoutEditorResults=await verifyMobileLayoutEditor({browser,origin,output,createGame,GAME_SAVE_KEY});

 const accountDonationResults=await verifyAccountDonation({browser,origin,output,createGame,GAME_SAVE_KEY});

 const stockManagementResults=await verifyStockManagement({browser,origin,output,createGame,DAY_MINUTES,GAME_SAVE_KEY});

 const blocked=await verifyConsoleReleaseGates({browser,origin,output,createGame,TOP_GAMES_ISSUES,DAY_MINUTES,GAME_SAVE_KEY});

 const magazineShop=await verifyTopGamesMagazineGates({browser,origin,createGame,isValidSave,buyPs1Station,TOP_GAMES_ISSUES,DAY_MINUTES,GAME_SAVE_KEY});

 await writeFile(resolve(output,'results.json'),JSON.stringify({reports,blocked,magazineShop,privacyChoices,layoutEditorResults,accountDonationResults,stockManagementResults,passed:true},null,2));
 console.log('Integrated LHS Angular QA:',JSON.stringify({reports,blocked,privacyChoices,layoutEditorResults,accountDonationResults,stockManagementResults}));
}finally{
 await browser?.close();
 await new Promise(done=>server.close(done));
}
