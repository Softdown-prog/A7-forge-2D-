import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {sourceGraph,runtimeCycles} from './helpers/sourceGraph.mjs';
import {createGame,stepGame} from '../dist/js/sim/engine.js';
import {expandShop} from '../dist/js/sim/economy.js';
import {buyComputer} from '../dist/js/sim/shop.js';

const baseline=JSON.parse(readFileSync(new URL('./fixtures/architecture-baseline-b73c5aa.json',import.meta.url),'utf8'));
for(const fixture of baseline)test(`three-day replay matches b73c5aa byte-for-byte: ${fixture.mode}/${fixture.seed}`,()=>{
 const state=createGame(fixture.seed,fixture.mode);state.cash=50000;
 const actions=[];
 for(let i=0;i<2;i++){actions.push(expandShop(state),buyComputer(state),buyComputer(state));}
 assert.ok(actions.every(action=>action.ok),'including sixth and seventh PCs');
 assert.deepEqual(actions,fixture.actions);
 for(let i=0;i<720*3;i++)stepGame(state,1);
 assert.equal(state.totalMinutes,fixture.minutes);assert.equal(state.installedPcs,7);
 assert.equal(createHash('sha256').update(JSON.stringify(state)).digest('hex'),fixture.hash);
});
test('simulation imports only simulation modules, including directions',()=>{
 for(const [file,module] of sourceGraph())if(file.startsWith('sim/'))for(const edge of module.imports){
  assert.ok(edge.target?.startsWith('sim/'),`${file} -> ${edge.specifier}`);
 }
});
test('runtime module graph has no dependency cycles',()=>assert.deepEqual(runtimeCycles(sourceGraph()),[]));
