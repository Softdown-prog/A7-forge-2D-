import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {execFileSync} from "node:child_process";
import {readGitDiff,reviewDiff} from "./diff-review.mjs";
import {buildIndex} from "./catalog.mjs";
const base="games/lan_house_simulator";
const source=(p,dependencies=[],imports=[])=>({
 path:base+"/src/"+p,dependencies,imports,contextTerms:{},symbols:[],ext:".ts"
});
const suite=(p,imports=[])=>({
 path:base+"/tests/"+p+".test.mjs",imports,dependencies:[],ext:".mjs"
});
test("changed provider triggers dependents and tests with direct imported evidence",()=>{
 const ps2=base+"/src/sim/ps2.ts",ui=base+"/src/ui/ps2Controls.ts";
 const index={head:"deadbeef",files:[
  source("sim/ps2.ts"),source("ui/ps2Controls.ts",[ps2]),
  source("ui/ps2Panel.ts",[ui]),
  suite("ps2-gameplay",["../dist/js/sim/ps2.js"]),
  suite("ps2-controls",["../dist/js/ui/ps2Controls.js"]),
  suite("linux-1999",["../dist/js/ui/ps2Controls.js"])
 ]};
 const a=reviewDiff(index,[{status:"M",path:ps2}]);
 assert.equal(a.risk,"review");
 assert.equal(a.changedCount,1);
 assert.deepEqual(a.affected.map(x=>x.path),[ui,base+"/src/ui/ps2Panel.ts"]);
 assert.equal(a.suggestedTests[0].evidence,"imports-changed-module");
 assert.equal(a.suggestedTests[0].path,base+"/tests/ps2-gameplay.test.mjs");
 assert.equal(a.suggestedTests.some(t=>t.path.endsWith("linux-1999.test.mjs")),false);
 assert.equal(a.validation[0].command,"npm run typecheck");
 assert.equal(a.status,"review-only");
 assert.deepEqual(a,reviewDiff(index,[{status:"M",path:ps2}]));
});
test("renames and removals signal potential unresolved imports",()=>{
 const old=base+"/src/sim/legacy.ts";
 const index={files:[
  source("sim/new.ts"),
  {...source("sim/engine.ts"),unresolvedLocalImports:["./legacy.js"]}
 ]};
 const out=reviewDiff(index,[{status:"R",path:base+"/src/sim/new.ts",previousPath:old}]);
 assert.equal(out.risk,"high");
 assert.equal(out.possibleBrokenImportCount,1);
 assert.equal(out.possibleBrokenImports[0].importer,base+"/src/sim/engine.ts");
 assert.ok(out.warnings.some(w=>w.includes("Removed or renamed")));
});
test("outside-game or sensitive files cannot appear in review, limits are bounded",()=>{
 const index={files:[source("sim/engine.ts")]};
 const changed=[
  {status:"M",path:"unrelated/source.ts"},
  {status:"M",path:base+"/.env"},
  {status:"M",path:base+"/src/sim/engine.ts"},
  ...Array.from({length:150},(_,i)=>({status:"A",path:base+"/docs/f"+i+".md"}))
 ];
 const r=reviewDiff(index,changed,{maxChanged:3,maxImpacted:1,testLimit:1,depth:2});
 assert.equal(r.changedCount,151);
 assert.equal(r.changed.length,3);
 assert.ok(r.warnings.some(x=>x.includes("truncated")));
 assert.ok(r.changed.every(c=>!c.path.endsWith(".env")));
 assert.equal(reviewDiff(index,[{status:"M",path:"tools/lhs-mcp/server.mjs"}]).risk,
  "documentation-or-tools-only");
});
test("readGitDiff measures actual Git HEAD^ changes and rejects injected revisions",t=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),"lhs-diff-"));
 t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 const git=(...args)=>execFileSync("git",args,{cwd:root,encoding:"utf8"});
 git("init","-q");git("config","user.email","ci@example.invalid");git("config","user.name","CI");
 const ps2=base+"/src/sim/ps2.ts",testfile=base+"/tests/ps2-game.test.mjs";
 for(const name of [ps2,testfile]){
  fs.mkdirSync(path.dirname(path.join(root,name)),{recursive:true});
  fs.writeFileSync(path.join(root,name),name===ps2?
   "export function createPs2() {return 1;}\n":
   'import {createPs2} from "../dist/js/sim/ps2.js";\n');
 }
 git("add",".");git("commit","-qm","initial");
 fs.writeFileSync(path.join(root,ps2),"export function createPs2() {return 2;}\n");
 git("add",".");git("commit","-qm","edit");
 const diff=readGitDiff(root);
 assert.deepEqual(diff.changes,[{status:"M",path:ps2}]);
 const idx=buildIndex(root,{scope:base});
 const result=reviewDiff(idx,diff.changes);
 assert.equal(result.changedSources[0],ps2);
 assert.equal(result.suggestedTests[0].path,testfile);
 assert.throws(()=>readGitDiff(root,{base:"--config=x"}),/Base must/);
 assert.throws(()=>readGitDiff(root,{base:"HEAD^; rm -rf /"}),/Base must/);
});
