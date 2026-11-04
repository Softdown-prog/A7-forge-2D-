/** Playwright verification: guarded sandbox review, no POST orders or checkout links. */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,stat,mkdir,writeFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {chromium} from 'playwright';

const root=resolve(process.env.LHS_SITE_ROOT??resolve(import.meta.dirname,'../out/site-clean-angular'));
const evidence=resolve(import.meta.dirname,'../out/site-clean-angular-browser');
const config=JSON.parse(await readFile(resolve(root,'account-config.json'),'utf8'));
const apiOrigin=new URL(config.apiUrl).origin;
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8',
 '.css':'text/css; charset=utf-8','.json':'application/json','.svg':'image/svg+xml',
 '.webp':'image/webp'};
const server=createServer(async(req,res)=>{
 try{
  const path=decodeURIComponent(new URL(req.url??'/','http://127.0.0.1').pathname);
  if(path==='/favicon.ico'){res.writeHead(204).end();return;}
  const file=resolve(root,'.'+path,path.endsWith('/')?'index.html':'');
  if(!file.startsWith(root+sep)||!(await stat(file)).isFile())throw Error('Missing');
  res.writeHead(200,{'Content-Type':types[extname(file)]??'application/octet-stream'});
  res.end(await readFile(file));
 }catch{res.writeHead(404).end('Not found');}
});
await mkdir(evidence,{recursive:true});
await new Promise((ok,no)=>{server.once('error',no);server.listen(0,'127.0.0.1',ok);});
const origin='http://127.0.0.1:'+server.address().port;
const results=[];
let browser;
try{
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 for(const width of [1280,414,360]){
  const mobile=width<700;
  const context=await browser.newContext({viewport:{width,height:850},
   isMobile:mobile,hasTouch:mobile,serviceWorkers:'block'});
  const page=await context.newPage();
  const errors=[],unsafe=[];
  let mode='production',verified=false,validQuote=true,quoteCalls=0;
  let orderStatus=200;
  const orderWrites=[];
  page.on('pageerror',err=>errors.push(err.message));
  await context.route('**/*',async route=>{
   const request=route.request(),url=new URL(request.url());
   if(url.origin===origin){await route.continue();return;}
   const json=async content=>route.fulfill({contentType:'application/json',
    body:JSON.stringify(content)});
   if(url.origin===apiOrigin&&url.pathname==='/v1/config'&&request.method()==='GET'){
    quoteCalls++;
    await json({paymentsEnabled:true,paymentsMode:mode,packages:{
     'donate-5':{priceCents:validQuote?500:-500,cookies:50},
     'donate-10':{priceCents:1000,cookies:100}
    }});return;
   }
   if(url.origin===apiOrigin&&url.pathname==='/v1/orders'&&request.method()==='POST'){
    const headers=request.headers(),body=request.postDataJSON();
    orderWrites.push({headers,body});
    if(orderStatus==='timeout'){await route.abort('timedout');return;}
    await route.fulfill({status:orderStatus,contentType:'application/json',
     body:JSON.stringify(orderStatus===200?{
      id:'b'.repeat(64),
      url:'https://sandbox.mercadopago.com.br/checkout/v1/redirect?pref_id=synthetic'
     }:{error:'Synthetic network failure '+orderStatus+' #'+orderWrites.length})});
    return;
   }
   if(url.origin==='https://securetoken.googleapis.com'&&url.pathname==='/v1/token'&&
    request.method()==='POST'){
    await json({id_token:'sandbox-synthetic-id',refresh_token:'sandbox-synthetic-refresh'});return;
   }
   if(url.origin==='https://identitytoolkit.googleapis.com'&&
    url.pathname==='/v1/accounts:lookup'&&request.method()==='POST'){
    await json({users:[{email:'synthetic@example.invalid',emailVerified:verified}]});return;
   }
   unsafe.push(request.method()+' '+url.href);await route.abort();
  });
  await page.goto(origin+'/donate/',{waitUntil:'networkidle'});
  await page.waitForFunction(()=>document.documentElement.dataset.siteFramework==='angular-rewrite');
  assert.equal(await page.locator('[data-review-package]').count(),0,
   'Real payment environment cannot expose sandbox reviewer');
  assert.equal(await page.locator('[data-donate-package]:disabled').count(),2);
  mode='sandbox';
  await page.reload({waitUntil:'networkidle'});
  await page.locator('[data-review-package]').first().waitFor({state:'visible'});
  assert.equal(await page.locator('[data-review-package]').count(),2);
  const select=page.locator('[data-review-package="donate-5"]');
  const choose=async()=>mobile?select.tap():select.click();
  await choose();
  await page.waitForFunction(()=>document.querySelector('#sandbox-review-status')
   ?.textContent?.includes('Entre na sua conta'));
  assert.equal(await page.locator('#sandbox-review-quote').count(),0);
  await page.evaluate(cfg=>sessionStorage.setItem('lhs.account.session.v1',
   JSON.stringify({apiUrl:new URL(cfg.apiUrl).origin,
    firebaseApiKey:cfg.firebaseApiKey,idToken:'sandbox-synthetic-id',
    refreshToken:'sandbox-synthetic-refresh',email:'synthetic@example.invalid',
    createdAt:Date.now()})),config);
  await choose();
  await page.waitForFunction(()=>document.querySelector('#sandbox-review-status')
   ?.textContent?.includes('Confirme seu email'));
  assert.equal(await page.locator('#sandbox-review-quote').count(),0);
  verified=true;
  await choose();
  await page.waitForFunction(()=>document.querySelector('#sandbox-review-status')
   ?.textContent?.includes('Confira o pacote'));
  const label=await page.locator('#sandbox-review-quote').innerText();
  assert.ok(label.includes('R$ 5,00')&&label.includes('50 Cookies'));
  assert.equal(await page.locator('#confirm-sandbox-review:disabled').count(),1);
  await page.locator('#sandbox-terms').check();
  await page.locator('#confirm-sandbox-review').click();
  await page.waitForFunction(()=>document.querySelector('#sandbox-review-status')
   ?.textContent?.includes('Nenhum pedido, pagamento ou Cookie foi criado'));
  assert.equal(await page.locator('[data-donate-package]:disabled').count(),2);
  await page.locator('#cancel-sandbox-review').click();
  await page.locator('#sandbox-review-quote').waitFor({state:'detached'});
  assert.equal(await page.locator('#sandbox-review-quote').count(),0);
  validQuote=false;
  await choose();
  await page.waitForFunction(()=>document.querySelector('#sandbox-review-status')
   ?.textContent?.includes('Não foi possível preparar'));
  assert.equal(await page.locator('#sandbox-review-quote').count(),0);
  // Explicit sandbox-order stage; mock API only, never Mercado Pago or real account.
  validQuote=true;
  await choose();
  await page.waitForFunction(()=>document.querySelector('#sandbox-review-status')
   ?.textContent?.includes('Confira o pacote'));
  assert.equal(await page.locator('#prepare-sandbox-order:disabled').count(),1);
  await page.locator('#sandbox-terms').check();
  orderStatus=503;
  await page.locator('#prepare-sandbox-order').click();
  await page.waitForFunction(()=>document.querySelector('#sandbox-review-status')
   ?.textContent?.includes('Não foi possível preparar o pedido sandbox'));
  assert.equal(orderWrites.length,1);
  assert.equal(orderWrites[0].headers['x-lhs-sandbox-only'],'true');
  assert.deepEqual(orderWrites[0].body,{packageId:'donate-5',acceptedTerms:true});
  assert.ok(/^[0-9a-f-]{36}$/.test(orderWrites[0].headers['idempotency-key']));
  assert.equal(await page.locator('#sandbox-order-id').count(),0);
  orderStatus=200;
  await page.locator('#retry-sandbox-order').click();
  await page.waitForFunction(()=>document.querySelector('#sandbox-review-status')
   ?.textContent?.includes('Pedido sandbox preparado'));
  assert.equal(orderWrites.length,2);
  assert.equal(orderWrites[0].headers['idempotency-key'],orderWrites[1].headers['idempotency-key']);
  assert.equal(orderWrites[1].headers['authorization'],'Bearer sandbox-synthetic-id');
  assert.ok((await page.locator('#sandbox-order-id').innerText()).includes('bbbbbbbbbbbb'));
  assert.equal(await page.locator('a[href*="mercadopago"]').count(),0);
  assert.equal(await page.locator('[data-donate-package]:disabled').count(),2);
  await page.locator('#cancel-sandbox-review').click();
  await page.locator('#sandbox-order-id').waitFor({state:'detached'});
  // Production mode revocation between review and POST must stop the POST.
  await choose();
  await page.waitForFunction(()=>document.querySelector('#sandbox-review-status')
   ?.textContent?.includes('Confira o pacote'));
  await page.locator('#sandbox-terms').check();
  mode='production';
  await page.locator('#prepare-sandbox-order').click();
  await page.waitForFunction(()=>document.querySelector('#sandbox-review-status')
   ?.textContent?.includes('Não foi possível preparar o pedido sandbox'));
  assert.equal(orderWrites.length,2,'Mode change must not issue sandbox POST');
  await page.locator('#cancel-sandbox-review').click();

  // Session expiry after both token refresh attempts must return to login,
  // clear the quote/consent and prevent a third authorized retry.
  mode='sandbox';
  await choose();
  await page.waitForFunction(()=>document.querySelector('#sandbox-review-status')
   ?.textContent?.includes('Confira o pacote'));
  await page.locator('#sandbox-terms').check();
  orderStatus=401;
  await page.locator('#prepare-sandbox-order').click();
  await page.waitForFunction(()=>document.querySelector('#sandbox-review-status')
   ?.textContent?.includes('Entre na sua conta'));
  assert.equal(orderWrites.length,4,'A 401 may retry once with a refreshed token');
  assert.equal(orderWrites[2].headers['idempotency-key'],
   orderWrites[3].headers['idempotency-key'],'401 refresh must preserve the order key');
  assert.equal(await page.locator('#retry-sandbox-order').count(),0);
  assert.equal(await page.locator('#sandbox-review-quote').count(),0);
  assert.equal(await page.locator('#sandbox-order-id').count(),0);
  assert.equal(await page.locator('#sandbox-terms').count(),0);
  assert.equal(await page.evaluate(()=>
   sessionStorage.getItem('lhs.account.session.v1')),null,
   'Auth expiry must clear the stored session');
  // No POST is allowed until a new, explicitly restored session and consent.
  await choose();
  await page.waitForFunction(()=>document.querySelector('#sandbox-review-status')
   ?.textContent?.includes('Entre na sua conta'));
  assert.equal(orderWrites.length,4);

  // A fresh login must never inherit the previous (expired) idempotency key.
  await page.evaluate(cfg=>sessionStorage.setItem('lhs.account.session.v1',
   JSON.stringify({apiUrl:new URL(cfg.apiUrl).origin,
    firebaseApiKey:cfg.firebaseApiKey,idToken:'sandbox-synthetic-id',
    refreshToken:'sandbox-synthetic-refresh',email:'synthetic@example.invalid',
    createdAt:Date.now()})),config);
  orderStatus=200;
  await choose();
  await page.waitForFunction(()=>document.querySelector('#sandbox-review-status')
   ?.textContent?.includes('Confira o pacote'));
  assert.equal(orderWrites.length,4,'Review alone must not POST an order');
  await page.locator('#sandbox-terms').check();
  await page.locator('#prepare-sandbox-order').click();
  await page.waitForFunction(()=>document.querySelector('#sandbox-review-status')
   ?.textContent?.includes('Pedido sandbox preparado'));
  assert.equal(orderWrites.length,5);
  assert.notEqual(orderWrites[4].headers['idempotency-key'],
   orderWrites[3].headers['idempotency-key'],'New login needs new order key');
  assert.equal(await page.locator('a[href*="mercadopago"]').count(),0);

  // Conflicts, an uncertain timeout and bounded manual retries retain one intent.
  await page.locator('#cancel-sandbox-review').click();
  await page.locator('[data-review-package="donate-10"]').click();
  await page.locator('#sandbox-terms').check();
  const initial=orderWrites.length;
  for(const failure of [409,503,'timeout']){
   orderStatus=failure;
   const button=page.locator(failure===409?'#prepare-sandbox-order':'#retry-sandbox-order');
   await button.click();
   await page.getByRole('alert').filter({hasText:failure==='timeout'?'Sem conexão':'Synthetic network failure '+failure}).waitFor();
  }
  assert.equal(orderWrites.length,initial+3);
  assert.equal(new Set(orderWrites.slice(initial).map(x=>x.headers['idempotency-key'])).size,1);
  await page.locator('#retry-sandbox-order').click();
  await page.getByRole('alert').filter({hasText:'Limite de tentativas'}).waitFor();
  assert.equal(orderWrites.length,initial+3,'Retry limit prevents further POSTs');
  // A definitive 410 requires a fresh review and consent before a fresh key.
  await page.evaluate(()=>{
   for(const key of Object.keys(sessionStorage))if(key.startsWith('lhs.checkout.sandbox.v1:'))sessionStorage.removeItem(key);
  });
  await page.locator('#cancel-sandbox-review').click();
  await choose();await page.locator('#sandbox-terms').check();
  orderStatus=410;await page.locator('#prepare-sandbox-order').click();
  await page.waitForFunction(()=>document.querySelector('#sandbox-review-status')?.textContent?.includes('Não foi possível preparar a revisão'));
  assert.equal(await page.locator('#retry-sandbox-order').count(),0);
  const expiredKey=orderWrites.at(-1).headers['idempotency-key'];
  await choose();await page.locator('#sandbox-terms').check();
  orderStatus=200;await page.locator('#prepare-sandbox-order').click();
  await page.locator('#sandbox-order-id').waitFor();
  assert.notEqual(orderWrites.at(-1).headers['idempotency-key'],expiredKey);

  assert.deepEqual(unsafe,[],'No real APIs or checkout navigation');
  assert.deepEqual(errors,[],'No browser errors');
  assert.ok(quoteCalls>=4);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2));
  results.push({width,verifiedGate:true,explicitConsent:true,
   malformedQuoteRejected:true,sandboxOrdersMocked:orderWrites.length,
   keyReused:true,productionRevocationBlocked:true,expiredAuthCleared:true,realCheckout:false});
  await page.screenshot({path:resolve(evidence,'checkout-review-'+width+'.png'),fullPage:true});
  await context.close();
 }
 await writeFile(resolve(evidence,'checkout-review-results.json'),
  JSON.stringify(results,null,2)+'\n');
 console.log('Sandbox-only Donate review Chromium QA:',JSON.stringify(results));
}finally{
 await browser?.close();
 await new Promise(ok=>server.close(ok));
}
