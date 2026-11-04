/** Additional release QA with real response headers. All external traffic is intercepted. */
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {chromium} from 'playwright';
import {startCleanAngularPreview} from './clean_angular_preview_server.mjs';
const external=process.env.LHS_SITE_PREVIEW_URL;
if(external&&!['127.0.0.1','localhost'].includes(new URL(external).hostname))throw Error('Container QA requires a loopback URL');
const preview=external?{origin:new URL(external).origin,close:async()=>{}}:await startCleanAngularPreview();
const output=resolve(import.meta.dirname,'../out/site-clean-angular-browser');
await mkdir(output,{recursive:true});
const results=[];let browser;
try{
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 for(const width of [1280,414,360]){
  const context=await browser.newContext({viewport:{width,height:850},isMobile:width<700,hasTouch:width<700,serviceWorkers:'block'});
  const errors=[],violations=[],external=[];
  let productionGate=false,status=200,mode='production',posts=[];
  await context.addInitScript(()=>document.addEventListener('securitypolicyviolation',event=>{
   (window.__cspViolations??=[]).push(event.violatedDirective);
  }));
  await context.route('**/*',async route=>{
   const req=route.request(),url=new URL(req.url());
   if(url.origin===preview.origin){
    if(url.pathname==='/checkout-config.json')return route.fulfill({json:{productionCheckoutEnabled:productionGate}});
    return route.continue();
   }
   if(url.hostname==='securetoken.googleapis.com')return route.fulfill({json:{id_token:'synthetic',refresh_token:'synthetic'}});
   if(url.hostname==='identitytoolkit.googleapis.com')return route.fulfill({json:{users:[{email:'synthetic@example.invalid',emailVerified:true}]}});
   if(url.pathname==='/v1/config')return route.fulfill({json:{paymentsEnabled:true,paymentsMode:mode,
    packages:{'donate-5':{priceCents:500,cookies:50},'donate-10':{priceCents:1000,cookies:100}}}});
   if(url.pathname==='/v1/orders'&&req.method()==='POST'){
    posts.push({headers:req.headers(),body:req.postDataJSON()});
    return route.fulfill({status,json:status===200?{id:'a'.repeat(64),url:'https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=synthetic'}:{error:'synthetic'}});
   }
   external.push(url.origin);return route.abort();
  });
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  page.on('console',msg=>{if(msg.type()==='error'&&/Content Security Policy|Refused to/.test(msg.text()))violations.push(msg.text());});
  for(const path of ['/','/jogar/','/sobre-o-jogo/','/sobre-nos/','/ajuda/','/contato/','/conta/','/conta/confirmar/','/donate/','/termos/','/privacidade/','/dados/','/404/','/missing-route/']){
   const response=await page.goto(preview.origin+path,{waitUntil:'networkidle'});
   assert.equal(response.status(),path.includes('404')||path.includes('missing')?404:200);
   assert.match(response.headers()['content-security-policy'],/script-src 'self'/);
   assert.equal(response.headers()['x-content-type-options'],'nosniff');
   await page.locator('main h1').waitFor();
   assert.equal(await page.locator('main h1').count(),1);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2));
   await page.locator('.skip').focus();await page.keyboard.press('Enter');
   await page.waitForURL(url=>url.hash==='#conteudo');
   assert.equal(new URL(page.url()).pathname,path);
   assert.equal(new URL(page.url()).hash,'#conteudo');
   await page.reload({waitUntil:'networkidle'});
   assert.equal(await page.locator('main h1').count(),1);
   violations.push(...await page.evaluate(()=>window.__cspViolations??[]));
  }
  await page.goto(preview.origin+'/jogar/',{waitUntil:'networkidle'});
  if(width<700){
   await page.locator('.menu-button').tap();await page.keyboard.press('Escape');
   assert.ok(await page.locator('.menu-button').evaluate(el=>el===document.activeElement));
   await page.locator('.menu-button').tap();await page.locator('main h1').tap();
   await page.waitForFunction(()=>document.querySelector('.menu-button')?.getAttribute('aria-expanded')==='false');
   assert.equal(await page.locator('.menu-button').getAttribute('aria-expanded'),'false');
  }
  await page.locator('#launch-game').click();
  await page.waitForFunction(()=>document.querySelector('#game-status')?.textContent?.includes('Jogo aberto'));
  const game=page.frameLocator('#game-frame');await game.locator('#start-screen').waitFor();
  assert.ok(await page.locator('#game-frame').evaluate(frame=>frame.getBoundingClientRect().top>=0),'Frame controls must be inside the viewport');
  const privacy=game.locator('#privacy-banner');await privacy.waitFor({state:'visible'});
  await game.locator('#privacy-reject').click();await privacy.waitFor({state:'hidden'});
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('lhs.privacy-choice.v1')).choice),'rejected');
  await page.reload({waitUntil:'networkidle'});assert.equal(await page.locator('#game-frame').count(),0);
  // Failed HTTP load must expose a recoverable UI, retaining unrelated local data.
  await context.route('**/game/',route=>route.fulfill({status:503,contentType:'text/html',body:'synthetic failure'}));
  await page.locator('#launch-game').click();
  await page.waitForFunction(()=>document.querySelector('#game-status')?.textContent?.includes('O jogo não carregou'));
  assert.equal(await page.locator('#launch-game').innerText(),'Tentar abrir novamente');
  await context.unroute('**/game/');
  await page.locator('#launch-game').click();
  await page.waitForFunction(()=>document.querySelector('#game-status')?.textContent?.includes('Jogo aberto'));
  await page.goto(preview.origin+'/donate/',{waitUntil:'networkidle'});
  assert.equal(await page.locator('#review-production-5').count(),0);assert.equal(posts.length,0);
  productionGate=true;
  const cfg=await (await page.request.get(preview.origin+'/account-config.json')).json();
  await page.evaluate(config=>sessionStorage.setItem('lhs.account.session.v1',JSON.stringify({apiUrl:new URL(config.apiUrl).origin,
   firebaseApiKey:config.firebaseApiKey,idToken:'synthetic',refreshToken:'synthetic',email:'synthetic@example.invalid',createdAt:Date.now()})),cfg);
  await page.reload({waitUntil:'networkidle'});
  await page.locator('#review-production-5').click();await page.locator('#production-quote').waitFor();
  assert.equal(await page.locator('#prepare-production-order').isDisabled(),true);
  await page.locator('#close-production-review').click();assert.equal(posts.length,0);
  await page.locator('#review-production-5').click();await page.locator('#production-terms').check();
  status=503;await page.locator('#prepare-production-order').click();
  await page.waitForFunction(()=>document.querySelector('#production-status')?.textContent?.includes('synthetic'));
  assert.equal(posts.length,1);
  await page.reload({waitUntil:'networkidle'});
  await page.locator('#review-production-5').click();await page.locator('#production-terms').check();
  status=200;await page.locator('#prepare-production-order').click();
  await page.locator('#open-production-checkout').waitFor();assert.equal(posts.length,2);
  assert.equal(posts[0].headers['idempotency-key'],posts[1].headers['idempotency-key']);
  assert.deepEqual(posts[1].body,{packageId:'donate-5',acceptedTerms:true});
  assert.equal(await page.locator('#open-production-checkout').getAttribute('href'),'https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=synthetic');
  assert.equal(context.pages().length,1,'No automatic provider navigation');
  await page.locator('#close-production-review').click();
  await page.locator('#review-production-5').click();await page.locator('#production-terms').check();
  mode='sandbox';await page.locator('#prepare-production-order').click();
  await page.waitForFunction(()=>document.querySelector('#production-status')?.textContent?.includes('Pagamento indisponível'));
  assert.equal(posts.length,2,'Mode revocation must fail before POST');
  assert.deepEqual(errors,[]);assert.deepEqual(violations,[]);assert.deepEqual(external,[]);
  results.push({width,routes:13,unknown404:true,headers:true,cspViolations:0,skipLink:true,
   launcherRetry:true,consentPreserved:true,productionGateDefault:false,mockedProductionPosts:posts.length,reloadIdempotency:true,providerOpened:false});
  await context.close();
 }
 await writeFile(resolve(output,'migration-results.json'),JSON.stringify({passed:true,results},null,2)+'\n');
 console.log('Full migration supplementary QA:',JSON.stringify(results));
}finally{await browser?.close();await preview.close();}
