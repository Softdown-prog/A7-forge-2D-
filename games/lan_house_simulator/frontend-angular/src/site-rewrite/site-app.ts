import {ChangeDetectionStrategy,Component,OnDestroy,OnInit,computed,signal} from '@angular/core';
import {eras,faq,footerLinks,navigation,normalizeSearch,pathOf} from './site-data';
import {termsSections,privacySections} from './legal-content';
import {LocalDataComponent} from './local-data';
import {AccountComponent} from './account';
import {EmailConfirmationComponent} from './email-confirmation';
@Component({
 selector:'lhs-site',
 standalone:true,
 imports:[LocalDataComponent,AccountComponent,EmailConfirmationComponent],
 changeDetection:ChangeDetectionStrategy.OnPush,
 templateUrl:'./site-app.html'
})
export class SiteApp implements OnInit,OnDestroy{
 readonly path=pathOf(location.pathname);
 readonly navigation=navigation;
 readonly footerLinks=footerLinks;
 readonly legalSections=this.path==='/termos/'?termsSections:privacySections;
 readonly eras=eras;
 readonly faq=faq;
 readonly openMenu=signal(false);
 readonly reduceMotion=signal(false);
 readonly era=signal(0);
 readonly selectedEra=computed(()=>this.eras[this.era()]!);
 readonly query=signal('');
 readonly matched=computed(()=>{
  const terms=normalizeSearch(this.query()).split(' ').filter(Boolean);
  return this.faq.filter(([question,answer])=>{
   const text=normalizeSearch(question+' '+answer);
   return terms.every(term=>text.includes(term));
  });
 });
 readonly gameOpen=signal(false);
 private readonly media=window.matchMedia('(prefers-reduced-motion: reduce)');
 private readonly mediaListener=(event:MediaQueryListEvent):void=>{
  this.reduceMotion.set(event.matches);
 };
 ngOnInit():void{
  document.documentElement.dataset['siteFramework']='angular-rewrite';
  document.title=this.pageTitle()+' · Lan House Simulator';
  this.reduceMotion.set(this.media.matches);
  this.media.addEventListener('change',this.mediaListener);
 }
 ngOnDestroy():void{this.media.removeEventListener('change',this.mediaListener);}
 pageTitle():string{
  switch(this.path){
   case '/':return 'Sua lan house, uma época inteira';
   case '/jogar/':return 'Jogar';
   case '/ajuda/':return 'Ajuda e perguntas';
   case '/sobre-o-jogo/':return 'Sobre o jogo';
   case '/sobre-nos/':return 'Sobre nós';
   case '/contato/':return 'Contato';
   case '/conta/':return 'Minha conta';
   case '/conta/confirmar/':return 'Confirmação de email';
   case '/donate/':return 'Donate';
   case '/termos/':return 'Termos de uso';
   case '/privacidade/':return 'Política de privacidade';
   case '/dados/':return 'Dados locais';
   default:return 'Página não encontrada';
  }
 }
 toggleMenu():void{this.openMenu.update(value=>!value);}
 closeMenu():void{this.openMenu.set(false);}
 toggleMotion():void{this.reduceMotion.update(value=>!value);}
 selectEra(index:number):void{
  if(index>=0&&index<this.eras.length)this.era.set(index);
 }
 changeQuery(event:Event):void{
  if(event.target instanceof HTMLInputElement)this.query.set(event.target.value);
 }
 clearQuery(input:HTMLInputElement):void{
  this.query.set('');input.value='';input.focus();
 }
 startGame():void{this.gameOpen.set(true);}
}
