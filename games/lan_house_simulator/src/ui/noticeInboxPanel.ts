/** Present the inbox without accessing simulation or installing listeners. */
import type {NoticeInboxSnapshot} from "../application/noticeInboxPort.js";
export function renderNoticeInbox(
 root:Pick<Element,"replaceChildren"|"append">,view:NoticeInboxSnapshot,
 doc:Pick<Document,"createElement">,iconMarkup:(name:"mail"|"warning")=>string
):void{
 root.replaceChildren();
 if(!view.letters.length){
  const empty=doc.createElement("p");empty.textContent="Nenhuma mensagem recebida por enquanto.";
  root.append(empty);return;
 }
 for(const letter of view.letters){
  const card=doc.createElement("article");
  card.className="notice-letter notice-"+letter.severity+(letter.read?" read":"");
  const title=doc.createElement("h3");title.textContent=letter.title;
  title.insertAdjacentHTML("afterbegin",iconMarkup(letter.severity==="urgent"?"warning":"mail"));
  const date=doc.createElement("small");date.textContent="Dia "+letter.day;
  const body=doc.createElement("p");body.textContent=letter.body;
  const actions=doc.createElement("div");actions.className="action-row wrap";
  for(const item of letter.items){
   if(item.kind!=="button"){
    const node=doc.createElement(item.kind==="hint"?"small":"strong");
    if(item.kind==="hint")node.className="notice-followup-hint";
    node.textContent=item.text;actions.append(node);continue;
   }
   const button=doc.createElement("button");
   button.className="slice";button.disabled=item.disabled;button.textContent=item.text;
   if(item.action==="read")button.dataset.noticeRead=item.noticeId;
   else if(item.action==="decision"){
    button.type="button";button.dataset.decision=item.noticeId;
    button.dataset.choice=item.choiceId;button.title=item.title??"";
   }else button.dataset.noticeAction=item.action;
   actions.append(button);
  }
  card.append(title,date,body,actions);root.append(card);
 }
}
