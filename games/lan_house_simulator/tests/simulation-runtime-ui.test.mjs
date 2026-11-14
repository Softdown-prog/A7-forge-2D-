import {sourceModule,assertCompositionAdaptersExclude,assertSourceCall,assertCallsInOrder} from "./helpers/composition.mjs";
import assert from "node:assert/strict";
import test from "node:test";
import {createGame,stepGame,pcCount} from "../dist/js/sim/engine.js";
import {expandShop} from "../dist/js/sim/economy.js";

test("menu inicial impede autoplay e oferece partida, continuar e opções",async()=>{
 const {readFileSync}=await import("node:fs");
 const {resolve,dirname}=await import("node:path");
 const {fileURLToPath}=await import("node:url");
 const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
 const html=readFileSync(resolve(root,"index.html"),"utf8");
  // React owns button markup; the stable shell and real browser flows are still tested.
  for(const id of ["start-screen","option-sound","react-menu-actions","react-topbar-actions"])
   assert.ok(html.includes('id="'+id+'"'),id);
  const react=readFileSync(resolve(root,"src/react/entry.jsx"),"utf8");
  for(const id of ["menu-new","menu-continue","menu-options","open-menu"])
   assert.ok(react.includes('id="'+id+'"'),"React button: "+id);
  assert.match(react,/flushSync\(/,"React controls are mounted before event handlers");
 assert.match(sourceModule("ui/runtimeLoop.ts"),/frameSimulation\.run\(\{/);
 assertSourceCall("application/gameFramePort.ts","stepGame",["getState()","minutes"]);
 const frame=readFileSync(resolve(root,"src/application/frameActivity.ts"),"utf8");
 assert.match(frame,/advanceSimulation=input\.playing&&!input\.accountOpen&&!input\.editingLayout/);
 for(const condition of ["placingFurniture","relocatingFurniture","editingWalls","installingAnnexPc"])
  assert.ok(frame.includes("!input."+condition),condition);
 assert.match(sourceModule("ui/runtimeSessionController.ts"),/if\(!state\.isPlaying\)return;/);
 assertCallsInOrder("bootstrap/bootstrapGame.ts",["session.showMenu","loop.start"]);
});

test("exportação e importação preservam a partida e rejeitam JSON inválido",async()=>{
 const {serializeSave,parseImportedSave}=await import("../dist/js/sim/saveTransfer.js");
 const s=createGame();s.cash=1245;s.pricePerHour=16;s.inventory.snacks=33;s.pcTiers=[1,3,1];
 const text=serializeSave(s), restored=parseImportedSave(text);
 assert.deepEqual(restored,s);assert.notEqual(restored,s);
 assert.throws(()=>parseImportedSave("{broken"),/JSON inválido/);
 assert.throws(()=>parseImportedSave(JSON.stringify(s)),/incompatível/);
 const edited=JSON.parse(text);edited.state.inventory.snacks=-200;
 assert.throws(()=>parseImportedSave(JSON.stringify(edited)),/fora dos limites/);
 const tooLong="x".repeat(2_000_001);assert.throws(()=>parseImportedSave(tooLong),/muito grande/);
});

test("compras de computadores e móveis cobram e persistem sem alterar saves legados",async()=>{
 const {buyComputer,buyFurniture}=await import("../dist/js/sim/shop.js");
 const s=createGame();
 assert.equal(buyComputer(s).ok,false);
 assert.equal(expandShop(s).ok,true);
 assert.equal(pcCount(s),3);
 s.cash=1000;
 assert.equal(buyComputer(s).ok,true);assert.equal(pcCount(s),4);
 assert.equal(s.pcTiers?.[3],1);
 const before=s.cash;
 assert.equal(buyFurniture(s,"poster").ok,true);assert.equal(s.cash,before-45);
 assert.equal(buyFurniture(s,"plant").ok,true);
 assert.equal(buyFurniture(s,"table").ok,true);
 assert.equal(buyFurniture(s,"table").ok,true);
 const legacy=createGame();delete legacy.installedPcs;legacy.expansionLevel=1;
 assert.equal(pcCount(legacy),5);
});

test("colocação guiada só cobra na confirmação e impede colisão",async()=>{
 const {placeFurniture,availablePlacementSlots,occupiedFurnitureSlots}=await import("../dist/js/sim/shop.js");
 const {serializeSave,parseImportedSave}=await import("../dist/js/sim/saveTransfer.js");
 const s=createGame(); const cash=s.cash;
 assert.ok(availablePlacementSlots(s,"plant").length>4);
 assert.equal(placeFurniture(s,"plant","wall-1").ok,false);
 assert.equal(s.cash,cash);
 assert.equal(placeFurniture(s,"plant","floor-1").ok,true);
 assert.equal(s.cash,cash-85);
 assert.equal(occupiedFurnitureSlots(s).has("floor-1"),true);
 assert.equal(placeFurniture(s,"table","floor-1").ok,false);
 assert.equal(placeFurniture(s,"table","floor-2").ok,true);
 assert.equal(placeFurniture(s,"poster","floor-3").ok,false);
 assert.equal(placeFurniture(s,"poster","wall-1").ok,true);
 assert.deepEqual(parseImportedSave(serializeSave(s)).furniturePlacements,s.furniturePlacements);
 const tampered=JSON.parse(serializeSave(s));
 tampered.state.furniturePlacements[0].slotId="wall-1";
 assert.throws(()=>parseImportedSave(JSON.stringify(tampered)),/Posicionamento/);
});
test("móveis antigos reservam espaços para não haver duplicação",async()=>{
 const {buyFurniture,placeFurniture,occupiedFurnitureSlots}=await import("../dist/js/sim/shop.js");
 const s=createGame();s.cash=1000;
 assert.equal(buyFurniture(s,"plant").ok,true);
 assert.equal(occupiedFurnitureSlots(s).has("floor-1"),true);
 assert.equal(placeFurniture(s,"plant","floor-1").ok,false);
 assert.equal(placeFurniture(s,"plant","floor-3").ok,true);
 assert.equal(s.furniture?.plant,2);
 assert.equal(s.furniturePlacements?.length,2);
});

test("reorganizar móveis existentes preserva caixa, despesas, posse e save",async()=>{
 const {placeFurniture,relocateFurniture,furnitureLocations,availablePlacementSlots,occupiedFurnitureSlots}=await import("../dist/js/sim/shop.js");
 const {serializeSave,parseImportedSave}=await import("../dist/js/sim/saveTransfer.js");
 const s=createGame();s.cash=2000;
 assert.equal(placeFurniture(s,"plant","floor-1").ok,true);
 assert.equal(placeFurniture(s,"table","floor-2").ok,true);
 assert.equal(placeFurniture(s,"poster","wall-1").ok,true);
 const before=JSON.stringify({cash:s.cash,expenses:s.expenses,furniture:s.furniture});
 const old=JSON.stringify(s.furniturePlacements);
 assert.equal(relocateFurniture(s,"floor-1","floor-2").ok,false);
 assert.equal(relocateFurniture(s,"floor-1","wall-2").ok,false);
 assert.equal(relocateFurniture(s,"unknown","floor-3").ok,false);
 assert.equal(relocateFurniture(s,"floor-1","floor-1").ok,false);
 assert.equal(JSON.stringify(s.furniturePlacements),old);
 assert.equal(relocateFurniture(s,"floor-1","floor-3").ok,true);
 assert.equal(JSON.stringify({cash:s.cash,expenses:s.expenses,furniture:s.furniture}),before);
 assert.equal(s.furniturePlacements.find(p=>p.kind==="plant").slotId,"floor-3");
 assert.equal(occupiedFurnitureSlots(s).has("floor-1"),false);
 assert.equal(availablePlacementSlots(s,"plant").some(p=>p.id==="floor-1"),true);
 assert.equal(furnitureLocations(s).length,3);
 const recovered=parseImportedSave(serializeSave(s));
 assert.deepEqual(recovered.furniturePlacements,s.furniturePlacements);
 assert.equal(recovered.cash,s.cash);assert.equal(recovered.expenses,s.expenses);
});
test("reposicionamento de save antigo converte móveis com segurança sem recomprar",async()=>{
 const {buyFurniture,relocateFurniture,furnitureLocations,validFurniturePlacements}=await import("../dist/js/sim/shop.js");
 const s=createGame();s.cash=2000;
 assert.equal(buyFurniture(s,"plant").ok,true);
 assert.equal(buyFurniture(s,"poster").ok,true);
 delete s.furniturePlacements; // Simulate an actual pre-placement save.
 assert.equal(s.furniturePlacements,undefined);
 const snapshot={cash:s.cash,expenses:s.expenses,furniture:JSON.stringify(s.furniture)};
 assert.equal(relocateFurniture(s,"floor-1","floor-4").ok,true);
 assert.deepEqual([...s.furniturePlacements].sort((a,b)=>a.kind.localeCompare(b.kind)),[{kind:"plant",slotId:"floor-4"},{kind:"poster",slotId:"wall-1"}].sort((a,b)=>a.kind.localeCompare(b.kind)));
 assert.equal(validFurniturePlacements(s),true);
 assert.equal(furnitureLocations(s).length,2);
 assert.deepEqual({cash:s.cash,expenses:s.expenses,furniture:JSON.stringify(s.furniture)},snapshot);
 assert.equal(relocateFurniture(s,"floor-1","floor-3").ok,false);
});
test("modo de organizar fica disponível no catálogo sem afetar a compra",async()=>{
 const {readFileSync}=await import("node:fs");
 const {resolve,dirname}=await import("node:path");
 const {fileURLToPath}=await import("node:url");
 const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
 const html=readFileSync(resolve(root,"index.html"),"utf8");
 assert.match(html,/id="organize-furniture"/);
 assert.match(sourceModule("ui/placementController.ts"),/placementActions\.move\(state\.placement\.relocationFrom,slot.id\)/);
 assert.match(readFileSync(resolve(root,"src/application/placementActionsPort.ts"),"utf8"),/relocateFurniture\(getState\(\),from,to\)/);
 assert.match(sourceModule("ui/runtimeLoop.ts"),/frameSimulation\.run\(\{/);
 assertSourceCall("application/gameFramePort.ts","stepGame",["getState()","minutes"]);
 assert.match(sourceModule("ui/runtimeLoop.ts"),/relocatingFurniture:state.placement.relocating,editingWalls:!!state.placement.wallMode,installingAnnexPc:state.placement.installingAnnexPc/);
});

test("audio uses independent volume hierarchy and a bounded gentle typing phrase",async()=>{
 const {AUDIO_LEVELS,KEYBOARD_DURATION,keyboardPattern}=await import("../dist/js/audio/soundscape.js");
 assert.ok(AUDIO_LEVELS.keyboard<AUDIO_LEVELS.mouse);
 assert.ok(AUDIO_LEVELS.mouse<AUDIO_LEVELS.smallSale);
 assert.ok(AUDIO_LEVELS.smallSale<AUDIO_LEVELS.income);
 assert.equal(KEYBOARD_DURATION,3.5);
 const strokes=keyboardPattern();
 assert.ok(strokes.length>=18&&strokes.length<=28);
 assert.ok(strokes[0].at>=0&&strokes.at(-1).at<KEYBOARD_DURATION);
 assert.ok(strokes.some((s,i)=>i>0&&Math.abs(s.at-strokes[i-1].at-0.156)>0.005));
 assert.ok(strokes.every(x=>x.strength>0&&x.strength<=1));
});
test("session transition emits a single keyboard event, never per gameplay frame",()=>{
 const s=createGame();
 s.customers=[{id:601,x:2.55,y:1.92,target:{x:2.55,y:1.92},route:[],stage:"sitting",pcIndex:0,
  costume:"regular",poseMinutes:2,usedMinutes:0,waitingMinutes:0,offlineWait:0,happy:true}];
 stepGame(s,1);
 assert.equal(s.customers[0].stage,"using");
 assert.deepEqual(s.keyboardEffects,[{customerId:601,pcIndex:0}]);
 stepGame(s,5);
 assert.equal(s.keyboardEffects.length,1,"no new keyboard sound for an ongoing session");
});
test("UI click audio uses one delegated handler and game money is event-driven",async()=>{
 const {readFileSync}=await import("node:fs");
 const {resolve,dirname}=await import("node:path");
 const {fileURLToPath}=await import("node:url");
 const audioUi=readFileSync(resolve(dirname(fileURLToPath(import.meta.url)),"../src/ui/soundInputBindings.ts"),"utf8");
 assert.match(sourceModule("bootstrap/bootstrapGame.ts"),/installSoundInputBindings\(document,soundscape\)/);
 assert.match(audioUi,/doc\.addEventListener\("click",event=>/);
  const feedback=readFileSync(resolve(dirname(fileURLToPath(import.meta.url)),"../src/application/frameFeedbackPort.ts"),"utf8");
  assert.match(sourceModule("application/gameFramePort.ts"),/createFrameFeedbackPort\(getState,audio/);
  const dispatch=readFileSync(resolve(dirname(fileURLToPath(import.meta.url)),"../src/application/frameEventDispatch.ts"),"utf8");
  assert.match(sourceModule("application/gameFramePort.ts"),/dispatchFrameEvents\(\{/);
  assert.match(dispatch,/options\.feedback\.payments\(options\.playing\)/);
  assert.match(feedback,/audio\.income\("payment"\)/);
  assert.match(dispatch,/options\.feedback\.sales\(options\.playing\)/);
  assert.match(feedback,/audio\.income\("sale"\)/);
  assert.match(dispatch,/options\.feedback\.keyboards\(options\.playing\)/);
  assert.match(feedback,/audio\.keyboard\(\)/);
 assertCompositionAdaptersExclude(/new Audio\(/);
 assertCompositionAdaptersExclude(/playOriginalSound/);
});
