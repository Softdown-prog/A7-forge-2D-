/**
 * Context + static-import relationships, without executing game modules.
 * The graph proves a tracked import edge, not semantic ownership.
 * A bounded structural adjustment is separate from ordinary search_context,
 * so existing search ranking stays stable and testable independently.
 */
import {searchContext} from "./context-search.mjs";
import {impactAnalysis} from "./dependency-graph.mjs";

const graphs=new WeakMap();
function clamp(value,fallback,maximum){
 const n=Number(value);
 return Number.isFinite(n)?Math.max(1,Math.min(maximum,Math.trunc(n))):fallback;
}
export function prepareFeatureGraph(index){
 if(!index||typeof index!=="object"||!Array.isArray(index.files))
  throw Error("Expected indexed files");
 const previous=graphs.get(index);
 if(previous?.files===index.files&&previous.length===index.files.length)return previous;
 const byPath=new Map(index.files.map(f=>[f.path,f]));
 const dependents=new Map();
 for(const entry of index.files){
  for(const target of entry.dependencies??[]){
   if(!byPath.has(target))continue;
   const refs=dependents.get(target)??[];
   refs.push(entry.path);dependents.set(target,refs);
  }
 }
 for(const refs of dependents.values())refs.sort();
 const result={files:index.files,length:index.files.length,byPath,dependents};
 graphs.set(index,result);
 return result;
}
export function traceFeature(index,query,{prefix="",limit=5,depth=2}={}){
 const max=clamp(limit,5,15),maxDepth=clamp(depth,2,3);
 const graph=prepareFeatureGraph(index);
 // Gather enough relevant candidates for a useful import-edge comparison.
 // Keep this independent of repository size and do not scan source on query.
 const contextual=searchContext(index,query,{prefix,limit:50});
 const candidates=new Set(contextual.map(x=>x.path));
 const results=contextual.map(entry=>{
  const f=graph.byPath.get(entry.path);
  const directDependencies=(f?.dependencies??[]).filter(p=>graph.byPath.has(p));
  const directDependents=graph.dependents.get(entry.path)??[];
  const relatedProviders=directDependencies.filter(p=>candidates.has(p));
  const relatedConsumers=directDependents.filter(p=>candidates.has(p));
  // Providers of other relevant candidates receive a modest hint;
  // importers of another relevant module may just be UI aggregators.
  // Caps prevent generic shared types from dominating lexical relevance.
  const structuralAdjustment=
   Math.min(12,relatedConsumers.length*4)-
   Math.min(10,relatedProviders.length*3)+
   Math.min(2,Math.log2(1+directDependents.length)*0.5);
  const score=Math.round((entry.score+structuralAdjustment)*100)/100;
  return {
   ...entry,
   score,lexicalScore:entry.score,
   graphHint:relatedConsumers.length&&relatedProviders.length?"intermediary":
    relatedConsumers.length?"potential-provider":
    relatedProviders.length?"potential-consumer":"insufficient-graph-evidence",
   relatedProviders:relatedProviders.slice(0,10),
   relatedConsumers:relatedConsumers.slice(0,10),
   dependenciesTotal:directDependencies.length,
   directDependencies:directDependencies.slice(0,15),
   dependentsTotal:directDependents.length,
   directDependents:directDependents.slice(0,15)
  };
 });
 results.sort((a,b)=>b.score-a.score||b.matchedTerms-a.matchedTerms||
  a.path.localeCompare(b.path));
 const ranked=results.slice(0,max);
 const leader=ranked[0];
 const impact=leader?impactAnalysis(index,leader.path,{depth:maxDepth,limit:30}):null;
 return {query,prefix,graph:"static-relative-imports-only",
  warning:"Import relationships are evidence, not proof of semantic ownership or safe changes.",
  candidates:ranked,
  topCandidateImpact:impact};
}
