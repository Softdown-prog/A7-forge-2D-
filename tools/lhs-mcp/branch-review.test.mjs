import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {execFileSync} from "node:child_process";
import {readBranchComparison,reviewBranch,validateBaseBranch} from "./branch-review.mjs";
import {buildIndex} from "./catalog.mjs";

const game="games/lan_house_simulator";
const rootSource=game+"/src/sim/ps2.ts";
function git(root,...args){
 return execFileSync("git",args,{cwd:root,encoding:"utf8"}).trim();
}
function makeFixture(t,{divergent=false}={}){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),"lhs-branch-review-"));
 t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 git(root,"init","-q","-b","main");
 git(root,"config","user.email","ci@example.invalid");
 git(root,"config","user.name","CI");
 const write=(name,body)=>{
  fs.mkdirSync(path.dirname(path.join(root,name)),{recursive:true});
  fs.writeFileSync(path.join(root,name),body);
 };
 write(rootSource,"export const ps2=0;\n");
 git(root,"add",".");git(root,"commit","-qm","base");
 const base=git(root,"rev-parse","HEAD");
 git(root,"update-ref","refs/remotes/origin/main",base);
 git(root,"switch","-qc","feat/preview");
 write(rootSource,"export const ps2=1;\n");
 write(game+"/frontend-angular/src/main.ts","export const ui=1;\n");
 write(game+"/tests/ps2.test.mjs","import {ps2} from '../dist/js/sim/ps2.js';\n");
 git(root,"add",".");git(root,"commit","-qm","feature");
 if(divergent){
  git(root,"switch","main");
  write(game+"/website/a.html","<h1>Existing site</h1>\n");
  git(root,"add",".");git(root,"commit","-qm","new main");
  git(root,"update-ref","refs/remotes/origin/main",git(root,"rev-parse","HEAD"));
  git(root,"switch","feat/preview");
 }
 return {root,base};
}
test("comparison uses merge base, not current main tip, and includes changed game paths",t=>{
 const {root,base}=makeFixture(t,{divergent:true});
 const comparison=readBranchComparison(root);
 assert.equal(comparison.baseBranch,"main");
 assert.equal(comparison.mergeBaseSha,base);
 assert.equal(comparison.behind,1);
 assert.equal(comparison.ahead,1);
 assert.deepEqual(comparison.changes.map(c=>c.path).sort(),[
  game+"/frontend-angular/src/main.ts",rootSource,game+"/tests/ps2.test.mjs"
 ].sort());
 const index=buildIndex(root,{scope:"."});
 const report=reviewBranch(index,comparison);
 assert.equal(report.comparison.diverged,true);
 assert.equal(report.areas.frontendAngular,1);
 assert.equal(report.areas.gameCore,1);
 assert.equal(report.areas.gameTests,1);
 assert.equal(report.mergeDecision,"not-authorized");
 assert.equal(report.risk,"manual-review-required");
 assert.ok(report.validation.some(x=>x.command==="npm run build --prefix frontend-angular"));
 assert.ok(report.validation.some(x=>x.command==="npm test"));
 assert.ok(report.warnings.some(x=>x.includes("behind")));
 assert.equal(report.affectedGame.changedCount,3);
 assert.equal(report.affectedGame.suggestedTests[0].evidence,"imports-changed-module");
});
test("non-divergent branch and unchanged maintenance reports remain advisory",t=>{
 const {root}=makeFixture(t);
 let report=reviewBranch(buildIndex(root,{scope:"."}),readBranchComparison(root));
 assert.equal(report.comparison.behindBy,0);
 assert.equal(report.comparison.aheadBy,1);
 assert.equal(report.filesChanged,3);
 assert.equal(report.affectedGame.status,"review-only");
 assert.ok(report.validation.length>0);
});
test("reject dangerous ref strings and absent bases without Git mutation",t=>{
 const {root}=makeFixture(t);
 for(const branch of ["--help","main..HEAD","main^{tree}","../main","main//other",
  "main@{1}","main.lock","", "main/../bad"]){
  assert.throws(()=>validateBaseBranch(branch));
 }
 assert.throws(()=>readBranchComparison(root,{baseBranch:"nonexistent"}),/not available/);
 const before=git(root,"status","--porcelain");
 assert.throws(()=>reviewBranch({head:"bad",files:[]},readBranchComparison(root)),/Catalog HEAD/);
 assert.equal(git(root,"status","--porcelain"),before);
});
test("ignore excluded sensitive path names in indexed game findings",t=>{
 const {root}=makeFixture(t);
 const idx=buildIndex(root,{scope:"."}),comparison=readBranchComparison(root);
 comparison.changes.push({status:"M",path:game+"/.env"});
 comparison.changes.push({status:"M",path:".github/workflows/test.yml"});
 const result=reviewBranch(idx,comparison);
 assert.equal(result.filesChanged,5);
 assert.equal(result.affectedGame.changedCount,3);
 assert.equal(result.areas.repositoryOther,1);
 assert.equal(JSON.stringify(result).includes(game+"/.env"),false);
});
