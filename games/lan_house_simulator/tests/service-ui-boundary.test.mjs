import {assertCompositionAdaptersExclude,assertSourceCall} from "./helpers/composition.mjs";
import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createGame,isValidSave} from "../dist/js/sim/engine.js";
import {createServiceActionsPort} from "../dist/js/application/serviceActionsPort.js";
import {installServiceControls} from "../dist/js/ui/serviceControls.js";
import {serializeSave,parseImportedSave} from "../dist/js/sim/saveTransfer.js";

test("contratar e dispensar equipe sem alterar salários, e após importar save",()=>{
 let s=createGame(61,"historical");
 const port=createServiceActionsPort(()=>s);
 assert.equal(port.toggleEmployee("cleaner").ok,true);
 assert.equal(s.employees?.cleaner,true);
 assert.equal(isValidSave(s),true);
 const original=s;
 const restored=parseImportedSave(serializeSave(s));
 assert.equal(isValidSave(restored),true);
 s=restored;
 assert.equal(port.toggleEmployee("cleaner").ok,true);
 assert.equal(s.employees?.cleaner,false);
 assert.equal(original.employees?.cleaner,true,"getState deve consultar a partida atual");
 assert.equal(port.toggleEmployee("technician").ok,true);
 assert.equal(s.employees?.technician,true);
});

test("IDs adulterados e a limpeza sem lixo são recusados sem efeitos",()=>{
 const s=createGame(63,"historical");
 const port=createServiceActionsPort(()=>s);
 const before=JSON.stringify(s);
 assert.equal(port.restock("keyboard").ok,false);
 assert.equal(port.restock("__proto__").ok,false);
 assert.equal(port.toggleEmployee("admin").ok,false);
 assert.equal(port.cleanNow().ok,false);
 assert.equal(JSON.stringify(s),before);
});

test("melhoria de internet respeita ano, caixa e status da conexão",()=>{
 const s=createGame(65,"historical");
 const port=createServiceActionsPort(()=>s);
 const before=JSON.stringify(s);
 assert.equal(port.upgradeInternet().ok,false);
 assert.equal(port.repairInternet().ok,false);
 assert.equal(JSON.stringify(s),before);
 s.totalMinutes=4*360*720;
 s.cash=10000;
 assert.equal(port.upgradeInternet().ok,true);
 assert.equal(s.internetTier,2);
 const once=s.cash;
 assert.equal(port.repairInternet().ok,false);
 assert.equal(s.cash,once);
 s.offlineUntil=s.totalMinutes+50;
 assert.equal(port.repairInternet().ok,true);
 assert.equal(s.offlineUntil,s.totalMinutes);
 assert.ok(s.cash<once);
});

test("interface preserva IDs, ordem e política de salvamento sem dependência no motor",()=>{
 const previous=globalThis.HTMLButtonElement;
 class Button {
  constructor(){this.disabled=false;this.handlers=[];}
  addEventListener(type,fn){assert.equal(type,"click");this.handlers.push(fn);}
  click(){for(const handler of this.handlers)handler();}
 }
 globalThis.HTMLButtonElement=Button;
 try{
  const ids=["stock-soda","stock-candy","stock-snacks","supplier-up","launch-promotion",
   "internet-up","internet-repair","license","clean-bins","hire-technician","clean-bins-now"];
  const elements=new Map(ids.map(id=>[id,new Button()]));
  const calls=[],seen=[];
  const port={
   restock:item=>{calls.push(["restock",item]);return {ok:true,message:item};},
   contractSupplier:()=>{calls.push(["supplier"]);return {ok:false,message:"supplier"};},
   promote:()=>{calls.push(["promotion"]);return {ok:true,message:"promotion"};},
   upgradeInternet:()=>{calls.push(["upgradeInternet"]);return {ok:true,message:"internet"};},
   repairInternet:()=>{calls.push(["repairInternet"]);return {ok:false,message:"repair"};},
   licenseGames:()=>{calls.push(["licenseGames"]);return {ok:true,message:"games"};},
   toggleEmployee:role=>{calls.push(["employee",role]);return {ok:true,message:role};},
   cleanNow:()=>{calls.push(["cleanNow"]);return {ok:false,message:"clean"};}
  };
  installServiceControls(port,{onResult:(result,policy)=>seen.push([result.message,policy])},
   {getElementById:id=>elements.get(id)??null});
  elements.get("internet-up").disabled=true;
  for(const id of ids)elements.get(id).click();
  assert.deepEqual(calls,[
   ["restock","soda"],["restock","candy"],["restock","snacks"],["supplier"],
   ["promotion"],["repairInternet"],["licenseGames"],["employee","cleaner"],
   ["employee","technician"],["cleanNow"]
  ]);
  assert.equal(seen.length,10);
  assert.deepEqual(seen.map(([_,policy])=>policy),[
   "always","always","always","always","always","always","always",
   "success","success","always"
  ]);
 }finally{
  if(previous===undefined)delete globalThis.HTMLButtonElement;
  else globalThis.HTMLButtonElement=previous;
 }
});

test("UI só conhece porta de aplicação e main não chama as ações extraídas",()=>{
 const root=new URL("../src/",import.meta.url);
 const component=readFileSync(new URL("ui/serviceControls.ts",root),"utf8");
 const port=readFileSync(new URL("application/serviceActionsPort.ts",root),"utf8");
 assert.doesNotMatch(component,/from\s*["']\.\.\/sim\//);
 assert.doesNotMatch(component,/from\s*["']\.\.\/render\//);
 assert.doesNotMatch(port,/\bdocument\b|\bwindow\b|\bHTMLElement\b/);
 assertSourceCall("ui/runtimeControls.ts","installServiceControls",["ports.serviceActions"]);
 assertCompositionAdaptersExclude(/\b(stockItem|contractSupplier|launchPromotion|upgradeInternet|repairInternet|licenseGames|requestCleaning|hireEmployee|dismissEmployee)\s*\(/);
});
