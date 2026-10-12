"use strict";
const assert=require("node:assert/strict");const {test}=require("node:test");const {update}=require("../enemy_ai.js");
const player={x:50,y:348,w:27,h:42};
test("slime pursues player along floor",()=>{const e={type:"slime",x:240,y:368,w:32,h:22,hp:5,speed:35};update(e,player,.2,1);assert.ok(e.x<240);assert.equal(e.y,368);});
test("guardian guards when far and advances deliberately when near",()=>{const e={type:"guardian",x:700,y:345,w:34,h:45,hp:8,speed:24};update(e,player,.1,1);assert.equal(e.x,700);player.x=470;update(e,player,.5,2);assert.ok(e.x<700);player.x=50;});
test("bat enters windup then dives then recovers",()=>{const e={type:"bat",x:200,y:170,w:30,h:22,hp:3,speed:55};update(e,player,1.4,1.4);assert.equal(e.aiState,"windup");update(e,player,.32,1.72);assert.equal(e.aiState,"dive");update(e,player,.8,2.52);assert.equal(e.aiState,"recover");});
test("stunned or dead enemies don't make autonomous decisions",()=>{const e={type:"slime",x:200,y:368,w:32,h:22,hp:5,speed:35,stun:.1};update(e,player,.05,1);assert.equal(e.x,200);e.stun=0;e.hp=0;update(e,player,.2,2);assert.equal(e.x,200);});
test("all enemies stay inside room bounds",()=>{const e={type:"slime",x:799,y:0,w:32,h:22,hp:5,speed:35};update(e,player,.05,1);assert.equal(e.x,768);assert.equal(e.y,368);});
