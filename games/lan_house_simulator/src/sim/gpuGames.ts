import type {GameState,Result} from "./types.js";
import {GPU_CATALOG,installedGpu,type GpuId} from "./gpu.js";
import {WINDOWS_ERAS,installedWindows} from "./era.js";
import {annualHourlyCeiling,isHistorical,sessionPrice,yearFromMinutes} from "./historicalEconomy.js";
import {stationPowerCount,stationPoweredOn,stationHasCustomer} from "./stationPower.js";

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
 const installed=gpuGameInstalledOnPc(s,index,id);
 if(!installed&&!gpuGameCompatible(s,index,game))
  return {ok:false,message:"PC "+(index+1)+" não possui GPU e Windows compatíveis."};
 // A transição inicial copia o estado antigo de todas as estações.
 s.gpuGameInstalls=Array.from({length:stationPowerCount(s)},(_,i)=>
  [...(s.gpuGameInstalls?.[i]??s.licensedGpuGames??[])]);
 const row=s.gpuGameInstalls[index]!;
 if(installed)s.gpuGameInstalls[index]=row.filter(title=>title!==id);
 else row.push(id);
 return {ok:true,message:game.name+(installed?" removido do PC ":" instalado no PC ")+(index+1)+
  ". Não há nova cobrança de licença."};
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
