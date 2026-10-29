import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createGame} from "../dist/js/sim/engine.js";
import {createFrameFeedbackPort} from "../dist/js/application/frameFeedbackPort.js";

function harness(){
 let state=createGame(9301,"historical");
 const queues={payments:[],sales:[],speech:[]},sounds=[];
 const audio={
  income:kind=>sounds.push("income:"+kind),
  soda:()=>sounds.push("soda"),candy:()=>sounds.push("candy"),
  printer:()=>sounds.push("printer"),keyboard:()=>sounds.push("keyboard")
 };
 return {
  get state(){return state;},set state(value){state=value;},
  queues,sounds,port:createFrameFeedbackPort(()=>state,audio,queues)
 };
}
test("pagamentos drenam uma vez, mantêm limite 12 e emitem som por evento",()=>{
 const h=harness();
 h.state.paymentEffects=Array.from({length:14},(_,i)=>({amount:i+1,x:i,y:1}));
 h.port.payments(true);
 assert.deepEqual(h.queues.payments.map(e=>e.amount),Array.from({length:12},(_,i)=>i+3));
 assert.ok(h.queues.payments.every(e=>e.age===0));
 assert.equal(h.sounds.filter(s=>s==="income:payment").length,14);
 assert.deepEqual(h.state.paymentEffects,[]);
 h.port.payments(true);assert.equal(h.sounds.length,14);
});
test("sons das vendas consideram item mesmo sem posição visual válida",()=>{
 const h=harness();
 h.state.saleEffects=[
  {item:"soda",amount:4,x:2,y:3},
  {item:"candy"},
  {item:"snacks",amount:NaN,x:0,y:1}
 ];
 h.port.sales(true);
 assert.deepEqual(h.sounds,["income:sale","soda","income:sale","candy","income:sale","candy"]);
 assert.deepEqual(h.queues.sales,[{amount:4,x:2,y:3,age:0}]);
 assert.deepEqual(h.state.saleEffects,[]);
 h.state.saleEffects=Array.from({length:15},(_,i)=>({item:"soda",amount:i,x:i,y:1}));
 h.port.sales(true);
 assert.equal(h.queues.sales.length,12);
 assert.equal(h.queues.sales[0].amount,3);
});
test("sons de impressora e teclado exigem IDs inteiros; balões de fala limitados",()=>{
 const h=harness();
 h.state.printEffects=[{customerId:1},{customerId:NaN},{customerId:1.5}];
 h.state.keyboardEffects=[{customerId:1,pcIndex:0},{customerId:1,pcIndex:1.5},{customerId:NaN,pcIndex:2}];
 h.state.speechEffects=Array.from({length:10},(_,i)=>({text:"texto "+i,x:1,y:2,kind:"praise"}));
 h.port.prints(true);h.port.keyboards(true);h.port.speech(true);
 assert.deepEqual(h.sounds,["printer","keyboard"]);
 assert.equal(h.queues.speech.length,8);
 assert.equal(h.queues.speech[0].text,"texto 2");
 assert.deepEqual(h.state.speechEffects,[]);
});
test("fora do jogo os eventos não são consumidos e os sons ficam mudos",()=>{
 const h=harness();
 h.state.paymentEffects=[{amount:1,x:1,y:1}];
 h.state.saleEffects=[{item:"soda",amount:1,x:0,y:0}];
 h.state.printEffects=[{customerId:1}];
 h.state.keyboardEffects=[{customerId:2,pcIndex:0}];
 h.state.speechEffects=[{text:"oi",x:0,y:0,kind:"praise"}];
 h.port.payments(false);h.port.sales(false);h.port.prints(false);h.port.keyboards(false);h.port.speech(false);
 for(const field of ["paymentEffects","saleEffects","printEffects","keyboardEffects","speechEffects"])
  assert.equal(h.state[field].length,1,field);
 assert.deepEqual(h.sounds,[]);
 assert.deepEqual(h.queues,{payments:[],sales:[],speech:[]});
});
test("o adaptador consome a partida importada e não a instância anterior",()=>{
 const h=harness(),old=h.state;
 old.paymentEffects=[{amount:10,x:1,y:2}];
 h.state=createGame(9302,"historical");
 h.state.paymentEffects=[{amount:20,x:3,y:4}];
 h.port.payments(true);
 assert.equal(h.queues.payments[0].amount,20);
 assert.equal(old.paymentEffects.length,1);
});
test("aplicação não depende de DOM ou mixer, main preserva a ordem de efeitos",()=>{
 const root=new URL("../src/",import.meta.url);
 const module=readFileSync(new URL("application/frameFeedbackPort.ts",root),"utf8");
 const main=readFileSync(new URL("main.ts",root),"utf8");
 assert.doesNotMatch(module,/from\s*["']\.\.\/(?:audio|ui|render)\//);
 assert.doesNotMatch(module,/\b(document|window|CanvasRenderingContext2D|Soundscape|HTMLAudioElement)\b/);
 assert.match(main,/createFrameFeedbackPort\(\(\)=>game,soundscape/);
 const coordinator=readFileSync(new URL("application/frameEventDispatch.ts",root),"utf8");
 assert.match(main,/dispatchFrameEvents\(\{/);
 assert.match(main,/feedback:frameFeedback/);
 for(const name of ["payments","sales","prints","keyboards","speech"])
  assert.match(coordinator,new RegExp("options\\.feedback\\."+name+"\\(options\\.playing\\)"));
 assert.match(main,/consumeNewMail\(knownMailIds,game\.notices\)/);
 assert.match(main,/if\(game\.served>previousServed\)/);
 assert.match(main,/if\(game\.purchases>previousPurchases\)/);
 const lifecycle=readFileSync(new URL("ui/pageSaveLifecycle.ts",root),"utf8");
 assert.match(main,/installPageSaveLifecycle\(\{win:window,doc:document,every:\(callback,ms\)=>window\.setInterval\(callback,ms\),save\}\)/);
 assert.match(lifecycle,/options\.every\(options\.save,8000\)/);
});
