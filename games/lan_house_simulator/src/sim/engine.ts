/** engine.ts: módulo do runtime LHS; lógica executada por minuto do jogo. */
export {LAST_ADMISSION_MINUTE,CLOSING_START_MINUTE,createGame,dayNumber,displayTime,online,legacyPcCount,pcCount,pcWear,pcBroken,roomWidth,entrance,pcPosition,addLog,applyResult} from "./simulationState.js";
export {canCustomerOccupy,EXIT_REACH_DISTANCE} from "./customerMotion.js";
export {chooseAvailablePc} from "./customerFlow.js";
import {productSpec,receiveDueOrders,validMerchandise} from "./merchandise.js";
import {validateObjectPlacements} from "./editableObjects.js";
import type {Customer,GameState,Item} from "./types.js";
import {DAY_MINUTES,SESSION_MINUTES} from "./types.js";
import {demandFactor,monthlyBills,energyCostPerMinute} from "./economy.js";
import {paidMonthlyBillReceipt,validPaidMonthlyBill} from "./financialClarity.js";
import {tickNeeds} from "./needs.js";
import {refreshRetailQueues} from "./retailQueue.js";
import {tickServices,addWaste,dispatchHiredStaff} from "./services.js";
import {accrueEmployeeDay,validEmployeeState} from "./staff.js";
import {reviewNotices} from "./notices.js";
import {scheduleDecisions} from "./decisions.js";
import {validDiscCopier,discWalkInDue,discCopiesToday,DISC_COPIES_PER_DAY} from "./discCopy.js";
import {validPrinterService,printWalkInDue,pagesPrintedToday,PRINT_PAGES_PER_DAY} from "./printService.js";
import {GAME_LAST_MINUTE,GAME_END_DAY,isSporadicMailId} from "./mailCalendar.js";
import {storyVisitorMultiplier,STORY_IDS,CHAIN_IDS} from "./storyEvents.js";
import {validCustomerFeedback} from "./customerFeedback.js";
import {promotionVisitorMultiplier} from "./promotion.js";
import {recordComputerUtilization,closeFinancialMonth} from "./financialReview.js";
import {recordStationMinute,validStationLedger} from "./stationAccounting.js";
import {validLcdModels} from "./computerModels.js";
import {validHardwareState} from "./hardware.js";
import {stationReadyForSessions,validStationPower} from "./stationPower.js";
import {WINDOWS_ERAS} from "./era.js";
import {clampPriceToEra,normalizedHourlyPrice} from "./historicalEconomy.js";
import {ps1StationAvailable,ps1EnergyCostPerMinute,ps1HourPrice,validPs1State} from "./ps1.js";
import {validGpuGameLicenses,validGpuGameInstalls,validGpuGameInstallJobs,tickGpuGameInstallations,gpuGameSpec,preferredGpuGame,gpuGameVisitorMultiplier} from "./gpuGames.js";
import {validGpuGameDemand} from "./gpuDemand.js";
import {validEraGameLicenses,eraGameVisitorMultiplier} from "./eraGames.js";
import {dayNumber,online,pcCount,entrance,random,addLog,LAST_ADMISSION_MINUTE,CLOSING_START_MINUTE,SESSION_FINISH_MINUTE,localMinute} from "./simulationState.js";
import {EXIT_REACH_DISTANCE} from "./customerMotion.js";
import {sendHome,refreshCounterQueue} from "./customerFlow.js";
import {spawn,spawnPrintWalkIn,spawnDiscWalkIn} from "./customerArrival.js";
import {tickMultiplayerVisitors,validMultiplayerVisit} from "./multiplayerVisitors.js";
import {validFridayMeetupDraft} from "./fridayMeetup.js";
import {beginNightMeetup,nightScheduledForClosing,advanceNightMeetup,validNightMeetup} from "./nightMeetup.js";
import {advanceCustomer} from "./customerLifecycle.js";

function nextDay(s: GameState): void {
  for(const c of s.customers)if(c.stage!=="leaving")sendHome(s,c);
  // Na virada, máquina que envelheceu pode perder competitividade.
  if(clampPriceToEra(s))addLog(s,"Tarifa ajustada ao teto da época e aos computadores disponíveis.");
  s.weather = random(s) < 0.27 ? "rain" : "sun";
  s.offlineUntil = Math.min(s.offlineUntil, s.totalMinutes);
  addLog(s, s.weather === "rain" ? "Dia chuvoso: demanda menor e rede instável." : "Novo dia: portas abertas.");
  if (dayNumber(s) > 1 && (dayNumber(s) - 1) % 30 === 0) {
    // A conta encerra o mês que acabou, não antecipa o índice do mês seguinte.
    const closingState={...s,totalMinutes:Math.max(0,s.totalMinutes-1)};
    const bill=monthlyBills(closingState);
    const energy=Math.round(s.energyAccrued??0);
    const wages=s.employeePayrollAccrued??0;
    const cashAfterPayment=s.cash-bill;
    // Registrar as parcelas antes de limpar os acumuladores de energia/salários.
    const paidReceipt=paidMonthlyBillReceipt(closingState,dayNumber(s)-1,bill,cashAfterPayment);
    s.cash -= bill; s.expenses += bill;
    s.lastPaidMonthlyBill=paidReceipt;
    s.energyAccrued=0;
    s.employeePayrollAccrued=0;
    s.employeeWorkedDays={cleaner:0,technician:0};
    closeFinancialMonth(s);
    addLog(s, "Contas do mês pagas: -R$ " + bill + " (energia R$ "+energy+"; salários R$ "+wages+"; aluguel, internet e manutenção).");
  }
  // A diária do novo dia só entra depois do fechamento mensal anterior.
  accrueEmployeeDay(s);
  reviewNotices(s);
  scheduleDecisions(s);
  // Infrações dependem de cartas e prazos relativos, nunca de multas aleatórias diárias.
  if (s.cash < 0) addLog(s, "Atenção: caixa negativo. Reorganize a operação!");
}
export function visitorArrivalChance(s:GameState,occupied:number):number {
  // Não bloquear o público de console quando todos os PCs estão apagados.
  // O serviço PS1 não depende da internet e só admite clientes se há cadeira livre.
  const poweredPcs=Array.from({length:pcCount(s)},(_,i)=>i).filter(i=>stationReadyForSessions(s,i)).length;
  const consoleCapacity=(s.ps1Stations??[]).filter((_,i)=>ps1StationAvailable(s,i)).length;
  if(!poweredPcs&&!consoleCapacity)return 0;
  if(localMinute(s)>=LAST_ADMISSION_MINUTE||
    (localMinute(s)<10&&s.customers.some(c=>c.stage==="leaving")))return 0;
  const consoleOnly=poweredPcs===0;
  const rate=normalizedHourlyPrice(s,consoleOnly?ps1HourPrice(s):s.pricePerHour);
  const factor=demandFactor(rate,s.reputation,consoleOnly||online(s),s.weather==="rain");
  const congestion=occupied>=poweredPcs+(s.ps1Stations?.length??0)?0.38:1;
  return 0.052*factor*promotionVisitorMultiplier(s)*storyVisitorMultiplier(s)*eraGameVisitorMultiplier(s)*gpuGameVisitorMultiplier(s)*congestion;
}
/** Dispensa em pequenos grupos: fila e compras primeiro, sessões até 21h30. */
function prepareClosing(s:GameState):void {
 const minute=localMinute(s);
 if(minute<CLOSING_START_MINUTE)return;
 const exit=entrance(s);
 const active=(c:Customer)=>c.stage==="using"||c.stage==="sitting"||c.stage==="to_pc";
 const candidates=s.customers.filter(c=>c.stage!=="leaving").sort((a,b)=>{
   if(active(a)!==active(b))return active(a)?1:-1;
   return Math.hypot(a.x-exit.x,a.y-exit.y)-Math.hypot(b.x-exit.x,b.y-exit.y)||a.id-b.id;
 });
 // Poucos clientes por vez: um a cada dois minutos no começo, um por
 // minuto depois das 21h20. Evita uma debandada quando muitos PCs desocupam.
 if(minute<CLOSING_START_MINUTE+20&&(minute-CLOSING_START_MINUTE)%2!==0)return;
 const next=candidates.find(c=>
   !active(c)||minute>=SESSION_FINISH_MINUTE||c.usedMinutes>=(c.sessionMinutes??SESSION_MINUTES));
 if(next)sendHome(s,next);
}
function advanceMinute(s: GameState): void {
  if(s.nightMeetup){
    if(advanceNightMeetup(s)){
      s.totalMinutes++; // Uma única virada para sábado 10h.
      nextDay(s);
    }
    return;
  }
  if(s.totalMinutes>=GAME_LAST_MINUTE)return;
  if(nightScheduledForClosing(s)){
    beginNightMeetup(s);
    if(s.nightMeetup){advanceNightMeetup(s);return;}
  }
  // Cobrar o consumo real por minuto: cada PC ligado usa standby; ocupados consomem mais.
  // Acumular inclusive o último minuto antes da virada mensal.
  const energyExpense=energyCostPerMinute(s)+ps1EnergyCostPerMinute(s);
  s.energyAccrued=(s.energyAccrued??0)+energyExpense;
  recordComputerUtilization(s);
  recordStationMinute(s,pcCount(s),energyExpense);
  s.totalMinutes++;
  for(const message of receiveDueOrders(s))addLog(s,message);
  if(s.economyVersion===2&&s.totalMinutes===4*360*DAY_MINUTES)
    addLog(s,"2002: chegaram os videogames! A loja agora oferece bancada com PlayStation 1, TV de tubo e cadeira.");
  for(const installed of tickGpuGameInstallations(s))
    addLog(s,"Download concluído: "+gpuGameSpec(installed.id)?.name+" no PC "+(installed.pc+1)+".");
  if(s.totalMinutes===GAME_LAST_MINUTE)addLog(s,"Fim de 2030: calendário da campanha concluído.");
  if(s.totalMinutes===1)reviewNotices(s);
  if (s.totalMinutes % DAY_MINUTES === 0) {s.multiplayerVisit=undefined;nextDay(s); return;}
  if (s.offlineUntil === s.totalMinutes) addLog(s, "A internet voltou!");
  if (online(s)) {
    const chance = (s.weather === "rain" ? 0.00065 : 0.00015) / Math.sqrt(s.internetTier);
    if (random(s) < chance) {
      const duration = Math.max(7, 36 - s.internetTier * 8);
      s.offlineUntil = s.totalMinutes + duration;
      addLog(s, "Internet caiu! Previsão de reparo: " + duration + " minutos do jogo.");
    }
  }
  dispatchHiredStaff(s);
  // Uma visita contratual ainda ativa após a virada do dia ganha uma só diária
  // no novo dia, também quando o jogo retoma um save intermediário.
  accrueEmployeeDay(s);
  tickServices(s);
  prepareClosing(s);
  const occupied = s.customers.filter(c => c.stage === "using" || c.stage === "to_pc").length;
  const admission=visitorArrivalChance(s,occupied);
  if (s.customers.length < 14 && admission>0 && random(s)<admission)spawn(s);
  // Grupos pequenos entram aos poucos pela mesma porta dos demais clientes.
  tickMultiplayerVisitors(s);
  // Outra fonte de movimento comercial: sem PC, sem receita passiva e sem RNG adicional.
  if(s.customers.length<14&&printWalkInDue(s)&&pagesPrintedToday(s)<PRINT_PAGES_PER_DAY)spawnPrintWalkIn(s);
  if(s.customers.length<14&&discWalkInDue(s)&&discCopiesToday(s)<DISC_COPIES_PER_DAY)spawnDiscWalkIn(s);
  if(localMinute(s)<CLOSING_START_MINUTE){
    refreshCounterQueue(s);
    refreshRetailQueues(s);
  }
  // Remover cada cliente assim que atravessa a soleira, liberando a porta
  // antes do próximo. Dar prioridade a quem já está saindo e está mais perto.
  const exit=entrance(s);
  const order=[...s.customers].sort((a,b)=>
    a.stage==="leaving"&&b.stage!=="leaving"?-1:
    a.stage!=="leaving"&&b.stage==="leaving"?1:
    a.stage==="leaving"&&b.stage==="leaving"?
      Math.hypot(a.x-exit.x,a.y-exit.y)-Math.hypot(b.x-exit.x,b.y-exit.y):a.id-b.id);
  for(const c of order){
    tickNeeds(c);advanceCustomer(s,c);
    if(c.stage==="leaving"&&Math.hypot(c.x-exit.x,c.y-exit.y)<=EXIT_REACH_DISTANCE){
      const index=s.customers.indexOf(c);if(index>=0)s.customers.splice(index,1);
    }
  }
  if(s.totalMinutes%70===0)addWaste(s,2);
}
export function stepGame(s: GameState, deltaMinutes: number): void {
  if (!Number.isFinite(deltaMinutes) || deltaMinutes <= 0) return;
  if(s.totalMinutes>=GAME_LAST_MINUTE){s.totalMinutes=GAME_LAST_MINUTE;s.leftoverMinutes=0;return;}
  s.leftoverMinutes += Math.min(deltaMinutes, 120);
  while (s.leftoverMinutes >= 1 && s.totalMinutes<GAME_LAST_MINUTE) {
    s.leftoverMinutes--;advanceMinute(s);
  }
  if(s.totalMinutes>=GAME_LAST_MINUTE)s.leftoverMinutes=0;
}
export function isValidSave(value: unknown): value is GameState {
  if (!value || typeof value !== "object") return false;
  const v = value as Partial<GameState>;
  const metrics=[v.monthPcUsedMinutes,v.monthPcCapacityMinutes,v.lastMonthPcUsedMinutes,
    v.lastMonthPcCapacityMinutes,v.monthRevenueBase,v.monthExpensesBase,v.lastMonthRevenue,v.lastMonthExpenses];
  return validMultiplayerVisit(v) && validFridayMeetupDraft(v) && validNightMeetup(v) && validMerchandise(v) && validCustomerFeedback(v.customerFeedback,v.totalMinutes??0) && validEmployeeState(v) && validStationPower(v) && validPs1State(v) && validPaidMonthlyBill(v.lastPaidMonthlyBill,v) && (v.economyVersion===undefined||v.economyVersion===2) && validDiscCopier(v) && validPrinterService(v) && validHardwareState(v) && validGpuGameLicenses(v.licensedGpuGames,v) && validGpuGameInstalls(v.gpuGameInstalls,v) && validGpuGameInstallJobs(v.gpuGameInstallJobs,v) && validGpuGameDemand(v.gpuGameDemand) && validEraGameLicenses(v.licensedEraGames,v) && validLcdModels(v.pcLcdModels) && validStationLedger(v.stationLedger) &&
    (v.stationLedger===undefined||v.stationLedger.length<=pcCount(v as GameState)) &&
    (v.pcWindows===undefined||(Array.isArray(v.pcWindows)&&v.pcWindows.length<=200&&v.pcWindows.every(id=>id===null||WINDOWS_ERAS.some(w=>w.id===id)))) &&
    metrics.every(n=>n===undefined||(Number.isFinite(n)&&n>=0&&n<=1e9)) &&
    v.version === 1 && Number.isFinite(v.totalMinutes) && Number.isFinite(v.cash) &&
    Number.isFinite(v.rng) && Number.isFinite(v.pricePerHour) &&
    v.inventory !== undefined && ["soda", "candy", "snacks"].every(k => Number.isFinite(v.inventory?.[k as Item])) &&
    Array.isArray(v.customers) && v.customers.every(c=>!!c&&
      (c.retailConsumption===undefined||(!!c.retailConsumption&&!!productSpec(c.retailConsumption.product)&&Number.isInteger(c.retailConsumption.untilMinute)&&c.retailConsumption.untilMinute>=0&&c.retailConsumption.untilMinute<=1e9))&&
      (c.desiredProduct===undefined||(!!productSpec(c.desiredProduct)&&productSpec(c.desiredProduct)!.category===c.desiredItem))&&
      [c.purchasedDrink,c.purchasedFood,c.gpuGamer,c.gpuGameCharged,c.discCopyChecked,c.printChecked,c.doorwayYielding,c.budgetAware].every(flag=>flag===undefined||typeof flag==="boolean")&&
      (c.preference===undefined||["economy","comfort","gaming","quick"].includes(c.preference))&&
      (c.preferredGpuGame===undefined||(c.gpuGamer===true&&gpuGameSpec(c.preferredGpuGame)!==undefined))&&
      (c.serviceRequest===undefined||c.serviceRequest==="printing"||c.serviceRequest==="disc-copy")&&
      (c.multiplayerVisitId===undefined||(Number.isInteger(c.multiplayerVisitId)&&c.multiplayerVisitId>0&&c.multiplayerVisitId<=v.nextCustomerId!))&&
      (c.nightMeetupDay===undefined||(v.nightMeetup!==undefined&&c.nightMeetupDay===v.nightMeetup.fridayDay))&&
      (c.multiplayerAssignedPc===undefined||(Number.isInteger(c.multiplayerAssignedPc)&&c.multiplayerAssignedPc>=0&&c.multiplayerAssignedPc<pcCount(v as GameState)))&&
      (c.ps1StationIndex===undefined||(Number.isInteger(c.ps1StationIndex)&&c.ps1StationIndex>=0&&
        c.ps1StationIndex<(v.ps1Stations?.length??0)&&c.pcIndex===null))&&
      (c.ps1SeatIndex===undefined||(c.ps1StationIndex!==undefined&&
        (c.ps1SeatIndex===0||(c.ps1SeatIndex===1&&v.ps1Stations?.[c.ps1StationIndex]?.secondSeat===true))))&&
      (c.nextCrowdRetryMinute===undefined||(Number.isInteger(c.nextCrowdRetryMinute)&&c.nextCrowdRetryMinute>=0&&c.nextCrowdRetryMinute<=1e9))&&
      (c.stalledMinutes===undefined||(Number.isInteger(c.stalledMinutes)&&c.stalledMinutes>=0&&c.stalledMinutes<=120))&&
      (c.retailQueueItem===undefined||["soda","candy","snacks"].includes(c.retailQueueItem))&&
      (c.retailQueueIndex===undefined||(Number.isInteger(c.retailQueueIndex)&&c.retailQueueIndex>=0&&c.retailQueueIndex<14))) && Array.isArray(v.eventLog) &&
    Number.isInteger(v.internetTier) && Number.isInteger(v.expansionLevel) &&
    (v.energyAccrued===undefined || (Number.isFinite(v.energyAccrued)&&v.energyAccrued>=0)) &&
    (v.binFill===undefined || (Array.isArray(v.binFill)&&v.binFill.length===2&&v.binFill.every(n=>Number.isFinite(n)&&n>=0&&n<=100))) &&
    (v.overflowWaste===undefined||(Number.isFinite(v.overflowWaste)&&v.overflowWaste>=0&&v.overflowWaste<=1000)) &&
    (v.mailScheduleSeed===undefined||(Number.isInteger(v.mailScheduleSeed)&&v.mailScheduleSeed>=0&&v.mailScheduleSeed<=0xffffffff)) &&
    (v.mailStartDay===undefined||(Number.isInteger(v.mailStartDay)&&v.mailStartDay>=1&&v.mailStartDay<=GAME_END_DAY)) &&
    (v.y2kNoticeDelivered===undefined||typeof v.y2kNoticeDelivered==="boolean") &&
    (v.ericFirstMailDelivered===undefined||typeof v.ericFirstMailDelivered==="boolean") &&
    (v.ericSecondMailDelivered===undefined||typeof v.ericSecondMailDelivered==="boolean") &&
    (v.mailSeenIds===undefined||(Array.isArray(v.mailSeenIds)&&v.mailSeenIds.length<=8&&
      new Set(v.mailSeenIds).size===v.mailSeenIds.length&&v.mailSeenIds.every(id=>isSporadicMailId(id)))) &&
    (v.storySeenIds===undefined||(Array.isArray(v.storySeenIds)&&v.storySeenIds.length<=STORY_IDS.length&&
      new Set(v.storySeenIds).size===v.storySeenIds.length&&
      v.storySeenIds.every(id=>STORY_IDS.some(key=>key===id)))) &&
    (v.storyRecords===undefined||(Array.isArray(v.storyRecords)&&v.storyRecords.length<=STORY_IDS.length+4&&
      new Set(v.storyRecords.map(r=>r.id)).size===v.storyRecords.length&&
      v.storyRecords.every(r=>!!r&&CHAIN_IDS.some(id=>id===r.id)&&
       typeof r.choice==="string"&&r.choice.length<=80&&
       (r.choiceLabel===undefined||(typeof r.choiceLabel==="string"&&r.choiceLabel.length<=200))&&
       ["good","mixed","bad"].includes(r.outcome)&&["pending","awaiting","ending","done"].includes(r.stage)&&
       Number.isInteger(r.dueDay)&&r.dueDay>=1&&r.dueDay<=1e7&&
       (r.followupChoice===undefined||(typeof r.followupChoice==="string"&&r.followupChoice.length<=80))&&
       (r.followupLabel===undefined||(typeof r.followupLabel==="string"&&r.followupLabel.length<=200))&&
       (r.finalOutcome===undefined||["good","mixed","bad"].includes(r.finalOutcome))))) &&
    (v.storyVisitorEffects===undefined||(Array.isArray(v.storyVisitorEffects)&&v.storyVisitorEffects.length<=32&&
      v.storyVisitorEffects.every(e=>!!e&&typeof e.id==="string"&&e.id.length<=100&&
       Number.isFinite(e.factor)&&e.factor>=0.5&&e.factor<=1.5&&
       Number.isInteger(e.untilDay)&&e.untilDay>=1&&e.untilDay<=1e7))) &&

    (v.notices===undefined || (Array.isArray(v.notices)&&v.notices.every(n=>typeof n.id==="string"&&typeof n.title==="string"&&typeof n.body==="string"&&typeof n.read==="boolean"))) &&
    [v.electricalInspectionSeen,v.electricalWiringRegularized,v.electricalExtensionUsed,v.electricalInspectionFineApplied]
      .every(flag=>flag===undefined||typeof flag==="boolean") &&
    (v.electricalDeadlineDay===undefined || (Number.isInteger(v.electricalDeadlineDay)&&v.electricalDeadlineDay>=1&&v.electricalDeadlineDay<=1e7)) &&
    (v.promotionDay===undefined || (Number.isInteger(v.promotionDay)&&v.promotionDay>=1&&v.promotionDay<=Math.floor(v.totalMinutes! / DAY_MINUTES)+1)) && validateObjectPlacements(v as GameState);
}
