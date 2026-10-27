/** DOM-only PS1 administration. No direct simulation or save dependency. */
import type {Ps1AdminPort} from "../application/ps1AdminPort.js";
export interface Ps1AdminUi{
 showStations:boolean;setText:(id:string,value:string)=>void;money:(n:number)=>string;
}
export function renderPs1AdminPanel(port:Ps1AdminPort,ui:Ps1AdminUi):void{
 const s=port.snapshot(),{setText,money}=ui;
 setText("ps1-overview",!s.consoleReady?
  "Disponível a partir de 2002. Compre um conjunto com TV de tubo, PS1, bancada e cadeira na loja.":
  "Bancadas instaladas: "+s.stationCount+"/"+s.maxStations+
  " · sessões atendidas: "+s.sessions+
  " · receita acumulada: "+money(s.revenue)+
  ". Segunda cadeira opcional por bancada: até dois jogadores simultâneos, "+
  "cada cliente paga sua sessão. Internet não é necessária para jogar.");
 setText("ps1-hourly",s.hourlyPrice.toLocaleString("pt-BR",{style:"currency",currency:"BRL"})+"/h");
 setText("ps1-disc-summary",s.stationCount===0?
  "Compre a primeira bancada na loja. Depois, adquira os CDs físicos.":
  s.ownedDiscs===0?"Sem CDs no acervo: as bancadas não recebem clientes até você comprar pelo menos um jogo.":
  "CDs no acervo: "+s.ownedDiscs+" · Bancadas com jogo: "+s.readyStations+"/"+
  s.stationCount+". Cada CD comprado atende uma bancada por vez.");
 for(const id of ["ps1-price-down","ps1-price-up"]){
  const button=document.getElementById(id) as HTMLButtonElement|null;
  if(button)button.disabled=id==="ps1-price-down"?!s.canDecreasePrice:!s.canIncreasePrice;
 }
 if(!ui.showStations)return;
 const area=document.getElementById("ps1-stations");
 if(!area)return;
 area.replaceChildren();
 if(s.stationCount===0){
  const empty=document.createElement("p");
  empty.textContent=s.consoleReady?"Compre a primeira bancada na loja para receber clientes de videogame.":"As bancadas de PlayStation chegam em 2002.";
  area.append(empty);
 }
 for(const station of s.stations){
  const card=document.createElement("div");card.className="ps1-station-summary";
  const text=document.createElement("span");
  text.textContent="Bancada "+(station.index+1)+" · vagas: "+station.occupied+"/"+station.capacity+
   " · controles: "+Math.round(station.wear)+"% de desgaste"+
   (station.wear>=100?" · Precisa de manutenção":station.isBusy?" · Em uso":
    station.playableDisc?" · Livre":" · Sem jogo")+
   (station.acceptsAnotherPlayer?" · Aceita outro jogador":"")+
   " · Disco: "+station.discName;
  const repair=document.createElement("button");repair.className="slice";
  repair.dataset.ps1Repair=String(station.index);repair.type="button";
  repair.textContent="Revisar controles · R$ 45";repair.disabled=!station.canRepair;
  const label=document.createElement("label");label.className="ps1-station-cd-label";
  label.textContent="CD inserido";
  const selector=document.createElement("select");selector.className="slice";
  selector.dataset.ps1Slot=String(station.index);selector.disabled=station.isBusy;
  const empty=document.createElement("option");empty.value="";empty.textContent="Sem CD";
  selector.append(empty);
  for(const disc of station.discOptions){
   const option=document.createElement("option");option.value=disc.id;
   option.textContent=disc.label;selector.append(option);
  }
  selector.value=station.selectedDisc;label.append(selector);
  const extra=document.createElement("button");extra.className="slice";
  extra.dataset.ps1SecondSeat=String(station.index);extra.type="button";
  extra.textContent=station.secondSeat?"Modo dupla instalado · 2 cadeiras":
   "Instalar segunda cadeira + controle · "+money(station.secondSeatPrice);
  extra.disabled=!station.canBuySecondSeat;
  card.append(text,label,repair,extra);area.append(card);
 }
}
