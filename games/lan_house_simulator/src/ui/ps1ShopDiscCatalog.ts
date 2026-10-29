/** PS1 CD cards; clicks continue to use the existing delegated shop handler. */
import type {Ps1ShopDiscPort} from "../application/ps1ShopDiscPort.js";

export function renderPs1ShopDiscCatalog(
 host:Element,port:Ps1ShopDiscPort,inConsoleTab:boolean,
 doc:Pick<Document,"createElement">
):void{
 if(!inConsoleTab)return;
 const rows=port.snapshot();
 if(!rows)return;
 const heading=doc.createElement("h3");heading.className="ps1-shop-heading";
 heading.textContent="Jogos de PlayStation 1 · CDs físicos";
 host.append(heading);
 const note=doc.createElement("p");note.className="catalog-game-note ps1-shop-note";
 note.textContent="Compre um CD definitivo para começar a atender. Cada cópia equipa apenas uma bancada por vez; os títulos são fictícios e não exigem licenciamento por PC.";
 host.append(note);
 for(const disc of rows){
  const card=doc.createElement("article");card.className="shop-card ps1-cd-shop-card";
  const art=doc.createElement("div");art.className="ps1-cd-art";
  art.setAttribute("aria-hidden","true");
  const jewel=doc.createElement("div");jewel.className="ps1-cd-jewel";
  const cover=doc.createElement("img");cover.className="ps1-cd-cover";
  cover.src="assets/ps1/covers/"+disc.id+".svg";
  cover.alt="";cover.loading="lazy";cover.decoding="async";
  cover.width=420;cover.height=560;
  const spine=doc.createElement("span");spine.className="ps1-cd-spine";
  jewel.append(cover,spine);art.append(jewel);
  const category=doc.createElement("small");category.textContent="CD de PS1 · "+disc.genre;
  const title=doc.createElement("h3");title.textContent=disc.title;
  const description=doc.createElement("p");
  description.textContent="Cópias no acervo: "+disc.copies+
   " · compra definitiva, sem renovação.";
  const button=doc.createElement("button");button.type="button";
  button.dataset.buyPs1Disc=disc.id;
  button.disabled=disc.disabled;
  const money=disc.price.toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
  button.textContent=disc.noStation?"Instale uma bancada primeiro":disc.full?
   "Acervo completo":disc.disabled?"Caixa insuficiente · "+money:"Comprar CD · "+money;
  card.append(art,category,title,description,button);
  host.append(card);
 }
 // CDs beside the console, not hidden below furniture or expansion items.
 const consoleCard=host.querySelector('button[data-buy="ps1"]')?.closest(".shop-card");
 if(consoleCard){
  let previous=consoleCard;
  for(const child of Array.from(host.querySelectorAll(".ps1-shop-heading, .ps1-shop-note, .ps1-cd-shop-card"))){
   previous.after(child);previous=child;
  }
 }
}
