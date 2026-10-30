/** Isolate optional menu Canvas errors from navigation and gameplay.
 * The caller controls timing and supplies the renderer, avoiding sim imports here.
 */
export interface MenuPreviewPainter {
 available():boolean;
 paintInitial():void;
 paintFrame(elapsed:number,painted:()=>void):void;
}
export function createMenuPreviewPainter(draw:(elapsed:number)=>void):MenuPreviewPainter {
 let working=true;
 function paint(elapsed:number,painted?:()=>void):void {
  if(!working)return;
  try {
   draw(elapsed);
   painted?.();
  }catch {
   // Missing or failing menu art is not allowed to block the game.
   working=false;
  }
 }
 return {
  available:()=>working,
  paintInitial:()=>paint(0),
  paintFrame:(elapsed,painted)=>paint(elapsed,painted)
 };
}
