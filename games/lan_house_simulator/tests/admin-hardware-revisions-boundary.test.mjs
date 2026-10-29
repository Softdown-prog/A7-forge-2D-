import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createGame} from "../dist/js/sim/engine.js";
import {createPanelRevisionCache} from "../dist/js/application/panelRevisionCache.js";
import {createAdminPanelRevisionsPort} from "../dist/js/application/adminPanelRevisionsPort.js";

function fixture(){
 let game=createGame(7701,"historical");
 const port=createAdminPanelRevisionsPort(()=>game);
 return {port,state:()=>game,swap:next=>{game=next;}};
}
test("manutenção conserva a ordem das cinco posições do cache",()=>{
 const x=fixture(),station=[1999,{pc:1}];
 assert.deepEqual(x.port.computerMaintenance("hardware",2,"ram",station,false),["hardware",2,"ram",station,null]);
});
test("página é recebida sem converter o valor",()=>{
 const x=fixture(),station=[];
 for(const page of ["operations","hardware","monitors","windows","ledger",""]){
  assert.equal(x.port.computerMaintenance(page,0,"pc",station,false)[0],page);
 }
});
test("página opcional mantém undefined como antes",()=>{
 const x=fixture();assert.equal(x.port.computerMaintenance(undefined,0,"pc",[],false)[0],undefined);
});
test("estação selecionada ocupa a segunda posição",()=>{
 const x=fixture();assert.equal(x.port.computerMaintenance("hardware",7,"pc",[],false)[1],7);
});
test("aba de hardware ocupa a terceira posição",()=>{
 const x=fixture();assert.equal(x.port.computerMaintenance("hardware",0,"windows",[],false)[2],"windows");
});
test("revisão de estações mantém identidade, sem serialização antecipada",()=>{
 const x=fixture(),station=[{cash:33}],v=x.port.computerMaintenance("hardware",0,"pc",station,false);
 assert.equal(v[3],station);
});
test("desgaste é null fora da página operações",()=>{
 const x=fixture();assert.equal(x.port.computerMaintenance("hardware",1,"pc",[],false)[4],null);
});
test("página operações arredonda desgaste com mesma regra",()=>{
 const x=fixture();x.state().pcWear=[.49,.5,1.9];
 assert.deepEqual(x.port.computerMaintenance("operations",1,"pc",[],true)[4],[0,1,2]);
});
test("operação habilitada usa exatamente o método de desgaste anterior",()=>{
 const x=fixture();x.state().pcWear=[.51,3.49];
 assert.deepEqual(x.port.computerMaintenance("operations",0,"pc",[],true)[4],x.port.computerWear(true));
});
test("desgaste ausente continua opcional mesmo em operações",()=>{
 const x=fixture();x.state().pcWear=undefined;
 assert.equal(x.port.computerMaintenance("operations",0,"pc",[],true)[4],undefined);
});
test("seleção GPU contém somente revisão das estações e índice",()=>{
 const x=fixture(),station=[1999];
 assert.deepEqual(x.port.gpuChoice(station,4),[station,4]);
 assert.equal(x.port.gpuChoice(station,4).length,2);
});
test("revisão GPU mantém a referência original das estações",()=>{
 const x=fixture(),station=[{windows:true}];
 assert.equal(x.port.gpuChoice(station,0)[0],station);
});
test("índice GPU acompanha a seleção de interface sem clamp extra",()=>{
 const x=fixture();assert.deepEqual(x.port.gpuChoice([],99),[[],99]);
});
test("revisão de licenças Windows conserva vetor de entrada única",()=>{
 const x=fixture(),station=[2010];
 assert.deepEqual(x.port.windows(station),[station]);
 assert.equal(x.port.windows(station)[0],station);
});
test("mudança de estação invalida as três assinaturas no cache JSON",()=>{
 const x=fixture(),changed=createPanelRevisionCache(),station=[1],later=[2];
 const revisions=[
  ["computers",x.port.computerMaintenance("operations",0,"pc",station,true),
   x.port.computerMaintenance("operations",0,"pc",later,true)],
  ["gpuPcChoice",x.port.gpuChoice(station,0),x.port.gpuChoice(later,0)],
  ["licensePanel",x.port.windows(station),x.port.windows(later)]
 ];
 for(const [key,first,second] of revisions){
  assert.equal(changed(key,first,false),true,key);
  assert.equal(changed(key,first,false),false,key);
  assert.equal(changed(key,second,false),true,key);
 }
});
test("cache forçado mantém comportamento após extração",()=>{
 const x=fixture(),changed=createPanelRevisionCache(),revision=x.port.windows([1]);
 assert.equal(changed("licensePanel",revision,false),true);
 assert.equal(changed("licensePanel",revision,true),true);
 assert.equal(changed("licensePanel",revision,false),false);
});
test("após importar partida, desgaste considera o novo estado",()=>{
 const x=fixture(),old=x.state(),before=JSON.stringify(old);
 const imported=createGame(7702,"classic");imported.pcWear=[1.6,2.4];
 x.swap(imported);
 assert.deepEqual(x.port.computerMaintenance("operations",0,"pc",[],true)[4],[2,2]);
 assert.equal(JSON.stringify(old),before);
});
test("consultas não alteram relógio, RNG ou save",()=>{
 const x=fixture(),old=JSON.stringify(x.state());
 x.port.computerMaintenance("operations",0,"pc",[],true);
 x.port.gpuChoice([],1);x.port.windows([]);
 assert.equal(JSON.stringify(x.state()),old);
});
test("UI ainda controla nomes de cache, escolha de abas e renderização",()=>{
 const main=readFileSync(new URL("../src/main.ts",import.meta.url),"utf8");
 for(const key of ["computers","gpuPcChoice","licensePanel"]){
  assert.ok(main.includes('panelChanged("'+key+'"'),key);
 }
 assert.match(main,/adminPanelRevisionsPort\.computerMaintenance\(/);
 assert.match(main,/adminPanelRevisionsPort\.gpuChoice\(/);
 assert.match(main,/adminPanelRevisionsPort\.windows\(/);
 assert.ok(main.includes("renderAdminComputerSections({"));
 assert.ok(main.includes("renderAdminGpuLicenseSections({"));
});
test("a fronteira não importa DOM nem altera sistema ou persistência",()=>{
 const app=readFileSync(new URL("../src/application/adminPanelRevisionsPort.ts",import.meta.url),"utf8");
 for(const forbidden of ["document","window","HTMLElement","requestAnimationFrame","setInterval","localStorage","stepGame","applyResult","saveGame"])
  assert.equal(app.includes(forbidden),false,forbidden);
});
