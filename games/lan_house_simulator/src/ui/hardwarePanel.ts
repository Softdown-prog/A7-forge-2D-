import type {GameState} from "../sim/types.js";
import {pcCount} from "../sim/engine.js";
import {WINDOWS_ERAS,installedWindows} from "../sim/era.js";
import {installedGpu,gpuSpec} from "../sim/gpu.js";
import {stationModelName,stationOccupied} from "../sim/computerModels.js";
import {hardwareFor,buildParts,requiredPsuWatts,quotePart,quotePlatform,windowsHardwareIssues,
 HARDWARE_CATALOG,HARDWARE_LABELS,PLATFORM_KITS,describePart,type HardwareKind} from "../sim/hardware.js";
import {iconMarkup} from "./presentation.js";

export type HardwareTab=HardwareKind|"platform";
const element=<K extends keyof HTMLElementTagNameMap>(tag:K,className="",text=""):HTMLElementTagNameMap[K]=>{
 const node=document.createElement(tag);node.className=className;if(text)node.textContent=text;return node;
};
export function renderHardwarePanel(s:GameState,index:number,year:number,tab:HardwareTab):HTMLElement{
 const root=element("section","hardware-workbench");root.id="hardware-workbench";
 root.append(element("h3","","Configuração e peças por estação"));
 const stations=element("nav","gpu-stations");stations.setAttribute("aria-label","Computador para configurar");
 for(let i=0;i<pcCount(s);i++){
  const button=element("button","gpu-station"+(i===index?" selected":""),"PC "+String(i+1).padStart(2,"0"));
  button.type="button";button.dataset.hardwareSelect=String(i);button.id="hardware-select-"+i;
  button.setAttribute("aria-pressed",String(i===index));stations.append(button);
 }
 root.append(stations);
 const build=hardwareFor(s,index),parts=buildParts(build),sheet=element("article","machine-sheet");
 sheet.dataset.hardwarePc=String(index);
 const edition=WINDOWS_ERAS.find(e=>e.id===installedWindows(s,index))!,licensed=s.pcWindowsLicenses?.[index]===true;
 const heading=element("div","machine-heading");heading.insertAdjacentHTML("afterbegin",iconMarkup("computer"));
 const headingText=element("div"),title=element("strong","","PC "+String(index+1).padStart(2,"0")+" · "+edition.name);
 title.dataset.configWindows="";headingText.append(title,element("small","",(licensed?"Windows licenciado":"Windows preinstalado · sem licença adquirida")+" · "+stationModelName(s,index)));
 heading.append(headingText);sheet.append(heading);
 const stats=element("dl","machine-specs");
 for(const kind of ["cpu","ram","storage","motherboard","psu"] as const){
  const item=element("div","machine-spec");item.dataset.config=kind;
  item.append(element("dt","",HARDWARE_LABELS[kind]),element("dd","",parts[kind].name),element("small","",describePart(parts[kind])));stats.append(item);
 }
 const gpu=element("div","machine-spec");gpu.dataset.config="gpu";
 gpu.append(element("dt","","Placa de vídeo"),element("dd","",gpuSpec(installedGpu(s,index))?.name??"Vídeo integrado"));stats.append(gpu);
 const power=element("p","machine-power","Fonte instalada: "+parts.psu.watts+" W · capacidade recomendada para as peças atuais: "+requiredPsuWatts(build,s.pcGpus?.[index])+" W (margem de 25%). Uma fonte maior oferece reserva; não consome sua potência máxima o tempo todo.");
 sheet.append(stats,power);root.append(sheet);
 const os=element("section","machine-windows");os.setAttribute("aria-label","Windows da estação selecionada");
 os.append(element("h4","","Sistema operacional"),element("p","hardware-note","A licença e a instalação valem somente para este PC. O Windows permanece instalado quando você troca peças ou um kit."));
 const osChoices=element("div","machine-os-choices");
 const busy=stationOccupied(s,index)||!!s.repairJobs?.some(j=>j.pc===index);
 for(const release of WINDOWS_ERAS){
  const reasons=windowsHardwareIssues(s,index,release.id),owned=edition.id===release.id&&licensed,locked=year<release.year;
  const choice=element("button","slice",release.name+" · "+(owned?"Instalado":locked?release.year:"R$ "+release.cost));
  choice.type="button";choice.dataset.winPc=String(index);choice.dataset.winEdition=release.id;choice.id="hardware-windows-"+release.id;
  choice.disabled=owned||locked||busy||reasons.length>0||s.cash<release.cost;
  choice.title=owned?"Já instalado e licenciado.":locked?"Lançamento no jogo: "+release.year:reasons.length?reasons.join(" "):busy?"Libere esta estação.":"Instalar somente neste PC.";
  const option=element("div","os-option");option.append(choice,element("small","",owned?"Instalado e licenciado.":locked?"Disponível no ano "+release.year+".":reasons.length?reasons.join(" "):busy?"Libere a estação para instalar.":s.cash<release.cost?"Caixa insuficiente.":"Compatível com esta configuração."));
  osChoices.append(option);
 }
 os.append(osChoices);
 const currentIssue=windowsHardwareIssues(s,index,edition.id);
 if(currentIssue.length)os.append(element("p","part-status",edition.name+": "+currentIssue.join(" ")));
 const nextWindows=WINDOWS_ERAS.find(w=>w.year<=year&&w.year>edition.year&&windowsHardwareIssues(s,index,w.id).length>0);
 if(nextWindows)os.append(element("p","hardware-note","Para "+nextWindows.name+": "+windowsHardwareIssues(s,index,nextWindows.id).join(" ")));
 root.append(os);
 const controls=element("nav","hardware-tabs");controls.setAttribute("aria-label","Categoria de peças");
 for(const [kind,label] of [["platform","Kits de plataforma"],...Object.entries(HARDWARE_LABELS)]){
  const button=element("button","gpu-station"+(kind===tab?" selected":""),label);
  button.type="button";button.dataset.hardwareTab=kind;button.id="hardware-tab-"+kind;button.setAttribute("aria-pressed",String(kind===tab));controls.append(button);
 }
 root.append(element("h4","","Evolução geracional · ano "+year),controls);
 root.append(element("p","hardware-note",tab==="platform"
  ?"Kits migram CPU, placa-mãe e RAM juntos. O preço mostrado é integral, sem crédito de revenda; peças superiores compatíveis são preservadas. Windows, GPU, monitor e desgaste permanecem."
  :"A compra substitui somente esta peça, pelo preço integral e sem revenda. Para trocar de socket ou tipo de RAM, use Kits de plataforma."));
 const catalog=element("section","hardware-catalog");catalog.dataset.hardwareCatalog=tab;
 if(tab==="platform"){
  for(const kit of PLATFORM_KITS){
   const quote=quotePlatform(s,index,kit.id),proposed=buildParts(quote.components??{...kit.components});
   const card=element("article","hardware-card"+(year<kit.year?" hardware-locked":""));
   card.append(element("small","part-year",String(kit.year)),element("strong","",kit.name));
   card.append(element("p","",describePart(proposed.cpu)+" · "+proposed.ram.name+" · "+proposed.storage.name));
   card.append(element("small","",proposed.motherboard.name+" · "+proposed.psu.name));
   const status=element("p","part-status",quote.ok?"Pronto para instalar neste PC.":quote.message);
   const buy=element("button","slice",kit.id==="platform98"?"Configuração inicial":year<kit.year?"🔒 Chega em "+kit.year:"Kit · R$ "+(quote.cost||kit.cost));
   buy.type="button";buy.dataset.hardwareKit=kit.id;buy.id="hardware-kit-"+kit.id;buy.disabled=!quote.ok;
   card.append(status,buy);catalog.append(card);
  }
 }else{
  for(const part of HARDWARE_CATALOG.filter(p=>p.kind===tab)){
   const quote=quotePart(s,index,tab,part.id),owned=build[tab]===part.id;
   const card=element("article","hardware-card"+(year<part.year?" hardware-locked":""));
   card.append(element("small","part-year",String(part.year)),element("strong","",part.name),element("p","",describePart(part)));
   const status=element("p","part-status",quote.ok?"Compatível com esta estação.":quote.message);
   const buy=element("button","slice",owned?"Instalado":year<part.year?"🔒 Chega em "+part.year:"Instalar · R$ "+part.cost);
   buy.type="button";buy.dataset.hardwarePart=part.id;buy.dataset.hardwareKind=tab;buy.id="hardware-part-"+part.id;buy.disabled=!quote.ok;
   card.append(status,buy);catalog.append(card);
  }
 }
 root.append(catalog);return root;
}
