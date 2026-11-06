/** Read-only PS1/PS2 projections; all purchase rules remain in the game ports. */
import {nextPs1DiscReleaseYear,type Ps1ShopDiscRow} from "../application/ps1ShopDiscPort.js";
import {ps1ProceduralCover} from "./ps1CoverArt.js";
import {ps2ProceduralCover} from "./ps2CoverArt.js";
import type {Ps1ShopPlacementSpot} from "../application/ps1ShopPlacementPort.js";
import type {Ps1ShopOffer} from "../application/ps1ShopOfferPort.js";
import type {Ps2Snapshot} from "../application/ps2Port.js";
import type {TopGamesShopSnapshot} from "../application/topGamesShopPort.js";
export interface ConsoleGameView {
 readonly id:string;readonly title:string;readonly genre:string;
 readonly copies:number;readonly releaseYear:number|null;readonly buttonText:string;readonly disabled:boolean;
 readonly cover:string|null;
}
export interface ConsoleShopView {
 readonly ps1:{readonly offerText:string;readonly offerDisabled:boolean;
  readonly slots:readonly Ps1ShopPlacementSpot[];readonly selected:string|null;
  readonly artwork:string|null;readonly nextReleaseYear:number|null;
  readonly discs:readonly ConsoleGameView[]|null};
 readonly topGames:TopGamesShopSnapshot|null;
 readonly ps2:{readonly benchText:string;readonly benchDisabled:boolean;
  readonly slots:readonly {id:string;label:string}[];
  readonly games:readonly ConsoleGameView[];readonly artwork:string|null;
  readonly nextReleaseYear:number|null};
}
const money=(v:number):string=>v.toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
export function projectPs1Disc(row:Ps1ShopDiscRow):ConsoleGameView{
 const price=money(row.price);
 return {id:row.id,title:row.title,genre:row.genre,copies:row.copies,releaseYear:row.releaseYear,
  buttonText:row.noStation?"Instale uma bancada primeiro":row.magazineLocked?"Leia a revista Top Games":row.full?"Acervo completo":
   row.disabled?"Caixa insuficiente · "+price:"Comprar CD · "+price,
  disabled:row.disabled,cover:ps1ProceduralCover(row)};
}
export function projectPs2Game(row:Ps2Snapshot["games"][number]):ConsoleGameView{
 return {id:row.id,title:row.title,genre:row.genre,copies:row.copies,releaseYear:row.releaseYear,
  buttonText:row.buyText+" · "+money(row.price),disabled:row.disabled,cover:ps2ProceduralCover(row)};
}
export function projectConsoleShop(
 ps1:Ps1ShopOffer,slots:readonly Ps1ShopPlacementSpot[],
 selected:string|null,discs:readonly Ps1ShopDiscRow[]|null,
 ps2:Ps2Snapshot|null,artworkPs1:string|null,artworkPs2:string|null,
 topGames:TopGamesShopSnapshot|null=null
):ConsoleShopView{
 return {
  topGames,
  ps1:{offerText:ps1.text,offerDisabled:ps1.disabled,slots,
   selected:slots.some(s=>s.id===selected)?selected:slots[0]?.id??null,
   artwork:artworkPs1,nextReleaseYear:nextPs1DiscReleaseYear(discs),
   discs:discs?.map(projectPs1Disc)??null},
  ps2:{benchText:ps2?ps2.benchText+" · "+money(ps2.benchPrice):"PS2 indisponível",
   benchDisabled:ps2?.benchDisabled??true,slots:ps2?.slots??[],
   games:ps2?.games.map(projectPs2Game)??[],artwork:artworkPs2,
   nextReleaseYear:ps2?.nextReleaseYear??null}
 };
}
export function publishAngularConsoleShop(doc:Document,view:ConsoleShopView):void{
 if(typeof doc.getElementById!=="function"||!doc.getElementById("angular-shop-catalog")||
  typeof doc.dispatchEvent!=="function"||typeof CustomEvent!=="function")return;
 doc.dispatchEvent(new CustomEvent<ConsoleShopView>("lhs:shop-consoles-updated",{detail:view}));
}
