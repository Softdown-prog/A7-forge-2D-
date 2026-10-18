import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,isValidSave} from '../dist/js/sim/engine.js';
import {serializeSave,parseImportedSave} from '../dist/js/sim/saveTransfer.js';
import {yearFromMinutes} from '../dist/js/sim/historicalEconomy.js';
import {COOKIE_COSMETICS,setVerifiedCosmetics,cosmeticsOwned,hasVerifiedCosmetic,
 cosmeticAvailable,headsetOnSession,toggleVerifiedCosmetic} from '../dist/js/sim/premiumCosmetics.js';

test('catálogo inicial preserva os preços Cookies 40 + 50 e início 2012',()=>{
 assert.deepEqual(COOKIE_COSMETICS.map(({id,cookies,unlockYear})=>[id,cookies,unlockYear]),[
  ['headset-rgb-neon',40,2012],['chair-gamer-neon',50,2012]]);
 assert.equal(new Set(COOKIE_COSMETICS.map(x=>x.id)).size,2);
});
test('o save não concede propriedade premium, mesmo com IDs injetados',()=>{
 setVerifiedCosmetics([]);
 const s=createGame(123,'historical');
 assert.equal(isValidSave(s),true);
 assert.equal(cosmeticAvailable('chair-gamer-neon',2030),false);
 assert.deepEqual(cosmeticsOwned(),[]);
 const imported=parseImportedSave(serializeSave(s));
 assert.equal(isValidSave(imported),true);
 assert.equal(hasVerifiedCosmetic('headset-rgb-neon'),false);
 // Simulação de compra só por arquivo de save não cria direito verificado.
 const tamper={...imported,cookiesBalance:2000,premiumItems:['chair-gamer-neon']};
 assert.equal(hasVerifiedCosmetic('chair-gamer-neon'),false);
 assert.equal(tamper.cash,imported.cash);
});
test('a conta autenticada governa entitlement e logout revoga instantaneamente',()=>{
 setVerifiedCosmetics(['unknown','chair-gamer-neon']);
 assert.deepEqual(cosmeticsOwned(),['chair-gamer-neon']);
 assert.equal(cosmeticAvailable('chair-gamer-neon',2011),false);
 assert.equal(cosmeticAvailable('chair-gamer-neon',2012),true);
 assert.equal(toggleVerifiedCosmetic('headset-rgb-neon',true),false);
 assert.equal(toggleVerifiedCosmetic('chair-gamer-neon',false),true);
 assert.equal(hasVerifiedCosmetic('chair-gamer-neon'),false);
 assert.equal(toggleVerifiedCosmetic('chair-gamer-neon',true),true);
 assert.equal(hasVerifiedCosmetic('chair-gamer-neon'),true);
 setVerifiedCosmetics([]);
 assert.equal(hasVerifiedCosmetic('chair-gamer-neon'),false);
});
test('fone aparece em aproximadamente 48% das visitas, mas fica estável durante a sessão',()=>{
 let total=0;for(let id=1;id<=2000;id++){
  const selected=headsetOnSession(id,0);
  total+=Number(selected);
  assert.equal(headsetOnSession(id,0),selected);
 }
 assert.ok(total>=820&&total<=1110,'taxa observada fora de 41%-55%: '+total);
 assert.equal(headsetOnSession(-1,0),false);
 assert.equal(headsetOnSession(1,-1),false);
 assert.equal(headsetOnSession(Number.NaN,0),false);
});
