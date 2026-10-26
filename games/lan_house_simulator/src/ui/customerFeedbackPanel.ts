import type {FeedbackSnapshot} from "../application/customerFeedbackSnapshot.js";
/** Render only when Finance > Opiniões is active.
 * No simulation imports, timers, animations or save logic. */
export function renderCustomerFeedback(host:HTMLElement,view:FeedbackSnapshot):void{
 const summary=host.querySelector<HTMLElement>("#customer-feedback-summary");
 const reasonsHost=host.querySelector<HTMLElement>("#customer-feedback-reasons");
 const recent=host.querySelector<HTMLOListElement>("#customer-feedback-list");
 if(!summary||!reasonsHost||!recent)return;
 summary.textContent=view.summary;
 reasonsHost.replaceChildren();recent.replaceChildren();
 for(const reason of view.reasons){
  const row=document.createElement("div");row.className="customer-feedback-reason";
  const label=document.createElement("span");label.textContent=reason.label;
  const count=document.createElement("strong");count.textContent=reason.stats;
  row.append(label,count);reasonsHost.append(row);
 }
 for(const entry of view.recent){
  const row=document.createElement("li");row.className=entry.negative?"feedback-negative":"feedback-positive";
  const label=document.createElement("span");label.textContent=entry.label;
  const delta=document.createElement("strong");delta.textContent=entry.delta;
  row.append(label,delta);recent.append(row);
 }
}
