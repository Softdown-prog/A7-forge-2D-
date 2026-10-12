"use strict";
// Authored room configurations and reusable progression rules. No dependency on Forge runtime.
(function(root,factory){const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;root.MagicStages=api;})(typeof globalThis!=="undefined"?globalThis:this,function(){
 const stages=[
  {name:"Salão de Entrada",scene:"hall",platforms:[{x:180,y:307,w:145,h:15},{x:460,y:276,w:135,h:15}],
   enemies:[{type:"slime",x:275,y:368,w:32,h:22,hp:4,speed:32},{type:"bat",x:485,y:232,w:30,h:22,hp:3,speed:55}],heal:null},
  {name:"Galeria da Torre",scene:"tower",platforms:[{x:145,y:310,w:160,h:15},{x:455,y:301,w:155,h:15}],
   enemies:[{type:"slime",x:340,y:368,w:32,h:22,hp:5,speed:38},{type:"guardian",x:645,y:345,w:34,h:45,hp:7,speed:24}],
   heal:{x:408,y:363,w:20,h:20,amount:2}}
 ];
 const door={x:748,y:300,w:46,h:90};
 const enemiesCleared=enemies=>enemies.every(e=>e.hp<=0);
 const atExit=(player,doorBox=door)=>player.x+player.w>doorBox.x-23&&player.x<doorBox.x+doorBox.w&&player.y+player.h>doorBox.y+24&&player.y<doorBox.y+doorBox.h;
 const mayEnter=(player,enemies,doorBox=door)=>enemiesCleared(enemies)&&atExit(player,doorBox);
 const heal=(player,item)=>{if(!item||item.taken||player.hp>=player.maxHp)return false;
  const collide=player.x<item.x+item.w&&player.x+player.w>item.x&&player.y<item.y+item.h&&player.y+player.h>item.y;
  if(!collide)return false;player.hp=Math.min(player.maxHp,player.hp+item.amount);item.taken=true;return true;};
 const makeEnemies=stage=>stage.enemies.map(e=>({...e,maxHp:e.hp,flash:0,stun:0,knockV:0,deathTime:0,aiClock:0}));
 return {stages,door,enemiesCleared,atExit,mayEnter,heal,makeEnemies};
});
