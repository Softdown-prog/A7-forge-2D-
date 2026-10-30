import {sourceModule} from "./helpers/composition.mjs";
import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createNoticeWindowRefresh} from "../dist/js/ui/noticeWindowRefresh.js";
import {createNoticeInboxRevisionPort} from "../dist/js/application/noticeInboxRevisionPort.js";
import {createGame} from "../dist/js/sim/engine.js";
function node(tag){
 const children=[];
 return {tag,children,hidden:false,textContent:"",attrs:{},dataset:{},
  replaceChildren(...next){children.splice(0,children.length,...next);},
  append(...next){children.push(...next);},setAttribute(k,v){this.attrs[k]=v;},
  insertAdjacentHTML(position,html){this.innerHTML=html;}
 };
}
function fixture(){
 const nodes=new Map([["notices",node("section")],["notices-count",node("b")],["open-notices",node("button")]]);
 const doc={getElementById:id=>nodes.get(id)??null,createElement:node};
 const calls=[],host=node("ol");
 let available=true,dirty=true,letters=[],cash=100;
 const status={snapshot:open=>{calls.push(["status",open]);return {
  unread:2,badgeHidden:false,badgeText:"2",windowHidden:!open,expanded:String(open)
 };}};
 const inbox={snapshot:()=>{calls.push(["inbox"]);return {letters};}};
 const changed=force=>{calls.push(["changed",force]);return dirty;};
 const refresh=createNoticeWindowRefresh({status,inbox,host:()=>available?host:null,changed,doc,iconMarkup:()=>"<svg/>"});
 return {refresh,calls,host,nodes,setDirty:v=>{dirty=v;},setAvailable:v=>{available=v;},setLetters:v=>{letters=v;},getCash:()=>cash};
}
test("janela fechada atualiza o badge sem consultar revisão ou inbox",()=>{
 const x=fixture();assert.equal(x.refresh.refresh(false,false),false);
 assert.deepEqual(x.calls,[["status",false]]);
 assert.equal(x.nodes.get("notices").hidden,true);
 assert.equal(x.nodes.get("open-notices").attrs["aria-expanded"],"false");
});
test("janela aberta atualiza badge antes da revisão e da inbox",()=>{
 const x=fixture();assert.equal(x.refresh.refresh(true,true),true);
 assert.deepEqual(x.calls,[["status",true],["changed",true],["inbox"]]);
 assert.equal(x.nodes.get("notices").hidden,false);
});
test("janela aberta com revisão igual não remonta as mensagens",()=>{
 const x=fixture();x.setDirty(false);
 assert.equal(x.refresh.refresh(true,false),false);
 assert.deepEqual(x.calls,[["status",true],["changed",false]]);
});
test("sem nó de lista, não verifica revisão nem consulta inbox",()=>{
 const x=fixture();x.setAvailable(false);
 assert.equal(x.refresh.refresh(true,true),false);
 assert.deepEqual(x.calls,[["status",true]]);
});
test("lista vazia recebe estado de nenhuma mensagem",()=>{
 const x=fixture();x.refresh.refresh(true,true);
 assert.equal(x.host.children.length,1);
 assert.equal(x.host.children[0].textContent,"Nenhuma mensagem recebida por enquanto.");
});
test("render repetido substitui o conteúdo anterior da lista",()=>{
 const x=fixture();x.refresh.refresh(true,true);
 const first=x.host.children[0];x.refresh.refresh(true,true);
 assert.equal(x.host.children.length,1);assert.notEqual(x.host.children[0],first);
});
test("a flag de força false chega ao cache sem alterações",()=>{
 const x=fixture();x.refresh.refresh(true,false);
 assert.deepEqual(x.calls.filter(c=>c[0]==="changed"),[["changed",false]]);
});
test("a flag de força true chega ao cache sem alterações",()=>{
 const x=fixture();x.refresh.refresh(true,true);
 assert.deepEqual(x.calls.filter(c=>c[0]==="changed"),[["changed",true]]);
});
test("janela fechada conserva a lista, sem excluir mensagens montadas",()=>{
 const x=fixture();x.refresh.refresh(true,true);
 const prev=x.host.children[0];x.refresh.refresh(false,false);
 assert.equal(x.host.children[0],prev);
});
test("abertura posterior consulta nova revisão e monta inbox",()=>{
 const x=fixture();x.refresh.refresh(false,false);x.refresh.refresh(true,false);
 assert.equal(x.calls.filter(c=>c[0]==="inbox").length,1);
});
test("falha ao ler inbox não é mascarada nem altera a janela aberta",()=>{
 const x=fixture();const bad=createNoticeWindowRefresh({
  status:{snapshot:open=>({badgeHidden:true,badgeText:"0",windowHidden:!open,expanded:String(open),unread:0})},
  inbox:{snapshot:()=>{throw Error("mailbox failure");}},
  host:()=>x.host,changed:()=>true,
  doc:{getElementById:id=>x.nodes.get(id)??null,createElement:node},iconMarkup:()=>"<svg/>"
 });
 assert.throws(()=>bad.refresh(true,false),/mailbox failure/);
 assert.equal(x.nodes.get("notices").hidden,false);
});
test("jogo não sofre modificação durante captura de revisão",()=>{
 const s=createGame(4812),before=JSON.stringify(s);
 const port=createNoticeInboxRevisionPort(()=>s);
 port.snapshot();port.snapshot();assert.equal(JSON.stringify(s),before);
});
test("revisão lê sempre a partida atualmente importada",()=>{
 let s=createGame(4813);const port=createNoticeInboxRevisionPort(()=>s);
 let first=port.snapshot();s=createGame(4814);s.cash+=900;
 assert.equal(port.snapshot()[0],s.cash);assert.notEqual(first[0],s.cash);
});
test("revisão contém somente os sete campos originais do main",()=>{
 const s=createGame(4815),snapshot=createNoticeInboxRevisionPort(()=>s).snapshot();
 assert.deepEqual(snapshot,[s.cash,s.notices,s.contentFilterInstalled,s.pcWindowsLicenses,s.licensedGames,s.electricalDeadlineDay,s.electricalInspectionFineApplied]);
});
test("mudança na lista de cartas altera revisão de JSON",()=>{
 const s=createGame(4816),port=createNoticeInboxRevisionPort(()=>s);
 const before=JSON.stringify(port.snapshot());s.notices??=[];s.notices.push({id:"test",title:"x",body:"x",day:1,severity:"info",read:false});
 assert.notEqual(JSON.stringify(port.snapshot()),before);
});
test("cache e janela são independentes da simulação e de saves",()=>{
 const r=readFileSync(new URL("../src/ui/noticeWindowRefresh.ts",import.meta.url),"utf8");
 const p=readFileSync(new URL("../src/application/noticeInboxRevisionPort.ts",import.meta.url),"utf8");
 assert.equal(r.includes("../sim/"),false);assert.equal(r.includes("GameState"),false);
 assert.equal(p.includes("document."),false);assert.equal(p.includes("window."),false);
 assert.ok(sourceModule("ui/gamePanels.ts").includes("createNoticeWindowRefresh({"));
 assert.ok(sourceModule("ui/gamePanels.ts").includes("noticeWindowRefresh.refresh(state.windows.noticesOpen,!liveOnly)"));
 assert.ok(sourceModule("ui/gamePanels.ts").includes("panelChanged(\"notices\",noticeInboxRevisionPort.snapshot(),force)"));
});
