/** DOM presentation only; prices, availability and commands come from the application. */
import type {Ps2Port} from "../application/ps2Port.js";
import {drawPs2Station} from "../render/ps2Art.js";
const money=(n:number)=>n.toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
function text<K extends keyof HTMLElementTagNameMap>(doc:Document,tag:K,value:string){const el=doc.createElement(tag);el.textContent=value;return el;}
function button(doc:Document,value:string,disabled:boolean,key:string,index:string){
 const el=text(doc,"button",value);el.type="button";el.className="slice";el.disabled=disabled;el.dataset[key]=index;return el;
}
/** Procedural preview made with the same Canvas renderer as the game. */
export function renderPs2ShopCatalog(host:HTMLElement,port:Ps2Port,doc:Document):void{
 const s=port.snapshot();
 const heading=text(doc,"h3","PlayStation 2 · 2006");heading.className="ps2-shop-heading";host.append(heading);
 const card=doc.createElement("article");card.className="shop-card ps2-bench-card";
 const canvas=doc.createElement("canvas");canvas.width=300;canvas.height=180;canvas.className="ps2-shop-preview";
 canvas.setAttribute("aria-label","PS2 com TV, bancada e cadeira, desenhado no Canvas");
 const ctx=canvas.getContext("2d");if(ctx)drawPs2Station(ctx,{zoom:1.18,originX:150,originY:98},{x:0,y:0},0,false,0);
 const label=text(doc,"label","Local da bancada PS2");label.htmlFor="ps2-placement";
 const select=doc.createElement("select");select.id="ps2-placement";select.disabled=s.benchDisabled;
 for(const slot of s.slots){const opt=text(doc,"option",slot.label);opt.value=slot.id;select.append(opt);}
 const buy=button(doc,s.benchText+" · "+money(s.benchPrice),s.benchDisabled,"buy","ps2");
 card.append(canvas,text(doc,"h3","Bancada PlayStation 2"),text(doc,"p","Console, TV, bancada, cadeira e controle. Jogos comprados separadamente. Até 3 PS2, além dos PS1. Internet não é necessária."),label,select,buy);host.append(card);
 for(const g of s.games){
  const item=doc.createElement("article");item.className="shop-card ps2-game-card";
  // Original code-drawn cover, no external image or commercial artwork.
  const cover=doc.createElement("canvas");cover.width=240;cover.height=120;cover.className="ps2-shop-preview";
  const c=cover.getContext("2d");if(c){
   c.fillStyle=["#244e76","#59508b","#2a7056","#22305f","#765480"][s.games.indexOf(g)]!;c.fillRect(0,0,240,120);
   c.fillStyle="#c4e2e8";for(let i=0;i<9;i++)c.fillRect(14+i*26,10+(i%3)*13,14,28);
   c.fillStyle="#fff";c.font="bold 17px system-ui";c.fillText(g.title,12,91,218);c.font="12px system-ui";c.fillText("PS2 · "+g.genre,12,110);
  }
  item.append(cover,text(doc,"h3",g.title),text(doc,"p",g.genre+" · "+g.copies+" cópia(s) no acervo. Cada mídia equipa uma bancada."),
   button(doc,g.buyText+" · "+money(g.price),g.disabled,"buyPs2Game",g.id));host.append(item);
 }
}
const rendered=new WeakMap<Element,string>();
export function renderPs2AdminPanel(port:Ps2Port,showStations:boolean,doc:Document):void{
 const s=port.snapshot();
 const set=(id:string,value:string)=>{const el=doc.getElementById(id);if(el)el.textContent=value;};
 set("ps2-overview",s.unlocked?"PS2: "+s.count+"/3 bancadas · disponíveis "+s.available+" · jogadores "+s.occupied+" · sessões "+s.sessions+" · receita "+money(s.revenue):"PlayStation 2 disponível a partir de 2006.");
 set("ps2-hourly",money(s.hourlyPrice)+"/h");set("ps2-game-summary",s.copies+" jogo(s) físicos de PS2. Cada cópia atende uma bancada; dois jogadores podem compartilhar o mesmo jogo.");
 for(const [id,disabled] of [["ps2-price-down",!s.count||s.hourlyPrice<=.5],["ps2-price-up",!s.count||s.hourlyPrice>=s.ceiling]] as const){
  const el=doc.getElementById(id) as HTMLButtonElement|null;if(el)el.disabled=disabled;
 }
 const host=doc.getElementById("ps2-stations");if(!host||!showStations)return;
 const key=JSON.stringify([s.stations,s.secondSeatPrice,s.repairPrice,s.unlocked]);if(rendered.get(host)===key)return;rendered.set(host,key);
 host.replaceChildren();
 if(!s.count)host.append(text(doc,"p",s.unlocked?"Compre uma bancada e um jogo PS2 na loja para começar.":"As bancadas PS2 chegam em 2006."));
 for(const st of s.stations){
  const card=doc.createElement("article");card.className="ps1-station-summary";
  card.append(text(doc,"h4","PS2 · bancada "+(st.index+1)),text(doc,"p",st.gameName+" · "+st.occupied+"/"+st.capacity+" jogadores · desgaste "+Math.round(st.wear)+"% · "+(st.poweredOff?"desligado":st.available?"disponível":st.busy?"em uso":"sem atendimento")));
  const label=text(doc,"label","Jogo inserido");const select=doc.createElement("select");select.dataset.ps2Game=String(st.index);select.disabled=st.busy;
  const empty=text(doc,"option","Sem jogo (pausar atendimento)");empty.value="";select.append(empty);
  for(const g of st.games){const opt=text(doc,"option",g.title);opt.value=g.id;opt.disabled=g.disabled;select.append(opt);}select.value=st.gameId;label.append(select);
  const actions=doc.createElement("div");actions.className="action-row wrap";
  actions.append(button(doc,"Revisar · "+money(s.repairPrice),!st.canRepair,"ps2Repair",String(st.index)),
   button(doc,st.capacity===2?"Duas cadeiras instaladas":"Segunda cadeira + controle · "+money(s.secondSeatPrice),!st.canSecondSeat,"ps2Seat",String(st.index)),
   button(doc,st.poweredOff?"Ligar":"Desligar",st.busy,"ps2Power",String(st.index)));
  card.append(label,actions);host.append(card);
 }
}
export function installPs2Controls(roots:{admin:HTMLElement|null;shop:HTMLElement|null},port:Ps2Port,onResult:(r:ReturnType<Ps2Port["buyGame"]>)=>void):void{
 roots.shop?.addEventListener("click",event=>{
  const b=event.target instanceof Element?event.target.closest<HTMLButtonElement>("button[data-buy-ps2-game]"):null;
  if(b&&!b.disabled)onResult(port.buyGame(b.dataset.buyPs2Game!));
 });
 roots.admin?.addEventListener("change",event=>{
  const el=event.target;if(el instanceof HTMLSelectElement&&el.dataset.ps2Game!==undefined&&!el.disabled)onResult(port.setGame(Number(el.dataset.ps2Game),el.value));
 });
 roots.admin?.addEventListener("click",event=>{
  const b=event.target instanceof Element?event.target.closest<HTMLButtonElement>("button"):null;if(!b||b.disabled)return;
  if(b.id==="ps2-price-down"||b.id==="ps2-price-up"){onResult(port.changePrice(b.id.endsWith("up")?1:-1));return;}
  if(b.dataset.ps2Repair!==undefined)onResult(port.repair(Number(b.dataset.ps2Repair)));
  if(b.dataset.ps2Seat!==undefined)onResult(port.secondSeat(Number(b.dataset.ps2Seat)));
  if(b.dataset.ps2Power!==undefined){const i=Number(b.dataset.ps2Power);onResult(port.power(i,port.snapshot().stations[i]?.poweredOff===true));}
 });
}
