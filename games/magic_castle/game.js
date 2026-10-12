"use strict";
// Magic Castle MVP. No framework, network services or runtime Forge dependency.
const canvas=document.getElementById("game"),ctx=canvas.getContext("2d"),status=document.getElementById("status");
ctx.imageSmoothingEnabled=false;
const W=800,H=450,GROUND=390,keys=new Set(),images={};
const dirs={left:"west",right:"east"};
const spriteRoot="assets/wizard/";
for(const d of ["east","west"])for(const pose of ["idle","walk_0","walk_1","walk_2","walk_3","attack_0","attack_1","attack_2","attack_3","attack_4","attack_5"]){
 const name=d+"_"+pose,im=new Image();im.src=spriteRoot+"pixel_wizard_mini_01_"+name+".png";images[name]=im;
}
const art={};for(const [key,path] of Object.entries({hall:"assets/scene/castle_hall.svg",tower:"assets/scene/tower_gallery.svg",platform:"assets/scene/platform_stone.svg",door:"assets/scene/exit_door.svg",slime:"assets/enemies/slime.svg",bat:"assets/enemies/bat.svg",guardian:"assets/enemies/guardian.svg"})){const im=new Image();im.src=path;art[key]=im;}
function drawArt(key,x,y,w,h){const im=art[key];if(!im?.complete||!im.naturalWidth)return false;ctx.drawImage(im,Math.round(x),Math.round(y),w,h);return true;}
let player,enemies,bolts,particles,won,lost,tick,damageAt,lastShot,gameTime,stageIndex,healItem,transition;
const reducedMotion=window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches??false;
function burst(x,y,color,count=8){
 if(reducedMotion)return;
 for(let i=0;i<count;i++){const angle=i*6.28318530718/count;
  const speed=35+(i%3)*23;particles.push({x,y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed-20,t:.35,color,size:2+(i%2)});
 }
}

const platforms=[{x:0,y:GROUND,w:800,h:60}];
function loadStage(index){
 stageIndex=index;
 const room=MagicStages.stages[index];platforms.splice(1,platforms.length-1,...room.platforms);
 enemies=MagicStages.makeEnemies(room);healItem=room.heal?{...room.heal,taken:false}:null;
 bolts=[];particles=[];player.x=48;player.y=GROUND-player.h;player.vx=0;player.vy=0;player.onGround=true;player.face=1;
 damageAt=gameTime;lastShot=gameTime-.5;
 status.textContent="Andar "+(stageIndex+1)+": derrote os monstros e vá até a porta.";
}
function reset(){
 player={x:48,y:GROUND-42,w:27,h:42,vx:0,vy:0,onGround:true,face:1,hp:5,maxHp:5,attackUntil:0};
 won=false;lost=false;tick=0;damageAt=-10;lastShot=-10;gameTime=0;transition=null;
 loadStage(0);
}
// Multi-touch reference counting: releasing one finger never cancels another.
const touchPointers=new Map();
function touchActive(key){for(const value of touchPointers.values())if(value===key)return true;return false;}
function input(e,down){
 const k=e.code;
 if(["ArrowLeft","ArrowRight","ArrowUp","Space","KeyA","KeyD","KeyW","KeyJ","Enter","KeyR","ShiftLeft","ShiftRight"].includes(k))e.preventDefault();
 if(down)keys.add(k);else if(!touchActive(k))keys.delete(k);
 if(down&&k==="KeyR"&&!e.repeat)reset();
 if(down&&!e.repeat&&["ArrowUp","ShiftLeft","ShiftRight"].includes(k)&&!transition&&!won&&!lost&&MagicStages.mayEnter(player,enemies)){enterExit();}
}
document.addEventListener("keydown",e=>input(e,true));
document.addEventListener("keyup",e=>input(e,false));
function releaseAll(){keys.clear();touchPointers.clear();document.querySelectorAll(".touch button").forEach(b=>b.classList.remove("pressed"));}
window.addEventListener("blur",releaseAll);
document.addEventListener("visibilitychange",()=>{if(document.hidden)releaseAll();});
document.querySelectorAll(".touch [data-key]").forEach(el=>{
 const key=el.dataset.key;
 el.addEventListener("pointerdown",e=>{
  e.preventDefault();if(touchPointers.has(e.pointerId))return;
  touchPointers.set(e.pointerId,key);keys.add(key);el.classList.add("pressed");
  if(key==="ShiftLeft"&&!transition&&!won&&!lost&&MagicStages.mayEnter(player,enemies))enterExit();
  try{el.setPointerCapture(e.pointerId);}catch(_){}
 });
 const release=e=>{
  if(touchPointers.get(e.pointerId)!==key)return;
  e.preventDefault();touchPointers.delete(e.pointerId);
  if(!touchActive(key))keys.delete(key);
  el.classList.toggle("pressed",touchActive(key));
 };
 for(const name of ["pointerup","pointercancel","lostpointercapture"])el.addEventListener(name,release);
});
document.getElementById("restart").addEventListener("click",()=>{releaseAll();reset();});
function overlap(a,b){return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;}
function rect(x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));}
function enterExit(){
 if(!MagicStages.mayEnter(player,enemies))return false;
 transition={time:0,duration:.90,next:stageIndex+1,switched:false};
 status.textContent="Subindo para o próximo andar...";
 return true;
}
function update(dt){
 gameTime+=dt;tick++;
 if(transition){
  transition.time+=dt;
  if(!transition.switched&&transition.time>=transition.duration/2){
   transition.switched=true;
   if(transition.next>=MagicStages.stages.length){won=true;status.textContent="Castelo conquistado! Pressione R para reiniciar.";}
   else loadStage(transition.next);
  }
  if(transition.time>=transition.duration)transition=null;
  return;
 }
 if(won||lost)return;
 let left=keys.has("KeyA")||keys.has("ArrowLeft"),right=keys.has("KeyD")||keys.has("ArrowRight");
 player.vx=(Number(right)-Number(left))*170;if(player.vx)player.face=Math.sign(player.vx);
 if((keys.has("KeyW")||keys.has("Space")||(keys.has("ArrowUp")&&!MagicStages.mayEnter(player,enemies)))&&player.onGround){player.vy=-330;player.onGround=false;}
 if((keys.has("Enter")||keys.has("KeyJ"))&&gameTime-lastShot>.34){lastShot=gameTime;player.attackUntil=gameTime+.40;bolts.push({x:player.x+player.w/2+player.face*19,y:player.y+17,w:12,h:10,vx:player.face*330,vy:0,damage:1,life:1.7});}
 let oldY=player.y;player.x=Math.max(0,Math.min(W-player.w,player.x+player.vx*dt));player.vy=Math.min(560,player.vy+850*dt);player.y+=player.vy*dt;player.onGround=false;
 for(const p of platforms)if(player.x+player.w>p.x&&player.x<p.x+p.w&&oldY+player.h<=p.y+8&&player.y+player.h>=p.y&&player.vy>=0){player.y=p.y-player.h;player.vy=0;player.onGround=true;}
 if(player.y>H){player.hp=0;}
 for(const e of enemies){
 MagicCombat.advanceReaction(e,dt,0,W);
 if(e.hp<=0)continue;
 if(e.stun>0)continue;
 MagicEnemyAI.update(e,player,dt,gameTime,{left:0,right:W,ground:GROUND});
 if(overlap(player,e)&&gameTime-damageAt>1){
 damageAt=gameTime;player.hp--;player.vy=-140;
 player.x=Math.max(0,Math.min(W-player.w,player.x+(player.x<e.x?-24:24)));
 burst(player.x+player.w/2,player.y+18,"#f77c9d",10);
}
 }
 for(const b of bolts){
  // Use continuous collision to prevent tunnelling at high speed / low FPS.
  const hit=MagicCombat.stepProjectile(b,dt,enemies,platforms.slice(1));
  if(hit?.kind==="enemy"){
   hit.target.flash=.15;
   burst(b.x+b.w/2,b.y+b.h/2,hit.target.hp===0?"#f8db83":"#86e5ff",12);
  }else if(hit?.kind==="solid"){
   burst(b.x+b.w/2,b.y+b.h/2,"#a4a1c5",5);
  }
 }
 bolts=bolts.filter(b=>b.life>0&&b.x>-30&&b.x<W+30);
 for(const e of enemies)e.flash=Math.max(0,e.flash-dt);
 for(const p of particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=110*dt;p.t-=dt;}
 particles=particles.filter(p=>p.t>0);
 if(MagicStages.heal(player,healItem)){burst(player.x+10,player.y+12,"#92ffc5",14);status.textContent="Poção encontrada! Vida recuperada.";}
 if(player.hp<=0){lost=true;status.textContent="O mago caiu! Reinicie para tentar novamente.";}
 if(MagicStages.mayEnter(player,enemies))status.textContent="Porta liberada! Aperte ↑ ou Shift para subir.";
}
function sprite(d,pose,x,y,w=32,h=48){const im=images[d+"_"+pose];if(im?.complete&&im.naturalWidth){ctx.drawImage(im,Math.round(x),Math.round(y),w,h);return true;}return false;}
function drawTorch(x){
 // Canvas-only animated flames layered over the static stone hall; no new asset dependency.
 const f=reducedMotion?0:Math.sin(gameTime*10+x);
 ctx.save();ctx.globalAlpha=.10+(.03*Math.abs(f));rect(x-18,113,40,50,"#ec994e");ctx.restore();
 rect(x-3,151,7,16,"#70503f");
 rect(x-7,137+Math.round(f*2),15,19,"#d67838");
 rect(x-4,131+Math.round(f*3),9,19,"#ffb84d");
 rect(x-2,128+Math.round(f*4),5,13,"#fff0ab");
}
function background(){
 if(!drawArt(MagicStages.stages[stageIndex].scene,0,0,W,H)){rect(0,0,W,H,"#29283d");rect(0,GROUND,W,H-GROUND,"#554c61");}
 drawTorch(119);drawTorch(634);
 for(const p of platforms.slice(1)){
  if(!drawArt("platform",p.x,p.y,p.w,p.h))rect(p.x,p.y,p.w,p.h,"#94849b");
 }
 if(!drawArt("door",748,300,46,90))rect(752,306,36,84,"#70495c");
}

function paint(){
 background();
 for(const e of enemies){
 if(e.hp<=0){
  if(e.deathTime>0){
   const progress=1-e.deathTime/.42;
   ctx.save();ctx.globalAlpha=Math.max(0,1-progress);
   const width=e.type==="bat"?44:e.w;
   const height=e.type==="bat"?32:e.h;
   drawArt(e.type,e.x,e.y+progress*16,width,Math.max(2,height*(1-progress*.8)));
   ctx.restore();
  }
  continue;
 }
 const animation=reducedMotion?0:Math.sin(gameTime*(e.type==="bat"?17:e.type==="slime"?8:5)+e.x*.03);
 const flutter=e.type==="bat"?Math.round(animation*4):0;
 const squash=e.type==="slime"?Math.round(Math.abs(animation)*3):0;
 const stride=e.type==="guardian"?Math.round(animation*2):0;
 const dx=e.type==="bat"?-7:stride;
 const dw=e.type==="bat"?44:e.w;
 const dh=e.type==="bat"?32:e.h-squash;
 const dy=e.y+flutter+squash;
 if(!drawArt(e.type,e.x+dx,dy,dw,dh)){
  rect(e.x+dx,dy,dw,dh,e.type==="slime"?"#5ab892":e.type==="bat"?"#7664ad":"#888697");
 }
 if(e.flash>0){ctx.save();ctx.globalAlpha=Math.min(.65,e.flash*4);rect(e.x+dx,dy,dw,dh,"#ffffff");ctx.restore();}

 rect(e.x,e.y-12,e.w,4,"#34283e");rect(e.x,e.y-12,e.w*e.hp/e.maxHp,4,"#d75e77");
 }
 for(const b of bolts){
  const tail=b.vx>0?-1:1;
  rect(b.x+tail*10,b.y+4,10,3,"#427bd2");
  rect(b.x-4,b.y-4,18,18,"#376baa");
  rect(b.x,b.y,12,10,"#56c9ff");rect(b.x+3,b.y+2,6,6,"#e0faff");
 }
 for(const p of particles)rect(p.x,p.y,p.size,p.size,p.color);

 if(gameTime-damageAt>.12||tick%6<3){
 const pose=gameTime<player.attackUntil?"attack_"+Math.min(5,Math.floor((.40-(player.attackUntil-gameTime))/.067)):Math.abs(player.vx)>0&&player.onGround?"walk_"+(Math.floor(gameTime/.15)%4):"idle";
 const d=player.face===1?"east":"west";
 if(!sprite(d,pose,player.x-3,player.y-6)){rect(player.x+4,player.y+3,20,37,"#5b4aa7");rect(player.x+2,player.y,24,14,"#403877");rect(player.x+11,player.y+14,8,8,"#e6ae86");rect(player.x+(player.face>0?24:-2),player.y+4,3,32,"#97744b");}
 }
 if(healItem&&!healItem.taken){rect(healItem.x,healItem.y+5,healItem.w,healItem.h-5,"#386b60");rect(healItem.x+4,healItem.y+7,12,12,"#71e7a6");rect(healItem.x+7,healItem.y+2,6,6,"#e7f3ca");}
 rect(12,12,168,21,"#171925");rect(15,15,162,15,"#514354");
 rect(15,15,162*player.hp/player.maxHp,15,player.hp<=2?"#df686a":"#66c99b");
 ctx.font="bold 11px monospace";ctx.fillStyle="#ffffff";ctx.fillText("VIDA "+player.hp+"/"+player.maxHp,73,27);
 ctx.font="13px monospace";ctx.fillStyle="#f3dfb3";
 ctx.fillText("ANDAR "+(stageIndex+1)+" / "+MagicStages.stages.length+"  •  INIMIGOS: "+enemies.filter(e=>e.hp>0).length,526,27);
 if(MagicStages.mayEnter(player,enemies)){ctx.textAlign="center";ctx.font="bold 13px sans-serif";ctx.fillStyle="#ffe1a3";ctx.fillText("↑ / SHIFT — ENTRAR",765,284);ctx.textAlign="left";}
 if(transition)drawCubeTransition();
 if(won||lost){rect(145,155,510,115,"#171325");ctx.textAlign="center";ctx.font="bold 24px sans-serif";ctx.fillStyle="#f4d38a";ctx.fillText(won?"ANDAR CONCLUÍDO!":"FIM DE JOGO",400,202);ctx.font="15px sans-serif";ctx.fillText("Pressione R para reiniciar",400,239);ctx.textAlign="left";}
}
function drawCubeTransition(){
 // Original 20px pixel-cube wipe: advances from left to right, then reveals the next room.
 const p=Math.min(1,transition.time/transition.duration);
 const cover=p<=.5?p*2:(1-p)*2;
 const cols=40,rows=23,size=20;
 for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
  const threshold=(x+(y%3)*.55)/cols;
  if(threshold>cover)continue;
  const shade=(x+y)%4;
  rect(x*size,y*size,size,size,["#242038","#353050","#4b3b60","#635078"][shade]);
  rect(x*size,y*size,size,3,"#807094");
  rect(x*size+size-3,y*size,3,size,"#1d1b34");
 }
 if(p>.33&&p<.68){ctx.textAlign="center";ctx.font="bold 28px sans-serif";ctx.fillStyle="#f5d59d";ctx.fillText("ANDAR "+(transition.next+1),400,218);ctx.textAlign="left";}
}
let last=0;function frame(now){if(!last)last=now;const dt=Math.min((now-last)/1000,.033);last=now;update(dt);paint();requestAnimationFrame(frame);}reset();requestAnimationFrame(frame);
