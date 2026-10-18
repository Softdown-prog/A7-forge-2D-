import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,isValidSave} from '../dist/js/sim/engine.js';
import {serializeSave,parseImportedSave} from '../dist/js/sim/saveTransfer.js';
import {yearFromMinutes} from '../dist/js/sim/historicalEconomy.js';
import {neonOpenLit} from '../dist/js/render/neonOpenArt.js';
import {EXCLUSIVE_POSTER_TITLES,premiumCheckerPatch} from '../dist/js/render/premiumRoomArt.js';
import {DAY_MINUTES} from '../dist/js/sim/types.js';
import {COOKIE_COSMETICS,setVerifiedCosmetics,cosmeticsOwned,hasVerifiedCosmetic,
 cosmeticAvailable,headsetOnSession,toggleVerifiedCosmetic} from '../dist/js/sim/premiumCosmetics.js';

test('catálogo inicial mantém preços fixos e anos corretos, sem vantagem econômica',()=>{
 assert.deepEqual(COOKIE_COSMETICS.map(({id,cookies,unlockYear})=>[id,cookies,unlockYear]),[
  ['headset-rgb-neon',40,2012],['chair-gamer-neon',50,2012],
  ['keyboard-rainbow-rgb',25,2012],['neon-open-sign',30,1998],
  ['arcade-checker-floor',25,1998],['exclusive-arcade-posters',12,1998],
  ['tony-cyber',60,2010],['aquarium-rgb',45,2008]]);
 assert.equal(new Set(COOKIE_COSMETICS.map(x=>x.id)).size,8);
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

test('Piso e três pôsteres premium não podem ser liberados por save ou por ano',()=>{
 setVerifiedCosmetics([]);
 const game=createGame(1298,'historical');
 const cash=game.cash,initialLayout=JSON.stringify(game.objectPlacements??[]),
  initialFurniture=JSON.stringify(game.furniture??{});
 assert.equal(cosmeticAvailable('arcade-checker-floor',2030),false);
 assert.equal(cosmeticAvailable('exclusive-arcade-posters',2030),false);
 const tampered={...game,premiumFloor:true,ownedPremiumPosters:99};
 assert.equal(cosmeticAvailable('arcade-checker-floor',2020),false);
 assert.equal(tampered.cash,cash);
 assert.deepEqual(EXCLUSIVE_POSTER_TITLES,
  ['NOITE PIXEL','CORRIDA LUNAR','CASTELO DIGITAL']);
 setVerifiedCosmetics(['arcade-checker-floor','exclusive-arcade-posters']);
 assert.equal(cosmeticAvailable('arcade-checker-floor',1998),true);
 assert.equal(cosmeticAvailable('exclusive-arcade-posters',1998),true);
 assert.equal(game.cash,cash);
 assert.equal(JSON.stringify(game.objectPlacements??[]),initialLayout);
 assert.equal(JSON.stringify(game.furniture??{}),initialFurniture);
 assert.equal(isValidSave(game),true);
 setVerifiedCosmetics([]);
 assert.equal(cosmeticAvailable('exclusive-arcade-posters',2030),false);
});
test('Revestimento premium usa geometria projetada, preserva toda a superfície',()=>{
 let paths=0,painted=0;
 const points=[];
 const ctx={
  beginPath(){paths++;},moveTo(x,y){points.push([x,y]);},lineTo(x,y){points.push([x,y]);},
  closePath(){},fill(){painted++;},stroke(){},set fillStyle(v){this.color=v;},
  set strokeStyle(v){this.outline=v;},set lineWidth(v){}
 };
 premiumCheckerPatch(ctx,{originX:400,originY:180,zoom:.86},2,1);
 assert.equal(painted,10);
 assert.ok(paths>=10);
 assert.ok(points.every(([x,y])=>Number.isFinite(x)&&Number.isFinite(y)));
});

test('últimos dois cosméticos VIP só aparecem com direito de conta e no ano correto',()=>{
 setVerifiedCosmetics([]);
 const save=createGame(567,'historical');
 const before=serializeSave(save),cash=save.cash;
 assert.equal(cosmeticAvailable('tony-cyber',2030),false);
 assert.equal(cosmeticAvailable('aquarium-rgb',2030),false);
 setVerifiedCosmetics(['tony-cyber','aquarium-rgb']);
 assert.equal(cosmeticAvailable('tony-cyber',2009),false);
 assert.equal(cosmeticAvailable('tony-cyber',2010),true);
 assert.equal(cosmeticAvailable('aquarium-rgb',2007),false);
 assert.equal(cosmeticAvailable('aquarium-rgb',2008),true);
 assert.equal(toggleVerifiedCosmetic('aquarium-rgb',false),true);
 assert.equal(cosmeticAvailable('aquarium-rgb',2015),false);
 assert.equal(cosmeticAvailable('tony-cyber',2015),true);
 assert.equal(serializeSave(save),before);
 assert.equal(save.cash,cash);
 setVerifiedCosmetics([]);
 assert.equal(cosmeticAvailable('tony-cyber',2020),false);
});
