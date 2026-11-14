import {sourceModule,assertSourceCall} from "./helpers/composition.mjs";
import {withStationOff} from "./station-power-fixture.mjs";
import assert from "node:assert/strict";
import test from "node:test";
import {createGame,stepGame,pcCount,pcWear} from "../dist/js/sim/engine.js";
import {repairComputer,expandShop} from "../dist/js/sim/economy.js";

test("mapa amplia 10 tiles norte, leste e oeste; porta sul não muda",async()=>{
 const {roomBounds,expandDirection,validRoomExtensions}=await import("../dist/js/sim/room.js");
 const {entrance}=await import("../dist/js/sim/engine.js");
 const {serializeSave,parseImportedSave}=await import("../dist/js/sim/saveTransfer.js");
 const s=createGame();s.cash=50000;
 assert.deepEqual(roomBounds(s),{minX:0,maxX:8,minY:0,maxY:6});
 for(const dir of ["west","east","north"]){
   for(let i=0;i<5;i++)assert.equal(expandDirection(s,dir).ok,true,dir+i);
   assert.equal(expandDirection(s,dir).ok,false,"limite em "+dir);
 }
 assert.deepEqual(roomBounds(s),{minX:-10,maxX:18,minY:-10,maxY:6});
 assert.deepEqual(entrance(s),{x:7.5,y:5.35});
 assert.equal(expandDirection(s,"south").ok,false);
 assert.equal(validRoomExtensions(s),true);
 assert.deepEqual(roomBounds(parseImportedSave(serializeSave(s))),roomBounds(s));
 const legacy=createGame();legacy.roomExtensions={west:2,east:1,south:2};
 assert.equal(validRoomExtensions(legacy),true);
 assert.deepEqual(roomBounds(legacy),{minX:-4,maxX:10,minY:0,maxY:10});
 assert.deepEqual(entrance(legacy),{x:7.5,y:5.35});
 const bad=JSON.parse(serializeSave(s));bad.state.roomExtensions.north=15;
 assert.throws(()=>parseImportedSave(JSON.stringify(bad)),/Extensões/);
});
test("a câmera contém cantos do piso expandido, incluindo paredes e espessura da plataforma",async()=>{
 const {cameraForGame,iso}=await import("../dist/js/render/isometric.js");
 const {roomBounds}=await import("../dist/js/sim/room.js");
 const s=createGame();s.expansionLevel=2;s.roomExtensions={west:5,east:5,south:0,north:5};
 const b=roomBounds(s),camera=cameraForGame(s);
 for(const x of [b.minX,b.maxX])for(const y of [0,b.maxY])for(const z of [0,155,-24]){
  const projected=iso({x,y},camera,z);
  assert.ok(projected.x>15&&projected.x<985,"projeção X dentro do canvas: "+JSON.stringify(projected));
  assert.ok(projected.y>8&&projected.y<600,"projeção Y dentro do canvas: "+JSON.stringify(projected));
 }
});
test("slots novos têm bloqueio de ocupação e móveis de piso giram pelas quatro direções",async()=>{
 const {expandDirection}=await import("../dist/js/sim/room.js");
 const {furnitureSlots,placeFurniture,rotateFurniture,relocateFurniture,validFurniturePlacements}=await import("../dist/js/sim/shop.js");
 const {serializeSave,parseImportedSave}=await import("../dist/js/sim/saveTransfer.js");
 const s=createGame();s.cash=10000;
 for(const dir of ["west","east","north"])assert.equal(expandDirection(s,dir).ok,true);
 const ids=furnitureSlots(s).map(x=>x.id);
 for(const id of ["floor-west-1","floor-east-1","floor-north-1-a","wall-west-1","wall-east-1"])assert.ok(ids.includes(id),id);
 assert.equal(placeFurniture(s,"table","floor-north-1-a").ok,true);
 const previous={cash:s.cash,expenses:s.expenses};
 for(let n=1;n<=4;n++){
  assert.equal(rotateFurniture(s,"floor-north-1-a").ok,true);
  assert.equal(s.furniturePlacements.find(p=>p.slotId==="floor-north-1-a")?.rotation,n%4);
 }
 assert.deepEqual({cash:s.cash,expenses:s.expenses},previous);
 assert.equal(relocateFurniture(s,"floor-north-1-a","floor-west-1").ok,true);
 assert.equal(s.furniturePlacements.find(p=>p.slotId==="floor-west-1")?.rotation,0);
 assert.equal(validFurniturePlacements(s),true);
 assert.deepEqual(parseImportedSave(serializeSave(s)).furniturePlacements,s.furniturePlacements);
 assert.equal(rotateFurniture(s,"missing").ok,false);
});
test("ampliação norte/leste/oeste não move a porta nem desvia a saída",async()=>{
 const {expandDirection}=await import("../dist/js/sim/room.js");
 const {entrance}=await import("../dist/js/sim/engine.js");
 const s=createGame();s.cash=9000;
 const original=entrance(s);
 assert.equal(expandDirection(s,"north").ok,true);
 assert.equal(expandDirection(s,"east").ok,true);
 assert.equal(expandDirection(s,"west").ok,true);
 assert.deepEqual(entrance(s),original);
});
test("interfaces responsivas possuem expansão direcional e controle de rotação",async()=>{
 const {readFileSync}=await import("node:fs");const {resolve,dirname}=await import("node:path");
 const {fileURLToPath}=await import("node:url");
 const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
 const html=readFileSync(resolve(root,"index.html"),"utf8");
 assert.match(html,/id="rotate-furniture"/);
 assertSourceCall("ui/runtimeControls.ts","installShopControls",["shopCatalog","ports.shopActions"]);
  const port=readFileSync(resolve(root,"src/application/shopActionsPort.ts"),"utf8");
  assert.match(port,/expandDirection\(s,direction\)/);
 assert.match(sourceModule("ui/placementController.ts"),/placementActions\.rotate\(state\.placement\.relocationFrom\)/);
  assert.match(readFileSync(resolve(root,"src/application/placementActionsPort.ts"),"utf8"),/rotateFurniture\(getState\(\),id\)/);
 // The grid may change with the visual identity. capture_identity.mjs verifies
 // actual overflow and interaction at 1440, 414 and 360 pixels in Chromium.
 assert.match(html,/name="viewport"[^>]+width=device-width/);
});

test("a ampliação libera slots e capacidade real para novas decorações",async()=>{
 const {expandDirection}=await import("../dist/js/sim/room.js");
 const {furnitureLimit,placeFurniture,furnitureLocations,validFurniturePlacements,availablePlacementSlots}=await import("../dist/js/sim/shop.js");
 const {serializeSave,parseImportedSave}=await import("../dist/js/sim/saveTransfer.js");
 const s=createGame();s.cash=20000;
 for(const dir of ["west","east","north"])assert.equal(expandDirection(s,dir).ok,true);
 assert.ok(furnitureLimit(s,"poster")>=5);
 assert.ok(furnitureLimit(s,"plant")>6);
 assert.ok(furnitureLimit(s,"table")>4);
 for(const id of availablePlacementSlots(s,"poster").slice(0,4).map(p=>p.id))
  assert.equal(placeFurniture(s,"poster",id).ok,true,id);
 for(const id of ["floor-1","floor-2","floor-west-1","floor-east-1","floor-north-1-a","floor-north-1-b"])
  assert.equal(placeFurniture(s,"plant",id).ok,true,id);
 assert.equal(placeFurniture(s,"plant","floor-3").ok,true,"capacidade depende do espaço livre");
 assert.equal(furnitureLocations(s).length,11);
 assert.equal(validFurniturePlacements(s),true);
 assert.equal(parseImportedSave(serializeSave(s)).furniturePlacements.length,11);
});

test("parede interna tem prévia, custo, bloqueio das rotas e remoção sem reembolso",async()=>{
 const {buildWall,removeWall,canBuildWall,wallCandidates,WALL_COST,wallZoneCount}=await import("../dist/js/sim/walls.js");
 const {serializeSave,parseImportedSave}=await import("../dist/js/sim/saveTransfer.js");
 const {expandDirection}=await import("../dist/js/sim/room.js");
 const s=createGame();s.cash=10000;
 assert.equal(expandDirection(s,"north").ok,true);
 assert.ok(wallCandidates(s).length>70);
 assert.equal(WALL_COST,30);
 const wall={axis:"x",x:1,y:-1};
 assert.equal(canBuildWall(s,wall),true);
 const before=s.cash;
 assert.equal(buildWall(s,wall).ok,true);
 assert.equal(s.cash,before-30);
 assert.equal(buildWall(s,wall).ok,false);
 assert.equal(s.cash,before-30);
 assert.deepEqual(parseImportedSave(serializeSave(s)).interiorWalls,[wall]);
 assert.equal(removeWall(s,wall).ok,true);
 assert.equal(s.cash,before-30);
 assert.equal(removeWall(s,wall).ok,false);
 assert.equal(wallZoneCount(s),1);
});
test("paredes podem desviar trajetos e respeitam bordas externas",async()=>{
 const {buildWall,canBuildWall,validInteriorWalls}=await import("../dist/js/sim/walls.js");
 const s=createGame();s.cash=10000;
 assert.equal(buildWall(s,{axis:"x",x:2,y:0}).ok,false);
 assert.equal(buildWall(s,{axis:"x",x:2,y:6}).ok,false);
 assert.equal(buildWall(s,{axis:"y",x:0,y:2}).ok,false);
 // Segmento transversal ao corredor principal dos clientes.
 assert.equal(canBuildWall(s,{axis:"y",x:4,y:4}),true);
 assert.equal(validInteriorWalls(s),true);
});
test("paredes criam setores físicos fechados na grade sem alterar os PCs",async()=>{
 const {buildWall,wallZoneCount}=await import("../dist/js/sim/walls.js");
 const {expandDirection}=await import("../dist/js/sim/room.js");
 const s=createGame();s.cash=12000;
 assert.equal(expandDirection(s,"north").ok,true);
 // Isola um tile no anexo norte, sem interferir nos fluxos dos computadores.
 for(const wall of [{axis:"x",x:1,y:-1},{axis:"x",x:1,y:0},
  {axis:"y",x:1,y:-1},{axis:"y",x:2,y:-1}]){
  assert.equal(buildWall(s,wall).ok,true,JSON.stringify(wall));
 }
 assert.ok(wallZoneCount(s)>=2);
});

test("anexo permite PC adicional com cobrança única e é salvo sem mudar PCs antigos",async()=>{
 const {expandDirection}=await import("../dist/js/sim/room.js");
 const {annexComputerSlots,installAnnexComputer,availableAnnexComputers}=await import("../dist/js/sim/stations.js");
 const {pcCount,pcPosition,createGame}=await import("../dist/js/sim/engine.js");
 const {serializeSave,parseImportedSave}=await import("../dist/js/sim/saveTransfer.js");
 const s=createGame();s.cash=5000;
 assert.equal(expandDirection(s,"north").ok,true);
 const p=pcPosition(0),slot=annexComputerSlots(s).find(x=>x.wing==="north");
 assert.ok(slot);
 const before=s.cash;
 assert.equal(installAnnexComputer(s,slot.id).ok,true);
 assert.equal(s.cash,before-320);assert.equal(pcCount(s),4);
 assert.deepEqual(pcPosition(0,s),p);
 assert.deepEqual(pcPosition(3,s),slot.position);
 assert.equal(installAnnexComputer(s,slot.id).ok,false);
 assert.equal(s.cash,before-320);
 assert.ok(!availableAnnexComputers(s).some(x=>x.id===slot.id));
 const restored=parseImportedSave(serializeSave(s));
 assert.deepEqual(restored.annexPcs,s.annexPcs);
 assert.deepEqual(pcPosition(3,restored),slot.position);
});
test("rotas existentes não mudam com paredes fora de seus corredores",async()=>{
 const {createGame,entrance}=await import("../dist/js/sim/engine.js");
 const {expandDirection}=await import("../dist/js/sim/room.js");
 const {buildWall}=await import("../dist/js/sim/walls.js");
 const {navigableRoute}=await import("../dist/js/sim/navigation.js");
 const {COUNTER_QUEUE,hallwayRoute}=await import("../dist/js/sim/route.js");
 const s=createGame();s.cash=5000;expandDirection(s,"north");
 const origin=entrance(s),before=hallwayRoute(origin,COUNTER_QUEUE);
 assert.equal(buildWall(s,{axis:"x",x:1,y:-1}).ok,true);
 assert.deepEqual(navigableRoute(s,origin,COUNTER_QUEUE),before);
});
test("converter parede em porta preserva a passagem e o contador de salas",async()=>{
 const {createGame}=await import("../dist/js/sim/engine.js");
 const {expandDirection}=await import("../dist/js/sim/room.js");
 const {buildWall,installInteriorDoor,removeInteriorDoor,wallZoneCount,validInteriorDoors}=await import("../dist/js/sim/walls.js");
 const {serializeSave,parseImportedSave}=await import("../dist/js/sim/saveTransfer.js");
 const {navigableRoute}=await import("../dist/js/sim/navigation.js");
 const s=createGame();s.cash=5000;expandDirection(s,"north");
 const segment={axis:"x",x:1,y:-1};
 assert.equal(buildWall(s,segment).ok,true);
 const cash=s.cash;
 assert.equal(installInteriorDoor(s,segment).ok,true);
 assert.equal(s.cash,cash-80);
 assert.equal(s.interiorWalls.length,0);assert.equal(s.interiorDoors.length,1);
 assert.equal(validInteriorDoors(s),true);
 assert.ok(navigableRoute(s,{x:1.5,y:-.5},{x:1.5,y:-1.5}));
 assert.deepEqual(parseImportedSave(serializeSave(s)).interiorDoors,s.interiorDoors);
 assert.equal(installInteriorDoor(s,segment).ok,false);
 assert.equal(removeInteriorDoor(s,segment).ok,true);
 assert.equal(s.interiorDoors.length,0);
});
test("manutenção e upgrades reconhecem os PCs nas expansões",async()=>{
 const {createGame,pcCount}=await import("../dist/js/sim/engine.js");
 const {expandDirection}=await import("../dist/js/sim/room.js");
 const {installAnnexComputer}=await import("../dist/js/sim/stations.js");
 const {upgradeComputer,repairComputer}=await import("../dist/js/sim/economy.js");
 const s=createGame();s.cash=6000;expandDirection(s,"east");
 assert.equal(installAnnexComputer(s,"pc-east-1").ok,true);
 assert.equal(pcCount(s),4);
 s.totalMinutes=2*360*720;
 assert.equal(withStationOff(s,3,()=>upgradeComputer(s,3)).ok,true);
 assert.equal(s.pcTiers[3],2);
 s.pcWear[3]=90;
 assert.equal(repairComputer(s,3).ok,true);
 assert.ok(s.repairJobs?.some(j=>j.pc===3));
 for(let i=0;i<120&&s.repairJobs?.length;i++)stepGame(s,1);
 assert.equal(s.pcWear[3],0);
});
test("índices dos anexos são preservados quando o jogador instala mais PCs tradicionais",async()=>{
 const {createGame,pcCount,pcPosition}=await import("../dist/js/sim/engine.js");
 const {expandDirection}=await import("../dist/js/sim/room.js");
 const {installAnnexComputer}=await import("../dist/js/sim/stations.js");
 const {expandShop}=await import("../dist/js/sim/economy.js");
 const {buyComputer}=await import("../dist/js/sim/shop.js");
 const s=createGame();s.cash=15000;expandDirection(s,"north");installAnnexComputer(s,"pc-north-1");
 s.pcTiers[3]=3;s.pcWear[3]=44;
 const pos=pcPosition(3,s);
 assert.equal(expandShop(s).ok,true);
 assert.equal(buyComputer(s).ok,true);
 assert.equal(pcCount(s),5);
 assert.deepEqual(pcPosition(4,s),pos);
 assert.equal(s.pcTiers[4],3);assert.equal(s.pcWear[4],44);
});

test("sala norte fechada obriga cliente a atravessar a porta até o PC adicional",async()=>{
 const {createGame,stepGame,pcCount,pcPosition,entrance}=await import("../dist/js/sim/engine.js");
 const {expandDirection}=await import("../dist/js/sim/room.js");
 const {buildWall,installInteriorDoor,wallZoneCount}=await import("../dist/js/sim/walls.js");
 const {installAnnexComputer}=await import("../dist/js/sim/stations.js");
 const {navigableRoute}=await import("../dist/js/sim/navigation.js");
 const {COUNTER_QUEUE,computerSeat}=await import("../dist/js/sim/route.js");
 const s=createGame();s.cash=20000;
 assert.equal(expandDirection(s,"north").ok,true);
 for(let x=0;x<8;x++)assert.equal(buildWall(s,{axis:"x",x,y:-1}).ok,true,"segmento "+x);
 const locked=navigableRoute(s,COUNTER_QUEUE,{x:5.35,y:-1.06});
 assert.equal(locked,null,"a porta não pode ser atravessada enquanto fechada");
 assert.equal(installAnnexComputer(s,"pc-north-1").ok,false,"sala sem entrada não recebe PC");
 assert.equal(installInteriorDoor(s,{axis:"x",x:4,y:-1}).ok,true);
 assert.equal(wallZoneCount(s),2,"duas salas mesmo com portal");
 assert.equal(installAnnexComputer(s,"pc-north-1").ok,true);
 assert.equal(pcCount(s),4);
 const {serializeSave,parseImportedSave}=await import("../dist/js/sim/saveTransfer.js");
 const restored=parseImportedSave(serializeSave(s));
 assert.equal(restored.interiorDoors.length,1);
 assert.equal(restored.interiorWalls.length,7);
 assert.equal(restored.annexPcs.length,1);
 const route=navigableRoute(s,COUNTER_QUEUE,computerSeat(pcPosition(3,s)));
 assert.ok(route&&route.some(p=>p.y< -1),"caminho passa para o lado norte da parede");
 const make=(id,stage,pcIndex,x,y)=>({id,stage,pcIndex,x,y,target:{x,y},route:[],
  costume:"regular",usedMinutes:0,sessionMinutes:300,waitingMinutes:0,offlineWait:0,happy:true,poseMinutes:0});
 s.customers=[
  make(1,"using",0,2.55,1.92),make(2,"using",1,4,1.92),make(3,"using",2,5.35,1.92),
  make(4,"waiting",null,COUNTER_QUEUE.x,COUNTER_QUEUE.y)
 ];
 stepGame(s,1);
 const customer=s.customers.find(c=>c.id===4);
 assert.equal(customer.stage,"to_pc");
 assert.equal(customer.pcIndex,3);
 assert.ok([customer.target,...customer.route].some(p=>p.y< -1));
 stepGame(s,55);
 assert.ok(["sitting","using","standing"].includes(customer.stage),"cliente chegou à área do anexo: "+customer.stage);
 assert.deepEqual(entrance(s),{x:7.5,y:5.35});
});
