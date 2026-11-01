/**
 * Angular 22 presentation islands. This entry is independent of the
 * TypeScript 7 Canvas game and may later replace the React entry.
 */
import { createComponent, type Type } from '@angular/core';
import { createApplication } from '@angular/platform-browser';
import {
  AdminShortcutsComponent, HeaderActionsComponent, MenuActionsComponent,
  MenuTourComponent, QuickDeckComponent, ShopCategoriesComponent, ShopSearchComponent
} from './components';
import {
  ComputerWorkspaceComponent,ServiceWorkspaceComponent,StockWorkspaceComponent,
  FinanceWorkspaceComponent,PricesWorkspaceComponent,LicensesWorkspaceComponent,
  ConsolesWorkspaceComponent
} from './workspaces';
import {AdminAreaNavigationComponent} from './admin-area-navigation';
import {MenuPreferencesComponent,SaveTransferComponent} from './menu-save-controls';
import {TimeWeatherComponent,NoticeInboxComponent} from './calendar-mail';
import {ShopOverviewComponent} from './shop-overview';
import {ShopCatalogComponent} from './shop-catalog';
import {AccountShellComponent} from './account-shell';
import {MerchandiseCatalogComponent} from './merchandise-catalog';

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
    // Explicit common Angular component type avoids narrowing a heterogeneous
    // component tuple to the first constructor under strict TypeScript 6.
    const ref=createComponent(component as Type<unknown>,{environmentInjector:app.injector,hostElement:host});
    app.attachView(ref.hostView);
    ref.changeDetectorRef.detectChanges();
  }
  // The Angular shop overview is preview-only until the final coordinated
  // React removal. Native TypeScript controllers bind its stable button IDs.
  const shopOverviewHost=document.getElementById('angular-shop-overview');
  if(shopOverviewHost){
    const ref=createComponent(ShopOverviewComponent,{
      environmentInjector:app.injector,hostElement:shopOverviewHost
    });
    app.attachView(ref.hostView);
    ref.changeDetectorRef.detectChanges();
  }

  // Future Angular cards are preview-only until PS1/PS2 feature parity.
  const shopCardsHost=document.getElementById('angular-shop-catalog');
  if(shopCardsHost){
    const ref=createComponent(ShopCatalogComponent,{
      environmentInjector:app.injector,hostElement:shopCardsHost
    });
    app.attachView(ref.hostView);
    ref.changeDetectorRef.detectChanges();
  }

  // The original site has no stock workspace island. During the cutover
  // rehearsal, its Angular navigation proxies the native stock task buttons.
  const stockWorkspaceHost=document.getElementById('angular-stock-workspace');
  if(stockWorkspaceHost){
    const ref=createComponent(StockWorkspaceComponent,{
      environmentInjector:app.injector,hostElement:stockWorkspaceHost
    });
    app.attachView(ref.hostView);
    ref.changeDetectorRef.detectChanges();
  }

  // Optional finance task navigation, only in the isolated Angular rehearsal.
  // The underlying TypeScript finance/reset buttons remain command owners.
  const financeWorkspaceHost=document.getElementById('angular-finance-workspace');
  if(financeWorkspaceHost){
    const ref=createComponent(FinanceWorkspaceComponent,{
      environmentInjector:app.injector,hostElement:financeWorkspaceHost
    });
    app.attachView(ref.hostView);
    ref.changeDetectorRef.detectChanges();
  }

  // Secondary administration areas are optional presentation-only islands.
  // Their original TS task buttons remain mounted as stable command targets.
  const additionalAdminIslands=[
    ['angular-prices-workspace',PricesWorkspaceComponent],
    ['angular-licenses-workspace',LicensesWorkspaceComponent],
    ['angular-consoles-workspace',ConsolesWorkspaceComponent]
  ] as const;
  for(const [id,component] of additionalAdminIslands){
    const host=document.getElementById(id);
    if(!host)continue;
    const ref=createComponent(component as Type<unknown>,{
      environmentInjector:app.injector,hostElement:host
    });
    app.attachView(ref.hostView);
    ref.changeDetectorRef.detectChanges();
  }

  // Catalog controls mount before native management panels attach handlers.
  // The simulation's MerchandisePort still handles every mutation.
  const merchandiseHost=document.getElementById('angular-merchandise-catalog');
  if(merchandiseHost){
    const ref=createComponent(MerchandiseCatalogComponent,{
      environmentInjector:app.injector,hostElement:merchandiseHost
    });
    app.attachView(ref.hostView);
    ref.changeDetectorRef.detectChanges();
  }

  // Account presentation is optional until the coordinated production switch.
  // Mount before importing the native game so its account controller can
  // attach to the one stable dialog without replacing Angular-owned DOM.
  const accountHost=document.getElementById('angular-player-account');
  if(accountHost){
    const ref=createComponent(AccountShellComponent,{
      environmentInjector:app.injector,hostElement:accountHost
    });
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
  document.documentElement.dataset['uiFramework']='angular';

  // The actual Canvas simulation still starts through its own JS module,
  // never bundled into Angular or invoked from a component.
  if(document.getElementById('game')){
    const gameUrl=new URL('./js/main.js',document.baseURI);
    // The standalone game has no revision query, but the site build uses
    // ?v=<12 hex> for every native module. Reuse the UI entry's exact revision
    // so old Canvas imports are never mixed with a freshly deployed Angular UI.
    const uiEntry=document.querySelector<HTMLScriptElement>(
      'script[type="module"][src*="__angular/main.js"]'
    );
    const revision=uiEntry?new URL(uiEntry.src).searchParams.get('v'):null;
    if(revision && /^[a-f0-9]{12}$/.test(revision))
      gameUrl.searchParams.set('v',revision);
    await import(/* @vite-ignore */ gameUrl.href);
  }
}
mountUi().catch(error=>{
  console.error('Falha ao iniciar a interface Angular da lan house:',error);
  const message=document.getElementById('save-message');
  if(message)message.textContent='Não foi possível iniciar o jogo. Atualize a página para tentar novamente.';
});
