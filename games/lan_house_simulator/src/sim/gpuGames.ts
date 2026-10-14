import type {GameState,Result} from "./types.js";
import {GPU_CATALOG,installedGpu,type GpuId} from "./gpu.js";
import {WINDOWS_ERAS,installedWindows} from "./era.js";
import {annualHourlyCeiling,isHistorical,sessionPrice,yearFromMinutes} from "./historicalEconomy.js";

/** Títulos fictícios, independentes do catálogo básico R$ 450.
 * A licença é do estabelecimento; a execução e o adicional são por PC.
 * Custos e adicionais são hipóteses de design, não preços históricos.
 */
export const GPU_GAME_CATALOG=[
 {id:"neon-rush",name:"Neon Rush Online",year:2025,cost:780,minGpu:"gpu05",minWindows:"win10",hourlyBonus:.75},
 {id:"circuito-competitivo",name:"Circuito Competitivo",year:2027,cost:1250,minGpu:"gpu11",minWindows:"win10",hourlyBonus:1.25},
 {id:"arena-do-futuro",name:"Arena do Futuro",year:2030,cost:1800,minGpu:"gpu13",minWindows:"win11",hourlyBonus:1.75}
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
 return {ok:true,message:game.name+" licenciado por R$ "+quote.cost+". Disponível somente nos PCs compatíveis."};
}
/** Adicional local, limitado pelo teto horário ANUAL; nunca amplia a tarifa
 * dos PCs sem placa, sem Windows ou sem a licença avançada.
 * Entre títulos compatíveis vale o maior adicional (não são cumulativos).
 */
export function gpuGameHourlyRate(s:GameState,index:number):number{
 if(!isHistorical(s)||yearFromMinutes(s.totalMinutes)<2025||!s.licensedGames)return s.pricePerHour;
 let maxBonus=0;
 for(const id of s.licensedGpuGames??[]){
  const spec=gpuGameSpec(id);
  if(spec&&spec.year<=yearFromMinutes(s.totalMinutes)&&gpuGameCompatible(s,index,spec))
   maxBonus=Math.max(maxBonus,spec.hourlyBonus);
 }
 return Math.max(s.pricePerHour,Math.min(annualHourlyCeiling(yearFromMinutes(s.totalMinutes)),s.pricePerHour+maxBonus));
}
/** Apenas clientes interessados em jogos avançados pagam o adicional.
 * Valor total por sessão, arredondado uma única vez em centavos.
 */
export function gpuGameSessionPrice(s:GameState,index:number,minutes:number,wantsAdvancedGame:boolean):number{
 const hourly=wantsAdvancedGame?gpuGameHourlyRate(s,index):s.pricePerHour;
 return sessionPrice(hourly,minutes);
}
/** Perfil determinístico sem sortear mais números nem afetar RNG do jogo clássico. */
export function wantsGpuGame(s:Pick<GameState,"economyVersion"|"totalMinutes">,visitorId:number):boolean{
 return isHistorical(s as GameState)&&yearFromMinutes(s.totalMinutes)>=2025&&visitorId%4===0;
}
