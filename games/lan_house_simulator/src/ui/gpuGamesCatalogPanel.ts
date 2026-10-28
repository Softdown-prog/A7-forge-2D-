/** DOM-only GPU game licensing, download placeholders and installation controls. */
import type {GpuGamesSnapshot} from "../application/gpuGamesCatalogPort.js";
export function renderGpuGamesCatalog(
 host:Element,view:GpuGamesSnapshot,doc:Pick<Document,"createElement">,
 sync:(current:Element,next:Element)=>void
):void{
 const next=doc.createElement("div");
 if(view.downloads.length){
  const overview=doc.createElement("section");overview.className="gpu-download-overview";
  overview.setAttribute("aria-label","Downloads de jogos em andamento");
  const title=doc.createElement("strong");title.textContent="Downloads em andamento · "+view.downloads.length;
  const intro=doc.createElement("p");
  intro.textContent="O progresso continua com o painel fechado. Cancele aqui mesmo se a GPU ou o Windows deixar de ser compatível.";
  const bandwidth=doc.createElement("p");bandwidth.dataset.gpuBandwidth="";
  overview.append(title,intro,bandwidth);
  for(const job of view.downloads){
   const record=doc.createElement("div");record.className="gpu-download-entry";
   const heading=doc.createElement("span");heading.textContent=job.heading;
   const status=doc.createElement("small");status.className="catalog-game-note";
   status.dataset.gpuDownloadStatus=job.id;status.dataset.gpuGamePc=String(job.pc);
   const meter=doc.createElement("progress");meter.max=job.durationMinutes;meter.value=job.elapsedMinutes;
   meter.dataset.gpuDownloadProgress=job.id;meter.dataset.gpuGamePc=String(job.pc);
   meter.setAttribute("aria-label","Resumo do download no PC "+(job.pc+1));
   const cancel=doc.createElement("button");cancel.type="button";cancel.className="slice";
   cancel.dataset.gpuGameCancel=job.id;cancel.dataset.gpuGamePc=String(job.pc);
   cancel.textContent="Cancelar · PC "+(job.pc+1);
   record.append(heading,status,meter,cancel);overview.append(record);
  }
  next.append(overview);
 }
 if(view.note!==null){
  const note=doc.createElement("p");note.textContent=view.note;next.append(note);
 }else for(const game of view.cards){
  const card=doc.createElement("div");card.className="price-control";
  const heading=doc.createElement("strong");heading.textContent=game.heading;
  const requirements=doc.createElement("p");requirements.className="catalog-game-note";
  requirements.textContent=game.requirements;
  const status=doc.createElement("p");status.className="catalog-game-note";status.textContent=game.status;
  const measured=doc.createElement("p");measured.className="catalog-game-note";measured.textContent=game.demand;
  const buy=doc.createElement("button");buy.type="button";buy.className="slice";
  buy.dataset.gpuGameBuy=game.id;buy.textContent=game.buyLabel;
  buy.disabled=game.buyDisabled;buy.title=game.buyTitle;
  card.append(heading,requirements,status,measured);
  if(game.coverage!==null){
   const payback=doc.createElement("p");payback.className="catalog-game-note";
   payback.textContent=game.coverage;card.append(payback);
  }
  card.append(buy);
  if(game.installations.length){
   const stations=doc.createElement("div");stations.className="action-row wrap";
   stations.setAttribute("aria-label","Instalações de "+game.heading.replace(/ · \d+$/,"")+" por computador");
   for(const install of game.installations){
    const button=doc.createElement("button");button.type="button";button.className="slice";
    if(install.downloading)button.dataset.gpuGameCancel=install.id;
    else button.dataset.gpuGameInstall=install.id;
    button.dataset.gpuGamePc=String(install.pc);
    button.textContent=install.buttonLabel;button.disabled=install.buttonDisabled;button.title=install.buttonTitle;
    stations.append(button);
    if(install.progress){
     const small=doc.createElement("span");small.className="catalog-game-note";
     small.dataset.gpuDownloadStatus=install.id;small.dataset.gpuGamePc=String(install.pc);
     const progress=doc.createElement("progress");
     progress.max=install.progress.durationMinutes;progress.value=install.progress.elapsedMinutes;
     progress.dataset.gpuDownloadProgress=install.id;progress.dataset.gpuGamePc=String(install.pc);
     progress.setAttribute("aria-label","Download de "+game.heading.replace(/ · \d+$/,"")+" no PC "+(install.pc+1));
     stations.append(small,progress);
    }
   }
   if(game.bulk){
    const bulk=doc.createElement("button");bulk.type="button";bulk.className="slice";
    bulk.dataset.gpuGameInstallAll=game.bulk.id;bulk.textContent=game.bulk.label;
    bulk.disabled=game.bulk.disabled;bulk.title=game.bulk.title;
    stations.append(bulk);
   }
   card.append(stations);
  }
  next.append(card);
 }
 sync(host,next);
}
