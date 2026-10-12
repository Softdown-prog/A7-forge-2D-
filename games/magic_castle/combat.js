"use strict";
// Standalone projectile physics; browser global + CommonJS for Node tests.
(function(root,factory){const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;root.MagicCombat=api;})(typeof globalThis!=="undefined"?globalThis:this,function(){
 function sweep(moving,target,dx,dy){
  // Swept axis-aligned bounding box, normalized time in [0,1].
  const overlap=moving.x<target.x+target.w&&moving.x+moving.w>target.x&&moving.y<target.y+target.h&&moving.y+moving.h>target.y;
  if(overlap)return {t:0,x:moving.x,y:moving.y};
  const axis=(p,size,min,max,delta)=>{
   if(delta===0)return p+size>min&&p<max?[-Infinity,Infinity]:[Infinity,-Infinity];
   const a=(min-(p+size))/delta,b=(max-p)/delta;
   return [Math.min(a,b),Math.max(a,b)];
  };
  const [ex,lx]=axis(moving.x,moving.w,target.x,target.x+target.w,dx);
  const [ey,ly]=axis(moving.y,moving.h,target.y,target.y+target.h,dy);
  const entry=Math.max(ex,ey),exit=Math.min(lx,ly);
  if(entry>exit||exit<0||entry>1||entry<0)return null;
  return {t:entry,x:moving.x+dx*entry,y:moving.y+dy*entry};
 }
 function applyImpact(enemy, direction){
  const resistance=enemy.type==="guardian"?.40:enemy.type==="slime"?.72:1;
  enemy.knockV=Math.sign(direction||1)*110*resistance;
  enemy.stun=enemy.hp>0?.17:0;
  if(enemy.hp<=0)enemy.deathTime=.42;
 }
 function advanceReaction(enemy,dt,minX=0,maxX=800){
  if(enemy.deathTime>0){enemy.deathTime=Math.max(0,enemy.deathTime-dt);return;}
  if(enemy.hp<=0)return;
  enemy.stun=Math.max(0,(enemy.stun||0)-dt);
  if(enemy.knockV){
   enemy.x=Math.max(minX,Math.min(maxX-enemy.w,enemy.x+enemy.knockV*dt));
   enemy.knockV*=Math.max(0,1-12*dt);
   if(Math.abs(enemy.knockV)<2)enemy.knockV=0;
  }
 }
 function stepProjectile(b,dt,enemies,solids=[]){
  if(b.life<=0)return {kind:"expired"};
  const dx=b.vx*dt,dy=(b.vy||0)*dt;
  let first=null;
  for(const e of enemies){
   if(e.hp<=0)continue;
   const hit=sweep(b,e,dx,dy);
   if(hit&&(!first||hit.t<first.t))first={...hit,kind:"enemy",target:e};
  }
  for(const solid of solids){
   const hit=sweep(b,solid,dx,dy);
   if(hit&&(!first||hit.t<first.t))first={...hit,kind:"solid",target:solid};
  }
  if(first){
   b.x=first.x;b.y=first.y;b.life=0;
   if(first.kind==="enemy"){first.target.hp=Math.max(0,first.target.hp-(b.damage||1));applyImpact(first.target,b.vx);}
   return first;
  }
  b.x+=dx;b.y+=dy;b.life-=dt;
  return b.life<=0?{kind:"expired"}:null;
 }
 return {sweep,stepProjectile,applyImpact,advanceReaction};
});
