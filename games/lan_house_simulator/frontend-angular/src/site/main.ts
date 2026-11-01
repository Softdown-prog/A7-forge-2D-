/** Institutional website Angular entry. This bundle never imports the game or React. */
import {createComponent} from '@angular/core';
import {createApplication} from '@angular/platform-browser';
import {SiteHeaderComponent} from './site-header';
import {SiteFooterComponent} from './site-footer';
import {SiteTimelineComponent} from './site-timeline';
import {SiteHelpComponent} from './site-help';

async function start():Promise<void>{
 const headerHost=document.querySelector<HTMLElement>('header[data-angular-site-header]');
 const footerHost=document.querySelector<HTMLElement>('footer[data-angular-site-footer]');
 if(!headerHost||!footerHost)return;
 const app=await createApplication();
 const header=createComponent(SiteHeaderComponent,{
  environmentInjector:app.injector,hostElement:headerHost
 });
 app.attachView(header.hostView);
 header.changeDetectorRef.detectChanges();
 document.documentElement.dataset['siteHeader']='angular';
 const footer=createComponent(SiteFooterComponent,{
  environmentInjector:app.injector,hostElement:footerHost
 });
 app.attachView(footer.hostView);
 footer.changeDetectorRef.detectChanges();
 document.documentElement.dataset['siteFooter']='angular';
 for(const host of document.querySelectorAll<HTMLElement>('[data-angular-site-timeline]')){
  const timeline=createComponent(SiteTimelineComponent,{
   environmentInjector:app.injector,hostElement:host
  });
  app.attachView(timeline.hostView);
  timeline.changeDetectorRef.detectChanges();
  document.documentElement.dataset['siteTimeline']='angular';
 }
 for(const helpHost of document.querySelectorAll<HTMLElement>('[data-angular-site-help]')){
  const help=createComponent(SiteHelpComponent,{
   environmentInjector:app.injector,hostElement:helpHost
  });
  app.attachView(help.hostView);
  help.changeDetectorRef.detectChanges();
  document.documentElement.dataset['siteHelp']='angular';
 }
 document.documentElement.dataset['siteNavigation']='angular';
}
start().catch(error=>{console.error('Erro no site institucional Angular:',error);});
