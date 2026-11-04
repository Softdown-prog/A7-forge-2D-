/** QA of /jogar/ -> iframe -> Angular/Canvas using the actual production
 * build artifact with its CSP. Run before publication, not as a live-site check.
 * The same script also checks the isolated out/site-angular candidate.
 */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {createServer} from 'node:http';
import {readFile,mkdir,stat,writeFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
if(process.env.LHS_CHECK_DEFAULT_SITE==='1'){
 const {execFileSync}=await import('node:child_process');
 execFileSync(process.execPath,[resolve(import.meta.dirname,'../../scripts/verify_canonical_angular_site.mjs')],{stdio:'inherit'});
 process.exit(0);
}
const root=resolve(import.meta.dirname,process.env.LHS_CHECK_DEFAULT_SITE==='1'?'../../out/site':'../../out/site-angular');
const output=resolve(import.meta.dirname,process.env.LHS_CHECK_DEFAULT_SITE==='1'?'../../out/angular-site-default-browser':'../../out/angular-site-browser');
const angularTools=createRequire(resolve(import.meta.dirname,'../../.angular-browser-tools/package.json'));
const gameTools=createRequire(resolve(import.meta.dirname,'../../package.json'));
let chromium;
try {({chromium}=angularTools('playwright'));}
catch(error){
 if(error?.code!=='MODULE_NOT_FOUND')throw error;
 ({chromium}=gameTools('playwright'));
}
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
  const requestUrl=new URL(req.url??'/','http://localhost');
  const path=decodeURIComponent(requestUrl.pathname);
  // Match the actual Pages preview: every native JS module must be pinned
  // to the exact 12-hex build revision, including the Angular dynamic import.
  if(path.startsWith('/game/js/')&&path.endsWith('.js')&&
   !/^[a-f0-9]{12}$/.test(requestUrl.searchParams.get('v')??''))
   throw Error('Unversioned native game module');
  const file=resolve(root,'.'+path,path.endsWith('/')?'index.html':'');
  if(!file.startsWith(root+sep))throw Error('Outside site');
  if(!(await stat(file)).isFile())throw Error('Not found');
  res.writeHead(200,{'Content-Type':mime[extname(file)]??'application/octet-stream',
   'Content-Security-Policy':header,
   'Cache-Control':'no-cache, must-revalidate'});
  res.end(await readFile(file));
 }catch{res.writeHead(404).end('Not found');}
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const origin='http://127.0.0.1:'+server.address().port;
const results=[];
let browser;
try{
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 for(const width of [1280,414,360]){
  const mobile=width<700;
  const context=await browser.newContext({
   viewport:{width,height:840},isMobile:mobile,hasTouch:mobile
  });
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('response',response=>{
   const url=new URL(response.url());
   if(url.origin===origin&&response.status()>=400&&
      /\.(?:m?js|css|svg|webp|png|json)$/i.test(url.pathname))
    errors.push('HTTP '+response.status()+' '+url.pathname);
  });
  page.on('requestfailed',request=>{
   const url=new URL(request.url());
   if(url.origin===origin&&/\.(?:m?js|css)$/i.test(url.pathname))
    errors.push('Network '+(request.failure()?.errorText??'failed')+' '+url.pathname);
  });
  page.on('console',message=>{
   if(message.type()==='error'&&/Content Security Policy|Refused to|unsafe-eval/i.test(message.text()))
    errors.push('CSP: '+message.text());
  });
  // Real browser reload regression: F5/direct deep-link must not break HTML,
  // static JS, Angular bootstrap, mobile navigation or the lazy game shell.
  const refreshPaths=width===1280?['/','/ajuda/','/conta/','/jogar/']:
   ['/','/ajuda/','/jogar/'];
  for(const pathname of refreshPaths){
   const original=await page.goto(origin+pathname,{waitUntil:'networkidle'});
   assert.equal(original?.status(),200,'Direct route must open: '+pathname);
   const reloaded=await page.reload({waitUntil:'networkidle'});
   assert.equal(reloaded?.status(),200,'Refreshing must keep HTTP 200: '+pathname);
   await page.locator('#conteudo').waitFor({state:'visible',timeout:12000});
   assert.equal(await page.locator('header.site-header').count(),1);
   assert.equal(await page.locator('footer.site-footer').count(),1);
   assert.equal(await page.locator('nav#site-nav').count(),1);
   assert.equal(await page.locator('button#menu-toggle').count(),1);
   assert.equal(await page.locator('#motion-toggle').count(),1);
   if(process.env.LHS_CHECK_DEFAULT_SITE!=='1'){
    await page.waitForFunction(()=>
     document.documentElement.dataset.siteNavigation==='angular' &&
     document.documentElement.dataset.siteFooter==='angular');
    assert.equal(await page.locator('script[src*="react-entry.js"]').count(),0);
   }else{
    await page.waitForFunction(()=>
     document.documentElement.classList.contains('js-enabled'));
   }
   const siteLogo=page.locator('header .brand img');
   assert.ok(await siteLogo.evaluate(img=>img.complete&&img.naturalWidth>0),
    'Brand image must survive reload on '+pathname);
   if(mobile){
    const toggle=page.locator('#menu-toggle');
    await toggle.tap();
    await page.waitForFunction(()=>
     document.querySelector('#menu-toggle')?.getAttribute('aria-expanded')==='true' &&
     document.querySelector('#site-nav')?.classList.contains('is-open'));
    assert.ok(await page.locator('#site-nav').isVisible(),
     'Mobile nav should open after F5 at '+pathname);
    await page.keyboard.press('Escape');
    await page.waitForFunction(()=>
     document.querySelector('#menu-toggle')?.getAttribute('aria-expanded')==='false');
   }
   if(pathname==='/ajuda/'){
    if(process.env.LHS_CHECK_DEFAULT_SITE!=='1')
     await page.waitForFunction(()=>
      document.documentElement.dataset.siteHelp==='angular');
    const search=page.locator('#help-search');
    await search.fill('salvar');
    await page.waitForFunction(()=>
     /respostas? encontradas?/.test(
      document.querySelector('#help-search-results')?.textContent??''));
    assert.ok(await page.locator('#help-questions details:visible').count()>0,
     'FAQ search must work after F5');
   }
   if(pathname==='/jogar/'){
    assert.equal(await page.locator('#game-frame').getAttribute('src'),null,
     'Refresh must not autoplay iframe or retain a stale game document');
    assert.ok(await page.locator('#launch-game').isVisible(),
     'Refresh should restore the playable launch control');
   }
   assert.deepEqual(errors,[],'Reload errors at '+pathname+' width '+width);
  }
  await page.goto(origin+'/',{waitUntil:'networkidle'});
  const siteModule=await page.request.get(origin+'/assets/site.mjs');
  assert.match(siteModule.headers()['cache-control']??'',/no-cache/,
   'Public JS must always revalidate after a deployment');
  if(process.env.LHS_CHECK_DEFAULT_SITE!=='1'){
   // Exercise each public timeline against the actual Angular candidate.
   for(const pathname of ['/', '/sobre-o-jogo/']){
    await page.goto(origin+pathname,{waitUntil:'networkidle'});
    await page.waitForFunction(()=>
     document.documentElement.dataset.siteTimeline==='angular');
    const timeline=page.locator('[data-angular-site-timeline]');
    assert.equal(await timeline.count(),1,'One timeline per page');
    assert.equal(await timeline.locator('.era-tab').count(),4);
    assert.equal(await timeline.locator('.era-tab[aria-pressed="true"]').count(),1);
    assert.equal(await timeline.locator('#era-year').innerText(),'1998');
    for(const [index,year,model] of [[1,'2005','lcd'],[2,'2012','led'],[3,'2024','arena']]){
     const tab=timeline.locator('[data-era="'+index+'"]');
     if(mobile)await tab.tap();else await tab.click();
     await page.waitForFunction(year=>
      document.querySelector('[data-angular-site-timeline] #era-year')?.textContent===year,
      year,{timeout:10000});
     assert.equal(await tab.getAttribute('aria-pressed'),'true');
     assert.equal(await timeline.locator('.era-tab[aria-pressed="true"]').count(),1);
     assert.equal(await timeline.locator('#era-image').getAttribute('src'),
      '/assets/pc-'+model+'.svg');
     await page.waitForFunction(() => {
      const image=document.querySelector('[data-angular-site-timeline] #era-image');
      return image instanceof HTMLImageElement && image.complete && image.naturalWidth>0;
     },null,{timeout:10000});
    }
    // Real keyboard interaction, including touch viewport keyboard support.
    await timeline.locator('[data-era="0"]').focus();
    await page.keyboard.press('Enter');
    await page.waitForFunction(()=>
     document.querySelector('[data-angular-site-timeline] #era-year')?.textContent==='1998');
    assert.equal(await timeline.locator('[data-era="0"]').getAttribute('aria-pressed'),'true');
    assert.ok(await timeline.evaluate(el=>el.scrollWidth-el.clientWidth)<=3,
     'Angular timeline must stay inside '+width+'px viewport');
   }
  }
  if(process.env.LHS_CHECK_DEFAULT_SITE!=='1'){
   // Real Angular FAQ candidate /ajuda/: search, restored disclosure state
   // and keyboard/touch behavior on 1280, 414 and 360px viewports.
   await page.goto(origin+'/ajuda/',{waitUntil:'networkidle'});
   await page.waitForFunction(()=>
    document.documentElement.dataset.siteHelp==='angular');
   const help=page.locator('#duvidas[data-angular-site-help]');
   assert.equal(await help.count(),1,'Exactly one Angular FAQ host');
   const details=help.locator('#help-questions details');
   assert.equal(await details.count(),7,'All seven canonical FAQ answers present');
   assert.ok(await help.locator('#help-search-tools').isVisible());
   await details.first().locator('summary').click();
   await page.waitForFunction(()=>
    document.querySelector('#help-questions details:first-child')?.open===true);
   const search=help.locator('#help-search');
   await search.fill('nao ha assinatura');
   await page.waitForFunction(()=>
    document.querySelectorAll('#help-questions details:not([hidden])').length===1);
   assert.ok(await details.nth(1).isVisible(),
    'Accent-insensitive multiword FAQ search must find answer');
   await page.waitForFunction(()=>
    document.querySelector('#help-search-results')?.textContent?.includes('1 resposta encontrada.'));
   await search.fill('termo-que-nao-existe-no-faq-98765');
   await help.locator('#help-empty').waitFor({state:'visible'});
   assert.equal(await help.locator('#help-questions details:visible').count(),0);
   const clear=help.locator('#help-search-clear');
   if(mobile)await clear.tap();else await clear.click();
   await help.locator('#help-empty').waitFor({state:'hidden'});
   assert.equal(await search.inputValue(),'');
   await page.waitForFunction(()=>
    document.querySelector('#help-questions details:first-child')?.open===true);
   assert.equal(await clear.isHidden(),true);
   assert.equal(await help.locator('#help-questions details:visible').count(),7);
   await details.nth(1).locator('summary').focus();
   await page.keyboard.press('Enter');
   await page.waitForFunction(()=>
    document.querySelectorAll('#help-questions details[open]').length===2);
   const overflow=await help.evaluate(el=>{
    const rootRect=el.getBoundingClientRect();
    const offenders=[...el.querySelectorAll('*')].map(node=>{
     const rect=node.getBoundingClientRect();
     return {tag:node.tagName,id:node.id,klass:String(node.className).slice(0,75),
      end:Math.round(rect.right-rootRect.right),width:Math.round(rect.width)};
    }).filter(row=>row.end>3).sort((a,b)=>b.end-a.end).slice(0,6);
    return {client:el.clientWidth,scroll:el.scrollWidth,
     document:document.documentElement.scrollWidth,
     host:Math.round(rootRect.width),offenders};
   });
   assert.ok(overflow.scroll-overflow.client<=3,
    'Angular FAQ overflow at '+width+'px: '+JSON.stringify(overflow));
  }
  await page.goto(origin+'/jogar/',{waitUntil:'networkidle'});
  if(process.env.LHS_CHECK_DEFAULT_SITE!=='1'){
   // Test the rebuilt institutional Angular shell without changing /out/site.
   await page.waitForFunction(()=>
    document.documentElement.dataset.siteNavigation==='angular');
   // Full header/footer are new Angular components, not old DOM handlers.
   await page.waitForFunction(()=>
    document.documentElement.dataset.siteHeader==='angular' &&
    document.documentElement.dataset.siteFooter==='angular');
   const header=page.locator('header[data-angular-site-header]');
   const footer=page.locator('footer[data-angular-site-footer]');
   assert.equal(await header.count(),1);
   assert.equal(await footer.count(),1);
   assert.equal(await header.locator('a.brand[href="/"]').count(),1);
   assert.equal(await footer.locator('a.brand[href="/"]').count(),1);
   assert.equal(await page.locator('#menu-toggle').count(),1);
   assert.equal(await page.locator('#motion-toggle').count(),1);
   assert.equal(await footer.locator('nav.footer-links').count(),2);
   for(const href of ['/jogar/','/ajuda/','/contato/','/termos/','/privacidade/','/dados/'])
    assert.equal(await footer.locator('a[href="'+href+'"]').count(),1,
     'Angular footer must preserve '+href);
   for(const logo of await page.locator('a.brand img').all())
    assert.ok(await logo.evaluate(img=>img instanceof HTMLImageElement &&
      img.complete && img.naturalWidth>0),'Header/footer brand SVG must load');
   const motion=footer.locator('#motion-toggle');
   assert.equal(await motion.getAttribute('aria-pressed'),'false');
   assert.equal(await page.locator('body.reduce-motion').count(),0);
   if(mobile)await motion.tap();else await motion.click();
   await page.waitForFunction(()=>
    document.querySelector('#motion-toggle')?.getAttribute('aria-pressed')==='true' &&
    document.body.classList.contains('reduce-motion'));
   assert.match(await motion.innerText(),/Animações pausadas/);
   await motion.focus();
   await page.keyboard.press('Enter');
   await page.waitForFunction(()=>
    document.querySelector('#motion-toggle')?.getAttribute('aria-pressed')==='false' &&
    !document.body.classList.contains('reduce-motion'));
   // Confirm the system prefers-reduced-motion change is observed by Angular.
   await page.emulateMedia({reducedMotion:'reduce'});
   await page.waitForFunction(()=>
    document.querySelector('#motion-toggle')?.getAttribute('aria-pressed')==='true' &&
    document.body.classList.contains('reduce-motion'));
   await page.emulateMedia({reducedMotion:'no-preference'});
   await page.waitForFunction(()=>
    document.querySelector('#motion-toggle')?.getAttribute('aria-pressed')==='false' &&
    !document.body.classList.contains('reduce-motion'));
   assert.ok(await header.evaluate(el=>
    el.scrollWidth-el.clientWidth<=3),'Header overflow at '+width+'px');
   assert.ok(await footer.evaluate(el=>
    el.scrollWidth-el.clientWidth<=3),'Footer overflow at '+width+'px');
   const nav=page.locator('#site-nav');
   assert.equal(await nav.locator('a').count(),7,
    'Angular owns six links and the original Play button');
   assert.equal(await nav.locator('a[aria-current="page"]').count(),1);
   assert.equal(await nav.locator('a[href="/jogar/"][aria-current="page"]').count(),1);
   assert.equal(await nav.evaluate(el=>el.scrollWidth-el.clientWidth)<=3,true,
    'Site navigation must not overflow its own width');
   if(mobile){
    await page.locator('#menu-toggle').click();
    assert.equal(await page.locator('#menu-toggle').getAttribute('aria-expanded'),'true');
    await page.waitForFunction(()=>
     document.querySelector('#site-nav')?.classList.contains('is-open'),
     null,{timeout:5000});
    assert.ok(await nav.isVisible(),'Mobile Angular menu must actually open');
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#menu-toggle').getAttribute('aria-expanded'),'false');
    await page.locator('#menu-toggle').click();
    await nav.locator('a[href="/ajuda/"]').click();
    await page.waitForURL('**/ajuda/');
    await page.waitForFunction(()=>
     document.documentElement.dataset.siteNavigation==='angular');
    assert.equal(await page.locator('#site-nav a[href="/ajuda/"][aria-current="page"]').count(),1);
    await page.goto(origin+'/jogar/',{waitUntil:'networkidle'});
    await page.waitForFunction(()=>
     document.documentElement.dataset.siteNavigation==='angular');
   }
   assert.equal(await page.locator('script[src*="react-entry.js"]').count(),0,
    'React must never bootstrap institutional site navigation');
  }
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
  await press(game.locator('#close-shop'));
  await game.locator('#shop').waitFor({state:'hidden'});
  await press(game.locator('#open-admin'));
  await game.locator('#admin').waitFor({state:'visible'});
  await press(game.locator('#angular-admin-area-navigation [data-angular-admin-tab="computers"]'));
  await game.locator('#angular-computer-workspace .angular-pc-health')
   .waitFor({state:'visible',timeout:10000});
  await press(game.locator('#angular-computer-workspace [data-angular-task="hardware"]'));
  await game.locator('#page-computers-hardware').waitFor({state:'visible'});
  assert.ok(await game.locator('#hardware-select-0').count()>0,
   'Native PC controls must remain available through Angular');
  assert.ok(await game.locator('#angular-computer-workspace')
   .evaluate(node=>node.scrollWidth-node.clientWidth)<=3,
   'Angular computer panel must not overflow at '+width+'px');
  await press(game.locator('#close-admin'));
  await game.locator('#admin').waitFor({state:'hidden'});
  // Reload while a Canvas session is in progress, then reopen the game.
  // This catches blank screens and stale Angular/Canvas bundles on F5.
  const gameReload=await page.reload({waitUntil:'networkidle'});
  assert.equal(gameReload?.status(),200,'In-game F5 should reload /jogar/');
  await page.locator('#launch-game').waitFor({state:'visible',timeout:15000});
  assert.equal(await page.locator('#game-frame').getAttribute('src'),null);
  await page.locator('#launch-game').click();
  await game.locator('#menu-new').waitFor({state:'visible',timeout:20000});
  await page.waitForFunction(()=>{
   const frame=document.querySelector('#game-frame');
   return !!frame&&!frame.hidden&&
    frame.contentDocument?.documentElement.dataset.gameReady==='true'&&
    frame.contentDocument?.documentElement.dataset.uiFramework==='angular';
  },null,{timeout:20000});
  assert.ok(await game.locator('#menu-scene').evaluate(canvas=>{
   if(!(canvas instanceof HTMLCanvasElement))return false;
   const pixels=canvas.getContext('2d')?.getImageData(0,0,canvas.width,canvas.height).data;
   return !!pixels&&pixels.some((alpha,index)=>index%4===3&&alpha>0);
  }),'Canvas must draw after a full-page reload');
  assert.deepEqual(errors,[],'Production build CSP, resources and game must be error-free');
  await page.screenshot({path:resolve(output,'site-angular-'+width+'.png'),fullPage:true});
  results.push({width,mobile,lazyIframe:true,angularBoot:true,canvasGame:true,
   shopCatalog:true,siteAngularNavigation:process.env.LHS_CHECK_DEFAULT_SITE!=='1',
   siteAngularTimeline:process.env.LHS_CHECK_DEFAULT_SITE!=='1',
   siteAngularHelp:process.env.LHS_CHECK_DEFAULT_SITE!=='1',
   siteAngularHeaderFooter:process.env.LHS_CHECK_DEFAULT_SITE!=='1',
   adminComputer:true,mobileTouch:mobile,
   reactScript:false,csp:true,revisionedGameImports:true,
   fullPageReload:true,deepLinkRefresh:true,canvasRestartAfterReload:true,
   resourceErrors:0,errorCount:errors.length});
  await context.close();
 }
 await writeFile(resolve(output,'results.json'),JSON.stringify({passed:true,results},null,2)+'\n');
 console.log('Angular full-site iframe QA:',JSON.stringify(results));
}finally{
 await browser?.close();
 await new Promise(done=>server.close(done));
}
