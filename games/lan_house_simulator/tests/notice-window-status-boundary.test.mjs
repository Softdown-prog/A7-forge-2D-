import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createGame,isValidSave} from "../dist/js/sim/engine.js";
import {serializeSave,parseImportedSave} from "../dist/js/sim/saveTransfer.js";
import {createNoticeWindowStatusPort} from "../dist/js/application/noticeWindowStatusPort.js";
import {renderNoticeWindowStatus} from "../dist/js/ui/noticeWindowStatusPanel.js";
const letter=(id,read=false)=>({id,title:"Carta "+id,body:"Texto",day:7,read,severity:"warning"});

test("janela inicial fechada, sem badge, é consulta pura",()=>{
 const s=createGame(9400,"historical"),before=JSON.stringify(s);
 const v=createNoticeWindowStatusPort(()=>s).snapshot(false);
 assert.deepEqual(v,{unread:0,badgeHidden:true,badgeText:"0",windowHidden:true,expanded:"false"});
 assert.equal(JSON.stringify(s),before);
});
test("abrir e fechar altera somente projeção, não estado da partida",()=>{
 const s=createGame(9401),port=createNoticeWindowStatusPort(()=>s),before=JSON.stringify(s);
 assert.deepEqual([port.snapshot(true).windowHidden,port.snapshot(true).expanded],[false,"true"]);
 assert.deepEqual([port.snapshot(false).windowHidden,port.snapshot(false).expanded],[true,"false"]);
 assert.equal(JSON.stringify(s),before);
});
test("badge acompanha cartas lidas e não lidas sem mexer no inbox",()=>{
 const s=createGame(9402),port=createNoticeWindowStatusPort(()=>s);
 s.notices=[letter("safety"),letter("windows",true),letter("games")];
 const before=JSON.stringify(s);
 let v=port.snapshot(false);
 assert.equal(v.unread,2);assert.equal(v.badgeHidden,false);assert.equal(v.badgeText,"2");
 assert.equal(JSON.stringify(s),before);
 s.notices[0].read=true;
 assert.equal(port.snapshot(true).badgeText,"1");
 s.notices[2].read=true;
 v=port.snapshot(true);
 assert.equal(v.badgeHidden,true);assert.equal(v.badgeText,"0");
});
test("saves legados sem notices permanecem consultáveis",()=>{
 const s=createGame(9403);delete s.notices;
 assert.equal(createNoticeWindowStatusPort(()=>s).snapshot(true).unread,0);
 assert.equal(isValidSave(s),true);
});
test("substituição por save importado não retém referência antiga",()=>{
 let s=createGame(9404,"historical"),before=JSON.stringify(s),old=s;
 const port=createNoticeWindowStatusPort(()=>s);
 s=parseImportedSave(serializeSave(s));
 assert.equal(isValidSave(s),true);
 s.notices=[letter("safety"),letter("windows",true)];
 assert.equal(port.snapshot(false).unread,1);
 assert.equal(JSON.stringify(old),before);
 s=createGame(9405);
 assert.equal(port.snapshot(false).unread,0);
});
test("DOM atualiza nós existentes, contador, hidden e aria-expanded",()=>{
 const mailbox={hidden:true},badge={hidden:true,textContent:"antigo"};
 const trigger={attrs:{},setAttribute(k,v){this.attrs[k]=v;}};
 const elements=new Map([["notices",mailbox],["notices-count",badge],["open-notices",trigger]]);
 const doc={getElementById:id=>elements.get(id)??null};
 const s=createGame(9406);s.notices=[letter("safety")];const port=createNoticeWindowStatusPort(()=>s);
 renderNoticeWindowStatus(port.snapshot(true),doc);
 assert.equal(mailbox.hidden,false);assert.equal(badge.hidden,false);
 assert.equal(badge.textContent,"1");assert.equal(trigger.attrs["aria-expanded"],"true");
 s.notices[0].read=true;
 renderNoticeWindowStatus(port.snapshot(false),doc);
 assert.equal(mailbox.hidden,true);assert.equal(badge.hidden,true);
 assert.equal(badge.textContent,"0");assert.equal(trigger.attrs["aria-expanded"],"false");
 assert.equal(elements.get("notices"),mailbox);
});
test("DOM pode estar temporariamente ausente",()=>{
 const v=createNoticeWindowStatusPort(()=>createGame(9407)).snapshot(false);
 assert.doesNotThrow(()=>renderNoticeWindowStatus(v,{getElementById:()=>null}));
});
test("porta não conhece DOM, painel não conhece motor, ações de correio continuam",()=>{
 const root=new URL("../src/",import.meta.url);
 const port=readFileSync(new URL("application/noticeWindowStatusPort.ts",root),"utf8");
 const panel=readFileSync(new URL("ui/noticeWindowStatusPanel.ts",root),"utf8");
 const main=readFileSync(new URL("main.ts",root),"utf8");
 assert.doesNotMatch(port,/\b(document|window|HTMLElement|HTMLButtonElement)\b/);
 assert.doesNotMatch(panel,/from\s*["']\.\.\/sim\//);
 assert.doesNotMatch(panel,/\bGameState\b|addEventListener/);
 assert.ok(main.includes("createNoticeWindowStatusPort(()=>game)"));
 assert.ok(main.includes("renderNoticeWindowStatus(noticeWindowStatusPort.snapshot(noticesOpen),document)"));
 assert.ok(main.includes("renderNoticeInbox(noticesList,noticeInboxPort.snapshot(),document,iconMarkup)"));
 assert.ok(main.includes('button("open-notices"'));
 assert.ok(main.includes("noticeActions.review()"));
 assert.ok(main.includes("installNoticeControls("));
});
