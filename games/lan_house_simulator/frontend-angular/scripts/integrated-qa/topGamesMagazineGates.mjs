/** Real Chromium cutover regression: magazine-gates. Do not mock game state or bypass browser actions. */
import assert from 'node:assert/strict';

export async function verifyTopGamesMagazineGates({browser,origin,createGame,isValidSave,buyPs1Station,TOP_GAMES_ISSUES,DAY_MINUTES,GAME_SAVE_KEY}){
 // Real Angular storefront: a newly created campaign must block an unknown
 // title and enable precisely that game once its magazine is in the real save.
 const magazineShop=[];
 for(const {year,received} of [{year:2002,received:false},{year:2002,received:true},{year:2006,received:false}]){
  const context=await browser.newContext({viewport:{width:1280,height:900}});
  const fixture=createGame(received?9002:9001,'historical');
  fixture.totalMinutes=((year-1998)*360+14)*DAY_MINUTES;
  fixture.cash=10000;fixture.pcPoweredOff=[true,true,true];
  fixture.offlineUntil=fixture.totalMinutes+500;
  assert.equal(buyPs1Station(fixture,'floor-2').ok,true);
  if(received){
   fixture.topGamesSubscriptionDay=(2002-1998)*360+1;
   fixture.topGamesSubscriptionActive=true;
   fixture.topGamesReceivedIssues=[TOP_GAMES_ISSUES[0].id];
   fixture.topGamesLastDeliveryDay=(2002-1998)*360+15;
  }
  assert.equal(isValidSave(fixture),true);
  await context.addInitScript(({key,save})=>{
   localStorage.setItem(key,JSON.stringify(save));
   localStorage.setItem('lhs.sound','off');
   localStorage.setItem('lhs.privacy-choice.v1',JSON.stringify({version:1,choice:'rejected',at:Date.now()}));
  },{key:GAME_SAVE_KEY,save:fixture});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(origin,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>!document.querySelector('#menu-continue')?.disabled);
  await page.locator('#menu-continue').click();
  await page.locator('#open-shop').click();
  await page.locator('[data-shop-category="consoles"]').click();
  const ps1Cards=page.locator('.angular-console-grid').first().locator('article.shop-card');
  const ps1Card=ps1Cards.first(),purchase=ps1Card.locator('button');
  await purchase.waitFor({state:'visible'});
  assert.equal(await ps1Card.locator('h4').innerText(),
   received?'Turbo Circuito':'Jogo não revelado');
  assert.equal(await ps1Cards.count(),year===2006?13:7);
  assert.equal(await ps1Cards.locator('img.angular-ps1-cover').count(),received?1:0,
   'No PS1 cover may be loaded before its specific magazine arrives');
  assert.equal(await ps1Cards.locator('.top-games-secret-cover').count(),
   (year===2006?13:7)-(received?1:0));
  assert.equal(await purchase.isDisabled(),!received,
   'New saves may buy a title only when Tony received its own magazine');
  if(!received){
   assert.match(await purchase.innerText(),/Leia a revista Top Games/);
   assert.equal((await ps1Cards.locator('h4').allTextContents())
    .every(title=>title==='Jogo não revelado'),true);
   const before=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),GAME_SAVE_KEY);
   await purchase.evaluate(button=>button.click());
   const after=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),GAME_SAVE_KEY);
   assert.equal(after.ps1Discs?.['turbo-circuito'],undefined);
   assert.equal(after.cash,before.cash,'Locked Angular button cannot charge');
  }else{
   await purchase.click();
   await page.waitForFunction(key=>JSON.parse(localStorage.getItem(key))?.ps1Discs?.['turbo-circuito']===1,GAME_SAVE_KEY);
   const saved=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),GAME_SAVE_KEY);
   assert.equal(saved.ps1Discs['turbo-circuito'],1);
   assert.equal(saved.topGamesReceivedIssues[0],TOP_GAMES_ISSUES[0].id);
  }
  if(year===2006){
   const ps2Cards=page.locator('.angular-console-grid').last().locator('article.shop-card');
   assert.equal(await ps2Cards.count(),7,'All launch-year PS2 cards remain present');
   assert.deepEqual(await ps2Cards.locator('h4').allTextContents(),
    Array(7).fill('Jogo não revelado'),
    'PS2 titles are discovered only from the corresponding Top Games issue');
   assert.equal(await ps2Cards.locator('img.angular-ps2-cover').count(),0);
   assert.equal(await ps2Cards.locator('.top-games-secret-cover').count(),7);
  }
  assert.deepEqual(errors,[],'No Angular runtime error during magazine purchase gating');
  magazineShop.push({year,received,buttonDisabled:!received,errors:errors.length});
  await context.close();
 }
 return magazineShop;
}
