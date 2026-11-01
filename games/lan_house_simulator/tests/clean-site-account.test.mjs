import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=(p)=>readFileSync(new URL(p,import.meta.url),'utf8');
test('Angular account uses independent transport, explicit upload and scoped sessions',()=>{
 const c=read('../frontend-angular/src/site-rewrite/account-client.ts');
 const app=read('../frontend-angular/src/site-rewrite/account.ts');
 const html=read('../frontend-angular/src/site-rewrite/account.html');
 const host=read('../frontend-angular/src/site-rewrite/site-app.html');
 const build=read('../scripts/build_clean_angular_site.mjs');
 const qa=read('../scripts/verify_clean_angular_account.mjs');
 for(const txt of [c,app,html,host]){
  assert.doesNotMatch(txt,/website\/account|react-dom|bootstrap\.min\.js|alpine\.js|localStorage\.clear\(/i);
 }
 for(const term of ['SESSION_MAX_AGE=8*60*60*1000',
   "SESSION_KEY='lhs.account.session.v1'","this.signOut();",
   "this.apiOrigin+path", "expectedRevision","Bearer "])
  assert.ok((c+app).includes(term),term);
 assert.match(c,/URLSearchParams\(\{grant_type:'refresh_token'/);
 assert.match(c,/api\(path:string,body\?:RequestJson,retried=false\)/);
 assert.match(app,/parseImportedSave\(text\)/);
 assert.match(app,/file\.size>2000000/);
 assert.match(app,/this\.uploadedSave=payload/);
 assert.match(app,/dialog\.returnValue!=='confirm'/);
 assert.match(app,/error\.status===409/);
 assert.match(html,/id="upload-save"/);
 assert.match(html,/id="confirm-upload"/);
 assert.match(html,/id="cancel-upload"/);
 assert.match(build,/https:\/\/securetoken\.googleapis\.com/);
 assert.match(build,/https:\/\/identitytoolkit\.googleapis\.com/);
 assert.match(qa,/Unmocked external URL/);
 assert.match(qa,/forceConflict=true/);
 assert.match(qa,/serializeSave\(createGame\(\)\)/);
});
