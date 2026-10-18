// Browser regression for account -> Donate -> checkout using isolated fake providers.
// No real account, agreement, payment preference or charge is created by this test.
import {createServer} from 'node:http';
import {readFile,stat,mkdir} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const root=resolve(import.meta.dirname,'../out/site');
const mime={'.html':'text/html; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.webp':'image/webp'};
const server=createServer(async(req,res)=>{try{
 const url=new URL(req.url,'http://localhost'),file=resolve(root,'.'+decodeURIComponent(url.pathname),url.pathname.endsWith('/')?'index.html':'');
 if(!file.startsWith(root+sep)||!(await stat(file)).isFile())throw Error();
 res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream'});res.end(await readFile(file));
}catch{res.writeHead(404);res.end();}});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const origin='http://127.0.0.1:'+server.address().port;
let browser;
try{
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 for(const width of [1280,390]){
  const context=await browser.newContext({viewport:{width,height:900}}),orders=[],errors=[];let logins=0;
  await context.route('https://identitytoolkit.googleapis.com/**',async route=>{
   const url=new URL(route.request().url());
   if(url.pathname.endsWith(':signInWithPassword')){logins++;return route.fulfill({json:{idToken:'fixture-token',refreshToken:'fixture-refresh',email:'test-player@example.invalid'}});}
   if(url.pathname.endsWith(':lookup'))return route.fulfill({json:{users:[{email:'test-player@example.invalid',emailVerified:true}]}});
   throw Error('Unexpected identity request');
  });
  await context.route('https://securetoken.googleapis.com/**',route=>route.fulfill({json:{id_token:'refreshed-fixture-token',refresh_token:'fixture-refresh'}}));
  await context.route('https://lhs-backend-1010038095056.us-central1.run.app/**',async route=>{
   const request=route.request(),path=new URL(request.url()).pathname;
   if(path==='/v1/config')return route.fulfill({json:{paymentsEnabled:true,paymentsMode:'production',verificationEmailProvider:'resend'}});
   assert.ok(request.headers().authorization?.startsWith('Bearer '),'Account requests must remain authenticated');
   if(path==='/v1/account')return route.fulfill({json:{cookiesBalance:0,entitlements:[]}});
   if(path==='/v1/saves/main')return route.fulfill({json:{revision:null,save:null}});
   if(path==='/v1/orders'&&request.method()==='GET')return route.fulfill({json:{orders:[]}});
   if(path==='/v1/orders'&&request.method()==='POST'){
    const body=request.postDataJSON();assert.equal(body.acceptedTerms,true);assert.ok(['donate-5','donate-10'].includes(body.packageId));orders.push(body.packageId);
    return route.fulfill({json:{id:body.packageId,url:'https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=fixture-'+body.packageId}});
   }
   throw Error('Unexpected account request');
  });
  await context.route('https://www.mercadopago.com.br/**',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><title>Checkout de teste</title><h1>Checkout de teste — sem cobrança</h1>'}));
  const page=await context.newPage();page.on('pageerror',error=>errors.push(String(error)));
  await page.goto(origin+'/conta/');await page.locator('#auth-fields').waitFor({state:'visible'});
  await page.locator('#account-email').fill('test-player@example.invalid');await page.locator('#account-password').fill('fixture-password');await page.locator('#auth-submit').click();
  await page.locator('#dashboard-view').waitFor({state:'visible'});
  await page.getByRole('link',{name:'Apoiar o LHS · Donate →',exact:true}).click();await page.locator('#dashboard-view').waitFor({state:'visible'});
  assert.equal(await page.locator('#auth-view').isVisible(),false);assert.equal(logins,1,'Navigation must not ask for another password');
  for(const packageId of ['donate-5','donate-10']){
   if(packageId==='donate-10'){await page.goto(origin+'/donate/');await page.locator('#dashboard-view').waitFor({state:'visible'});}
   await page.locator('#donate-terms').check();
   await page.locator('[data-donate-package="'+packageId+'"]').click();
   await page.waitForURL('https://www.mercadopago.com.br/**');assert.equal(await page.getByRole('heading').innerText(),'Checkout de teste — sem cobrança');
  }
  assert.deepEqual(orders,['donate-5','donate-10']);assert.equal(logins,1);
  await page.goto(origin+'/donate/');await page.locator('#dashboard-view').waitFor({state:'visible'});await page.reload();await page.locator('#dashboard-view').waitFor({state:'visible'});
  await mkdir(resolve(root,'../account-navigation-check'),{recursive:true});await page.screenshot({path:resolve(root,'../account-navigation-check/'+width+'.png'),fullPage:true});
  await page.getByRole('button',{name:'Sair da conta',exact:true}).click();await page.reload();await page.locator('#auth-view').waitFor({state:'visible'});assert.equal(await page.locator('#dashboard-view').isVisible(),false);
  assert.equal(logins,1);assert.deepEqual(errors,[]);await context.close();console.log(JSON.stringify({width,accountToDonate:true,bothCheckoutRedirects:true,returnSession:true,logoutCleared:true}));
 }
}finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
