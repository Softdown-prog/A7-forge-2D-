import {assertSourceCall} from "./helpers/composition.mjs";
import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createGame,isValidSave} from "../dist/js/sim/engine.js";
import {serializeSave,parseImportedSave} from "../dist/js/sim/saveTransfer.js";
import {placementStatusSnapshot} from "../dist/js/application/placementStatusPort.js";
import {renderPlacementStatus} from "../dist/js/ui/placementStatusPanel.js";
const initial={placingKind:null,placingName:null,relocating:false,relocationFrom:null,
 selectedFurnitureKind:null,wallMode:null,hasPendingWall:false,canBuildPendingWall:false,
 installingAnnexPc:false,notice:"",wallCost:75,annexPcCost:500};
const view=(changes={})=>placementStatusSnapshot({...initial,...changes});
test("estado neutro esconde ferramentas e não oferece comandos",()=>{
 const s=view();
 assert.deepEqual([s.toolbarVisible,s.stagePlacing,s.rotateHidden,s.rotateDisabled,
  s.confirmWallHidden,s.confirmWallDisabled,s.turnWallHidden,s.turnWallDisabled],
  [false,false,true,true,true,true,true,true]);
 assert.equal(s.hint,"");
});
test("decorações comuns giram, pôster mantém botão oculto e desabilitado",()=>{
 for(const [kind,name] of [["plant","planta"],["table","mesinha"]]){
  const s=view({placingKind:kind,placingName:name});
  assert.equal(s.toolbarVisible,true);assert.equal(s.rotateHidden,false);assert.equal(s.rotateDisabled,false);
  assert.equal(s.hint,"Escolha uma posição verde para "+name+". Clique para comprar e instalar; cancelar não cobra nada.");
 }
 const poster=view({placingKind:"poster",placingName:"pôster"});
 assert.equal(poster.rotateHidden,true);assert.equal(poster.rotateDisabled,true);
});
test("mover sem seleção, com seleção e com pôster mantém as orientações",()=>{
 const empty=view({relocating:true});
 assert.equal(empty.rotateHidden,true);assert.equal(empty.rotateDisabled,true);
 assert.equal(empty.hint,"Toque no móvel em dourado e escolha a nova posição. Sem custos.");
 const chosen=view({relocating:true,relocationFrom:"floor-2",selectedFurnitureKind:"table"});
 assert.equal(chosen.rotateHidden,false);assert.equal(chosen.rotateDisabled,false);
 assert.equal(chosen.hint,"Escolha o destino verde ou toque em Girar para mudar a orientação.");
 const poster=view({relocating:true,relocationFrom:"floor-2",selectedFurnitureKind:"poster"});
 assert.equal(poster.rotateHidden,false);assert.equal(poster.rotateDisabled,true);
});
test("divisórias só permitem confirmar quando a prévia é válida",()=>{
 const absent=view({wallMode:"build"});
 assert.equal(absent.confirmWallHidden,false);assert.equal(absent.confirmWallDisabled,true);
 assert.equal(absent.turnWallHidden,false);assert.equal(absent.turnWallDisabled,true);
 const blocked=view({wallMode:"build",hasPendingWall:true});
 assert.equal(blocked.confirmWallDisabled,true);assert.equal(blocked.turnWallDisabled,false);
 const valid=view({wallMode:"build",hasPendingWall:true,canBuildPendingWall:true,wallCost:95});
 assert.equal(valid.confirmWallDisabled,false);
 assert.equal(valid.hint,"Selecione a borda, confira a prévia e confirme. Cada segmento custa R$ 95.");
});
test("portas e remoções mostram mensagens e desativam o giro de parede",()=>{
 const door=view({wallMode:"door",hasPendingWall:true});
 assert.equal(door.confirmWallDisabled,false);assert.equal(door.turnWallHidden,true);
 assert.equal(door.hint,"Toque numa divisória para instalar uma porta: R$ 80.");
 const remove=view({wallMode:"remove",hasPendingWall:true});
 assert.equal(remove.confirmWallDisabled,false);
 assert.equal(remove.hint,"Toque numa divisória para remover parede ou porta.");
});
test("PC anexo prevalece na explicação e conserva regra de cobrança na vaga",()=>{
 const s=view({installingAnnexPc:true,wallMode:"build",relocating:true,annexPcCost:620});
 assert.equal(s.toolbarVisible,true);
 assert.equal(s.hint,"Escolha um círculo verde numa área ampliada (esquerda, direita ou fundos). PC completo: R$ 620. A cobrança só ocorre ao selecionar a vaga.");
});
test("aviso transitório se sobrepõe apenas enquanto um modo está ativo",()=>{
 for(const setting of [{installingAnnexPc:true},{wallMode:"door"},{relocating:true},{placingKind:"plant",placingName:"planta"}])
  assert.equal(view({...setting,notice:"Posição inválida."}).hint,"Posição inválida.");
 assert.equal(view({notice:"Posição inválida."}).hint,"");
});
test("UI conserva botões, seus estados, classe de stage e toolbar",()=>{
 const buttons=new Map(["#rotate-furniture","#confirm-wall","#turn-wall"].map(k=>[k,{hidden:true,disabled:true}]));
 const classes=new Set(),toolbar={hidden:true},help={textContent:"Antigo"};
 const stage={classList:{toggle:(name,active)=>active?classes.add(name):classes.delete(name)}};
 const dom={querySelector:selector=>buttons.get(selector)??null},els={toolbar,stage,help};
 renderPlacementStatus(view({wallMode:"build",hasPendingWall:true,canBuildPendingWall:true,notice:"Pronto."}),els,dom);
 assert.equal(toolbar.hidden,false);assert.equal(help.textContent,"Pronto.");
 assert.equal(classes.has("placing"),true);assert.equal(buttons.get("#confirm-wall").disabled,false);
 renderPlacementStatus(view(),els,dom);
 assert.equal(toolbar.hidden,true);assert.equal(help.textContent,"");
 assert.equal(classes.has("placing"),false);assert.equal(buttons.get("#confirm-wall").hidden,true);
 renderPlacementStatus(view(),{toolbar:null,stage:null,help:null},{querySelector:()=>null});
});
test("projeção não modifica RNG, caixa, tempo ou salvamento",()=>{
 const state=createGame(181,"historical"),before=JSON.stringify(state);
 assert.equal(view({placingKind:"plant",placingName:"planta"}).toolbarVisible,true);
 assert.equal(JSON.stringify(state),before);
 assert.equal(isValidSave(parseImportedSave(serializeSave(state))),true);
});
test("fronteiras mantêm motor, handlers mobile e autorização de parede no main",()=>{
 const root=new URL("../src/",import.meta.url);
 const port=readFileSync(new URL("application/placementStatusPort.ts",root),"utf8");
 const panel=readFileSync(new URL("ui/placementStatusPanel.ts",root),"utf8");
 assert.doesNotMatch(port,/\b(document|window|HTMLElement)\b/);
 assert.doesNotMatch(panel,/from\s*["']\.\.\/sim\//);
 assert.doesNotMatch(panel,/\bGameState\b|addEventListener/);
 assertSourceCall("ui/gamePanels.ts","placementStatusSnapshot");
 assertSourceCall("ui/gamePanels.ts","renderPlacementStatus");
 assertSourceCall("ui/gamePanels.ts","placementActions.canBuild",["state.placement.pendingWall"]);
 assertSourceCall("ui/placementController.ts","placementActions.confirmWall",["state.placement.wallMode","wall"]);
 for(const event of ["pointermove","click"])assertSourceCall("ui/placementController.ts","canvas.addEventListener",[JSON.stringify(event)]);
});
