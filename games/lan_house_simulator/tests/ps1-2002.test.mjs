import {ps1ControllerAnchor,ps1ControllerPort,ps1ScreenFrame} from "../dist/js/render/ps1Art.js";
import {drawPs1MiniGame,ps1MiniGameFrame} from "../dist/js/render/ps1MiniGames.js";
import {seatTransitionWeight} from "../dist/js/render/actorArt.js";
import test from "node:test";
import assert from "node:assert/strict";
import {createGame,stepGame,isValidSave,visitorArrivalChance} from "../dist/js/sim/engine.js";
import {simulatePs1RealCycle} from "../scripts/ps1_real_cycle.mjs";
import {simulatePs1CrowdedCycle} from "../scripts/ps1_crowded_cycle.mjs";
import {DAY_MINUTES} from "../dist/js/sim/types.js";
import {serializeSave,parseImportedSave} from "../dist/js/sim/saveTransfer.js";
import {shopPrice,placeFurniture,availablePlacementSlots} from "../dist/js/sim/shop.js";
import {ps1PlacementSlots,ps1PlacementLabel,buyPs1Station,ps1StationPoint,ps1Seat,ps1HourPrice,
 setPs1HourlyPrice,ps1SessionPrice,repairPs1Controls,ps1AvailableStation,
 ps1EnergyCostPerMinute,validPs1State,PS1_UNLOCK_YEAR,
 PS1_CD_CATALOG,ps1DiscPrice,buyPs1Disc,ps1DiscCopies,ps1PlayableDisc,setPs1StationDisc} from "../dist/js/sim/ps1.js";
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
 ok(buyPs1Disc(s,"turbo-circuito"));
 return s;
}
test("seleção de bancada utiliza nomes humanos, nunca coordenadas nem IDs técnicos",()=>{
 const s=inYear(),slots=ps1PlacementSlots(s);
 const base=slots.filter(x=>/^floor-[1-4]$/.test(x.id));
 assert.deepEqual(base.map(ps1PlacementLabel),[
  "Entrada (sul) · lado esquerdo",
  "Entrada (sul) · centro-esquerda",
  "Entrada (sul) · centro-direita",
  "Entrada (sul) · lado direito"
 ]);
 for(const slot of slots){
  const label=ps1PlacementLabel(slot);
  assert.ok(label.length>10,label);
  assert.doesNotMatch(label,/\\d+[,.]\\d+|floor-|posição \\d+|x:|y:/i);
 }
 // As alas novas devem manter rótulos únicos e estáveis ao comprar uma bancada.
 s.roomExtensions={west:2,east:2,north:2,south:0};
 const expanded=ps1PlacementSlots(s),labels=expanded.map(ps1PlacementLabel);
 assert.equal(new Set(labels).size,labels.length,"cada posição precisa de nome único");
 assert.ok(labels.some(label=>label.includes("oeste")));
 assert.ok(labels.some(label=>label.includes("leste")));
 assert.ok(labels.some(label=>label.includes("norte")));
 const chosen=expanded.find(x=>x.id==="floor-west-1");
 assert.ok(chosen);
 const label=ps1PlacementLabel(chosen);
 ok(buyPs1Station(s,chosen.id));
 assert.equal(s.ps1Stations[0].slotId,chosen.id,"o save continua usando o ID técnico");
 assert.equal(ps1PlacementLabel(chosen),label,"o texto é independente de outras compras");
});
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

test("PS1: sentar e levantar suavizam o movimento sem saltar no começo e fim",()=>{
 assert.equal(seatTransitionWeight(0),0);
 assert.equal(seatTransitionWeight(1),1);
 assert.equal(seatTransitionWeight(.5),.5);
 assert.ok(seatTransitionWeight(.1)<.1,"entrada suave");
 assert.ok(seatTransitionWeight(.9)>.9,"chegada suave");
 for(let i=0;i<=20;i++) {
  const progress=i/20,weight=seatTransitionWeight(progress);
  assert.ok(weight>=0&&weight<=1);
  if(i)assert.ok(weight>=seatTransitionWeight((i-1)/20));
 }
 assert.equal(seatTransitionWeight(-1),0);
 assert.equal(seatTransitionWeight(5),1);
});

test("PS1: microjogo do CRT anima de forma determinística dentro do visor",()=>{
 const first=ps1ScreenFrame(0);
 assert.deepEqual(ps1ScreenFrame(0),first);
 assert.notDeepEqual(ps1ScreenFrame(.2),first,"tela não pode parecer estática");
 for(let i=0;i<120;i++){
  const f=ps1ScreenFrame(i/10);
  assert.ok(f.heroX>=0&&f.heroX+.12<=1,"personagem cabe na TV");
  assert.ok(f.heroY>=0&&f.heroY+.20<=.7,"personagem fica acima do chão");
  assert.equal(typeof f.sparkle,"boolean");
 }
 assert.deepEqual(ps1ScreenFrame(-1),first);
 assert.deepEqual(ps1ScreenFrame(Number.NaN),first);
});

test("console PS1 continua recebendo clientes com todos os PCs desligados",()=>{
 const s=setup();
 s.pcPoweredOff=[true,true,true];
 s.offlineUntil=s.totalMinutes+300;
 assert.ok(visitorArrivalChance(s,0)>0,
  "console livre deve atrair clientes mesmo sem PCs e sem internet");
 const c={id:1,x:1.55,y:2.56,target:{x:1.55,y:2.56},stage:"waiting",
  queueIndex:0,pcIndex:null,costume:"regular",usedMinutes:0,waitingMinutes:0,
  offlineWait:0,happy:true,sessionMinutes:45,wallet:20};
 s.customers.push(c);
 stepGame(s,1);
 assert.equal(c.ps1StationIndex,0,
  "cliente comum pode escolher console se não houver PCs ligados");
 assert.equal(c.stage,"to_pc");
 assert.equal(c.pcIndex,null);
 assert.equal(visitorArrivalChance(s,1),0,
  "não anunciar sessão quando a única cadeira está reservada");
 const empty=inYear();
 empty.pcPoweredOff=[true,true,true];
 assert.equal(visitorArrivalChance(empty,0),0,
  "sem PCs nem PS1 não há sessões abertas");
});

test("Scene Forge PS1 executa rota real, senta, joga, levanta e sai",()=>{
 const result=simulatePs1RealCycle();
 assert.equal(result.exited,true);
 assert.ok(result.minutes>12&&result.minutes<240);
 assert.ok(result.wear>0);
 assert.equal(result.stationCount,1);
 for(const stage of ["to_pc","sitting","using","standing","leaving"])
  assert.ok(result.stages.includes(stage),stage+" ausente na simulação");
 const playing=result.timeline.filter(f=>f.stage==="using");
 assert.ok(playing.length>=4,"jogabilidade deve durar vários minutos reais");
 assert.ok(playing.every(f=>f.ps1StationIndex===0));
 assert.ok(result.timeline.some(f=>f.stage==="to_pc"&&
  Math.hypot(f.x-result.side.x,f.y-result.side.y)<.4),
  "rota real deve alcançar a lateral da cadeira");
});

test("dois clientes jogam PS1 em bancadas diferentes sem colisão nem fila travada",()=>{
 const scene=simulatePs1CrowdedCycle();
 assert.equal(scene.stations.length,2);
 assert.equal(scene.ids.length,2);
 assert.equal(Object.keys(scene.exits).length,2);
 assert.ok(scene.minutes<220,"duas sessões encerradas até 220 minutos");
 assert.ok(scene.minGap>=.405,"clientes não atravessam os corpos");
 assert.ok(scene.wear.every(n=>n>0),"ambos consoles sofreram desgaste");
 for(const id of scene.ids){
  for(const stage of ["to_pc","sitting","using","standing","leaving"])
   assert.ok(scene.stages[id].includes(stage),"cliente "+id+" sem "+stage);
 }
 const overlapping=scene.history.filter(f=>f.customers.every(c=>c&&c.stage==="using"));
 assert.ok(overlapping.length>0,"os dois consoles devem operar ao mesmo tempo");
});

test("2002: bancada sem CD não recebe clientes, compra física ativa primeiro PS1",()=>{
 const s=inYear(),slot=ps1PlacementSlots(s)[0];
 ok(buyPs1Station(s,slot.id));
 assert.equal(ps1PlayableDisc(s,0),null);
 assert.equal(ps1AvailableStation(s),-1);
 s.pcPoweredOff=[true,true,true];
 assert.equal(visitorArrivalChance(s,0),0,"sem jogos físicos não há serviço PS1");
 const before=s.cash;
 ok(buyPs1Disc(s,"turbo-circuito"));
 assert.equal(Math.round((before-s.cash)*100),Math.round(ps1DiscPrice(s,"turbo-circuito")*100));
 assert.equal(ps1DiscCopies(s,"turbo-circuito"),1);
 assert.equal(ps1PlayableDisc(s,0),"turbo-circuito");
 assert.equal(ps1AvailableStation(s),0);
 assert.ok(visitorArrivalChance(s,0)>0);
 assert.equal(isValidSave(s),true);
 assert.deepEqual(parseImportedSave(serializeSave(s)).ps1Discs,s.ps1Discs);
});

test("CDs PS1: troca, cópias físicas exclusivas, dinheiro e saves legados",()=>{
 const s=setup();
 const slot=ps1PlacementSlots(s)[0];
 ok(buyPs1Station(s,slot.id));
 assert.equal(ps1AvailableStation(s),0,"primeiro PS1 já contém jogo");
 assert.equal(ps1PlayableDisc(s,1),null,"segunda bancada sem CD");
 assert.equal(setPs1StationDisc(s,1,"turbo-circuito").ok,false,
  "um CD não pode ocupar duas bancadas");
 ok(buyPs1Disc(s,"turbo-circuito"));
 assert.equal(ps1PlayableDisc(s,1),"turbo-circuito");
 ok(buyPs1Disc(s,"ilha-dos-cristais"));
 ok(setPs1StationDisc(s,1,"ilha-dos-cristais"));
 assert.equal(ps1PlayableDisc(s,1),"ilha-dos-cristais");
 assert.equal(setPs1StationDisc(s,0,"ilha-dos-cristais").ok,false,
  "CD único não pode equipar duas bancadas");
 const busy={id:5,stage:"using",ps1StationIndex:1,pcIndex:null};
 s.customers=[busy];
 assert.equal(setPs1StationDisc(s,1,null).ok,false);
 s.customers=[];
 ok(setPs1StationDisc(s,1,null));
 assert.equal(ps1AvailableStation(s),0);
 const saved=serializeSave(s);
 assert.deepEqual(parseImportedSave(saved).ps1Stations,s.ps1Stations);
 s.ps1Stations[1].discId="turbo-circuito";
 assert.equal(isValidSave({...s,ps1Discs:{"turbo-circuito":1}}),false,
  "inventário adulterado que duplica CDs é inválido");
 delete s.ps1Stations[1].discId;
 const legacy=setup();
 delete legacy.ps1Discs;
 delete legacy.ps1Stations[0].discId;
 assert.equal(isValidSave(legacy),true,"save antigo carrega sem CD gratuito");
 assert.equal(ps1AvailableStation(legacy),-1,"save antigo precisa comprar CD");
 for(const title of PS1_CD_CATALOG)assert.ok(ps1DiscPrice(s,title.id)>0);
 assert.equal(buyPs1Disc(inYear(),"turbo-circuito").ok,false);
});

test("cinco CDs têm minijogos CRT exclusivos, determinísticos e animados",()=>{
 const snapshots=new Set();
 for(const disc of PS1_CD_CATALOG){
  const data=ps1MiniGameFrame(disc.id,1.25);
  assert.equal(data.disc,disc.id);
  assert.equal(data.tick,10);
  assert.deepEqual(ps1MiniGameFrame(disc.id,1.25),data);
  assert.equal(ps1MiniGameFrame(disc.id,Number.NaN).tick,0);
  let image=[];
  const collect=(x,y,w,h,color)=>{
   for(const v of [x,y,w,h])assert.ok(Number.isFinite(v));
   assert.ok(x>=0&&x<=1&&y>=0&&y<=1);
   assert.ok(w>0&&h>0&&x+w<=1.000001&&y+h<=1.000001);
   image.push([x,y,w,h,color]);
  };
  drawPs1MiniGame(collect,disc.id,1.25);
  assert.ok(image.length>12,disc.title+" precisa ter detalhes próprios");
  const serialized=JSON.stringify(image);
  assert.ok(!snapshots.has(serialized),disc.title+" repetiu outro jogo");
  snapshots.add(serialized);
  image=[];
  drawPs1MiniGame(collect,disc.id,2.25);
  assert.notEqual(serialized,JSON.stringify(image),disc.title+" deve animar no tempo");
 }
 assert.equal(snapshots.size,5);
});

test("a seleção física por bancada muda o jogo da TV sem tocar no preço",()=>{
 const s=setup();
 const first=ps1PlayableDisc(s,0);
 assert.equal(first,"turbo-circuito");
 const initialRate=ps1HourPrice(s),beforeCash=s.cash;
 ok(buyPs1Disc(s,"gol-de-rua"));
 ok(setPs1StationDisc(s,0,"gol-de-rua"));
 assert.equal(ps1PlayableDisc(s,0),"gol-de-rua");
 assert.notEqual(ps1MiniGameFrame(first,1).accent,ps1MiniGameFrame(ps1PlayableDisc(s,0),1).accent);
 assert.equal(ps1HourPrice(s),initialRate);
 assert.equal(beforeCash-s.cash,ps1DiscPrice(s,"gol-de-rua"));
 assert.equal(isValidSave(s),true);
 assert.equal(parseImportedSave(serializeSave(s)).ps1Stations[0].discId,"gol-de-rua");
});
