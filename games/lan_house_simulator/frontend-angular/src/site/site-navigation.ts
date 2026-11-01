/** Fresh Angular-only navigation for the institutional website.
 * Retains the same CSS classes and links; no game, React or payment logic.
 */
import {ChangeDetectionStrategy,Component,ElementRef,OnDestroy,OnInit,inject,signal} from '@angular/core';

type SiteLink=Readonly<{href:string;label:string}>;
@Component({
 selector:'nav[data-angular-site-nav]',
 standalone:true,
 changeDetection:ChangeDetectionStrategy.OnPush,
 host:{'[class.is-open]':'isOpen()'},
 template:`
  @for(link of links;track link.href){
   <a [href]="link.href" [attr.aria-current]="currentPath===link.href?'page':null"
    (click)="close()">{{link.label}}</a>
  }
  <a class="button" href="/jogar/" [attr.aria-current]="currentPath==='/jogar/'?'page':null"
   (click)="close()">
   <svg class="icon" width="24" height="24" aria-hidden="true">
    <use href="/assets/icons.svg#play"></use>
   </svg> Jogar agora
  </a>
 `
})
export class SiteNavigationComponent implements OnInit,OnDestroy{
 private readonly host=inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
 private toggle:HTMLButtonElement|null=null;
 private readonly media=window.matchMedia('(min-width:801px)');
 readonly currentPath=location.pathname;
 readonly isOpen=signal(false);
 readonly links:readonly SiteLink[]=[
  {href:'/',label:'Início'},
  {href:'/sobre-o-jogo/',label:'O jogo'},
  {href:'/sobre-nos/',label:'Sobre nós'},
  {href:'/ajuda/',label:'Ajuda'},
  {href:'/donate/',label:'Donate'},
  {href:'/conta/',label:'Minha conta'}
 ];
 private readonly onToggle=():void=>{this.setOpen(!this.isOpen());};
 private readonly onKeyboard=(event:KeyboardEvent):void=>{
  if(event.key==='Escape'&&this.isOpen()){this.close();this.toggle?.focus();}
 };
 private readonly onOutside=(event:PointerEvent):void=>{
  if(!this.isOpen())return;
  const target=event.target;
  if(target instanceof Node&&!this.host.contains(target)&&!this.toggle?.contains(target))
   this.close();
 };
 private readonly onViewport=():void=>{this.close();};
 ngOnInit():void{
  document.documentElement.classList.add('js-enabled');
  this.toggle=document.querySelector<HTMLButtonElement>('#menu-toggle');
  this.toggle?.addEventListener('click',this.onToggle);
  document.addEventListener('keydown',this.onKeyboard);
  document.addEventListener('pointerdown',this.onOutside);
  this.media.addEventListener('change',this.onViewport);
  this.setOpen(false);
 }
 ngOnDestroy():void{
  this.toggle?.removeEventListener('click',this.onToggle);
  document.removeEventListener('keydown',this.onKeyboard);
  document.removeEventListener('pointerdown',this.onOutside);
  this.media.removeEventListener('change',this.onViewport);
 }
 private setOpen(value:boolean):void{
  this.isOpen.set(value);
  this.toggle?.setAttribute('aria-expanded',String(value));
 }
 close():void{this.setOpen(false);}
}
