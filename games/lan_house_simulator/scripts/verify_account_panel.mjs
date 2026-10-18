/** Smoke UI real — conta visível, catálogo completo e saldo não inventado offline.
 * Exercita menu inicial e topbar no desktop e celular.
 */
import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFile,mkdir} from 'node:fs/promises';
import {resolve,sep,extname} from 'node:path';
import {COOKIE_COSMETICS} from '../dist/js/sim/premiumCosmetics.js';
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
  await page.route('**/online-config.json',route=>route.fulfill({json:{enabled:false,apiUrl:'https://offline.example',firebaseApiKey:''}}));
  page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('http://127.0.0.1:'+server.address().port+'/',{waitUntil:'domcontentloaded'});
  await page.locator('#menu-account').click();
  const dialog=page.locator('#player-account');
  await dialog.waitFor({state:'visible'});
  if((await dialog.locator('#account-balance').innerText()).trim()!=='—')throw Error('Saldo offline não pode ser inventado');
  if(!(await dialog.locator('#account-connection').innerText()).includes('desativada'))throw Error('Explicação offline ausente');
  await dialog.locator('[data-account-tab="catalog"]').click();
  if(await dialog.locator('#account-catalog .account-item').count()!==COOKIE_COSMETICS.length)throw Error('Catálogo incompleto');
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
  if(await dialog.locator('.account-item').count()!==COOKIE_COSMETICS.length)throw Error('Catálogo inacessível durante jogo');
  if(errors.length)throw Error('JS: '+errors.join(' / '));
  await context.close();
 }
 // Contrato de interface autenticada em servidor simulado; sem cobranças reais.
 const context=await browser.newContext({viewport:{width:1280,height:830}});
 const page=await context.newPage();
 let wallet=100,spent=0,entitlements=[],activity=[],redemptions=0;
 const products={
  "headset-rgb-neon":{cookies:40,name:"Fone Gamer RGB Neon"},
  "chair-gamer-neon":{cookies:50,name:"Cadeira Gamer Neon"},
  "keyboard-rainbow-rgb":{cookies:25,name:"Teclado Rainbow RGB"},
  "neon-open-sign":{cookies:30,name:"Placa Neon ABERTO"},
  "arcade-checker-floor":{cookies:25,name:"Piso Arcade Xadrez"},
  "exclusive-arcade-posters":{cookies:12,name:"Pôsteres Exclusivos"},
  "tony-cyber":{cookies:60,name:"Tony Cyber"},
  "aquarium-rgb":{cookies:45,name:"Aquário Iluminado RGB"}
 };
 await page.route('**/online-config.json',route=>route.fulfill({
  contentType:'application/json',body:JSON.stringify({enabled:true,apiUrl:'https://wallet-test.example',firebaseApiKey:'fake-public-key'})
 }));
 await page.route('https://wallet-test.example/v1/config',route=>route.fulfill({
  contentType:'application/json',body:JSON.stringify({paymentsEnabled:false,items:products})
 }));
 await page.route('https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?**',route=>route.fulfill({
  contentType:'application/json',body:JSON.stringify({idToken:'verified-test-token',refreshToken:'refresh',localId:'local-123'})
 }));
 await page.route('https://identitytoolkit.googleapis.com/v1/accounts:lookup?**',route=>route.fulfill({json:{users:[{email:'tester@example.com',emailVerified:true}]}}));
 await page.route('https://securetoken.googleapis.com/**',route=>route.fulfill({json:{id_token:'verified-test-token',refresh_token:'refresh'}}));
 await page.route('https://wallet-test.example/v1/account',route=>route.fulfill({
  contentType:'application/json',body:JSON.stringify({
   uid:'local-123',cookiesBalance:wallet,cookiesSpentTotal:spent,entitlements,transactions:activity,historyLimit:40
  })
 }));
 await page.route('https://wallet-test.example/v1/items/*/purchase',async route=>{
  const id=new URL(route.request().url()).pathname.split('/').at(-2);
  const price=products[id]?.cookies;
  if(!price||wallet<price)return route.fulfill({status:409,contentType:'application/json',body:'{"error":"Cookies insuficientes."}'});
  if(!entitlements.includes(id)){
   entitlements.push(id);wallet-=price;spent+=price;redemptions++;
   activity=[{id:'item-'+id,type:'item',delta:-price,itemId:id,at:'2026-10-18T14:00:00-03:00'},...activity];
  }
  return route.fulfill({contentType:'application/json',body:JSON.stringify({owned:true,itemId:id})});
 });
 await page.goto('http://127.0.0.1:'+server.address().port+'/',{waitUntil:'domcontentloaded'});
 await page.locator('#menu-account').click();
 const panel=page.locator('#player-account');
 await panel.locator('#account-email').fill('tester@example.com');
 await panel.locator('#account-password').fill('not-a-real-password');
 await panel.locator('#account-signin').click();
 await page.waitForFunction(()=>document.querySelector('#account-balance')?.textContent==='100 Cookies');
 if((await panel.locator('#account-spent').innerText())!=='0 Cookies')throw Error('Histórico não iniciou zerado');
 await panel.locator('[data-account-tab="catalog"]').click();
 page.once('dialog',dialog=>dialog.accept());
 await panel.locator('#account-catalog .account-item').filter({hasText:'Fone Gamer RGB Neon'}).getByRole('button',{name:'Resgatar'}).click();
 await page.waitForFunction(()=>document.querySelector('#account-balance')?.textContent==='60 Cookies');
 if((await panel.locator('#account-spent').innerText())!=='40 Cookies')throw Error('Despesas totais incorretas');
 if((await panel.locator('#account-owned').innerText())!=='1')throw Error('Item não adquirido');
 if(redemptions!==1)throw Error('Resgate deve ser único');
 await panel.locator('[data-account-tab="inventory"]').click();
 const input=panel.locator('#account-inventory [data-premium-cosmetic="headset-rgb-neon"]');
 if(!await input.isChecked())throw Error('Entitlement não aplicado');
 await input.uncheck();
 if(await input.isChecked())throw Error('Controle de equipar não alterou');
 await input.check();
 await panel.locator('[data-account-tab="history"]').click();
 if(!((await panel.locator('#account-transactions').innerText()).includes('Resgate: Fone Gamer RGB Neon')))
  throw Error('Histórico não registrou o resgate');
 await page.screenshot({path:resolve(out,'minha_conta_historico_teste.png')});
 await panel.locator('[data-account-tab="summary"]').click();
 await page.screenshot({path:resolve(out,'minha_conta_saldo_teste.png')});
 await panel.locator('#account-logout').click();
 await page.waitForFunction(()=>document.querySelector('#account-balance')?.textContent==='—');
 if(redemptions!==1)throw Error('Logout causou novo resgate');
 await context.close();
 console.log('Minha Conta OK: desktop/mobile + autenticação de teste + resgate idempotente + débito + inventário + histórico.');

}finally{await browser.close();await new Promise(done=>server.close(done));}
