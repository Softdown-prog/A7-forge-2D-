import assert from "node:assert/strict";
import test from "node:test";
import { createGame, stepGame, visitorArrivalChance, isValidSave, LAST_ADMISSION_MINUTE } from "../dist/js/sim/engine.js";
import { DAY_MINUTES } from "../dist/js/sim/types.js";
import { GAME_LAST_MINUTE } from "../dist/js/sim/mailCalendar.js";
import { serializeSave, parseImportedSave } from "../dist/js/sim/saveTransfer.js";
import { PROMOTION_COST, promotionCost, launchPromotion, isPromotionActive, promotionVisitorMultiplier, promotionMinutesRemaining, promotionCanAttractVisitors, promotionAdmissionMinutesRemaining } from "../dist/js/sim/promotion.js";

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

test("20h29 ainda permite contratar e dura só até o encerramento das entradas",()=>{
  for(const mode of ["classic","historical"]){
    const s=createGame(13,mode);
    s.totalMinutes=LAST_ADMISSION_MINUTE-1;
    const initialCash=s.cash,cost=promotionCost(s);
    assert.equal(promotionCanAttractVisitors(s),true);
    assert.equal(launchPromotion(s).ok,true,mode);
    assert.equal(s.cash,initialCash-cost);
    assert.equal(promotionAdmissionMinutesRemaining(s),1);
    assert.equal(promotionVisitorMultiplier(s),1.4);
    const recovered=parseImportedSave(serializeSave(s));
    assert.equal(promotionAdmissionMinutesRemaining(recovered),1);
    stepGame(s,1);
    assert.equal(isPromotionActive(s),true,"a contratação permanece registrada até 22h");
    assert.equal(promotionAdmissionMinutesRemaining(s),0);
    assert.equal(promotionVisitorMultiplier(s),1,"sem efeitos após o fim das entradas");
    assert.equal(visitorArrivalChance(s,0),0);
    assert.equal(launchPromotion(s).ok,false);
    assert.equal(s.cash,initialCash-cost);
  }
});

test("20h30, 21h59 e fim do calendário rejeitam panfletagem sem cobrar",()=>{
  for(const mode of ["classic","historical"]){
    for(const minute of [LAST_ADMISSION_MINUTE,LAST_ADMISSION_MINUTE+1,DAY_MINUTES-1,
                         DAY_MINUTES+LAST_ADMISSION_MINUTE,GAME_LAST_MINUTE]){
      const s=createGame(17,mode);
      s.totalMinutes=minute;
      s.cash=10000;
      const before={cash:s.cash,expenses:s.expenses,revenue:s.revenue,
        rng:s.rng,promotionDay:s.promotionDay,customers:s.customers.length};
      const result=launchPromotion(s);
      assert.equal(result.ok,false,mode+" minuto="+minute);
      assert.deepEqual({cash:s.cash,expenses:s.expenses,revenue:s.revenue,
        rng:s.rng,promotionDay:s.promotionDay,customers:s.customers.length},before);
      assert.equal(promotionCanAttractVisitors(s),false);
    }
  }
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
