import {ChangeDetectionStrategy,Component,OnDestroy,OnInit,computed,signal} from '@angular/core';
import {eras,footerLinks,navigation,pathOf} from './site-data';
import {HelpSearchComponent} from './help-search';
import {termsSections,privacySections} from './legal-content';
import {LocalDataComponent} from './local-data';
import {AccountComponent} from './account';
import {EmailConfirmationComponent} from './email-confirmation';
import {DonateComponent} from './donate';
import {GameLauncherComponent} from './game-launcher';
import pageMetadata from './page-metadata.json';
@Component({
 selector:'lhs-site',
 standalone:true,
 imports:[LocalDataComponent,AccountComponent,EmailConfirmationComponent,DonateComponent,GameLauncherComponent,HelpSearchComponent],
 changeDetection:ChangeDetectionStrategy.OnPush,
 templateUrl:'./site-app.html'
})
export class SiteApp implements OnInit,OnDestroy{
 readonly path=pathOf(location.pathname);
 readonly navigation=navigation;
 readonly footerLinks=footerLinks;
 readonly legalSections=this.path==='/termos/'?termsSections:privacySections;
 readonly eras=eras;
 readonly openMenu=signal(false);
 readonly reduceMotion=signal(false);
 readonly era=signal(0);
 readonly selectedEra=computed(()=>this.eras[this.era()]!);
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
 pageTitle():string{return pageMetadata[this.path].title;}
 toggleMenu():void{this.openMenu.update(value=>!value);}
 closeMenu():void{this.openMenu.set(false);}
 toggleMotion():void{this.reduceMotion.update(value=>!value);}
 selectEra(index:number):void{
  if(index>=0&&index<this.eras.length)this.era.set(index);
 }
}
