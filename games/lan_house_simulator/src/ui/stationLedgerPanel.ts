/** Display-only per-computer finance ledger. No direct domain-model or simulation imports. */
import type {StationLedgerPort} from "../application/stationLedgerPort.js";
import {syncPanelChildren} from "./panelChildren.js";

export function renderStationLedgerRows(host:HTMLTableSectionElement,port:StationLedgerPort):void {
 const currency=(value:number):string=>value.toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
 const next=document.createElement("tbody");
 for(const item of port.rows()){
  const row=document.createElement("tr");
  const cells=[
   item.label,String(item.sessions),String(item.vipSessions),
   Math.floor(item.occupiedMinutes).toLocaleString("pt-BR"),
   currency(item.sessionRevenue),currency(item.energyShare),
   currency(item.netRevenue)
  ];
  for(let index=0;index<cells.length;index++){
   const cell=index===0?document.createElement("th"):document.createElement("td");
   if(index===0)(cell as HTMLTableCellElement).scope="row";
   cell.textContent=cells[index]!;
   row.append(cell);
  }
  next.append(row);
 }
 syncPanelChildren(host,next);
}
