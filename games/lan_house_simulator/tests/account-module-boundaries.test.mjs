import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createCloudSaveController} from "../dist/js/ui/account/cloudSaves.js";
import {renderCosmeticCard} from "../dist/js/ui/account/cosmeticCard.js";
import {COOKIE_COSMETICS} from "../dist/js/sim/premiumCosmetics.js";

function node(tag){
 return {
  tag,children:[],dataset:{},handlers:{},textContent:"",disabled:false,
  setAttribute(){},
  append(...children){this.children.push(...children);},
  addEventListener(name,handler){this.handlers[name]=handler;},
  get lastChild(){return this.children.at(-1);}
 };
}
function withDocument(run){
 const old=Object.getOwnPropertyDescriptor(globalThis,"document");
 globalThis.document={createElement:node,createTextNode:textContent=>({textContent})};
 try{return run();}finally{
  if(old)Object.defineProperty(globalThis,"document",old);
  else delete globalThis.document;
 }
}

test("cosmetic store card cannot enable redemption without server price, balance and login",()=>withDocument(()=>{
 const item=COOKIE_COSMETICS.find(i=>i.id==="neon-open-sign");
 assert.ok(item);
 let redeemed=0;
 const deps={
  year:2030,unequipped:new Set(),loading:false,hasSession:false,
  balance:10000,serverPrice:item.cookies,configured:true,
  onToggle:()=>true,onStatus:()=>{},onRedeem:()=>{redeemed++;}
 };
 const button=(options)=>renderCosmeticCard(item,false,options).children.at(-1).children[0];
 assert.equal(button(deps).disabled,true);
 assert.equal(button({...deps,hasSession:true,serverPrice:undefined}).disabled,true);
 assert.equal(button({...deps,hasSession:true,serverPrice:item.cookies+1}).disabled,true);
 assert.equal(button({...deps,hasSession:true,balance:item.cookies-1}).disabled,true);
 assert.equal(button({...deps,hasSession:true,configured:false}).disabled,true);
 assert.equal(button({...deps,hasSession:true,loading:true}).disabled,true);
 const enabled=button({...deps,hasSession:true});
 assert.equal(enabled.disabled,false);
 enabled.handlers.click();
 assert.equal(redeemed,1);
}));

test("equipping a purchased cosmetic changes only that item's local toggle state",()=>withDocument(()=>{
 const item=COOKIE_COSMETICS.find(i=>i.id==="neon-open-sign");
 assert.ok(item);
 const unequipped=new Set(),calls=[];
 const card=renderCosmeticCard(item,true,{
  year:2030,unequipped,loading:false,hasSession:true,balance:0,serverPrice:undefined,configured:true,
  onToggle:(id,checked)=>{calls.push([id,checked]);return true;},
  onStatus:()=>{},onRedeem:()=>assert.fail("owned cosmetics cannot be redeemed")
 });
 const label=card.children.at(-1).children.at(-1);
 const check=label.children[0];
 check.checked=false;
 check.handlers.change();
 assert.deepEqual(calls,[[item.id,false]]);
 assert.equal(unequipped.has(item.id),true);
}));

test("cloud saves require revision discovery and preserve server optimistic concurrency",async()=>{
 const calls=[],status={textContent:""},save={day:12};
 const port={exportSaveText:()=>JSON.stringify(save),prepareRestore:()=>()=>assert.fail("no restore requested")};
 let hasSession=false,revision="r1";
 const cloud=createCloudSaveController(port,{
  hasSession:()=>hasSession,cloudState:status,
  async api(path,body){
   calls.push({path,body});
   if(body){assert.equal(body.expectedRevision,revision);assert.deepEqual(body.save,save);
    revision="r2";return {revision};}
   return {revision,save};
  }
 });
 await assert.rejects(()=>cloud.save(),/Consulte a nuvem/);
 await assert.rejects(()=>cloud.read(),/Entre na conta/);
 assert.equal(calls.length,0);
 hasSession=true;
 await cloud.read();
 assert.match(status.textContent,/Save encontrado/);
 await cloud.save();
 assert.equal(calls[1].path,"/v1/saves/main");
 assert.equal(calls[1].body.expectedRevision,"r1");
 assert.equal(revision,"r2");
 cloud.reset();
 await assert.rejects(()=>cloud.save(),/Consulte a nuvem/);
});

test("cloud restoration is never automatic, including backup reads",async()=>{
 const old=Object.getOwnPropertyDescriptor(globalThis,"window");
 let allowed=false,restored=0,prepared=0;
 globalThis.window={confirm:()=>allowed};
 try{
  const cloud=createCloudSaveController({
   prepareRestore:json=>{prepared++;assert.deepEqual(JSON.parse(json),{day:7});
    return ()=>{restored++;};},
   exportSaveText:()=>JSON.stringify({day:7})
  },{
   hasSession:()=>true,cloudState:{textContent:""},
   api:async path=>{assert.match(path,/^\\/v1\\/saves\\/main/);return {save:{day:7},revision:"r7"};}
  });
  await cloud.read(false,false);
  assert.equal(prepared,0);
  await cloud.read(true,true);
  assert.equal(prepared,1);assert.equal(restored,0);
  allowed=true;
  await cloud.read(true,true);
  assert.equal(restored,1);
 }finally{
  if(old)Object.defineProperty(globalThis,"window",old);
  else delete globalThis.window;
 }
});

test("account component owns one Angular-aware fallback and keeps public entrypoint",()=>{
 const root=new URL("../src/ui/",import.meta.url);
 const dialog=readFileSync(new URL("account/dialog.ts",root),"utf8");
 const controller=readFileSync(new URL("cloudControls.ts",root),"utf8");
 assert.match(dialog,/angularDialog\\?\\?document\\.createElement\\("dialog"\\)/);
 assert.match(controller,/const dialog=ensureAccountDialog\\(\\)/);
 assert.equal((controller.match(/export function mountCloudControls\\(/g)??[]).length,1);
 assert.doesNotMatch(controller,/dialog\\.innerHTML/);
});
