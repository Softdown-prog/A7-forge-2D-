import {ps1ControllerAnchor,ps1ControllerPort} from "../dist/js/render/ps1Art.js";
import test from "node:test";
import assert from "node:assert/strict";
import {createGame,stepGame,isValidSave} from "../dist/js/sim/engine.js";
import {DAY_MINUTES} from "../dist/js/sim/types.js";
import {serializeSave,parseImportedSave} from "../dist/js/sim/saveTransfer.js";
import {shopPrice,placeFurniture,availablePlacementSlots} from "../dist/js/sim/shop.js";
import {ps1PlacementSlots,buyPs1Station,ps1StationPoint,ps1Seat,ps1HourPrice,
 setPs1HourlyPrice,ps1SessionPrice,repairPs1Controls,ps1AvailableStation,
 ps1EnergyCostPerMinute,validPs1State,PS1_UNLOCK_YEAR} from "../dist/js/sim/ps1.js";
import {annualHourlyCeiling} from "../dist/js/sim/historicalEconomy.js";
const ok=r=>assert.equal(r.ok,true,r.message);
function inYear(year=2002){
 const s=createGame(314,"historical");s.totalMinutes=(year-1998)*360*DAY_MINUTES;
 s.cash=5000;return s;
}
function setup(){
 const s=inYear(),slot=ps1PlacementSlots(s)[0];
 assert.ok(slot,"2002 has a usable place for console and chair");
 ok(buyPs1Station(s,slot.id));
 return s;
}
test("2002 unlock, paid TV-console-bench-chair, limit and floor occupancy",()=>{
 const s=inYear(2001),slot=ps1PlacementSlots(s)[0];
 const before=JSON.stringify(s);
 assert.equal(buyPs1Station(s,slot.id).ok,false);
 assert.equal(JSON.stringify(s),before);
 s.totalMinutes=(PS1_UNLOCK_YEAR-1998)*360*DAY_MINUTES;
 const initial=s.cash,spent=s.expenses;
 ok(buyPs1Station(s,slot.id));
 assert.equal(s.cash,initial-shopPrice(s,"ps1"));
 assert.equal(s.expenses,spent+shopPrice(s,"ps1"));
 assert.equal(s.ps1Stations[0].slotId,slot.id);
 assert.ok(ps1StationPoint(s,0)&&ps1Seat(s,0));
 assert.equal(availablePlacementSlots(s,"table").some(p=>p.id===slot.id),false);
 assert.equal(placeFurniture(s,"table",slot.id).ok,false,"same footprint blocks decorative furniture");
 assert.equal(buyPs1Station(s,slot.id).ok,false);
 assert.equal(isValidSave(s),true);
 assert.deepEqual(parseImportedSave(serializeSave(s)).ps1Stations,s.ps1Stations);
 for(const candidate of ps1PlacementSlots(s).slice(0,2))ok(buyPs1Station(s,candidate.id));
 assert.equal(s.ps1Stations.length,3);
 assert.equal(buyPs1Station(s,ps1PlacementSlots(s)[0]?.id??"floor-1").ok,false);
});
test("tarifa própria, centavos e manutenção dos controles sem cliente",()=>{
 const s=setup(),cost=s.cash,expenses=s.expenses;
 assert.equal(ps1HourPrice(s),2.5);
 assert.equal(ps1SessionPrice(s,45),1.88);
 assert.equal(setPs1HourlyPrice(s,0.51).ok,false);
 assert.equal(setPs1HourlyPrice(s,annualHourlyCeiling(2002)+.25).ok,false);
 ok(setPs1HourlyPrice(s,3));
 assert.equal(ps1SessionPrice(s,90),4.5);
 assert.equal(s.cash,cost);assert.equal(s.expenses,expenses);
 assert.equal(ps1EnergyCostPerMinute(s),.0008);
 s.ps1Stations[0].wear=31;
 s.cash=1000;
 ok(repairPs1Controls(s,0));
 assert.equal(s.ps1Stations[0].wear,0);
 assert.equal(s.cash,955);
 assert.equal(s.expenses,expenses+45);
 assert.equal(repairPs1Controls(s,0).ok,false);
});
test("cliente paga no balcão, caminha, senta e joga sem reservar computador ou internet",()=>{
 const s=setup();s.offlineUntil=s.totalMinutes+300;
 const initial=s.cash;
 const c={id:5,x:1.55,y:2.56,target:{x:1.55,y:2.56},stage:"waiting",
  queueIndex:0,pcIndex:null,costume:"regular",usedMinutes:0,waitingMinutes:0,
  offlineWait:0,happy:true,sessionMinutes:45,wallet:20,needs:{thirst:0,hunger:0,energy:100}};
 s.customers.push(c);
 stepGame(s,1);
 assert.equal(c.ps1StationIndex,0,"customer reserves console chair");
 assert.equal(c.pcIndex,null,"no PC station occupied");
 assert.equal(c.stage,"to_pc");
 assert.equal(s.ps1Sessions,1);
 assert.equal(s.ps1Revenue,1.88);
 assert.equal(Math.round((s.cash-initial)*100),188);
 assert.equal(ps1AvailableStation(s),-1,"only chair is occupied");
 // The seat is reached by the same route system; outage does not interrupt console.
 stepGame(s,60);
 assert.ok(["sitting","using","standing","shopping","leaving"].includes(c.stage)||
  s.ps1Stations[0].wear>0,
  c.stage+" · atual="+JSON.stringify({x:c.x,y:c.y,target:c.target,route:c.route}));
 assert.equal(c.offlineWait,0);
 stepGame(s,100);
 assert.ok(s.ps1Stations[0].wear>0,"controller gains wear only from actual play");
 assert.equal(s.ps1Sessions,1,"never charge same customer twice");
 assert.equal(isValidSave(s),true);
 assert.deepEqual(parseImportedSave(serializeSave(s)).ps1Stations,s.ps1Stations);
});
test("ocupação e desgaste impedem reserva e reparo indevido",()=>{
 const s=setup();
 const c={id:10,stage:"using",pcIndex:null,ps1StationIndex:0};
 s.customers=[c];
 s.ps1Stations[0].wear=30;
 assert.equal(ps1AvailableStation(s),-1);
 assert.equal(repairPs1Controls(s,0).ok,false);
 s.customers=[];
 s.ps1Stations[0].wear=100;
 assert.equal(ps1AvailableStation(s),-1);
 ok(repairPs1Controls(s,0));
 assert.equal(ps1AvailableStation(s),0);
});
test("saves antigos, slots adulterados e receita impossível não passam",()=>{
 const old=inYear(2001);
 assert.equal(isValidSave(parseImportedSave(serializeSave(old))),true);
 const s=setup();
 for(const bad of [
  [{slotId:"floor-wrong",wear:0}],
  [{slotId:s.ps1Stations[0].slotId,wear:-1}],
  [{slotId:s.ps1Stations[0].slotId,wear:101}],
  [s.ps1Stations[0],s.ps1Stations[0]]
 ]){
  s.ps1Stations=bad;
  assert.equal(validPs1State(s),false);
 }
 s.ps1Stations=[{slotId:ps1PlacementSlots(inYear())[0].id,wear:0}];
 s.ps1Revenue=-1;
 assert.equal(validPs1State(s),false);
 s.ps1Revenue=0;
 assert.equal(isValidSave(s),true);
 s.totalMinutes=(2001-1998)*360*DAY_MINUTES;
 assert.equal(validPs1State(s),false);
});

test("desvio por aglomeração preserva entrada lateral na cadeira PS1",()=>{
 const s=setup();
 const c={id:5,x:1.55,y:2.56,target:{x:1.55,y:2.56},stage:"waiting",
  queueIndex:0,pcIndex:null,costume:"regular",usedMinutes:0,waitingMinutes:0,
  offlineWait:0,happy:true,sessionMinutes:45,wallet:20};
 s.customers.push(c);
 stepGame(s,1);
 assert.equal(c.ps1StationIndex,0);
 const seat=ps1Seat(s,0);
 assert.ok(seat);
 // Congestionar o waypoint de propósito; o desvio não pode esquecer
 // o ponto final da cadeira nem transformar a lateral em destino final.
 const obstacle={id:999,x:c.target.x,y:c.target.y,target:{...c.target},
  stage:"using",pcIndex:null,costume:"regular",usedMinutes:0,waitingMinutes:0,
  offlineWait:0,happy:true,sessionMinutes:9999};
 s.customers.push(obstacle);
 stepGame(s,5);
 assert.equal(c.ps1StationIndex,0);
 assert.equal(c.stage,"to_pc");
 const last=c.route?.at(-1)??c.target;
 assert.ok(Math.hypot(last.x-seat.x,last.y-seat.y)<.001,
  "a rota recalculada deve continuar terminando na cadeira do console");
});

test("controle de PS1 permanece à frente do personagem e conectado ao console",()=>{
 const s=setup(),seat=ps1Seat(s,0);
 assert.ok(seat);
 const pad=ps1ControllerAnchor(seat),port=ps1ControllerPort(seat);
 assert.ok(pad.point.y<seat.y&&pad.point.y>seat.y-.5,
  "controle deve ficar diante do colo, voltado à TV");
 assert.ok(pad.height>=20&&pad.height<=35,
  "controle deve estar na altura das mãos, não do pescoço");
 assert.ok(port.point.y<pad.point.y&&port.point.x>pad.point.x,
  "cabo termina na frente do console sobre a bancada");
 for(const n of [pad.point.x,pad.point.y,pad.height,port.point.x,port.point.y,port.height])
  assert.ok(Number.isFinite(n));
 assert.deepEqual(ps1ControllerAnchor(seat),pad,"âncora estável entre frames");
});
