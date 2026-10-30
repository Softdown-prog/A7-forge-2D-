/** Magnify the existing framebuffer; coordinates remain in native Canvas units. */
export function installGameViewport(canvas:HTMLCanvasElement):void{
 const viewport=document.querySelector<HTMLElement>("#scene-viewport"),stage=canvas.closest<HTMLElement>(".stage");if(!viewport||!stage)return;
 let zoom=matchMedia("(max-width:700px)").matches?1.6:1;
 let sized=false;
 const label=document.querySelector<HTMLOutputElement>("#scene-zoom"),full=document.querySelector<HTMLButtonElement>("#scene-fullscreen");
 const update=(center=true)=>{
  if(!viewport.clientWidth)return;
  const ratio=sized?(viewport.scrollLeft+viewport.clientWidth/2)/Math.max(1,canvas.offsetWidth):.5;sized=true;
  canvas.style.width=Math.round(viewport.clientWidth*zoom)+"px";
  viewport.style.height=matchMedia("(max-width:700px)").matches?Math.min(innerHeight*.58,canvas.offsetHeight)+"px":"";
  if(center)viewport.scrollLeft=Math.max(0,ratio*canvas.offsetWidth-viewport.clientWidth/2);
  if(label)label.value=Math.round(zoom*100)+"%";
 };
 document.getElementById("scene-zoom-in")?.addEventListener("click",()=>{zoom=Math.min(3,Math.round((zoom+.2)*10)/10);update();});
 document.getElementById("scene-zoom-out")?.addEventListener("click",()=>{zoom=Math.max(.6,Math.round((zoom-.2)*10)/10);update();});
 document.getElementById("scene-fit")?.addEventListener("click",()=>{zoom=Math.min(1,viewport.clientHeight*1000/(viewport.clientWidth*610));update(false);viewport.scrollTo({left:0,top:0});});
 if(full){full.hidden=!document.fullscreenEnabled;full.addEventListener("click",async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await stage.requestFullscreen();}catch{full.textContent="Tela cheia indisponível";}});}
 let resizePending=false;
 new ResizeObserver(()=>{
  if(resizePending)return;resizePending=true;
  requestAnimationFrame(()=>{resizePending=false;update();});
 }).observe(viewport);
 // Scrolling the map must never turn a swipe into a purchase or selection.
 let start:{x:number;y:number;left:number;top:number}|null=null,moved=false;
 viewport.addEventListener("pointerdown",e=>{start={x:e.clientX,y:e.clientY,left:viewport.scrollLeft,top:viewport.scrollTop};moved=false;},{capture:true});
 viewport.addEventListener("pointermove",e=>{if(start&&Math.hypot(e.clientX-start.x,e.clientY-start.y)>8)moved=true;},{capture:true});
 viewport.addEventListener("scroll",()=>{if(start&&(Math.abs(viewport.scrollLeft-start.left)>3||Math.abs(viewport.scrollTop-start.top)>3))moved=true;});
 viewport.addEventListener("click",e=>{if(moved){e.preventDefault();e.stopImmediatePropagation();}start=null;},{capture:true});
 requestAnimationFrame(()=>{update(false);viewport.scrollLeft=(canvas.offsetWidth-viewport.clientWidth)/2;});
}
