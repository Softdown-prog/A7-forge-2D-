import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const file=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
test("React and ReactDOM are absent from the installed dependency graph",()=>{
 const pkg=JSON.parse(file("package.json")),lock=JSON.parse(file("package-lock.json"));
 for(const dep of ["react","react-dom"]){
  assert.equal(pkg.dependencies?.[dep],undefined);
  assert.equal(pkg.devDependencies?.[dep],undefined);
  assert.equal(lock.packages[""].dependencies?.[dep],undefined);
  assert.equal(lock.packages["node_modules/"+dep],undefined);
 }
 assert.equal(lock.packages["node_modules/scheduler"],undefined);
 const build=file("scripts/build.mjs");
 const entry=file("src/compat/entry.mjs");
 assert.match(build,/src\/compat\/entry\.mjs/);
 assert.doesNotMatch(entry,/from ["']react|from ["']react-dom|createRoot|flushSync/);
});
