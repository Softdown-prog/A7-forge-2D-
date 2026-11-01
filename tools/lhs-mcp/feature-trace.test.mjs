import test from "node:test";
import assert from "node:assert/strict";
import {traceFeature,prepareFeatureGraph} from "./feature-trace.mjs";

const root="games/lan_house_simulator/src/";
const file=(name,context,dependencies=[],symbols=[])=>({
 path:root+name,ext:".ts",bytes:100,imports:[],dependencies,
 symbols:symbols.map(x=>({name:x,kind:"function",line:1})),
 contextTerms:context,contextHeadings:[]
});
test("a relevant provider exposes direct consumers and bounded transitive impact",()=>{
 const core=root+"sim/ps2.ts",ui=root+"ui/ps2Controls.ts",app=root+"ui/app.ts";
 const index={files:[
  file("sim/ps2.ts",{ps2:8,simulation:4},[],["ps2Unlocked"]),
  file("ui/ps2Controls.ts",{ps2:6,controls:3},[core],["setPs2Controls"]),
  file("ui/app.ts",{ps2:2},[ui],["renderApp"]),
  file("sim/unrelated.ts",{weather:8})
 ]};
 const graph=prepareFeatureGraph(index);
 assert.strictEqual(graph,prepareFeatureGraph(index),"Graph is cached per immutable index");
 const report=traceFeature(index,"PS2",{limit:3,depth:3});
 assert.equal(report.candidates[0].path,core);
 const owner=report.candidates[0];
 assert.equal(owner.graphHint,"potential-provider");
 assert.ok(owner.relatedConsumers.includes(ui));
 assert.equal(owner.dependentsTotal,1);
 assert.ok(owner.directDependents.includes(ui));
 assert.equal(report.topCandidateImpact.path,core);
 assert.deepEqual(report.topCandidateImpact.affected.map(x=>x.path),[ui,app]);
 assert.equal(report.warning.includes("not proof"),true);
 assert.ok(report.candidates.every(c=>!c.path.endsWith("unrelated.ts")));
});
test("scope and output limits are respected, while missing graph edges do not fabricate links",()=>{
 const domain=root+"sim/ps1.ts",consumer=root+"ui/ps1Shop.ts";
 const index={files:[
  file("sim/ps1.ts",{ps1:3},[],["ps1Unlocked"]),
  file("ui/ps1Shop.ts",{ps1:5},[domain],["renderPs1"]),
  file("ui/standalone.ts",{ps1:2},[],["ps1Debug"])
 ]};
 const scoped=traceFeature(index,"PS1",{prefix:root+"ui",limit:1});
 assert.equal(scoped.candidates.length,1);
 assert.ok(scoped.candidates[0].path.startsWith(root+"ui/"));
 assert.ok(scoped.candidates[0].directDependencies.every(x=>x.startsWith(root)));
 const full=traceFeature(index,"PS1",{limit:100,depth:20});
 assert.equal(full.candidates.length,3);
 assert.equal(full.topCandidateImpact.maxDepth,3);
 assert.ok(full.candidates.every(c=>c.dependenciesTotal>=0));
 assert.equal(traceFeature(index,"nonexistent").candidates.length,0);
 assert.equal(traceFeature(index,"nonexistent").topCandidateImpact,null);
});
test("cycles do not cause duplicate impact paths and new indexes invalidate caches",()=>{
 const a=root+"sim/a.ts",b=root+"sim/b.ts";
 const first={files:[file("sim/a.ts",{simulation:3},[b]),file("sim/b.ts",{simulation:3},[a])]};
 const trace=traceFeature(first,"simulação",{limit:2,depth:3});
 assert.equal(trace.candidates.length,2);
 assert.equal(new Set(trace.topCandidateImpact.affected.map(x=>x.path)).size,
  trace.topCandidateImpact.affected.length);
 const changed={files:[file("sim/a.ts",{simulation:3}),file("sim/b.ts",{simulation:3})]};
 assert.notStrictEqual(prepareFeatureGraph(first),prepareFeatureGraph(changed));
 assert.equal(prepareFeatureGraph(changed).dependents.size,0);
});
