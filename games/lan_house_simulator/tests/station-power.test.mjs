import test from "node:test";
import assert from "node:assert/strict";
import {createGame,chooseAvailablePc,isValidSave,stepGame,pcCount} from "../dist/js/sim/engine.js";
import {toggleStationPower,stationPoweredOn} from "../dist/js/sim/stationPower.js";
import {energyCostPerMinute,upgradeComputer} from "../dist/js/sim/economy.js";
import {buyGpu} from "../dist/js/sim/gpu.js";
import {buyPart} from "../dist/js/sim/hardware.js";
import {buyLcdKit} from "../dist/js/sim/computerModels.js";
import {licenseWindows} from "../dist/js/sim/era.js";
import {serializeSave,parseImportedSave} from "../dist/js/sim/saveTransfer.js";
import {DAY_MINUTES} from "../dist/js/sim/types.js";

test("desligar um PC economiza energia, bloqueia reserva e persiste no save",()=>{
 const s=createGame(189),initial=energyCostPerMinute(s,0);
 assert.equal(pcCount(s),3);
 assert.equal(stationPoweredOn(s,0),true);
 assert.equal(toggleStationPower(s,0).ok,true);
 assert.equal(stationPoweredOn(s,0),false);
 assert.ok(energyCostPerMinute(s,0)<initial);
 const c={id:5,x:7.5,y:5.35,pcIndex:null,stage:"waiting",costume:"regular",vip:false};
 assert.notEqual(chooseAvailablePc(s,c),0);
 assert.equal(isValidSave(s),true);
 const restored=parseImportedSave(serializeSave(s));
 assert.equal(stationPoweredOn(restored,0),false);
 assert.equal(toggleStationPower(restored,0).ok,true);
 assert.equal(stationPoweredOn(restored,0),true);
 assert.equal(energyCostPerMinute(restored,0),initial);
});
test("PC ocupado não pode ser desligado; desligar não expulsa cliente",()=>{
 const s=createGame(131);
 s.customers=[{id:10,x:3,y:2,pcIndex:1,stage:"using",costume:"regular",target:{x:3,y:2},usedMinutes:1,waitingMinutes:0,offlineWait:0,happy:true}];
 const copy=structuredClone(s);
 assert.equal(toggleStationPower(s,1).ok,false);
 assert.deepEqual(s,copy);
 s.customers=[];assert.equal(toggleStationPower(s,1).ok,true);
 assert.equal(toggleStationPower(s,-1).ok,false);
 assert.equal(toggleStationPower(s,3).ok,false);
});
test("upgrade de peça e Windows exige PC livre e desligado, sem cobrança na recusa",()=>{
 const s=createGame(2031);s.cash=25000;s.totalMinutes=26*360*DAY_MINUTES;
 const before=s.cash;
 assert.match(upgradeComputer(s,0).message,/Desligue/);
 assert.match(buyPart(s,0,"ram","ram256").message,/Desligue/);
 assert.match(buyGpu(s,0,"gpu05").message,/Desligue/);
 assert.match(licenseWindows(s,0,"winxp").message,/Desligue/);
 assert.match(buyLcdKit(s,0,"lcd05").message,/Desligue/);
 assert.equal(s.cash,before);
 assert.equal(toggleStationPower(s,0).ok,true);
 assert.equal(upgradeComputer(s,0).ok,true);
 assert.equal(licenseWindows(s,0,"winxp").ok,true);
 assert.equal(toggleStationPower(s,0).ok,true);
});
test("todos PCs desligados continuam com gastos fixos do salão, mas não consomem energia de estação",()=>{
 const s=createGame(),on=energyCostPerMinute(s,0);
 for(let i=0;i<pcCount(s);i++)assert.equal(toggleStationPower(s,i).ok,true);
 const off=energyCostPerMinute(s,0);
 assert.ok(off>0,"o aluguel e a estrutura da lan house continuam existindo");
 assert.ok(off<on,"sem consumo específico de PCs");
 assert.equal(chooseAvailablePc(s,{id:22,x:7.5,y:5.35,pcIndex:null,vip:false}),undefined);
 s.pcPoweredOff=[false,true,"inválido"];
 assert.equal(isValidSave(s),false);
});

test("estado desligado acompanha PC do anexo quando PCs originais são adicionados",async()=>{
 const {expandDirection}=await import("../dist/js/sim/room.js");
 const {installAnnexComputer}=await import("../dist/js/sim/stations.js");
 const {buyComputer}=await import("../dist/js/sim/shop.js");
 const s=createGame();s.cash=10000;
 assert.equal(expandDirection(s,"east").ok,true);
 assert.equal(installAnnexComputer(s,"pc-east-1").ok,true);
 assert.equal(pcCount(s),4);
 assert.equal(toggleStationPower(s,3).ok,true);
 assert.equal(stationPoweredOn(s,3),false);
 assert.equal(buyComputer(s).ok,true);
 assert.equal(pcCount(s),5);
 assert.equal(stationPoweredOn(s,3),true,"novo PC fica ligado");
 assert.equal(stationPoweredOn(s,4),false,"estado do anexo preservado");
 assert.equal(stationPoweredOn(parseImportedSave(serializeSave(s)),4),false);
});
