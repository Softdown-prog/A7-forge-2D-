/** Snapshot the standalone Angular game for browser QA. */
import {cp,readFile,rm,stat,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
import {assertAngularGameDocument,ANGULAR_GAME_HOSTS} from './game_document.mjs';

const gameRoot=resolve(import.meta.dirname,'../../dist');
const output=resolve(import.meta.dirname,'../../out/angular-cutover-candidate');
const html=await readFile(resolve(gameRoot,'index.html'),'utf8');
assertAngularGameDocument(html);
for(const file of ['__angular/main.js','__angular/styles.css','js/main.js'])
 assert.ok((await stat(resolve(gameRoot,file))).isFile(),'Missing compiled game asset: '+file);
await rm(output,{recursive:true,force:true});
await cp(gameRoot,output,{recursive:true});
const report={
 kind:'lhs-angular-cutover-candidate',deployApproved:false,framework:'angular',
 angularHosts:ANGULAR_GAME_HOSTS,gameEngine:'./js/main.js',htmlBytes:Buffer.byteLength(html)
};
await writeFile(resolve(output,'angular-candidate-report.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({output,hosts:report.angularHosts.length,framework:report.framework}));
