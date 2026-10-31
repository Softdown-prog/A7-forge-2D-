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
    ['angular-service-workspace',ServiceWorkspaceComponent]
  ] as const;
  for(const [id,component] of islands){
    const host=document.getElementById(id);
    if(!host)throw new Error('Angular UI root ausente: '+id);
    const ref=createComponent(component,{environmentInjector:app.injector,hostElement:host});
    app.attachView(ref.hostView);
    // Original DOM controllers expect stable button IDs before bootstrap.
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
