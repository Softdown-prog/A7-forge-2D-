import test from "node:test";
import assert from "node:assert/strict";
import {createGame,isValidSave,stepGame,displayTime} from "../dist/js/sim/engine.js";
import {DAY_MINUTES} from "../dist/js/sim/types.js";
import {weekdayIndex,currentCampaignDay} from "../dist/js/sim/campaignWeek.js";
import {firstFridayEligibility,draftFridayMeetup} from "../dist/js/sim/fridayMeetup.js";
import {confirmFridayMeetup,nightSessionCharge} from "../dist/js/sim/nightMeetup.js";
import {licenseGames} from "../dist/js/sim/economy.js";
import {licenseWindows} from "../dist/js/sim/era.js";
import {licenseEraGame,ERIC_MULTIPLAYER_GAME_ID} from "../dist/js/sim/eraGames.js";
import {toggleStationPower} from "../dist/js/sim/stationPower.js";
import {serializeSave,parseImportedSave} from "../dist/js/sim/saveTransfer.js";

function fixture(seats=2){
 const s=createGame(9182,"historical");
 s.totalMinutes=3*360*DAY_MINUTES;
 s.cash=8000;
 s.multiplayerRoundsPlayed=1;
 assert.equal(licenseGames(s).ok,true);
 for(let i=0;i<3;i++){
  assert.equal(toggleStationPower(s,i).ok,true);
  assert.equal(licenseWindows(s,i,"win98").ok,true);
  assert.equal(toggleStationPower(s,i).ok,true);
 }
 assert.equal(licenseEraGame(s,ERIC_MULTIPLAYER_GAME_ID).ok,true);
 const quote=firstFridayEligibility(s);
 assert.equal(quote.ready,true,quote.reasons.join("; "));
 assert.equal(draftFridayMeetup(s,seats).ok,true);
 assert.equal(confirmFridayMeetup(s).ok,true);
 assert.equal(isValidSave(s),true);
 return {s,friday:quote.friday};
}
function reachClosing(s,friday){
 s.totalMinutes=(friday-1)*DAY_MINUTES+DAY_MINUTES-1;
 stepGame(s,1);
 assert.ok(s.nightMeetup,"o turno noturno deve iniciar ANTES da virada normal do dia");
 assert.equal(s.totalMinutes,friday*DAY_MINUTES-1);
 assert.equal(s.nightMeetup.elapsed,1);
 assert.equal(isValidSave(s),true);
}
function saveReload(s){
 const v=parseImportedSave(serializeSave(s));
 assert.equal(isValidSave(v),true,"import de save intermediário da madrugada");
 return v;
}
test("agendamento não cobra; 22h mantém sexta, meia-noite mostra sábado sem adiantar o dia",()=>{
 const {s,friday}=fixture();
 const balance=s.cash,served=s.served;
 assert.equal(s.fridayMeetupDraft.status,"confirmed");
 assert.equal(s.cash,balance);assert.equal(s.served,served);
 reachClosing(s,friday);
 assert.equal(displayTime(s),"22:01");
 stepGame(s,118);
 assert.equal(displayTime(s),"23:59");
 assert.equal(s.totalMinutes,friday*DAY_MINUTES-1);
 stepGame(s,1);
 assert.equal(displayTime(s),"00:00");
 assert.equal(s.nightMeetup.fridayDay,friday);
 assert.equal(weekdayIndex(friday+1),5);
 assert.equal(isValidSave(s),true);
});

test("dois amigos entram, pagam separadamente, sentam e jogam até 7h; sábado reabre 10h",()=>{
 const {s,friday}=fixture(2),starting=s.cash;
 reachClosing(s,friday);
 let paidFirst=0,played=false,shared=false,retail=false;
 let seenAt150=null,stillInNightAtMidnight=false;
 for(let tick=1;tick<=720;tick++){
  if(!s.nightMeetup)break;
  stepGame(s,1);
  const n=s.nightMeetup;
  if(!n)break;
  if(n.paidIds.length>0)paidFirst=Math.max(paidFirst,n.paidIds.length);
  if(n.phase==="playing"){
   played=true;
   if(n.memberIds.length===2){
    const cs=n.memberIds.map(id=>s.customers.find(c=>c.id===id));
    if(cs.every(c=>c?.stage==="using")&&new Set(cs.map(c=>c.pcIndex)).size===2)
     shared=true;
   }
  }
  if(n.retailRevenue>0)retail=true;
  if(n.elapsed===120)stillInNightAtMidnight=true;
  if(n.elapsed===150)seenAt150=saveReload(s);
  if(n.elapsed===540)assert.equal(n.phase,"leaving");
 }
 assert.equal(stillInNightAtMidnight,true);
 assert.ok(paidFirst===2,"ambos devem realmente pagar: "+paidFirst);
 assert.equal(played,true,"a turma deve efetivamente começar");
 assert.equal(shared,true,"PCs distintos em partida sincronizada");
 assert.equal(retail,true,"compra no comércio real durante a madrugada");
 assert.equal(s.nightMeetup,undefined);
 assert.equal(s.totalMinutes,friday*DAY_MINUTES);
 assert.equal(displayTime(s),"10:00");
 assert.equal(s.lastNightMeetup.paid,2);
 assert.ok(s.lastNightMeetup.playedMinutes>300);
 assert.equal(s.lastNightMeetup.revenue,nightSessionCharge(s)*2);
 assert.ok(s.lastNightMeetup.retailRevenue>0);
 assert.equal(isValidSave(s),true);
 assert.ok(seenAt150,"save deve funcionar após a meia-noite");
 assert.ok(s.cash>starting,"as sessões reais geraram receita");
});

test("save e retomada não repetem cobrança nem virada de sábado",()=>{
 const {s,friday}=fixture(2);
 reachClosing(s,friday);
 stepGame(s,210);
 const a=saveReload(s),b=saveReload(s);
 assert.equal(a.nightMeetup.paidIds.length,2,"os dois precisam ter pago antes do save");
 const beforeRevenue=a.revenue,beforeServed=a.served,beforeCash=a.cash;
 stepGame(a,1);stepGame(b,1);
 assert.equal(a.revenue,b.revenue);
 assert.equal(a.cash,b.cash);
 assert.equal(a.served,b.served);
 assert.equal(a.revenue,beforeRevenue);
 assert.equal(a.served,beforeServed);
 assert.equal(a.cash,beforeCash);
 stepGame(a,720);
 stepGame(b,720);
 assert.equal(a.nightMeetup,undefined);
 assert.equal(a.totalMinutes,b.totalMinutes);
 assert.equal(a.cash,b.cash);
 assert.equal(a.revenue,b.revenue);
 assert.equal(a.served,b.served);
 assert.deepEqual(a.lastNightMeetup,b.lastNightMeetup);
 assert.equal(isValidSave(a),true);
});

test("sem PC operacional às 22h, evento cancela sem pagamento ou salto no calendário",()=>{
 const {s,friday}=fixture(3);
 const balance=s.cash,served=s.served;
 s.totalMinutes=friday*DAY_MINUTES-1;
 for(let i=0;i<3;i++)assert.equal(toggleStationPower(s,i).ok,true);
 stepGame(s,1);
 assert.equal(s.nightMeetup,undefined);
 assert.equal(s.fridayMeetupDraft,undefined);
 assert.equal(s.cash,balance);assert.equal(s.served,served);
 assert.equal(s.totalMinutes,friday*DAY_MINUTES);
 assert.equal(isValidSave(s),true);
});
