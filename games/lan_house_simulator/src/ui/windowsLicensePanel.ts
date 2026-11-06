/** DOM-only Windows controls: keep delegated data-win-* actions intact. */
import type {WindowsLicensePort} from "../application/windowsLicensePort.js";
import {syncPanelChildren} from "./panelChildren.js";

export function renderWindowsLicensePanel(panel:HTMLElement,port:WindowsLicensePort):void{
 const next=document.createElement("div");
 for(const row of port.rows()){
  const line=document.createElement("div");line.className="price-control";
  const title=document.createElement("strong");title.textContent=row.title;
  const choices=document.createElement("div");choices.className="action-row wrap";
  for(const choice of row.choices){
   const button=document.createElement("button");button.type="button";button.className="slice";
   button.dataset.winPc=String(row.index);button.dataset.winEdition=choice.id;
   button.textContent=choice.label;button.disabled=choice.disabled;button.title=choice.title;
   choices.appendChild(button);
  }
  if(row.linuxAction){
   const linux=document.createElement("button");linux.type="button";linux.className="slice";
   linux.dataset.linuxPc=String(row.index);
   linux.dataset.linuxAction=row.linuxAction.action;
   linux.textContent=row.linuxAction.label;linux.disabled=row.linuxAction.disabled;
   linux.title=row.linuxAction.title;
   choices.appendChild(linux);
  }
  line.append(title);
  if(row.installation){
   const box=document.createElement("div");box.className="windows-install-status";
   const info=document.createElement("p");info.textContent="Instalando "+row.installation.name+" · "+
    row.installation.percent+"% · "+Math.ceil(row.installation.remainingSeconds/60)+" min reais restantes";
   const meter=document.createElement("progress");meter.max=100;meter.value=row.installation.percent;
   meter.setAttribute("aria-label","Instalação de "+row.installation.name+" no PC "+(row.index+1));
   box.append(info,meter);line.append(box);
  }
  line.append(choices);next.appendChild(line);
 }
 syncPanelChildren(panel,next);
}
