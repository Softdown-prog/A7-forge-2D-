"use strict";
// Standalone deterministic enemy behavior, independently testable in Node.
(function(root,factory){const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;root.MagicEnemyAI=api;})(typeof globalThis!=="undefined"?globalThis:this,function(){
 const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
 function update(enemy,player,dt,time,bounds={left:0,right:800,ground:390}){
  if(enemy.hp<=0||enemy.stun>0)return;
  const delta=player.x+player.w/2-(enemy.x+enemy.w/2);
  const distance=Math.abs(delta);
  enemy.facing=delta<0?-1:1;
  if(enemy.type==="bat"){
   // Patrol high, wind up, then dive toward the player's current height.
   enemy.aiClock=(enemy.aiClock||0)+dt;
   enemy.aiState=enemy.aiState||"patrol";
   enemy.homeY??=enemy.y;
   if(enemy.aiState==="patrol"){
    enemy.x+=enemy.facing*enemy.speed*.60*dt;
    enemy.y=enemy.homeY+Math.sin(time*2.8)*18;
    if(distance<215&&enemy.aiClock>1.3){enemy.aiState="windup";enemy.aiClock=0;enemy.diveY=clamp(player.y+6,65,bounds.ground-enemy.h);}
   }else if(enemy.aiState==="windup"){
    if(enemy.aiClock>.3){enemy.aiState="dive";enemy.aiClock=0;}
   }else if(enemy.aiState==="dive"){
    enemy.x+=enemy.facing*enemy.speed*2.2*dt;
    const dy=enemy.diveY-enemy.y;
    enemy.y+=clamp(dy,-190*dt,190*dt);
    if(enemy.aiClock>.75||Math.abs(dy)<7){enemy.aiState="recover";enemy.aiClock=0;}
   }else{
    enemy.y+=clamp(enemy.homeY-enemy.y,-115*dt,115*dt);
    if(enemy.aiClock>1.1&&Math.abs(enemy.homeY-enemy.y)<10){enemy.aiState="patrol";enemy.aiClock=0;}
   }
  }else if(enemy.type==="slime"){
   enemy.aiClock=(enemy.aiClock||0)+dt;
   enemy.aiState=enemy.aiState||"approach";
   if(distance>19&&distance<380)enemy.x+=enemy.facing*enemy.speed*dt;
   enemy.y=bounds.ground-enemy.h;
  }else if(enemy.type==="guardian"){
   enemy.aiState=distance<60?"threaten":distance<330?"approach":"guard";
   if(enemy.aiState==="approach")enemy.x+=enemy.facing*enemy.speed*dt;
   enemy.y=bounds.ground-enemy.h;
  }
  enemy.x=clamp(enemy.x,bounds.left,bounds.right-enemy.w);
  enemy.y=clamp(enemy.y,40,bounds.ground-enemy.h);
 }
 return {update};
});
