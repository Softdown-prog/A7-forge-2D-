// Keep live controls connected while refreshing a long, scrollable panel. Clearing
// the panel first collapses its height and makes the browser anchor to old focus.
const key=(node:Node):string|null=>node instanceof Element?node.id||node.getAttribute("data-panel-key"):null;
const compatible=(a:Node,b:Node):boolean=>a.nodeType===b.nodeType&&a.nodeName===b.nodeName&&key(a)===key(b);

export function syncPanelChildren(current:Element,next:Element):void{
 let cursor=current.firstChild;
 for(const desired of Array.from(next.childNodes)){
  let retained=cursor;
  if(!retained||!compatible(retained,desired)){
   retained=key(desired)?Array.from(current.childNodes).find(node=>compatible(node,desired))??null:null;
   if(retained)current.insertBefore(retained,cursor);
   else{current.insertBefore(desired,cursor);continue;}
  }
  if(retained instanceof Element&&desired instanceof Element){
   for(const attribute of Array.from(retained.attributes))if(!desired.hasAttribute(attribute.name))retained.removeAttribute(attribute.name);
   for(const attribute of Array.from(desired.attributes))if(retained.getAttribute(attribute.name)!==attribute.value)retained.setAttribute(attribute.name,attribute.value);
   syncPanelChildren(retained,desired);
  }else if(retained.nodeValue!==desired.nodeValue)retained.nodeValue=desired.nodeValue;
  cursor=retained.nextSibling;
 }
 while(cursor){const obsolete=cursor;cursor=cursor.nextSibling;obsolete.remove();}
}
