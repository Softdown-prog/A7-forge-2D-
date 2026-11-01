/** Real Chromium QA for read-only Donate history, with exclusively synthetic account/orders. */
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
const report=[];
let browser;
try{
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 for(const width of [1280,414,360]){
  const mobile=width<700;
  const context=await browser.newContext({viewport:{width,height:850},isMobile:mobile,
   hasTouch:mobile,serviceWorkers:'block'});
  const page=await context.newPage(),errors=[],unexpected=[];
  let verified=true,invalid=false,ordersCalls=0,refreshCalls=0,lookupCalls=0;
  page.on('pageerror',error=>errors.push(error.message));
  await context.route('**/*',async route=>{
   const request=route.request(),url=new URL(request.url());
   if(url.origin===origin){await route.continue();return;}
   const respond=async data=>route.fulfill({contentType:'application/json',
    body:JSON.stringify(data)});
   if(url.origin===apiOrigin&&url.pathname==='/v1/config'&&request.method()==='GET'){
    await respond({paymentsEnabled:true,paymentsMode:'production'});return;
   }
   if(url.origin==='https://securetoken.googleapis.com'&&url.pathname==='/v1/token'&&
      request.method()==='POST'){
    refreshCalls++;await respond({id_token:'synthetic-id',refresh_token:'synthetic-refresh'});return;
   }
   if(url.origin==='https://identitytoolkit.googleapis.com'&&
      url.pathname==='/v1/accounts:lookup'&&request.method()==='POST'){
    lookupCalls++;await respond({users:[{email:'synthetic@example.invalid',emailVerified:verified}]});return;
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
  assert.equal(ordersCalls,0,'No automatic private order fetch');
  assert.equal(await page.locator('[data-donate-package]:disabled').count(),2);
  const historyButton=page.locator('#load-donate-history');
  const click=async()=>{if(mobile)await historyButton.tap();else await historyButton.click();};
  await click();
  await page.waitForFunction(()=>document.querySelector('#donate-history-status')?.textContent
   ?.includes('Entre na sua conta'));
  assert.equal(ordersCalls,0);
  assert.equal(refreshCalls,0);
  await page.evaluate(cfg=>sessionStorage.setItem('lhs.account.session.v1',JSON.stringify({
   apiUrl:new URL(cfg.apiUrl).origin,firebaseApiKey:cfg.firebaseApiKey,
   idToken:'synthetic-id',refreshToken:'synthetic-refresh',
   email:'synthetic@example.invalid',createdAt:Date.now()
  })),config);
  await click();
  await page.waitForFunction(()=>document.querySelector('#donate-history-status')?.textContent
   ?.includes('Exibindo 2 pedido'));
  assert.equal(ordersCalls,1);
  assert.equal(await page.locator('.donate-orders li').count(),2);
  const text=await page.locator('.donate-orders').innerText();
  assert.ok(text.includes('Pagamento aprovado pelo provedor'));
  assert.ok(text.includes('Pagamento pendente'));
  assert.ok(text.includes('Ambiente de testes'));
  assert.equal(await page.locator('[data-donate-package]:disabled').count(),2);
  verified=false;
  await click();
  await page.waitForFunction(()=>document.querySelector('#donate-history-status')?.textContent
   ?.includes('Confirme seu email'));
  assert.equal(ordersCalls,1,'Unverified email must never query orders');
  assert.equal(await page.locator('.donate-orders li').count(),0);
  verified=true;invalid=true;
  await click();
  await page.waitForFunction(()=>document.querySelector('#donate-history-status')?.textContent
   ?.includes('Não foi possível consultar seus pedidos'));
  assert.equal(ordersCalls,2);
  assert.equal(await page.locator('.donate-orders li').count(),0,'Malformed data fails closed');
  assert.ok(refreshCalls>=3&&lookupCalls>=3);
  assert.deepEqual(unexpected,[],'No external checkout/order POST or unmocked request');
  assert.deepEqual(errors,[],'No browser JS errors');
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2));
  await page.evaluate(()=>sessionStorage.removeItem('lhs.account.session.v1'));
  const ordersBefore=ordersCalls;
  await page.reload({waitUntil:'networkidle'});
  assert.equal(ordersCalls,ordersBefore,'F5 must never auto-load private order history');
  assert.equal(await page.locator('[data-donate-package]:disabled').count(),2);
  report.push({width,ordersCalls,verifiedGate:true,invalidPayloadBlocked:true,checkoutRequests:0});
  await page.screenshot({path:resolve(output,'donate-history-'+width+'.png'),fullPage:true});
  await context.close();
 }
 await writeFile(resolve(output,'donate-history-results.json'),JSON.stringify(report,null,2)+'\n');
 console.log('Donate history isolated browser QA:',JSON.stringify(report));
}finally{
 await browser?.close();
 await new Promise(ok=>server.close(ok));
}
