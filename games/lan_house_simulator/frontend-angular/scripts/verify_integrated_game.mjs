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
// Rehearse real Angular save/options components, without altering production HTML.
// Keeping all original IDs allows the same native TypeScript event controllers.
const saveStart=original.indexOf('<div class="save-actions" aria-label="Transferir progresso">');
const saveMessage=original.indexOf('<p id="save-message"',saveStart);
const saveEnd=original.indexOf('</p>',saveMessage)+4;
const settingsStart=original.indexOf('<div id="menu-settings"',saveEnd);
const settingsEnd=original.indexOf('</div>',settingsStart)+6;
assert.ok(saveStart>0&&saveMessage>saveStart&&saveEnd>saveMessage,'Native save controls found');
assert.ok(settingsStart>saveEnd&&settingsEnd>settingsStart,'Native sound options found');
const nativeSaveMarkup=original.slice(saveStart,saveEnd);
const nativeSettingsMarkup=original.slice(settingsStart,settingsEnd);
const cutoverShell=original
 .replace(nativeSaveMarkup,'<div id="angular-save-transfer"></div>')
 .replace(nativeSettingsMarkup,'<div id="angular-menu-preferences"></div>');
const reactEntry='<script type="module" src="./js/react-entry.js"></script>';
const shopEntry='<div id="shop-catalog" class="shop-grid"></div>';
assert.equal(original.split(reactEntry).length,2,'One React bootstrap expected');
assert.equal(original.split(shopEntry).length,2,'One native catalogue expected');
// Replace ONLY the HTTP test response: Angular renders the real calendar and
// inbox, while all controller actions and business state stay TypeScript-owned.
const timeStart=cutoverShell.indexOf('<details class="time-weather-panel" id="time-weather-panel">');
const timeEnd=cutoverShell.indexOf('</details>',timeStart)+'</details>'.length;
const mailStart=cutoverShell.indexOf('<section id="notices" class="admin notice-inbox"');
const mailEnd=cutoverShell.indexOf('</section>',mailStart)+'</section>'.length;
assert.ok(timeStart>0&&timeEnd>timeStart,'Native time/weather panel boundary exists');
assert.ok(mailStart>timeEnd&&mailEnd>mailStart,'Native notice dialog boundary exists');
const statusMailShell=cutoverShell
 .slice(0,mailStart)+'<div id="angular-notice-inbox"></div>'+cutoverShell.slice(mailEnd);
const mailAdjustedTimeStart=statusMailShell.indexOf('<details class="time-weather-panel" id="time-weather-panel">');
const mailAdjustedTimeEnd=statusMailShell.indexOf('</details>',mailAdjustedTimeStart)+'</details>'.length;
const integratedShell=statusMailShell.slice(0,mailAdjustedTimeStart)+
 '<div id="angular-time-weather"></div>'+statusMailShell.slice(mailAdjustedTimeEnd);
assert.ok(!integratedShell.includes('<section id="notices"'),'Native mail dialog must not coexist');
assert.ok(!integratedShell.includes('<details class="time-weather-panel" id="time-weather-panel">'),
 'Native calendar must not coexist with Angular-owned panel');

const index=integratedShell.replace(reactEntry,'<script type="module" src="./__angular/main.js"></script>')
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
   await page.locator('#start-screen').waitFor({state:'visible'});
   await press(page.locator('#menu-continue'));
   await page.locator('#game-app').waitFor({state:'visible'});
  }

  await press(page.locator('#open-shop'));
  // The Angular search must filter the VISIBLE Angular projection,
  // not just the hidden native command catalog.
  await press(page.locator('[data-shop-category="equipment"]'));
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
   adminNavigation:true,soundPreference:true,saveFileRoundtrip:true,
   angularMenuComponents:true,
   runtimeErrors:errors.length});
  await context.close();
 }

 // Privacy must remain optional when React is replaced by Angular.
 // Exercise the real banner and storage controller rather than injecting a
 // previously accepted choice or simulating a custom DOM event.
 const privacyChoices=[];
 for(const scenario of [
  {width:1280,choice:'accepted'},
  {width:414,choice:'rejected'},
  {width:360,choice:'accepted'}
 ]){
  const mobile=scenario.width<700;
  const context=await browser.newContext({
   viewport:{width:scenario.width,height:900},isMobile:mobile,hasTouch:mobile
  });
  const fixture=createGame(7300+scenario.width,'historical');
  await context.addInitScript(({key,save})=>{
   if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify(save));
   localStorage.setItem('lhs.sound','off');
   // Do NOT prefill the privacy key: test the first-visit decision.
  },{key:GAME_SAVE_KEY,save:fixture});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  const press=async target=>mobile?target.tap():target.click();
  await page.goto(origin,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.documentElement.dataset.uiFramework==='angular');
  const banner=page.locator('#privacy-banner');
  await banner.waitFor({state:'visible'});
  assert.equal(await page.locator('#privacy-accept').count(),1,'One accept button');
  assert.equal(await page.locator('#privacy-reject').count(),1,'One reject button');
  const control=scenario.choice==='accepted'?'#privacy-accept':'#privacy-reject';
  await press(page.locator(control));
  await banner.waitFor({state:'hidden'});
  const consent=await page.evaluate(()=>JSON.parse(
   localStorage.getItem('lhs.privacy-choice.v1')??'null'));
  assert.equal(consent.version,1,'Consent version stored by native controller');
  assert.equal(consent.choice,scenario.choice,'Actual consent decision persisted');
  assert.ok(Math.abs(Date.now()-consent.at)<60000,'Consent timestamp is recent');
  assert.ok(await page.evaluate(key=>Boolean(localStorage.getItem(key)),GAME_SAVE_KEY),
   'Consent decision does not erase essential save storage');
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.documentElement.dataset.uiFramework==='angular');
  await banner.waitFor({state:'hidden'});
  assert.equal(await banner.isHidden(),true,'Valid choice is retained on reload');

  // After 30 days both acceptance and rejection must expire; no silent renewal.
  await page.evaluate(()=>{
   const key='lhs.privacy-choice.v1';
   const old=JSON.parse(localStorage.getItem(key));
   old.at=Date.now()-31*24*60*60*1000;
   localStorage.setItem(key,JSON.stringify(old));
  });
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.documentElement.dataset.uiFramework==='angular');
  await banner.waitFor({state:'visible'});
  await press(page.locator('#privacy-reject'));
  await banner.waitFor({state:'hidden'});
  await page.waitForFunction(()=>!document.querySelector('#menu-continue')?.disabled);
  await press(page.locator('#menu-continue'));
  await page.locator('#game-app').waitFor({state:'visible'});
  assert.equal(await page.locator('#game').count(),1,
   'Game continues with essential storage after privacy rejection');
  assert.deepEqual(errors,[],'No JavaScript exceptions during consent and expiry');
  privacyChoices.push({width:scenario.width,initial:scenario.choice,
   expiresAfter30Days:true,essentialSaveIntact:true,runtimeErrors:errors.length});
  await context.close();
 }

 // Real-browser mobile editor regression: tap selects an on-screen PC, move
 // uses a Canvas touch destination, rotate/confirm persist through the native
 // application port. No Angular component writes to the save.
 const layoutEditorResults=[];
 for(const width of [414,360]){
  const context=await browser.newContext({
   viewport:{width,height:900},isMobile:true,hasTouch:true
  });
  const fixture=createGame(9400+width,'historical');
  fixture.cash=15000;
  fixture.pcPoweredOff=[true,true,true];
  fixture.offlineUntil=fixture.totalMinutes+500;
  await context.addInitScript(({key,save})=>{
   if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify(save));
   localStorage.setItem('lhs.sound','off');
   localStorage.setItem('lhs.privacy-choice.v1',JSON.stringify({
    version:1,choice:'rejected',at:Date.now()
   }));
  },{key:GAME_SAVE_KEY,save:fixture});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  const persisted=()=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)),GAME_SAVE_KEY);
  await page.goto(origin,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.documentElement.dataset.uiFramework==='angular');
  await page.waitForFunction(()=>!document.querySelector('#menu-continue')?.disabled);
  await page.locator('#menu-continue').tap();
  await page.locator('#game-app').waitFor({state:'visible'});
  await page.locator('#open-shop').tap();
  await page.locator('#organize-furniture').tap();
  const editor=page.locator('#layout-editor');
  await editor.waitFor({state:'visible'});
  assert.equal(await page.locator('#shop').isHidden(),true,
   'Native editor takes over from Angular shop without overlay collision');

  // Compute an actual on-screen projection using the game's compiled
  // isometric renderer and immutable save snapshot; the canvas receives a
  // genuine Chromium touchscreen tap, NOT a synthetic dispatchEvent.
  const worldTouch=async point=>page.evaluate(async({key,target})=>{
   const state=JSON.parse(localStorage.getItem(key));
   const {iso,cameraForGame}=await import('./js/render/isometric.js');
   const canvas=document.querySelector('#game');
   const viewport=document.querySelector('#scene-viewport');
   viewport.scrollIntoView({block:'center',behavior:'instant'});
   const pixel=iso(target,cameraForGame(state),target.height??0);
   const dx=pixel.x/canvas.width*canvas.offsetWidth;
   const dy=pixel.y/canvas.height*canvas.offsetHeight;
   viewport.scrollLeft=Math.max(0,dx-viewport.clientWidth/2);
   viewport.scrollTop=Math.max(0,dy-viewport.clientHeight/2);
   const rect=canvas.getBoundingClientRect();
   const x=rect.left+pixel.x/canvas.width*rect.width;
   const y=rect.top+pixel.y/canvas.height*rect.height;
   if(x<0||y<0||x>=innerWidth||y>=innerHeight)
    throw Error('Canvas destination outside mobile viewport: '+JSON.stringify({x,y,width:innerWidth,height:innerHeight}));
   return {x,y};
  },{key:GAME_SAVE_KEY,target:point});
  const source=await page.evaluate(async key=>{
   const state=JSON.parse(localStorage.getItem(key));
   const {editableObjects}=await import('./js/sim/editableObjects.js');
   return editableObjects(state).find(o=>o.id==='pc:0');
  },GAME_SAVE_KEY);
  assert.ok(source,'Original PC exists in actual save');
  const hit=await worldTouch({x:source.x+source.w/2,
   y:source.y+source.d/2,height:50});
  await page.touchscreen.tap(hit.x,hit.y);
  assert.equal(await page.locator('#layout-object').inputValue(),'pc:0',
   'Real touch on the Canvas selects PC 0 without a second compatibility click');

  const initial=await persisted(),initialMoney=initial.cash;
  await page.locator('#layout-rotate').tap();
  // This valid destination is also covered by the authoritative engine test.
  const destination=await worldTouch({x:2.5+source.w/2,y:3+source.d/2});
  await page.touchscreen.tap(destination.x,destination.y);
  assert.equal(await page.locator('#layout-confirm').isEnabled(),true,
   'Native placement validation approves the selected world-space target');
  await page.locator('#layout-confirm').tap();
  let saved=await persisted();
  const placed=saved.objectPlacements?.find(p=>p.id==='pc:0');
  assert.deepEqual(placed,{id:'pc:0',x:2.5,y:3,rotation:1},
   'Mobile Canvas selection, rotation and move are saved exactly once');
  assert.equal(saved.cash,initialMoney,'Free editor move does not change cash');

  // Removing existing decoration must require confirmation and cannot be
  // silently triggered by a mobile touch or the compatibility click.
  await page.locator('#layout-object').selectOption('built-poster:2');
  assert.equal(await page.locator('#layout-remove').isEnabled(),true);
  await page.locator('#layout-remove').tap();
  await page.locator('#layout-removal').waitFor({state:'visible'});
  await page.locator('#layout-removal-cancel').tap();
  assert.equal((await persisted()).removedBuiltPosters?.includes(2)??false,false,
   'Cancellation leaves the built-in poster untouched');
  await page.locator('#layout-remove').tap();
  await page.locator('#layout-removal-confirm').tap();
  saved=await persisted();
  assert.ok(saved.removedBuiltPosters?.includes(2),
   'Confirmed poster removal persists via the native port');
  assert.equal(saved.cash,initialMoney,'Removing decoration gives no refund');
  await page.screenshot({path:resolve(output,'mobile-layout-'+width+'.png'),fullPage:true});
  await page.locator('#layout-close').tap();
  await editor.waitFor({state:'hidden'});
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.documentElement.dataset.uiFramework==='angular');
  const restored=await persisted();
  assert.deepEqual(restored.objectPlacements?.find(p=>p.id==='pc:0'),placed,
   'Mobile moved and rotated PC survives real reload');
  assert.ok(restored.removedBuiltPosters?.includes(2),
   'Removed poster stays removed after reload');
  assert.deepEqual(errors,[],'No runtime errors during mobile layout editing');
  layoutEditorResults.push({width,canvasTouch:true,rotation:placed.rotation,
   movedPc:true,confirmedRemoval:true,reload:true,runtimeErrors:errors.length});
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
 await writeFile(resolve(output,'results.json'),JSON.stringify({reports,blocked,privacyChoices,layoutEditorResults,passed:true},null,2));
 console.log('Integrated LHS Angular QA:',JSON.stringify({reports,blocked,privacyChoices,layoutEditorResults}));
}finally{
 await browser?.close();
 await new Promise(done=>server.close(done));
}
