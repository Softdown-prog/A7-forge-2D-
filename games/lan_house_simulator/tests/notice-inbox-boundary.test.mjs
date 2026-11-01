import {sourceModule} from "./helpers/composition.mjs";
import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createGame,isValidSave} from "../dist/js/sim/engine.js";
import {basicGamesLicenseCost} from "../dist/js/sim/economy.js";
import {decisionOptions} from "../dist/js/sim/decisions.js";
import {serializeSave,parseImportedSave} from "../dist/js/sim/saveTransfer.js";
import {createNoticeInboxPort} from "../dist/js/application/noticeInboxPort.js";
import {renderNoticeInbox} from "../dist/js/ui/noticeInboxPanel.js";
const game=()=>{const s=createGame(9206,"historical");s.cash=1000;return s;};
const letter=(id,read=false,resolved)=>({id,title:"Carta "+id,body:"Aviso",day:7,read,severity:"warning",...(resolved?{resolved}:{})});
class Node{
 constructor(tag){this.tag=tag;this.children=[];this.dataset={};this.textContent="";}
 append(...values){this.children.push(...values);}
 replaceChildren(...values){this.children=[...values];}
 insertAdjacentHTML(position,markup){this.html={position,markup};}
}
test("lista vazia é apresentada sem efeitos no save",()=>{
 const s=game();s.notices=[];const before=JSON.stringify(s),v=createNoticeInboxPort(()=>s).snapshot();
 assert.deepEqual(v.letters,[]);assert.equal(JSON.stringify(s),before);
 const root=new Node("div");renderNoticeInbox(root,v,{createElement:t=>new Node(t)},()=>"<svg/>");
 assert.equal(root.children[0].textContent,"Nenhuma mensagem recebida por enquanto.");
});
test("mensagem nova tem opção de marcar como lida; lida não repete opção",()=>{
 const s=game();s.notices=[letter("safety")];const port=createNoticeInboxPort(()=>s),before=JSON.stringify(s);
 assert.equal(port.snapshot().letters[0].items[0].action,"read");
 assert.equal(port.snapshot().letters[0].items[0].noticeId,"safety");
 assert.equal(JSON.stringify(s),before);
 s.notices[0].read=true;
 assert.equal(port.snapshot().letters[0].items.some(x=>x.action==="read"),false);
});
test("programador respeita saldo e desaparece após filtro de conteúdo",()=>{
 const s=game();s.notices=[letter("safety")];const port=createNoticeInboxPort(()=>s);
 s.cash=319;assert.equal(port.snapshot().letters[0].items.find(x=>x.action==="programmer").disabled,true);
 s.cash=320;assert.equal(port.snapshot().letters[0].items.find(x=>x.action==="programmer").disabled,false);
 s.contentFilterInstalled=true;assert.equal(port.snapshot().letters[0].items.some(x=>x.action==="programmer"),false);
});
test("correspondência Windows e jogos apresenta ações sem regularizar automaticamente",()=>{
 const s=game();s.notices=[letter("windows-fine"),letter("copyright")];const port=createNoticeInboxPort(()=>s);
 let rows=port.snapshot().letters;
 assert.equal(rows[0].items.find(x=>x.action==="windows").text,"Regularizar Windows");
 assert.equal(rows[1].items.find(x=>x.action==="games").text,
  "Regularizar jogos · "+basicGamesLicenseCost(s).toLocaleString("pt-BR",{style:"currency",currency:"BRL"}));
 s.pcWindowsLicenses=[true,true,true];s.licensedGames=true;rows=port.snapshot().letters;
 assert.equal(rows[0].items.some(x=>x.action==="windows"),false);
 assert.equal(rows[1].items.some(x=>x.action==="games"),false);
});
test("propostas refletem custo, caixa, resolução e o motor de escolhas",()=>{
 const s=game();s.notices=[letter("supplier-offer")];s.cash=0;const port=createNoticeInboxPort(()=>s);
 let rows=port.snapshot().letters[0].items;
 assert.equal(rows.find(x=>x.choiceId==="supplier-accept").disabled,true);
 assert.equal(rows.find(x=>x.choiceId==="supplier-accept").title,decisionOptions("supplier-offer",s)[0].description);
 s.cash=500;assert.equal(port.snapshot().letters[0].items.find(x=>x.choiceId==="supplier-accept").disabled,false);
 s.notices[0].resolved="supplier-decline";rows=port.snapshot().letters[0].items;
 assert.ok(rows.some(x=>x.kind==="resolved"&&x.text.includes("Recusar proposta")));
 assert.equal(rows.some(x=>x.action==="decision"),false);
});
test("Bombeiros: prazo, extensão única e multa sem reoferecer prorrogação",()=>{
 const s=game();s.notices=[letter("electrical-inspection")];s.electricalDeadlineDay=18;
 const port=createNoticeInboxPort(()=>s);
 assert.ok(port.snapshot().letters[0].items.some(x=>x.kind==="deadline"&&x.text.includes("dia 18")));
 assert.ok(port.snapshot().letters[0].items.some(x=>x.choiceId==="electrical-defer"));
 s.electricalExtensionUsed=true;s.electricalDeadlineDay=26;
 let row=port.snapshot().letters[0].items;
 assert.equal(row.some(x=>x.choiceId==="electrical-defer"),false);
 assert.ok(row.some(x=>x.kind==="deadline"&&x.text.includes("prorrogado")));
 s.electricalInspectionFineApplied=true;row=port.snapshot().letters[0].items;
 assert.ok(row.some(x=>x.kind==="deadline"&&x.text.includes("multa já aplicada")));
});
test("nova partida importada é consultada sem referência ao save antigo",()=>{
 let s=game(),old=s,before=JSON.stringify(s);const port=createNoticeInboxPort(()=>s);
 s=parseImportedSave(serializeSave(s));assert.equal(isValidSave(s),true);
 s.notices=[letter("safety")];s.cash=319;
 assert.equal(port.snapshot().letters[0].items.find(x=>x.action==="programmer").disabled,true);
 assert.equal(JSON.stringify(old),before);
});
test("DOM mantém classes, ícones, dataset para decisões e leitura, e delegação",()=>{
 const s=game();s.notices=[letter("supplier-offer"),letter("safety")];
 const root=new Node("div");root.listeners=["click"];
 renderNoticeInbox(root,createNoticeInboxPort(()=>s).snapshot(),{createElement:t=>new Node(t)},name=>"<i>"+name+"</i>");
 assert.equal(root.listeners[0],"click");
 assert.equal(root.children.length,2);
 assert.equal(root.children[0].className,"notice-letter notice-warning");
 assert.equal(root.children[0].children[0].html.markup,"<i>mail</i>");
 const choices=root.children[0].children[3].children;
 assert.equal(choices[0].dataset.noticeRead,"supplier-offer");
 const decision=choices.find(x=>x.dataset.decision==="supplier-offer");
 assert.equal(decision.dataset.choice,"supplier-accept");
 assert.equal(decision.type,"button");
 assert.equal(root.children[1].children[3].children[1].dataset.noticeAction,"programmer");
});
test("porta não usa DOM; UI não usa GameState; listeners permanecem no bootstrap",()=>{
 const root=new URL("../src/",import.meta.url);
 const port=readFileSync(new URL("application/noticeInboxPort.ts",root),"utf8");
 const ui=readFileSync(new URL("ui/noticeInboxPanel.ts",root),"utf8");
 assert.equal(port.includes("document."),false);assert.equal(ui.includes("../sim/"),false);
 assert.equal(ui.includes("GameState"),false);assert.equal(ui.includes("addEventListener"),false);
 assert.ok(sourceModule("application/gamePorts.ts").includes("createNoticeInboxPort(getState)"));
 const refresh=readFileSync(new URL("ui/noticeWindowRefresh.ts",root),"utf8");
 assert.ok(sourceModule("ui/gamePanels.ts").includes("createNoticeWindowRefresh({"));
 assert.match(refresh,/const snapshot=options\.inbox\.snapshot\(\)/);
 assert.match(refresh,/sendEvent\("lhs:notice-inbox-updated",snapshot\)/);
 assert.match(refresh,/if\(host\.dataset\?\.angularOwned!=="true"\)/);
 assert.match(refresh,/renderNoticeInbox\(host,snapshot,options\.doc,options\.iconMarkup\)/);
 assert.ok(sourceModule("ui/runtimeControls.ts").includes("installNoticeControls(noticesList,noticeActions"));
});
