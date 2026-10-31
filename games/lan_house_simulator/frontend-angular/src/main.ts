/**
 * Angular 22 presentation islands. This entry is independent of the
 * TypeScript 7 Canvas game and may later replace the React entry.
 */
import { createComponent } from '@angular/core';
import { createApplication } from '@angular/platform-browser';
import {
  AdminShortcutsComponent, HeaderActionsComponent, MenuActionsComponent,
  MenuTourComponent, QuickDeckComponent, ShopCategoriesComponent, ShopSearchComponent
} from './components';
import {ComputerWorkspaceComponent,ServiceWorkspaceComponent} from './workspaces';
import {AdminAreaNavigationComponent} from './admin-area-navigation';
import {MenuPreferencesComponent,SaveTransferComponent} from './menu-save-controls';
import {TimeWeatherComponent,NoticeInboxComponent} from './calendar-mail';

async function mountUi():Promise<void> {
  const app=await createApplication();
  const islands=[
    ['react-menu-actions',MenuActionsComponent],
    ['react-menu-tour',MenuTourComponent],
    ['react-topbar-actions',HeaderActionsComponent],
    ['react-quick-deck',QuickDeckComponent],
    ['react-shop-categories',ShopCategoriesComponent],
    ['react-shop-search',ShopSearchComponent],
    ['react-admin-shortcuts',AdminShortcutsComponent],
    ['angular-computer-workspace',ComputerWorkspaceComponent],
    ['angular-service-workspace',ServiceWorkspaceComponent],
    ['angular-admin-area-navigation',AdminAreaNavigationComponent]
  ] as const;
  for(const [id,component] of islands){
    const host=document.getElementById(id);
    if(!host)throw new Error('Angular UI root ausente: '+id);
    const ref=createComponent(component,{environmentInjector:app.injector,hostElement:host});
    app.attachView(ref.hostView);
    // Original DOM controllers expect stable button IDs before bootstrap.
    ref.changeDetectorRef.detectChanges();
  }
  // Exclusive Angular HUD/mail ownership is activated only when their
  // future hosts are present. The published React game has neither host.
  const futureStatusIslands=[
    ['angular-time-weather',TimeWeatherComponent],
    ['angular-notice-inbox',NoticeInboxComponent]
  ] as const;
  for(const [id,component] of futureStatusIslands){
    const host=document.getElementById(id);
    if(!host)continue;
    const ref=createComponent(component,{environmentInjector:app.injector,hostElement:host});
    app.attachView(ref.hostView);
    ref.changeDetectorRef.detectChanges();
  }
  // These two components will replace their legacy markup at final cutover.
  // In the current game document they have no host, so there are no duplicate
  // save/input IDs and the React production UI keeps working untouched.
  const futureMenuIslands=[
    ['angular-save-transfer',SaveTransferComponent],
    ['angular-menu-preferences',MenuPreferencesComponent]
  ] as const;
  for(const [id,component] of futureMenuIslands){
    const host=document.getElementById(id);
    if(!host)continue;
    const ref=createComponent(component,{environmentInjector:app.injector,hostElement:host});
    app.attachView(ref.hostView);
    ref.changeDetectorRef.detectChanges();
  }
  document.documentElement.dataset.uiFramework='angular';

  // The actual Canvas simulation still starts through its own JS module,
  // never bundled into Angular or invoked from a component.
  if(document.getElementById('game')){
    const gameUrl=new URL('./js/main.js',document.baseURI).href;
    await import(/* @vite-ignore */ gameUrl);
  }
}
mountUi().catch(error=>{
  console.error('Falha ao iniciar a interface Angular da lan house:',error);
  const message=document.getElementById('save-message');
  if(message)message.textContent='Não foi possível iniciar o jogo. Atualize a página para tentar novamente.';
});
