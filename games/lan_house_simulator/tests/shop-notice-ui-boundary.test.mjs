import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createGame,isValidSave} from "../dist/js/sim/engine.js";
import {serializeSave,parseImportedSave} from "../dist/js/sim/saveTransfer.js";
import {createShopActionsPort} from "../dist/js/application/shopActionsPort.js";
import {createNoticeActionsPort} from "../dist/js/application/noticeActionsPort.js";
import {installShopControls} from "../dist/js/ui/shopControls.js";
import {installNoticeControls} from "../dist/js/ui/noticeControls.js";

test("loja valida IDs, mantém os limites e segue a instância importada",()=>{
 let s=createGame(84,"historical");s.cash=10000;
 const port=createShopActionsPort(()=>s);
 const initial=JSON.stringify(s);
 for(const id of ["extend-south","extend-__proto__","extend-west-north","bomba"]){
  assert.equal(port.purchase(id).ok,false,id);
  assert.equal(JSON.stringify(s),initial);
 }
 assert.equal(port.canPlace("impossible"),false);
 assert.equal(JSON.stringify(s),initial);
 const original=s;
 assert.equal(port.purchase("extend-west").ok,true);
 assert.equal(s.roomExtensions?.west,1);
 assert.equal(isValidSave(s),true);
 s=parseImportedSave(serializeSave(s));
 assert.equal(port.purchase("extend-east").ok,true);
 assert.equal(s.roomExtensions?.east,1);
 assert.equal(original.roomExtensions?.east,0);
});

test("a porta de correio preserva decisões, marcação de leitura e save substituído",()=>{
 let s=createGame(85,"historical");s.cash=1000;
 const port=createNoticeActionsPort(()=>s);
 const before=JSON.stringify(s);
 assert.equal(port.choose("absent","accept").ok,false);
 assert.equal(port.markRead("nonexistent"),false);
 assert.equal(JSON.stringify(s),before);
 const previous=s;
 s=parseImportedSave(serializeSave(s));
 assert.equal(port.hireProgrammer().ok,true);
 assert.equal(s.contentFilterInstalled,true);
 assert.equal(previous.contentFilterInstalled===true,false);
 assert.equal(port.hireProgrammer().ok,false);
 assert.equal(isValidSave(s),true);
});

test("cliques da loja preservam modos de colocação, compra e botões bloqueados",()=>{
 const globals={Element:globalThis.Element,HTMLButtonElement:globalThis.HTMLButtonElement};
 class ElementStub{closest(){return this;}}
 class ButtonStub extends ElementStub{constructor(data={},disabled=false){super();this.dataset=data;this.disabled=disabled;}}
 globalThis.Element=ElementStub;globalThis.HTMLButtonElement=ButtonStub;
 try{
  const handlers={};
  const catalog={
   addEventListener:(name,cb)=>{handlers[name]=cb;},
   querySelector:selector=>selector==="#ps1-placement"?{value:"floor-2"}:null
  };
  const calls=[],port={
   canPlace:k=>{calls.push(["check",k]);return k!=="poster";},
   purchase:(id,slot)=>{calls.push(["purchase",id,slot]);return {ok:true,message:id};}
  };
  installShopControls(catalog,port,{
   onPlacement:mode=>calls.push(["place",mode]),
   onPurchase:(result,id)=>calls.push(["result",result.message,id])
  });
  const click=(data,disabled=false)=>handlers.click({target:new ButtonStub(data,disabled)});
  click({buy:"computer-annex"});
  click({buy:"wall"});
  click({buy:"door"});
  click({buy:"table"});
  click({buy:"poster"});
  click({buy:"ps1"});
  click({buy:"computer"},true);
  click({buyPs1Disc:"gol-de-rua"});
  assert.deepEqual(calls,[
   ["place","computer-annex"],["place","wall"],["place","door"],
   ["check","table"],["place","table"],["check","poster"],
   ["purchase","ps1","floor-2"],["result","ps1","ps1"]
  ]);
 }finally{
  for(const [name,value] of Object.entries(globals)){
   if(value===undefined)delete globalThis[name];else globalThis[name]=value;
  }
 }
});

test("correio segue prioridade da decisão, leitura, contratação e navegação",()=>{
 const globals={Element:globalThis.Element,HTMLButtonElement:globalThis.HTMLButtonElement};
 class ElementStub{closest(){return this;}}
 class ButtonStub extends ElementStub{constructor(data={},disabled=false){super();this.dataset=data;this.disabled=disabled;}}
 globalThis.Element=ElementStub;globalThis.HTMLButtonElement=ButtonStub;
 try{
  let listener;
  const root={addEventListener:(name,fn)=>{assert.equal(name,"click");listener=fn;}};
  const calls=[],port={
   choose:(id,choice)=>{calls.push(["decision",id,choice]);return {ok:true,message:"chosen"};},
   markRead:id=>{calls.push(["read",id]);return true;},
   hireProgrammer:()=>{calls.push(["hire"]);return {ok:true,message:"hired"};}
  };
  installNoticeControls(root,port,{
   onResult:r=>calls.push(["result",r.message]),
   onRead:()=>calls.push(["repaint"]),
   navigate:page=>calls.push(["navigate",page])
  });
  const click=(data,disabled=false)=>listener({target:new ButtonStub(data,disabled)});
  click({decision:"supplier-offer",choice:"supplier-decline",noticeRead:"ignored"});
  click({noticeRead:"safety"});
  click({noticeAction:"programmer"});
  click({noticeAction:"windows"});
  click({noticeAction:"games"});
  click({noticeAction:"programmer"},true);
  assert.deepEqual(calls,[
   ["decision","supplier-offer","supplier-decline"],["result","chosen"],
   ["read","safety"],["repaint"],["hire"],["result","hired"],
   ["navigate","windows"],["navigate","games"]
  ]);
 }finally{
  for(const [name,value] of Object.entries(globals)){
   if(value===undefined)delete globalThis[name];else globalThis[name]=value;
  }
 }
});

test("controladores não importam o motor e main somente compõe as portas",()=>{
 const root=new URL("../src/",import.meta.url);
 const main=readFileSync(new URL("main.ts",root),"utf8");
 for(const p of ["ui/shopControls.ts","ui/noticeControls.ts"]){
  const txt=readFileSync(new URL(p,root),"utf8");
  assert.doesNotMatch(txt,/from\s*["']\.\.\/sim\//);
  assert.doesNotMatch(txt,/from\s*["']\.\.\/render\//);
 }
 for(const p of ["application/shopActionsPort.ts","application/noticeActionsPort.ts"]){
  const txt=readFileSync(new URL(p,root),"utf8");
  assert.doesNotMatch(txt,/\bdocument\b|\bwindow\b|\bHTMLElement\b/);
 }
 assert.match(main,/installShopControls\(shopCatalog,createShopActionsPort\(\(\)=>game\)/);
 assert.match(main,/installNoticeControls\(noticesList,noticeActions/);
 assert.doesNotMatch(main,/\b(buyComputer|buyPrinter|buyDiscCopier|expandShop|expandDirection|chooseDecision|hireContentProgrammer|readNotice|reviewNotices)\s*\(/);
});
