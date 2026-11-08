/** Browser snapshot prerender of PUBLIC Angular pages only; never uses production.
 * This is not Angular SSR/hydration. CSR must still bootstrap and replace the snapshot.
 * Run AFTER build:site:clean and Playwright Chromium installation, before publishing.
 */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,writeFile,stat} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {chromium} from 'playwright';

const output=resolve(import.meta.dirname,'../out/site-clean-angular');
const guideCatalog=JSON.parse(await readFile(resolve(import.meta.dirname,'../frontend-angular/src/site-rewrite/game-guides/guide-catalog.json'),'utf8'));const guidePages=guideCatalog.map(item=>item.path);const pages=['/','/jogar/','/sobre-o-jogo/',...guidePages,'/sobre-nos/','/ajuda/',
 '/contato/','/termos/','/privacidade/'];
const excluded=['/conta/','/conta/confirmar/','/donate/','/dados/'];
const renderPaths=[...pages,'/404/'];
const filenameFor=path=>path==='/404/'?resolve(output,'404.html'):resolve(output,'.'+path,'index.html');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8',
 '.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.json':'application/json',
 '.webp':'image/webp','.png':'image/png','.ico':'image/x-icon'};
const server=createServer(async(req,res)=>{
 try{
  const pathname=decodeURIComponent(new URL(req.url??'/','http://127.0.0.1').pathname);
  if(pathname==='/favicon.ico'){res.writeHead(204).end();return;}
  const filename=pathname==='/404/'?filenameFor(pathname):resolve(output,'.'+pathname,pathname.endsWith('/')?'index.html':'');
  if(!filename.startsWith(output+sep)||!(await stat(filename)).isFile())throw Error('Not found');
  res.writeHead(200,{'Content-Type':mime[extname(filename)]??'application/octet-stream',
   'Cache-Control':'no-store'});
  res.end(await readFile(filename));
 }catch{res.writeHead(404).end('Not found');}
});
await new Promise((ok,no)=>{server.once('error',no);server.listen(0,'127.0.0.1',ok);});
const origin='http://127.0.0.1:'+server.address().port;
let browser;
try{
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const context=await browser.newContext({serviceWorkers:'block'});
 const errors=[];
 await context.route('**/*',async route=>{
  const url=new URL(route.request().url());
  if(url.origin!==origin){errors.push('Unexpected external request '+url.origin);await route.abort();return;}
  await route.continue();
 });
 for(const path of renderPaths){
  const page=await context.newPage();
  page.on('pageerror',error=>errors.push(path+': '+error.message));
  try{
   await page.goto(origin+path,{waitUntil:'networkidle',timeout:30000});
   await page.waitForFunction(()=>document.documentElement.dataset.siteFramework==='angular-rewrite');
   await page.locator('main h1').waitFor({state:'visible'});
   assert.equal(await page.locator('main h1').count(),1,'One H1 expected: '+path);
   assert.equal(await page.locator('header nav').count(),1,'Missing navigation: '+path);
   assert.equal(await page.locator('footer').count(),1,'Missing footer: '+path);
   const markup=await page.locator('lhs-site').innerHTML();
   assert.ok(markup.length>300&&markup.length<400000,'Incomplete Angular HTML: '+path);
   assert.match(markup,/<main\b[^>]*\bid="conteudo"/);
   assert.doesNotMatch(markup,/<script\b|\bonclick=|\bonerror=/i);
   const filename=filenameFor(path);
   const existing=await readFile(filename,'utf8');
   assert.match(existing,/<meta name="robots" content="noindex,nofollow">/);
   const target='<lhs-site></lhs-site>';
   assert.equal(existing.split(target).length-1,1,'Unexpected Angular host structure: '+path);
   const snapshot='<lhs-site data-lhs-public-prerender="true">'+markup+'</lhs-site>';
   await writeFile(filename,existing.replace(target,snapshot));
  }finally{await page.close();}
 }
 await context.close();
 assert.deepEqual(errors,[],'No external requests or JavaScript errors during render');
 // Verify content without JavaScript and that client bootstrap does not duplicate navigation.
 const staticContext=await browser.newContext({javaScriptEnabled:false,serviceWorkers:'block',viewport:{width:360,height:850}});
 const dynamicContext=await browser.newContext({serviceWorkers:'block'});
 try{
  for(const path of renderPaths){
   const staticPage=await staticContext.newPage();
   const dynamicPage=await dynamicContext.newPage();
   try{
    await staticPage.goto(origin+path,{waitUntil:'load',timeout:30000});
    assert.equal(await staticPage.locator('main h1').count(),1,'Missing no-JS H1: '+path);
    assert.equal(await staticPage.locator('header nav').count(),1,'Missing no-JS navigation: '+path);
    assert.ok(await staticPage.locator('#site-nav').isVisible(),'Mobile no-JS links must remain visible: '+path);
    assert.equal(await staticPage.locator('.menu-button').isVisible(),false,'No dead mobile menu toggle without JS: '+path);
    assert.equal(await staticPage.locator('footer').count(),1,'Missing no-JS footer: '+path);
    assert.equal(await staticPage.locator('lhs-site[data-lhs-public-prerender]').count(),1);
    await dynamicPage.goto(origin+path,{waitUntil:'networkidle',timeout:30000});
    await dynamicPage.waitForFunction(()=>document.documentElement.dataset.siteFramework==='angular-rewrite');
    assert.equal(await dynamicPage.locator('main h1').count(),1,'Duplicated H1 after Angular bootstrap: '+path);
    assert.equal(await dynamicPage.locator('header nav').count(),1,'Duplicated nav after Angular bootstrap: '+path);
    assert.equal(await dynamicPage.locator('footer').count(),1,'Duplicated footer after Angular bootstrap: '+path);
   }finally{await staticPage.close();await dynamicPage.close();}
  }
 }finally{await staticContext.close();await dynamicContext.close();}
 for(const path of excluded){
  const html=await readFile(resolve(output,'.'+path,'index.html'),'utf8');
  assert.match(html,/<lhs-site><\/lhs-site>/,'Private/dynamic route must stay CSR: '+path);
  assert.doesNotMatch(html,/data-lhs-public-prerender/);
 }
 await writeFile(resolve(output,'angular-prerender-manifest.json'),
  JSON.stringify({version:1,method:'isolated-chromium-public-snapshot',
   paths:pages,excluded,notFound:true},null,2)+'\n');
 console.log('Angular public browser snapshots prerendered:',pages.join(', '));
}finally{
 await browser?.close();
 await new Promise(ok=>server.close(ok));
}
