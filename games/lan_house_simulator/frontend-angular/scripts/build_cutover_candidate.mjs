/** Assemble an isolated production-like static Angular candidate.
 * The published HTML and standard React build remain unchanged.
 */
import {cp,mkdir,readFile,rm,stat,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
import {createAngularCutoverDocument,ANGULAR_CUTOVER_HOSTS} from './cutover_document.mjs';

const gameRoot=resolve(import.meta.dirname,'../../dist');
const angularRoot=resolve(import.meta.dirname,'../dist/game-ui/browser');
const output=resolve(import.meta.dirname,'../../out/angular-cutover-candidate');
const original=await readFile(resolve(gameRoot,'index.html'),'utf8');
const html=createAngularCutoverDocument(original);
for(const file of ['main.js','styles.css'])
 assert.ok((await stat(resolve(angularRoot,file))).isFile(),'Angular asset absent: '+file);
assert.ok((await stat(resolve(gameRoot,'js/main.js'))).isFile(),'Compiled Canvas game is absent');
await rm(output,{recursive:true,force:true});
await mkdir(output,{recursive:true});
await cp(gameRoot,output,{recursive:true});
await cp(angularRoot,resolve(output,'__angular'),{recursive:true});
await rm(resolve(output,'js/react-entry.js'),{force:true});
await writeFile(resolve(output,'index.html'),html);
const report={
 kind:'lhs-angular-cutover-candidate',deployApproved:false,
 source:'Compiled game and Angular build; original source HTML unchanged',
 angularHosts:ANGULAR_CUTOVER_HOSTS,
 reactBootstrap:false,gameEngine:'./js/main.js',
 htmlBytes:Buffer.byteLength(html)
};
await writeFile(resolve(output,'angular-candidate-report.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({output,hosts:report.angularHosts.length,reactBootstrap:false}));
