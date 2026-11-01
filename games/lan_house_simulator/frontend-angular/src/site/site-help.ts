/** Standalone Angular Help/FAQ; no React, network calls or game imports. */
import {ChangeDetectionStrategy,Component,ElementRef,computed,inject,signal} from '@angular/core';

type HelpItem=Readonly<{question:string;answer:string}>;
function normalize(value:string):string {
 return value.normalize('NFD').replace(/[\u0300-\u036f]/g,'')
  .toLocaleLowerCase('pt-BR').replace(/[^\p{L}\p{N}]+/gu,' ')
  .trim().replace(/\s+/g,' ');
}
function isQuestion(item:unknown):item is [string,string] {
 return Array.isArray(item)&&item.length===2&&item.every(part=>
  typeof part==='string'&&part.length>0&&part.length<=1600);
}
@Component({
 selector:'article[data-angular-site-help]',
 standalone:true,
 changeDetection:ChangeDetectionStrategy.OnPush,
 templateUrl:'./site-help.html'
})
export class SiteHelpComponent {
 private readonly host=inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
 readonly questions:readonly HelpItem[]=this.readQuestions();
 readonly query=signal('');
 readonly opened=signal<Record<number,boolean>>({});
 readonly active=computed(()=>this.query().trim().length>0);
 private readonly terms=computed(()=>normalize(this.query()).split(' ').filter(Boolean));
 readonly matched=computed(()=>{
  const terms=this.terms();
  return this.questions.map(item=>{
   const full=normalize(item.question+' '+item.answer);
   return terms.every(term=>full.includes(term));
  });
 });
 readonly count=computed(()=>this.matched().filter(Boolean).length);
 onInput(event:Event):void{
  if(event.target instanceof HTMLInputElement)this.query.set(event.target.value);
 }
 clear(input:HTMLInputElement):void{
  this.query.set('');
  input.value='';
  input.focus();
 }
 onToggle(index:number,event:Event):void{
  if(!this.active()&&event.target instanceof HTMLDetailsElement){
   const isOpen=event.target.open;
   if(this.opened()[index]!==isOpen)
    this.opened.update(current=>({...current,[index]:isOpen}));
  }
 }
 private readQuestions():readonly HelpItem[]{
  const data=this.host.getAttribute('data-faq-list');
  if(!data)throw new Error('Catalogo FAQ Angular ausente');
  const parsed:unknown=JSON.parse(data);
  if(!Array.isArray(parsed)||parsed.length<1||parsed.length>50||!parsed.every(isQuestion))
   throw new Error('Catalogo FAQ Angular invalido');
  return parsed.map(([question,answer])=>({question,answer}));
 }
}
