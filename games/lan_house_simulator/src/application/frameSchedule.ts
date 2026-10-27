/** Time and repaint gates, without browser APIs or simulation state. */
export interface SceneFlags{
 playing:boolean;accountOpen:boolean;visible:boolean;hidden:boolean;
 adminOpen:boolean;shopOpen:boolean;noticesOpen:boolean;coarse:boolean;
}
export interface MenuFlags{
 playing:boolean;accountOpen:boolean;hasRenderer:boolean;
 previewAvailable:boolean;hidden:boolean;reduceMotion:boolean;
}
export interface HudFlags{
 playing:boolean;accountOpen:boolean;lastScroll:number;
 pointerHeld:boolean;lastInput:number;
}
export function createFrameSchedule(){
 let lastFrame=0,elapsed=0,lastScene=0,lastMenu=0,lastUi=0;
 return {
  begin(timestamp:number){
   if(lastFrame===0)lastFrame=timestamp;
   const dt=Math.max(0,Math.min(0.08,(timestamp-lastFrame)/1000));
   lastFrame=timestamp;elapsed+=dt;
   return {dt,elapsed};
  },
  scene(timestamp:number,flags:SceneFlags):boolean{
   const interval=flags.coarse?1000/30:0;
   const ready=flags.playing&&!flags.accountOpen&&flags.visible&&!flags.hidden&&
    !flags.adminOpen&&!flags.shopOpen&&!flags.noticesOpen&&timestamp-lastScene>=interval;
   if(ready)lastScene=interval?timestamp-((timestamp-lastScene)%interval):timestamp;
   return ready;
  },
  menu(timestamp:number,flags:MenuFlags):boolean{
   return !flags.playing&&!flags.accountOpen&&flags.hasRenderer&&
    flags.previewAvailable&&!flags.hidden&&!flags.reduceMotion&&timestamp-lastMenu>90;
  },
  menuPainted(timestamp:number){lastMenu=timestamp;},
  hud(timestamp:number,flags:HudFlags):boolean{
   const ready=flags.playing&&!flags.accountOpen&&timestamp-lastUi>450&&
    timestamp-flags.lastScroll>160&&!flags.pointerHeld&&timestamp-flags.lastInput>120;
   if(ready)lastUi=timestamp;
   return ready;
  }
 };
}
