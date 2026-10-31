import test from "node:test";
import assert from "node:assert/strict";
import {planChange} from "./change-plan.mjs";

const game="games/lan_house_simulator",root=game+"/src/";
const source=(name,context,dependencies=[],missing=[])=>({
 path:root+name,ext:".ts",imports:[],dependencies,
 unresolvedLocalImports:missing,symbols:[],contextTerms:context,contextHeadings:[]
});
const suite=(name,imports=[])=>({
 path:game+"/tests/"+name+".test.mjs",ext:".mjs",imports,
 dependencies:[],symbols:[],contextTerms:{},contextHeadings:[]
});
test("plan identifies owner, dependent and test importing compiled source",()=>{
 const owner=root+"sim/ps2.ts",view=root+"ui/ps2Controls.ts";
 const index={head:"012345",files:[
  source("sim/ps2.ts",{ps2:10,simulation:3}),
  source("ui/ps2Controls.ts",{ps2:3,controls:2},[owner]),
  source("sim/unrelated.ts",{weather:12}),
  suite("ps2-usage",["../dist/js/sim/ps2.js"]),
  suite("ps2-controls",["../dist/js/ui/ps2Controls.js"]),
  suite("weather",["../dist/js/sim/unrelated.js"])
 ]};
 const plan=planChange(index,"simulação PS2",{owners:2});
 assert.equal(plan.status,"review-only");
 assert.equal(plan.owners[0].path,owner);
 assert.ok(plan.reviewFiles.some(x=>x.path===view&&
  x.roles.includes("direct-dependent")&&x.roles.includes("candidate-owner")));
 assert.ok(plan.suggestedTests.some(t=>t.path.endsWith("ps2-usage.test.mjs")&&
  t.evidence==="imports-candidate"));
 assert.ok(!plan.suggestedTests.some(t=>t.path.endsWith("weather.test.mjs")));
 assert.deepEqual(plan.potentialImpact.affected.map(x=>x.path),[view]);
 assert.equal(plan.validation[0].workingDirectory,game);
 assert.equal(plan.validation[1].command,"npm test");
 assert.equal(plan.head,"012345");
 assert.ok(plan.warnings.every(x=>typeof x==="string"));
});
test("test name fallback is marked as weak evidence, not assumed coverage",()=>{
 const index={files:[source("sim/retailQueue.ts",{queue:2,customer:2}),
  suite("queue-customer"),suite("unrelated")]};
 const plan=planChange(index,"fila de clientes",{owners:1});
 assert.equal(plan.suggestedTests.length,1);
 assert.equal(plan.suggestedTests[0].evidence,"filename-keywords");
 assert.equal(plan.suggestedTests[0].path,game+"/tests/queue-customer.test.mjs");
});
test("unknown requests, invalid scope and absence of tests are explicit",()=>{
 const index={files:[source("sim/ps2.ts",{ps2:3},[],["./missing.js"])]};
 assert.throws(()=>planChange(index," "),/concrete change/);
 assert.throws(()=>planChange(index,"PS2",{prefix:game+"/tests"}),/src directory/);
 assert.throws(()=>planChange(index,"PS2",{prefix:root+"../tests"}),/src directory/);
 const missing=planChange(index,"PS2");
 assert.equal(missing.suggestedTests.length,0);
 assert.ok(missing.warnings.some(x=>x.includes("No related tests")));
 assert.ok(missing.warnings.some(x=>x.includes("unresolved local imports")));
 assert.equal(planChange(index,"unrelated").owners.length,0);
 assert.equal(planChange(index,"unrelated").potentialImpact,null);
});
test("output is bounded, deterministic and does not mutate the index",()=>{
 const owner=root+"sim/core.ts";
 const index={files:[
  source("sim/core.ts",{simulation:5}),
  ...Array.from({length:60},(_,i)=>source("ui/consumer"+i+".ts",{simulation:1},[owner])),
  ...Array.from({length:45},(_,i)=>suite("core"+i,["../dist/js/sim/core.js"]))
 ]};
 const before=JSON.stringify(index);
 const a=planChange(index,"simulação",{owners:1,reviewLimit:15,testLimit:5,depth:2});
 assert.ok(a.reviewFiles.length<=15);
 assert.ok(a.suggestedTests.length<=5);
 assert.ok(a.potentialImpact.affected.length<=30);
 assert.equal(a.potentialImpact.truncated,true);
 assert.deepEqual(planChange(index,"simulação",{owners:1,reviewLimit:15,testLimit:5,depth:2}),a);
 assert.equal(JSON.stringify(index),before);
});
