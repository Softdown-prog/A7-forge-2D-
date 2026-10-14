import {eras} from "./eras.mjs";
import {deleteLocalData} from "./data-controls.mjs";
const menu=document.querySelector("#site-nav"),toggle=document.querySelector("#menu-toggle");
if(menu&&toggle){
 document.documentElement.classList.add("js-enabled");
 const close=()=>{menu.classList.remove("is-open");toggle.setAttribute("aria-expanded","false");};
 toggle.addEventListener("click",()=>{const open=toggle.getAttribute("aria-expanded")!=="true";menu.classList.toggle("is-open",open);toggle.setAttribute("aria-expanded",String(open));});
 document.addEventListener("keydown",e=>{if(e.key==="Escape"&&toggle.getAttribute("aria-expanded")==="true"){close();toggle.focus();}});
 menu.addEventListener("click",e=>{if(e.target.closest("a"))close();});
 matchMedia("(min-width:801px)").addEventListener("change",close);
}
const motion=document.querySelector("#motion-toggle"),preference=matchMedia("(prefers-reduced-motion: reduce)");
let paused=preference.matches;
const updateMotion=()=>{document.body.classList.toggle("reduce-motion",paused);motion?.setAttribute("aria-pressed",String(paused));if(motion)motion.textContent=paused?"Animações pausadas":"Pausar animações";};
motion?.addEventListener("click",()=>{paused=!paused;updateMotion();});preference.addEventListener("change",e=>{paused=e.matches;updateMotion();});updateMotion();
if("IntersectionObserver" in window&&!paused){
 const observer=new IntersectionObserver(entries=>{for(const e of entries)if(e.isIntersecting){e.target.classList.add("is-visible");observer.unobserve(e.target);}},{threshold:.08});
 for(const el of document.querySelectorAll(".reveal")){el.classList.add("will-reveal");observer.observe(el);}
}
const eraButtons=[...document.querySelectorAll("[data-era]")];
for(const button of eraButtons)button.addEventListener("click",()=>{
 const era=eras[Number(button.dataset.era)];if(!era)return;
 for(const b of eraButtons)b.setAttribute("aria-pressed",String(b===button));
 for(const [id,value] of [["era-year",era.year],["era-title",era.title],["era-copy",era.body],["era-spec",era.spec]]){const el=document.getElementById(id);if(el)el.textContent=value;}
 const image=document.querySelector("#era-image");if(image){image.src="/assets/pc-"+era.model+".svg";image.alt="Ilustração de computador da época "+era.year;}
});
const launch=document.querySelector("#launch-game"),frame=document.querySelector("#game-frame"),shell=document.querySelector("#game-shell"),fullscreen=document.querySelector("#fullscreen"),status=document.querySelector("#game-status");
if(launch&&frame&&shell){
 launch.addEventListener("click",()=>{
  launch.disabled=true;launch.textContent="Abrindo o salão…";
  frame.addEventListener("load",()=>{
   try{if(!frame.contentDocument?.querySelector("#start-screen"))throw Error("Menu indisponível");}catch{launch.disabled=false;launch.textContent="Tentar abrir novamente";status.textContent="O jogo não carregou. Tente novamente ou abra em outra aba.";return;}
   document.querySelector("#game-launch").hidden=true;frame.hidden=false;if(fullscreen)fullscreen.hidden=!document.fullscreenEnabled;status.textContent="Jogo aberto. Use Menu para pausar e salvar em arquivo antes de sair.";frame.focus();},{once:true});
  frame.src=frame.dataset.src;
 });
 fullscreen?.addEventListener("click",async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await shell.requestFullscreen();}catch{status.textContent="Tela cheia indisponível. Você pode abrir o jogo em outra aba.";}});
 document.addEventListener("fullscreenchange",()=>{if(fullscreen)fullscreen.textContent=document.fullscreenElement?"Sair da tela cheia":"Tela cheia";});
}
const dialog=document.querySelector("#delete-dialog"),dataStatus=document.querySelector("#data-status");let deleting=null;
for(const button of document.querySelectorAll("[data-delete]"))button.addEventListener("click",()=>{
 deleting=button.dataset.delete;
 document.querySelector("#delete-title").textContent=deleting==="save"?"Apagar a partida deste navegador?":"Redefinir o som deste navegador?";
 document.querySelector("#delete-copy").textContent=deleting==="save"?"Feche o jogo em todas as abas. A partida local será removida; seus arquivos de backup serão preservados. Esta ação não pode ser desfeita.":"A preferência local de som será removida. A partida não será alterada.";
 dialog.returnValue="cancel";dialog.showModal();
});
dialog?.addEventListener("close",()=>{if(dialog.returnValue!=="confirm"||!deleting)return;try{deleteLocalData(localStorage,deleting);dataStatus.textContent=deleting==="save"?"Partida local apagada. Seus arquivos baixados continuam preservados.":"Preferência de som redefinida.";}catch{dataStatus.textContent="O navegador não permitiu alterar o armazenamento. Use as configurações de dados deste site.";}deleting=null;});

// Manter a imagem antiga só como fallback: o desenho exibido vem da mesma
// função de renderização procedural utilizada pelo jogo.
const salonPreviews=[...document.querySelectorAll("img[data-scene-preview]")];
if(salonPreviews.length){
 const drawCurrentSalon=async img=>{
  try{
   const [{SceneRenderer},{createGame,pcPosition},{computerSeat}]=await Promise.all([
    import("/game/js/render/scene.js"),import("/game/js/sim/engine.js"),import("/game/js/sim/route.js")
   ]);
   if(!img.isConnected)return;
   const preview=createGame(98);
   preview.customers=[0,1].map(i=>{
    const seat=computerSeat(pcPosition(i,preview));
    return {id:i+1,x:seat.x,y:seat.y,target:seat,route:[],stage:"using",
     costume:"regular",pcIndex:i,facing:"north",usedMinutes:0,waitingMinutes:0,offlineWait:0,happy:true};
   });
   const canvas=document.createElement("canvas");
   canvas.width=1000;canvas.height=610;canvas.className=img.className;
   canvas.setAttribute("role","img");
   canvas.setAttribute("aria-label",img.alt||"Salão do Lan House Simulator");
   const ctx=canvas.getContext("2d");
   if(!ctx)return;
   new SceneRenderer(ctx).draw(preview,0);
   if(img.isConnected)img.replaceWith(canvas);
  }catch{
   // Se o Canvas não estiver disponível, preservar a imagem de apresentação.
  }
 };
 if("IntersectionObserver" in window){
  const observer=new IntersectionObserver(entries=>{
   for(const entry of entries)if(entry.isIntersecting){
    observer.unobserve(entry.target);void drawCurrentSalon(entry.target);
   }
  },{rootMargin:"120px"});
  salonPreviews.forEach(img=>observer.observe(img));
 }else salonPreviews.forEach(img=>{void drawCurrentSalon(img);});
}
