/** Institutional website Angular entry. This bundle never imports the game or React. */
import {createComponent} from '@angular/core';
import {createApplication} from '@angular/platform-browser';
import {SiteNavigationComponent} from './site-navigation';

async function start():Promise<void>{
 const host=document.querySelector<HTMLElement>('#site-nav[data-angular-site-nav]');
 if(!host)return;
 const app=await createApplication();
 const ref=createComponent(SiteNavigationComponent,{
  environmentInjector:app.injector,hostElement:host
 });
 app.attachView(ref.hostView);
 ref.changeDetectorRef.detectChanges();
 document.documentElement.dataset['siteNavigation']='angular';
}
start().catch(error=>{console.error('Erro na navegação Angular do site:',error);});
