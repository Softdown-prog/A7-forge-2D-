// Verifica a página de planejamento dentro do JOGO ORIGINAL em Chromium.
// Não há cena artificial nem alteração do relógio para provar que uma noite funciona.
import {chromium} from "playwright";
import {createServer} from "node:http";
import {mkdir,readFile,writeFile} from "node:fs/promises";
import {extname,resolve,sep} from "node:path";
import {createGame,isValidSave,stepGame} from "../dist/js/sim/engine.js";
import {draftFridayMeetup} from "../dist/js/sim/fridayMeetup.js";
import {confirmFridayMeetup} from "../dist/js/sim/nightMeetup.js";
import {selectNightTournament} from "../dist/js/sim/nightTournament.js";
import {licenseGames} from "../dist/js/sim/economy.js";
import {licenseWindows} from "../dist/js/sim/era.js";
import {licenseEraGame,ERIC_MULTIPLAYER_GAME_ID} from "../dist/js/sim/eraGames.js";
import {toggleStationPower} from "../dist/js/sim/stationPower.js";
import {GAME_SAVE_KEY,DAY_MINUTES} from "../dist/js/sim/types.js";
import {selectAdminArea} from "./management_navigation.mjs";
import {dismissPrivacyNotice} from "./privacyNoticeTest.mjs";
const root=resolve(import.meta.dirname,"../dist"),out=resolve(process.argv[2]??"out/friday-panel");
await mkdir(out,{recursive:true});
const server=createServer(async(req,res)=>{
 try{
  const url=decodeURIComponent(new URL(req.url??"/","http://127.0.0.1").pathname);
  const file=resolve(root,"."+(url==="/"?"/index.html":url));
  if(file!==root&&!file.startsWith(root+sep)){res.writeHead(403).end();return;}
  const mime={".html":"text/html",".js":"text/javascript",".css":"text/css",".png":"image/png",".svg":"image/svg+xml"};
  res.writeHead(200,{"Content-Type":mime[extname(file)]??"application/octet-stream"});
  res.end(await readFile(file));
 }catch{res.writeHead(404).end();}
});
await new Promise(ok=>server.listen(0,"127.0.0.1",ok));
const state=createGame(147,"historical");
state.totalMinutes=3*360*DAY_MINUTES;
state.cash=15000;state.multiplayerRoundsPlayed=1;
function ok(result){if(!result.ok)throw Error(result.message);}
ok(licenseGames(state));
for(let i=0;i<3;i++){
 ok(toggleStationPower(state,i));
 ok(licenseWindows(state,i,"win98"));
 ok(toggleStationPower(state,i));
}
ok(licenseEraGame(state,ERIC_MULTIPLAYER_GAME_ID));
if(!isValidSave(state))throw Error("Save de teste inválido.");
let browser;
try{
 browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
 let page=await browser.newPage({viewport:{width:1280,height:850}});
 const errors=[];page.on("pageerror",e=>errors.push(String(e)));
 await page.addInitScript(({key,payload})=>{
 if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify(payload));
},
  {key:GAME_SAVE_KEY,payload:state});
 await page.goto("http://127.0.0.1:"+server.address().port+"/",{waitUntil:"networkidle"});
 await dismissPrivacyNotice(page);
 await page.locator("#menu-continue").click();
 await page.locator("#open-admin").click();
 await selectAdminArea(page,"finance");
 await page.locator('#section-finance [data-panel-choice="events"]').click();
 const btn=page.locator("#first-meetup-two");
 await btn.waitFor({state:"visible"});
 if(!await btn.isEnabled())throw Error("O estudo da sexta deveria estar disponível.");
 const initial=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),GAME_SAVE_KEY);
 await btn.click();
 await page.waitForFunction(()=>document.querySelector("#first-meetup-status")?.textContent?.includes("Rascunho salvo"));
 const draft=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),GAME_SAVE_KEY);
 if(draft.fridayMeetupDraft?.seats!==2||draft.fridayMeetupDraft.status!=="draft")
  throw Error("Rascunho não persistido no save.");
 for(const name of ["cash","revenue","expenses","served"]){
  if(draft[name]!==initial[name])throw Error("O estudo alterou "+name);
 }
 if(draft.totalMinutes<initial.totalMinutes||draft.totalMinutes>initial.totalMinutes+5)throw Error("O calendário avançou sem comando.");
 if(draft.customers.length!==initial.customers.length)throw Error("Foram criados visitantes fantasmas.");
 await page.screenshot({path:resolve(out,"primeira_sexta_painel_real.png")});
 const fmt=page.locator("#first-meetup-format");
 if(!await fmt.isEnabled())throw Error("Botão torneio deveria estar ativo.");
 await fmt.click();
 await page.waitForFunction(()=>document.querySelector("#first-meetup-format")?.textContent?.includes("Ativar eliminatórias"));
 const league=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),GAME_SAVE_KEY);
 if(league.fridayMeetupDraft?.format!=="tournament")throw Error("A escolha por pontos não ficou no save.");
 await fmt.click();
 await page.waitForFunction(()=>document.querySelector("#first-meetup-format")?.textContent?.includes("Usar encontro livre"));
 const selected=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),GAME_SAVE_KEY);
 if(selected.fridayMeetupDraft?.format!=="knockout")throw Error("A escolha das eliminatórias não ficou no save.");
 if(selected.cash!==draft.cash||selected.revenue!==draft.revenue||selected.served!==draft.served)
  throw Error("Inscrição em torneio cobrou antes dos participantes chegarem.");
 await page.screenshot({path:resolve(out,"torneio_escolhido_no_jogo.png")});
 const confirm=page.locator("#first-meetup-confirm");
 if(!await confirm.isEnabled())throw Error("Confirmar encontro deveria estar ativo.");
 await confirm.click();
 await page.waitForFunction(()=>document.querySelector("#first-meetup-status")?.textContent?.includes("CONFIRMADO"));
 const confirmed=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),GAME_SAVE_KEY);
 if(confirmed.fridayMeetupDraft?.status!=="confirmed"||confirmed.fridayMeetupDraft?.format!=="knockout")throw Error("Confirmação não gravada no save.");
 if(confirmed.cash!==draft.cash||confirmed.served!==draft.served||confirmed.revenue!==draft.revenue)
  throw Error("Confirmação cobrou antecipadamente ou inventou atendimento.");
 await page.screenshot({path:resolve(out,"primeira_sexta_confirmada_canvas_real.png")});
 await page.locator("#first-meetup-cancel").click();
 const cancelled=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),GAME_SAVE_KEY);
 if(cancelled.fridayMeetupDraft!==undefined)throw Error("Cancelamento não liberou o rascunho.");
 // A galeria só pode ser comprovada após uma final rodada pelo motor verdadeiro.
 ok(draftFridayMeetup(state,2));
 ok(selectNightTournament(state,"knockout"));
 ok(confirmFridayMeetup(state));
 const trophyFriday=state.fridayMeetupDraft.fridayDay;
 state.totalMinutes=trophyFriday*DAY_MINUTES-1;
 stepGame(state,1);
 if(!state.nightMeetup)throw Error("A madrugada real não começou.");
 while(state.nightMeetup)stepGame(state,1);
 if(!isValidSave(state)||state.nightTournamentTrophies?.length!==1||
   state.lastNightMeetup?.tournament?.winnerId!==state.nightTournamentTrophies[0].winnerId)
  throw Error("A final não produziu um troféu verdadeiro e persistente.");
 // O navegador da primeira etapa continua com um jogo antigo vivo e autosave ativo.
 // Reutilizar seu localStorage e recarregar a mesma aba pode restaurar esse
 // checkpoint antigo em vez do resultado da eliminatória. Um contexto novo
 // equivale a abrir o jogo novamente em outro navegador com o save importado.
 await page.close();
 page=await browser.newPage({viewport:{width:1280,height:850}});
 page.on("pageerror",e=>errors.push(String(e)));
 await page.addInitScript(({key,payload})=>localStorage.setItem(key,JSON.stringify(payload)),
  {key:GAME_SAVE_KEY,payload:state});
 await page.goto("http://127.0.0.1:"+server.address().port+"/",{waitUntil:"networkidle"});
 const reloaded=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),GAME_SAVE_KEY);
 if(reloaded.nightTournamentTrophies?.length!==1)
  throw Error("O novo contexto não recebeu o save com troféu persistente.");
 await dismissPrivacyNotice(page);
 await page.locator("#menu-continue").click();
 await page.locator("#open-admin").click();
 await selectAdminArea(page,"finance");
 await page.locator('#section-finance [data-panel-choice="events"]').click();
 const gallery=page.locator("#first-meetup-trophies");
 await gallery.waitFor({state:"visible"});
 if(await gallery.locator(".night-trophy-item").count()!==1)
  throw Error("A galeria não mostra o troféu conquistado.");
 const galleryText=await gallery.textContent();
 if(!galleryText.includes("Campeão: jogador "+state.nightTournamentTrophies[0].winnerId)||
    !galleryText.includes("1 conquista"))
  throw Error("Vencedor ou total da galeria não confere com a final real.");
 const records=await page.locator("#first-meetup-trophy-records").textContent();
 if(!records.includes("1 campeão diferente")||!records.includes("1 final com 2 jogadores")||
    !records.includes("0 finais com 3 jogadores"))
  throw Error("Quadro de campeões não corresponde às conquistas persistidas.");
 const championRank=await page.locator(".night-trophy-champions li").allTextContents();
 if(championRank.length!==1||
    !championRank[0].includes("1º jogador "+state.nightTournamentTrophies[0].winnerId)||
    !championRank[0].includes("1 título"))
  throw Error("Ranking da galeria não corresponde à final real.");
 if(await page.locator("#first-meetup-trophies-more").isVisible())
  throw Error("Uma conquista não precisa do botão de histórico completo.");
 await page.screenshot({path:resolve(out,"galeria_trofeu_final_real.png")});
 // Quatro noites adicionais completam CINCO finais no motor (sem inventar títulos).
 // Só os dias comuns entre sextas são acelerados no teste; cada madrugada
 // ainda roda minuto a minuto, com pessoas, PCs, cobranças e premiação reais.
 const recordedFridays=[trophyFriday];
 for(const seats of [3,2,3,2]){
  ok(draftFridayMeetup(state,seats));
  ok(selectNightTournament(state,"knockout"));
  ok(confirmFridayMeetup(state));
  const day=state.fridayMeetupDraft.fridayDay;
  if(day!==recordedFridays.at(-1)+7)throw Error("Sextas não são consecutivas.");
  state.totalMinutes=day*DAY_MINUTES-1;
  stepGame(state,1);
  let ticks=0;
  while(state.nightMeetup&&ticks++<720)stepGame(state,1);
  if(state.nightMeetup||state.nightTournamentTrophies?.length!==recordedFridays.length+1||
     !isValidSave(state))throw Error("Campanha com múltiplas sextas inválida.");
  recordedFridays.push(day);
 }
 await page.close();
 page=await browser.newPage({viewport:{width:360,height:740},isMobile:true,hasTouch:true});
 page.on("pageerror",e=>errors.push(String(e)));
 await page.addInitScript(({key,payload})=>localStorage.setItem(key,JSON.stringify(payload)),
  {key:GAME_SAVE_KEY,payload:state});
 await page.goto("http://127.0.0.1:"+server.address().port+"/",{waitUntil:"networkidle"});
 await dismissPrivacyNotice(page);
 await page.locator("#menu-continue").click();
 await page.locator("#open-admin").click();
 await selectAdminArea(page,"finance");
 await page.locator('#section-finance [data-panel-choice="events"]').click();
 const mobileGallery=page.locator("#first-meetup-trophies");
 await mobileGallery.waitFor({state:"visible"});
 const viewAll=page.locator("#first-meetup-trophies-more");
 if(await mobileGallery.locator(".night-trophy-item").count()!==4||
    !await viewAll.isVisible()||
    await viewAll.getAttribute("aria-expanded")!=="false")
  throw Error("Galeria mobile deve mostrar só as quatro finais mais recentes.");
 await page.screenshot({path:resolve(out,"galeria_cinco_sextas_mobile_recentes.png"),fullPage:true});
 await viewAll.click();
 if(await mobileGallery.locator(".night-trophy-item").count()!==5||
    await viewAll.getAttribute("aria-expanded")!=="true")
  throw Error("Histórico completo não abre após tocar em Ver todas.");
 const currentItems=await mobileGallery.locator(".night-trophy-item").allTextContents();
 if(!currentItems[0].includes("Sexta ")||
    !currentItems[0].includes("Campeão: jogador "+state.nightTournamentTrophies.at(-1).winnerId)||
    !currentItems.at(-1).includes("Campeão: jogador "+state.nightTournamentTrophies[0].winnerId))
  throw Error("Histórico não está ordenado do troféu mais recente ao mais antigo.");
 const mobileSizes=await page.evaluate(()=>{
  const g=document.getElementById("first-meetup-trophies");
  const items=[...g.querySelectorAll(".night-trophy-item")];
  return {galleryWidth:g.clientWidth,galleryScrollWidth:g.scrollWidth,
   itemOverflows:items.some(item=>item.scrollWidth>item.clientWidth+2)};
 });
 if(mobileSizes.galleryScrollWidth>mobileSizes.galleryWidth+3||
    mobileSizes.itemOverflows)
  throw Error("Galeria apresenta rolagem horizontal interna no celular: "+JSON.stringify(mobileSizes));
 await page.screenshot({path:resolve(out,"galeria_cinco_sextas_mobile_completo.png"),fullPage:true});
 await viewAll.click();
 if(await mobileGallery.locator(".night-trophy-item").count()!==4||
    await viewAll.getAttribute("aria-expanded")!=="false")
  throw Error("Fechar histórico deve recuperar os quatro troféus recentes.");
 if(errors.length)throw Error(errors.join(" | "));
 await writeFile(resolve(out,"verificacao.json"),JSON.stringify({status:"pass",firstFridayDay:draft.fridayMeetupDraft.fridayDay,
  slots:2,savePreserved:true,knockoutFormatSelected:true,confirmedWithoutUpfrontPayment:true,
  zeroExtraRevenue:true,realKnockoutTrophyVisible:true,trophyFriday,
  repeatedFridays:recordedFridays,mobileHistoryExpanded:true,
  mobileWidth:360,interface:"jogo original"},null,2));
 console.log("OK: planejamento, save, final no motor real e galeria no navegador.");
}finally{
 if(browser)await browser.close();
 await new Promise(ok=>server.close(ok));
}
