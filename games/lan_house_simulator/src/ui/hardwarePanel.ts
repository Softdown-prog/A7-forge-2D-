import type { HardwarePanelView } from "../application/hardwarePanelPort.js";
import { iconMarkup } from "./presentation.js";
export type { HardwareTab } from "../application/hardwarePanelPort.js";
export function renderHardwarePanel(view:HardwarePanelView,doc:Document=document):HTMLElement{
 const {index,year,tab,page}=view;
 const element=<K extends keyof HTMLElementTagNameMap>(tag:K,className="",text=""):HTMLElementTagNameMap[K]=>{
  const node=doc.createElement(tag);node.className=className;if(text)node.textContent=text;return node;
 };
 const root=element("section","hardware-workbench");root.id="hardware-workbench";
 root.append(element("h3","",page==="windows"?"Windows da estação":"Configuração e peças por estação"));
 const stations=element("nav","gpu-stations");stations.setAttribute("aria-label","Computador para configurar");
 for(const i of view.stations){
  const button=element("button","gpu-station"+(i===index?" selected":""),"PC "+String(i+1).padStart(2,"0"));
  button.type="button";button.dataset.hardwareSelect=String(i);button.id="hardware-select-"+i;
  button.setAttribute("aria-pressed",String(i===index));stations.append(button);
 }
 root.append(stations);
 const powerToggle=element("button","slice",view.powered?"Desligar estação selecionada":"Ligar estação selecionada");
 powerToggle.type="button";powerToggle.dataset.pcPower=String(index);powerToggle.id="hardware-power-"+index;
 powerToggle.disabled=view.powerDisabled;root.append(powerToggle);
 const sheet=element("details","machine-sheet");sheet.dataset.hardwarePc=String(index);sheet.dataset.preserveOpen="";
 sheet.append(element("summary","","Ver configuração instalada"));
 const heading=element("div","machine-heading");heading.insertAdjacentHTML("afterbegin",iconMarkup("computer"));
 const headingText=element("div"),title=element("strong","",view.machineTitle);title.dataset.configWindows="";
 headingText.append(title,element("small","",view.machineSubtitle));heading.append(headingText);sheet.append(heading);
 sheet.append(element("p","hardware-note",view.machineNote));
 const stats=element("dl","machine-specs");
 for(const spec of view.specs){
  const item=element("div","machine-spec");item.dataset.config=spec.kind;
  item.append(element("dt","",spec.label),element("dd","",spec.name));
  if(spec.description!==undefined)item.append(element("small","",spec.description));stats.append(item);
 }
 sheet.append(stats,element("p","machine-power",view.powerNote));root.append(sheet);
 if(page==="windows"){
  const os=element("section","machine-windows");os.setAttribute("aria-label","Windows da estação selecionada");
  os.append(element("h4","","Sistema operacional"),element("p","hardware-note","A licença e a instalação valem somente para este PC. O Windows permanece instalado quando você troca peças ou um kit."));
  const choices=element("div","machine-os-choices");
  for(const release of view.windows){
   const choice=element("button","slice",release.label);choice.type="button";
   choice.dataset.winPc=String(index);choice.dataset.winEdition=release.id;choice.id="hardware-windows-"+release.id;choice.disabled=release.disabled;choice.title=release.title;
   const option=element("div","os-option");option.append(choice,element("small","",release.detail));choices.append(option);
  }
  os.append(choices);
  if(view.currentWindowsIssue)os.append(element("p","part-status",view.currentWindowsIssue));
  if(view.nextWindowsIssue)os.append(element("p","hardware-note",view.nextWindowsIssue));root.append(os);return root;
 }
 const controls=element("nav","hardware-tabs");controls.setAttribute("aria-label","Categoria de peças");
 for(const {id:kind,label} of view.tabs){
  const button=element("button","gpu-station"+(kind===tab?" selected":""),label);button.type="button";button.dataset.hardwareTab=kind;button.id="hardware-tab-"+kind;button.setAttribute("aria-pressed",String(kind===tab));controls.append(button);
 }
 root.append(element("h4","","Evolução geracional · ano "+year),controls);
 root.append(element("p","hardware-note",tab==="platform"?"Kits migram CPU, placa-mãe e RAM juntos. O preço mostrado é integral, sem crédito de revenda; peças superiores compatíveis são preservadas. Windows, GPU, monitor e desgaste permanecem.":"A compra substitui somente esta peça, pelo preço integral e sem revenda. Para trocar de socket ou tipo de RAM, use Kits de plataforma."));
 const catalog=element("section","hardware-catalog");catalog.dataset.hardwareCatalog=tab;
 for(const item of view.cards){
  const card=element("article","hardware-card"+(item.locked?" hardware-locked":""));
  card.append(element("small","part-year",String(item.year)),element("strong","",item.name),element("p","",item.description));
  if(item.extra!==undefined)card.append(element("small","",item.extra));
  const buy=element("button","slice",item.label);buy.type="button";buy.disabled=item.disabled;
  if(item.kind==="platform"){buy.dataset.hardwareKit=item.id;buy.id="hardware-kit-"+item.id;}
  else{buy.dataset.hardwarePart=item.id;buy.dataset.hardwareKind=item.kind;buy.id="hardware-part-"+item.id;}
  card.append(element("p","part-status",item.status),buy);catalog.append(card);
 }
 root.append(catalog);return root;
}
