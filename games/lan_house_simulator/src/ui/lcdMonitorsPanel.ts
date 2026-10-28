/** LCD administration only: renders typed values and keeps delegated button attributes. */
import type {LcdMonitorsView,LcdCatalogItem} from "../application/lcdMonitorsPort.js";

export function renderLcdMonitorsPanel(
 host:Element,view:LcdMonitorsView,preview:(id:LcdCatalogItem["id"])=>string,
 doc:Pick<Document,"createElement">
):void{
 const kits=doc.createElement("section");kits.className="lcd-upgrades";
 const title=doc.createElement("h3");title.textContent="Da era CRT aos LCDs";
 const hint=doc.createElement("p");hint.className="lcd-note";
 hint.textContent="Escolha a estação para renovar. Kits exigem hardware nível 3. Novas gerações chegam com os anos; a troca custa o valor integral e preserva GPU, licenças e desgaste.";
 const choices=doc.createElement("nav");choices.className="gpu-stations";
 choices.setAttribute("aria-label","Estação para instalar kit LCD");
 for(const station of view.choices){
  const choice=doc.createElement("button");choice.type="button";
  choice.dataset.lcdSelect=String(station.index);
  choice.className="gpu-station"+(station.selected?" selected":"");
  choice.textContent=station.label;
  choice.setAttribute("aria-pressed",String(station.selected));
  choices.append(choice);
 }
 const installed=doc.createElement("p");installed.className="lcd-note";
 installed.textContent=view.installedLabel;installed.dataset.lcdCurrent="";
 const catalog=doc.createElement("section");catalog.className="lcd-catalog";
 for(const model of view.models){
  const card=doc.createElement("article");
  card.className="lcd-card"+(model.locked?" lcd-locked":"");
  const art=doc.createElement("img");
  art.src=preview(model.id);art.alt=model.artAlt;art.width=320;art.height=190;
  const info=doc.createElement("div");info.className="gpu-info";
  const name=doc.createElement("strong");name.textContent=model.title;
  const description=doc.createElement("small");description.textContent=model.description;
  const benefit=doc.createElement("small");benefit.textContent=model.benefit;
  const buy=doc.createElement("button");buy.type="button";buy.dataset.lcdBuy=model.id;
  buy.textContent=model.buttonLabel;buy.disabled=model.buttonDisabled;
  info.append(name,description,benefit,buy);card.append(art,info);catalog.append(card);
 }
 kits.append(title,hint,choices,installed,catalog);host.append(kits);
}
