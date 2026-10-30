import type {GameState,Result} from "./types.js";
import {GPU_CATALOG,installedGpu} from "./gpu.js";
import {WINDOWS_ERAS,installedWindows} from "./eraCatalog.js";
import {annualHourlyCeiling,isHistorical,sessionPrice,yearFromMinutes} from "./historicalEconomy.js";
import {stationPowerCount,stationPoweredOn,stationHasCustomer,stationReadyForSessions} from "./stationPower.js";
import {gamePopularityWeight} from "./gamePopularity.js";

/** Títulos fictícios, independentes do catálogo básico R$ 450.
 * A licença é do estabelecimento; a execução e o adicional são por PC.
 * Custos e adicionais são hipóteses de design, não preços históricos.
 */
export const GPU_GAME_CATALOG=[
 {id:"neon-rush",name:"Neon Rush Online",year:2005,cost:580,minGpu:"gpu05",minWindows:"winxp",hourlyBonus:.75},
 {id:"circuito-competitivo",name:"Circuito Competitivo",year:2009,cost:950,minGpu:"gpu09",minWindows:"win7",hourlyBonus:1.25},
 {id:"arena-do-futuro",name:"Arena do Futuro",year:2013,cost:1550,minGpu:"gpu13",minWindows:"win7",hourlyBonus:1.75}
] as const;
export type GpuGameId=(typeof GPU_GAME_CATALOG)[number]["id"];
export type GpuGameSpec=(typeof GPU_GAME_CATALOG)[number];
export interface GpuGameInstallJob {pc:number;id:GpuGameId;durationMinutes:number;elapsedMinutes:number}
/** Duração fixa no começo; upgrades de internet afetam apenas os próximos. */
export function gpuGameInstallDuration(s:GameState,id:GpuGameId):number{
 const base=id==="neon-rush"?18:id==="circuito-competitivo"?28:40;
 return Math.max(5,Math.ceil(base/Math.max(1,Math.min(3,s.internetTier))));
}
export function gpuGameInstallJob(s:GameState,pc:number):GpuGameInstallJob|undefined{
 return s.gpuGameInstallJobs?.find(j=>j.pc===pc);
}
export function gpuGameInstallPausedReason(s:GameState,pc:number):string|null{
 if(!stationPoweredOn(s,pc))return "PC desligado";
 if(s.totalMinutes<s.offlineUntil)return "sem internet";
 if(stationHasCustomer(s,pc))return "PC ocupado";
 if(s.repairJobs?.some(j=>j.pc===pc&&j.phase!=="leaving"))return "em manutenção";
 // O download permanece em pausa quando a GPU ou a licença Windows muda.
 // Sem esse diagnóstico ele ficava retido sem motivo visível ao jogador.
 const job=gpuGameInstallJob(s,pc);
 const title=job&&gpuGameSpec(job.id);
 if(title&&!gpuGameCompatible(s,pc,title))return "GPU ou Windows incompatível";
 return null;
}
export function validGpuGameInstallJobs(value:unknown,s:Partial<GameState>):boolean{
 if(value===undefined)return true;
 if(!isHistorical(s as GameState)||!Array.isArray(value)||
    value.length>stationPowerCount(s as GameState)||s.gpuGameInstalls===undefined)return false;
 const seen=new Set<number>();
 return value.every((job:GpuGameInstallJob)=>{
  if(!job||typeof job!=="object"||Array.isArray(job))return false;
  if(!Number.isInteger(job.pc)||job.pc<0||job.pc>=stationPowerCount(s as GameState)||seen.has(job.pc))return false;
  seen.add(job.pc);
  return typeof job.id==="string"&&!!gpuGameSpec(job.id)&&
   s.licensedGpuGames?.includes(job.id)===true&&
   s.gpuGameInstalls?.[job.pc]?.includes(job.id)!==true&&
   Number.isInteger(job.durationMinutes)&&job.durationMinutes>=5&&job.durationMinutes<=40&&
   Number.isInteger(job.elapsedMinutes)&&job.elapsedMinutes>=0&&job.elapsedMinutes<job.durationMinutes;
 });
}
/** Cada geração de internet suporta 1, 2 ou 3 PCs transferindo por
 * minuto do jogo. Não há custo extra, sorteio nem campo novo no save. */
export function gpuGameDownloadSlots(s:GameState):number{
 return Math.max(1,Math.min(3,Math.trunc(s.internetTier||1)));
}
/** Agendamento por rodízio: PCs pausados não ocupam a banda. O índice
 * do minuto absoluto garante o mesmo progresso após importar a partida. */
export function tickGpuGameInstallations(s:GameState):Array<{pc:number;id:GpuGameId}>{
 const completed:Array<{pc:number;id:GpuGameId}>=[];
 if(!s.gpuGameInstallJobs?.length)return completed;
 const active=s.gpuGameInstallJobs.filter(job=>{
  const spec=gpuGameSpec(job.id);
  return !!spec&&!gpuGameInstallPausedReason(s,job.pc)&&gpuGameCompatible(s,job.pc,spec);
 });
 const selected=new Set<GpuGameInstallJob>();
 if(active.length){
  const count=Math.min(active.length,gpuGameDownloadSlots(s));
  const start=s.totalMinutes%active.length;
  for(let slot=0;slot<count;slot++)selected.add(active[(start+slot)%active.length]!);
 }
 const pending:GpuGameInstallJob[]=[];
 for(const job of s.gpuGameInstallJobs){
  if(!selected.has(job)){pending.push(job);continue;}
  job.elapsedMinutes++;
  if(job.elapsedMinutes>=job.durationMinutes){
   const installed=s.gpuGameInstalls?.[job.pc];
   if(installed&&!installed.includes(job.id))installed.push(job.id);
   completed.push({pc:job.pc,id:job.id});
  }else pending.push(job);
 }
 s.gpuGameInstallJobs=pending;
 return completed;
}
export function cancelGpuGameInstallation(s:GameState,pc:number,id:GpuGameId):Result{
 const job=gpuGameInstallJob(s,pc);
 if(!job||job.id!==id)return {ok:false,message:"Não há download deste título no PC."};
 s.gpuGameInstallJobs=s.gpuGameInstallJobs!.filter(j=>j!==job);
 return {ok:true,message:"Download de "+gpuGameSpec(id)!.name+" cancelado no PC "+(pc+1)+". Sem custo."};
}
export function gpuGameSpec(id:string):GpuGameSpec|undefined{
 return GPU_GAME_CATALOG.find(game=>game.id===id);
}
export function validGpuGameLicenses(value:unknown,s:Partial<GameState>):boolean{
 if(value===undefined)return true; // saves antigos não tinham catálogo avançado
 if(!isHistorical(s as GameState)||!s.licensedGames||!Array.isArray(value)||
    value.length>GPU_GAME_CATALOG.length)return false;
 const seen=new Set<string>();
 const year=yearFromMinutes(s.totalMinutes??0);
 return value.every(id=>{
  if(typeof id!=="string"||seen.has(id))return false;
  seen.add(id);
  const spec=gpuGameSpec(id);
  return !!spec&&spec.year<=year;
 });
}

/** Jogos implicitamente instalados em saves antigos até a primeira edição. */
export function gpuGameInstalledOnPc(s:GameState,index:number,id:GpuGameId):boolean{
 if(!Number.isInteger(index)||index<0||index>=stationPowerCount(s)||!s.licensedGpuGames?.includes(id))return false;
 return s.gpuGameInstalls===undefined?true:s.gpuGameInstalls[index]?.includes(id)===true;
}
export function validGpuGameInstalls(value:unknown,s:Partial<GameState>):boolean{
 if(value===undefined)return true;
 if(!isHistorical(s as GameState)||!Array.isArray(value)||value.length>stationPowerCount(s as GameState))return false;
 return value.every(row=>Array.isArray(row)&&row.length<=GPU_GAME_CATALOG.length&&
  new Set(row).size===row.length&&row.every(id=>typeof id==="string"&&
   s.licensedGpuGames?.some(owned=>owned===id)&&!!gpuGameSpec(id)));
}
/** Preserva todos os títulos nas partidas antigas, mas não inventa instalação
 * em computadores adquiridos APÓS a primeira edição. */
function currentGpuInstallRows(s:GameState):GpuGameId[][]{
 const legacy=s.gpuGameInstalls===undefined;
 return Array.from({length:stationPowerCount(s)},(_,i)=>
  legacy?[...(s.licensedGpuGames??[])]:[...(s.gpuGameInstalls?.[i]??[])]);
}
function pcAvailableForGameManagement(s:GameState,index:number):boolean{
 return stationPoweredOn(s,index)&&!stationHasCustomer(s,index)&&
  !(s.repairJobs?.some(job=>job.pc===index&&job.phase!=="leaving")??false);
}
/** A licença já foi paga. A instalação exige PC ligado, livre e sem manutenção. */
export function toggleGpuGameInstallation(s:GameState,index:number,id:GpuGameId):Result{
 const game=gpuGameSpec(id);
 if(!game||!s.licensedGpuGames?.includes(id)||!isHistorical(s))
  return {ok:false,message:"É necessário licenciar este jogo primeiro."};
 if(!Number.isInteger(index)||index<0||index>=stationPowerCount(s))
  return {ok:false,message:"Computador inexistente."};
 if(!stationPoweredOn(s,index))
  return {ok:false,message:"Ligue o PC "+(index+1)+" antes de alterar os jogos."};
 if(stationHasCustomer(s,index))
  return {ok:false,message:"PC "+(index+1)+" ocupado. Aguarde o cliente sair."};
 if(s.repairJobs?.some(job=>job.pc===index&&job.phase!=="leaving"))
  return {ok:false,message:"Aguarde o reparo do PC "+(index+1)+"."};
 if(gpuGameInstallJob(s,index))return {ok:false,message:"O PC "+(index+1)+" já está baixando um jogo."};
 const installed=gpuGameInstalledOnPc(s,index,id);
 if(!installed&&!gpuGameCompatible(s,index,game))
  return {ok:false,message:"PC "+(index+1)+" não possui GPU e Windows compatíveis."};
 // A transição inicial copia o estado antigo de todas as estações.
 s.gpuGameInstalls=currentGpuInstallRows(s);
 const row=s.gpuGameInstalls[index]!;
 if(installed){
  s.gpuGameInstalls[index]=row.filter(title=>title!==id);
  return {ok:true,message:game.name+" removido do PC "+(index+1)+". Sem custo."};
 }
 const durationMinutes=gpuGameInstallDuration(s,id);
 (s.gpuGameInstallJobs??=[]).push({pc:index,id,durationMinutes,elapsedMinutes:0});
 return {ok:true,message:"Baixando "+game.name+" no PC "+(index+1)+
  " · "+durationMinutes+" minutos do jogo. Sem custo."};
}
/** Distribuição gratuita para PCs aptos, sem mexer nas máquinas ocupadas
 * ou desligadas. Nenhuma mutação quando todas as estações estão bloqueadas.
 * O retorno informa quantas instalações foram realizadas ou adiadas. */
export function installGpuGameOnAvailablePcs(s:GameState,id:GpuGameId):Result{
 const spec=gpuGameSpec(id);
 if(!spec||!isHistorical(s)||!s.licensedGpuGames?.includes(id))
  return {ok:false,message:"É necessário licenciar este jogo antes de distribuí-lo."};
 const missing=gpuGameEligiblePcs(s,spec).filter(i=>!gpuGameInstalledOnPc(s,i,id));
 if(!missing.length)return {ok:false,message:spec.name+" já está instalado em todos os PCs compatíveis."};
 const available=missing.filter(i=>pcAvailableForGameManagement(s,i)&&!gpuGameInstallJob(s,i));
 if(!available.length)return {ok:false,message:"Não há PCs livres e ligados para instalar "+spec.name+" agora."};
 s.gpuGameInstalls=currentGpuInstallRows(s);
 const durationMinutes=gpuGameInstallDuration(s,id);
 (s.gpuGameInstallJobs??=[]).push(...available.map(pc=>({pc,id,durationMinutes,elapsedMinutes:0})));
 const waiting=missing.length-available.length;
 return {ok:true,message:"Download de "+spec.name+" iniciado em "+available.length+" PC(s)"+
  (waiting?"; "+waiting+" aguardando PC disponível":"")+
  ". Duração: "+durationMinutes+" minutos do jogo. Sem custo."};
}
/** Licença Windows paga e hardware compatível na estação especificada. */
export function gpuGameCompatible(s:GameState,index:number,game:GpuGameSpec):boolean{
 const count=Math.max(3,Math.min(3+s.expansionLevel*2,s.installedPcs??(3+s.expansionLevel*2)))+(s.annexPcs?.length??0);
 if(index<0||!Number.isInteger(index)||index>=count)return false;
 if(s.pcWindowsLicenses?.[index]!==true)return false;
 const gpu=installedGpu(s,index);
 const current=GPU_CATALOG.findIndex(x=>x.id===gpu);
 const required=GPU_CATALOG.findIndex(x=>x.id===game.minGpu);
 const os=WINDOWS_ERAS.findIndex(x=>x.id===installedWindows(s,index));
 const requiredOs=WINDOWS_ERAS.findIndex(x=>x.id===game.minWindows);
 return current>=required&&required>=0&&os>=requiredOs&&requiredOs>=0;
}
export function gpuGameEligiblePcs(s:GameState,game:GpuGameSpec):number[]{
 const original=Math.max(3,Math.min(3+s.expansionLevel*2,s.installedPcs??(3+s.expansionLevel*2)));
 const count=original+(s.annexPcs?.length??0);
 return Array.from({length:count},(_,i)=>i).filter(i=>gpuGameCompatible(s,i,game));
}
/** Somente uma licença paga E ao menos um PC realmente compatível representam
 * oferta comercial de jogos avançados. Planejar divulgação não cria capacidade. */
export function hasPlayableGpuGame(s:GameState):boolean{
 if(!isHistorical(s)||!s.licensedGames)return false;
 const year=yearFromMinutes(s.totalMinutes);
 return (s.licensedGpuGames??[]).some(id=>{
  const game=gpuGameSpec(id);
  return !!game&&game.year<=year&&gpuGameEligiblePcs(s,game).some(i=>gpuGamePlayableOnPc(s,i,id));
 });
}
/** Procura adicional por um jogo GPU efetivamente ofertado hoje.
 * Uma licença sem instalação, PC ligado e compatível não anuncia algo que
 * a lan house não pode oferecer. Não afeta tarifa, compra ou licenças.
 */
export function gpuGameAttraction(s:GameState,id:GpuGameId):number{
 if(!isHistorical(s)||!s.licensedGames||!s.licensedGpuGames?.includes(id))return 0;
 const title=gpuGameSpec(id),year=yearFromMinutes(s.totalMinutes);
 if(!title||year<title.year)return 0;
 if(!gpuGameEligiblePcs(s,title).some(i=>
   stationReadyForSessions(s,i)&&gpuGamePlayableOnPc(s,i,id)))return 0;
 return .025*gamePopularityWeight(title.year,year);
}
/** Até +7,5% para três títulos recentes, com desgaste natural até a nostalgia.
 * Sem RNG, estado persistido ou receitas extras.
 */
export function gpuGameVisitorMultiplier(s:GameState):number{
 if(!isHistorical(s)||!s.licensedGames||!(s.licensedGpuGames?.length))return 1;
 const total=s.licensedGpuGames.reduce((sum,id)=>sum+gpuGameAttraction(s,id),0);
 return 1+Math.min(.075,total);
}
export interface GpuGameQuote extends Result {cost:number;eligiblePcs:number[]}
export function quoteGpuGame(s:GameState,id:string):GpuGameQuote{
 const game=gpuGameSpec(id),cost=game?.cost??0;
 const eligiblePcs=game?gpuGameEligiblePcs(s,game):[];
 const reject=(message:string):GpuGameQuote=>({ok:false,message,cost,eligiblePcs});
 if(!game)return reject("Jogo não encontrado no catálogo.");
 if(!isHistorical(s))return reject("Jogos GPU são exclusivos do modo histórico.");
 if(yearFromMinutes(s.totalMinutes)<game.year)return reject("Lançamento em "+game.year+".");
 if(!s.licensedGames)return reject("Regularize primeiro o catálogo básico de jogos.");
 if(s.licensedGpuGames?.includes(game.id))return reject("Jogo já licenciado.");
 if(eligiblePcs.length===0)return reject("Requer ao menos um PC com GPU "+game.minGpu+" ou superior, Windows "+game.minWindows+" licenciado e hardware compatível.");
 if(s.cash<cost)return reject("Caixa insuficiente: licença custa R$ "+cost+".");
 return {ok:true,cost,eligiblePcs,message:"Licenciar "+game.name+" por R$ "+cost+" para "+eligiblePcs.length+" PC(s) compatível(is)."};
}
export function licenseGpuGame(s:GameState,id:string):Result{
 const quote=quoteGpuGame(s,id);
 if(!quote.ok)return {ok:false,message:quote.message};
 const game=gpuGameSpec(id)!;
 s.cash-=quote.cost;s.expenses+=quote.cost;
 (s.licensedGpuGames??=[]).push(game.id);
 // Em partidas com instalações explícitas, habilitar o novo jogo somente
 // nos PCs que já eram compatíveis ao comprar a licença.
 if(s.gpuGameInstalls!==undefined){
  const eligible=new Set(quote.eligiblePcs);
  s.gpuGameInstalls=Array.from({length:stationPowerCount(s)},(_,i)=>{
   const titles=[...(s.gpuGameInstalls?.[i]??[])];
   if(eligible.has(i))titles.push(game.id);
   return titles;
  });
 }
 return {ok:true,message:game.name+" licenciado por R$ "+quote.cost+". Instalação disponível nos PCs compatíveis."};
}
/** A preferência é fixada na chegada, apenas entre títulos já lançados.
 * Atribuição determinística por ID, sem sorteio extra ou dependência das
 * licenças atualmente compradas; salva com o visitante para não mudar no reload.
 */
export function preferredGpuGame(s:Pick<GameState,"economyVersion"|"totalMinutes">,visitorId:number):GpuGameId|undefined{
 if(!wantsGpuGame(s,visitorId))return undefined;
 const year=yearFromMinutes(s.totalMinutes);
 const launched=GPU_GAME_CATALOG.filter(game=>game.year<=year);
 return launched[Math.floor(visitorId/4)%launched.length]?.id;
}
/** Licença do estabelecimento, ano do lançamento e requisitos por estação.
 * Compatibilidade nunca depende da tarifa ou de haver bônus econômico. */
export function gpuGamePlayableOnPc(s:GameState,index:number,id:GpuGameId):boolean{
 const spec=gpuGameSpec(id);
 return !!spec&&isHistorical(s)&&!!s.licensedGames&&
  spec.year<=yearFromMinutes(s.totalMinutes)&&
  !!s.licensedGpuGames?.includes(id)&&gpuGameCompatible(s,index,spec)&&gpuGameInstalledOnPc(s,index,id);
}
/** Adicional local, limitado pelo teto horário anual.
 * Um título pedido nunca cobra o bônus de OUTRO título mais caro; sem
 * preferência especificada, preserva o maior bônus de saves antigos.
 */
export function gpuGameHourlyRate(s:GameState,index:number,requestedGameId?:GpuGameId):number{
 if(!isHistorical(s)||yearFromMinutes(s.totalMinutes)<2005||!s.licensedGames)return s.pricePerHour;
 let maxBonus=0;
 const ids=requestedGameId?[requestedGameId]:(s.licensedGpuGames??[]);
 for(const id of ids){
  if(!gpuGamePlayableOnPc(s,index,id))continue;
  maxBonus=Math.max(maxBonus,gpuGameSpec(id)!.hourlyBonus);
 }
 return Math.max(s.pricePerHour,Math.min(annualHourlyCeiling(yearFromMinutes(s.totalMinutes)),s.pricePerHour+maxBonus));
}
/** Cobrança por sessão real: sem compra do título pedido, tarifa normal.
 * Argumento opcional conserva compatibilidade com clientes/saves antigos.
 */
export function gpuGameSessionPrice(s:GameState,index:number,minutes:number,wantsAdvancedGame:boolean,requestedGameId?:GpuGameId):number{
 const hourly=wantsAdvancedGame?gpuGameHourlyRate(s,index,requestedGameId):s.pricePerHour;
 return sessionPrice(hourly,minutes);
}
/** Cerca de 1/4 dos visitantes, a partir de 2005, sem consumo de RNG. */
export function wantsGpuGame(s:Pick<GameState,"economyVersion"|"totalMinutes">,visitorId:number):boolean{
 return isHistorical(s as GameState)&&yearFromMinutes(s.totalMinutes)>=2005&&visitorId%4===0;
}
