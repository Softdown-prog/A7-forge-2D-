import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {sourceGraph,runtimeCycles} from './helpers/sourceGraph.mjs';
import {createGame,isValidSave,stepGame} from '../dist/js/sim/engine.js';
import {expandShop} from '../dist/js/sim/economy.js';
import {buyComputer} from '../dist/js/sim/shop.js';

const baseline=JSON.parse(readFileSync(new URL('./fixtures/architecture-baseline-b73c5aa.json',import.meta.url),'utf8'));
for(const fixture of baseline)test(`three-day replay preserves b73c5aa gameplay after Windows slot normalization: ${fixture.mode}/${fixture.seed}`,()=>{
 const state=createGame(fixture.seed,fixture.mode);state.cash=50000;
 // A referência antecede o desbloqueio por revistas e representa um save legado.
 delete state.topGamesUnlockMode;
 const actions=[];
 for(let i=0;i<2;i++){actions.push(expandShop(state),buyComputer(state),buyComputer(state));}
 assert.ok(actions.every(action=>action.ok),'including sixth and seventh PCs');
 assert.deepEqual(actions,fixture.actions);
 for(let i=0;i<720*3;i++)stepGame(state,1);
 assert.equal(state.totalMinutes,fixture.minutes);assert.equal(state.installedPcs,7);
 // PC purchases now normalize Windows/licenses for all existing stations.
 // The b73c5aa fixture predates this correction: its four appended entries
 // correspond to main PCs 4..7 while the initial three were implicit.
 // Only adapt those two representation-only fields when checking the old
 // byte-for-byte gameplay fingerprint; do NOT hide changes to economy/RNG,
 // customers, game time, expansion, or any other serialized state.
 assert.equal(isValidSave(state),true,'the current full save must be valid');
 assert.deepEqual(state.pcWindows,Array(7).fill('win98'));
 assert.deepEqual(state.pcWindowsLicenses,Array(7).fill(false));
 const legacyFingerprintView={...state,
  pcWindows:state.pcWindows.slice(3),
  pcWindowsLicenses:state.pcWindowsLicenses.slice(3)};
 assert.equal(createHash('sha256').update(JSON.stringify(legacyFingerprintView)).digest('hex'),fixture.hash);
});
test('simulation imports only simulation modules, including directions',()=>{
 for(const [file,module] of sourceGraph())if(file.startsWith('sim/'))for(const edge of module.imports){
  assert.ok(edge.target?.startsWith('sim/'),`${file} -> ${edge.specifier}`);
 }
});
test('runtime module graph has no dependency cycles',()=>assert.deepEqual(runtimeCycles(sourceGraph()),[]));
