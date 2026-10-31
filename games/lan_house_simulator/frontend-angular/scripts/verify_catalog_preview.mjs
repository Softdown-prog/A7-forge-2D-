/**
 * Chromium contract QA for the isolated Angular preview.
 * Sends read-only presentation snapshots and mounts a tiny native controller
 * fixture to check event forwarding. It does not claim to run game simulation.
 */
import {createRequire} from 'node:module';
import {createServer} from 'node:http';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import assert from 'node:assert/strict';

// Playwright is deliberately isolated from the locked Angular workspace.
const requireBrowserTools=createRequire(resolve(import.meta.dirname,'../../.angular-browser-tools/package.json'));
const {chromium}=requireBrowserTools('playwright');
const root=resolve(import.meta.dirname,'../dist/game-ui/browser');
const output=resolve(import.meta.dirname,'../../out/angular-catalog-browser');
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css',
 '.svg':'image/svg+xml','.json':'application/json','.png':'image/png'};
await mkdir(output,{recursive:true});
const server=createServer(async(req,res)=>{
 try{
  const url=new URL(req.url??'/','http://localhost');
  const path=resolve(root,'.'+(url.pathname==='/'?'/index.html':decodeURIComponent(url.pathname)));
  if(path!==root&&!path.startsWith(root+sep)){res.writeHead(403).end();return;}
  const data=await readFile(path);
  res.writeHead(200,{'content-type':mime[extname(path)]??'application/octet-stream'});
  res.end(data);
 }catch{res.writeHead(404).end();}
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const origin='http://127.0.0.1:'+server.address().port;
let browser;
const results=[];
try{
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 for(const width of [1280,414,360]){
  const mobile=width<700;
  const context=await browser.newContext({
   viewport:{width,height:900},isMobile:mobile,hasTouch:mobile
  });
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(origin,{waitUntil:'load'});
  await page.waitForFunction(()=>document.documentElement.dataset.uiFramework==='angular');
  await page.evaluate(()=>{
   const native=document.getElementById('shop-catalog');
   if(!native)throw Error('Native shop command fixture host is missing');
   native.hidden=true;
   native.innerHTML=[
    '<select id="ps1-placement"><option value="north">Norte</option><option value="south">Sul</option><option value="west">Oeste</option></select>',
    '<div class="ps1-location-selector"><button id="native-prev">Anterior</button><button id="native-next">Próximo</button></div>',
    '<select id="ps2-placement"><option value="bench-a">Bancada A</option><option value="bench-b">Bancada B</option></select>',
    '<button data-buy="ps1">Comprar bancada PS1</button>',
    '<button data-buy="ps2">Comprar bancada PS2</button>',
    '<button data-buy="printer">Comprar impressora</button>',
    '<button data-buy="plant" disabled>Não disponível</button>',
    '<button data-buy-ps1-disc="turbo">Comprar Turbo</button>',
    '<button data-buy-ps1-disc="locked" disabled>Bloqueado</button>',
    '<button data-buy-ps2-game="cidade">Comprar Cidade</button>',
    '<button data-buy-ps2-game="locked" disabled>Bloqueado</button>'
   ].join('');
   window.__qaActions=[];
   native.addEventListener('click',e=>{
    const node=e.target.closest('button');
    if(!node||node.disabled||node.id==='native-prev'||node.id==='native-next')return;
    window.__qaActions.push({
     buy:node.dataset.buy??null,disc:node.dataset.buyPs1Disc??null,
     game:node.dataset.buyPs2Game??null,ps1:document.querySelector('#ps1-placement').value,
     ps2:document.querySelector('#ps2-placement').value
    });
   });
   const select=native.querySelector('#ps1-placement');
   for(const [id,delta] of [['native-prev',-1],['native-next',1]]){
    native.querySelector('#'+id).addEventListener('click',()=>{
     const options=Array.from(select.options).map(o=>o.value);
     const next=(options.indexOf(select.value)+delta+options.length)%options.length;
     select.value=options[next];
     window.__qaActions.push({selection:select.value});
    });
   }
   document.dispatchEvent(new CustomEvent('lhs:shop-cards-updated',{detail:{
    category:'consoles',cards:[],consolesPending:true
   }}));
   document.dispatchEvent(new CustomEvent('lhs:shop-consoles-updated',{detail:{
    ps1:{offerText:'Comprar bancada PS1',offerDisabled:false,
     slots:[{id:'north',label:'Norte'},{id:'south',label:'Sul'},{id:'west',label:'Oeste'}],
     selected:'north',artwork:null,
     discs:[{id:'turbo',title:'Turbo',genre:'Corrida',copies:1,
       priceText:'R$ 20',buttonText:'Comprar CD · R$ 20',disabled:false,cover:null},
      {id:'locked',title:'Bloqueado',genre:'Aventura',copies:3,
       priceText:'R$ 20',buttonText:'Acervo completo',disabled:true,cover:null}]},
    ps2:{benchText:'Comprar bancada PS2 · R$ 900',benchDisabled:false,
     slots:[{id:'bench-a',label:'Bancada A'},{id:'bench-b',label:'Bancada B'}],
     artwork:null,
     games:[{id:'cidade',title:'Cidade',genre:'Aventura',copies:0,
       buttonText:'Comprar jogo · R$ 120',disabled:false,cover:null},
      {id:'locked',title:'Bloqueado PS2',genre:'Corrida',copies:3,
       buttonText:'Acervo completo',disabled:true,cover:null}]}
   }}));
  });
  const consoleShop=page.locator('.angular-console-shop');
  await consoleShop.waitFor();
  assert.equal(await page.locator('#angular-ps1-placement option').count(),3);
  assert.equal(await page.locator('#angular-ps2-placement option').count(),2);
  await page.locator('#angular-ps1-placement').selectOption('west');
  assert.equal(await page.locator('#ps1-placement').inputValue(),'west');
  await page.locator('#angular-ps2-placement').selectOption('bench-b');
  assert.equal(await page.locator('#ps2-placement').inputValue(),'bench-b');
  await consoleShop.getByRole('button',{name:'Comprar bancada PS1'}).click();
  await consoleShop.getByRole('button',{name:'Comprar bancada PS2 · R$ 900'}).click();
  await consoleShop.getByRole('button',{name:'Comprar CD · R$ 20'}).click();
  await consoleShop.getByRole('button',{name:'Comprar jogo · R$ 120'}).click();
  assert.equal(await consoleShop.getByRole('button',{name:'Acervo completo'}).count(),2);
  assert.equal(await consoleShop.getByRole('button',{name:'Acervo completo'}).first().isDisabled(),true);
  assert.equal(await consoleShop.getByRole('button',{name:'Acervo completo'}).last().isDisabled(),true);
  const bought=await page.evaluate(()=>window.__qaActions);
  const purchases=bought.filter(a=>a.buy||a.disc||a.game);
  assert.equal(purchases.length,4,'One native delegated action for each permitted purchase');
  assert.deepEqual(purchases.map(a=>a.buy??a.disc??a.game),['ps1','ps2','turbo','cidade']);
  assert.ok(purchases.every(a=>a.ps1==='west'&&a.ps2==='bench-b'),'Both native slots forwarded');
  assert.ok(bought.some(a=>a.selection==='west'),'Angular must use PS1 native arrows');

  await page.evaluate(()=>{
   document.dispatchEvent(new CustomEvent('lhs:shop-cards-updated',{detail:{
    category:'equipment',consolesPending:false,cards:[
     {id:'printer',label:'Impressora',category:'Serviços',description:'Impressão',
      icon:'computer',artworkSrc:null,buttonText:'Comprar impressora',
      buttonTitle:'',disabled:false,placementHint:null,ownedText:null},
     {id:'plant',label:'Planta',category:'Decoração',description:'Vaso',
      icon:'plant',artworkSrc:null,buttonText:'Caixa insuficiente',
      buttonTitle:'',disabled:true,placementHint:null,ownedText:null}
    ]
   }}));
  });
  const cards=page.locator('.angular-catalog-grid');
  await cards.getByRole('button',{name:'Comprar impressora'}).click();
  assert.equal(await cards.getByRole('button',{name:'Caixa insuficiente'}).isDisabled(),true);
  const count=await page.evaluate(()=>window.__qaActions.filter(a=>a.buy==='printer').length);
  assert.equal(count,1,'Ordinary shop action forwarded exactly once');
  assert.deepEqual(errors,[],'Preview must not throw JavaScript exceptions');
  await page.screenshot({path:resolve(output,'catalog-'+width+'.png'),fullPage:true});
  results.push({width,mobile,delegatedPurchases:purchases.length,slot:'west',
   ps2Slot:'bench-b',runtimeErrors:errors.length});
  await context.close();
 }
 await writeFile(resolve(output,'results.json'),JSON.stringify(results,null,2));
 console.log('Angular catalogue browser QA:',JSON.stringify(results));
}finally{
 await browser?.close();
 await new Promise(ok=>server.close(ok));
}
