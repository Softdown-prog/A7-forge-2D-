import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createMenuScreens,installMenuControls} from "../dist/js/ui/gameMenuControls.js";

function node(){
 const handlers={};
 return {
  handlers,hidden:false,disabled:false,checked:true,attrs:{},
  addEventListener:(name,cb)=>{(handlers[name]??=[]).push(cb);},
  setAttribute(name,value){this.attrs[name]=value;},
  fire(name="click"){for(const handler of handlers[name]??[])handler();}
 };
}
function elements(){
 return {
  startScreen:node(),gameApp:node(),continueButton:node(),exportButton:node(),
  settingsPanel:node(),soundToggle:node(),newButton:node(),resetButton:node(),
  optionsButton:node(),openMenuButton:node(),auxiliaryPanels:[node(),node(),node()]
 };
}
test("visibilidade de menu e jogo mantém flags e disponibilidade de saves",()=>{
 const roots=elements(),screens=createMenuScreens(roots);
 roots.startScreen.hidden=true;
 roots.continueButton.disabled=false;
 roots.exportButton.disabled=false;
 screens.showMenu(false);
 assert.equal(roots.startScreen.hidden,false);
 assert.equal(roots.gameApp.hidden,true);
 assert.equal(roots.continueButton.disabled,true);
 assert.equal(roots.exportButton.disabled,true);
 assert.ok(roots.auxiliaryPanels.every(p=>p.hidden));
 screens.showGame();
 assert.equal(roots.startScreen.hidden,true);
 assert.equal(roots.gameApp.hidden,false);
 screens.showMenu(true);
 assert.equal(roots.continueButton.disabled,false);
 assert.equal(roots.exportButton.disabled,false);
});

test("novo jogo histórico pede confirmação somente quando já existe save",()=>{
 const roots=elements(),calls=[];let saved=false,allow=false;
 installMenuControls(roots,{
  hasSave:()=>saved,
  newCampaign:mode=>calls.push(["new",mode]),
  continueCampaign:()=>calls.push(["continue"]),
  leaveGame:()=>calls.push(["leave"]),
  setSound:enabled=>calls.push(["sound",enabled]),
  confirm:message=>{calls.push(["confirm",message]);return allow;}
 });
 roots.newButton.fire();
 assert.deepEqual(calls,[["new","historical"]]);
 saved=true;
 roots.newButton.fire();
 assert.equal(calls.filter(x=>x[0]==="new").length,1,"cancelar preserva jogo anterior");
 assert.match(calls.at(-1)[1],/substituir/);
 allow=true;
 roots.newButton.fire();
 assert.deepEqual(calls.at(-1),["new","historical"]);
 roots.continueButton.fire();
 assert.deepEqual(calls.at(-1),["continue"]);
});

test("reiniciar continua clássico; continuar exige partida; controles de som e opções",()=>{
 const roots=elements(),calls=[];let saved=false,approved=false;
 installMenuControls(roots,{
  hasSave:()=>saved,
  newCampaign:mode=>calls.push(["new",mode]),
  continueCampaign:()=>calls.push(["continue"]),
  leaveGame:()=>calls.push(["leave"]),
  setSound:enabled=>calls.push(["sound",enabled]),
  confirm:()=>approved
 });
 roots.continueButton.fire();
 assert.equal(calls.length,0);
 roots.resetButton.fire();
 assert.equal(calls.length,0,"reinício cancelado não cria save");
 approved=true;
 roots.resetButton.fire();
 assert.deepEqual(calls,[["new","classic"]]);
 saved=true;
 roots.continueButton.fire();
 assert.deepEqual(calls.at(-1),["continue"]);
 roots.settingsPanel.hidden=true;
 roots.optionsButton.fire();
 assert.equal(roots.settingsPanel.hidden,false);
 assert.equal(roots.optionsButton.attrs["aria-expanded"],"true");
 roots.optionsButton.fire();
 assert.equal(roots.settingsPanel.hidden,true);
 roots.soundToggle.checked=false;
 roots.soundToggle.fire("change");
 assert.deepEqual(calls.at(-1),["sound",false]);
 roots.openMenuButton.fire();
 assert.deepEqual(calls.at(-1),["leave"]);
});

test("controles permanecem sem sim e a interface preserva integração com a sessão",()=>{
 const root=new URL("../src/",import.meta.url);
 const ui=readFileSync(new URL("ui/gameMenuControls.ts",root),"utf8");
 const main=readFileSync(new URL("main.ts",root),"utf8");
 assert.doesNotMatch(ui,/from\s*["']\.\.\/sim\//);
 assert.doesNotMatch(ui,/\bGameState\b|\blocalStorage\b|\bwindow\b/);
 assert.match(main,/createMenuScreens\(menuElements\)/);
 assert.match(main,/installMenuControls\(menuElements/);
 assert.match(main,/sessionPort\.replace\(fresh\)/);
 assert.match(main,/if\(isPlaying\)save\(\)/);
 assert.match(main,/menuScreens\.showMenu\(hasSavedGame\)/);
 assert.match(main,/menuScreens\.showGame\(\)/);
 assert.doesNotMatch(main,/document\.getElementById\("menu-new"\)\?\.addEventListener/);
});
