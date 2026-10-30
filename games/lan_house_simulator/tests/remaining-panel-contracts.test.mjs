import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame} from '../dist/js/sim/engine.js';
import {serializeSave} from '../dist/js/sim/saveTransfer.js';
import {createHardwarePanelPort} from '../dist/js/application/hardwarePanelPort.js';
import {createFridayMeetupPort} from '../dist/js/application/fridayMeetupPort.js';
import {createNightTournamentHudPort} from '../dist/js/application/nightTournamentHudPort.js';
import {createAccountGamePort} from '../dist/js/application/accountGamePort.js';
import {renderHardwarePanel} from '../dist/js/ui/hardwarePanel.js';
import {sourceGraph} from './helpers/sourceGraph.mjs';
function fixture(){let state=createGame(78,'historical');return {get:()=>state,swap:s=>{state=s;}};}
class Element{
 constructor(tag){this.tag=tag;this.children=[];this.dataset={};this.attributes={};this.textContent='';}
 append(...nodes){this.children.push(...nodes);}
 setAttribute(k,v){this.attributes[k]=v;}
 insertAdjacentHTML(_where,html){this.html=html;}
}
const doc={createElement:tag=>new Element(tag)};
function descendants(root){return [root,...root.children.flatMap(descendants)];}
test('hardware view carries quotes, installed components and DOM data without exposing state',()=>{
 const x=fixture(),s=x.get();s.cash=10000;const before=JSON.stringify(s),port=createHardwarePanelPort(x.get);
 const view=port.snapshot(0,'platform');assert.equal(view.stations.length,3);assert.equal(view.powered,true);
 const root=renderHardwarePanel(view,doc),nodes=descendants(root);
 assert.equal(root.id,'hardware-workbench');assert.ok(nodes.some(n=>n.id==='hardware-kit-platform98'));
 assert.ok(nodes.some(n=>n.dataset.pcPower==='0'));assert.ok(nodes.some(n=>n.dataset.config==='gpu'));
 view.specs[0].name='changed';view.stations.length=0;
 assert.equal(JSON.stringify(s),before);
});
test('hardware models follow imported saves, hardware categories and Windows locks',()=>{
 const x=fixture(),port=createHardwarePanelPort(x.get),older=x.get(),before=JSON.stringify(older);
 const next=createGame(79,'historical');next.expansionLevel=2;next.installedPcs=7;next.pcPoweredOff=Array(7).fill(true);next.cash=10000;
 x.swap(next);const view=port.snapshot(6,'ram','windows');assert.equal(view.index,6);assert.equal(view.stations.length,7);assert.equal(view.powered,false);
 const win11=view.windows.find(w=>w.id==='win11');assert.equal(win11.disabled,true);assert.match(win11.label,/2021/);
 assert.equal(port.snapshot(900,'platform').index,6);assert.equal(port.snapshot(NaN,'platform').index,0);
 assert.equal(JSON.stringify(older),before);
});
test('Friday and night HUD queries are immutable and use the active game after replacement',()=>{
 const x=fixture(),friday=createFridayMeetupPort(x.get),night=createNightTournamentHudPort(x.get),before=JSON.stringify(x.get());
 const view=friday.snapshot();assert.equal(view.trophies.total,0);assert.equal(night.snapshot().visible,false);
 assert.equal(JSON.stringify(x.get()),before);
 const next=createGame(80,'historical');next.nightTournamentTrophies=[{fridayDay:5,winnerId:91,participants:2}];x.swap(next);
 assert.equal(friday.snapshot().trophies.total,1);assert.match(friday.snapshot().trophies.items[0].champion,/91/);
 const snapshot=friday.snapshot();snapshot.trophies.items.length=0;assert.equal(next.nightTournamentTrophies.length,1);
});
test('cloud restore is prepared without replacing the game; confirmation applies only the validated candidate',()=>{
 const x=fixture(),old=x.get(),port=createAccountGamePort(x.get,x.swap),next=createGame(81,'historical');next.cash=1234;
 const apply=port.prepareRestore(serializeSave(next));assert.equal(x.get(),old);apply();assert.equal(x.get().cash,1234);assert.notEqual(x.get(),old);
 assert.equal(JSON.parse(port.exportSaveText()).state.rng,81);
 const current=x.get();assert.throws(()=>port.prepareRestore('{broken'));assert.equal(x.get(),current);
});
test('all DOM components depend on application contracts, never simulation state',()=>{
 for(const [file,module] of sourceGraph())if(file.startsWith('ui/')){
  assert.ok(!module.imports.some(edge=>edge.target?.startsWith('sim/')),file);
 }
});
