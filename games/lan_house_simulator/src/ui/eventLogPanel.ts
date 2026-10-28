/** DOM-only recent activity list. Event classification is supplied by the port. */
import type {EventLogSnapshot,EventLogIcon} from "../application/eventLogPort.js";
export function renderEventLog(
 host:Pick<Element,"replaceChildren"|"appendChild">,
 view:EventLogSnapshot,
 doc:Pick<Document,"createElement"|"createTextNode">,
 iconMarkup:(name:EventLogIcon)=>string
):void{
 host.replaceChildren();
 for(const event of view.rows){
  const li=doc.createElement("li"),text=doc.createElement("span");
  if(event.time!==null){
   const time=doc.createElement("time");time.textContent=event.time;
   text.append(time,doc.createTextNode(event.text));
  }else text.textContent=event.text;
  li.innerHTML=iconMarkup(event.icon);
  li.append(text);host.appendChild(li);
 }
}
