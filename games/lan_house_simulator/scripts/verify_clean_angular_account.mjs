/** Isolated Angular account integration QA. All Firebase/backend calls are intercepted. */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile,stat} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {chromium} from 'playwright';
const root=resolve(process.env.LHS_SITE_ROOT??resolve(import.meta.dirname,'../out/site-clean-angular'));
const reportDir=resolve(import.meta.dirname,'../out/site-clean-angular-browser');
const accountConfig=JSON.parse(await readFile(resolve(root,'account-config.json'),'utf8'));
const apiOrigin=new URL(accountConfig.apiUrl).origin;
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8',
 '.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.json':'application/json',
 '.webp':'image/webp'};
const server=createServer(async(req,res)=>{
 try{
  const pathname=decodeURIComponent(new URL(req.url??'/','http://127.0.0.1').pathname);
  const file=resolve(root,'.'+pathname,pathname.endsWith('/')?'index.html':'');
  if(!file.startsWith(root+sep)||!(await stat(file)).isFile())throw Error('Missing');
  res.writeHead(200,{'Content-Type':mime[extname(file)]??'application/octet-stream',
   'Cache-Control':'no-cache, must-revalidate'});
  res.end(await readFile(file));
 }catch{res.writeHead(404).end('Not found');}
});
await mkdir(reportDir,{recursive:true});
await new Promise((ok,error)=>{server.once('error',error);server.listen(0,'127.0.0.1',ok);});
const origin='http://127.0.0.1:'+server.address().port;
let browser;
const report=[];
try{
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 for(const width of [1280,414,360]){
  const mobile=width<700;
  const context=await browser.newContext({viewport:{width,height:850},
   deviceScaleFactor:1,isMobile:mobile,hasTouch:mobile,acceptDownloads:true});
  const page=await context.newPage();
  const errors=[],requests=[];
  let emailVerified=true,denyNext=false,forceConflict=false,remoteSave=null,
   remoteRevision='revision-0',backup=null,loginCount=0,uploadCount=0,refreshCount=0;
  page.on('pageerror',error=>errors.push(error.message));
  // Block ALL real external requests, including unknown analytics and user data services.
  await context.route('**/*',async route=>{
   const request=route.request(),url=new URL(request.url());
   if(url.origin===origin){await route.continue();return;}
   if(url.protocol!=='https:')throw Error('Unexpected external request '+url.href);
   requests.push({origin:url.origin,path:url.pathname,method:request.method(),
    authorization:request.headers()['authorization']??''});
   const respond=async(body,status=200)=>route.fulfill({status,
    contentType:'application/json',body:JSON.stringify(body)});
   if(url.hostname==='identitytoolkit.googleapis.com'){
    if(url.pathname.endsWith(':signInWithPassword')){
     loginCount++;
     if(denyNext){denyNext=false;await respond({error:{message:'INVALID_LOGIN_CREDENTIALS'}},400);return;}
     await respond({idToken:'test-id',refreshToken:'test-refresh',email:'test@example.invalid'});return;
    }
    if(url.pathname.endsWith(':signUp')){
     await respond({idToken:'test-id',refreshToken:'test-refresh',email:'test@example.invalid'});return;
    }
    if(url.pathname.endsWith(':lookup')){
     await respond({users:[{email:'test@example.invalid',emailVerified}]});return;
    }
    if(url.pathname.endsWith(':sendOobCode')){await respond({email:'test@example.invalid'});return;}
   }
   if(url.hostname==='securetoken.googleapis.com'){
    refreshCount++;await respond({id_token:'renewed-token',refresh_token:'renewed-refresh'});return;
   }
   if(url.origin===apiOrigin){
    if(url.pathname==='/v1/config'){await respond({verificationEmailProvider:'firebase'});return;}
    if(!['Bearer test-id','Bearer renewed-token'].includes(
      request.headers()['authorization']??'')) {
     await respond({error:'Auth required'},401);return;
    }
    if(url.pathname==='/v1/account'){
     await respond({cookiesBalance:42});return;
    }
    if(url.pathname==='/v1/saves/main'){
     if(request.method()==='POST'){
      uploadCount++;
      const data=request.postDataJSON();
      if(forceConflict||data.expectedRevision!==remoteRevision){
       await respond({error:'Outro dispositivo salvou primeiro.'},409);return;
      }
      assert.ok(data.save&&data.save.format==='softdown-lan-house-save');
      backup=remoteSave;remoteSave=data.save;remoteRevision='revision-'+uploadCount;
      await respond({revision:remoteRevision});return;
     }
     if(url.searchParams.get('backup')==='true'){
      await respond({save:backup,revision:remoteRevision,updatedAt:null});return;
     }
     await respond({save:remoteSave,revision:remoteRevision,updatedAt:null});return;
    }
    if(url.pathname==='/v1/auth/verification-email'){
     await respond({sent:true});return;
    }
   }
   throw Error('Unmocked external URL: '+url.origin+url.pathname);
  });
  await page.goto(origin+'/conta/',{waitUntil:'networkidle'});
  await page.locator('#account-email').waitFor({state:'visible',timeout:15000});
  assert.equal(await page.locator('lhs-account').count(),1);
  assert.equal(await page.locator('header nav').count(),1);
  assert.equal(await page.locator('#account-status').getAttribute('role'),'status');
  assert.ok(await page.evaluate(()=>
   document.documentElement.scrollWidth<=innerWidth+2),'Account overflow '+width);
  // Authentication errors may not enter dashboard.
  denyNext=true;
  await page.locator('#account-email').fill('test@example.invalid');
  await page.locator('#account-password').fill('test-password');
  await page.locator('#auth-submit').click();
  await page.waitForTimeout(400);
  console.log('ACCOUNT_LOGIN_DIAGNOSTIC',JSON.stringify({
   width,loginCount,requests:requests.slice(-5),errors,
   ui:await page.evaluate(()=>({
    status:document.querySelector('#account-status')?.textContent?.trim(),
    view:!!document.querySelector('#account-email'),
    submit:document.querySelector('#auth-submit')?.textContent?.trim(),
    validity:(document.querySelector('#account-email') instanceof HTMLInputElement)?
     document.querySelector('#account-email').validity.valid:null,
    busy:document.querySelector('.account-card')?.getAttribute('aria-busy')
   }))
  }));
  await page.waitForFunction(()=>document.querySelector('#account-status')?.textContent
   ?.includes('Não foi possível entrar.'),null,{timeout:5000});
  assert.equal(await page.locator('#cookies-balance').count(),0);
  await page.locator('#account-password').fill('test-password');
  await page.locator('#auth-submit').click();
  await page.locator('#cookies-balance').waitFor({state:'visible',timeout:15000});
  assert.equal(await page.locator('#cookies-balance').innerText(),'42');
  assert.equal(await page.locator('#download-main').isDisabled(),true);
  assert.equal(await page.evaluate(()=>localStorage.getItem('lhs.account.session.v1')),null);
  assert.doesNotMatch(await page.evaluate(()=>sessionStorage.getItem('lhs.account.session.v1')??''),/test-password/);
  assert.ok(requests.filter(x=>x.path==='/v1/account').every(x=>x.authorization.startsWith('Bearer ')));
  assert.equal(await page.locator('script[src*="account.mjs"]').count(),0);
  // Create a REAL valid save from the game's own engine, without weakening validation.
  const save=await page.evaluate(async()=>{
   const {createGame}=await import('/game/js/sim/engine.js');
   const {serializeSave}=await import('/game/js/sim/saveTransfer.js');
   return serializeSave(createGame());
  });
  assert.ok(save.includes('"softdown-lan-house-save"'));
  await page.locator('#save-file').setInputFiles({
   name:'test-save.json',mimeType:'application/json',buffer:Buffer.from(save)
  });
  const send=page.locator('#upload-save');
  await send.click();
  await page.locator('#upload-dialog').waitFor({state:'visible'});
  await page.locator('#cancel-upload').click();
  await page.locator('#upload-dialog').waitFor({state:'hidden'});
  assert.equal(uploadCount,0,'Cancel must not send any save');
  await send.click();
  await page.locator('#upload-dialog').waitFor({state:'visible'});
  await page.locator('#confirm-upload').click();
  await page.waitForFunction(()=>document.querySelector('#account-status')?.textContent
   ?.includes('Save confirmado na nuvem.'));
  assert.equal(uploadCount,1);
  assert.equal(await page.locator('#save-state').innerText(),'Na nuvem');
  const download=page.waitForEvent('download');
  await page.locator('#download-main').click();
  const saved=await download;
  assert.equal(saved.suggestedFilename(),'lhs-save-nuvem.json');
  // 409 prevents accidental overwrite; must refresh revision before retry.
  forceConflict=true;
  await page.locator('#save-file').setInputFiles({
   name:'second-save.json',mimeType:'application/json',buffer:Buffer.from(save)
  });
  await send.click();
  await page.locator('#upload-dialog').waitFor({state:'visible'});
  await page.locator('#confirm-upload').click();
  await page.waitForFunction(()=>document.querySelector('#account-status')?.textContent
   ?.includes('Outro dispositivo atualizou a nuvem.'));
  assert.equal(await send.isDisabled(),true);
  assert.equal(uploadCount,2);
  forceConflict=false;
  await page.locator('#refresh-account').click();
  await page.waitForFunction(()=>document.querySelector('#account-status')?.textContent
   ?.includes('Conta e save conferidos.'));
  assert.equal(await send.isEnabled(),true);
  // Reload restores by refreshing token, not reusing a stale IdToken.
  const reloaded=await page.reload({waitUntil:'networkidle'});
  assert.equal(reloaded?.status(),200);
  await page.locator('#cookies-balance').waitFor({state:'visible',timeout:15000});
  assert.equal(await page.locator('#cookies-balance').innerText(),'42');
  assert.ok(refreshCount>=1);
  assert.equal(loginCount,2,'Reload must not resubmit credentials');
  await page.locator('.account-welcome button').click();
  await page.locator('#account-email').waitFor({state:'visible'});
  assert.equal(await page.evaluate(()=>sessionStorage.getItem('lhs.account.session.v1')),null);
  // Signup without verified email must never request account saves.
  const cloudCallsBefore=requests.filter(x=>x.path==='/v1/saves/main').length;
  emailVerified=false;
  await page.locator('.account-tabs button').nth(1).click();
  await page.locator('#account-email').fill('test@example.invalid');
  await page.locator('#account-password').fill('signup-password');
  await page.locator('#account-terms').check();
  await page.locator('#auth-submit').click();
  await page.getByText('Falta só uma conexão.').waitFor({state:'visible'});
  assert.equal(requests.filter(x=>x.path==='/v1/saves/main').length,cloudCallsBefore);
  await page.getByRole('button',{name:'Reenviar email'}).click();
  await page.waitForFunction(()=>document.querySelector('#account-status')?.textContent
   ?.includes('Email de confirmação reenviado'));
  emailVerified=true;
  await page.getByRole('button',{name:'Já confirmei meu email'}).click();
  await page.locator('#cookies-balance').waitFor({state:'visible'});
  await page.locator('.account-welcome button').click();
  await page.locator('.account-tabs button').nth(2).click();
  await page.locator('#account-email').fill('unknown@example.invalid');
  await page.locator('#auth-submit').click();
  await page.waitForFunction(()=>document.querySelector('#account-status')?.textContent
   ?.includes('Se a conta existir'));
  assert.equal(await page.locator('#cookies-balance').count(),0);
  assert.deepEqual(errors,[],'Account runtime errors at '+width);
  await page.screenshot({path:resolve(reportDir,'account-'+width+'.png'),fullPage:true});
  report.push({width,login:true,restore:true,signup:true,reset:true,
   upload:true,download:true,conflict409:true,errors:errors.length});
  await context.close();
 }
 await writeFile(resolve(reportDir,'account-results.json'),JSON.stringify(report,null,2));
 console.log('Angular account browser QA:',JSON.stringify(report));
}finally{
 await browser?.close();
 await new Promise(done=>server.close(done));
}
