import test from 'node:test';
import assert from 'node:assert/strict';
import {sourceGraph,runtimeCycles} from './helpers/sourceGraph.mjs';
import {createGame,stepGame} from '../dist/js/sim/engine.js';
import {expandShop} from '../dist/js/sim/economy.js';
import {buyComputer} from '../dist/js/sim/shop.js';

// The game is under active development. Test current gameplay contracts,
// not byte-for-byte compatibility with old development snapshots.
for(const mode of ['classic','historical'])for(const seed of [72421,1543]){
 test(`three-day gameplay: seven PCs and operational simulation (${mode}/${seed})`,()=>{
  const state=createGame(seed,mode);state.cash=50000;
  assert.equal(state.installedPcs,3);
  assert.equal(buyComputer(state).ok,false,'three starter stations use all initial slots');
  for(let expansion=1;expansion<=2;expansion++){
   assert.equal(expandShop(state).ok,true,'expansion opens two stations');
   assert.equal(state.expansionLevel,expansion);
   assert.equal(buyComputer(state).ok,true,'first available PC is purchasable');
   assert.equal(buyComputer(state).ok,true,'second available PC is purchasable');
   assert.equal(state.installedPcs,3+expansion*2);
  }
  assert.equal(buyComputer(state).ok,false,'no eighth main-room PC without space');
  assert.equal(state.pcWindows?.length,7,'one Windows slot per station');
  assert.equal(state.pcWindowsLicenses?.length,7,'one license flag per station');
  for(let i=0;i<720*3;i++)stepGame(state,1);
  assert.equal(state.totalMinutes,2160);
  assert.equal(state.installedPcs,7);
  assert.equal(state.expansionLevel,2);
  assert.ok(Number.isFinite(state.cash),'cash remains finite');
  assert.ok(Number.isFinite(state.revenue),'revenue remains finite');
  assert.ok(Number.isFinite(state.expenses),'expenses remain finite');
  assert.ok(state.served>=0 && state.lostCustomers>=0);
  assert.ok(state.customers.every(c=>c.pcIndex===null||
   (Number.isInteger(c.pcIndex)&&c.pcIndex>=0&&c.pcIndex<7)),
   'active customers only point at installed PCs');
 });
}
test('simulation imports only simulation modules, including directions',()=>{
 for(const [file,module] of sourceGraph())if(file.startsWith('sim/'))for(const edge of module.imports){
  assert.ok(edge.target?.startsWith('sim/'),`${file} -> ${edge.specifier}`);
 }
});
test('runtime module graph has no dependency cycles',()=>assert.deepEqual(runtimeCycles(sourceGraph()),[]));
