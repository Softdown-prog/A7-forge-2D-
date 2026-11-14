/** Real Chromium cutover regression: console-release-gates. Do not mock game state or bypass browser actions. */
import assert from 'node:assert/strict';
import {resolve} from 'node:path';

export async function verifyConsoleReleaseGates({browser,origin,output,createGame,TOP_GAMES_ISSUES,DAY_MINUTES,GAME_SAVE_KEY}){
 // Real engine eligibility tests: no fabricated Angular DTOs or purchase events.
 const blocked=[];
 for(const scenario of [
  {year:2002,cash:15000,width:1280,reason:'PS2 not released',ps1Count:7,nextYear:2003,ps2Count:0,ps2Next:null},
  {year:2003,cash:15000,width:414,reason:'PS2 not released',ps1Count:9,nextYear:2004,ps2Count:0,ps2Next:null},
  {year:2004,cash:15000,width:360,reason:'PS2 not released',ps1Count:11,nextYear:2005,ps2Count:0,ps2Next:null},
  {year:2005,cash:15000,width:414,reason:'PS2 not released',ps1Count:13,nextYear:null,ps2Count:0,ps2Next:null},
  {year:2006,cash:0,width:414,reason:'Insufficient cash',ps1Count:13,nextYear:null,ps2Count:7,ps2Next:2007},
  {year:2007,cash:0,width:360,reason:'Insufficient cash',ps1Count:13,nextYear:null,ps2Count:9,ps2Next:2008},
  {year:2008,cash:0,width:414,reason:'Insufficient cash',ps1Count:13,nextYear:null,ps2Count:11,ps2Next:2009},
  {year:2009,cash:0,width:360,reason:'Insufficient cash',ps1Count:13,nextYear:null,ps2Count:13,ps2Next:2010},
  {year:2010,cash:0,width:414,reason:'Insufficient cash',ps1Count:13,nextYear:null,ps2Count:15,ps2Next:null}
 ]){
  const mobile=scenario.width<700;
  const context=await browser.newContext({
   viewport:{width:scenario.width,height:900},isMobile:mobile,hasTouch:mobile
  });
  const state=createGame(3200+scenario.year+scenario.width,'historical');
  // This release-calendar rehearsal uses the pre-magazine policy on purpose:
  // released titles are visible. New campaign secrecy is tested separately.
  delete state.topGamesUnlockMode;
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
  await page.waitForFunction(()=>
   document.querySelector('#react-shop-categories [data-shop-category="consoles"]')?.getAttribute('aria-pressed')==='true'&&
   document.querySelector('#react-shop-categories [data-shop-category="equipment"]')?.getAttribute('aria-pressed')==='false');
  const shop=page.locator('.angular-console-shop');
  await shop.waitFor();
  // Browser contract: future PS1 games must stay out of the actual store.
  await page.waitForFunction(expected=>document.querySelectorAll('.angular-ps1-cover').length===expected,
   scenario.ps1Count);
  const ps1Cards=shop.locator('.angular-console-grid').first().locator('article.shop-card');
  assert.equal(await ps1Cards.count(),scenario.ps1Count,'PS1 release count for '+scenario.year);
  const visibleTitles=await ps1Cards.locator('h4').allTextContents();
  const originals=['Turbo Circuito','Gol de Rua','Ilha dos Cristais','Luta Neon','Cosmo Blocos'];
  const annual=[
   [2002,['Rally do Deserto','Sombras do Castelo']],
   [2003,['Defensores do Espaço','Selva Perdida']],
   [2004,['Dragões de Aço','Ritmo da Cidade']],
   [2005,['Agentes da Noite','Oceano Profundo']]
  ];
  const expectedTitles=[...originals,...annual.filter(([year])=>year<=scenario.year)
   .flatMap(([,titles])=>titles)];
  assert.deepEqual(visibleTitles,expectedTitles,
   'PS1 annual unlocks must match released game titles, not just card count');
  const teaser=shop.locator('.ps1-next-games');
  if(scenario.nextYear!==null){
   assert.equal(await teaser.count(),1,'The next annual release is teased');
   assert.match(await teaser.innerText(),new RegExp('2 jogos desbloqueados em '+scenario.nextYear));
   for(const [,titles] of annual.filter(([year])=>year>scenario.year))
    for(const title of titles)assert.ok(!visibleTitles.includes(title),'Unreleased title leaked: '+title);
  }else assert.equal(await teaser.count(),0,'PS1 release teasers end in 2005');
  // Actual Angular cards and original artworks must follow the PS2 calendar.
  const ps2Cards=shop.locator('.angular-console-grid').last().locator('article.shop-card');
  assert.equal(await ps2Cards.count(),scenario.ps2Count,
   'PS2 visible released titles in '+scenario.year);
  const expectedPs2=PS2_GAME_CATALOG.filter(g=>g.releaseYear<=scenario.year);
  assert.deepEqual(await ps2Cards.locator('h4').allTextContents(),
   expectedPs2.map(g=>g.title),'No early PS2 releases in the real shop');
  assert.equal(await ps2Cards.locator('img.angular-ps2-cover').count(),scenario.ps2Count,
   'PS2 cards always show their local original artwork');
  const ps2Teaser=shop.locator('.ps2-next-games');
  if(scenario.ps2Next!==null){
   assert.equal(await ps2Teaser.count(),1);
   assert.match(await ps2Teaser.innerText(),
    new RegExp('2 jogos PS2 desbloqueados em '+scenario.ps2Next));
  }else assert.equal(await ps2Teaser.count(),0,'No annual PS2 teaser outside the release years');
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
  // Top Games Angular card delegates both commands to the existing shop port.
  const magazine=shop.locator('.angular-top-games');
  assert.equal(await magazine.count(),1,'Top Games subscription shown in consoles');
  assert.match(await magazine.innerText(),/Top Games/);
  assert.equal(await magazine.locator('.top-games-progress').textContent(),
   `Revistas recebidas: 0 de ${TOP_GAMES_ISSUES.length}.`);
  if(scenario.year===2002){
   const subscribe=magazine.locator('button');
   assert.equal(await subscribe.innerText(),'Assinar Top Games');
   const before=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),GAME_SAVE_KEY);
   await press(subscribe);
   await page.waitForFunction(()=>document.querySelector('.angular-top-games button')?.textContent?.includes('Pausar assinatura'));
   const after=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),GAME_SAVE_KEY);
   assert.equal(after.topGamesSubscriptionActive,true);
   assert.equal(after.topGamesReceivedIssues?.length,0);
   assert.equal(after.cash,before.cash,'Subscribe without delivery must not bill');
   assert.equal(after.expenses,before.expenses);
   await press(magazine.locator('button'));
   await page.waitForFunction(()=>document.querySelector('.angular-top-games button')?.textContent?.includes('Retomar assinatura'));
   const paused=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),GAME_SAVE_KEY);
   assert.equal(paused.topGamesSubscriptionActive,false);
   assert.equal(paused.cash,before.cash,'Pause must not bill');
  }
  assert.deepEqual(errors,[],'No runtime errors in Top Games subscription');
  await page.screenshot({
   path:resolve(output,'locked-'+scenario.year+'-'+scenario.width+'.png'),
   fullPage:true
  });
  blocked.push({year:scenario.year,cash:scenario.cash,width:scenario.width,
   ps1Available:scenario.ps1Count,nextPs1Release:scenario.nextYear,
   ps2Available:scenario.ps2Count,nextPs2Release:scenario.ps2Next,
   ps1Disabled:await ps1.isDisabled(),ps2Disabled:await ps2.isDisabled()});
  await context.close();
 }
 return blocked;
}
