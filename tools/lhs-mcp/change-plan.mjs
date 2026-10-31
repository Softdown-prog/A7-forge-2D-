/**
 * Read-only change planning for the Lan House Simulator.
 * Evidence: indexed files, local static imports, test file names/imports.
 * No source is executed, edited or staged by this planner.
 */
import path from "node:path";
import {traceFeature,prepareFeatureGraph} from "./feature-trace.mjs";
import {queryTerms,tokenize} from "./context-search.mjs";

const game="games/lan_house_simulator";
const sourceRoot=game+"/src";
const testRoot=game+"/tests/";
const clamp=(input,defaultValue,max)=>Number.isFinite(Number(input))?
 Math.max(1,Math.min(max,Math.trunc(Number(input)))):defaultValue;
const testsOnly=file=>file.path.startsWith(testRoot)&&
 /\.(?:test|spec)\.(?:mjs|cjs|js|ts|tsx)$/.test(file.path);
function resolveTestImports(file,knownFiles){
 const files=new Set();
 for(const spec of file.imports??[]){
  if(typeof spec!=="string"||!spec.startsWith("."))continue;
  let candidate=path.posix.normalize(path.posix.join(path.posix.dirname(file.path),spec));
  // Game tests use compiled dist/js modules. Map their imports to the
  // matching tracked TypeScript module, without guessing test content.
  const marker=game+"/dist/js/";
  if(candidate.startsWith(marker))candidate=sourceRoot+"/"+candidate.slice(marker.length);
  const ext=path.posix.extname(candidate);
  const alternatives=ext===".js"?[candidate.slice(0,-3)+".ts",
   candidate.slice(0,-3)+".tsx",candidate]:[candidate];
  for(const item of alternatives)if(knownFiles.has(item)&&item.startsWith(sourceRoot+"/"))
   files.add(item);
 }
 return files;
}
function testSuggestions(index,query,owners,reviewed,limit,graph){
 const terms=new Set(queryTerms(query));
 const ownerSet=new Set(owners.map(c=>c.path));
 const reviewSet=new Set(reviewed.map(c=>c.path));
 const results=[];
 for(const test of index.files.filter(testsOnly)){
  const direct=resolveTestImports(test,graph.byPath);
  const importOwners=[...direct].filter(p=>ownerSet.has(p));
  const importReviewed=[...direct].filter(p=>reviewSet.has(p)&&!ownerSet.has(p));
  const inName=[...new Set(tokenize(path.posix.basename(test.path)).filter(w=>terms.has(w)))];
  // Test names are weaker evidence than imports, but useful where tests
  // exercise compiled code through helpers or fixture loaders.
  const score=importOwners.length*20+importReviewed.length*8+inName.length*3;
  if(score<=0)continue;
  results.push({path:test.path,score,
   evidence:importOwners.length?"imports-candidate":importReviewed.length?
    "imports-related-module":"filename-keywords",
   importedOwners:importOwners.slice(0,6),
   importedReviewed:importReviewed.slice(0,6),
   matchingFilenameWords:inName.slice(0,8)});
 }
 return results.sort((a,b)=>b.score-a.score||a.path.localeCompare(b.path)).slice(0,limit);
}
export function planChange(index,query,{prefix=sourceRoot,owners=3,depth=2,
 reviewLimit=25,testLimit=10}={}){
 if(typeof query!=="string"||!query.trim()||query.length>180)
  throw Error("A concrete change request up to 180 characters is required");
 // This planner is designed for LHS, not arbitrary monorepo mutations.
 if(typeof prefix!=="string"||
  (prefix!==sourceRoot&&!prefix.startsWith(sourceRoot+"/"))||
  prefix.includes("..")||prefix.includes("\\"))
  throw Error("Change planning must stay within the game's src directory");
 const ownerMax=clamp(owners,3,5),reviewMax=clamp(reviewLimit,25,40);
 const testsMax=clamp(testLimit,10,20),maxDepth=clamp(depth,2,3);
 const graph=prepareFeatureGraph(index);
 const traced=traceFeature(index,query,{prefix,limit:ownerMax,depth:maxDepth});
 const candidates=traced.candidates;
 const fileMap=new Map();
 function add(file,role,via){
  if(!file||!graph.byPath.has(file))return;
  const prior=fileMap.get(file);
  if(prior){
   if(!prior.roles.includes(role))prior.roles.push(role);
   if(via&&!prior.relatedVia.includes(via))prior.relatedVia.push(via);
   return;
  }
  if(fileMap.size>=reviewMax)return;
  fileMap.set(file,{path:file,role,roles:[role],via,
   relatedVia:via?[via]:[]});
 }
 for(const candidate of candidates)add(candidate.path,"candidate-owner",null);
 for(const candidate of candidates){
  for(const p of candidate.directDependents)add(p,"direct-dependent",candidate.path);
 }
 // Inspect imports of candidate owners, but never presume those shared
 // dependencies need editing. They are marked review-only.
 for(const candidate of candidates){
  for(const p of candidate.directDependencies)add(p,"imported-dependency",candidate.path);
 }
 const reviewFiles=[...fileMap.values()];
 const testFiles=testSuggestions(index,query,candidates,reviewFiles,testsMax,graph);
 const targetImpact=traced.topCandidateImpact;
 const missingImports=candidates.reduce((total,c)=>total+
  (graph.byPath.get(c.path)?.unresolvedLocalImports?.length??0),0);
 const warnings=[
  "The likely owner and its test coverage are suggestions, not verified facts.",
  "The static graph misses dynamic imports, runtime calls and indirect DOM/event dependencies."
 ];
 if(targetImpact?.truncated)warnings.push("Impact traversal was truncated at 30 files.");
 if(missingImports)warnings.push(
  "Candidate files have "+missingImports+" unresolved local imports; this may include generated outputs.");
 if(!testFiles.length)warnings.push(
  "No related tests were found in the tracked index; review test coverage manually.");
 return {
  request:query,scope:prefix,head:index.head??null,
  status:"review-only",sources:"indexed metadata and relative import edges",
  owners:candidates.map(c=>({path:c.path,score:c.score,lexicalScore:c.lexicalScore,
   graphHint:c.graphHint,dependentsTotal:c.dependentsTotal,
   dependenciesTotal:c.dependenciesTotal,evidence:c.evidence})),
  reviewFiles,
  potentialImpact:targetImpact?
   {root:targetImpact.path,affected:targetImpact.affected,
    truncated:targetImpact.truncated,maxDepth:targetImpact.maxDepth}:null,
  suggestedTests:testFiles,
  validation:[
   {workingDirectory:game,command:"npm run typecheck",
    reason:"Existing game TypeScript type-check script"},
   {workingDirectory:game,command:"npm test",
    reason:"Existing build and complete Node test suite"}
  ],
  warnings,
  nextStep:"Read owner files and test imports, design the change, then run validation before any commit."
 };
}
