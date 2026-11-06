/** PS1 CD cards; clicks continue to use the existing delegated shop handler. */
import {nextPs1DiscReleaseYear,type Ps1ShopDiscPort} from "../application/ps1ShopDiscPort.js";
import {ps1ProceduralCover} from "./ps1CoverArt.js";
import {UNKNOWN_TOP_GAMES_TITLE,UNKNOWN_TOP_GAMES_GENRE,UNKNOWN_TOP_GAMES_HINT} from "./topGamesConcealment.js";

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
 const nextYear=nextPs1DiscReleaseYear(rows);
 note.textContent=nextYear!==null?
  "Novidade chegando: +2 jogos serão desbloqueados em "+nextYear+
  ". Cada CD é uma compra definitiva e equipa uma bancada por vez.":
  "Catálogo PS1 completo: 13 jogos disponíveis desde 2005. O PS2 estreia em 2006. Cada CD equipa uma bancada por vez.";
 host.append(note);
 for(const disc of rows){
  const card=doc.createElement("article");card.className="shop-card ps1-cd-shop-card";
  const art=doc.createElement("div");art.className="ps1-cd-art";
  art.setAttribute("aria-hidden","true");
  const jewel=doc.createElement("div");jewel.className="ps1-cd-jewel";
  if(disc.magazineLocked){
   const unknown=doc.createElement("span");unknown.className="top-games-secret-cover";
   unknown.textContent="?";jewel.append(unknown);
  }else{
   const cover=doc.createElement("img");cover.className="ps1-cd-cover";
   cover.src=ps1ProceduralCover(disc,doc);
   cover.alt="";cover.loading="lazy";cover.decoding="async";
   cover.width=420;cover.height=560;
   jewel.append(cover);
  }
  const spine=doc.createElement("span");spine.className="ps1-cd-spine";
  jewel.append(spine);art.append(jewel);
  const category=doc.createElement("small");
  category.textContent="CD de PS1 · "+(disc.magazineLocked?UNKNOWN_TOP_GAMES_GENRE:disc.genre)+" · "+disc.releaseYear;
  const title=doc.createElement("h3");
  title.textContent=disc.magazineLocked?UNKNOWN_TOP_GAMES_TITLE:disc.title;
  const description=doc.createElement("p");
  description.textContent=disc.magazineLocked?UNKNOWN_TOP_GAMES_HINT:
   "Cópias no acervo: "+disc.copies+" · compra definitiva, sem renovação.";
  const button=doc.createElement("button");button.type="button";
  button.dataset.buyPs1Disc=disc.id;
  button.disabled=disc.disabled;
  const money=disc.price.toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
  button.textContent=disc.magazineLocked?"Leia a revista Top Games":disc.noStation?"Instale uma bancada primeiro":disc.full?
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
