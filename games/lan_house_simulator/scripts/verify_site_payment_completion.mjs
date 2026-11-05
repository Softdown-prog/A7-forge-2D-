/** Desktop/mobile regression: live catalog, explicit checkout and server reconciliation.
 * Every external request is intercepted; no real identity, order or payment is used.
 */
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {chromium} from 'playwright';
import {startCleanAngularPreview} from './clean_angular_preview_server.mjs';
const preview=await startCleanAngularPreview();
const output=resolve(import.meta.dirname,'../out/site-clean-angular-browser');
await mkdir(output,{recursive:true});
const results=[];let browser;
try{
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 for(const width of [1280,414,360]){
  const context=await browser.newContext({viewport:{width,height:850},isMobile:width<700,hasTouch:width<700,serviceWorkers:'block'});
  const errors=[],unexpected=[],posts=[],orderId='a'.repeat(64);
  let price=500,status='pending',balance=7,reconciliations=0,verified=true,readStatus=200;
  const order=()=>({id:orderId,priceCents:price,cookies:50,status,mode:'production'});
  await context.route('**/*',async route=>{
   const req=route.request(),url=new URL(req.url());
   if(url.origin===preview.origin)return route.continue();
   if(url.hostname==='securetoken.googleapis.com')return route.fulfill({json:{id_token:'synthetic',refresh_token:'synthetic'}});
   if(url.hostname==='identitytoolkit.googleapis.com')return route.fulfill({json:{users:[{email:'synthetic@example.invalid',emailVerified:verified}]}});
   if(url.pathname==='/v1/config')return route.fulfill({json:{paymentsEnabled:true,paymentsMode:'production',
    packages:{'donate-5':{priceCents:price,cookies:50},'donate-10':{priceCents:1000,cookies:100}}}});
   if(req.headers()['authorization']==='Bearer synthetic'){
    if(url.pathname==='/v1/orders'&&req.method()==='POST'){
     posts.push({headers:req.headers(),body:req.postDataJSON()});
     return route.fulfill({json:{id:orderId,url:'https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=synthetic'}});
    }
    if(url.pathname==='/v1/orders/'+orderId&&req.method()==='GET'){
     reconciliations++;return route.fulfill({status:readStatus,json:readStatus===200?order():{error:'Pedido não encontrado.'}});
    }
    if(url.pathname==='/v1/orders'&&req.method()==='GET')return route.fulfill({json:{orders:[order()]}});
    if(url.pathname==='/v1/account')return route.fulfill({json:{cookiesBalance:balance}});
    if(url.pathname==='/v1/saves/main')return route.fulfill({json:{save:null,revision:null,updatedAt:null}});
   }
   unexpected.push(req.method()+' '+url.origin+url.pathname);return route.abort();
  });
  const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
  await page.goto(preview.origin+'/donate/',{waitUntil:'networkidle'});
  await page.locator('#review-production-5').waitFor();
  assert.equal(await page.locator('[data-donate-package]').count(),0,'No duplicate unavailable catalog');
  assert.equal(posts.length,0);
  await page.locator('#review-production-5').click();
  await page.getByRole('link',{name:'Entrar ou confirmar email'}).waitFor();
  assert.equal(posts.length,0,'Guests cannot create payment orders');
  const config=await (await page.request.get(preview.origin+'/account-config.json')).json();
  await page.evaluate(config=>sessionStorage.setItem('lhs.account.session.v1',JSON.stringify({apiUrl:new URL(config.apiUrl).origin,
   firebaseApiKey:config.firebaseApiKey,idToken:'synthetic',refreshToken:'synthetic',email:'synthetic@example.invalid',createdAt:Date.now()})),config);
  verified=false;await page.locator('#review-production-5').click();
  await page.getByRole('link',{name:'Entrar ou confirmar email'}).waitFor();
  assert.equal(posts.length,0,'Unverified profiles cannot create orders');
  verified=true;await page.locator('#review-production-5').click();await page.locator('#production-quote').waitFor();
  assert.ok(await page.locator('#prepare-production-order').isDisabled());
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),'Review must fit the mobile viewport');
  await page.screenshot({path:resolve(output,'payment-review-'+width+'.png'),fullPage:true});
  await page.locator('#production-terms').check();price=550;
  await page.locator('#prepare-production-order').click();
  await page.waitForFunction(()=>document.querySelector('#production-status')?.textContent?.includes('Os valores mudaram'));
  assert.equal(posts.length,0,'Changed prices require a new review');
  await page.locator('#review-production-5').click();
  await page.waitForFunction(()=>document.querySelector('#production-quote')?.textContent?.includes('5,50'));
  await page.locator('#production-terms').check();await page.locator('#prepare-production-order').dblclick();
  await page.locator('#open-production-checkout').waitFor();
  assert.equal(posts.length,1,'Double click creates only one order');
  assert.equal(posts[0].body.expectedMode,'production');
  assert.deepEqual(posts[0].body,{packageId:'donate-5',acceptedTerms:true,expectedMode:'production'});
  assert.equal(context.pages().length,1,'Payment opens only on the explicit provider link');
  await page.screenshot({path:resolve(output,'payment-ready-'+width+'.png'),fullPage:true});
  await page.goto(preview.origin+'/donate/?order=bad&status=approved',{waitUntil:'networkidle'});
  assert.equal(await page.locator('#check-returned-order').count(),0);
  await page.goto(preview.origin+'/donate/?order='+orderId+'&status=approved',{waitUntil:'networkidle'});
  await page.locator('#check-returned-order').click();
  await page.locator('#reconcile-returned-order').waitFor();
  assert.equal(await page.locator('#cookies-balance').textContent(),'7');
  assert.equal(reconciliations,0,'Return URL cannot confirm payment or trigger provider reads');
  await page.locator('#reconcile-returned-order').click();
  await page.waitForFunction(()=>document.querySelector('#account-status')?.textContent?.includes('Pagamento pendente'));
  assert.equal(await page.locator('#cookies-balance').textContent(),'7');
  status='approved';balance=57;
  await page.locator('[data-reconcile-order]').click();
  await page.waitForFunction(()=>document.querySelector('#cookies-balance')?.textContent==='57');
  readStatus=404;await page.locator('[data-reconcile-order]').click();
  await page.waitForFunction(()=>document.querySelector('#account-status')?.textContent?.includes('Pedido não encontrado'));
  assert.equal(await page.locator('#cookies-balance').textContent(),'57','Failed reconciliation preserves the known balance');
  assert.equal(reconciliations,3);assert.equal(posts.length,1);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2));
  assert.deepEqual(errors,[]);assert.deepEqual(unexpected,[]);
  await page.screenshot({path:resolve(output,'payment-history-'+width+'.png'),fullPage:true});
  results.push({width,guestBlocked:true,unverifiedBlocked:true,priceChangeBlocked:true,doubleClickPosts:posts.length,
   forgedApprovalIgnored:true,providerReconciliations:reconciliations,balanceFromServer:true});
  await context.close();
 }
 await writeFile(resolve(output,'payment-completion-results.json'),JSON.stringify({passed:true,results},null,2)+'\n');
 console.log('Payment completion browser QA:',JSON.stringify(results));
}finally{await browser?.close();await preview.close();}
