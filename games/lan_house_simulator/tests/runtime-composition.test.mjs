import test from 'node:test';
import assert from 'node:assert/strict';
import {createRuntimeLoop} from '../dist/js/ui/runtimeLoop.js';
import {createRuntimeUiState,resetPlacementUi} from '../dist/js/ui/runtimeUiState.js';
import {locateGameElements} from '../dist/js/ui/gameElements.js';
import {sourceGraph} from './helpers/sourceGraph.mjs';
import {assertSourceCall} from "./helpers/composition.mjs";
import ts from '@typescript/typescript6';
import {browserSaveStore} from '../dist/js/bootstrap/browserServices.js';
import {createSoundPreferencePort} from '../dist/js/ui/soundPreferencePort.js';
import {loadLocalSave} from '../dist/js/sim/localSave.js';

function fixture({coarse=false}={}){
 const calls=[],listeners={},pending=new Map();let id=0,observe,accountOpen=false;
 const doc={hidden:false,getElementById:name=>name==='player-account'&&accountOpen?{hasAttribute:()=>true}:null,addEventListener:(name,fn)=>{listeners[name]=fn;}};
 const win={matchMedia:query=>({matches:query==='(pointer:coarse)'&&coarse}),addEventListener:(name,fn)=>{listeners[name]=fn;},
  requestAnimationFrame(fn){calls.push('request');pending.set(++id,fn);return id;},cancelAnimationFrame(id){calls.push('cancel');pending.delete(id);}};
 const state=createRuntimeUiState(true);state.isPlaying=true;state.serviceAccessVisible=true;
 const scene=Object.fromEntries(['resetMotion','captureMotion','drawScene','drawAccessOverlay','drawEditorOverlay','drawEffects','drawPlacementOverlay'].map(name=>[name,(...args)=>calls.push([name,...args])]));
 Object.assign(scene,{hasMenuRenderer:()=>true,menuAvailable:()=>true,paintMenu:(_elapsed,painted)=>{calls.push('menu');painted();}});
 const port={snapshot:()=>({beforeCampaignEnd:true,leftoverMinutes:.9}),advance:minutes=>calls.push(['advance',minutes]),dispatch:(playing,hidden)=>calls.push(['events',playing,hidden])};
 const original=globalThis.IntersectionObserver;globalThis.IntersectionObserver=class{constructor(fn){observe=fn;}observe(){}};
 let loop;try{loop=createRuntimeLoop({document:doc,window:win,canvas:{},state,framePort:port,scene,editor:{active:false,selected:null,draft:null},inspection:{inspect:()=>[]},renderUI:live=>calls.push(['hud',live])});}finally{if(original===undefined)delete globalThis.IntersectionObserver;else globalThis.IntersectionObserver=original;}
 const tick=timestamp=>{const entry=pending.entries().next().value;assert.ok(entry);pending.delete(entry[0]);calls.length=0;entry[1](timestamp);return [...calls];};
 return {loop,state,doc,listeners,calls,pending,tick,visible:value=>observe([{isIntersecting:value}]),account:value=>{accountOpen=value;}};
}
test('composed frame captures motion, steps, dispatches, paints layers, refreshes HUD and requests the next frame in order',()=>{
 const x=fixture();x.loop.start();x.tick(1000);const calls=x.tick(2000);
 assert.deepEqual(calls.map(c=>Array.isArray(c)?c[0]:c),['captureMotion','advance','events','drawScene','drawAccessOverlay','drawEditorOverlay','drawEffects','drawPlacementOverlay','hud','request']);
 assert.equal(calls.find(c=>c[0]==='advance')[1],.32,'same .08-second cap times four simulated minutes');
 assert.equal(calls.find(c=>c[0]==='drawScene')[1],.08);x.loop.stop();
});
test('menu, account and placement gates preserve simulation pauses',()=>{
 const x=fixture();x.loop.start();x.tick(1000);
 for(const field of ['placingKind','relocating','wallMode','installingAnnexPc']){
  x.state.placement[field]=field==='placingKind'?'plant':field==='wallMode'?'build':true;
  assert.ok(!x.tick(1500).some(c=>c[0]==='advance'),field);resetPlacementUi(x.state);
 }
 x.account(true);assert.ok(!x.tick(2000).some(c=>c[0]==='advance'));x.account(false);
 x.state.isPlaying=false;const calls=x.tick(3000);assert.ok(calls.includes('menu'));assert.ok(!calls.some(c=>c[0]==='advance'));x.loop.stop();
});
test('mobile repaint visibility never changes simulated minutes',()=>{
 const x=fixture({coarse:true});x.loop.start();x.tick(1000);x.visible(false);x.doc.hidden=true;
 let calls=x.tick(1080);assert.equal(calls.find(c=>c[0]==='advance')[1],.32);assert.ok(!calls.some(c=>c[0]==='drawScene'));assert.deepEqual(calls.find(c=>c[0]==='events'),['events',true,true]);
 x.visible(true);x.doc.hidden=false;x.state.windows.adminOpen=true;calls=x.tick(1160);
 assert.equal(calls.find(c=>c[0]==='advance')[1],.32);assert.ok(!calls.some(c=>c[0]==='drawScene'));x.loop.stop();
});
test('held touch postpones HUD updates, and starting twice never creates concurrent loops',()=>{
 const x=fixture();x.loop.start();x.loop.start();assert.equal(x.pending.size,1);x.tick(1000);x.listeners.pointerdown();
 assert.ok(!x.tick(2000).some(c=>c[0]==='hud'));x.listeners.blur();assert.ok(x.tick(3000).some(c=>c[0]==='hud'));
 x.loop.stop();assert.equal(x.pending.size,0);assert.equal(x.calls.at(-1),'cancel');
});
test('UI state belongs to each browser session and reset clears previews without changing purchase rotation',()=>{
 const a=createRuntimeUiState(),b=createRuntimeUiState();a.placement.purchaseRotation=3;a.placement.relocating=true;a.placement.pendingWall={x:1,y:2,axis:'x'};
 resetPlacementUi(a);assert.equal(a.placement.purchaseRotation,3);assert.equal(a.placement.relocating,false);assert.equal(a.placement.pendingWall,null);assert.equal(b.placement.purchaseRotation,0);
});
test('bootstrap rejects missing required elements before constructing gameplay services',()=>{
 assert.throws(()=>locateGameElements({querySelector:()=>null}),/DOM do jogo incompleto: #game/);
 const doc={querySelector:selector=>selector==='#admin'?null:{},getElementById:()=>null};assert.throws(()=>locateGameElements(doc),/#admin/);
});
test('restricted browser storage does not prevent session or preference recovery',()=>{
 let accesses=0;const store=browserSaveStore(()=>{accesses++;throw Error('SecurityError');});
 assert.equal(accesses,0);assert.equal(loadLocalSave(store).source,'none');
 const preference=createSoundPreferencePort({get:store.getItem,set:store.setItem});assert.equal(preference.read(),true);
 let enabled;assert.doesNotThrow(()=>preference.update(false,{setEnabled:value=>{enabled=value;}}));assert.equal(enabled,false);
});
test('entry point only imports and invokes composition; application has no browser or presentation imports',()=>{
 const graph=sourceGraph(),main=graph.get('main.ts');
 assert.equal(main.imports[0].target,'bootstrap/bootstrapGame.ts');assertSourceCall('main.ts','bootstrapGame',[]);
 assert.ok(main.ast.statements.every(node=>ts.isImportDeclaration(node)||ts.isExpressionStatement(node)&&ts.isCallExpression(node.expression)&&node.expression.expression.getText(main.ast)==='bootstrapGame'));
 for(const [file,module] of graph)if(file.startsWith('application/'))for(const edge of module.imports)assert.ok(!/^(ui|render|audio|bootstrap)\//.test(edge.target??''),file+' -> '+edge.target);
 const composition=graph.get('application/gamePorts.ts');let factories=0;
 function visit(node){if(ts.isCallExpression(node)&&/^create\w+Port$/.test(node.expression.getText(composition.ast))){assert.equal(node.arguments[0].getText(composition.ast),'getState');factories++;}ts.forEachChild(node,visit);}visit(composition.ast);
 assert.ok(factories>=40,'every retained panel uses the same live campaign getter');
});
