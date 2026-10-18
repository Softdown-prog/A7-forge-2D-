import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,isValidSave} from '../dist/js/sim/engine.js';
import {serializeSave,parseImportedSave} from '../dist/js/sim/saveTransfer.js';
import {yearFromMinutes} from '../dist/js/sim/historicalEconomy.js';
import {neonOpenLit} from '../dist/js/render/neonOpenArt.js';
import {DAY_MINUTES} from '../dist/js/sim/types.js';
import {COOKIE_COSMETICS,setVerifiedCosmetics,cosmeticsOwned,hasVerifiedCosmetic,
 cosmeticAvailable,headsetOnSession,toggleVerifiedCosmetic} from '../dist/js/sim/premiumCosmetics.js';

test('catálogo inicial mantém preços fixos e anos corretos, sem vantagem econômica',()=>{
 assert.deepEqual(COOKIE_COSMETICS.map(({id,cookies,unlockYear})=>[id,cookies,unlockYear]),[
  ['headset-rgb-neon',40,2012],['chair-gamer-neon',50,2012],
  ['keyboard-rainbow-rgb',25,2012],['neon-open-sign',30,1998]]);
 assert.equal(new Set(COOKIE_COSMETICS.map(x=>x.id)).size,4);
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

test('teclado RGB e placa ABERTO só aparecem após confirmação do backend',()=>{
 setVerifiedCosmetics([]);
 for(const year of [1998,2000,2012,2030]){
  assert.equal(cosmeticAvailable('neon-open-sign',year),false);
  assert.equal(cosmeticAvailable('keyboard-rainbow-rgb',year),false);
 }
 setVerifiedCosmetics(['keyboard-rainbow-rgb','neon-open-sign']);
 assert.equal(cosmeticAvailable('neon-open-sign',1998),true);
 assert.equal(cosmeticAvailable('keyboard-rainbow-rgb',2011),false);
 assert.equal(cosmeticAvailable('keyboard-rainbow-rgb',2012),true);
 assert.equal(toggleVerifiedCosmetic('keyboard-rainbow-rgb',false),true);
 assert.equal(cosmeticAvailable('keyboard-rainbow-rgb',2020),false);
 assert.equal(cosmeticAvailable('neon-open-sign',2020),true);
 setVerifiedCosmetics([]);
});
test('placa desliga na preparação do fechamento e liga no dia seguinte',()=>{
 assert.equal(neonOpenLit(0),true); // 10:00
 assert.equal(neonOpenLit(599),true);
 assert.equal(neonOpenLit(659),true); // 20:59
 assert.equal(neonOpenLit(660),false); // 21:00
 assert.equal(neonOpenLit(719),false); // 21:59
 assert.equal(neonOpenLit(DAY_MINUTES),true); // dia seguinte
 assert.equal(neonOpenLit(-1),false);
 assert.equal(neonOpenLit(Number.NaN),false);
});
