import {ChangeDetectionStrategy,Component,HostListener,OnDestroy,signal} from '@angular/core';

/**
 * Angular owns only the game-launching UI. The Canvas runtime stays in its
 * isolated /game/ iframe, with its own simulation, storage and input handlers.
 */
@Component({
 selector:'lhs-game-launcher',
 standalone:true,
 changeDetection:ChangeDetectionStrategy.OnPush,
 templateUrl:'./game-launcher.html'
})
export class GameLauncherComponent implements OnDestroy{
 readonly open=signal(false);
 readonly state=signal<'idle'|'loading'|'ready'|'error'>('idle');
 readonly fullscreen=signal(false);
 readonly fullscreenAvailable=document.fullscreenEnabled;
 readonly fullscreenError=signal(false);
 private timeout:ReturnType<typeof setTimeout>|undefined;
 launch():void{
  if(this.state()==='loading'||this.state()==='ready')return;
  this.state.set('loading');this.open.set(true);
  this.timeout=setTimeout(()=>this.failed(),30000);
 }
 loaded(frame:HTMLIFrameElement):void{
  if(this.state()!=='loading')return;
  try{
   if(!frame.contentDocument?.getElementById('start-screen')){this.failed();return;}
  }catch{this.failed();return;}
  clearTimeout(this.timeout);this.state.set('ready');
  frame.scrollIntoView({block:'start',behavior:'instant'});
  frame.focus({preventScroll:true});
 }
 failed():void{
  clearTimeout(this.timeout);this.open.set(false);this.state.set('error');
 }
 async toggleFullscreen(shell:HTMLElement):Promise<void>{
  this.fullscreenError.set(false);
  try{
   if(document.fullscreenElement)await document.exitFullscreen();
   else await shell.requestFullscreen();
  }catch{this.fullscreenError.set(true);}
 }
 @HostListener('document:fullscreenchange')
 onFullscreenChange():void{this.fullscreen.set(document.fullscreenElement!==null);}
 ngOnDestroy():void{clearTimeout(this.timeout);}
}
