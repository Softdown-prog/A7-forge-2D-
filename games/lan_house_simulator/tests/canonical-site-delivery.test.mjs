import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,existsSync,rmSync,symlinkSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {startSiteServer} from '../scripts/site_server.mjs';
import {prepareBackendSource} from '../scripts/prepare_backend_source.mjs';
import {fingerprintSource,fingerprintArtifact,verifyApprovedArtifact} from '../scripts/approved_site_artifact.mjs';
const root=resolve(import.meta.dirname,'..');
test('default build owns Angular; legacy cannot overwrite the canonical artifact',()=>{
 const pkg=JSON.parse(readFileSync(resolve(root,'package.json'),'utf8'));
 assert.equal(pkg.scripts['build:site'],'node scripts/build_canonical_angular_site.mjs');
 assert.equal(pkg.scripts['check:site'],'node scripts/check_canonical_angular_site.mjs');
 assert.match(readFileSync(resolve(root,'website/build.mjs'),'utf8'),/out\/site-legacy/);
 assert.match(readFileSync(resolve(root,'Dockerfile'),'utf8'),/FROM node-runtime AS frontend/);
 assert.match(readFileSync(resolve(root,'backend/Dockerfile'),'utf8'),/CMD \["node", "server.mjs"\]/);
 const workflow=readFileSync(resolve(root,'../../.github/workflows/lhs-pages-sync.yml'),'utf8');
 assert.match(workflow,/workflow_dispatch:/);
 assert.doesNotMatch(workflow,/^\s+push:/m);
 assert.match(workflow,/inputs\.approve_production == true/);
 assert.match(workflow,/environment: lhs-production/);
 assert.match(workflow,/git merge-base --is-ancestor/);
});
test('Cloud Run staging selects the API Dockerfile and excludes frontend/secrets',()=>{
 const base=mkdtempSync(join(tmpdir(),'lhs-api-source-'));
 try{
  const out=prepareBackendSource(join(base,'source'));
  assert.equal(readFileSync(join(out,'Dockerfile'),'utf8'),readFileSync(resolve(root,'backend/Dockerfile'),'utf8'));
  for(const forbidden of ['frontend-angular','website','assets','.env','backend/infra','backend/node_modules'])
   assert.equal(existsSync(join(out,forbidden)),false,forbidden);
  assert.ok(existsSync(join(out,'src/sim/saveTransfer.ts')));
  assert.ok(existsSync(join(out,'backend/server.mjs')));
  assert.throws(()=>prepareBackendSource(out),/EEXIST/,'Never replace an existing context');
 }finally{rmSync(base,{recursive:true,force:true});}
});
test('frontend runtime serves direct routes, true 404, headers, HEAD and rejects unsafe paths/methods',async()=>{
 const base=mkdtempSync(join(tmpdir(),'lhs-site-http-'));
 let server;
 try{
  mkdirSync(join(base,'site'));const site=join(base,'site');
  writeFileSync(join(site,'_headers'),"/*\n  Content-Security-Policy: default-src 'self'\n/assets/main-123.js\n  Cache-Control: public, max-age=31536000, immutable\n/account-config.json\n  Cache-Control: no-store\n");
  writeFileSync(join(site,'index.html'),'<h1>Angular home</h1>');
  writeFileSync(join(site,'404.html'),'<h1>Not found</h1>');
  mkdirSync(join(site,'ajuda'));writeFileSync(join(site,'ajuda/index.html'),'<h1>Help</h1>');
  mkdirSync(join(site,'assets'));writeFileSync(join(site,'assets/main-123.js'),'export const angular=true;');
  writeFileSync(join(site,'account-config.json'),'{}');
  writeFileSync(join(base,'private.txt'),'must not be served');symlinkSync(join(base,'private.txt'),join(site,'escape.txt'));
  server=await startSiteServer({root:site});
  const get=(path,init)=>fetch(server.origin+path,init);
  const home=await get('/');assert.equal(home.status,200);assert.match(await home.text(),/Angular home/);
  assert.match(home.headers.get('content-security-policy'),/default-src 'self'/);
  assert.equal((await get('/ajuda',{redirect:'manual'})).status,308);
  assert.equal(await (await get('/ajuda/')).text(),'<h1>Help</h1>');
  for(const path of ['/missing/','/escape.txt','/_headers','/backend/server.mjs']){
   const response=await get(path);assert.equal(response.status,404,path);assert.match(await response.text(),/Not found/);
  }
  assert.equal((await get('/ajuda/',{method:'HEAD'})).status,200);
  assert.equal(await (await get('/ajuda/',{method:'HEAD'})).text(),'');
  assert.equal((await get('/',{method:'POST'})).status,405);
  assert.match((await get('/assets/main-123.js')).headers.get('cache-control'),/immutable/);
  assert.equal((await get('/account-config.json')).headers.get('cache-control'),'no-store');
  assert.deepEqual(await (await get('/health')).json(),{status:'ok',frontend:'angular'});
 }finally{await server?.close();rmSync(base,{recursive:true,force:true});}
});
test('reviewed Pages artifact refuses changed source or changed compiled bytes',()=>{
 const base=mkdtempSync(join(tmpdir(),'lhs-approved-site-'));
 try{
  mkdirSync(join(base,'src'));writeFileSync(join(base,'src/main.ts'),'source v1');
  const site=join(base,'site');mkdirSync(site);writeFileSync(join(site,'index.html'),'compiled v1');
  const proof={schemaVersion:1,approvedSourceSha:'a'.repeat(40),sourceHash:fingerprintSource(base),artifactHash:fingerprintArtifact(site)};
  writeFileSync(join(base,'.lhs-approved-site.json'),JSON.stringify(proof));
  assert.equal(verifyApprovedArtifact(base,site).approvedSourceSha,proof.approvedSourceSha);
  writeFileSync(join(base,'src/main.ts'),'changed source');
  assert.throws(()=>verifyApprovedArtifact(base,site),/inputs changed/);
  writeFileSync(join(base,'src/main.ts'),'source v1');writeFileSync(join(site,'index.html'),'changed artifact');
  assert.throws(()=>verifyApprovedArtifact(base,site),/artifact was changed/);
 }finally{rmSync(base,{recursive:true,force:true});}
});
