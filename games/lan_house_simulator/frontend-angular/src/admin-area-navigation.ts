/** Angular tab strip. The pre-existing TypeScript controller remains the single
 * authority for active area, accessible panel state and game rendering.
 */
import {ChangeDetectionStrategy,Component,OnDestroy,OnInit,signal} from '@angular/core';

interface AreaTab {
  id:string;
  label:string;
  controls:string;
  disabled:boolean;
}

@Component({
  selector:'lhs-admin-area-navigation',
  standalone:true,
  templateUrl:'./templates/admin-area-navigation.html',
  changeDetection:ChangeDetectionStrategy.OnPush
})
export class AdminAreaNavigationComponent implements OnInit,OnDestroy {
  readonly tabs=signal<readonly AreaTab[]>([]);
  readonly selected=signal('prices');

  private admin:HTMLElement|null=null;
  private readonly sync=(event:Event):void=>{
    const area=(event as CustomEvent<{area:string}>).detail?.area;
    if(area && this.tabs().some(tab=>tab.id===area))this.selected.set(area);
  };

  ngOnInit():void {
    this.admin=document.getElementById('admin');
    const buttons=Array.from(this.admin?.querySelectorAll<HTMLButtonElement>(
      '.admin-tabs button[data-admin-tab]') ?? []);
    const tabs:AreaTab[]=buttons.map(button=>({
      id:button.dataset.adminTab??'',
      label:button.textContent?.trim()??'',
      controls:button.getAttribute('aria-controls')??'',
      disabled:button.disabled
    })).filter(tab=>tab.id!=='' && tab.controls!=='' && tab.label!=='');
    this.tabs.set(tabs);
    const active=buttons.find(button=>button.getAttribute('aria-selected')==='true');
    const fallback=tabs[0];
    if(active?.dataset.adminTab)this.selected.set(active.dataset.adminTab);
    else if(fallback)this.selected.set(fallback.id);
    document.addEventListener('lhs:admin-area-selected',this.sync);
  }

  ngOnDestroy():void {
    document.removeEventListener('lhs:admin-area-selected',this.sync);
  }

  open(area:string):void {
    if(!this.tabs().some(tab=>tab.id===area && !tab.disabled))return;
    const original=this.admin?.querySelector<HTMLButtonElement>(
      '.admin-tabs button[data-admin-tab="'+area+'"]');
    if(original && !original.disabled)original.click();
  }

  onKeydown(event:KeyboardEvent,area:string):void {
    const key=event.key;
    if(!['ArrowLeft','ArrowRight','Home','End'].includes(key))return;
    const tabs=this.tabs().filter(tab=>!tab.disabled);
    if(!tabs.length)return;
    event.preventDefault();
    const index=tabs.findIndex(tab=>tab.id===area);
    let next=0;
    if(key==='Home')next=0;
    else if(key==='End')next=tabs.length-1;
    else if(key==='ArrowRight')next=(index+1)%tabs.length;
    else next=(index-1+tabs.length)%tabs.length;
    const selected=tabs[next];
    if(!selected)return;
    this.open(selected.id);
    // The original controller processes the click synchronously.
    const control=this.admin?.querySelector<HTMLButtonElement>(
      '#angular-admin-area-navigation button[data-angular-admin-tab="'+selected.id+'"]');
    control?.focus();
  }
}
