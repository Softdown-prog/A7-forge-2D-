import type {GameState,Result} from "./types.js";
import {gameYear,installedWindows,WINDOWS_ERAS} from "./era.js";
import {gamePopularityWeight} from "./gamePopularity.js";
import {stationReadyForSessions,stationPowerCount} from "./stationPower.js";

/** Jogos fictícios com contratos individuais. Valores são de game design. */
export const ERIC_MULTIPLAYER_GAME_ID="setor-zero" as const;
export const ERA_GAME_CATALOG=[
 {id:"turbo-98",name:"Corrida Turbo 98",year:1998,cost:65,genre:"Corrida",theme:"speed",symbol:"➤",description:"Disputas de velocidade nos circuitos da cidade."},
 {id:"castelo-das-chaves",name:"Castelo das Chaves",year:1998,cost:70,genre:"Aventura",theme:"castle",symbol:"♜",description:"Explore torres e resolva enigmas de portas."},
 {id:"orbita-98",name:"Órbita 98",year:1998,cost:80,genre:"Estratégia",theme:"orbit",symbol:"✦",description:"Construa sua estação e administre recursos."},
 {id:"blocos-e-cores",name:"Blocos & Cores",year:1998,cost:55,genre:"Quebra-cabeça",theme:"blocks",symbol:"◆",description:"Combine peças e supere desafios de lógica."},
 {id:"ringue-digital",name:"Ringue Digital",year:1998,cost:90,genre:"Ação",theme:"arena",symbol:"✹",description:"Duelo arcade de personagens originais."},
 {id:"asfalto-noturno",name:"Asfalto Noturno",year:1999,cost:105,genre:"Corrida",theme:"night",symbol:"➤",description:"Corridas fictícias sob as luzes da cidade."},
 {id:"reinos-de-papel",name:"Reinos de Papel",year:1999,cost:100,genre:"Estratégia",theme:"kingdom",symbol:"♛",description:"Comande vilarejos e fortalezas desenhadas."},
 {id:"cyber-arena-99",name:"Cyber Arena 99",year:1999,cost:120,genre:"Ação",theme:"cyber",symbol:"⚡",description:"Desafios futuristas em arenas neon."},
 {id:"ilha-dos-segredos",name:"Ilha dos Segredos",year:1999,cost:95,genre:"Aventura",theme:"island",symbol:"◈",description:"Procure pistas em uma ilha misteriosa."},
 {id:"circuitos-malucos",name:"Circuitos Malucos",year:1999,cost:85,genre:"Quebra-cabeça",theme:"circuit",symbol:"✳",description:"Conecte trilhas, motores e engrenagens."},
 {id:ERIC_MULTIPLAYER_GAME_ID,name:"Setor Zero",year:2000,cost:145,genre:"Ação em rede",theme:"squad",symbol:"◎",description:"Jogo tático original em equipes, pela rede local. Exige ao menos dois PCs operacionais com Windows licenciado."}
] as const;

export type EraGameId=(typeof ERA_GAME_CATALOG)[number]["id"];
export type EraGameSpec=(typeof ERA_GAME_CATALOG)[number];
export function eraGameSpec(id:string):EraGameSpec|undefined{
 return ERA_GAME_CATALOG.find(title=>title.id===id);
}
export function eligibleEraGamePcs(s:GameState):number[]{
 const original=Math.max(3,Math.min(3+s.expansionLevel*2,s.installedPcs??(3+s.expansionLevel*2)));
 const count=original+(s.annexPcs?.length??0);
 const win98=WINDOWS_ERAS.findIndex(x=>x.id==="win98");
 return Array.from({length:count},(_,i)=>i).filter(i=>s.pcWindowsLicenses?.[i]===true&&
  WINDOWS_ERAS.findIndex(w=>w.id===installedWindows(s,i))>=win98);
}
/** Descoberta por Eric em 2000; saves de 2001+ também podem voltar à novidade. */
export function multiplayerGameKnown(s:GameState):boolean{
 return gameYear(s)>2000||s.ericSecondMailDelivered===true;
}
/** A rede local precisa de duas estações reais, operacionais e licenciadas. */
export function multiplayerEligiblePcs(s:GameState):number[]{
 return eligibleEraGamePcs(s).filter(i=>stationReadyForSessions(s,i));
}
export function hasOperationalMultiplayer(s:GameState):boolean{
 return multiplayerEligiblePcs(s).length>=2;
}
export interface EraGameQuote extends Result {cost:number;eligiblePcs:number[]}
export function quoteEraGame(s:GameState,id:string):EraGameQuote{
 const title=eraGameSpec(id),cost=title?.cost??0;
 const multiplayer=id===ERIC_MULTIPLAYER_GAME_ID;
 const eligiblePcs=multiplayer?multiplayerEligiblePcs(s):eligibleEraGamePcs(s);
 const reject=(message:string):EraGameQuote=>({ok:false,message,cost,eligiblePcs});
 if(!title)return reject("Título inexistente.");
 if(gameYear(s)<title.year)return reject("Chega em "+title.year+".");
 if(multiplayer&&!multiplayerGameKnown(s))return reject("Novidade ainda não apresentada por Eric.");
 if(!s.licensedGames)return reject("Regularize primeiro os direitos básicos em Serviços.");
 if(s.licensedEraGames?.includes(title.id))return reject("Licença já adquirida.");
 if(eligiblePcs.length===0)return reject("Licencie o Windows em pelo menos um computador.");
 if(multiplayer&&eligiblePcs.length<2)return reject("São necessários dois PCs operacionais com Windows licenciado.");
 if(s.cash<cost)return reject("Caixa insuficiente: "+cost+" reais.");
 return {ok:true,message:"Licença de "+title.name+" para toda a lan house.",cost,eligiblePcs};
}
export function licenseEraGame(s:GameState,id:string):Result{
 const quote=quoteEraGame(s,id);
 if(!quote.ok)return {ok:false,message:quote.message};
 s.cash-=quote.cost;s.expenses+=quote.cost;
 (s.licensedEraGames??=[]).push(id as EraGameId);
 return {ok:true,message:eraGameSpec(id)!.name+" licenciado: -R$ "+quote.cost+". O catálogo ficou mais variado."};
}
export function validEraGameLicenses(value:unknown,s:Partial<GameState>):boolean{
 if(value===undefined)return true;
 if(!Array.isArray(value)||value.length>ERA_GAME_CATALOG.length||!s.licensedGames)return false;
 const seen=new Set<string>(),year=gameYear({totalMinutes:s.totalMinutes??0});
 return value.every(id=>{
  if(typeof id!=="string"||seen.has(id))return false;
  seen.add(id);const title=eraGameSpec(id);
  return !!title&&title.year<=year;
 });
}
/** Catálogo clássico com popularidade anual: máximo +1,5% por título novo,
 * nostalgia conserva 25% do apelo, sem retirar nenhuma licença existente.
 * Bônus significa chance maior de chegada REAL, não venda fictícia.
 */
export function eraGameVisitorMultiplier(s:GameState):number{
 if(!s.licensedGames||!s.pcWindowsLicenses?.some((licensed,i)=>
  licensed&&i<stationPowerCount(s)&&stationReadyForSessions(s,i)))return 1;
 const year=gameYear(s);
 const appeal=(s.licensedEraGames??[]).reduce((total,id)=>{
  const title=eraGameSpec(id);
  return total+(title&&title.year<=year&&
   (id!==ERIC_MULTIPLAYER_GAME_ID||hasOperationalMultiplayer(s))
    ?gamePopularityWeight(title.year,year)*.015:0);
 },0);
 return 1+Math.min(.165,appeal);
}
