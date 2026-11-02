/** Real browser QA only for out/site-clean-angular. This does not deploy. */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,stat,mkdir,writeFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {chromium} from 'playwright';
const root=resolve(import.meta.dirname,'../out/site-clean-angular');
const output=resolve(import.meta.dirname,'../out/site-clean-angular-browser');
const accountConfig=JSON.parse(await readFile(resolve(root,'account-config.json'),'utf8'));
const pageMetadata=JSON.parse(await readFile(resolve(import.meta.dirname,
 '../frontend-angular/src/site-rewrite/page-metadata.json'),'utf8'));
const apiOrigin=new URL(accountConfig.apiUrl).origin;
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8',
 '.css':'text/css; charset=utf-8','.svg':'image/svg+xml',
 '.json':'application/json','.webp':'image/webp'};
const server=createServer(async(req,res)=>{
 try{
  const pathname=decodeURIComponent(new URL(req.url??'/','http://127.0.0.1').pathname);
  if(pathname==='/favicon.ico'){res.writeHead(204).end();return;}
  const file=resolve(root,'.'+pathname,pathname.endsWith('/')?'index.html':'');
  if(!file.startsWith(root+sep)||!(await stat(file)).isFile())throw Error('Missing');
  const data=await readFile(file);
  res.writeHead(200,{'Content-Type':mime[extname(file)]??'application/octet-stream',
   'Cache-Control':'no-cache, must-revalidate'});
  res.end(data);
 }catch{res.writeHead(404).end('Not found');}
});
await mkdir(output,{recursive:true});
await new Promise((yes,no)=>{
 server.once('error',no);server.listen(0,'127.0.0.1',yes);
});
const origin='http://127.0.0.1:'+server.address().port;
const results=[];
let browser;
try{
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 for(const width of [1280,414,360]){
  const mobile=width<700;
  const context=await browser.newContext({
   viewport:{width,height:850},isMobile:mobile,hasTouch:mobile,
   deviceScaleFactor:1,reducedMotion:'no-preference'
  });
  let donateMode='disabled',donateCalls=0,unsafePaymentCalls=0;
  await context.route('**/*',async route=>{
   const request=route.request(),url=new URL(request.url());
   if(url.origin===origin){await route.continue();return;}
   if(url.origin===apiOrigin&&url.pathname==='/v1/config'&&request.method()==='GET'){
    donateCalls++;
    if(donateMode==='error')await route.fulfill({status:503,json:{error:'mock unavailable'}});
    else await route.fulfill({json:{paymentsEnabled:donateMode==='active',
     paymentsMode:donateMode==='active'?'production':'disabled'}});
    return;
   }
   unsafePaymentCalls++;await route.abort();
  });
  const page=await context.newPage(),errors=[];
  page.on('pageerror',err=>errors.push('JS '+err.message));
  page.on('response',response=>{
   if(response.status()>=400&&new URL(response.url()).origin===origin&&
     /\.(?:js|css|svg|webp|json)$/.test(new URL(response.url()).pathname))
    errors.push('HTTP '+response.status()+' '+response.url());
  });
  for(const pathname of ['/','/sobre-o-jogo/','/ajuda/','/jogar/','/termos/','/privacidade/','/dados/','/donate/']){
   let res=await page.goto(origin+pathname,{waitUntil:'networkidle'});
   assert.equal(res?.status(),200);
   await page.waitForFunction(()=>
    document.documentElement.dataset.siteFramework==='angular-rewrite');
   assert.equal(await page.locator('lhs-site').count(),1);
   assert.equal(await page.locator('lhs-site-header').count(),1);
   assert.equal(await page.locator('header nav').count(),1);
   const currentLink=page.locator('lhs-site-header #site-nav a[aria-current="page"]');
   if(['/', '/jogar/', '/sobre-o-jogo/', '/ajuda/', '/donate/'].includes(pathname)){
    assert.equal(await currentLink.count(),1);
    assert.equal(await currentLink.getAttribute('href'),pathname);
   }else assert.equal(await currentLink.count(),0);
   assert.equal(await page.locator('main h1').count(),1);
   assert.equal(await page.title(),pageMetadata[pathname].title+' · Lan House Simulator');
   assert.equal(await page.locator('meta[name="description"]').getAttribute('content'),
    pageMetadata[pathname].description);
   assert.equal(await page.locator('meta[name="robots"]').getAttribute('content'),'noindex,nofollow');
   assert.equal(await page.locator('meta[property="og:title"]').getAttribute('content'),
    pageMetadata[pathname].title+' · Lan House Simulator');
   assert.ok(await page.evaluate(()=>
    document.documentElement.scrollWidth<=innerWidth+2),'Horizontal overflow at '+width+' '+pathname);
   res=await page.reload({waitUntil:'networkidle'});
   assert.equal(res?.status(),200);
   await page.waitForFunction(()=>
    document.documentElement.dataset.siteFramework==='angular-rewrite');
   assert.equal(await page.locator('main h1').count(),1);
   if(mobile){
    const toggle=page.locator('.menu-button');
    await toggle.tap();
    await page.waitForFunction(()=>
     document.querySelector('.menu-button')?.getAttribute('aria-expanded')==='true');
    assert.ok(await page.locator('#site-nav').isVisible());
    await page.keyboard.press('Escape');
    await page.waitForFunction(()=>
     document.querySelector('.menu-button')?.getAttribute('aria-expanded')==='false');
    // Keyboard activation and Escape must keep the Angular menu state consistent.
    await toggle.press('Enter');
    await page.waitForFunction(()=>
     document.querySelector('.menu-button')?.getAttribute('aria-expanded')==='true');
    await page.keyboard.press('Escape');
    await page.waitForFunction(()=>
     document.querySelector('.menu-button')?.getAttribute('aria-expanded')==='false');
   }
   if(pathname==='/'||pathname==='/sobre-o-jogo/'){
    assert.equal(await page.locator('lhs-era-timeline').count(),1);
    const timeline=page.locator('lhs-era-timeline');
    const buttons=timeline.locator('.era-tabs button');
    assert.equal(await buttons.count(),4);
    assert.equal(await buttons.nth(0).getAttribute('aria-pressed'),'true');
    assert.equal(await timeline.locator('.era-panel h3').textContent(),'Três PCs e um sonho.');
    const newer=buttons.getByText('2024');
    if(mobile)await newer.tap();else await newer.click();
    await page.waitForFunction(()=>
     document.querySelector('lhs-era-timeline .era-panel h3')?.textContent===
     'O salão vira uma arena.');
    assert.equal(await newer.getAttribute('aria-pressed'),'true');
    assert.equal(await buttons.nth(0).getAttribute('aria-pressed'),'false');
    assert.equal(await timeline.locator('.era-panel img').getAttribute('src'),'/assets/pc-arena.svg');
    if(mobile)await buttons.nth(1).tap();else await buttons.nth(1).click();
    await page.waitForFunction(()=>
     document.querySelector('lhs-era-timeline .era-panel h3')?.textContent===
     'O LCD chega ao bairro.');
    assert.equal(await buttons.nth(1).getAttribute('aria-pressed'),'true');
    await page.reload({waitUntil:'networkidle'});
    await page.waitForFunction(()=>
     document.documentElement.dataset.siteFramework==='angular-rewrite');
    assert.equal(await page.locator('lhs-era-timeline').count(),1);
    assert.equal(await page.locator('lhs-era-timeline .era-tabs button').first()
     .getAttribute('aria-pressed'),'true');
    assert.equal(await page.locator('lhs-era-timeline .era-panel h3').textContent(),
     'Três PCs e um sonho.');
   }else{
    assert.equal(await page.locator('lhs-era-timeline').count(),0);
   }
   if(pathname==='/ajuda/'){
    assert.equal(await page.locator('lhs-help-search').count(),1);
    const input=page.locator('#help-search');
    await input.fill('SALVÁR');
    await page.locator('.faq details:visible').first().waitFor({state:'visible'});
    assert.ok(await page.locator('.faq details:visible').count()>0);
    await input.fill('termo totalmente ausente z98765');
    await page.locator('.faq').getByText('Nenhuma resposta encontrada.').waitFor();
    assert.equal(await page.locator('.faq details:visible').count(),0);
    if(mobile)await page.locator('.faq button').tap();
    else await page.locator('.faq button').click();
    assert.equal(await input.inputValue(),'');
    assert.equal(await input.evaluate(node=>document.activeElement===node),true);
    await page.locator('.faq details:visible').first().waitFor();
    assert.equal(await page.locator('.faq details:visible').count(),7);
    await page.reload({waitUntil:'networkidle'});
    await page.waitForFunction(()=>
     document.documentElement.dataset.siteFramework==='angular-rewrite');
    assert.equal(await page.locator('lhs-help-search').count(),1);
    assert.equal(await page.locator('#help-search').inputValue(),'');
    assert.equal(await page.locator('.faq details:visible').count(),7);
   }
   if(pathname==='/jogar/'){
    assert.equal(await page.locator('lhs-game-launcher').count(),1);
    assert.equal(await page.locator('#game-frame').count(),0);
    if(mobile)await page.locator('#launch-game').tap();
    else await page.locator('#launch-game').click();
    await page.locator('#game-frame').waitFor({state:'attached',timeout:10000});
    assert.equal(await page.locator('#game-frame').count(),1);
    await page.frameLocator('#game-frame').locator('#menu-new')
      .waitFor({state:'visible',timeout:20000});
    // Reload must restore the passive preview instead of automatically
    // launching a second Canvas runtime or duplicating the iframe.
    await page.reload({waitUntil:'networkidle'});
    await page.waitForFunction(()=>
      document.documentElement.dataset.siteFramework==='angular-rewrite');
    assert.equal(await page.locator('lhs-game-launcher').count(),1);
    assert.equal(await page.locator('#game-frame').count(),0);
    assert.equal(await page.locator('#launch-game').isVisible(),true);
   }
   if(pathname==='/donate/'){
    assert.equal(await page.locator('lhs-donate').count(),1);
    assert.equal(await page.locator('[data-donate-package]').count(),2);
    assert.equal(await page.locator('[data-donate-package]:disabled').count(),2);
    assert.equal(await page.locator('script[src*="donate"]').count(),0);
    await page.waitForFunction(()=>
     document.querySelector('#donate-status')?.textContent?.includes('não liberadas'));
    assert.ok(donateCalls>=1);
    donateMode='active';
    await page.reload({waitUntil:'networkidle'});
    await page.waitForFunction(()=>
     document.querySelector('#donate-status')?.textContent?.includes('Serviço de pagamentos ativo'));
    assert.equal(await page.locator('[data-donate-package]:disabled').count(),2);
    assert.equal(await page.locator('a[href*="mercadopago"]').count(),0);
    donateMode='error';
    await page.reload({waitUntil:'networkidle'});
    await page.waitForFunction(()=>
     document.querySelector('#donate-status')?.textContent?.includes('Não foi possível consultar'));
    assert.equal(await page.locator('[data-donate-package]:disabled').count(),2);
    assert.equal(unsafePaymentCalls,0,'Donate read-only must not issue external orders/checkout');
    assert.ok(await page.evaluate(()=>
     document.documentElement.scrollWidth<=innerWidth+2),'Donate must not overflow at '+width);
    donateMode='disabled';
   }
   if(pathname==='/dados/'){
    // Seed only this origin; never use a production/user storage value.
    await page.evaluate(()=>{
     localStorage.setItem('lhs-save-v1','{"day":1,"test":"clean-angular"}');
     localStorage.setItem('lhs.sound','off');
     localStorage.setItem('another-project-unrelated','keep-this');
    });
    await page.reload({waitUntil:'networkidle'});
    await page.waitForFunction(()=>
     document.documentElement.dataset.siteFramework==='angular-rewrite');
    const save=page.locator('#delete-local-save');
    const sound=page.locator('#delete-local-sound');
    const dialog=page.locator('#delete-dialog');
    assert.equal(await save.isEnabled(),true);
    assert.equal(await sound.isEnabled(),true);
    assert.equal(await page.locator('lhs-local-data').count(),1);
    if(mobile)await save.tap();else await save.click();
    await dialog.waitFor({state:'visible'});
    assert.ok(await dialog.evaluate(el=>el instanceof HTMLDialogElement&&el.open));
    assert.equal(await page.locator('#delete-title').innerText(),'Apagar a partida local?');
    // Escape and Cancel must NEVER delete.
    await page.keyboard.press('Escape');
    await dialog.waitFor({state:'hidden'});
    assert.ok(await page.evaluate(()=>localStorage.getItem('lhs-save-v1')!==null));
    if(mobile)await save.tap();else await save.click();
    await dialog.waitFor({state:'visible'});
    await page.locator('#cancel-delete').click();
    await dialog.waitFor({state:'hidden'});
    assert.ok(await page.evaluate(()=>localStorage.getItem('lhs-save-v1')!==null));
    // Explicit confirm removes only the save.
    if(mobile)await save.tap();else await save.click();
    await dialog.waitFor({state:'visible'});
    await page.locator('#confirm-delete').click();
    await dialog.waitFor({state:'hidden'});
    await page.waitForFunction(()=>
     document.querySelector('#data-status')?.textContent?.includes('Partida local apagada.'));
    assert.deepEqual(await page.evaluate(()=>({
     save:localStorage.getItem('lhs-save-v1'),
     sound:localStorage.getItem('lhs.sound'),
     other:localStorage.getItem('another-project-unrelated')
    })),{save:null,sound:'off',other:'keep-this'});
    assert.equal(await save.isDisabled(),true);
    assert.equal(await sound.isEnabled(),true);
    // Sound is a separate action, never affects any other key.
    if(mobile)await sound.tap();else await sound.click();
    await dialog.waitFor({state:'visible'});
    await page.locator('#confirm-delete').click();
    await dialog.waitFor({state:'hidden'});
    // HTMLDialogElement "close" is dispatched after the visual close.
    // Wait for Angular's actual completion message and the storage change.
    await page.waitForFunction(()=>
     document.querySelector('#data-status')?.textContent?.includes('Preferência de som redefinida.') &&
     localStorage.getItem('lhs.sound')===null);
    assert.deepEqual(await page.evaluate(()=>({
     save:localStorage.getItem('lhs-save-v1'),
     sound:localStorage.getItem('lhs.sound'),
     other:localStorage.getItem('another-project-unrelated')
    })),{save:null,sound:null,other:'keep-this'});
    assert.equal(await sound.isDisabled(),true);
    await page.reload({waitUntil:'networkidle'});
    await page.waitForFunction(()=>
     document.documentElement.dataset.siteFramework==='angular-rewrite');
    assert.equal(await page.locator('#delete-local-save').isDisabled(),true);
    assert.equal(await page.locator('#delete-local-sound').isDisabled(),true);
    // Browser denial should display feedback, NOT clear any other entries.
    await page.evaluate(()=>{
     localStorage.setItem('lhs-save-v1','test-denied');
    });
    await page.reload({waitUntil:'networkidle'});
    await page.waitForFunction(()=>
     document.documentElement.dataset.siteFramework==='angular-rewrite');
    await page.evaluate(()=>{
     const original=Storage.prototype.removeItem;
     Storage.prototype.removeItem=function(key){
      if(key==='lhs-save-v1')throw new DOMException('Storage unavailable','SecurityError');
      return original.call(this,key);
     };
    });
    await page.locator('#delete-local-save').click();
    await dialog.waitFor({state:'visible'});
    await page.locator('#confirm-delete').click();
    await dialog.waitFor({state:'hidden'});
    await page.waitForFunction(()=>
     document.querySelector('#data-status')?.textContent?.includes('não permitiu alterar'));
    assert.equal(await page.evaluate(()=>localStorage.getItem('lhs-save-v1')),'test-denied');
    await page.reload({waitUntil:'networkidle'});
    await page.waitForFunction(()=>
     document.documentElement.dataset.siteFramework==='angular-rewrite');
    assert.equal(await page.locator('#delete-local-save').isEnabled(),true);
    // Leave this test origin clean without touching arbitrary keys.
    await page.evaluate(()=>{
     localStorage.removeItem('lhs-save-v1');
     localStorage.removeItem('another-project-unrelated');
    });
    assert.deepEqual(errors,[],'Angular local storage tests should not produce page errors');
   }

   if(pathname==='/termos/'||pathname==='/privacidade/'){
    const terms=pathname==='/termos/';
    const expected=terms?10:11;
    const sections=page.locator('.legal-body section');
    const index=page.locator('.legal-index nav a');
    assert.equal(await sections.count(),expected,
     'Every legal section must be present in the Angular DOM on '+pathname);
    assert.equal(await index.count(),expected,
     'Legal index and document must have matching sections');
    assert.equal(await page.locator('.draft-notice').count(),1);
    assert.equal(await page.locator('main h1').count(),1);
    assert.equal(await page.locator('script[src*="site.mjs"]').count(),0);
    const anchor=index.first();
    assert.equal(await anchor.getAttribute('href'),terms?'/termos/#projeto':'/privacidade/#responsavel');
    if(mobile)await anchor.tap();else await anchor.click();
    await page.waitForFunction(({id,pathname})=>
     location.hash==='#'+id&&location.pathname===pathname,
     {id:terms?'projeto':'responsavel',pathname});
    const sectionLayout=await sections.first().evaluate(element=>{
     const rect=element.getBoundingClientRect();
     const style=getComputedStyle(element);
     return {display:style.display,visibility:style.visibility,opacity:style.opacity,
      width:Math.round(rect.width),height:Math.round(rect.height),
      top:Math.round(rect.top),scrollY:window.scrollY,hash:location.hash,
      text:element.textContent?.slice(0,90)};
    });
    console.log('ANGULAR_LEGAL_ANCHOR_DIAGNOSTIC',
     JSON.stringify({pathname,width,sectionLayout}));
    assert.ok(sectionLayout.width>0&&sectionLayout.height>0,
     'Legal section unexpectedly has no painted geometry: '+
     JSON.stringify({pathname,width,sectionLayout}));
    // F5 after a fragment deep-link must keep the section and Angular-only DOM.
    const sectionRefresh=await page.reload({waitUntil:'networkidle'});
    assert.equal(sectionRefresh?.status(),200);
    await page.waitForFunction(()=>
     document.documentElement.dataset.siteFramework==='angular-rewrite');
    assert.equal(await page.locator('.legal-body section').count(),expected);
    assert.equal(await page.locator('header nav').count(),1);
    assert.ok(await page.evaluate(()=>
     document.documentElement.scrollWidth<=innerWidth+2),
     'Legal page must not jump horizontally after F5 at '+width+'px');
   }

   assert.deepEqual(errors,[],'JS/asset errors at '+pathname+' '+width+'px');
  }
  await page.goto(origin+'/',{waitUntil:'networkidle'});
  await page.waitForFunction(()=>
   document.documentElement.dataset.siteFramework==='angular-rewrite');
  const before=await page.evaluate(()=>({
   y:window.scrollY,scrollHeight:document.documentElement.scrollHeight,
   clientHeight:document.documentElement.clientHeight,
   innerHeight:innerHeight,scrolling:document.scrollingElement?.tagName,
   overflow: getComputedStyle(document.documentElement).overflowY
  }));
  assert.ok(before.scrollHeight-before.innerHeight>150,
   'Homepage has too little content to test scrolling: '+JSON.stringify(before));
  // Distinguish an actual locked document from a synthetic input issue.
  const programmatic=await page.evaluate(()=>{
   window.scrollTo(0,250);
   const moved=window.scrollY;
   window.scrollTo(0,0);
   const point=document.elementFromPoint(innerWidth/2,600);
   return {moved,point:point?.tagName,klass:point?.className,
    documentOverflow:getComputedStyle(document.documentElement).overflow,
    bodyOverflow:getComputedStyle(document.body).overflow};
  });
  console.log('ANGULAR_SCROLL_PROGRAMMATIC',JSON.stringify({width,programmatic}));
  assert.ok(programmatic.moved>100,'Document cannot scroll programmatically: '+
   JSON.stringify({width,programmatic}));
  await page.mouse.move(Math.floor(width/2),Math.min(600,850-40));
  if(mobile){
   const cdp=await context.newCDPSession(page);
   const x=Math.floor(width/2);
   await cdp.send('Input.dispatchTouchEvent',{
    type:'touchStart',touchPoints:[{x,y:640,id:1}]
   });
   for(let y=615;y>=250;y-=25){
    await cdp.send('Input.dispatchTouchEvent',{
     type:'touchMove',touchPoints:[{x,y,id:1}]
    });
    await page.waitForTimeout(16);
   }
   await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
   await cdp.detach();
  }else{
   await page.mouse.wheel(0,460);
  }
  await page.waitForTimeout(500);
  const after=await page.evaluate(()=>({
   y:window.scrollY,scrollTop:document.scrollingElement?.scrollTop,
   bodyScroll:document.body.scrollTop,
   scrollHeight:document.documentElement.scrollHeight,
   innerHeight:innerHeight
  }));
  console.log('ANGULAR_SCROLL_DIAGNOSTIC',JSON.stringify({width,before,after}));
  assert.ok(after.y>before.y+60,'Swipe/wheel failed to scroll page: '+
   JSON.stringify({width,before,after}));
  assert.ok(await page.evaluate(()=>
    document.documentElement.scrollWidth<=innerWidth+2),'No horizontal jump while scrolling');
  await page.screenshot({path:resolve(output,'angular-clean-'+width+'.png'),fullPage:true});
  results.push({width,routeReloads:8,legalRoutes:2,donateReadOnly:true,localDataVerified:true,angularOnly:true,scrollTest:mobile?'touch-cdp':'wheel',
   gameReload:true,errors:errors.length});
  await context.close();
 }
 await writeFile(resolve(output,'results.json'),JSON.stringify({passed:true,results},null,2)+'\n');
 console.log('Clean Angular browser QA:',JSON.stringify(results));
}finally{
 await browser?.close();
 await new Promise(done=>server.close(done));
}
