/**
 * Git-index blob fingerprints for incremental parsing.
 * Changed working-tree paths are always reparsed even when the staged blob
 * matches the previously cached file. Git status is not used as a cache key.
 */
import {execFileSync} from "node:child_process";
function gitBytes(root,args){
 return execFileSync("git",args,{cwd:root,encoding:"buffer",maxBuffer:64*1024*1024});
}
export function trackedFingerprints(root){
 const tracked=new Map();
 const stage=gitBytes(root,["ls-files","--stage","-z"]).toString("utf8");
 for(const row of stage.split("\0")){
  if(!row)continue;
  const tab=row.indexOf("\t");
  if(tab<0)continue;
  const match=/^([0-7]{6}) ([0-9a-f]{40,64}) ([0-3])$/.exec(row.slice(0,tab));
  if(!match||match[3]!=="0")continue;
  tracked.set(row.slice(tab+1),{mode:match[1],oid:match[2]});
 }
 // Unstaged edits are not reflected by git ls-files --stage.
 const dirty=new Set(gitBytes(root,["diff","--name-only","-z","--"]).toString("utf8").split("\0").filter(Boolean));
 return {tracked,dirty};
}
export function cacheEntry(previous,relative,mode,oid,dirty){
 if(dirty||!previous||previous.mode!==mode||previous.blobOid!==oid||
   previous.path!==relative||!Array.isArray(previous.symbols)||
   !Array.isArray(previous.imports)||!Number.isSafeInteger(previous.bytes)||
   previous.bytes<0)return null;
 return previous;
}
