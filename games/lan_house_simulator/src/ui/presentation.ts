import type {LiveStatusSnapshot,ComputerOperationSnapshot} from "../application/presentationModels.js";

const icons=new Set("computer cart settings mail play pause continue save upload close coins chart disc calendar sun rain network users tag stock tools chip shield wall door expand move rotate plant poster table megaphone trash check cursor idea lock warning arrow soda candy snacks".split(" "));
export function iconMarkup(name:string):string{
 const safe=icons.has(name)?name:"computer";
 return '<svg class="ui-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><use href="./assets/ui/icons.svg#'+safe+'"></use></svg>';
}
export function catalogueIcon(id:string):string{
 return id.includes("computer")?"computer":id.startsWith("extend-")||id==="expand"?"expand":id;
}
const controlIcons:Record<string,string>={
 "menu-new":"play","menu-continue":"continue","menu-options":"settings","save-export":"save","save-import":"upload",
 "open-menu":"pause","open-shop":"cart","open-notices":"mail","open-admin":"settings",
 "close-shop":"close","close-admin":"close","close-notices":"close","placement-cancel":"close","rotate-furniture":"rotate",
 "organize-furniture":"move","demolish-walls":"wall","stock-soda":"stock","stock-candy":"stock","stock-snacks":"stock",
 "supplier-up":"stock","internet-up":"network","internet-repair":"tools","license":"shield","clean-bins":"trash",
 "launch-promotion":"megaphone","reset-game":"continue"
};
const tabIcons:Record<string,string>={prices:"tag",computers:"computer",gpus:"chip",licenses:"shield",stock:"stock",services:"tools",finance:"chart"};
export function decorateControls(root:ParentNode=document):void{
 for(const button of Array.from(root.querySelectorAll<HTMLButtonElement>("button"))){
  let name=button.dataset.icon??controlIcons[button.id]??tabIcons[button.dataset.adminTab??""]??
   (button.dataset.buy?"cart":button.dataset.hardwareSelect!==undefined?"computer":button.dataset.hardwarePart||button.dataset.hardwareKit||button.dataset.hardwareTab?"chip":button.dataset.lcdBuy?"computer":button.dataset.lcdSelect!==undefined?"computer":button.dataset.pcRepair!==undefined?"tools":button.dataset.pcUpgrade!==undefined?"chip":
    button.dataset.winPc!==undefined?"shield":button.dataset.gpuBuy?"chip":button.dataset.gpuSelect!==undefined?"computer":
    button.dataset.noticeRead?"check":button.dataset.noticeAction?"arrow":button.dataset.decision?"arrow":null);
  if(!name||button.querySelector(":scope > .ui-icon"))continue;
  if(button.textContent?.includes("🔒"))name="lock";
  // Text written by the engine remains the accessible name. Platform emoji are
  // replaced by the same local vector family used throughout the interface.
  for(const child of Array.from(button.childNodes))if(child.nodeType===Node.TEXT_NODE)
   child.textContent=child.textContent?.replace(/^[\s▶↪⚙↓↑☰🛒✕✉↔↻📣✓🔒]+/u,"").replaceAll("🔒","")??"";
  button.insertAdjacentHTML("afterbegin",iconMarkup(name));
 }
 for(const node of Array.from(root.querySelectorAll<HTMLElement>("[data-icon]:not(button)")))
  if(!node.querySelector(":scope > .ui-icon"))node.insertAdjacentHTML("afterbegin",iconMarkup(node.dataset.icon!));
 const summaryIcons=["coins","chart","calendar","users"];
 root.querySelectorAll<HTMLElement>(".admin-summary>div").forEach((node,i)=>{
  if(!node.querySelector(".ui-icon"))node.insertAdjacentHTML("beforeend",iconMarkup(summaryIcons[i]??"chart"));
 });
}
export function presentLiveState(view:LiveStatusSnapshot,section:string|null=null):void{
 const cards=[
  {icon:"coins",label:"Caixa disponível",value:"R$ "+view.cash.toLocaleString("pt-BR"),className:"cash"},
  {icon:"users",label:"Reputação no bairro",value:view.reputation.toFixed(0)+'<span class="hud-secondary">/ 100</span>',className:view.reputation<35?"warning":""},
  {icon:"network",label:"Internet · "+view.internetName,value:view.connected?"Conectada":"Sem conexão",className:view.connected?"":"warning"},
  {icon:"computer",label:"PCs em uso",value:view.occupied+'<span class="hud-secondary">/ '+view.computerCount+'</span>',className:""},
  {icon:"users",label:"Clientes no salão",value:String(view.customerCount),className:""}
 ];
 const status=document.getElementById("status");
 const html=cards.map(c=>'<div class="hud-card '+c.className+'"><span>'+iconMarkup(c.icon)+'</span><div><small>'+c.label+'</small><strong>'+c.value+'</strong></div></div>').join("");
 if(status&&status.innerHTML!==html)status.innerHTML=html;
 const stock=document.getElementById("stock");
 if(stock&&section==="stock"){
  stock.className="stock-metrics";
  const stockHtml=([["soda","Bebidas"],["candy","Doces"],["snacks","Alimentos"]] as const)
   .map(([k,label])=>'<div>'+iconMarkup(k)+'<p><strong>'+view.stock[k]+'</strong><small>'+label+'</small></p></div>').join("");
  if(stock.innerHTML!==stockHtml)stock.innerHTML=stockHtml;
 }
 const promotion=document.getElementById("promotion-hud");if(promotion)promotion.hidden=!view.promotionActive;
 const usage=document.querySelector(".finance-usage");
 if(usage&&section==="finance"&&!usage.closest(".management-page[hidden]")){
  let meter=usage.querySelector<HTMLElement>(".occupancy-meter");
  if(!meter){
   meter=document.createElement("div");meter.className="occupancy-meter";meter.setAttribute("role","progressbar");
   meter.setAttribute("aria-label","Ocupação real neste mês");meter.setAttribute("aria-valuemin","0");meter.setAttribute("aria-valuemax","100");
   usage.querySelector("h4")?.after(meter);
  }
  meter.setAttribute("aria-valuenow",String(view.occupancyPercent));
  let fill=meter.querySelector("span");if(!fill){fill=document.createElement("span");meter.append(fill);}
  fill.style.width=view.occupancyPercent+"%";
 }
 const panel=document.querySelector<HTMLElement>(".admin:not([hidden])");if(panel){
  const active=section?panel.querySelector<HTMLElement>('[data-section="'+section+'"]'):panel;
  if(active)decorateControls(active.querySelector(".management-page:not([hidden])")??active);
 }syncWindowChrome();
}

export function presentComputerOperations(stations:ReadonlyArray<ComputerOperationSnapshot>,root:ParentNode):void{
 for(const line of Array.from(root.querySelectorAll<HTMLElement>(":scope>div"))){
  const repair=line.querySelector<HTMLButtonElement>("[data-pc-repair]"),label=line.querySelector<HTMLElement>(":scope>span");
  if(!repair||!label)continue;
  const station=stations[Number(repair.dataset.pcRepair)];
  if(!station)continue;
  const {index:i,wear,broken}=station;
  label.className="pc-label";
  label.innerHTML=iconMarkup("computer")+'<span><b>Estação '+String(i+1).padStart(2,"0")+(broken?' <span class="pc-stopped">· Parada</span>':'')+'</b><small>'+station.windows+' · '+station.model+'</small><small>'+station.cpu+' · RAM '+station.ram+' · '+station.storage+'</small><small>Desgaste '+Math.round(wear)+'%</small><span class="wear-track"><i style="width:'+wear+'%"></i></span></span>';
 }
}

let currentPanel:HTMLElement|null=null,previousFocus:HTMLElement|null=null;
export function syncWindowChrome():void{
 const panel=document.querySelector<HTMLElement>(".admin:not([hidden])");
 const backdrop=document.getElementById("panel-backdrop");if(backdrop)backdrop.hidden=!panel;
 document.body.classList.toggle("panel-open",!!panel);
 if(panel===currentPanel)return;
 if(panel){previousFocus=document.activeElement instanceof HTMLElement?document.activeElement:null;panel.querySelector<HTMLButtonElement>('[id^="close-"]')?.focus();}
 else if(previousFocus?.isConnected&&previousFocus.getClientRects().length)previousFocus.focus();
 currentPanel=panel;
}
export function installWindowNavigation():void{
 document.getElementById("panel-backdrop")?.addEventListener("click",()=>currentPanel?.querySelector<HTMLButtonElement>('[id^="close-"]')?.click());
 document.addEventListener("keydown",event=>{
  if(!currentPanel)return;
  if(event.key==="Escape"){event.preventDefault();event.stopImmediatePropagation();currentPanel.querySelector<HTMLButtonElement>('[id^="close-"]')?.click();return;}
  const selected=event.target instanceof Element?event.target.closest<HTMLButtonElement>("[data-admin-tab]"):null;
  if(selected&&["ArrowLeft","ArrowRight","Home","End"].includes(event.key)){
   const tabs=Array.from(currentPanel.querySelectorAll<HTMLButtonElement>("[data-admin-tab]")),i=tabs.indexOf(selected);
   const next=event.key==="Home"?0:event.key==="End"?tabs.length-1:(i+(event.key==="ArrowRight"?1:-1)+tabs.length)%tabs.length;
   event.preventDefault();tabs[next]?.focus();tabs[next]?.click();return;
  }
  if(event.key!=="Tab")return;
  const items=Array.from(currentPanel.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),textarea:not(:disabled),summary,[tabindex="0"]')).filter(n=>n.tabIndex>=0&&n.getClientRects().length);
  const first=items[0],last=items.at(-1);if(!first||!last)return;
  if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
  else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
 },{capture:true});
}
