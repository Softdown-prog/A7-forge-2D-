import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
const root=resolve(import.meta.dirname,'..');
const site=resolve(root,'out/site');
const manifest=JSON.parse(readFileSync(resolve(site,'site-build.json'),'utf8'));
assert.equal(manifest.framework,'angular');
assert.equal(manifest.source,'frontend-angular/src/site-rewrite');
assert.equal(manifest.publicPrerender,true);
assert.equal(JSON.parse(readFileSync(resolve(site,'checkout-config.json'),'utf8')).productionCheckoutEnabled,false);
for(const name of ['check_clean_angular_site','check_clean_angular_prerender'])
 execFileSync(process.execPath,[resolve(root,'scripts/'+name+'.mjs')],{
  cwd:root,stdio:'inherit',env:{...process.env,LHS_SITE_ROOT:site}
 });
console.log('Canonical Angular ownership, prerender and release gates verified');
