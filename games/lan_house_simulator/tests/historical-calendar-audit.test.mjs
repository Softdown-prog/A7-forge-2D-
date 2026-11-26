import assert from "node:assert/strict";
import test from "node:test";
import {createGame,stepGame} from "../dist/js/sim/engine.js";
import {setHourlyPrice} from "../dist/js/sim/economy.js";
import {gameYear} from "../dist/js/sim/era.js";
import {allowableHourlyPrice} from "../dist/js/sim/historicalEconomy.js";
import {DAYS_PER_YEAR,GAME_FIRST_YEAR,GAME_LAST_MINUTE,GAME_LAST_YEAR} from "../dist/js/sim/mailCalendar.js";
import {parseImportedSave,serializeSave} from "../dist/js/sim/saveTransfer.js";
import {DAY_MINUTES} from "../dist/js/sim/types.js";

const DAYS_PER_MONTH=30;

test("fechamentos anuais do calendário histórico",
 {skip:process.env.LHS_TIMELINE_AUDIT!=="1"},async audit=>{
 for(let year=GAME_FIRST_YEAR;year<=GAME_LAST_YEAR;year++){
  await audit.test(String(year),()=>{
    const state=createGame(23,"historical");
    const endingDay=(year-GAME_FIRST_YEAR+1)*DAYS_PER_YEAR;
    const isCampaignEnd=year===GAME_LAST_YEAR;
    state.totalMinutes=(endingDay-DAYS_PER_MONTH)*DAY_MINUTES;
    const startingCash=state.cash;
    const price=Math.min(state.pricePerHour,allowableHourlyPrice(state));
    assert.equal(setHourlyPrice(state,price).ok,true);
    assert.equal(gameYear(state),year);

    // Cada amostra começa em 1º de dezembro e percorre o mês pelo motor.
    for(let minute=0;minute<DAYS_PER_MONTH*DAY_MINUTES;minute+=120)stepGame(state,120);
    assert.equal(state.totalMinutes,isCampaignEnd?GAME_LAST_MINUTE:endingDay*DAY_MINUTES);
    assert.equal(gameYear(state),isCampaignEnd?year:year+1);
    assert.ok(Math.abs(state.cash-(startingCash+state.revenue-state.expenses))<.001);
    assert.ok(state.pricePerHour<=allowableHourlyPrice(state));
    if(!isCampaignEnd)assert.equal(state.lastPaidMonthlyBill?.endDay,endingDay);

    const recovered=parseImportedSave(serializeSave(state));
    for(const key of ["cash","revenue","expenses","rng","totalMinutes","served","pricePerHour"])
     assert.equal(recovered[key],state[key],key);
    assert.deepEqual(recovered.lastPaidMonthlyBill,state.lastPaidMonthlyBill);
    assert.deepEqual(recovered.stationLedger,state.stationLedger);

    if(isCampaignEnd){
     const atEnd=structuredClone(recovered);
     stepGame(recovered,120);
     assert.deepEqual(recovered,atEnd,"a simulação permanece encerrada após 2030");
    }
  });
 }
});
