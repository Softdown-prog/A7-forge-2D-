import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,stepGame,isValidSave,visitorArrivalChance} from '../dist/js/sim/engine.js';
import {DAY_MINUTES} from '../dist/js/sim/types.js';
import * as p from '../dist/js/sim/ps2.js';
import {buyPs1Station,buyPs1Disc,ps1PlacementSlots} from '../dist/js/sim/ps1.js';
import {tryServe} from '../dist/js/sim/customerDecisions.js';
import {advanceCustomer} from '../dist/js/sim/customerLifecycle.js';
import {canTraverseLocalStep,navigableRoute} from '../dist/js/sim/navigation.js';
import {serializeSave,parseImportedSave,snapshotGameState} from '../dist/js/sim/saveTransfer.js';
import {createPs2Port} from '../dist/js/application/ps2Port.js';
import {createShopActionsPort} from '../dist/js/application/shopActionsPort.js';
import {moveLayoutObject} from '../dist/js/sim/editableObjects.js';
import {buildWall} from '../dist/js/sim/walls.js';
import {setPs1HourlyPrice} from '../dist/js/sim/ps1.js';
import {createFinancialAdminOverviewPort} from '../dist/js/application/financialAdminOverviewPort.js';
const ok=r=>assert.equal(r.ok,true,r.message);
function game(year=2006){const s=createGame(314,'historical');s.totalMinutes=(year-1998)*360*DAY_MINUTES+40;s.cash=10000;return s;}
function installed(duo=false){const s=game();ok(p.buyPs2Station(s,'floor-2'));ok(p.buyPs2Game(s,'cidade-em-fuga'));if(duo)ok(p.buyPs2SecondSeat(s,0));return s;}
function visitor(id=5,minutes=45){return {id,stage:'waiting',x:1.55,y:2.56,target:{x:1.55,y:2.56},route:[],queueIndex:0,
 pcIndex:null,costume:'regular',usedMinutes:0,waitingMinutes:0,offlineWait:0,happy:true,sessionMinutes:minutes,wallet:30,
 preference:'gaming',budgetAware:true,needs:{thirst:0,hunger:0,energy:100}};}
function minute(s){s.totalMinutes++;for(const c of [...s.customers])advanceCustomer(s,c);}
function until(s,predicate,max=300){for(let i=0;i<max;i++){if(predicate())return i;minute(s);}assert.ok(predicate(),'gameplay did not reach expected phase');}

test('PS2 is blocked in 1998/2002/2005, unlocked through 2030, classic remains unchanged',()=>{
 for(const year of [1998,2002,2005]){const s=game(year),before=JSON.stringify(s);assert.equal(p.buyPs2Station(s,'floor-2').ok,false);assert.equal(JSON.stringify(s),before);}
 for(const year of [2006,2007,2015,2030]){const s=game(year);ok(p.buyPs2Station(s,'floor-2'));assert.equal(isValidSave(s),true);}
 const s=game();delete s.economyVersion;assert.equal(p.buyPs2Station(s,'floor-2').ok,false);
});
test('atomic installation checks cash, physical slot, route, walls and people before expense',()=>{
 const s=game(),price=p.ps2BenchPrice(s);assert.equal(price,980);
 for(const slot of ['unknown','floor-grid-1:1','floor-4']){const before=JSON.stringify(s);assert.equal(p.buyPs2Station(s,slot).ok,false);assert.equal(JSON.stringify(s),before);}
 s.cash=price-.01;const before=JSON.stringify(s);assert.equal(p.buyPs2Station(s,'floor-2').ok,false);assert.equal(JSON.stringify(s),before);
 s.cash=price;ok(createShopActionsPort(()=>s).purchase('ps2','floor-2'));assert.equal(s.cash,0);assert.equal(s.expenses,price);
 assert.equal(p.buyPs2Station(s,'floor-2').ok,false);assert.equal(s.expenses,price);
 const occupied=game(),at=p.ps2StationPoint(s,0);occupied.customers=[{...visitor(),x:at.x+.3,y:at.y+.3}];
 assert.equal(p.buyPs2Station(occupied,'floor-2').ok,false);assert.equal(occupied.cash,10000);
 const wall=game();wall.interiorWalls=[{axis:'x',x:2,y:5}];assert.equal(p.buyPs2Station(wall,'floor-2').ok,false);
 const furniture=game();furniture.furniture={poster:0,plant:0,table:1};furniture.furniturePlacements=[{kind:'table',slotId:'floor-2'}];
 assert.equal(p.buyPs2Station(furniture,'floor-2').ok,false);
 const pc=game();pc.objectPlacements=[{id:'pc:1',x:2.5,y:5,rotation:0}];assert.equal(p.buyPs2Station(pc,'floor-2').ok,false);
});
test('PS1 and PS2 have independent limits, positions, games and prices',()=>{
 const s=game();s.roomExtensions={west:2,east:2,north:2,south:0};
 for(const id of ['floor-1','floor-2','floor-3'])ok(buyPs1Station(s,id));
 ok(buyPs1Disc(s,'gol-de-rua'));const old=structuredClone(s.ps1Stations),discs=structuredClone(s.ps1Discs);
 for(let i=0;i<3;i++){const slot=p.ps2PlacementSlots(s)[0];assert.ok(slot);ok(p.buyPs2Station(s,slot.id));}
 assert.equal(p.buyPs2Station(s,p.ps2PlacementSlots(s)[0]?.id??'floor-4').ok,false);
 ok(p.buyPs2Game(s,'futsal-de-bairro'));ok(p.setPs2HourlyPrice(s,3.25));ok(setPs1HourlyPrice(s,1.75));
 assert.equal(s.ps1Stations.length,3);assert.equal(s.ps2Stations.length,3);assert.deepEqual(s.ps1Stations,old);assert.deepEqual(s.ps1Discs,discs);
 assert.equal(s.ps2HourlyPrice,3.25);assert.equal(s.ps1HourlyPrice,1.75);assert.equal(isValidSave(s),true);
});
test('five physical games require copies; buying does not replace a busy game',()=>{
 const s=installed();ok(p.buyPs2Station(s,'floor-3'));
 assert.equal(p.setPs2StationGame(s,1,'cidade-em-fuga').ok,false);ok(p.buyPs2Game(s,'cidade-em-fuga'));
 assert.equal(s.ps2Stations[1].gameId,'cidade-em-fuga');
 for(const g of p.PS2_GAME_CATALOG){if(!p.ps2GameCopies(s,g.id))ok(p.buyPs2Game(s,g.id));ok(p.setPs2StationGame(s,0,g.id));assert.equal(p.ps2PlayableGame(s,0),g.id);}
 assert.equal(Object.keys(s.ps2Games).length,5);assert.equal(p.buyPs2Game(s,'gol-de-rua').ok,false);
 ok(p.setPs2StationGame(s,0,null));assert.equal(p.ps2OpenSeat(s,0),null);
 ok(p.setPs2StationGame(s,0,'cidade-em-fuga'));const c=visitor();s.customers=[c];tryServe(s,c);
 assert.equal(c.ps2StationIndex,0);const snapshot=JSON.stringify(s.ps2Stations);
 assert.equal(p.setPs2StationGame(s,0,null).ok,false);assert.equal(JSON.stringify(s.ps2Stations),snapshot);
});
for(const duration of [30,45,60,90])test(`real ${duration}-minute checkout walks, sits, wears, stands and leaves once, offline`,()=>{
 const s=installed(),c=visitor(5,duration);s.customers=[c];s.offlineUntil=s.totalMinutes+5000;
 const cash=s.cash,revenue=s.revenue,expected=p.ps2SessionPrice(s,duration);tryServe(s,c);assert.equal(c.stage,'to_pc');
 assert.equal(c.ps2StationIndex,0);assert.equal(c.pcIndex,null);assert.equal(s.cash,cash+expected);assert.equal(s.revenue,revenue+expected);
 tryServe(s,c);assert.equal(s.ps2Sessions,1);assert.equal(s.ps2Revenue,expected);assert.equal(c.wallet,30-expected);
 let last={x:c.x,y:c.y};until(s,()=>c.stage==='sitting');assert.ok(c.route.length===0);
 assert.deepEqual({x:c.x,y:c.y},p.ps2Seat(s,0));assert.ok(Math.hypot(c.x-last.x,c.y-last.y)>1);
 until(s,()=>c.stage==='using');ok(p.setPs2HourlyPrice(s,2.75));assert.equal(c.consolePaidHourly,4);
 until(s,()=>c.stage==='standing');assert.equal(c.usedMinutes,duration);assert.equal(c.offlineWait,0);
 assert.ok(Math.abs(s.ps2Stations[0].wear-duration*.025)<1e-6);assert.equal(p.ps2OpenSeat(s,0),null);
 until(s,()=>c.stage==='leaving');assert.equal(c.ps2StationIndex,undefined);assert.equal(p.ps2OpenSeat(s,0),0);
 assert.equal(s.ps2Sessions,1);assert.equal(s.ps2Revenue,expected);assert.equal(isValidSave(s),true);
});
test('navigation reaches the lateral approach and never crosses the console table',()=>{
 const s=installed(),c=visitor();s.customers=[c];tryServe(s,c);const pos=p.ps2StationPoint(s,0);
 assert.equal(canTraverseLocalStep(s,{x:pos.x+.5,y:pos.y-.2},{x:pos.x+.5,y:pos.y+.8}),false);
 let visitedSide=false,prior={x:c.x,y:c.y};const side=p.ps2SeatApproach(s,0);
 for(let i=0;i<160&&c.stage==='to_pc';i++){
  minute(s);assert.ok(Math.hypot(c.x-prior.x,c.y-prior.y)<=.381,'no teleport');
  assert.ok(canTraverseLocalStep(s,prior,c),'no solid crossing');
  visitedSide ||= Math.hypot(c.x-side.x,c.y-side.y)<.05;prior={x:c.x,y:c.y};
 }
 assert.equal(c.stage,'sitting');assert.equal(visitedSide,true);
 assert.ok(navigableRoute(s,c,{x:7.2,y:5.72}));
});
test('two paying visitors occupy different PS2 seats and play together on one physical copy',()=>{
 const s=installed(true),a=visitor(5,60);s.customers=[a];tryServe(s,a);until(s,()=>a.stage==='using');
 const b=visitor(10,45);s.customers.push(b);s.counterBusyUntil=0;tryServe(s,b);
 assert.equal(a.ps2SeatIndex,0);assert.equal(b.ps2SeatIndex,1);assert.equal(p.ps2OpenSeat(s,0),null);
 assert.equal(s.ps2Sessions,2);assert.equal(s.ps2Revenue,7);assert.equal(p.ps2GameCopies(s,'cidade-em-fuga'),1);
 until(s,()=>b.stage==='using');assert.equal(a.stage,'using');assert.equal(isValidSave(s),true);
 assert.equal(p.repairPs2(s,0).ok,false);assert.equal(p.setPs2Power(s,0,false).ok,false);assert.equal(p.setPs2StationGame(s,0,null).ok,false);
});
test('economy falls back to affordable PS1 or PC; consoles do not create money while empty',()=>{
 const s=installed(),cash=s.cash,revenue=s.revenue;s.pcPoweredOff=[true,true,true];s.rng=0;
 assert.ok(visitorArrivalChance(s,0)>0);s.ps2Stations[0].poweredOff=true;assert.equal(visitorArrivalChance(s,0),0);
 stepGame(s,1);assert.equal(s.cash,cash);assert.equal(s.revenue,revenue);assert.equal(s.ps2Sessions,undefined);
 s.ps2Stations[0].poweredOff=false;const c=visitor();c.wallet=.1;s.customers=[c];tryServe(s,c);
 assert.equal(c.ps2StationIndex,undefined);assert.equal(s.cash,cash);
});
test('energy accrues once, wear blocks new sessions, repair and standby power are real expenses',()=>{
 const s=installed(),standby=p.ps2EnergyCostPerMinute(s);assert.equal(standby,.00015);
 const c=visitor();s.customers=[c];tryServe(s,c);until(s,()=>c.stage==='using');assert.equal(p.ps2EnergyCostPerMinute(s),.0012);
 const bill=s.energyAccrued??0;stepGame(s,1);assert.ok(s.energyAccrued>=bill+.0012);
 s.customers=[];s.ps2Stations[0].wear=100;assert.equal(p.ps2OpenSeat(s,0),null);
 const cash=s.cash,expenses=s.expenses,price=p.ps2RepairPrice(s);ok(p.repairPs2(s,0));
 assert.equal(s.cash,Math.round((cash-price)*100)/100);assert.equal(s.expenses,expenses+price);assert.equal(s.ps2Stations[0].wear,0);
 assert.equal(p.repairPs2(s,0).ok,false);ok(p.setPs2Power(s,0,false));assert.equal(p.ps2EnergyCostPerMinute(s),0);assert.equal(p.ps2OpenSeat(s,0),null);
});
test('closing stops contracts and releases PS2 only after standing; table stays in the salon',()=>{
 const s=installed(),c=visitor();s.customers=[c];tryServe(s,c);until(s,()=>c.stage==='using');
 s.totalMinutes=8*360*DAY_MINUTES+690;let standing=false;for(let n=0;n<30;n++){stepGame(s,1);standing ||= c.stage==='standing';if(c.stage==='leaving')break;}
 assert.equal(standing,true);assert.equal(c.stage,'leaving');assert.equal(c.ps2StationIndex,undefined);assert.equal(s.ps2Stations.length,1);
 const late=visitor(20);s.customers.push(late);s.counterBusyUntil=0;tryServe(s,late);assert.equal(late.ps2StationIndex,undefined);assert.equal(s.ps2Sessions,1);
});
test('old saves and in-flight contracts roundtrip without repeated payment, rate or lost inventory',()=>{
 const old=game(2005);assert.equal(isValidSave(old),true);const imported=parseImportedSave(serializeSave(old));assert.equal(imported.ps2Stations,undefined);
 const s=installed(true),c=visitor();s.customers=[c];tryServe(s,c);minute(s);
 const r=parseImportedSave(serializeSave(s));assert.deepEqual(r.ps2Stations,s.ps2Stations);assert.deepEqual(r.ps2Games,s.ps2Games);
 for(let n=0;n<100;n++){minute(s);minute(r);}
 assert.deepEqual(JSON.parse(JSON.stringify(snapshotGameState(r))),JSON.parse(JSON.stringify(snapshotGameState(s))));
 assert.equal(r.ps2Sessions,1);assert.equal(r.ps2Revenue,3);
});
test('save validation rejects duplicate stations, insufficient copies, invalid money, year, layout and seat owners',()=>{
 const original=installed(true);
 const corrupt=[s=>s.ps2Stations.push({...s.ps2Stations[0]}),s=>s.ps2Stations[0].gameId='gol-de-rua',
  s=>s.ps2Games['cidade-em-fuga']=-1,s=>s.ps2Games['cidade-em-fuga']=4,s=>s.ps2Games=[],s=>s.ps2Stations[0].wear=NaN,
  s=>s.ps2HourlyPrice=Infinity,s=>s.ps2HourlyPrice=.7,s=>s.ps2Revenue=-1,s=>s.ps2Revenue=.001,s=>s.ps2Sessions=-2,
  s=>s.totalMinutes=7*360*DAY_MINUTES,s=>{s.ps1Stations=[{slotId:'floor-2',wear:0}];},
  s=>{s.objectPlacements=[{id:'pc:1',x:2.5,y:5,rotation:0}];},
  s=>{s.furniture={poster:0,plant:1,table:0};s.furniturePlacements=[{kind:'plant',slotId:'floor-2'}];},
  s=>s.interiorWalls=[{axis:'x',x:2,y:5}],
  s=>s.customers=[{...visitor(),ps2StationIndex:9,stage:'using'}],
  s=>s.customers=[{...visitor(),ps2StationIndex:0,ps2SeatIndex:2,stage:'using'}],
  s=>s.customers=[{...visitor(),ps2StationIndex:0,ps1StationIndex:0,stage:'using'}],
  s=>s.customers=[{...visitor(),ps2StationIndex:0,stage:'using'},{...visitor(10),ps2StationIndex:0,stage:'using'}]];
 for(const mutate of corrupt){const s=structuredClone(original);mutate(s);assert.equal(isValidSave(s),false,mutate.toString());assert.throws(()=>parseImportedSave(serializeSave(s)));}
 const missing=game();missing.customers=[{...visitor(),ps2StationIndex:0,stage:'using'}];assert.equal(isValidSave(missing),false);
 const seat=installed();seat.customers=[{...visitor(),ps2StationIndex:0,ps2SeatIndex:1,stage:'using'}];assert.equal(isValidSave(seat),false);
});
test('layout editing and walls cannot invade a PS2; PS1 shop also sees its occupied slot',()=>{
 const s=installed();assert.equal(ps1PlacementSlots(s).some(p=>p.id==='floor-2'),false);
 assert.equal(moveLayoutObject(s,'pc:1',{x:2.5,y:5},0).ok,false);
 assert.equal(buildWall(s,{axis:'x',x:2,y:5}).ok,false);
});
test('application follows restored game and reports PS2 separately in finance',()=>{
 let s=installed(),port=createPs2Port(()=>s);assert.equal(port.snapshot().games.length,5);assert.equal(port.snapshot().count,1);
 const c=visitor();s.customers=[c];tryServe(s,c);
 const v=port.snapshot();assert.equal(v.occupied,1);assert.equal(v.sessions,1);assert.equal(v.revenue,3);
 const financial=createFinancialAdminOverviewPort(()=>s).snapshot();assert.match(financial.activity,/PCs 0/);assert.match(financial.activity,/PS2 1/);
 s=parseImportedSave(serializeSave(s));assert.equal(port.snapshot().sessions,1);assert.equal(port.setGame(-1,'').ok,false);
 assert.equal(port.buyGame('turbo-circuito').ok,false);assert.equal(port.changePrice(NaN).ok,false);
});
test('economical visitors keep using PS1, GPU gamers keep their PCs, PS2 has no forced conversion',()=>{
 const s=installed();ok(buyPs1Station(s,'floor-1'));ok(buyPs1Disc(s,'gol-de-rua'));
 ok(setPs1HourlyPrice(s,1.5));const c=visitor(5);c.preference='economy';s.customers=[c];tryServe(s,c);
 assert.equal(c.ps1StationIndex,0);assert.equal(c.ps2StationIndex,undefined);
 const pcs=installed(),gamer=visitor(5);gamer.gpuGamer=true;pcs.customers=[gamer];tryServe(pcs,gamer);
 assert.notEqual(gamer.pcIndex,null);assert.equal(gamer.ps2StationIndex,undefined);
});
test('full counter queue rejects extra arrivals without fabricated PS2 customers or revenue',async()=>{
 const {spawn}=await import('../dist/js/sim/customerArrival.js');const {MAX_COUNTER_QUEUE,counterQueueSlot}=await import('../dist/js/sim/checkoutQueue.js');
 const s=installed();s.customers=Array.from({length:MAX_COUNTER_QUEUE},(_,i)=>({...visitor(i+20),...counterQueueSlot(i,s),target:counterQueueSlot(i,s),queueIndex:i}));
 const before=s.customers.length,cash=s.cash;spawn(s);assert.equal(s.customers.length,before);assert.equal(s.cash,cash);assert.equal(s.ps2Sessions,undefined);
});
test('PS2 scene interpolation retains console and seat through the final standing frame',async()=>{
 const {SceneMotion}=await import('../dist/js/render/motion.js');const s=installed(),c=visitor();s.customers=[c];tryServe(s,c);until(s,()=>c.stage==='standing');
 c.poseMinutes=2;const motion=new SceneMotion();motion.capture(s);minute(s);const sample=motion.sample(s,.5).customers[0];
 assert.equal(sample.stage,'standing');assert.equal(sample.ps2StationIndex,0);assert.equal(sample.ps2SeatIndex,0);
 assert.equal(c.ps2StationIndex,undefined);
});
test('PS2 energy is not also assigned to a PC and its monthly forecast includes the console',async()=>{
 const {energyCostPerMinute,energyMonthlyEstimate}=await import('../dist/js/sim/economy.js');
 const s=installed(),base=energyCostPerMinute(s),c=visitor();s.customers=[c];tryServe(s,c);until(s,()=>c.stage==='using');
 assert.equal(energyCostPerMinute(s),base,'PS2 player must not raise PC active energy');
 const without={...s,customers:[],ps2Stations:[]};
 assert.ok(energyMonthlyEstimate(s)>energyMonthlyEstimate(without));
 const later={...s,totalMinutes:22*360*DAY_MINUTES};assert.ok(p.ps2EnergyCostPerMinute(later)>p.ps2EnergyCostPerMinute(s));
});
test('PS2 visitors never inflate the PC HUD, operations or computer utilization',async()=>{
 const {liveStatusSnapshot}=await import('../dist/js/application/presentationModels.js');
 const {createPcOperationsPort}=await import('../dist/js/application/pcOperationsPort.js');
 const {recordComputerUtilization}=await import('../dist/js/sim/financialReview.js');
 const s=installed(),c=visitor();s.customers=[c];tryServe(s,c);until(s,()=>c.stage==='using');
 assert.equal(liveStatusSnapshot(s,'Discada').occupied,0);assert.match(createPcOperationsPort(()=>s).summary(),/0 ocupados/);
 const used=s.monthPcUsedMinutes;recordComputerUtilization(s);assert.equal(s.monthPcUsedMinutes,used);
});
