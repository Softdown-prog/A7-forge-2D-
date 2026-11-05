import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,dirname,resolve} from 'node:path';
import {auditCleanAngularCutover,PUBLIC_ROUTES,PRIVATE_ROUTES,SITE_ROUTES}
 from '../scripts/audit_clean_angular_cutover.mjs';

function fixture(run){
 const root=mkdtempSync(join(tmpdir(),'lhs-angular-cutover-'));
 const site=resolve(root,'out/site-clean-angular');
 const save=(name,body)=>{
  const path=resolve(root,name);
  mkdirSync(dirname(path),{recursive:true});
  writeFileSync(path,body);
 };
 const html=body=>'<html><head><meta name="robots" content="noindex,nofollow">'+
  '</head><body>'+body+'</body></html>';
 for(const path of PUBLIC_ROUTES){
  save('out/site-clean-angular/'+(path==='/'?'':path.slice(1))+'index.html',
   html('<lhs-site data-lhs-public-prerender="true"><main><h1>Angular</h1></main></lhs-site>'));
 }
 for(const path of PRIVATE_ROUTES)
  save('out/site-clean-angular/'+path.slice(1)+'index.html',
   html('<lhs-site></lhs-site>'));
 save('out/site-clean-angular/404.html',html('<lhs-site data-lhs-public-prerender="true"><main><h1>Not found</h1></main></lhs-site>'));
 save('out/site-clean-angular/robots.txt','User-agent: *\nDisallow: /\n');
 save('out/site-clean-angular/checkout-config.json','{"productionCheckoutEnabled":false}');
 save('out/site-clean-angular/angular-prerender-manifest.json',JSON.stringify({
  version:1,method:'isolated-chromium-public-snapshot',
  paths:PUBLIC_ROUTES,excluded:PRIVATE_ROUTES,notFound:true
 }));
 const fileNames=['chunk-123abcde.js','main-123abcde.js','styles-123abcde.css'];
 save('out/site-clean-angular/angular-site-assets.json',JSON.stringify({
  main:fileNames[1],styles:fileNames[2],files:fileNames
 }));
 for(const name of fileNames)save('out/site-clean-angular/assets/site/'+name,'stub');
 const metadata={};for(const path of [...SITE_ROUTES,'/404/'])
  metadata[path]={title:'Página',description:'Descrição'};
 save('games/lan_house_simulator/frontend-angular/src/site-rewrite/page-metadata.json',
  JSON.stringify(metadata));
 save('games/lan_house_simulator/frontend-angular/src/site-rewrite/site-app.html',
  '<p>Versão Angular em revisão</p><p>Esta política não substitui a publicada atualmente</p>');
 save('games/lan_house_simulator/frontend-angular/src/site-rewrite/donate.html',
  '<button disabled aria-disabled="true">Indisponível nesta prévia</button>'+
  "<section>@if(availability()==='sandbox-ready'){}</section>");
 save('games/lan_house_simulator/scripts/build_clean_angular_site.mjs',
  "const assets='src/site-rewrite/public/assets';");
 save('games/lan_house_simulator/website/build.mjs',"const output='out/site';");
 save('.github/workflows/lhs-pages-sync.yml',
  'steps:\n  run: |\n    npm run build:site\n    npm run check:site\n');
 try{return run({root,site,save});}
 finally{rmSync(root,{recursive:true,force:true});}
}
const byId=(report,id)=>report.checks.find(c=>c.id===id);

test('a technically valid Angular preview is NOT falsely called production ready',()=>{
 fixture(({root,site})=>{
  const report=auditCleanAngularCutover({repoRoot:root,siteRoot:site});
  assert.equal(report.schemaVersion,1);
  assert.equal(report.status,'not-ready');
  assert.equal(report.deployedBy,'legacy-out/site');
  assert.ok(report.checks.every(c=>c.passed),JSON.stringify(report.checks));
  assert.deepEqual(report.blockers.map(b=>b.id),
   ['legacy-deployment','seo-noindex','legal-review','production-payments','manual-acceptance']);
 });
});

test('missing public prerender or missing private CSR blocks approval, not a pass',()=>{
 fixture(({root,site,save})=>{
  save('out/site-clean-angular/ajuda/index.html','<lhs-site></lhs-site>');
  save('out/site-clean-angular/conta/index.html','<lhs-site data-lhs-public-prerender="true"><main>Leak</main></lhs-site>');
  const report=auditCleanAngularCutover({repoRoot:root,siteRoot:site});
  assert.equal(byId(report,'public-pages-prerendered').passed,false);
  assert.equal(byId(report,'private-pages-never-snapshotted').passed,false);
  assert.ok(report.blockers.some(b=>b.id==='failed-public-pages-prerendered'));
  assert.ok(report.blockers.some(b=>b.id==='failed-private-pages-never-snapshotted'));
 });
});

test('unhashed, missing or tampered Angular assets are detected',()=>{
 fixture(({root,site,save})=>{
  save('out/site-clean-angular/angular-site-assets.json',JSON.stringify({
   main:'main.js',styles:'styles-123abcde.css',
   files:['main.js','styles-123abcde.css']
  }));
  const report=auditCleanAngularCutover({repoRoot:root,siteRoot:site});
  assert.equal(byId(report,'content-hashed-angular-assets').passed,false);
 });
});

test('a new production Angular rollout is distinguished from legacy site without claiming ready',()=>{
 fixture(({root,site,save})=>{
  save('.github/workflows/lhs-pages-sync.yml',
   'steps:\n  run: |\n    npm run build:site:clean\n    npm run check:site:clean\n');
  const report=auditCleanAngularCutover({repoRoot:root,siteRoot:site});
  assert.equal(report.deployedBy,'angular-out/site-clean-angular');
  assert.equal(report.status,'not-ready');
  assert.ok(!report.blockers.some(b=>b.id==='legacy-deployment'));
  assert.ok(report.blockers.some(b=>b.id==='manual-acceptance'));
 });
});

test('removing mandatory evidence or enabling the production checkout fails closed',()=>{
 fixture(({root,site,save})=>{
  save('games/lan_house_simulator/frontend-angular/src/site-rewrite/donate.html',
   '<button>Pay now</button>');
  save('out/site-clean-angular/privacidade/index.html','<h1>broken</h1>');
  const report=auditCleanAngularCutover({repoRoot:root,siteRoot:site});
  assert.equal(byId(report,'unavailable-checkout-disabled').passed,false);
  assert.equal(byId(report,'preview-remains-noindex').passed,false);
  assert.equal(report.status,'not-ready');
 });
});
test('canonical Angular configuration is identified without claiming a live deployment',()=>{
 fixture(({root,site,save})=>{
  save('games/lan_house_simulator/package.json',JSON.stringify({scripts:{
   'build:site':'node scripts/build_canonical_angular_site.mjs',
   'check:site':'node scripts/check_canonical_angular_site.mjs'
  }}));
  const report=auditCleanAngularCutover({repoRoot:root,siteRoot:site});
  assert.equal(report.configuredBy,'angular-out/site');
  assert.equal(report.deployedBy,'not-observed');
  assert.ok(report.blockers.some(b=>b.id==='production-approval'));
  assert.ok(!report.blockers.some(b=>b.id==='legacy-deployment'));
  assert.equal(report.status,'not-ready');
 });
});
