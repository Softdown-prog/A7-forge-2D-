import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const readJSON=path=>JSON.parse(readFileSync(new URL(path,import.meta.url),'utf8'));
const angular=readJSON('../frontend-angular/angular.json');
const base=readJSON('../frontend-angular/tsconfig.json');
const projects=['game-ui','site-shell','site-rewrite'];
test('Angular production builds enforce initial bundle budgets and isolated site hashing',()=>{
 for(const project of projects){
  const build=angular.projects[project].architect.build;
  const production=build.configurations.production;
  assert.deepEqual(production.budgets,[{
   type:'initial',maximumWarning:'500kb',maximumError:'1mb'
  }],project+' budget contract');
  assert.equal(production.outputHashing,
   project==='site-rewrite'?'all':'none',
   'Only the canonical institutional site changes its asset names');
  assert.equal(build.defaultConfiguration,'production');
  assert.equal(production.sourceMap,false);
 }
});
test('Strict TypeScript and Angular compiler rules remain shared across site and game UI',()=>{
 const compiler=base.compilerOptions;
 assert.equal(compiler.strict,true);
 for(const rule of [
  'noImplicitOverride','noUncheckedIndexedAccess','exactOptionalPropertyTypes',
  'noUnusedLocals','noUnusedParameters','noImplicitReturns',
  'noFallthroughCasesInSwitch','noPropertyAccessFromIndexSignature'
 ])assert.equal(compiler[rule],true,rule);
 assert.equal(compiler.target,'ES2022');
 assert.equal(compiler.moduleResolution,'bundler');
 for(const rule of ['strictInjectionParameters','strictTemplates','strictInputAccessModifiers'])
  assert.equal(base.angularCompilerOptions[rule],true,rule);
 for(const configPath of [
  'tsconfig.app.json','tsconfig.site.json','tsconfig.site-rewrite.json'
 ]){
  const child=readJSON('../frontend-angular/'+configPath);
  assert.equal(child.extends,'./tsconfig.json');
  assert.equal(child.compilerOptions.strict,undefined,'strict inherited from base');
 }
});
