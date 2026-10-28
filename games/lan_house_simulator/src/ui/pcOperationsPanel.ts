/** DOM-only operation controls; the existing delegated listeners remain attached. */
import type {PcOperationRow} from "../application/pcOperationsPort.js";

export function renderPcOperations(
 host:Element,rows:ReadonlyArray<PcOperationRow>,doc:Pick<Document,"createElement">
):void{
 const header=doc.createElement("strong");header.textContent="Operação e manutenção por computador";
 host.replaceChildren(header);
 const hint=doc.createElement("p");hint.className="station-power-hint";
 hint.textContent="Desligue uma estação livre para economizar energia e instalar melhorias. Religue para receber clientes.";
 host.append(hint);
 for(const item of rows){
  const line=doc.createElement("div");
  line.dataset.panelKey="operation-"+item.index;
  line.className="pc-operation"+(item.poweredOn?"":" is-powered-off");
  const label=doc.createElement("span");label.textContent=item.label;
  const power=doc.createElement("button");power.type="button";
  power.dataset.pcPower=String(item.index);
  power.id="pc-power-"+item.index;power.className="pc-power-toggle";
  power.textContent=item.powerLabel;power.disabled=item.powerDisabled;power.title=item.powerTitle;
  const repair=doc.createElement("button");repair.type="button";
  repair.dataset.pcRepair=String(item.index);
  repair.textContent=item.repairLabel;repair.disabled=item.repairDisabled;
  if(item.progress){
   const meter=doc.createElement("progress");
   meter.max=item.progress.max;meter.value=item.progress.value;
   meter.setAttribute("aria-label",item.progress.ariaLabel);
   line.append(meter);
  }
  const upgrade=doc.createElement("button");upgrade.type="button";
  upgrade.dataset.pcUpgrade=String(item.index);
  upgrade.textContent=item.upgradeLabel;upgrade.disabled=item.upgradeDisabled;
  line.append(label,power,repair,upgrade);host.appendChild(line);
 }
}
