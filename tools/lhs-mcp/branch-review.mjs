/**
 * Compare the current feature branch to a locally available remote base.
 * Always diff from the merge base (three-dot semantics); never fetch,
 * checkout, merge, stage, execute repository code, or approve a PR.
 */
import {execFileSync} from "node:child_process";
import {reviewDiff} from "./diff-review.mjs";

const game="games/lan_house_simulator/";
const angular=game+"frontend-angular/";
const core=game+"src/";
const tests=game+"tests/";
const site=game+"website/";
const run=(root,...args)=>execFileSync("git",args,{cwd:root,encoding:"utf8",
 maxBuffer:8*1024*1024,timeout:20000}).trim();
export function validateBaseBranch(input="main"){
 if(typeof input!=="string"||input.length>90||
  !/^[A-Za-z0-9][A-Za-z0-9._/-]*$/.test(input)||
  input.includes("..")||input.includes("//")||
  input.endsWith(".")||input.endsWith("/")||
  input.split("/").some(part=>part.startsWith(".")||part.endsWith(".lock")))
  throw Error("Expected a safe remote branch name, for example main");
 return input;
}
function parseDiff(raw){
 const values=raw.split("\0"),changes=[];
 for(let i=0;i<values.length&&values[i];){
  const state=values[i++],status=state[0];
  if(!/^[ACDMRTU]$/.test(status))throw Error("Unexpected Git diff status");
  const previousPath=(status==="R"||status==="C")?values[i++]:null;
  const file=values[i++];
  if(typeof file!=="string"||!file)throw Error("Truncated Git diff record");
  changes.push({status,path:file,...(previousPath?{previousPath}:{})});
 }
 return changes;
}
/** Requires refs/remotes/origin/<branch> in the local checkout. */
export function readBranchComparison(root,{baseBranch="main"}={}){
 const safeBranch=validateBaseBranch(baseBranch);
 const remoteRef="refs/remotes/origin/"+safeBranch+"^{commit}";
 let baseSha;
 try{baseSha=run(root,"rev-parse","--verify","--end-of-options",remoteRef);}
 catch{throw Error("Base remote branch is not available locally; fetch history before review");}
 const headSha=run(root,"rev-parse","--verify","HEAD^{commit}");
 let mergeBaseSha;
 try{mergeBaseSha=run(root,"merge-base",baseSha,headSha);}
 catch{throw Error("No common history between base branch and HEAD");}
 const [behindText,aheadText]=run(root,"rev-list","--left-right","--count",
  baseSha+"..."+headSha).split(/\s+/);
 const behind=Number(behindText),ahead=Number(aheadText);
 if(!Number.isSafeInteger(behind)||!Number.isSafeInteger(ahead))
  throw Error("Invalid Git branch divergence counts");
 const raw=execFileSync("git",
  ["diff","--name-status","-z","--find-renames",mergeBaseSha,headSha,"--"],
  {cwd:root,encoding:"utf8",maxBuffer:8*1024*1024,timeout:20000});
 return {baseBranch:safeBranch,baseSha,headSha,mergeBaseSha,behind,ahead,
  changes:parseDiff(raw)};
}
function classFor(file){
 if(file.startsWith(angular))return "frontendAngular";
 if(file.startsWith(core))return "gameCore";
 if(file.startsWith(tests))return "gameTests";
 if(file.startsWith(site))return "gameSite";
 if(file.startsWith(game))return "gameOther";
 return "repositoryOther";
}
export function reviewBranch(index,comparison,options={}){
 if(!comparison||!Array.isArray(comparison.changes)||
   !/^[0-9a-f]{40}$/.test(comparison.headSha)||
   !/^[0-9a-f]{40}$/.test(comparison.baseSha)||
   !/^[0-9a-f]{40}$/.test(comparison.mergeBaseSha))
  throw Error("Expected a validated branch comparison");
 if(index.head!==undefined&&index.head!==comparison.headSha)
  throw Error("Catalog HEAD differs from compared branch HEAD; reindex before review");
 const totals={frontendAngular:0,gameCore:0,gameTests:0,
  gameSite:0,gameOther:0,repositoryOther:0};
 for(const item of comparison.changes)totals[classFor(item.path)]++;
 // reviewDiff validates game-only paths and withholds names of sensitive
 // files; the whole repository diff is used only for category counts.
 const gameChanges=comparison.changes.filter(x=>x.path.startsWith(game));
 const impacted=reviewDiff(index,gameChanges,{depth:3,maxChanged:100,
  maxImpacted:100,testLimit:30,...options});
 const hasAngular=totals.frontendAngular>0;
 const validations=[];
 if(hasAngular)validations.push(
  {directory:game,command:"node --test tests/angular-ui-foundation.test.mjs tests/angular-admin-workspaces.test.mjs",
   reason:"Angular boundary contracts"},
  {directory:game,command:"npm ci --prefix frontend-angular --no-audit --no-fund",
   reason:"Pinned Angular dependency installation"},
  {directory:game,command:"npm run lint --prefix frontend-angular",
   reason:"Angular ESLint"},
  {directory:game,command:"npm run build --prefix frontend-angular",
   reason:"Angular AOT production preview"},
  {directory:game,command:"node frontend-angular/scripts/verify_integrated_game.mjs",
   reason:"Browser QA; requires existing Playwright and built assets; run via dedicated preview workflow"}
 );
 if(totals.gameCore||totals.gameTests)validations.push(
  {directory:game,command:"npm run typecheck",reason:"Game source typing"},
  {directory:game,command:"npm test",reason:"Game regression suite"});
 if(totals.gameSite)validations.push(
  {directory:game,command:"npm run check:site",reason:"Website verification"});
 const warnings=[
  "This advisory report does not prove merge safety or Angular/React parity.",
  "The graph follows imports in the current branch only; historical deletions are approximate.",
  "The Angular preview must not replace the production React entry until separately authorized."
 ];
 if(comparison.behind>0)warnings.push("Feature branch is behind the base; a new main commit needs separate review.");
 if(impacted.changedCount<gameChanges.length)warnings.push("Some paths were excluded for safety or truncated.");
 if(hasAngular&&impacted.changedSources.length===0)
  warnings.push("Angular workspace changes are not under game/src; core import graph cannot assess them.");
 const severity=hasAngular||totals.gameCore||totals.gameTests||totals.gameSite?
  "manual-review-required":impacted.risk==="high"?"manual-review-required":"maintenance-only";
 return {
  status:"review-only",mergeDecision:"not-authorized",risk:severity,
  comparison:{baseBranch:comparison.baseBranch,baseSha:comparison.baseSha,
   mergeBaseSha:comparison.mergeBaseSha,headSha:comparison.headSha,
   aheadBy:comparison.ahead,behindBy:comparison.behind,
   diverged:comparison.behind>0},
  filesChanged:comparison.changes.length,
  areas:totals,
  affectedGame:impacted,
  validation:validations,
  warnings
 };
}
