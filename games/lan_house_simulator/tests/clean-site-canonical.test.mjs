import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'..');
const read=(file)=>readFileSync(resolve(root,file),'utf8');
test('one canonical institutional front-end: Angular clean only',()=>{
 const script=read('scripts/build_clean_angular_site.mjs');
 const app=read('frontend-angular/src/site-rewrite/site-app.ts');
 const template=read('frontend-angular/src/site-rewrite/site-app.html');
 const styles=read('frontend-angular/src/site-rewrite/site.css');
 const catalog=read('frontend-angular/src/site-rewrite/site-data.ts');
 const legal=read('frontend-angular/src/site-rewrite/legal-content.ts');
 const project=JSON.parse(read('frontend-angular/angular.json'));
 assert.equal(project.projects['site-rewrite'].architect.build.options.browser,'src/site-rewrite/main.ts');
 assert.match(script,/src\/site-rewrite\/public\/assets/);
 assert.doesNotMatch(script,/['"]website\/assets\//);
 assert.doesNotMatch(script,/['"]assets\/ui\//);
 assert.doesNotMatch(script,/website\/build\.mjs/);
 for(const name of ['brand.svg','icons.svg','sala.webp','pc-crt.svg',
  'pc-lcd.svg','pc-led.svg','pc-arena.svg']){
  assert.ok(existsSync(resolve(root,'frontend-angular/src/site-rewrite/public/assets',name)),
   'Angular missing canonical asset '+name);
 }
 for(const source of [app,template,styles,catalog,legal])
  assert.doesNotMatch(source,/website\/|from ['"][^'"]*react|alpine\.js|bootstrap\.min\.js|innerHTML\s*=/i);
 assert.ok(read('docs/ANGULAR_REWRITE_ISOLATED.md').includes('**Raiz canônica do front-end:**'));
});
