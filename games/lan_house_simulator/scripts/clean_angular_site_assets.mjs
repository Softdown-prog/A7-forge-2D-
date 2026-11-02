/** Discover only Angular CLI emitted, content-hashed site entrypoints.
 * No external scripts, unchecked paths or legacy site scripts are accepted.
 */
import assert from 'node:assert/strict';
import {existsSync,readdirSync} from 'node:fs';
import {resolve} from 'node:path';

const hashed=/^(?:[a-z][a-z0-9_-]*-)[a-z0-9]{6,}\.(?:js|css)$/i;
function attribute(tag,name){
 const match=tag.match(new RegExp('\\b'+name+'="([^"]+)"','i'));
 return match?.[1]??null;
}
function single(items,label){
 assert.equal(items.length,1,'Expected exactly one '+label+' Angular entrypoint');
 return items[0];
}
export function resolveAngularSiteAssets(html,compiled){
 const scripts=[...html.matchAll(/<script\b[^>]*>/gi)]
  .map(m=>attribute(m[0],'src')).filter(Boolean);
 const styles=[...html.matchAll(/<link\b[^>]*>/gi)]
  .filter(m=>attribute(m[0],'rel')==='stylesheet')
  .map(m=>attribute(m[0],'href')).filter(Boolean);
 const main=single(scripts.filter(x=>/^main-[a-z0-9]{6,}\.js$/i.test(x)),'main');
 const style=single(styles.filter(x=>/^styles-[a-z0-9]{6,}\.css$/i.test(x)),'styles');
 const files=readdirSync(compiled).filter(x=>/\.(?:js|css)$/i.test(x)).sort();
 assert.ok(files.length>=2&&files.length<80,'Unexpected Angular asset count');
 for(const file of files){
  assert.match(file,hashed,'Unhashed or unexpected JS/CSS output: '+file);
  assert.ok(existsSync(resolve(compiled,file)),'Missing Angular output: '+file);
 }
 for(const source of [...scripts,...styles]){
  assert.ok(files.includes(source),'Unrecognized script or stylesheet: '+source);
 }
 return Object.freeze({version:1,main,styles:style,files});
}
export function rewriteAngularSiteIndex(html,assets){
 let next=html;
 for(const name of [assets.main,assets.styles]){
  const attributeName=name.endsWith('.js')?'src':'href';
  const from=attributeName+'="'+name+'"';
  assert.equal(next.split(from).length-1,1,'Missing or duplicated index reference: '+name);
  next=next.replace(from,attributeName+'="/assets/site/'+name+'"');
 }
 // Additional module scripts or styles, if Angular adds them, must also be relocated.
 for(const name of assets.files){
  if(name===assets.main||name===assets.styles)continue;
  for(const attr of ['src','href']){
   const from=attr+'="'+name+'"';
   if(next.includes(from))next=next.replaceAll(from,attr+'="/assets/site/'+name+'"');
  }
 }
 assert.doesNotMatch(next,/<script\b[^>]*\bsrc="(?!\/assets\/site\/)[^"]+"/i,
  'Script outside the isolated Angular site directory');
 return next;
}
