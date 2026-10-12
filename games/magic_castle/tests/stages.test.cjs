"use strict";
const {test}=require("node:test"),assert=require("node:assert/strict");
const {stages,makeEnemies,mayEnter,atExit,heal}=require("../stages.js");
test("each room has at most two distinct monsters",()=>{assert.equal(stages.length,2);for(const s of stages)assert.ok(s.enemies.length>=1&&s.enemies.length<=2);});
test("exit requires every enemy defeated and standing near door",()=>{const player={x:738,y:348,w:27,h:42};const enemies=makeEnemies(stages[0]);assert.equal(mayEnter(player,enemies),false);enemies.forEach(e=>e.hp=0);assert.equal(mayEnter(player,enemies),true);player.x=300;assert.equal(atExit(player),false);assert.equal(mayEnter(player,enemies),false);});
test("health potion heals only missing health and only once",()=>{const item={...stages[1].heal,taken:false},p={x:item.x,y:item.y,w:27,h:42,hp:4,maxHp:5};assert.equal(heal(p,item),true);assert.equal(p.hp,5);p.hp=2;assert.equal(heal(p,item),false);assert.equal(p.hp,2);});
test("potion is preserved when full or not colliding",()=>{const item={...stages[1].heal,taken:false},p={x:0,y:0,w:27,h:42,hp:4,maxHp:5};assert.equal(heal(p,item),false);p.x=item.x;p.y=item.y;p.hp=5;assert.equal(heal(p,item),false);assert.equal(item.taken,false);});
test("fresh stage copies do not alter authored recipes",()=>{const a=makeEnemies(stages[0]);a[0].hp=0;a[0].x=1;const b=makeEnemies(stages[0]);assert.ok(b[0].hp>0&&b[0].x!==1);});
