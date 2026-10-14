import assert from "node:assert/strict";
import test from "node:test";
import { createGame, stepGame, visitorArrivalChance, isValidSave } from "../dist/js/sim/engine.js";
import { serializeSave, parseImportedSave } from "../dist/js/sim/saveTransfer.js";
import { PROMOTION_COST, launchPromotion, isPromotionActive, promotionVisitorMultiplier, promotionMinutesRemaining } from "../dist/js/sim/promotion.js";

test("panfletagem debita uma vez, sem criar receitas nem atendimentos",()=>{
  const s=createGame();
  const before={cash:s.cash,revenue:s.revenue,expenses:s.expenses,served:s.served,purchases:s.purchases};
  assert.equal(launchPromotion(s).ok,true);
  assert.equal(s.cash,before.cash-PROMOTION_COST);
  assert.equal(s.expenses,before.expenses+PROMOTION_COST);
  assert.equal(s.revenue,before.revenue);
  assert.equal(s.served,before.served);
  assert.equal(s.purchases,before.purchases);
  assert.equal(launchPromotion(s).ok,false);
  assert.equal(s.cash,before.cash-PROMOTION_COST);
  assert.equal(isPromotionActive(s),true);
  assert.equal(promotionMinutesRemaining(s),720);
});

test("divulgação aumenta somente a probabilidade de chegada, mantendo congestionamento",()=>{
  const normal=createGame(7);
  const promoted=createGame(7);
  launchPromotion(promoted);
  assert.equal(promotionVisitorMultiplier(normal),1);
  assert.equal(promotionVisitorMultiplier(promoted),1.4);
  assert.ok(Math.abs(visitorArrivalChance(promoted,0)/visitorArrivalChance(normal,0)-1.4)<1e-10);
  assert.ok(visitorArrivalChance(promoted,3)<visitorArrivalChance(promoted,0));
  assert.equal(normal.rng,promoted.rng,"contratar não deve consumir sorteios da simulação");
});

test("a campanha expira no fechamento, permite nova compra e preserva partidas legadas",()=>{
  const s=createGame(9);
  launchPromotion(s);
  for(let i=0;i<6;i++) stepGame(s,120);
  assert.equal(s.totalMinutes,720);
  assert.equal(isPromotionActive(s),false);
  assert.equal(promotionVisitorMultiplier(s),1);
  assert.equal(promotionMinutesRemaining(s),0);
  s.cash=500;
  assert.equal(launchPromotion(s).ok,true);
  assert.equal(s.promotionDay,2);
  const imported=parseImportedSave(serializeSave(s));
  assert.equal(isPromotionActive(imported),true);
  const legacy=createGame();
  assert.equal(legacy.promotionDay,undefined);
  assert.equal(isValidSave(legacy),true);
  assert.equal(isPromotionActive(parseImportedSave(serializeSave(legacy))),false);
});

test("promoção respeita caixa e rejeita dia inválido em save importado",()=>{
  const s=createGame();
  s.cash=PROMOTION_COST-1;
  const originalExpenses=s.expenses;
  assert.equal(launchPromotion(s).ok,false);
  assert.equal(s.expenses,originalExpenses);
  assert.equal(s.promotionDay,undefined);
  const bad=createGame();
  bad.promotionDay=999;
  assert.equal(isValidSave(bad),false);
  const wrapper=JSON.parse(serializeSave(createGame()));
  wrapper.state.promotionDay="amanhã";
  assert.throws(()=>parseImportedSave(JSON.stringify(wrapper)),/inválid/);
});
