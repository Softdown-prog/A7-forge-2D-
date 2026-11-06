/** DOM adapter only. Real subscription commands use the existing shop listener.
 * No React/Angular import and no game-state mutations here.
 */
import type {TopGamesShopSnapshot} from "../application/topGamesShopPort.js";

export function renderTopGamesSubscription(
 host:Pick<Element,"append">,
 snapshot:TopGamesShopSnapshot,
 doc:Pick<Document,"createElement">
):void{
 const card=doc.createElement("article");
 card.className="shop-card top-games-subscription";
 const heading=doc.createElement("h3");heading.textContent=snapshot.title+" · assinatura mensal";
 const status=doc.createElement("p");status.className="top-games-status";
 status.textContent=snapshot.status;
 const progress=doc.createElement("small");progress.className="top-games-progress";
 progress.textContent="Revistas recebidas: "+snapshot.received+" de "+snapshot.total+".";
 const button=doc.createElement("button");
 button.type="button";
 button.dataset.buy=snapshot.actionId;
 button.disabled=snapshot.actionDisabled;
 button.textContent=snapshot.buttonText;
 card.append(heading,status,progress,button);
 host.append(card);
}
