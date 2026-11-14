/** Real LHS Chromium scenario. Preserve native actions and save behavior. */
import assert from 'node:assert/strict';
import {resolve} from 'node:path';

export async function verifyStockManagement({browser,origin,output,createGame,DAY_MINUTES,GAME_SAVE_KEY}){
 // The original merchandise/stock DOM controller must operate on an
 // Angular-owned form without duplicate IDs, fake purchases or stale saves.
 const stockManagementResults=[];
 for(const scenario of [
  {width:1280,year:2000},{width:414,year:2000},
  {width:360,year:2000},{width:414,year:1998}
 ]){
  const mobile=scenario.width<700;
  const context=await browser.newContext({
   viewport:{width:scenario.width,height:900},isMobile:mobile,hasTouch:mobile
  });
  const fixture=createGame(15000+scenario.width+scenario.year,'historical');
  fixture.totalMinutes=(scenario.year-1998)*360*DAY_MINUTES;
  fixture.cash=2000;fixture.pcPoweredOff=[true,true,true];
  fixture.offlineUntil=fixture.totalMinutes+500;
  await context.addInitScript(({key,save})=>{
   if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify(save));
   localStorage.setItem('lhs.sound','off');
   localStorage.setItem('lhs.privacy-choice.v1',
    JSON.stringify({version:1,choice:'rejected',at:Date.now()}));
  },{key:GAME_SAVE_KEY,save:fixture});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  const press=async button=>mobile?button.tap():button.click();
  const persisted=()=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)),GAME_SAVE_KEY);
  await page.goto(origin,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.documentElement.dataset.uiFramework==='angular');
  assert.equal(await page.locator('#merchandise-catalog #angular-merchandise-catalog').count(),1,
   'The stock catalog host remains unique in Angular rehearsal');
  for(const id of [
   'merchandise-category','merchandise-product','merchandise-supplier',
   'merchandise-packs','merchandise-price','merchandise-price-form',
   'merchandise-order','merchandise-feedback'
  ])assert.equal(await page.locator('#'+id).count(),1,id+' must not be duplicated');
  await page.waitForFunction(()=>!document.querySelector('#menu-continue')?.disabled);
  await press(page.locator('#menu-continue'));
  await press(page.locator('#open-admin'));
  const angularArea=page.locator('#angular-admin-area-navigation');
  await press(angularArea.locator('[data-angular-admin-tab="stock"]'));
  const nativeArea=page.locator('#admin .admin-tabs [data-admin-tab="stock"]');
  assert.equal(await nativeArea.getAttribute('aria-selected'),'true',
   'Angular stock tab must delegate to native administration');
  const catalogTask=page.locator('#section-stock [data-panel-choice="catalog"]');
  const supplierTask=page.locator('#section-stock [data-panel-choice="suppliers"]');
  const stockWorkspace=page.locator('#angular-stock-workspace');
  const angularCatalog=stockWorkspace.locator('[data-angular-task="catalog"]');
  const angularSuppliers=stockWorkspace.locator('[data-angular-task="suppliers"]');
  const angularOrders=stockWorkspace.locator('[data-angular-task="orders"]');
  if(scenario.year<2000){
   assert.equal(await catalogTask.isDisabled(),true,'1998 catalog must remain locked');
   await page.waitForFunction(()=>document.querySelector('#angular-stock-workspace [data-angular-task="catalog"]')?.disabled===true);
   assert.equal(await angularCatalog.isDisabled(),true,
    'Angular stock navigation must mirror the 1998 catalog lock');
   assert.equal(await angularSuppliers.isEnabled(),true,
    'Angular suppliers remain accessible before advanced catalog unlock');
   assert.equal(await page.locator('#page-stock-catalog').isVisible(),false);
   assert.equal(await page.locator('#page-stock-suppliers').isVisible(),true);
   assert.equal(await page.locator('#stock-soda').isEnabled(),true,
    'Legacy inventory is still available without advanced catalog');
   assert.equal((await persisted()).cash,2000,
    'Locked advanced catalog cannot charge the player');
  }else{
   assert.equal(await catalogTask.isEnabled(),true,'Catalog unlocks in 2000');
   await page.waitForFunction(()=>document.querySelector('#angular-stock-workspace [data-angular-task="catalog"]')?.disabled===false);
   assert.equal(await angularCatalog.isEnabled(),true,
    'Angular catalog mirrors the unlocked native command');
   await press(angularCatalog);
   const root=page.locator('#angular-merchandise-catalog');
   await root.waitFor({state:'visible'});
   assert.equal(await page.locator('#page-stock-catalog').isVisible(),true);
   assert.equal(await root.locator('#merchandise-product option').count()>1,true,
    'Native port populates Angular form with real product options');
   await root.locator('#merchandise-product').selectOption('water');
   await root.locator('#merchandise-supplier').selectOption('economy');
   assert.equal(await root.locator('#merchandise-packs').inputValue(),'3',
    'Minimum supplier pack quantity comes from the native port');
   assert.match(await root.locator('#merchandise-quote').innerText(),/Pedido:/);
   const first=await persisted();
   await press(root.locator('#merchandise-order'));
   assert.match(await root.locator('#merchandise-feedback').innerText(),/Entrega em 1 dia/);
   const ordered=await persisted();
   assert.equal(ordered.merchandise?.orders?.length,1,'Exactly one order committed');
   assert.equal(ordered.merchandise.orders[0].product,'water');
   assert.ok(ordered.cash<first.cash&&ordered.cash>0,
    'Real merchandise order charges the game cash once');
   await press(angularOrders);
   assert.match(await page.locator('#merchandise-orders').innerText(),/36 un/,
    'Angular catalog order is visible in native deliveries panel');
   await press(angularSuppliers);
   assert.equal(await page.locator('#supplier-up').isEnabled(),true,
    'Supplier upgrade remains available through the native stock panel');
   await press(angularCatalog);
   await root.locator('#merchandise-category').selectOption('candy');
   await root.locator('#merchandise-product').selectOption('pacoca');
   await root.locator('#merchandise-price').fill('0.90');
   const priceHandle=await root.locator('#merchandise-price').evaluate(element=>{
    window.__stockInputForQa=element;
    return element.value;
   });
   assert.equal(priceHandle,'0.90');
   await press(root.locator('#merchandise-price-form button[type="submit"]'));
   assert.match(await root.locator('#merchandise-feedback').innerText(),/0.90/);
   assert.equal(await page.evaluate(()=>
    window.__stockInputForQa===document.getElementById('merchandise-price')),true,
    'Saving a price must not recreate Angular-owned inputs or steal focus');
   const afterPrice=await persisted();
   assert.equal(afterPrice.merchandise.orders.length,1,
    'Changing a retail price cannot silently create another order');
   const overflow=await page.locator('#admin').evaluate(el=>el.scrollWidth-el.clientWidth);
   assert.ok(overflow<=3,'Angular stock must not cause horizontal overflow: '+overflow);
   await page.screenshot({path:resolve(output,
    'angular-stock-'+scenario.width+'.png'),fullPage:true});
   await page.reload({waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>document.documentElement.dataset.uiFramework==='angular');
   await page.waitForFunction(()=>!document.querySelector('#menu-continue')?.disabled);
   await press(page.locator('#menu-continue'));
   await press(page.locator('#open-admin'));
   await press(page.locator('#angular-admin-area-navigation [data-angular-admin-tab="stock"]'));
   await press(page.locator('#angular-stock-workspace [data-angular-task="catalog"]'));
   const restoredRoot=page.locator('#angular-merchandise-catalog');
   await restoredRoot.locator('#merchandise-category').selectOption('candy');
   await restoredRoot.locator('#merchandise-product').selectOption('pacoca');
   assert.equal(await restoredRoot.locator('#merchandise-price').inputValue(),'0.90',
    'Edited price persisted through reload and Angular DOM recreation');
   await press(page.locator('#angular-stock-workspace [data-angular-task="orders"]'));
   assert.match(await page.locator('#merchandise-orders').innerText(),/36 un/,
    'One paid pending order survives reload');
   const restored=await persisted();
   assert.equal(restored.merchandise.orders.length,1);
   assert.equal(restored.cash,afterPrice.cash,
    'Reload does not bill pending merchandise deliveries twice');
  }
  assert.deepEqual(errors,[],'No JS errors in stock catalog rehearsal');
  stockManagementResults.push({width:scenario.width,year:scenario.year,
   angularOwned:true,locked:scenario.year<2000,
   orderAndPricePersisted:scenario.year>=2000,runtimeErrors:errors.length});
  await context.close();
 }
 return stockManagementResults;
}
