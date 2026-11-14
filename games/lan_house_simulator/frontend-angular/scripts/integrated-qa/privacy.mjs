/** Real Chromium cutover regression: privacy. Do not mock game state or bypass browser actions. */
import assert from 'node:assert/strict';

export async function verifyPrivacyChoices({browser,origin,createGame,GAME_SAVE_KEY}){
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
 return privacyChoices;
}
