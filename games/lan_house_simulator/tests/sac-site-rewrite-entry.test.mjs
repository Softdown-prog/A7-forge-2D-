import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {siteRewriteEntrypoint} from '../scripts/sac_site_rewrite_entry.mjs';
const entry='main-OCSQFMPV.js';
async function fixture(html,files,run){
 const folder=mkdtempSync(join(tmpdir(),'lhs-sac-hash-'));
 try{
  for(const name of files)writeFileSync(join(folder,name),'const _=1;');
  writeFileSync(join(folder,'index.html'),html);
  await run(folder);
 }finally{rmSync(folder,{recursive:true,force:true});}
}
const markup=script=>'<html><head><base href="/"></head><body><lhs-site></lhs-site>'+
 script+'</body></html>';
test('SAC chooses exact content-hashed Angular script',async()=>{
 await fixture(markup('<script src="'+entry+'" type="module"></script>'),[entry],
  async folder=>assert.equal(await siteRewriteEntrypoint(folder),entry));
});
test('SAC refuses outdated, missing, duplicated or external script hints',async()=>{
 for(const script of [
  '<script src="main.js" type="module"></script>',
  '<script src="'+entry+'" type="module"></script><script src="'+entry+'"></script>',
  '<script src="../'+entry+'"></script>',
  '<script src="https://example.invalid/'+entry+'"></script>',
  '<script src="main-test.js"></script>',
  '<script src="main-A123456.js"></script>'
 ]){
  await fixture(markup(script),[entry],async folder=>
   assert.rejects(()=>siteRewriteEntrypoint(folder)));
 }
 await fixture(markup('<script src="'+entry+'"></script>'),[],async folder=>
  assert.rejects(()=>siteRewriteEntrypoint(folder)));
});
