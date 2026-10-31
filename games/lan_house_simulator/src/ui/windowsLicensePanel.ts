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
  line.append(title,choices);next.appendChild(line);
 }
 syncPanelChildren(panel,next);
}
