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
const art={};for(const [key,path] of Object.entries({hall:"assets/scene/castle_hall.svg",platform:"assets/scene/platform_stone.svg",door:"assets/scene/exit_door.svg",slime:"assets/enemies/slime.svg",bat:"assets/enemies/bat.svg",guardian:"assets/enemies/guardian.svg"})){const im=new Image();im.src=path;art[key]=im;}
function drawArt(key,x,y,w,h){const im=art[key];if(!im?.complete||!im.naturalWidth)return false;ctx.drawImage(im,Math.round(x),Math.round(y),w,h);return true;}
let player,enemies,bolts,particles,won,lost,tick,damageAt,lastShot,gameTime;
const platforms=[{x:0,y:GROUND,w:800,h:60},{x:180,y:307,w:145,h:15},{x:460,y:276,w:135,h:15}];
function reset(){player={x:48,y:GROUND-42,w:27,h:42,vx:0,vy:0,onGround:false,face:1,hp:5,attackUntil:0};
 enemies=[{type:"slime",x:275,y:GROUND-22,w:32,h:22,hp:5,maxHp:5,speed:35,hitAt:-10},{type:"bat",x:482,y:187,w:30,h:22,hp:3,maxHp:3,speed:55,hitAt:-10},{type:"guardian",x:650,y:GROUND-45,w:34,h:45,hp:8,maxHp:8,speed:24,hitAt:-10}];
 bolts=[];particles=[];won=false;lost=false;tick=0;damageAt=-10;lastShot=-10;gameTime=0;status.textContent="Derrote os inimigos e alcance a porta!";}
function input(e,down){const k=e.code;if(["ArrowLeft","ArrowRight","ArrowUp","Space","KeyA","KeyD","KeyW","KeyJ","Enter","KeyR"].includes(k))e.preventDefault();if(down)keys.add(k);else keys.delete(k);if(down&&k==="KeyR")reset();}
document.addEventListener("keydown",e=>input(e,true));document.addEventListener("keyup",e=>input(e,false));window.addEventListener("blur",()=>keys.clear());
document.querySelectorAll("[data-key]").forEach(el=>{const k=el.dataset.key;for(const event of ["pointerdown","pointerup","pointercancel","pointerleave"])el.addEventListener(event,e=>{e.preventDefault();if(event==="pointerdown"){keys.add(k);el.setPointerCapture?.(e.pointerId)}else keys.delete(k);});});
function overlap(a,b){return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;}
function rect(x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));}
function update(dt){
 gameTime+=dt;tick++;if(won||lost)return;
 let left=keys.has("KeyA")||keys.has("ArrowLeft"),right=keys.has("KeyD")||keys.has("ArrowRight");
 player.vx=(Number(right)-Number(left))*170;if(player.vx)player.face=Math.sign(player.vx);
 if((keys.has("KeyW")||keys.has("Space")||keys.has("ArrowUp"))&&player.onGround){player.vy=-330;player.onGround=false;}
 if((keys.has("Enter")||keys.has("KeyJ"))&&gameTime-lastShot>.34){lastShot=gameTime;player.attackUntil=gameTime+.40;bolts.push({x:player.x+player.w/2+player.face*19,y:player.y+17,w:12,h:10,vx:player.face*330,life:1.7});}
 let oldY=player.y;player.x=Math.max(0,Math.min(W-player.w,player.x+player.vx*dt));player.vy=Math.min(560,player.vy+850*dt);player.y+=player.vy*dt;player.onGround=false;
 for(const p of platforms)if(player.x+player.w>p.x&&player.x<p.x+p.w&&oldY+player.h<=p.y+8&&player.y+player.h>=p.y&&player.vy>=0){player.y=p.y-player.h;player.vy=0;player.onGround=true;}
 if(player.y>H){player.hp=0;}
 for(const e of enemies){if(e.hp<=0)continue;
 if(e.type==="bat"){e.y=185+Math.sin(gameTime*2+e.x/120)*30; e.x+=Math.sign(player.x-e.x)*e.speed*dt;}
 else {e.x+=Math.sign(player.x-e.x)*e.speed*dt;}
 if(overlap(player,e)&&gameTime-damageAt>1){damageAt=gameTime;player.hp--;player.vy=-140;player.x=Math.max(0,Math.min(W-player.w,player.x+(player.x<e.x?-24:24)));}
 }
 for(const b of bolts){b.x+=b.vx*dt;b.life-=dt;for(const e of enemies){if(e.hp>0&&overlap(b,e)){e.hp--;b.life=0;for(let i=0;i<6;i++)particles.push({x:b.x,y:b.y,vx:(Math.random()-.5)*90,vy:(Math.random()-.5)*90,t:.22});break;}}}
 bolts=bolts.filter(b=>b.life>0&&b.x>-30&&b.x<W+30);
 for(const p of particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.t-=dt;}particles=particles.filter(p=>p.t>0);
 if(player.hp<=0){lost=true;status.textContent="O mago caiu! Pressione R para tentar novamente.";}
 if(player.x>745&&enemies.every(e=>e.hp<=0)){won=true;status.textContent="Castelo conquistado! Primeira sala concluída. Pressione R para jogar novamente.";}
}
function sprite(d,pose,x,y,w=32,h=48){const im=images[d+"_"+pose];if(im?.complete&&im.naturalWidth){ctx.drawImage(im,Math.round(x),Math.round(y),w,h);return true;}return false;}
function background(){
 if(!drawArt("hall",0,0,W,H)){rect(0,0,W,H,"#29283d");rect(0,GROUND,W,H-GROUND,"#554c61");}
 for(const p of platforms.slice(1)){
  if(!drawArt("platform",p.x,p.y,p.w,p.h))rect(p.x,p.y,p.w,p.h,"#94849b");
 }
 if(!drawArt("door",748,300,46,90))rect(752,306,36,84,"#70495c");
}

function paint(){
 background();for(const e of enemies){if(e.hp<=0)continue;
 const flutter=e.type==="bat"?(tick%16<8?-4:3):0;
 if(!drawArt(e.type,e.x+(e.type==="bat"?-7:0),e.y+flutter,e.type==="bat"?44:e.w,e.type==="bat"?32:e.h)){
  rect(e.x,e.y,e.w,e.h,e.type==="slime"?"#5ab892":e.type==="bat"?"#7664ad":"#888697");
 }
 rect(e.x,e.y-12,e.w,4,"#34283e");rect(e.x,e.y-12,e.w*e.hp/e.maxHp,4,"#d75e77");
 }
 for(const b of bolts){rect(b.x-4,b.y-4,18,18,"#376baa");rect(b.x,b.y,12,10,"#56c9ff");rect(b.x+3,b.y+2,6,6,"#e0faff");}
 for(const p of particles)rect(p.x,p.y,4,4,"#b7ebff");
 if(gameTime-damageAt>.12||tick%6<3){
 const pose=gameTime<player.attackUntil?"attack_"+Math.min(5,Math.floor((player.attackUntil-gameTime)/.067)):Math.abs(player.vx)>0&&player.onGround?"walk_"+(Math.floor(gameTime/.15)%4):"idle";
 const d=player.face===1?"east":"west";
 if(!sprite(d,pose,player.x-3,player.y-6)){rect(player.x+4,player.y+3,20,37,"#5b4aa7");rect(player.x+2,player.y,24,14,"#403877");rect(player.x+11,player.y+14,8,8,"#e6ae86");rect(player.x+(player.face>0?24:-2),player.y+4,3,32,"#97744b");}
 }
 for(let i=0;i<5;i++){ctx.font="25px sans-serif";ctx.fillStyle=i<player.hp?"#ff607c":"#555168";ctx.fillText("♥",14+i*30,35);}
 ctx.font="13px monospace";ctx.fillStyle="#f3dfb3";ctx.fillText("ANDAR 1 / 5    •    INIMIGOS: "+enemies.filter(e=>e.hp>0).length,540,27);
 if(won||lost){rect(145,155,510,115,"#171325");ctx.textAlign="center";ctx.font="bold 24px sans-serif";ctx.fillStyle="#f4d38a";ctx.fillText(won?"ANDAR CONCLUÍDO!":"FIM DE JOGO",400,202);ctx.font="15px sans-serif";ctx.fillText("Pressione R para reiniciar",400,239);ctx.textAlign="left";}
}
let last=0;function frame(now){if(!last)last=now;const dt=Math.min((now-last)/1000,.033);last=now;update(dt);paint();requestAnimationFrame(frame);}reset();requestAnimationFrame(frame);
