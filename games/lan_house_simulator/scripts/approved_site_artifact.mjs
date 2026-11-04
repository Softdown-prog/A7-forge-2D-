/** Bind a reviewed static artifact to its build inputs; never deploys anything. */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync,readdirSync,existsSync} from 'node:fs';
import {resolve,relative} from 'node:path';
const walk=dir=>readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(resolve(dir,e.name)):[resolve(dir,e.name)]);
function fingerprint(root,files){
 const hash=createHash('sha256');
 for(const file of [...new Set(files)].sort()){
  hash.update(relative(root,file).replaceAll('\\','/'));hash.update('\0');
  hash.update(readFileSync(file));hash.update('\0');
 }
 return hash.digest('hex');
}
export function fingerprintSource(root){
 const dirs=['src','assets','scripts','frontend-angular/src','frontend-angular/scripts'];
 const files=dirs.filter(d=>existsSync(resolve(root,d))).flatMap(d=>walk(resolve(root,d)));
 for(const dir of [root,resolve(root,'frontend-angular')]){
  if(existsSync(dir))for(const e of readdirSync(dir,{withFileTypes:true}))
   if(e.isFile()&&!e.name.startsWith('.')&&/\.(?:json|mjs|ts|css|html)$/.test(e.name))files.push(resolve(dir,e.name));
 }
 for(const name of ['website/account-client.mjs','website/assets/sala.webp'])
  if(existsSync(resolve(root,name)))files.push(resolve(root,name));
 return fingerprint(root,files);
}
export function fingerprintArtifact(root){return fingerprint(root,walk(root));}
export function verifyApprovedArtifact(root,site){
 const proof=JSON.parse(readFileSync(resolve(root,'.lhs-approved-site.json'),'utf8'));
 assert.equal(proof.schemaVersion,1);
 assert.match(proof.approvedSourceSha,/^[a-f0-9]{40}$/);
 assert.equal(proof.sourceHash,fingerprintSource(root),'Approved build inputs changed; publish a freshly validated artifact');
 assert.equal(proof.artifactHash,fingerprintArtifact(site),'Approved Angular artifact was changed');
 return proof;
}
