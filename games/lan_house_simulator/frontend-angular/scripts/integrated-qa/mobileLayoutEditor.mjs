/** Real LHS Chromium scenario. Preserve native actions and save behavior. */
import assert from 'node:assert/strict';
import {resolve} from 'node:path';

export async function verifyMobileLayoutEditor({browser,origin,output,createGame,GAME_SAVE_KEY}){
 // Real-browser mobile editor regression: tap selects an on-screen PC, move
 // uses a Canvas touch destination, rotate/confirm persist through the native
 // application port. No Angular component writes to the save.
 const layoutEditorResults=[];
 for(const width of [414,360]){
  const context=await browser.newContext({
   viewport:{width,height:900},isMobile:true,hasTouch:true
  });
  const fixture=createGame(9400+width,'historical');
  fixture.cash=15000;
  fixture.pcPoweredOff=[true,true,true];
  fixture.offlineUntil=fixture.totalMinutes+500;
  await context.addInitScript(({key,save})=>{
   if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify(save));
   localStorage.setItem('lhs.sound','off');
   localStorage.setItem('lhs.privacy-choice.v1',JSON.stringify({
    version:1,choice:'rejected',at:Date.now()
   }));
  },{key:GAME_SAVE_KEY,save:fixture});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  const persisted=()=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)),GAME_SAVE_KEY);
  await page.goto(origin,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.documentElement.dataset.uiFramework==='angular');
  await page.waitForFunction(()=>!document.querySelector('#menu-continue')?.disabled);
  await page.locator('#menu-continue').tap();
  await page.locator('#game-app').waitFor({state:'visible'});
  await page.locator('#open-shop').tap();
  await page.locator('#organize-furniture').tap();
  const editor=page.locator('#layout-editor');
  await editor.waitFor({state:'visible'});
  assert.equal(await page.locator('#shop').isHidden(),true,
   'Native editor takes over from Angular shop without overlay collision');

  // Compute an actual on-screen projection using the game's compiled
  // isometric renderer and immutable save snapshot; the canvas receives a
  // genuine Chromium touchscreen tap, NOT a synthetic dispatchEvent.
  const worldTouch=async point=>page.evaluate(async({key,target})=>{
   const state=JSON.parse(localStorage.getItem(key));
   const {iso,cameraForGame}=await import('./js/render/isometric.js');
   const canvas=document.querySelector('#game');
   const viewport=document.querySelector('#scene-viewport');
   viewport.scrollIntoView({block:'center',behavior:'instant'});
   const pixel=iso(target,cameraForGame(state),target.height??0);
   const dx=pixel.x/canvas.width*canvas.offsetWidth;
   const dy=pixel.y/canvas.height*canvas.offsetHeight;
   viewport.scrollLeft=Math.max(0,dx-viewport.clientWidth/2);
   viewport.scrollTop=Math.max(0,dy-viewport.clientHeight/2);
   // The viewport's ResizeObserver may recenter the magnified canvas in a
   // pending animation frame after scrolling back from the editor controls.
   // Read screen coordinates only once those browser layout frames settle.
   await new Promise(done=>requestAnimationFrame(()=>requestAnimationFrame(done)));
   const rect=canvas.getBoundingClientRect();
   const x=rect.left+pixel.x/canvas.width*rect.width;
   const y=rect.top+pixel.y/canvas.height*rect.height;
   if(x<0||y<0||x>=innerWidth||y>=innerHeight)
    throw Error('Canvas destination outside mobile viewport: '+JSON.stringify({x,y,width:innerWidth,height:innerHeight}));
   return {x,y};
  },{key:GAME_SAVE_KEY,target:point});
  const source=await page.evaluate(async key=>{
   const state=JSON.parse(localStorage.getItem(key));
   const {editableObjects}=await import('./js/sim/editableObjects.js');
   return editableObjects(state).find(o=>o.id==='pc:0');
  },GAME_SAVE_KEY);
  assert.ok(source,'Original PC exists in actual save');
  const hit=await worldTouch({x:source.x+source.w/2,
   y:source.y+source.d/2,height:50});
  await page.touchscreen.tap(hit.x,hit.y);
  assert.equal(await page.locator('#layout-object').inputValue(),'pc:0',
   'Real touch on the Canvas selects PC 0 without a second compatibility click');

  const initial=await persisted(),initialMoney=initial.cash;
  await page.locator('#layout-rotate').tap();
  // This valid destination is also covered by the authoritative engine test.
  const destination=await worldTouch({x:2.5+source.w/2,y:3+source.d/2});
  await page.touchscreen.tap(destination.x,destination.y);
  assert.equal(await page.locator('#layout-confirm').isEnabled(),true,
   'Native placement validation approves the selected world-space target');
  await page.locator('#layout-confirm').tap();
  let saved=await persisted();
  const placed=saved.objectPlacements?.find(p=>p.id==='pc:0');
  assert.equal(placed?.id,'pc:0','Exactly the selected PC is moved');
  assert.equal(placed?.rotation,1,'Mobile rotation is committed');
  // Real mobile gestures can land on the adjacent 0.25-tile snap point after
  // independently scrolling the magnified canvas. Allow ONE grid interval,
  // never a different tile, and verify one authoritative saved placement.
  assert.ok(Math.abs(placed.x-2.5)<=0.25&&Math.abs(placed.y-3)<=0.25,
   'Touch destination must stay within one quarter-tile grid snap');
  assert.ok(Number.isInteger(placed.x*4)&&Number.isInteger(placed.y*4),
   'Native editor snaps placements to the quarter-tile grid');
  assert.notDeepEqual({x:placed.x,y:placed.y},{x:source.x,y:source.y},
   'Touch must really move the PC instead of only rotating it');
  assert.equal(saved.objectPlacements.filter(p=>p.id==='pc:0').length,1,
   'One mobile touch commits one saved placement');
  assert.equal(saved.cash,initialMoney,'Free editor move does not change cash');

  // Removing existing decoration must require confirmation and cannot be
  // silently triggered by a mobile touch or the compatibility click.
  await page.locator('#layout-object').selectOption('built-poster:2');
  assert.equal(await page.locator('#layout-remove').isEnabled(),true);
  await page.locator('#layout-remove').tap();
  await page.locator('#layout-removal').waitFor({state:'visible'});
  await page.locator('#layout-removal-cancel').tap();
  assert.equal((await persisted()).removedBuiltPosters?.includes(2)??false,false,
   'Cancellation leaves the built-in poster untouched');
  await page.locator('#layout-remove').tap();
  await page.locator('#layout-removal-confirm').tap();
  saved=await persisted();
  assert.ok(saved.removedBuiltPosters?.includes(2),
   'Confirmed poster removal persists via the native port');
  assert.equal(saved.cash,initialMoney,'Removing decoration gives no refund');
  await page.screenshot({path:resolve(output,'mobile-layout-'+width+'.png'),fullPage:true});
  await page.locator('#layout-close').tap();
  await editor.waitFor({state:'hidden'});
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.documentElement.dataset.uiFramework==='angular');
  const restored=await persisted();
  assert.deepEqual(restored.objectPlacements?.find(p=>p.id==='pc:0'),placed,
   'Mobile moved and rotated PC survives real reload');
  assert.ok(restored.removedBuiltPosters?.includes(2),
   'Removed poster stays removed after reload');
  assert.deepEqual(errors,[],'No runtime errors during mobile layout editing');
  layoutEditorResults.push({width,canvasTouch:true,rotation:placed.rotation,
   movedPc:true,confirmedRemoval:true,reload:true,runtimeErrors:errors.length});
  await context.close();
 }
 return layoutEditorResults;
}
