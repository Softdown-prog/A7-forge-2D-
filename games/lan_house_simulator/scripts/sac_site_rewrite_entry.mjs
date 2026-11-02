/** Identify the precise Angular CLI site-rewrite bundle for the pinned SAC contract.
 * The postcompiler requires an exact script path, not a wildcard or guessed "main.js".
 */
import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import {join} from 'node:path';

const mainPattern=/^main-[A-Za-z0-9]{6,}\.js$/;
export async function siteRewriteEntrypoint(browserDir){
 const html=await readFile(join(browserDir,'index.html'),'utf8');
 const tags=[...html.matchAll(/<script\b[^>]*>/gi)].map(x=>x[0]);
 const sources=tags.map(tag=>tag.match(/\bsrc="([^"]+)"/i)?.[1]).filter(Boolean);
 const main=sources.filter(source=>mainPattern.test(source));
 assert.equal(main.length,1,'SAC requires one content-hashed Angular main script');
 assert.ok(!sources.includes('main.js'),'Unhashed Angular main script is not allowed');
 const file=join(browserDir,main[0]);
 assert.ok((await stat(file)).isFile(),'Angular main bundle missing or invalid');
 assert.ok((await stat(file)).size>0,'Angular main bundle is empty');
 return main[0];
}
