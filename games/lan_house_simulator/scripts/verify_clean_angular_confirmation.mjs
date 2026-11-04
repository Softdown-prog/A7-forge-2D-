/** Personal email codes are synthetic; all provider requests are mocked. No live account. */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile,stat} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {chromium} from 'playwright';
const root=resolve(process.env.LHS_SITE_ROOT??resolve(import.meta.dirname,'../out/site-clean-angular'));
const output=resolve(import.meta.dirname,'../out/site-clean-angular-browser');
const config=JSON.parse(await readFile(resolve(root,'account-config.json'),'utf8'));
const headers=await readFile(resolve(root,'_headers'),'utf8');
const csp=headers.match(/Content-Security-Policy: (.+)/)?.[1];assert.ok(csp);
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.json':'application/json','.webp':'image/webp'};
const server=createServer(async(req,res)=>{
 try{
  const pathname=decodeURIComponent(new URL(req.url??'/','http://127.0.0.1').pathname);
  if(pathname==='/favicon.ico'){res.writeHead(204).end();return;}
  const file=resolve(root,'.'+pathname,pathname.endsWith('/')?'index.html':'');
  if(!file.startsWith(root+sep)||!(await stat(file)).isFile())throw Error('Missing');
  res.writeHead(200,{'Content-Type':mime[extname(file)]??'application/octet-stream','Cache-Control':'no-store','Content-Security-Policy':csp});
  res.end(await readFile(file));
 }catch{res.writeHead(404).end();}
});
await mkdir(output,{recursive:true});
await new Promise((ok,no)=>{server.once('error',no);server.listen(0,'127.0.0.1',ok);});
const origin='http://127.0.0.1:'+server.address().port;
const code='synthetic-confirmation-code-12345678';
const report=[];let browser;
try{
 browser=await chromium.launch({headless:true});
 for(const width of [1280,414,360]){
  const mobile=width<700;
  const context=await browser.newContext({viewport:{width,height:850},isMobile:mobile,hasTouch:mobile,serviceWorkers:'block'});
  await context.addInitScript(()=>{localStorage.setItem('lhs-save-v1','keep-save');localStorage.setItem('lhs.sound','off');sessionStorage.setItem('another-app','keep-session');});
  const page=await context.newPage(),errors=[];
  page.setDefaultTimeout(10000);
  let calls=0,configCalls=0,mode='success',hold;
  const blocked=[];
  page.on('pageerror',()=>errors.push('pageerror'));
  page.on('console',msg=>{if(msg.type()==='error'&&/Content Security Policy|Refused to/.test(msg.text()))errors.push('csp-violation');});
  await context.route('**/*',async route=>{
   const req=route.request(),url=new URL(req.url());
   if(url.origin===origin){
    if(url.pathname==='/account-config.json'){
     configCalls++;
     if(mode==='disabled'){await route.fulfill({json:{enabled:false}});return;}
     if(mode==='config-failure'){await route.fulfill({status:503,json:{error:'synthetic'}});return;}
    }
    assert.ok(!req.headers()['referer']?.includes(code),'Code must not leak to asset/config referrers');
    await route.continue();return;
   }
   if(url.origin==='https://identitytoolkit.googleapis.com'&&url.pathname==='/v1/accounts:update'){
    calls++;assert.equal(req.method(),'POST');assert.deepEqual(req.postDataJSON(),{oobCode:code});
    assert.equal(url.searchParams.get('key'),config.firebaseApiKey);assert.ok(!req.url().includes(code));
    assert.ok(!req.headers()['authorization']);assert.ok(!req.headers()['referer']?.includes(code));
    if(mode==='hold')await new Promise(ok=>{hold=ok;setTimeout(ok,2000);});
    if(mode==='offline'){await route.abort();return;}
    if(mode==='expired'){await route.fulfill({status:400,json:{error:{message:'EXPIRED_OOB_CODE'}}});return;}
    if(mode==='server'){await route.fulfill({status:503,json:{error:{message:'private-provider-detail'}}});return;}
    await route.fulfill({json:{email:'synthetic@example.invalid'}});return;
   }
   blocked.push('unexpected-external');await route.abort();
  });
  const open=async suffix=>{
   await page.goto(origin+'/conta/confirmar/'+suffix,{waitUntil:'networkidle'});
   await page.locator('lhs-email-confirmation').waitFor();
   await page.waitForFunction(()=>location.hash===''&&location.search==='');
   assert.equal(page.url(),origin+'/conta/confirmar/');
   assert.equal(await page.locator('main h1').count(),1);
   assert.equal(await page.locator('#confirmation-status').getAttribute('role'),'status');
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2));
  };
  const click=async()=>{if(mobile)await page.locator('#confirm-email-button').tap();else await page.locator('#confirm-email-button').click();};
  await open('#codigo='+code);
  assert.equal(calls,0);assert.equal(configCalls,0,'No consumption/config request during initialization');
  mode='hold';await click();await page.waitForFunction(()=>document.querySelector('#email-confirmation')?.getAttribute('aria-busy')==='true');
  assert.equal(await page.locator('#confirm-email-button').isDisabled(),true);
  for(let i=0;i<100&&!hold;i++)await page.waitForTimeout(10);
  assert.ok(hold,'Provider request was not reached');
  // A second scripted activation during a pending request cannot consume twice.
  await page.locator('#confirm-email-button').evaluate(el=>el.click());
  assert.equal(calls,1);hold();mode='success';
  await page.locator('#confirmation-badge').waitFor();
  assert.equal(await page.locator('#confirm-email-button').count(),0);assert.equal(calls,1);
  assert.ok(!(await page.locator('body').innerText()).includes(code));
  assert.deepEqual(await page.evaluate(()=>({save:localStorage.getItem('lhs-save-v1'),sound:localStorage.getItem('lhs.sound'),other:sessionStorage.getItem('another-app'),account:sessionStorage.getItem('lhs.account.session.v1')})),{save:'keep-save',sound:'off',other:'keep-session',account:null});
  assert.ok(!(await page.evaluate(()=>JSON.stringify({...localStorage,...sessionStorage}))).includes(code));
  await page.screenshot({path:resolve(output,'confirmation-'+width+'.png'),fullPage:true});
  await page.getByRole('link',{name:'Ir para Minha conta'}).click();
  await page.locator('#account-email').waitFor();assert.equal(calls,1,'Confirmation must not auto-login');
  await open('?mode=verifyEmail&oobCode='+code+'&apiKey=untrusted&continueUrl=https://attacker.invalid');
  await click();await page.locator('#confirmation-badge').waitFor();assert.equal(calls,2);
  await page.reload({waitUntil:'networkidle'});await page.locator('lhs-email-confirmation').waitFor();
  assert.equal(await page.locator('#confirm-email-button').count(),0);assert.equal(calls,2,'F5 must not retry a consumed code');
  for(const bad of ['#codigo=short','#codigo='+code+'&codigo='+code,'?mode=resetPassword&oobCode='+code]){
   await open(bad);assert.equal(await page.locator('#confirm-email-button').count(),0);assert.equal(calls,2);
  }
  mode='expired';await open('#codigo='+code);await click();
  await page.waitForFunction(()=>document.querySelector('#confirmation-status')?.textContent?.includes('expirou'));
  assert.equal(await page.locator('#confirm-email-button').count(),0);
  for(const failure of ['offline','server','config-failure','disabled']){
   mode=failure;await open('#codigo='+code);await click();
   const feedback={offline:'Não foi possível conectar.',server:'Não foi possível confirmar agora.',
    'config-failure':'Não foi possível carregar a confirmação.',disabled:'A confirmação está temporariamente indisponível.'}[failure];
   await page.waitForFunction(text=>document.querySelector('#confirmation-status')?.textContent?.includes(text),feedback);
   await page.waitForFunction(()=>document.querySelector('#email-confirmation')?.getAttribute('aria-busy')==='false');
   assert.equal(await page.locator('#confirm-email-button').isEnabled(),true);
   assert.ok(!(await page.locator('#confirmation-status').innerText()).includes('private-provider-detail'));
   mode='success';await click();await page.locator('#confirmation-badge').waitFor();
  }
  assert.deepEqual(errors,[]);assert.deepEqual(blocked,[]);
  report.push({width,explicitClick:true,hashAndFirebaseLinks:true,permanentError:true,retry:true,urlScrubbed:true,storageUnchanged:true,reloadSafe:true,csp:true,externalRequestsMocked:true});
  await context.close();
 }
 await writeFile(resolve(output,'confirmation-results.json'),JSON.stringify(report,null,2)+'\n');
 console.log('Angular confirmation QA:',JSON.stringify(report));
}finally{await browser?.close();await new Promise(done=>server.close(done));}
