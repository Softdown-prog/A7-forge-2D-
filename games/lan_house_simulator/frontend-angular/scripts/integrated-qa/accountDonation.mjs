/** Real LHS Chromium scenario. Preserve native actions and save behavior. */
import assert from 'node:assert/strict';
import {resolve} from 'node:path';

export async function verifyAccountDonation({browser,origin,output,createGame,GAME_SAVE_KEY}){
 // Account + Donate integration through the Angular-owned dialog. All network
 // providers here are explicitly mocked; NO genuine Firebase identity or
 // Mercado Pago checkout/order is created during this regression.
 const accountDonationResults=[];
 for(const scenario of [
  {width:1280,online:false},{width:414,online:true},{width:360,online:false}
 ]){
  const mobile=scenario.width<700;
  const context=await browser.newContext({
   viewport:{width:scenario.width,height:900},isMobile:mobile,hasTouch:mobile
  });
  const fixture=createGame(12000+scenario.width,'historical');
  await context.addInitScript(({key,save})=>{
   if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify(save));
   localStorage.setItem('lhs.sound','off');
   localStorage.setItem('lhs.privacy-choice.v1',
    JSON.stringify({version:1,choice:'rejected',at:Date.now()}));
  },{key:GAME_SAVE_KEY,save:fixture});
  const fakeApi='https://angular-account-qa.example';
  let balance=100,redemptions=0,cloudUploads=0,loginCalls=0,orderCalls=0;
  await context.route('**/online-config.json',route=>route.fulfill({json:{
   enabled:scenario.online,apiUrl:fakeApi,firebaseApiKey:scenario.online?'public-qa-key':''
  }}));
  // Catch any accidental real provider call: a regression cannot create
  // a checkout, login, donation, or payment on a live account.
  await context.route('https://identitytoolkit.googleapis.com/**',route=>{
   const pathname=new URL(route.request().url()).pathname;
   if(scenario.online&&pathname.endsWith(':signInWithPassword')){
    loginCalls++;
    return route.fulfill({json:{idToken:'angular-qa-id-token',
     refreshToken:'angular-qa-refresh',email:'account-qa@example.invalid'}});
   }
   if(scenario.online&&pathname.endsWith(':lookup'))
    return route.fulfill({json:{users:[{email:'account-qa@example.invalid',emailVerified:true}]}});
   return route.abort();
  });
  await context.route('https://securetoken.googleapis.com/**',route=>
   route.fulfill({json:{id_token:'angular-qa-id-token',refresh_token:'angular-qa-refresh'}}));
  await context.route(fakeApi+'/**',route=>{
   const request=route.request(),url=new URL(request.url());
   if(url.pathname==='/v1/config')return route.fulfill({json:{
    paymentsEnabled:true,paymentsMode:'production',
    packages:{'donate-5':{cookies:50,priceCents:500},
     'donate-10':{cookies:100,priceCents:1000}},
    items:{'headset-rgb-neon':{cookies:40,unlockYear:1998}}
   }});
   assert.equal(request.headers().authorization,'Bearer angular-qa-id-token',
    'No authenticated account request can omit the simulated token');
   if(url.pathname==='/v1/account')return route.fulfill({json:{
    uid:'qa-player',cookiesBalance:balance,cookiesSpentTotal:100-balance,
    entitlements:redemptions?['headset-rgb-neon']:[],transactions:[],
    historyLimit:40
   }});
   if(url.pathname==='/v1/items/headset-rgb-neon/purchase'){
    assert.equal(request.method(),'POST');
    if(!redemptions){balance-=40;redemptions++;}
    return route.fulfill({json:{owned:true,itemId:'headset-rgb-neon'}});
   }
   if(url.pathname==='/v1/saves/main'){
    if(request.method()==='POST')cloudUploads++;
    return route.fulfill({json:{revision:null,save:null}});
   }
   if(url.pathname.startsWith('/v1/orders'))orderCalls++;
   return route.fulfill({status:400,json:{error:'Unexpected account QA call'}});
  });
  const page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  const press=async target=>mobile?target.tap():target.click();
  await page.goto(origin,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.documentElement.dataset.uiFramework==='angular');
  await page.waitForFunction(()=>document.querySelector('#player-account')!==null);
  const panel=page.locator('#angular-player-account > #player-account');
  assert.equal(await panel.count(),1,'Account dialog belongs to Angular island');
  assert.equal(await page.locator('#player-account').count(),1,
   'No duplicate account dialogs after Angular bootstrap');
  await page.waitForFunction(()=>!document.querySelector('#menu-continue')?.disabled);
  await press(page.locator('#menu-account'));
  await panel.waitFor({state:'visible'});
  assert.equal(await page.locator('#account-balance').innerText(),'—',
   'Never fake a balance before authentication');
  await press(panel.locator('[data-account-tab="catalog"]'));
  assert.equal(await panel.locator('#account-catalog .account-item').count(),9,
   'Native cosmetic catalog is rendered in Angular-owned dialog');
  assert.equal(await panel.locator('#account-catalog button:enabled').count(),0,
   'No unauthenticated resgate, even if checkout is configured');
  await press(panel.locator('[data-account-tab="summary"]'));
  if(scenario.online){
   await page.waitForFunction(()=>document.querySelector('#account-connection')
    ?.textContent?.includes('Faça login'));
   assert.equal(await panel.locator('#account-donate a[href="/donate/"]').count(),1,
    'Donate link delegates to existing site, never creates a checkout in Angular');
   assert.equal(await panel.locator('#account-donate a').getAttribute('target'),'_top',
    'Donate navigation preserves tab session across the embedded game');
   await panel.locator('#account-email').fill('account-qa@example.invalid');
   await panel.locator('#account-password').fill('fixture-only-password');
   await press(panel.locator('#account-signin'));
   await page.waitForFunction(()=>document.querySelector('#account-balance')
    ?.textContent==='100 Cookies');
   assert.equal(loginCalls,1,'Only one simulated login from Angular dialog');
   await press(panel.locator('[data-account-tab="catalog"]'));
   const redeem=panel.locator('#account-catalog .account-item')
    .filter({hasText:'Fone Gamer RGB Neon'}).getByRole('button',{name:/Resgatar/});
   assert.equal(await redeem.isEnabled(),true,
    'Only server-priced cosmetic can be redeemed');
   page.once('dialog',dialog=>dialog.accept());
   await press(redeem);
   await page.waitForFunction(()=>document.querySelector('#account-balance')
    ?.textContent==='60 Cookies');
   assert.equal(redemptions,1,'Server mock confirmed one cosmetic redemption');
   await press(panel.locator('[data-account-tab="inventory"]'));
   assert.equal(await panel.locator(
    '#account-inventory [data-premium-cosmetic="headset-rgb-neon"]').isChecked(),true);
   await press(panel.locator('[data-account-tab="cloud"]'));
   assert.equal(cloudUploads,0,'Never autosend saves to the cloud');
   await press(panel.locator('[data-account-tab="summary"]'));
   await press(panel.locator('#account-logout'));
   await page.waitForFunction(()=>document.querySelector('#account-balance')
    ?.textContent==='—');
   assert.equal(await page.evaluate(()=>sessionStorage.getItem('lhs.account.session.v1')),null,
    'Logout invalidates simulated identity session');
  }else{
   await page.waitForFunction(()=>document.querySelector('#account-connection')
    ?.textContent?.includes('desativada'));
   assert.equal(await panel.locator('#account-donate a').count(),0,
    'Disabled payment environment must never expose a checkout link');
   assert.equal(await panel.locator('#account-login-box').isHidden(),true,
    'Disabled Firebase connection cannot show a functional login form');
  }
  await page.screenshot({path:resolve(output,
   'account-'+(scenario.online?'mock-':'offline-')+scenario.width+'.png'),fullPage:true});
  await press(panel.locator('#account-close'));
  await panel.waitFor({state:'hidden'});
  await press(page.locator('#menu-continue'));
  await page.locator('#game-app').waitFor({state:'visible'});
  await press(page.locator('#open-account'));
  await panel.waitFor({state:'visible'});
  assert.equal(await page.locator('#player-account').count(),1,
   'Opening account from game header reuses the same Angular dialog');
  assert.equal(await page.evaluate(key=>Boolean(localStorage.getItem(key)),GAME_SAVE_KEY),true,
   'Account and donation controls cannot erase the essential game save');
  assert.equal(orderCalls,0,'No donation order or Mercado Pago charge in UI rehearsal');
  assert.equal(cloudUploads,0,'No implicit cloud save upload');
  assert.deepEqual(errors,[],'No page errors in account/donation transition');
  accountDonationResults.push({width:scenario.width,online:scenario.online,
   angularOwned:true,singleAccountDialog:true,redemptions,
   noRealPayment:true,cloudUploads,runtimeErrors:errors.length});
  await context.close();
 }
 return accountDonationResults;
}
