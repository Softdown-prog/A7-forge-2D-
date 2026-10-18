// Generated simulator states, never player data. See tests/fixtures/README.md.
import {readFileSync} from 'node:fs';
import {snapshotGameState} from '../dist/js/sim/saveTransfer.js';
function load(name){return snapshotGameState(JSON.parse(readFileSync(new URL('../tests/fixtures/'+name,import.meta.url),'utf8')));}
export const exitNearBinScenario=()=>load('exit-near-bin.json');
export const shoppingCrossingScenario=()=>load('shopping-crossing.json');
