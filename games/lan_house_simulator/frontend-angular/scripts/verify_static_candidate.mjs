/** Smoke test the ACTUAL static candidate artifact in Chromium.
 * Unlike the integrated game rehearsal, this server reads only copied files
 * from out/angular-cutover-candidate. No production deployment is involved.
 */
import {createRequire} from 'node:module';
import {createServer} from 'node:http';
import {readFile,mkdir,stat,writeFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import assert from 'node:assert/strict';

const root=resolve(import.meta.dirname,'../../out/angular-cutover-candidate');
const output=resolve(import.meta.dirname,'../../out/angular-cutover-smoke');
const browserTools=createRequire(resolve(import.meta.dirname,'../../.angular-browser-tools/package.json'));
const {chromium}=browserTools('playwright');
const mime={
 '.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8',
 '.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8',
 '.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp',
 '.wav':'audio/wav','.ogg':'audio/ogg','.ico':'image/x-icon'
};
const [index,manifest]=await Promise.all([
 readFile(resolve(root,'index.html'),'utf8'),
 readFile(resolve(root,'angular-candidate-report.json'),'utf8').then(JSON.parse)
]);
assert.equal(manifest.deployApproved,false,'QA candidate is never an approved deploy');
assert.equal(manifest.reactBootstrap,false,'React must be absent in candidate');
assert.ok(!index.includes('src="./js/react-entry.js"'),'No React script in compiled candidate');
for(const file of ['__angular/main.js','__angular/styles.css','js/main.js'])
 assert.ok((await stat(resolve(root,file))).isFile(),'Missing compiled asset: '+file);
await assert.rejects(stat(resolve(root,'js/react-entry.js')),{code:'ENOENT'});
await mkdir(output,{recursive:true});
const server=createServer(async(req,res)=>{
 try{
  const pathname=decodeURIComponent(new URL(req.url??'/','http://localhost').pathname);
  const target=resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
  if(target!==root&&!target.startsWith(root+sep)){res.writeHead(403).end();return;}
  const bytes=await readFile(target);
  res.writeHead(200,{'content-type':mime[extname(target)]??'application/octet-stream'});
  res.end(bytes);
 }catch{res.writeHead(404).end('Missing candidate asset');}
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const origin='http://127.0.0.1:'+server.address().port;
const reports=[];
let browser;
try{
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 for(const width of [1280,414]){
  const mobile=width<700;
  const context=await browser.newContext({
   viewport:{width,height:860},isMobile:mobile,hasTouch:mobile
  });
  const page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(origin,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>
   document.documentElement.dataset.uiFramework==='angular' &&
   document.documentElement.dataset.gameReady==='true',null,{timeout:20000});
  assert.equal(await page.locator('#react-menu-actions #menu-new').count(),1,
   'Angular menu must mount before original Canvas game');
  assert.equal(await page.locator('#angular-save-transfer #save-export').count(),1,
   'Original save action ID must exist exactly once');
  assert.equal(await page.locator('#angular-shop-overview #organize-furniture').count(),1,
   'The native layout editor command must be projected by Angular');
  assert.equal(await page.locator('#angular-shop-overview #demolish-walls').count(),1,
   'The native demolition command must be projected by Angular');
  assert.equal(await page.locator('#angular-time-weather #time-weather-panel').count(),1,
   'Angular owns the live calendar');
  assert.equal(await page.locator('#angular-notice-inbox #notices').count(),1,
   'Angular owns the real inbox dialog');
  assert.equal(await page.locator('script[src*="react-entry.js"]').count(),0,
   'No React bootstrap survives the candidate');
  assert.equal(await page.locator('#game').count(),1,
   'Original Canvas must not be removed by cutover');
  assert.deepEqual(errors,[],'No uncaught runtime errors in static candidate');
  await page.screenshot({path:resolve(output,'candidate-'+width+'.png'),fullPage:true});
  reports.push({width,mobile,angular:true,canvasReady:true,react:false,errors:errors.length});
  await context.close();
 }
 await writeFile(resolve(output,'results.json'),JSON.stringify(reports,null,2)+'\n');
 console.log('Static LHS Angular cutover smoke:',JSON.stringify(reports));
}finally{
 await browser?.close();
 await new Promise(done=>server.close(done));
}
