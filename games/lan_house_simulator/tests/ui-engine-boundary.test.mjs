import test from "node:test";
import assert from "node:assert/strict";
import {createGame,isValidSave} from "../dist/js/sim/engine.js";
import {createMerchandisePort} from "../dist/js/application/merchandisePort.js";
import {liveStatusSnapshot,computerOperationsSnapshot} from "../dist/js/application/presentationModels.js";
import {readFileSync} from "node:fs";
import {timeWeatherSnapshot} from "../dist/js/application/timeWeatherSnapshot.js";
import {serializeSave,parseImportedSave} from "../dist/js/sim/saveTransfer.js";

test("interface de mercadorias recebe DTO, não o estado vivo",()=>{
 let state=createGame(31,"historical");state.cash=2000;
 const port=createMerchandisePort(()=>state);
 const overview=port.overview("soda");
 assert.ok(overview.products.some(p=>p.id==="water"));
 assert.equal(overview.next?.year,2001);
 assert.deepEqual(port.suppliers.map(p=>p.id),["basic","economy","quality","partner"]);
 const detail=port.details("water","basic",1);
 assert.ok(detail);assert.equal(detail.canOrder,true);
 assert.equal(detail.orderQuantity,12);
 assert.equal("customers" in detail,false);
 const original=state.cash;
 detail.orders.push?.({id:900,productName:"fake",quantity:1,cost:1,minutesRemaining:0,dueDay:1});
 assert.equal(state.cash,original);
 assert.equal(state.merchandise,undefined);
});

test("comandos respeitam validações e salvamento do motor; troca de save não prende estado anterior",()=>{
 let state=createGame(33,"historical");state.cash=2000;
 const port=createMerchandisePort(()=>state);
 const before=JSON.stringify(state);
 assert.equal(port.order("water","partner",1).ok,false);
 assert.equal(port.order("inexistente","basic",1).ok,false);
 assert.equal(JSON.stringify(state),before);
 assert.equal(port.setPrice("water",1.6).ok,true);
 assert.equal(port.order("water","basic",1).ok,true);
 assert.equal(isValidSave(state),true);
 const old=state,oldSnapshot=JSON.stringify(state),loaded=parseImportedSave(serializeSave(state));
 state=loaded;
 assert.equal(port.details("water","basic",1)?.stock,12);
 assert.equal(port.setPrice("water",1.75).ok,true);
 assert.equal(JSON.stringify(old),oldSnapshot,"troca de save não deve alterar a instância anterior");
 assert.equal(port.details("water","basic",1)?.price,1.75);
});

test("modelo do calendário não depende de DOM e acompanha o relógio atual",()=>{
 const state=createGame(22,"historical");
 const before=JSON.stringify(state),view=timeWeatherSnapshot(state);
 assert.equal(view.date,"01/01/1998");assert.equal(view.ended,false);
 state.weather="rain";assert.equal(timeWeatherSnapshot(state).weather,"Chuva");
 assert.equal(JSON.stringify(state),before.replace('"weather":"sun"','"weather":"rain"'));
});

test("HUD e manutenção recebem apenas projeções independentes do GameState",()=>{
 const s=createGame(15,"historical");
 s.cash=1234.5;s.inventory.soda=17;
 const view=liveStatusSnapshot(s,"Discada");
 assert.equal(view.cash,1234.5);
 assert.equal(view.stock.soda>=17,true);
 assert.equal(view.computerCount,3);
 assert.equal(view.internetName,"Discada");
 assert.equal("customers" in view,false);
 const operations=computerOperationsSnapshot(s);
 assert.equal(operations.length,3);
 assert.equal(operations[0].index,0);
 assert.equal(typeof operations[0].cpu,"string");
 assert.equal("pcTiers" in operations[0],false);
});

test("componentes migrados não importam o motor nem possuem lógica de negócio",()=>{
 for(const name of ["merchandisePanel.ts","timeWeatherPanel.ts","presentation.ts"]){
  const source=readFileSync(new URL("../src/ui/"+name,import.meta.url),"utf8");
  assert.doesNotMatch(source,/from\s*["']\.\.\/sim\//,name+" não deve importar sim");
  assert.doesNotMatch(source,/from\s*["']\.\.\/render\//,name+" não deve importar render");
 }
 for(const name of ["merchandisePort.ts","timeWeatherSnapshot.ts","presentationModels.ts"]){
  const source=readFileSync(new URL("../src/application/"+name,import.meta.url),"utf8");
  assert.doesNotMatch(source,/\bdocument\b|\bwindow\b|\bHTMLElement\b/,name+" deve ser independente do navegador");
 }
});
