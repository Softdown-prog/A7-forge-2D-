/** Smoke UI real — conta visível, seis produtos e saldo não inventado offline.
 * Exercita menu inicial e topbar no desktop e celular.
 */
import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFile,mkdir} from 'node:fs/promises';
import {resolve,sep,extname} from 'node:path';
const root=resolve(import.meta.dirname,'../dist'),out=resolve(process.argv[2]??'out/account-panel');
await mkdir(out,{recursive:true});
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml'};
const server=createServer(async(req,res)=>{
 try{
  const u=new URL(req.url??'/','http://localhost');
  const file=resolve(root,'.'+(u.pathname==='/'?'/index.html':decodeURIComponent(u.pathname)));
  if(!file.startsWith(root+sep)&&file!==root){res.writeHead(403).end();return;}
  res.writeHead(200,{'content-type':mime[extname(file)]??'application/octet-stream'}).end(await readFile(file));
 }catch{res.writeHead(404).end();}
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
try{
 for(const width of [1280,390]){
  const context=await browser.newContext({viewport:{width,height:width===390?840:800},deviceScaleFactor:1,isMobile:width===390,hasTouch:width===390});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('http://127.0.0.1:'+server.address().port+'/',{waitUntil:'domcontentloaded'});
  await page.locator('#menu-account').click();
  const dialog=page.locator('#player-account');
  await dialog.waitFor({state:'visible'});
  if((await dialog.locator('#account-balance').innerText()).trim()!=='—')throw Error('Saldo offline não pode ser inventado');
  if(!(await dialog.locator('#account-connection').innerText()).includes('desativada'))throw Error('Explicação offline ausente');
  await dialog.locator('[data-account-tab="catalog"]').click();
  if(await dialog.locator('#account-catalog .account-item').count()!==6)throw Error('Catálogo incompleto');
  const prices=await dialog.locator('.account-item-price').allInnerTexts();
  if(!prices.some(x=>x.includes('40 Cookies'))||!prices.some(x=>x.includes('12 Cookies')))throw Error('Preços ausentes');
  if(await dialog.locator('#account-catalog button:enabled').count())throw Error('Resgate deve ficar indisponível offline');
  await page.screenshot({path:resolve(out,'minha_conta_catalogo_'+width+'.png')});
  await dialog.locator('[data-account-tab="history"]').click();
  if(!(await dialog.locator('#account-transactions').innerText()).includes('Entre na sua conta'))throw Error('Não avisou login obrigatório');
  await dialog.locator('[data-account-tab="inventory"]').click();
  if(!(await dialog.locator('#account-inventory').innerText()).includes('Entre na sua conta'))throw Error('Acervo offline falso');
  await dialog.locator('[data-account-tab="summary"]').click();
  await page.screenshot({path:resolve(out,'minha_conta_resumo_'+width+'.png')});
  await dialog.locator('#account-close').click();
  if(await dialog.isVisible())throw Error('Dialog não fechou');
  await page.locator('#menu-new').click();
  await page.locator('#open-account').click();
  await dialog.waitFor({state:'visible'});
  await dialog.locator('[data-account-tab="catalog"]').click();
  if(await dialog.locator('.account-item').count()!==6)throw Error('Catálogo inacessível durante jogo');
  if(errors.length)throw Error('JS: '+errors.join(' / '));
  await context.close();
 }
 console.log('Minha Conta OK: desktop/mobile, menu/topbar, catalog 6, sem saldo fake, sem resgate offline.');
}finally{await browser.close();await new Promise(done=>server.close(done));}
