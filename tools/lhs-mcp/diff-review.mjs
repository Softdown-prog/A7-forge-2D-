/**
 * Read-only review of a committed Git diff against the CURRENT MCP index.
 * No patch contents, credentials, workspace writes, or commands from the user.
 * Static import links are heuristics, not proof that a change is safe.
 */
import path from "node:path";
import {execFileSync} from "node:child_process";
import {resolveLocalImport} from "./dependency-graph.mjs";
import {prepareFeatureGraph} from "./feature-trace.mjs";
import {resolveTestImports} from "./change-plan.mjs";
import {tokenize} from "./context-search.mjs";

const GAME="games/lan_house_simulator";
const SOURCE=GAME+"/src/";
const TESTS=GAME+"/tests/";
const statusAllowed=/^[ACDMRTU]$/;
const excluded=/^(?:\.env(?:\..*)?|\.npmrc|\.pypirc|id_rsa|id_ed25519|credentials(?:\..*)?|.*\.(?:pem|key|p12|pfx))$/i;
const goodPath=p=>typeof p==="string"&&p.startsWith(GAME+"/")&&!p.includes("\\")&&
 !p.includes("\0")&&!p.split("/").some(x=>x===".."||x==="."||x===".git"||x==="node_modules")&&
 !excluded.test(path.posix.basename(p));
const num=(x,fallback,max)=>Number.isFinite(Number(x))?
 Math.max(1,Math.min(max,Math.trunc(Number(x)))):fallback;

/** Only HEAD^ or a complete hex commit can be used as a baseline. */
export function readGitDiff(root,{base="HEAD^"}={}){
 if(base!=="HEAD^"&&!(typeof base==="string"&&/^[0-9a-f]{40}$/.test(base)))
  throw Error("Base must be HEAD^ or a 40-character Git commit SHA");
 const data=execFileSync("git",
  ["diff","--name-status","-z","--find-renames",base,"HEAD","--",GAME+"/"],
  {cwd:root,encoding:"utf8",maxBuffer:2*1024*1024,timeout:20000});
 const tokens=data.split("\0"),changes=[];
 for(let i=0;i<tokens.length&&tokens[i];){
  const raw=tokens[i++],status=raw[0];
  if(!statusAllowed.test(status))throw Error("Unexpected git diff status");
  const previousPath=(status==="R"||status==="C")?tokens[i++]:null;
  const currentPath=tokens[i++];
  if(!goodPath(currentPath)||(previousPath&&!goodPath(previousPath)))continue;
  changes.push({status,path:currentPath,...(previousPath?{previousPath}:{})});
 }
 return {base,head:"HEAD",changes};
}
function nameTerms(filename){
 const stem=path.posix.basename(filename).replace(/\.(test|spec)\.[^.]+$/,"");
 return new Set(tokenize(stem).filter(x=>x.length>2));
}
export function reviewDiff(index,changes,{depth=3,maxChanged=50,maxImpacted=60,testLimit=20}={}){
 if(!index||!Array.isArray(index.files)||!Array.isArray(changes))
  throw Error("Expected an indexed catalog and list of changed files");
 const graph=prepareFeatureGraph(index),depthLimit=num(depth,3,4);
 const changeLimit=num(maxChanged,50,100),impactLimit=num(maxImpacted,60,100);
 const testsLimit=num(testLimit,20,30);
 const filtered=changes.filter(c=>c&&statusAllowed.test(c.status)&&goodPath(c.path)&&
  (!c.previousPath||goodPath(c.previousPath)));
 const kept=filtered.slice(0,changeLimit);
 const changedSources=kept.filter(c=>c.path.startsWith(SOURCE)&&
  ["A","C","M","R","T"].includes(c.status)&&graph.byPath.has(c.path));
 const sourcePaths=new Set(changedSources.map(c=>c.path));
 const oldNames=new Set(kept.flatMap(c=>c.status==="D"?[c.path]:
  (c.status==="R"&&c.previousPath?[c.previousPath]:[])));
 // Old paths are absent from the current graph; report unresolved imports
 // rather than pretending an old dependency graph was reconstructed.
 const broken=[];
 if(oldNames.size){
  for(const file of index.files){
   for(const spec of file.unresolvedLocalImports??[]){
    if(resolveLocalImport(file.path,spec,oldNames))
     broken.push({importer:file.path,specifier:spec});
   }
  }
 }
 const impacted=new Map(),queues=changedSources.map(c=>({path:c.path,depth:0,root:c.path}));
 for(let i=0;i<queues.length;i++){
  const current=queues[i];
  if(current.depth>=depthLimit)continue;
  for(const consumer of graph.dependents.get(current.path)??[]){
   if(consumer===current.root)continue;
   const prior=impacted.get(consumer);
   const nextDepth=current.depth+1;
   if(!prior||nextDepth<prior.depth)
    impacted.set(consumer,{path:consumer,depth:nextDepth,via:current.path});
   if(!prior||nextDepth<prior.depth)queues.push({path:consumer,depth:nextDepth,root:current.root});
  }
 }
 const impact=[...impacted.values()].sort((a,b)=>a.depth-b.depth||a.path.localeCompare(b.path));
 const keyPaths=new Set([...sourcePaths,...impact.map(x=>x.path)]);
 const tests=[];
 for(const entry of index.files){
  if(!entry.path.startsWith(TESTS)||!/\.(?:test|spec)\.(?:mjs|cjs|js|ts|tsx)$/.test(entry.path))continue;
  const direct=resolveTestImports(entry,graph.byPath);
  const directChanged=[...direct].filter(p=>sourcePaths.has(p));
  const viaImpacted=[...direct].filter(p=>keyPaths.has(p)&&!sourcePaths.has(p));
  const stems=new Set(changedSources.flatMap(c=>[...nameTerms(c.path)]));
  const matches=[...nameTerms(entry.path)].filter(t=>stems.has(t));
  // Direct imports are strong evidence. Imports of generic transitive
  // consumers are weaker and require lexical corroboration.
  const evidence=directChanged.length?"imports-changed-module":
   viaImpacted.length&&matches.length?"imports-affected-module-and-name":
   matches.length?"filename-similarity":null;
  if(!evidence)continue;
  const score=directChanged.length*25+viaImpacted.length*5+matches.length*3;
  tests.push({path:entry.path,evidence,score,
   importsChanged:directChanged.slice(0,5),
   importsAffected:viaImpacted.slice(0,5)});
 }
 tests.sort((a,b)=>b.score-a.score||a.path.localeCompare(b.path));
 const involved=kept.filter(c=>c.path.startsWith(SOURCE)||c.previousPath?.startsWith(SOURCE));
 const hasStructuralRemoval=involved.some(c=>c.status==="D"||c.status==="R");
 const changedConfig=kept.some(c=>/(?:^|\/)(?:package(?:-lock)?\.json|tsconfig[^/]*\.json|.*\.ya?ml)$/.test(c.path));
 const risk=broken.length||hasStructuralRemoval?"high":
  impact.length>=20||changedConfig?"elevated":
  involved.length?"review":"documentation-or-tools-only";
 const warning=[
  "Static imports cannot prove that the change is safe or that tests cover its behavior.",
  "Review is advisory and does not execute the game or inspect removed-file history."
 ];
 if(oldNames.size)warning.push("Removed or renamed paths cannot be fully traced using the current index alone.");
 if(filtered.length>kept.length)warning.push("Changed-file list was truncated; review the full Git diff.");
 if(impact.length>impactLimit)warning.push("Affected-file list was truncated.");
 if(broken.length)warning.push("Unresolved imports may reference deleted or renamed source paths.");
 if(!tests.length&&involved.length)warning.push("No directly related tests found; manually select verification.");
 return {
  status:"review-only",head:index.head??null,
  changedCount:filtered.length,changed:kept,
  changedSources:changedSources.map(c=>c.path),
  affected:impact.slice(0,impactLimit),
  affectedCount:impact.length,
  possibleBrokenImports:broken.slice(0,30),possibleBrokenImportCount:broken.length,
  suggestedTests:tests.slice(0,testsLimit),risk,
  validation:involved.length||changedConfig?
   [{workingDirectory:GAME,command:"npm run typecheck"},
    {workingDirectory:GAME,command:"npm test"}]:[],
  warnings:warning,
  notes:"Advisory only. Check diff, source contracts and game behavior before approving.",
  limits:{maxChanged:changeLimit,maxImpacted:impactLimit,testLimit:testsLimit,depth:depthLimit}
 };
}
