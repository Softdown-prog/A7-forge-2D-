import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createGame,isValidSave} from "../dist/js/sim/engine.js";
import {DAY_MINUTES,LAST_ADMISSION_MINUTE} from "../dist/js/sim/types.js";
import {GAME_LAST_MINUTE} from "../dist/js/sim/mailCalendar.js";
import {promotionCost,launchPromotion} from "../dist/js/sim/promotion.js";
import {serializeSave,parseImportedSave} from "../dist/js/sim/saveTransfer.js";
import {createPromotionStatusPort} from "../dist/js/application/promotionStatusPort.js";
import {renderPromotionStatus} from "../dist/js/ui/promotionStatusPanel.js";

const money=value=>value.toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
test("preço por modo e saldo disponível são apenas projeções",()=>{
 for(const mode of ["historical","classic"]){
  const state=createGame(9051,mode),before=JSON.stringify(state);
  const port=createPromotionStatusPort(()=>state),view=port.snapshot();
  assert.match(view.description,new RegExp("Custo atual: "+money(promotionCost(state)).replace(/[.*+?^${}()|[\]\\]/g,"\\$&")));
  assert.match(view.status,/Sem panfletagem hoje/);
  assert.equal(view.buttonLabel,"📣 Fazer panfletagem · "+money(promotionCost(state)));
  assert.equal(view.buttonDisabled,false);
  state.cash=promotionCost(state)-0.01;
  assert.equal(port.snapshot().buttonDisabled,true);
  assert.equal(port.snapshot().buttonLabel,view.buttonLabel);
  state.cash=promotionCost(state);
  assert.equal(port.snapshot().buttonDisabled,false);
  assert.notEqual(JSON.stringify(state),before);
 }
});
test("o relógio mantém compra às 20h29, expiração às 20h30 e estado contratado até 22h",()=>{
 const state=createGame(9052,"historical"),port=createPromotionStatusPort(()=>state);
 state.totalMinutes=LAST_ADMISSION_MINUTE-1;
 assert.equal(port.snapshot().buttonDisabled,false);
 assert.equal(launchPromotion(state).ok,true);
 assert.equal(port.snapshot().buttonDisabled,true);
 assert.match(port.snapshot().status,/Restam 1 minutos de entrada/);
 state.totalMinutes=LAST_ADMISSION_MINUTE;
 assert.match(port.snapshot().status,/campanha termina às 22h/);
 assert.equal(port.snapshot().buttonLabel,"✓ Divulgação contratada hoje");
 state.totalMinutes=DAY_MINUTES;
 assert.match(port.snapshot().status,/Sem panfletagem hoje/);
 assert.equal(port.snapshot().buttonDisabled,false);
});
test("sem campanha, após limite de chegada ou fim do calendário, não oferece contratação",()=>{
 const state=createGame(9053,"historical"),port=createPromotionStatusPort(()=>state);
 state.totalMinutes=LAST_ADMISSION_MINUTE;
 assert.match(port.snapshot().status,/Novas entradas encerradas/);
 assert.equal(port.snapshot().buttonLabel,"📣 Panfletagem indisponível após 20h30");
 assert.equal(port.snapshot().buttonDisabled,true);
 state.totalMinutes=GAME_LAST_MINUTE;
 assert.match(port.snapshot().status,/Calendário encerrado/);
 assert.equal(port.snapshot().buttonDisabled,true);
});
test("a projeção acompanha importação de save e não guarda estado anterior",()=>{
 let state=createGame(9054,"historical");
 const port=createPromotionStatusPort(()=>state);
 const old=state,original=JSON.stringify(state);
 state=parseImportedSave(serializeSave(state));
 state.totalMinutes=LAST_ADMISSION_MINUTE;
 assert.equal(port.snapshot().buttonDisabled,true);
 assert.match(port.snapshot().status,/20h30/);
 assert.equal(JSON.stringify(old),original);
 assert.equal(isValidSave(state),true);
});
test("interface preserva nó, foco, ids e eventos existentes sem remontar botão",()=>{
 const button={disabled:false,textContent:"original",listeners:["click"]};
 const dom={querySelector:selector=>selector==="#launch-promotion"?button:null};
 const calls=new Map();
 const state=createGame(9055,"historical"),port=createPromotionStatusPort(()=>state);
 const onText=(id,value)=>calls.set(id,value);
 renderPromotionStatus(port.snapshot(),onText,dom);
 assert.match(calls.get("promotion-description"),/Custo atual/);
 assert.match(calls.get("promotion-status"),/Sem panfletagem/);
 assert.equal(button.disabled,false);
 assert.equal(button.listeners[0],"click");
 state.cash=0;
 renderPromotionStatus(port.snapshot(),onText,dom);
 assert.equal(button.disabled,true);
 assert.equal(button,dom.querySelector("#launch-promotion"));
});
test("fronteiras UI/aplicação e composição no main",()=>{
 const root=new URL("../src/",import.meta.url);
 const app=readFileSync(new URL("application/promotionStatusPort.ts",root),"utf8");
 const ui=readFileSync(new URL("ui/promotionStatusPanel.ts",root),"utf8");
 const main=readFileSync(new URL("main.ts",root),"utf8");
 const sections=readFileSync(new URL("ui/adminFinanceSections.ts",root),"utf8");
 assert.doesNotMatch(app,/\b(document|window|HTMLElement|HTMLButtonElement)\b/);
 assert.doesNotMatch(ui,/from\s*["']\.\.\/sim\//);
 assert.doesNotMatch(ui,/\bGameState\b/);
 assert.doesNotMatch(ui,/replaceChildren|innerHTML|addEventListener/);
 assert.match(main,/createPromotionStatusPort\(\(\)=>game\)/);
 assert.match(main,/renderAdminFinanceActivity\(\{/);
 assert.match(sections,/renderPromotionStatus\(options.promotion.snapshot\(\),options.setText,options.doc\)/);
 assert.match(ui,/promotion-description/);
 assert.match(ui,/promotion-status/);
 assert.match(ui,/#launch-promotion/);
 assert.doesNotMatch(main,/\bpromotionCost\(/);
 assert.doesNotMatch(main,/\bisPromotionActive\(/);
});
