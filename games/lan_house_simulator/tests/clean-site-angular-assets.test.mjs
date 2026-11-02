import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {resolveAngularSiteAssets,rewriteAngularSiteIndex} from '../scripts/clean_angular_site_assets.mjs';

const main='main-AB12CD34.js',styles='styles-EF56GH78.css',chunk='chunk-ZX12CD34.js';
function fixture(content,files=[main,styles,chunk]){
 const folder=mkdtempSync(join(tmpdir(),'lhs-angular-hash-'));
 for(const name of files){writeFileSync(join(folder,name),'test code');}
 try{return content(folder);}
 finally{rmSync(folder,{recursive:true,force:true});}
}
const html='<html><head><base href="/"><link rel="stylesheet" href="'+styles+'"></head>'+
 '<body><lhs-site></lhs-site><script src="'+main+'" type="module"></script></body></html>';
test('rewrites Angular emitted hashes, preserves root-relative paths and validates chunks',()=>{
 fixture(folder=>{
  const assets=resolveAngularSiteAssets(html,folder);
  assert.deepEqual(assets.files,[chunk,main,styles].sort());
  const rewritten=rewriteAngularSiteIndex(html,assets);
  assert.ok(rewritten.includes('src="/assets/site/'+main+'"'));
  assert.ok(rewritten.includes('href="/assets/site/'+styles+'"'));
  assert.ok(!rewritten.includes('src="'+main+'"'));
  assert.ok(!rewritten.includes('href="'+styles+'"'));
  assert.ok(rewritten.includes('<base href="/">'));
 });
});
test('fails closed when the compiled index has unhashed or missing entrypoints',()=>{
 fixture(folder=>{
  for(const bad of [
   html.replaceAll(main,'main.js'),
   html.replaceAll(styles,'styles.css'),
   html.replaceAll(main,'main-ABCDE123.js'),
   html.replaceAll(main,'https://other.example/main-AB12CD34.js'),
   html.replaceAll('src="'+main+'"','src="../'+main+'"'),
   html.replace('<script','<script src="'+main+'"></script><script'),
  ])assert.throws(()=>resolveAngularSiteAssets(bad,folder));
 });
});
test('fails closed for unhashed JS/CSS copied beside fingerprinted bundles',()=>{
 fixture(folder=>{
  writeFileSync(join(folder,'legacy.js'),'legacy');
  assert.throws(()=>resolveAngularSiteAssets(html,folder));
 });
});
test('fails closed when Angular lacks an expected generated bundle',()=>{
 fixture(folder=>assert.throws(()=>resolveAngularSiteAssets(html,folder)),[styles,chunk]);
});
