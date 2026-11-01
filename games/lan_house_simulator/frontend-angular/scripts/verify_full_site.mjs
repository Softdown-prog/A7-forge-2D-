/** QA of the real /jogar/ -> iframe -> Angular/Canvas path, served from the
 * complete non-published out/site-angular artifact under the site's own CSP.
 */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {createServer} from 'node:http';
import {readFile,mkdir,stat,writeFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
const root=resolve(import.meta.dirname,process.env.LHS_CHECK_DEFAULT_SITE==='1'?'../../out/site':'../../out/site-angular');
const output=resolve(import.meta.dirname,process.env.LHS_CHECK_DEFAULT_SITE==='1'?'../../out/angular-site-default-browser':'../../out/angular-site-browser');
const require=createRequire(resolve(import.meta.dirname,'../../.angular-browser-tools/package.json'));
const {chromium}=require('playwright');
const mime={
 '.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8',
 '.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8',
 '.svg':'image/svg+xml','.json':'application/json','.png':'image/png',
 '.webp':'image/webp','.wav':'audio/wav','.ogg':'audio/ogg'
};
const header=(await readFile(resolve(root,'_headers'),'utf8'))
 .split('\n').find(line=>line.trim().startsWith('Content-Security-Policy:'))
 ?.trim().slice('Content-Security-Policy:'.length).trim();
assert.ok(header?.includes("script-src 'self'"),'Use real site CSP, not a permissive fake');
assert.ok((await stat(resolve(root,'game/__angular/main.js'))).isFile());
await mkdir(output,{recursive:true});
const server=createServer(async(req,res)=>{
 try{
  const path=decodeURIComponent(new URL(req.url??'/','http://localhost').pathname);
  const file=resolve(root,'.'+path,path.endsWith('/')?'index.html':'');
  if(!file.startsWith(root+sep))throw Error('Outside site');
  if(!(await stat(file)).isFile())throw Error('Not found');
  res.writeHead(200,{'Content-Type':mime[extname(file)]??'application/octet-stream',
   'Content-Security-Policy':header});
  res.end(await readFile(file));
 }catch{res.writeHead(404).end('Not found');}
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const origin='http://127.0.0.1:'+server.address().port;
const results=[];
let browser;
try{
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 for(const width of [1280,414]){
  const mobile=width<700;
  const context=await browser.newContext({
   viewport:{width,height:840},isMobile:mobile,hasTouch:mobile
  });
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',message=>{
   if(message.type()==='error'&&/Content Security Policy|Refused to|unsafe-eval/i.test(message.text()))
    errors.push('CSP: '+message.text());
  });
  await page.goto(origin+'/jogar/',{waitUntil:'networkidle'});
  const frame=page.locator('#game-frame');
  assert.equal(await frame.getAttribute('src'),null,'Game must not load before launch');
  assert.match(await frame.getAttribute('data-src'),/^\/game\/\?v=[0-9a-f]{12}$/);
  assert.equal(await frame.isHidden(),true,'No autoplay iframe');
  assert.ok((await page.locator('a[href="/conta/"]').count())>=1,
   'Site must keep account navigation');
  assert.ok((await page.locator('a[href="/donate/"]').count())>=1,
   'Site must keep Donate navigation');
  await page.locator('#launch-game').click();
  const game=page.frameLocator('#game-frame');
  await game.locator('#menu-new').waitFor({state:'visible',timeout:20000});
  await page.waitForFunction(()=>{
   const doc=document.querySelector('#game-frame')?.contentDocument;
   return doc?.documentElement.dataset.uiFramework==='angular' &&
    doc?.documentElement.dataset.gameReady==='true';
  },null,{timeout:20000});
  assert.equal(await frame.isVisible(),true,'Site must reveal the loaded game');
  assert.equal(await game.locator('#angular-save-transfer #save-export').count(),1);
  assert.equal(await game.locator('#angular-notice-inbox #notices').count(),1);
  assert.equal(await game.locator('script[src*="react-entry.js"]').count(),0);
  if(await game.locator('#privacy-banner').isVisible()){
   await game.locator('#privacy-reject').click();
   await game.locator('#privacy-banner').waitFor({state:'hidden'});
  }
  const press=async locator=>mobile?locator.tap():locator.click();
  await press(game.locator('#menu-new'));
  await game.locator('#game-app').waitFor({state:'visible',timeout:15000});
  await press(game.locator('#open-shop'));
  await game.locator('#shop').waitFor({state:'visible'});
  await game.locator('#angular-shop-catalog .angular-catalog-grid > article.shop-card')
   .first().waitFor({state:'visible',timeout:15000});
  assert.equal(await game.locator('#angular-shop-overview #organize-furniture').count(),1);
  assert.deepEqual(errors,[],'Site CSP and iframe game must have no browser errors');
  await page.screenshot({path:resolve(output,'site-angular-'+width+'.png'),fullPage:true});
  results.push({width,mobile,lazyIframe:true,angularBoot:true,canvasGame:true,
   shopCatalog:true,reactScript:false,csp:true,errorCount:errors.length});
  await context.close();
 }
 await writeFile(resolve(output,'results.json'),JSON.stringify({passed:true,results},null,2)+'\n');
 console.log('Angular full-site iframe QA:',JSON.stringify(results));
}finally{
 await browser?.close();
 await new Promise(done=>server.close(done));
}
