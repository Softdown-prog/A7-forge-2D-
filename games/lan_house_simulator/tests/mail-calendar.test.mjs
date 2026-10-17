import test from "node:test";
import assert from "node:assert/strict";
import {createGame,stepGame,isValidSave} from "../dist/js/sim/engine.js";
import {DAY_MINUTES} from "../dist/js/sim/types.js";
import {gameYear} from "../dist/js/sim/era.js";
import {yearFromMinutes} from "../dist/js/sim/historicalEconomy.js";
import {reviewNotices} from "../dist/js/sim/notices.js";
import {scheduleDecisions,chooseDecision,decisionOptions} from "../dist/js/sim/decisions.js";
import {parseImportedSave,serializeSave} from "../dist/js/sim/saveTransfer.js";
import {SPORADIC_MAIL_IDS,sporadicMailSchedule,sporadicMailDue,
 additionalMailSchedule,fixedYearMailDue,fixedYearMailWindowDue,recordMailDelivery,GAME_END_DAY,GAME_LAST_MINUTE,GAME_LAST_YEAR
} from "../dist/js/sim/mailCalendar.js";

import {STORY_IDS} from "../dist/js/sim/storyEvents.js";

const at=(s,day)=>{s.totalMinutes=(day-1)*DAY_MINUTES;};
test("oito cartas únicas são sorteadas e distribuídas pelos anos de 1998 a 2030",()=>{
 for(const seed of [1,23,72421,123456,987654]){
  const s=createGame(seed);
  const snapshot=s.rng,calendar=sporadicMailSchedule(s);
  assert.equal(s.rng,snapshot,"o RNG dos clientes não pode mudar");
  assert.deepEqual(Object.keys(calendar).sort(),[...SPORADIC_MAIL_IDS].sort());
  const days=Object.values(calendar).sort((a,b)=>a-b);
  assert.equal(days.length,8);
  assert.ok(days[0]>90,"nenhuma avalanche nos primeiros dias");
  assert.ok(days.every(d=>d>=1&&d<=GAME_END_DAY));
  for(let i=1;i<days.length;i++)assert.ok(days[i]-days[i-1]>=360,
   "intervalo esporádico deve atravessar ao menos um ano");
  assert.ok(new Set(days.map(d=>1998+Math.floor((d-1)/360))).size>=7);
 }
});
test("correio não entrega cartas e nem multas nos primeiros 60 dias",()=>{
 const s=createGame();
 for(let d=1;d<=60;d++){at(s,d);reviewNotices(s);scheduleDecisions(s);}
 assert.deepEqual(s.notices??[],[]);
 assert.equal(s.windowsNoticeFine,undefined);
 assert.equal(s.copyrightNoticeFine,undefined);
});
test("cada campanha respeita seus próprios sorteios e grava o histórico de entrega",()=>{
 const s=createGame(23);s.cash=100000;s.pcWear=[42,40,35];
 const initialRng=s.rng;
 for(let day=1;day<=GAME_END_DAY;day++){
  at(s,day);
  reviewNotices(s);scheduleDecisions(s);
  for(const letter of s.notices??[]){
   if(letter.resolved)continue;
   if(!SPORADIC_MAIL_IDS.includes(letter.id))continue;
   const options=decisionOptions(letter.id,s);
   if(options.length&&letter.id!=="electrical-inspection")
    assert.equal(chooseDecision(s,letter.id,options.at(-1).id).ok,true);
  }
 }
 const mailed=(s.notices??[]).filter(n=>SPORADIC_MAIL_IDS.includes(n.id));
 assert.equal(mailed.length,SPORADIC_MAIL_IDS.length);
 assert.equal(new Set(mailed.map(n=>n.id)).size,mailed.length);
 assert.ok(new Set(mailed.map(n=>1998+Math.floor((n.day-1)/360))).size>=7);
 assert.deepEqual(new Set(s.mailSeenIds),new Set(SPORADIC_MAIL_IDS));
 assert.equal(s.rng,initialRng);
 const serialized=parseImportedSave(serializeSave(s));
 assert.deepEqual(serialized.mailSeenIds,s.mailSeenIds);
 serialized.notices=[];at(serialized,GAME_END_DAY);
 reviewNotices(serialized);scheduleDecisions(serialized);
 assert.equal(serialized.notices.length,0,"cartas apagadas não podem voltar após reload");
});
test("partidas antigas criam calendário a partir do momento da migração, sem lote retroativo",()=>{
 const s=createGame(137);
 delete s.mailScheduleSeed;delete s.mailStartDay;delete s.mailSeenIds;
 at(s,(2009-1998)*360+80);
 s.notices=[{id:"safety",title:"Proteção",body:"Aviso antigo",day:2,read:true,severity:"info"}];
 const rng=s.rng;
 reviewNotices(s);scheduleDecisions(s);
 assert.equal(s.notices.length,1);
 assert.equal(s.mailStartDay,(2009-1998)*360+80);
 assert.equal(s.mailScheduleSeed,rng);
 assert.ok(s.mailSeenIds.includes("safety"));
 assert.ok(Object.values(sporadicMailSchedule(s)).every(day=>day>s.mailStartDay));
 s.notices=[];at(s,s.mailStartDay+30);reviewNotices(s);scheduleDecisions(s);
 assert.equal(s.notices.length,0);
 assert.equal(isValidSave(s),true);
});
test("eventos futuros com ano fixo só podem disparar no ano e dia programados",()=>{
 const s=createGame();
 at(s,(2005-1998)*360+70);
 assert.equal(fixedYearMailDue(s,2005,70),true);
 assert.equal(fixedYearMailDue(s,2004,70),false);
 assert.equal(fixedYearMailDue(s,2006,70),false);
 assert.equal(fixedYearMailDue(s,2005,71),false);
 assert.equal(fixedYearMailDue(s,2031,70),false);
});
test("campanha para em 2030 sem gerar o ano 2031, cobranças ou RNG adicionais",()=>{
 const s=createGame();s.totalMinutes=GAME_LAST_MINUTE-3;
 const before=s.rng;
 stepGame(s,110);
 assert.equal(s.totalMinutes,GAME_LAST_MINUTE);
 assert.equal(gameYear(s),2030);
 assert.equal(yearFromMinutes(s.totalMinutes),2030);
 const cash=s.cash,revenue=s.revenue,expenses=s.expenses,rng=s.rng,energy=s.energyAccrued;
 stepGame(s,120);stepGame(s,120);
 assert.equal(s.totalMinutes,GAME_LAST_MINUTE);
 assert.equal(s.cash,cash);assert.equal(s.revenue,revenue);
 assert.equal(s.expenses,expenses);assert.equal(s.rng,rng);
 assert.equal(s.energyAccrued,energy);
 assert.equal(s.leftoverMinutes,0);
 assert.ok(rng!==before || Number.isInteger(rng));
 assert.equal(GAME_LAST_YEAR,2030);
});
test("salvamento antigo após 2030 importa no limite sem apagar caixa e bens",()=>{
 const s=createGame();s.cash=5200;s.totalMinutes=40*360*DAY_MINUTES;
 const restored=parseImportedSave(serializeSave(s));
 assert.equal(restored.totalMinutes,GAME_LAST_MINUTE);
 assert.equal(restored.cash,5200);
 assert.equal(gameYear(restored),2030);
 assert.equal(isValidSave(restored),true);
 const malformed=createGame();malformed.mailSeenIds=["games","games"];
 assert.equal(isValidSave(malformed),false);
 const missing=createGame();delete missing.mailSeenIds;delete missing.mailStartDay;delete missing.mailScheduleSeed;
 assert.equal(isValidSave(missing),true);
});


test("doze histórias esporádicas, eventos de 2004/2005 e oito cartas preservam o calendário",()=>{
 for(const seed of [1,23,72421,123456,987654,0xffffffff]){
  const s=createGame(seed);s.cash=100000;s.pcWear=[45,45,45];
  const rng=s.rng,stories=additionalMailSchedule(s,STORY_IDS.filter(id=>id!=="school-uniform-policy"&&id!=="gpu-games-2005"));
  assert.equal(Object.keys(stories).length,12);
  const dates=[...Object.values(sporadicMailSchedule(s)),...Object.values(stories)].sort((a,b)=>a-b);
  assert.equal(dates.length,20);
  for(let i=1;i<dates.length;i++)assert.ok(dates[i]-dates[i-1]>=360);
  const firstLetters=new Set();
  for(let d=1;d<=GAME_END_DAY;d++){
   at(s,d);reviewNotices(s);scheduleDecisions(s);
   for(const n of [...s.notices??[]]){
    if(STORY_IDS.includes(n.id)||SPORADIC_MAIL_IDS.includes(n.id))firstLetters.add(n.id);
    if(n.resolved)continue;
    const options=decisionOptions(n.id,s);
    if(options.length)assert.equal(chooseDecision(s,n.id,options.at(-1).id).ok,true,n.id);
   }
  }
  assert.equal(firstLetters.size,22);
  assert.equal(s.storySeenIds.length,14);
  assert.equal(s.storyRecords.length,18);
  assert.ok(s.storyRecords.every(r=>r.stage==="done"));
  assert.equal(s.rng,rng);
  assert.equal(isValidSave(parseImportedSave(serializeSave(s))),true);
 }
});

test("alerta do Bug do Milênio aparece em dezembro de 1999 e não volta em 2000",()=>{
 const s=createGame(72421),cash=s.cash,rng=s.rng;
 const first=(1999-1998)*360+331;
 at(s,first-1);reviewNotices(s);
 assert.ok(!(s.notices??[]).some(n=>n.id==="y2k-warning"),"não aparecer em novembro");
 at(s,first);reviewNotices(s);reviewNotices(s);
 const letters=s.notices.filter(n=>n.id==="y2k-warning");
 assert.equal(letters.length,1);
 assert.equal(letters[0].read,false);
 assert.equal(letters[0].severity,"info");
 assert.match(letters[0].title,/Bug do Milênio/);
 assert.match(letters[0].body,/2000|1900/);
 assert.match(letters[0].body,/formata/i);
 assert.match(letters[0].body,/desocupada e desligada/);
 assert.equal(s.y2kNoticeDelivered,true);
 assert.equal(s.cash,cash,"o lembrete não cobra nada");
 assert.equal(s.rng,rng,"o lembrete não consome RNG dos clientes");
 const restored=parseImportedSave(serializeSave(s));
 assert.equal(isValidSave(restored),true);
 assert.equal(restored.y2kNoticeDelivered,true);
 restored.notices=[];at(restored,(2000-1998)*360+1);reviewNotices(restored);
 assert.ok(!restored.notices.some(n=>n.id==="y2k-warning"),"não reaparecer em 2000");
});
test("evento histórico permite receber a carta ao retomar no meio de dezembro",()=>{
 const delayed=createGame(23);at(delayed,(1999-1998)*360+337);
 assert.equal(fixedYearMailWindowDue(delayed,1999,331,350),true);
 reviewNotices(delayed);
 assert.equal(delayed.notices.filter(n=>n.id==="y2k-warning").length,1);
 const late=createGame(24);at(late,(1999-1998)*360+351);
 reviewNotices(late);assert.ok(!(late.notices??[]).some(n=>n.id==="y2k-warning"));
 const after=createGame(25);at(after,(2000-1998)*360+1);
 reviewNotices(after);assert.ok(!(after.notices??[]).some(n=>n.id==="y2k-warning"));
 for(const wrong of [1998,2000,2031])assert.equal(fixedYearMailWindowDue(delayed,wrong,331,350),false);
 assert.equal(fixedYearMailWindowDue(delayed,1999,350,331),false);
 assert.equal(fixedYearMailWindowDue(delayed,1999,0,331),false);
 assert.equal(fixedYearMailWindowDue(delayed,1999,331,361),false);
});
test("aviso é único, mesmo após limpeza da caixa ou importação de save antigo",()=>{
 const s=createGame(77);at(s,(1999-1998)*360+334);
 reviewNotices(s);assert.equal(s.y2kNoticeDelivered,true);
 s.notices=[];reviewNotices(s);
 assert.ok(!s.notices.some(n=>n.id==="y2k-warning"));
 assert.equal(isValidSave(s),true);
 const old=createGame(78);at(old,(1999-1998)*360+332);
 old.notices=[{id:"y2k-warning",title:"Aviso antigo",body:"Bug do Milênio",day:(1999-1998)*360+331,read:true,severity:"info"}];
 reviewNotices(old);
 assert.equal(old.notices.filter(n=>n.id==="y2k-warning").length,1);
 assert.equal(old.y2kNoticeDelivered,true);
 const corrupt=createGame(79);corrupt.y2kNoticeDelivered="sim";
 assert.equal(isValidSave(corrupt),false);
});
