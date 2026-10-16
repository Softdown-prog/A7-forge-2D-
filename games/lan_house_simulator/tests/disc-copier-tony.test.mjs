import test from "node:test";
import assert from "node:assert/strict";
import {createGame,isValidSave} from "../dist/js/sim/engine.js";
import {buyDiscCopier,serveDiscCopy,copyingAnimationActive,DISC_COPIER_COST} from "../dist/js/sim/discCopy.js";
import {buyPrinter,servePrinting,printingAnimationActive} from "../dist/js/sim/printService.js";
import {DAY_MINUTES} from "../dist/js/sim/types.js";
import {editableObjects} from "../dist/js/sim/editableObjects.js";
import {serializeSave,parseImportedSave} from "../dist/js/sim/saveTransfer.js";

const after2001=()=>{const s=createGame(26,"historical");s.totalMinutes=3*360*DAY_MINUTES;s.cash=4000;return s;};
test("copiadora aparece somente com compra histórica de R$ 900, sem novo objeto ou colisão",()=>{
 const s=createGame(21,"historical"),before=JSON.stringify(editableObjects(s));
 s.cash=4000;assert.equal(buyDiscCopier(s).ok,false,"bloqueada até 2001");
 assert.equal(copyingAnimationActive(s),false);
 s.totalMinutes=3*360*DAY_MINUTES;
 const cash=s.cash,expenses=s.expenses;
 assert.equal(buyDiscCopier(s).ok,true);
 assert.equal(s.cash,cash-DISC_COPIER_COST);assert.equal(s.expenses,expenses+DISC_COPIER_COST);
 assert.equal(JSON.stringify(editableObjects(s)),before);
 assert.equal(copyingAnimationActive(s),false,"compra não simula cópia");
 assert.equal(buyDiscCopier(s).ok,false);
});
test("Tony só usa a copiadora após venda concreta e animação cessa em oito minutos",()=>{
 const s=after2001();buyDiscCopier(s);
 const minute=s.totalMinutes;const rng=s.rng;
 assert.equal(copyingAnimationActive(s),false);
 const sale=serveDiscCopy(s,{id:15,stage:"waiting",serviceRequest:"disc-copy",wallet:40});
 assert.ok(sale,"cliente avulso deve pagar pela mídia");
 assert.equal(s.discCopier.lastCopiedMinute,minute);
 assert.equal(copyingAnimationActive(s),true);
 assert.equal(s.rng,rng);
 const amounts=[s.cash,s.revenue,s.expenses];
 s.totalMinutes=minute+8;assert.equal(copyingAnimationActive(s),true);
 s.totalMinutes=minute+9;assert.equal(copyingAnimationActive(s),false);
 assert.deepEqual([s.cash,s.revenue,s.expenses],amounts,"animação não gera renda passiva");
});
test("momento da cópia persiste; saves anteriores continuam válidos e corrupção falha",()=>{
 const s=after2001();buyDiscCopier(s);
 const old=parseImportedSave(serializeSave(s));
 assert.equal(old.discCopier.lastCopiedMinute,undefined);
 assert.equal(isValidSave(old),true);
 const minute=s.totalMinutes;
 assert.ok(serveDiscCopy(s,{id:15,stage:"waiting",serviceRequest:"disc-copy",wallet:40}));
 assert.equal(isValidSave(s),true);
 const recovered=parseImportedSave(serializeSave(s));
 assert.equal(recovered.discCopier.lastCopiedMinute,minute);
 assert.equal(copyingAnimationActive(recovered),true);
 for(const broken of [-1,1.5,NaN,minute+1,Infinity]){
  const bad=structuredClone(s);bad.discCopier.lastCopiedMinute=broken;
  assert.equal(isValidSave(bad),false);
 }
});
test("impressora e copiadora coexistem com animações independentes e estado monetário intacto",()=>{
 const s=after2001();buyDiscCopier(s);buyPrinter(s);
 const minute=s.totalMinutes;
 assert.equal(copyingAnimationActive(s),false);
 assert.equal(printingAnimationActive(s),false);
 assert.ok(serveDiscCopy(s,{id:15,stage:"waiting",serviceRequest:"disc-copy",wallet:40}));
 assert.equal(copyingAnimationActive(s),true);
 assert.equal(printingAnimationActive(s),false);
 s.totalMinutes+=2;
 assert.ok(servePrinting(s,{id:4,stage:"waiting",serviceRequest:"printing",wallet:40}));
 assert.equal(copyingAnimationActive(s),true);
 assert.equal(printingAnimationActive(s),true);
 const amounts=[s.cash,s.revenue,s.expenses];
 s.totalMinutes=minute+9;
 assert.equal(copyingAnimationActive(s),false);
 assert.equal(printingAnimationActive(s),true);
 assert.deepEqual([s.cash,s.revenue,s.expenses],amounts);
 assert.equal(isValidSave(parseImportedSave(serializeSave(s))),true);
});
