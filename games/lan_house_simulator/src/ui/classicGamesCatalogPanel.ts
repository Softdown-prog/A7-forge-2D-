/** Render classic licensed games without directly importing the simulation. */
import type {ClassicGamesSnapshot} from "../application/classicGamesCatalogPort.js";

export function renderClassicGamesCatalog(
 host:Element,view:ClassicGamesSnapshot,doc:Pick<Document,"createElement">,
 sync:(current:Element,next:Element)=>void
):void{
 const next=doc.createElement("div");
 const summary=doc.createElement("p");summary.className="era-game-summary";
 summary.textContent=view.summary;next.append(summary);
 for(const release of view.sections){
  const section=doc.createElement("section");section.className="era-game-section";
  const title=doc.createElement("h4");title.textContent=release.title;
  const grid=doc.createElement("div");grid.className="era-game-grid";
  for(const item of release.cards){
   const card=doc.createElement("article");
   card.className="era-game-card"+(item.locked?" era-game-locked":"")+
    (item.owned?" era-game-owned":"");
   const cover=doc.createElement("div");cover.className="era-game-cover";cover.dataset.theme=item.theme;
   const coverRelease=doc.createElement("small");coverRelease.className="era-cover-release";
   coverRelease.textContent="SOFTDOWN · "+item.year;
   const symbol=doc.createElement("span");symbol.className="era-cover-symbol";
   symbol.setAttribute("aria-hidden","true");symbol.textContent=item.symbol;
   const coverName=doc.createElement("strong");coverName.className="era-cover-title";
   coverName.textContent=item.name;
   const genre=doc.createElement("small");genre.className="era-cover-genre";
   genre.textContent=item.genre+" · EDIÇÃO PC";
   cover.append(coverRelease,symbol,coverName,genre);
   const details=doc.createElement("div");details.className="era-game-details";
   const name=doc.createElement("strong");name.textContent=item.name;
   const info=doc.createElement("p");info.textContent=item.description;
   const meta=doc.createElement("small");meta.textContent=item.meta;
   const status=doc.createElement("small");status.className="era-game-status";
   status.textContent=item.status;
   const button=doc.createElement("button");button.type="button";button.className="slice";
   button.dataset.eraGameBuy=item.id;button.textContent=item.buttonLabel;
   button.disabled=item.buttonDisabled;button.title=item.buttonTitle;
   details.append(name,info,meta,status,button);card.append(cover,details);grid.append(card);
  }
  section.append(title,grid);next.append(section);
 }
 sync(host,next);
}
