import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
const src=(path)=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
test('Angular admin snapshots are read-only, scoped and event-deduplicated',()=>{
 const bridge=src('src/ui/adminReactiveSummary.ts');
 const game=src('src/ui/gamePanels.ts');
 assert.match(bridge,/new WeakMap/);
 assert.match(bridge,/states\.get\(area\)===key/);
 assert.match(bridge,/doc\.getElementById\("angular-"\+area\+"-workspace"\)/);
 assert.match(bridge,/lhs:admin-"/);
 for(const area of ['finance','stock','computers']){
  assert.ok(game.includes('publishAngularAdminSummary(document,"'+area+'"'));
 }
 assert.doesNotMatch(bridge,/localStorage|fetch\(|GameState|from ["'].*\/sim\//);
});
test('Finance, stock and computer islands subscribe once and clean up',()=>{
 const workspaces=src('frontend-angular/src/workspaces.ts');
 for(const area of ['finance','stock','computers']){
  const evt="'lhs:admin-"+area+"-updated'";
  assert.ok(workspaces.includes("addEventListener("+evt));
  assert.ok(workspaces.includes("removeEventListener("+evt));
 }
 assert.doesNotMatch(workspaces,/observer\.observe\(root,\{subtree:true,childList:true/);
 for(const area of ['finance','stock','computer']){
  const html=src('frontend-angular/src/templates/'+area+'-workspace.html');
  assert.match(html,/angular-workspace-live/);
 }
 assert.match(workspaces,/this\.syncLock\(\)/);
});
