/** Called only by the approval-gated Pages workflow after all browser checks. */
import {cpSync,rmSync,writeFileSync,existsSync,readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {resolve} from 'node:path';
import {fingerprintSource,fingerprintArtifact} from './approved_site_artifact.mjs';
const source=resolve(import.meta.dirname,'..');
const destination=resolve(process.argv[2]??'');
const sha=process.env.SOURCE_SHA;
assert.match(sha??'',/^[a-f0-9]{40}$/);
assert.ok(process.argv[2]&&destination!==source&&existsSync(resolve(destination,'package.json')),'Pass the checked-out Pages LHS source directory');
assert.equal(fingerprintSource(source),fingerprintSource(destination),'Mirror source does not match the validated source');
const site=resolve(source,'out/site');
assert.equal(JSON.parse(readFileSync(resolve(site,'site-build.json'),'utf8')).framework,'angular');
rmSync(resolve(destination,'out/site'),{recursive:true,force:true});
cpSync(site,resolve(destination,'out/site'),{recursive:true});
writeFileSync(resolve(destination,'.lhs-approved-site.json'),JSON.stringify({schemaVersion:1,
 approvedSourceSha:sha,sourceHash:fingerprintSource(destination),
 artifactHash:fingerprintArtifact(resolve(destination,'out/site'))},null,2)+'\n');
console.log('Reviewed Angular artifact prepared for the Pages mirror');
