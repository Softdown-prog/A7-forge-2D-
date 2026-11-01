/** Real browser QA only for out/site-clean-angular. This does not deploy. */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,stat,mkdir,writeFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {chromium} from 'playwright';
const root=resolve(import.meta.dirname,'../out/site-clean-angular');
const output=resolve(import.meta.dirname,'../out/site-clean-angular-browser');
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
  const page=await context.newPage(),errors=[];
  page.on('pageerror',err=>errors.push('JS '+err.message));
  page.on('response',response=>{
   if(response.status()>=400&&new URL(response.url()).origin===origin&&
     /\.(?:js|css|svg|webp|json)$/.test(new URL(response.url()).pathname))
    errors.push('HTTP '+response.status()+' '+response.url());
  });
  for(const pathname of ['/','/sobre-o-jogo/','/ajuda/','/jogar/','/termos/','/privacidade/']){
   let res=await page.goto(origin+pathname,{waitUntil:'networkidle'});
   assert.equal(res?.status(),200);
   await page.waitForFunction(()=>
    document.documentElement.dataset.siteFramework==='angular-rewrite');
   assert.equal(await page.locator('lhs-site').count(),1);
   assert.equal(await page.locator('header nav').count(),1);
   assert.equal(await page.locator('main h1').count(),1);
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
   }
   if(pathname==='/ajuda/'){
    const input=page.locator('#help-search');
    await input.fill('salvar');
    assert.ok(await page.locator('.faq details:visible').count()>0);
    await input.fill('termo totalmente ausente z98765');
    assert.equal(await page.locator('.faq details:visible').count(),0);
   }
   if(pathname==='/jogar/'){
    assert.equal(await page.locator('#game-frame').count(),0);
    await page.locator('#launch-game').click();
    await page.frameLocator('#game-frame').locator('#menu-new')
      .waitFor({state:'visible',timeout:20000});
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
  results.push({width,routeReloads:6,legalRoutes:2,angularOnly:true,scrollTest:mobile?'touch-cdp':'wheel',
   gameReload:true,errors:errors.length});
  await context.close();
 }
 await writeFile(resolve(output,'results.json'),JSON.stringify({passed:true,results},null,2)+'\n');
 console.log('Clean Angular browser QA:',JSON.stringify(results));
}finally{
 await browser?.close();
 await new Promise(done=>server.close(done));
}
