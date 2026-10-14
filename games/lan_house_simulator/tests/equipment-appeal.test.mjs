import test from "node:test";
import assert from "node:assert/strict";
import {createGame,visitorArrivalChance} from "../dist/js/sim/engine.js";
import {establishmentAppealMultiplier,expandShop,upgradeComputer,upgradeInternet,setHourlyPrice} from "../dist/js/sim/economy.js";
import {buyComputer} from "../dist/js/sim/shop.js";
import {buyGpu} from "../dist/js/sim/gpu.js";
import {DAY_MINUTES} from "../dist/js/sim/types.js";
import {serializeSave,parseImportedSave} from "../dist/js/sim/saveTransfer.js";

test("atratividade começa neutra; só compras reais elevam a procura",()=>{
 const s=createGame();s.cash=15000;s.totalMinutes=11*360*DAY_MINUTES;
 assert.equal(establishmentAppealMultiplier(s),1);
 const before={revenue:s.revenue,served:s.served,rng:s.rng};
 assert.equal(expandShop(s).ok,true);
 assert.equal(buyComputer(s).ok,true);assert.equal(buyComputer(s).ok,true);
 const computers=establishmentAppealMultiplier(s);
 assert.ok(computers>1&&computers<1.3);
 assert.equal(upgradeComputer(s,0).ok,true);
 assert.equal(upgradeInternet(s).ok,true);
 assert.equal(buyGpu(s,0,"gpu09").ok,true);
 assert.ok(establishmentAppealMultiplier(s)>computers);
 assert.deepEqual({revenue:s.revenue,served:s.served,rng:s.rng},before);
});
test("preço caro e internet fora do ar continuam reduzindo procura mesmo com boas máquinas",()=>{
 const s=createGame();s.cash=15000;s.totalMinutes=11*360*DAY_MINUTES;
 assert.equal(expandShop(s).ok,true);
 for(let i=0;i<2;i++)assert.equal(buyComputer(s).ok,true);
 assert.equal(upgradeInternet(s).ok,true);
 for(let i=0;i<5;i++)assert.equal(upgradeComputer(s,i).ok,true);
 const good=visitorArrivalChance(s,0);
 assert.ok(good>visitorArrivalChance(createGame(),0));
 assert.equal(setHourlyPrice(s,32).ok,true);
 const expensive=visitorArrivalChance(s,0);
 assert.ok(expensive<good);
 s.offlineUntil=s.totalMinutes+100;
 assert.ok(visitorArrivalChance(s,0)<expensive*.2);
});
test("bônus é limitado e respeita saves legados",()=>{
 const s=createGame();s.expansionLevel=2;s.installedPcs=7;s.internetTier=3;
 s.pcTiers=[3,3,3,3,3,3,3];s.pcGpus=Array(7).fill("gpu13");
 assert.ok(establishmentAppealMultiplier(s)<=1.60);
 assert.equal(establishmentAppealMultiplier(parseImportedSave(serializeSave(s))),establishmentAppealMultiplier(s));
 const legacy=createGame();delete legacy.pcTiers;delete legacy.pcGpus;
 assert.equal(establishmentAppealMultiplier(legacy),1);
});
