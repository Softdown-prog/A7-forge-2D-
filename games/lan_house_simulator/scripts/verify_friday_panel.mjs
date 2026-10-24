// Verifica a página de planejamento dentro do JOGO ORIGINAL em Chromium.
// Não há cena artificial nem alteração do relógio para provar que uma noite funciona.
import {chromium} from "playwright";
import {createServer} from "node:http";
import {mkdir,readFile,writeFile} from "node:fs/promises";
import {extname,resolve,sep} from "node:path";
import {createGame,isValidSave,stepGame} from "../dist/js/sim/engine.js";
import {draftFridayMeetup,firstFridayEligibility} from "../dist/js/sim/fridayMeetup.js";
import {confirmFridayMeetup} from "../dist/js/sim/nightMeetup.js";
import {selectNightTournament} from "../dist/js/sim/nightTournament.js";
import {licenseGames} from "../dist/js/sim/economy.js";
import {licenseWindows} from "../dist/js/sim/era.js";
import {licenseEraGame,ERIC_MULTIPLAYER_GAME_ID} from "../dist/js/sim/eraGames.js";
import {toggleStationPower,stationHasCustomer} from "../dist/js/sim/stationPower.js";
import {startRepair} from "../dist/js/sim/services.js";
import {serializeSave,parseImportedSave} from "../dist/js/sim/saveTransfer.js";
import {nightPrizePresentation,prizeAmountText} from "../dist/js/render/nightPrizePresentation.js";
import {nightReopeningPresentation} from "../dist/js/render/nightReopening.js";
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
 // Mostra os próprios PCs da madrugada no Canvas, sem compor uma cena externa.
 let liveTicks=0;
 while(state.nightMeetup&&(!state.nightMeetup.tournament?.bracket||
   (state.nightMeetup.tournament.bracket.matches[0]?.rounds??0)<2)&&liveTicks++<350)
  stepGame(state,1);
 if(!state.nightMeetup?.tournament?.bracket||
    (state.nightMeetup.tournament.bracket.matches[0]?.rounds??0)<2)
  throw Error("A partida real não iniciou as rodadas para captura de imagem.");
 const livePage=await browser.newPage({viewport:{width:1280,height:850}});
 livePage.on("pageerror",e=>errors.push(String(e)));
 await livePage.addInitScript(({key,payload})=>localStorage.setItem(key,JSON.stringify(payload)),
   {key:GAME_SAVE_KEY,payload:state});
 await livePage.goto("http://127.0.0.1:"+server.address().port+"/",{waitUntil:"networkidle"});
 await dismissPrivacyNotice(livePage);
 await livePage.locator("#menu-continue").click();
 await livePage.locator("#night-tournament-hud").waitFor({state:"visible"});
 const hudText=await livePage.locator("#night-tournament-hud > summary").textContent();
 if(!hudText.includes("Setor Zero")||!hudText.includes("–"))
  throw Error("Placar de rodada não acompanha o confronto real.");
 const gameCanvas=livePage.locator("#game");
 if(!await gameCanvas.isVisible())
  throw Error("Canvas original do salão não ficou visível no campeonato.");
 await livePage.screenshot({path:resolve(out,"corujao_confronto_pcs_reais.png")});
 await livePage.close();
 // Fotografia do gesto no salão original no exato minuto da decisão.
 let finalTicks=0;
 while(state.nightMeetup?.tournament?.bracket?.winnerId===undefined&&finalTicks++<240)
  stepGame(state,1);
 const finalMatch=state.nightMeetup?.tournament?.bracket?.matches.at(-1);
 if(!finalMatch?.winnerId||finalMatch.resolvedAtElapsed!==state.nightMeetup.elapsed)
  throw Error("Final real não produziu horário válido para a reação.");
 const reactionPage=await browser.newPage({viewport:{width:1280,height:850}});
 reactionPage.on("pageerror",e=>errors.push(String(e)));
 await reactionPage.addInitScript(({key,payload})=>localStorage.setItem(key,JSON.stringify(payload)),
  {key:GAME_SAVE_KEY,payload:state});
 await reactionPage.goto("http://127.0.0.1:"+server.address().port+"/",{waitUntil:"networkidle"});
 await dismissPrivacyNotice(reactionPage);
 await reactionPage.locator("#menu-continue").click();
 await reactionPage.waitForFunction(()=>document.querySelector("#night-tournament-hud > summary")
  ?.textContent?.includes("final encerrada"));
 if(!await reactionPage.locator("#game").isVisible())
  throw Error("Canvas original do salão indisponível após a final.");
 await reactionPage.screenshot({path:resolve(out,"corujao_reacao_campeao_real.png")});
 await reactionPage.close();
 // Pagamento acontece às 7h, não quando a final termina. A cena e o aviso
 // devem refletir o caixa e a carteira do vencedor já atualizados no motor.
 while(state.nightMeetup&&state.nightMeetup.elapsed<539)stepGame(state,1);
 if(nightPrizePresentation(state))throw Error("Prêmio anunciado antes do pagamento.");
 const cashBeforePrize=state.cash,expenseBeforePrize=state.expenses;
 stepGame(state,1);
 const award=nightPrizePresentation(state);
 if(!award||state.nightMeetup?.elapsed!==540||
    Math.round((cashBeforePrize-state.cash)*100)!==Math.round(award.amount*100)||
    Math.round((state.expenses-expenseBeforePrize)*100)!==Math.round(award.amount*100))
  throw Error("Aviso de prêmio não corresponde ao débito real das 7h.");
 const awardSave=parseImportedSave(serializeSave(state));
 if(!isValidSave(awardSave)||nightPrizePresentation(awardSave)?.winnerId!==award.winnerId)
  throw Error("A entrega real não sobreviveu ao salvamento.");
 const awardPage=await browser.newPage({viewport:{width:1280,height:850}});
 awardPage.on("pageerror",e=>errors.push(String(e)));
 await awardPage.addInitScript(({key,payload})=>localStorage.setItem(key,JSON.stringify(payload)),
   {key:GAME_SAVE_KEY,payload:awardSave});
 await awardPage.goto("http://127.0.0.1:"+server.address().port+"/",{waitUntil:"networkidle"});
 await dismissPrivacyNotice(awardPage);
 await awardPage.locator("#menu-continue").click();
 const notice=awardPage.locator("#night-prize-announcement");
 await notice.waitFor({state:"visible"});
 const receipt=await notice.textContent();
 if(!receipt.includes("jogador "+award.winnerId)||
    !receipt.includes(prizeAmountText(award.amount))||
    !await awardPage.locator("#game").isVisible())
  throw Error("Comprovante na partida real divergiu do prêmio pago.");
 await awardPage.screenshot({path:resolve(out,"corujao_premiacao_real_7h.png")});
 await awardPage.close();
 // 09h59: todos os minutos de saída acontecem no motor real, sem saltar a madrugada.
 let closingTicks=0;
 while(state.nightMeetup?.elapsed<719&&closingTicks++<180)stepGame(state,1);
 const preparing=nightReopeningPresentation(state);
 if(!preparing||preparing.phase!=="preparing"||preparing.minutesUntilOpen!==1)
  throw Error("Despedida da madrugada não chegou ao minuto 09h59.");
 const fridayMinute=state.totalMinutes;
 const farewellPage=await browser.newPage({viewport:{width:1280,height:850}});
 farewellPage.on("pageerror",e=>errors.push(String(e)));
 await farewellPage.addInitScript(({key,payload})=>localStorage.setItem(key,JSON.stringify(payload)),
   {key:GAME_SAVE_KEY,payload:state});
 await farewellPage.goto("http://127.0.0.1:"+server.address().port+"/",{waitUntil:"networkidle"});
 await dismissPrivacyNotice(farewellPage);
 await farewellPage.locator("#menu-continue").click();
 const countdown=await farewellPage.locator("#night-reopening-announcement");
 await countdown.waitFor({state:"visible"});
 if(!await countdown.textContent().then(s=>s.includes("1 min"))||
    !await farewellPage.locator("#game").isVisible())
  throw Error("Contagem regressiva do encerramento não aparece no salão real.");
 await farewellPage.screenshot({path:resolve(out,"corujao_preparando_reabertura_0959.png")});
 await farewellPage.close();
 // Só o motor avança o minuto decisivo, remove convidados e abre no sábado.
 stepGame(state,1);
 const opened=nightReopeningPresentation(state);
 if(state.nightMeetup||state.totalMinutes!==fridayMinute+1||
    !opened||opened.phase!=="open"||!isValidSave(state)||
    state.customers.some(c=>c.nightMeetupDay!==undefined))
  throw Error("Virada das 10h duplicou dia ou deixou convidados no salão.");
 const openPage=await browser.newPage({viewport:{width:1280,height:850}});
 openPage.on("pageerror",e=>errors.push(String(e)));
 await openPage.addInitScript(({key,payload})=>localStorage.setItem(key,JSON.stringify(payload)),
   {key:GAME_SAVE_KEY,payload:state});
 await openPage.goto("http://127.0.0.1:"+server.address().port+"/",{waitUntil:"networkidle"});
 await dismissPrivacyNotice(openPage);
 await openPage.locator("#menu-continue").click();
 const openLabel=openPage.locator("#night-reopening-announcement");
 await openLabel.waitFor({state:"visible"});
 if(!await openLabel.textContent().then(s=>s.includes("PORTAS ABERTAS"))||
    !await openPage.locator("#game").isVisible())
  throw Error("A reabertura real das 10h não ficou visível no jogo.");
 await openPage.screenshot({path:resolve(out,"corujao_portas_abertas_sabado_10h.png")});
 await openPage.close();
 // Atendimento de sábado: caminhar, pagar e ocupar o PC via stepGame original.
 const saturdayCustomerStart=state.nextCustomerId;
 const saturdayServed=state.served,saturdayRevenue=state.revenue;
 let normalPlayer;
 for(let minute=0;minute<300;minute++){
  stepGame(state,1);
  normalPlayer=state.customers.find(c=>c.id>=saturdayCustomerStart&&
    c.nightMeetupDay===undefined&&c.stage==="using"&&c.pcIndex!==null);
  if(normalPlayer)break;
 }
 if(!normalPlayer||state.revenue<=saturdayRevenue||state.served<=saturdayServed||
    state.nightMeetup||state.customers.some(c=>c.nightMeetupDay!==undefined))
  throw Error("Primeiro atendimento real de sábado não chegou ao PC após pagamento.");
 const customerPage=await browser.newPage({viewport:{width:1280,height:850}});
 customerPage.on("pageerror",e=>errors.push(String(e)));
 await customerPage.addInitScript(({key,payload})=>localStorage.setItem(key,JSON.stringify(payload)),
   {key:GAME_SAVE_KEY,payload:state});
 await customerPage.goto("http://127.0.0.1:"+server.address().port+"/",{waitUntil:"networkidle"});
 await dismissPrivacyNotice(customerPage);
 await customerPage.locator("#menu-continue").click();
 if(!await customerPage.locator("#game").isVisible())
  throw Error("Salão não mostra o cliente pagante real de sábado.");
 const saturdayPanel=customerPage.locator("#night-reopening-announcement");
 if(state.totalMinutes%DAY_MINUTES<=120){
  await saturdayPanel.waitFor({state:"visible"});
  if(!await saturdayPanel.textContent().then(t=>t.includes("ATENDIMENTO NORMAL")))
   throw Error("Painel não mostra a operação real de sábado.");
 }
 await customerPage.screenshot({path:resolve(out,"primeiro_cliente_real_sabado_pc.png")});
 await customerPage.close();
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
 // O sábado comercial provoca desgaste de PC; usar a manutenção real e paga
 // entre as sextas. Não alterar pcWear diretamente nem forçar estações válidas.
 function maintainFleet(){
  for(let pc=0;pc<3;pc++){
   let wait=0;
   while(stationHasCustomer(state,pc)&&wait++<200)stepGame(state,1);
   if(stationHasCustomer(state,pc))
    throw Error("PC ocupado por tempo excessivo durante manutenção do sábado.");
   if((state.pcWear?.[pc]??0)>=1)ok(startRepair(state,pc));
  }
  let elapsed=0;
  while(state.repairJobs?.length&&elapsed++<180)stepGame(state,1);
  if(state.repairJobs?.length)
   throw Error("Técnicos não finalizaram os reparos físicos antes da sexta.");
  if(!isValidSave(state))throw Error("Manutenção real gerou save inválido.");
 }
 for(const seats of [3,2,3,2]){
  maintainFleet();
  // Clientes comuns podem estar jogando enquanto os técnicos liberam os PCs.
  // Aguardar um horário com estações disponíveis, nunca cancelar suas sessões
  // nem adulterar a ocupação para encaixar uma sexta de teste.
  let quietMinutes=0;
  while(!firstFridayEligibility(state).ready&&quietMinutes++<720)
   stepGame(state,1);
  if(!firstFridayEligibility(state).ready)
   throw Error("PCs indisponíveis mesmo após manutenção e expediente: "+
     JSON.stringify({reasons:firstFridayEligibility(state).reasons,
      pcWear:state.pcWear,poweredOff:state.pcPoweredOff,
      repairJobs:state.repairJobs,customers:state.customers.map(c=>({
       id:c.id,stage:c.stage,pc:c.pcIndex
      }))}));
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
  liveMatchCanvasCaptured:true,realChampionReactionCaptured:true,
  realSevenAMPrizeCaptured:true,reopeningCountdownCaptured:true,
  realSaturdayTenAMOpeningCaptured:true,
  firstSaturdayPayingPcCustomerCaptured:true,
  repeatedFridays:recordedFridays,mobileHistoryExpanded:true,
  mobileWidth:360,interface:"jogo original"},null,2));
 console.log("OK: planejamento, save, final no motor real e galeria no navegador.");
}finally{
 if(browser)await browser.close();
 await new Promise(ok=>server.close(ok));
}
