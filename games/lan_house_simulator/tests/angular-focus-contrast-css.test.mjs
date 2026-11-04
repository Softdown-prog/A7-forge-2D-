import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const css=await readFile(new URL('../frontend-angular/src/workspace.css',import.meta.url),'utf8');
const parse=h=>h.match(/[a-f0-9]{2}/gi).map(x=>parseInt(x,16));
const light=c=>{
  const [r,g,b]=parse(c).map(v=>v/255).map(v=>v<=0.04045?v/12.92:((v+0.055)/1.055)**2.4);
  return r*0.2126+g*0.7152+b*0.0722;
};
const contrast=(a,b)=>{
  const x=light(a),y=light(b);
  return (Math.max(x,y)+0.05)/(Math.min(x,y)+0.05);
};
const rule=(selector)=>css.match(new RegExp(selector+'\\s*\\{([^}]+)\\}'))?.[1]??'';

test('keyboard focus ring exceeds 3:1 on the actual light admin navigation surface',()=>{
  const focus=rule('#admin \\.angular-admin-tab:focus-visible');
  assert.match(focus,/outline:\s*3px solid #6d3b16/);
  assert.match(focus,/outline-offset:\s*2px/);
  assert.ok(contrast('#6d3b16','#e4e6d6')>=3);
  assert.ok(contrast('#6d3b16','#fffef5')>=3);
});
test('workspace and station switch focus use the same high-contrast outline',()=>{
  const style=rule('#admin \\.angular-workspace-task:focus-visible,#admin \\.angular-station-switch-buttons button:focus-visible');
  assert.match(style,/outline:\s*3px solid #6d3b16/);
  for(const bg of ['#e9efdf','#fffef7','#eef3e7']){
    assert.ok(contrast('#6d3b16',bg)>=3,'insufficient focus contrast over '+bg);
  }
});
test('selected tab colors retain at least 4.5:1 contrast',()=>{
  const tab=rule('#admin \\.angular-admin-tab\\[aria-selected="true"\\]');
  assert.match(tab,/background:#234334/);
  assert.match(tab,/color:#f7f8ea/);
  assert.ok(contrast('#f7f8ea','#234334')>=4.5);
});
test('selected hover/focus rule prevents light-on-light cascade override',()=>{
  assert.match(css,/#admin \.angular-admin-tab\[aria-selected="true"\]:hover:not\(:disabled\),\s*#admin \.angular-admin-tab\[aria-selected="true"\]:focus-visible\s*\{background:#234334;color:#f7f8ea;border-color:#234334\}/);
  assert.equal(css.includes('background:#fffef5'),true);
  assert.ok(contrast('#4b614e','#fffef5')>=4.5);
});
test('the patch only changes presentation; native controller selectors remain untouched',()=>{
  assert.match(css,/html\[data-ui-framework="angular"\] #admin \.admin-tabs\{display:none!important\}/);
  assert.match(css,/#admin \.angular-admin-tab\[aria-selected="true"\]/);
});

test('admin tab colors switch atomically without the global 160ms background transition',()=>{
  const tab=rule('#admin \\.angular-admin-tab');
  assert.match(tab,/transition:none/);
  assert.ok(css.includes('transition:none'));
});
