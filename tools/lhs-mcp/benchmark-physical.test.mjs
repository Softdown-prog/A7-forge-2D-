import test from "node:test";
import assert from "node:assert/strict";
import {runAll,runPhysicalBenchmark} from "./benchmark-physical.mjs";

test("physical Git index 125 files: cold, warm and committed deltas are identical",()=>{
 const r=runPhysicalBenchmark(125);
 assert.equal(r.files,125);
 assert.equal(r.reused,123);
 assert.equal(r.scanned,2);
 assert.equal(r.modifiedFiles,1);
 assert.equal(r.addedFiles,1);
 assert.equal(r.deletedFiles,1);
 assert.equal(r.equivalentToCold,true);
 assert.equal(r.contextQueryResultCount>0,true);
 for(const n of [r.coldIndexMs,r.warmIndexMs,r.incrementalIndexMs,
  r.freshAfterChangeMs,r.heapUsedEndMiB,r.peakRssMiB])assert.ok(Number.isFinite(n)&&n>=0);
});
test("physical benchmark validates sizing and separate report",()=>{
 assert.throws(()=>runPhysicalBenchmark(1),/100/);
 assert.throws(()=>runAll([100,200,300]),/one or two/);
 const r=runAll([100]);
 assert.equal(r.reports.length,1);
 assert.equal(r.reports[0].files,100);
 assert.equal(r.reports[0].equivalentToCold,true);
});
