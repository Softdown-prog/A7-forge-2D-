import {ChangeDetectionStrategy,Component,OnDestroy,OnInit,signal} from '@angular/core';
import {pathOf} from './site-data';
import {HomeDetailsComponent} from './home-details';
import {SiteFooterComponent} from './site-footer';
import {EraTimelineComponent} from './era-timeline';
import {SiteHeaderComponent} from './site-header';
import {HelpSearchComponent} from './help-search';
import {ContactComponent} from './contact';
import {AboutGameComponent} from './about-game';
import {AboutUsComponent} from './about-us';
import {LegalDocumentComponent} from './legal-document';
import {LocalDataComponent} from './local-data';
import {AccountComponent} from './account';
import {EmailConfirmationComponent} from './email-confirmation';
import {DonateComponent} from './donate';
import {GameLauncherComponent} from './game-launcher';
import pageMetadata from './page-metadata.json';
@Component({
 selector:'lhs-site',
 standalone:true,
 imports:[HomeDetailsComponent,LocalDataComponent,AccountComponent,EmailConfirmationComponent,DonateComponent,GameLauncherComponent,HelpSearchComponent,ContactComponent,AboutGameComponent,AboutUsComponent,EraTimelineComponent,SiteHeaderComponent,SiteFooterComponent,LegalDocumentComponent],
 changeDetection:ChangeDetectionStrategy.OnPush,
 templateUrl:'./site-app.html'
})
export class SiteApp implements OnInit,OnDestroy{
 readonly path=pathOf(location.pathname);
 readonly skipHref=location.pathname+'#conteudo';
 readonly reduceMotion=signal(false);
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
 toggleMotion():void{this.reduceMotion.update(value=>!value);}
}
