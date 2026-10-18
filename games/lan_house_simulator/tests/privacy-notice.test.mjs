import test from "node:test";
import assert from "node:assert/strict";
import {
 PRIVACY_KEY,PRIVACY_DURATION_MS,readPrivacyChoice,savePrivacyChoice,mountPrivacyBanner
} from "../dist/js/privacyConsent.js";

function storage(){
 const saved=new Map();
 return {
  getItem:key=>saved.get(key)??null,
  setItem:(key,val)=>saved.set(key,val),
  removeItem:key=>saved.delete(key),
  clear:()=>saved.clear(),
  saved
 };
}
test("cookie choice is remembered exactly 30 days for both responses",()=>{
 for(const choice of ["accepted","rejected"]){
  const s=storage(),now=1_780_000_000_000;
  assert.equal(readPrivacyChoice(s,now),null);
  savePrivacyChoice(s,choice,now);
  assert.equal(readPrivacyChoice(s,now),choice);
  assert.equal(readPrivacyChoice(s,now+PRIVACY_DURATION_MS-1),choice);
  assert.equal(readPrivacyChoice(s,now+PRIVACY_DURATION_MS),null);
  s.clear();
  assert.equal(readPrivacyChoice(s,now),null);
 }
});
test("invalid, future or corrupt saved choices never keep the notice hidden",()=>{
 const s=storage();
 for(const value of ["{","{}",'{"version":1,"choice":"maybe","at":5}',JSON.stringify({
  version:1,choice:"accepted",at:Date.now()+100000
 })]){
  s.setItem(PRIVACY_KEY,value);
  assert.equal(readPrivacyChoice(s),null);
 }
});
test("acceptance or refusal dismisses the whole banner with no floating button",()=>{
 for(const choice of ["accepted","rejected"]){
  const s=storage(),elements=new Map();
  for(const id of ["privacy-banner","privacy-accept","privacy-reject"]){
   const handlers=new Map();
   elements.set(id,{hidden:id==="privacy-banner",addEventListener:(type,fn)=>handlers.set(type,fn),
    click:()=>handlers.get("click")?.()});
  }
  const listeners=new Map(),events=[];
  const prevDocument=globalThis.document,prevWindow=globalThis.window,prevStorage=globalThis.localStorage,prevCustomEvent=globalThis.CustomEvent;
  try{
   globalThis.document={hidden:false,getElementById:id=>elements.get(id)??null,
    addEventListener:(type,fn)=>listeners.set(type,fn),dispatchEvent:e=>events.push(e)};
   globalThis.window={addEventListener:(type,fn)=>listeners.set(type,fn)};
   globalThis.localStorage=s;
   globalThis.CustomEvent=class{constructor(type,init){this.type=type;this.detail=init.detail;}};
   mountPrivacyBanner();
   assert.equal(elements.get("privacy-banner").hidden,false);
   elements.get(choice==="accepted"?"privacy-accept":"privacy-reject").click();
   assert.equal(elements.get("privacy-banner").hidden,true);
   assert.equal(readPrivacyChoice(s),choice);
   assert.equal(events[0]?.detail.choice,choice);
   s.clear();listeners.get("storage")({key:null});
   assert.equal(elements.get("privacy-banner").hidden,false);
  }finally{
   for(const [key,value] of [["document",prevDocument],["window",prevWindow],
    ["localStorage",prevStorage],["CustomEvent",prevCustomEvent]])
    if(value===undefined)delete globalThis[key];else globalThis[key]=value;
  }
 }
});
