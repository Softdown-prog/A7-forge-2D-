import {ChangeDetectionStrategy,Component,computed,signal} from '@angular/core';
import {faq,normalizeSearch} from './site-data';

/** Single owner of the Angular help page's filter and accessible feedback. */
@Component({
 selector:'lhs-help-search',standalone:true,
 changeDetection:ChangeDetectionStrategy.OnPush,
 templateUrl:'./help-search.html'
})
export class HelpSearchComponent{
 readonly faq=faq;
 readonly query=signal('');
 readonly matched=computed(()=>{
  const terms=normalizeSearch(this.query()).split(' ').filter(Boolean);
  return this.faq.filter(([question,answer])=>{
   const text=normalizeSearch(question+' '+answer);
   return terms.every(term=>text.includes(term));
  });
 });
 changeQuery(event:Event):void{
  if(event.target instanceof HTMLInputElement)this.query.set(event.target.value);
 }
 clearQuery(input:HTMLInputElement):void{
  this.query.set('');
  input.value='';
  input.focus();
 }
}
