/** Read-only catalogue of the historical/classic PC game licenses. */
import type {GameState} from "../sim/types.js";
import {gameYear} from "../sim/era.js";
import {ERA_GAME_CATALOG,quoteEraGame,eraGameVisitorMultiplier,
 ERIC_MULTIPLAYER_GAME_ID,multiplayerGameKnown,multiplayerEligiblePcs,type EraGameId} from "../sim/eraGames.js";
import {gamePopularityPercent} from "../sim/gamePopularity.js";

export interface ClassicLicenseCard {
 readonly id:EraGameId;
 readonly theme:string;
 readonly year:number;
 readonly symbol:string;
 readonly name:string;
 readonly genre:string;
 readonly description:string;
 readonly owned:boolean;
 readonly locked:boolean;
 readonly meta:string;
 readonly status:string;
 readonly buttonLabel:string;
 readonly buttonDisabled:boolean;
 readonly buttonTitle:string;
}
export interface ClassicLicenseSection {
 readonly year:number;
 readonly title:string;
 readonly cards:ReadonlyArray<ClassicLicenseCard>;
}
export interface ClassicGamesSnapshot {
 readonly summary:string;
 readonly sections:ReadonlyArray<ClassicLicenseSection>;
}
export interface ClassicGamesCatalogPort { snapshot():ClassicGamesSnapshot; }
export function createClassicGamesCatalogPort(getState:()=>GameState):ClassicGamesCatalogPort {
 return {snapshot(){
  const game=getState(),year=gameYear(game),owned=game.licensedEraGames??[];
  const known=year>=2000&&multiplayerGameKnown(game);
  const visible=ERA_GAME_CATALOG.filter(title=>title.year<=1999||known);
  const popularity=eraGameVisitorMultiplier(game);
  const sections=[1998,1999,...(known?[2000]:[])].map(releaseYear=>{
   const titles=ERA_GAME_CATALOG.filter(title=>title.year===releaseYear);
   return {
    year:releaseYear,
    title:releaseYear+" · "+titles.filter(title=>owned.some(id=>id===title.id)).length+" de "+titles.length+" jogos",
    cards:titles.map(title=>{
     const quote=quoteEraGame(game,title.id);
     const bought=owned.some(id=>id===title.id),locked=year<title.year;
     const popularityPercent=gamePopularityPercent(title.year,year);
     const multiplayer=title.id===ERIC_MULTIPLAYER_GAME_ID;
     let status=(bought?"✓ Licença permanente":quote.ok?"Pronto para licenciar":quote.message)+
      (locked?"":" · potencial de procura por título: +"+
       (popularityPercent*.015).toLocaleString("pt-BR",{maximumFractionDigits:3})+
       "% (com Windows licenciado)");
     if(multiplayer)status+=" · PCs aptos agora: "+multiplayerEligiblePcs(game).length+" (mínimo 2).";
     return {
      id:title.id,theme:title.theme,year:title.year,symbol:title.symbol,
      name:title.name,genre:title.genre,description:title.description,
      owned:bought,locked,
      meta:title.genre+" · "+title.year+" · licença da lan house · R$ "+title.cost+
       " · "+(locked?"popularidade no lançamento: 100%":"popularidade em "+year+": "+popularityPercent+"%"),
      status,
      buttonLabel:bought?"✓ Licenciado":locked?"🔒 Chega em "+title.year:quote.ok?"Licenciar · R$ "+title.cost:"Indisponível",
      buttonDisabled:!quote.ok,buttonTitle:quote.message
     };
    })
   };
  });
  return {
   summary:owned.length+" de "+visible.length+" títulos licenciados · bônus atual de procura: +"+
    (Math.round((popularity-1)*10000)/100).toLocaleString("pt-BR")+
    "%. Novidades atraem mais; títulos antigos conservam 25% de apelo nostálgico. Licenças permanentes.",
   sections
  };
 }};
}
