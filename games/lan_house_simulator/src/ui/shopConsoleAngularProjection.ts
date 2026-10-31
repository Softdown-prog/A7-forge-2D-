/** Read-only PS1/PS2 projections; all purchase rules remain in the game ports. */
import type {Ps1ShopDiscRow} from "../application/ps1ShopDiscPort.js";
import type {Ps1ShopPlacementSpot} from "../application/ps1ShopPlacementPort.js";
import type {Ps1ShopOffer} from "../application/ps1ShopOfferPort.js";
import type {Ps2Snapshot} from "../application/ps2Port.js";
export interface ConsoleGameView {
 readonly id:string;readonly title:string;readonly genre:string;
 readonly copies:number;readonly buttonText:string;readonly disabled:boolean;
 readonly cover:string|null;
}
export interface ConsoleShopView {
 readonly ps1:{readonly offerText:string;readonly offerDisabled:boolean;
  readonly slots:readonly Ps1ShopPlacementSpot[];readonly selected:string|null;
  readonly artwork:string|null;readonly discs:readonly ConsoleGameView[]|null};
 readonly ps2:{readonly benchText:string;readonly benchDisabled:boolean;
  readonly slots:readonly {id:string;label:string}[];
  readonly games:readonly ConsoleGameView[];readonly artwork:string|null};
}
const money=(v:number):string=>v.toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
export function projectPs1Disc(row:Ps1ShopDiscRow):ConsoleGameView{
 const price=money(row.price);
 return {id:row.id,title:row.title,genre:row.genre,copies:row.copies,
  buttonText:row.noStation?"Instale uma bancada primeiro":row.full?"Acervo completo":
   row.disabled?"Caixa insuficiente · "+price:"Comprar CD · "+price,
  disabled:row.disabled,cover:"assets/ps1/covers/"+row.id+".svg"};
}
export function projectPs2Game(row:Ps2Snapshot["games"][number]):ConsoleGameView{
 return {id:row.id,title:row.title,genre:row.genre,copies:row.copies,
  buttonText:row.buyText+" · "+money(row.price),disabled:row.disabled,cover:null};
}
export function projectConsoleShop(
 ps1:Ps1ShopOffer,slots:readonly Ps1ShopPlacementSpot[],
 selected:string|null,discs:readonly Ps1ShopDiscRow[]|null,
 ps2:Ps2Snapshot|null,artworkPs1:string|null,artworkPs2:string|null
):ConsoleShopView{
 return {
  ps1:{offerText:ps1.text,offerDisabled:ps1.disabled,slots,
   selected:slots.some(s=>s.id===selected)?selected:slots[0]?.id??null,
   artwork:artworkPs1,discs:discs?.map(projectPs1Disc)??null},
  ps2:{benchText:ps2?ps2.benchText+" · "+money(ps2.benchPrice):"PS2 indisponível",
   benchDisabled:ps2?.benchDisabled??true,slots:ps2?.slots??[],
   games:ps2?.games.map(projectPs2Game)??[],artwork:artworkPs2}
 };
}
export function publishAngularConsoleShop(doc:Document,view:ConsoleShopView):void{
 if(typeof doc.getElementById!=="function"||!doc.getElementById("angular-shop-catalog")||
  typeof doc.dispatchEvent!=="function"||typeof CustomEvent!=="function")return;
 doc.dispatchEvent(new CustomEvent<ConsoleShopView>("lhs:shop-consoles-updated",{detail:view}));
}
