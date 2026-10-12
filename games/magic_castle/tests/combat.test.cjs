"use strict";
const assert=require("node:assert/strict");
const {test}=require("node:test");
const {sweep,stepProjectile}=require("../combat.js");
test("fast spell cannot tunnel through a slime",()=>{
 const slime={x:100,y:20,w:24,h:24,hp:5};
 const spell={x:0,y:30,w:12,h:10,vx:1000,life:1,damage:1};
 const hit=stepProjectile(spell,.2,[slime]);
 assert.equal(hit.kind,"enemy");assert.equal(slime.hp,4);assert.equal(spell.life,0);
 stepProjectile(spell,.2,[slime]);assert.equal(slime.hp,4);
});
test("hits first enemy only even if several overlap travel path",()=>{
 const a={x:80,y:30,w:20,h:20,hp:3},b={x:130,y:30,w:20,h:20,hp:8};
 const shot={x:0,y:30,w:10,h:10,vx:400,life:2};
 assert.equal(stepProjectile(shot,.5,[b,a]).target,a);
 assert.equal(a.hp,2);assert.equal(b.hp,8);
});
test("misses enemies vertically outside projectile",()=>{
 const e={x:60,y:70,w:25,h:20,hp:3};
 const shot={x:0,y:10,w:12,h:9,vx:500,life:1};
 assert.equal(stepProjectile(shot,.15,[e]),null);assert.equal(e.hp,3);
});
test("enemy hitbox works in reverse direction",()=>{
 const e={x:40,y:10,w:20,h:20,hp:1};
 const shot={x:160,y:18,w:12,h:10,vx:-800,life:1};
 assert.equal(stepProjectile(shot,.2,[e]).kind,"enemy");assert.equal(e.hp,0);
});
test("platform absorbs projectiles before a monster behind it",()=>{
 const enemy={x:140,y:20,w:20,h:30,hp:3},wall={x:90,y:20,w:10,h:40};
 const b={x:0,y:30,w:10,h:8,vx:1000,life:1};
 assert.equal(stepProjectile(b,.2,[enemy],[wall]).kind,"solid");assert.equal(enemy.hp,3);
});
test("initial overlap hits instantly and never reduces health below zero",()=>{
 const e={x:10,y:10,w:12,h:12,hp:1};const b={x:12,y:12,w:4,h:4,vx:1,life:1,damage:3};
 assert.equal(sweep(b,e,1,0).t,0);stepProjectile(b,.1,[e]);assert.equal(e.hp,0);
});
test("expired shot cannot damage after lifetime ends",()=>{
 const e={x:10,y:10,w:12,h:12,hp:3};
 assert.equal(stepProjectile({x:10,y:10,w:4,h:4,vx:0,life:0},.02,[e]).kind,"expired");
 assert.equal(e.hp,3);
});
