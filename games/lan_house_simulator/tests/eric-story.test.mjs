import test from "node:test";
import assert from "node:assert/strict";
import {createGame,isValidSave} from "../dist/js/sim/engine.js";
import {reviewNotices,readNotice,unreadNotices} from "../dist/js/sim/notices.js";
import {DAY_MINUTES} from "../dist/js/sim/types.js";
import {DAYS_PER_YEAR} from "../dist/js/sim/mailCalendar.js";
import {ERIC_FIRST_MAIL_ID,ericFirstMailDayOfYear} from "../dist/js/sim/ericStory.js";
import {serializeSave,parseImportedSave} from "../dist/js/sim/saveTransfer.js";

const YEAR_START=(2000-1998)*DAYS_PER_YEAR;
const at=(s,dayOfYear)=>{s.totalMinutes=(YEAR_START+dayOfYear-1)*DAY_MINUTES;};
const letters=s=>(s.notices??[]).filter(n=>n.id===ERIC_FIRST_MAIL_ID);

test("Eric escreve uma carta pessoal em janeiro/fevereiro de 2000, sem recompensa",()=>{
 for(const seed of [1,72,1998,72421,0xffffffff]){
  const s=createGame(seed,"historical");
  const when=ericFirstMailDayOfYear(s);
  assert.ok(when>=8&&when<=51);
  const before={cash:s.cash,revenue:s.revenue,expenses:s.expenses,
   reputation:s.reputation,rng:s.rng,licensedGames:s.licensedGames,
   customers:structuredClone(s.customers)};
  at(s,when-1);reviewNotices(s);
  assert.equal(letters(s).length,0);
  at(s,when);reviewNotices(s);reviewNotices(s);
  assert.equal(letters(s).length,1);
  const letter=letters(s)[0];
  assert.match(letter.title,/Eric.*França/);
  assert.match(letter.body,/primo|lan house/i);
  assert.match(letter.body,/time|rede/i);
  assert.equal(letter.severity,"info");
  assert.equal(letter.read,false);
  assert.equal(s.ericFirstMailDelivered,true);
  for(const [key,value] of Object.entries(before))assert.deepEqual(s[key],value,key);
  assert.equal(readNotice(s,ERIC_FIRST_MAIL_ID),true);
  assert.equal(letters(s)[0].read,true);
  assert.equal(isValidSave(s),true);
 }
});

test("registro persiste após salvar, ler e excluir a carta do correio",()=>{
 const s=createGame(1234,"historical");at(s,ericFirstMailDayOfYear(s));
 reviewNotices(s);const count=unreadNotices(s);
 assert.equal(count>=1,true);
 readNotice(s,ERIC_FIRST_MAIL_ID);
 const restored=parseImportedSave(serializeSave(s));
 assert.equal(restored.ericFirstMailDelivered,true);
 assert.equal(letters(restored)[0].read,true);
 restored.notices=restored.notices.filter(n=>n.id!==ERIC_FIRST_MAIL_ID);
 at(restored,60);reviewNotices(restored);
 assert.equal(letters(restored).length,0);
 assert.equal(isValidSave(restored),true);
});

test("save legado reconhece Eric já entregue e não cria duplicatas",()=>{
 const s=createGame(444,"historical");at(s,ericFirstMailDayOfYear(s));
 reviewNotices(s);delete s.ericFirstMailDelivered;
 reviewNotices(s);assert.equal(s.ericFirstMailDelivered,true);
 assert.equal(letters(s).length,1);
 const old=createGame(31,"historical");delete old.ericFirstMailDelivered;
 assert.equal(isValidSave(old),true);
 at(old,ericFirstMailDayOfYear(old));reviewNotices(old);
 assert.equal(letters(old).length,1);
 const invalid=createGame();invalid.ericFirstMailDelivered="sim";
 assert.equal(isValidSave(invalid),false);
});

test("não antecipa o e-mail em 1998/1999 nem reenvia fora do ano 2000",()=>{
 const s=createGame(83,"historical");
 const when=ericFirstMailDayOfYear(s);
 at(s,when);s.totalMinutes-=DAYS_PER_YEAR*DAY_MINUTES;
 reviewNotices(s);assert.equal(letters(s).length,0);
 const future=createGame(83,"historical");
 future.totalMinutes=(2001-1998)*DAYS_PER_YEAR*DAY_MINUTES;
 reviewNotices(future);
 assert.equal(letters(future).length,0);
 assert.notEqual(future.ericFirstMailDelivered,true);
 at(s,when);reviewNotices(s);assert.equal(letters(s).length,1);
 s.notices=[];at(s,60);reviewNotices(s);assert.equal(letters(s).length,0);
});
