/** Chromium QA: the public Donate is separate from private account order history.
 * All authentication, payments and backend data are synthetic. Never contacts a real account.
 */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,stat,mkdir,writeFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {chromium} from 'playwright';
const root=resolve(import.meta.dirname,'../out/site-clean-angular');
const output=resolve(import.meta.dirname,'../out/site-clean-angular-browser');
const config=JSON.parse(await readFile(resolve(root,'account-config.json'),'utf8'));
const apiOrigin=new URL(config.apiUrl).origin;
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript',
 '.css':'text/css','.svg':'image/svg+xml','.json':'application/json','.webp':'image/webp'};
const server=createServer(async(req,res)=>{
 try{
  const pathname=decodeURIComponent(new URL(req.url??'/','http://127.0.0.1').pathname);
  if(pathname==='/favicon.ico'){res.writeHead(204).end();return;}
  const file=resolve(root,'.'+pathname,pathname.endsWith('/')?'index.html':'');
  if(!file.startsWith(root+sep)||!(await stat(file)).isFile())throw Error('Missing');
  res.writeHead(200,{'Content-Type':mime[extname(file)]??'application/octet-stream'});
  res.end(await readFile(file));
 }catch{res.writeHead(404).end('Not found');}
});
await mkdir(output,{recursive:true});
await new Promise((ok,no)=>{server.once('error',no);server.listen(0,'127.0.0.1',ok);});
const origin='http://127.0.0.1:'+server.address().port;
const report=[];let browser;
try{
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 for(const width of [1280,414,360]){
  const mobile=width<700;
  const context=await browser.newContext({viewport:{width,height:850},isMobile:mobile,
   hasTouch:mobile,serviceWorkers:'block'});
  const page=await context.newPage(),errors=[],unexpected=[];
  let verified=false,invalid=false,ordersCalls=0,refreshCalls=0,lookupCalls=0,loginCalls=0;
  page.on('pageerror',error=>errors.push(error.message));
  await context.route('**/*',async route=>{
   const request=route.request(),url=new URL(request.url());
   if(url.origin===origin){await route.continue();return;}
   const respond=async data=>route.fulfill({contentType:'application/json',body:JSON.stringify(data)});
   if(url.origin===apiOrigin&&url.pathname==='/v1/config'&&request.method()==='GET'){
    await respond({paymentsEnabled:true,paymentsMode:'production'});return;
   }
   if(url.origin==='https://identitytoolkit.googleapis.com'&&
      url.pathname==='/v1/accounts:signInWithPassword'&&request.method()==='POST'){
    loginCalls++;await respond({idToken:'synthetic-id',refreshToken:'synthetic-refresh',
     email:'synthetic@example.invalid'});return;
   }
   if(url.origin==='https://identitytoolkit.googleapis.com'&&
      url.pathname==='/v1/accounts:lookup'&&request.method()==='POST'){
    lookupCalls++;await respond({users:[{email:'synthetic@example.invalid',emailVerified:verified}]});
    return;
   }
   if(url.origin==='https://securetoken.googleapis.com'&&
      url.pathname==='/v1/token'&&request.method()==='POST'){
    refreshCalls++;await respond({id_token:'synthetic-id',refresh_token:'synthetic-refresh'});return;
   }
   if(url.origin===apiOrigin&&url.pathname==='/v1/account'&&request.method()==='GET'&&
      request.headers()['authorization']==='Bearer synthetic-id'){
    await respond({cookiesBalance:42});return;
   }
   if(url.origin===apiOrigin&&url.pathname==='/v1/saves/main'&&request.method()==='GET'&&
      request.headers()['authorization']==='Bearer synthetic-id'){
    await respond({save:null,revision:null,updatedAt:null});return;
   }
   if(url.origin===apiOrigin&&url.pathname==='/v1/orders'&&request.method()==='GET'&&
      request.headers()['authorization']==='Bearer synthetic-id'){
    ordersCalls++;
    await respond(invalid?{orders:[{id:'bad-order'}]}:{orders:[
     {id:'a'.repeat(64),priceCents:500,cookies:50,status:'approved',mode:'production'},
     {id:'b'.repeat(64),priceCents:1000,cookies:100,status:'pending',mode:'sandbox'}
    ]});return;
   }
   unexpected.push({method:request.method(),origin:url.origin,path:url.pathname});
   await route.abort();
  });
  await page.goto(origin+'/donate/',{waitUntil:'networkidle'});
  await page.waitForFunction(()=>document.documentElement.dataset.siteFramework==='angular-rewrite');
  await page.waitForFunction(()=>document.querySelector('#donate-status')?.textContent
   ?.includes('Serviço de pagamentos ativo'));
  assert.equal(ordersCalls,0,'Public Donate must never query account orders');
  assert.equal(await page.locator('#load-donate-history').count(),0);
  assert.equal(await page.locator('.donate-orders').count(),0);
  assert.equal(await page.locator('[data-donate-package]:disabled').count(),2);
  const accountLink=page.locator('a[href="/conta/#apoios"]');
  assert.equal(await accountLink.count(),1);
  if(mobile)await accountLink.tap();else await accountLink.click();
  await page.locator('#account-email').waitFor({state:'visible',timeout:15000});
  assert.equal(new URL(page.url()).hash,'#apoios');
  assert.equal(ordersCalls,0,'No orders before authentication');
  await page.locator('#account-email').fill('synthetic@example.invalid');
  await page.locator('#account-password').fill('synthetic-password');
  await page.locator('#auth-submit').click();
  await page.getByRole('button',{name:'Já confirmei meu email'}).waitFor({state:'visible'});
  assert.equal(ordersCalls,0,'Unverified account cannot fetch private orders');
  assert.equal(await page.locator('#account-tab-apoios').count(),0);
  verified=true;
  await page.getByRole('button',{name:'Já confirmei meu email'}).click();
  await page.locator('#account-tab-apoios').waitFor({state:'visible'});
  assert.equal(await page.locator('#account-tab-apoios').getAttribute('aria-selected'),'true');
  assert.equal(await page.locator('#account-tab-saves').getAttribute('aria-selected'),'false');
  assert.equal(await page.locator('#account-order-status').getAttribute('role'),'status');
  assert.equal(ordersCalls,0,'Opening account tab must not request orders automatically');
  const load=page.locator('#load-account-orders');
  if(mobile)await load.tap();else await load.click();
  await page.waitForFunction(()=>document.querySelector('#account-order-status')?.textContent
   ?.includes('Exibindo 2 pedido'));
  assert.equal(ordersCalls,1);
  assert.equal(await page.locator('.donate-orders li').count(),2);
  const list=await page.locator('.donate-orders').innerText();
  assert.ok(list.includes('Pagamento aprovado pelo provedor'));
  assert.ok(list.includes('Pagamento pendente'));
  assert.ok(list.includes('Ambiente de testes'));
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2));
  await page.locator('#account-tab-saves').click();
  await page.locator('#download-main').waitFor({state:'visible'});
  assert.equal(await page.locator('.donate-orders li').count(),0);
  await page.locator('#account-tab-apoios').click();
  assert.equal(ordersCalls,1,'Switching tabs should never duplicate private API requests');
  const previous=ordersCalls;
  await page.reload({waitUntil:'networkidle'});
  await page.locator('#account-tab-apoios').waitFor({state:'visible'});
  assert.equal(await page.locator('#account-tab-apoios').getAttribute('aria-selected'),'true');
  assert.equal(ordersCalls,previous,'F5 must not re-request order history');
  assert.equal(await page.locator('.donate-orders li').count(),0);
  invalid=true;
  await page.locator('#load-account-orders').click();
  await page.waitForFunction(()=>document.querySelector('#account-order-status')?.textContent
   ?.includes('Não foi possível consultar'));
  assert.equal(ordersCalls,previous+1);
  assert.equal(await page.locator('.donate-orders li').count(),0,'Invalid data fails closed');
  await page.getByRole('button',{name:'Sair da conta'}).click();
  await page.locator('#account-email').waitFor({state:'visible'});
  assert.equal(await page.locator('.donate-orders li').count(),0,'Logout must clear private view');
  assert.ok(loginCalls>=1&&lookupCalls>=2&&refreshCalls>=2);
  assert.deepEqual(unexpected,[],'No real external requests or checkout/order POST');
  assert.deepEqual(errors,[],'No browser JavaScript errors');
  report.push({width,privateHistoryOnly:true,ordersCalls,
   verifiedGate:true,invalidPayloadBlocked:true,checkoutRequests:0});
  await page.screenshot({path:resolve(output,'account-order-history-'+width+'.png'),fullPage:true});
  await context.close();
 }
 await writeFile(resolve(output,'donate-history-results.json'),JSON.stringify(report,null,2)+'\n');
 console.log('Account order history isolated QA:',JSON.stringify(report));
}finally{
 await browser?.close();
 await new Promise(ok=>server.close(ok));
}
