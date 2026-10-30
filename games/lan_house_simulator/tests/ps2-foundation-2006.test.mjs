import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createGame} from "../dist/js/sim/engine.js";
import {DAY_MINUTES} from "../dist/js/sim/types.js";
import {PS1_UNLOCK_YEAR} from "../dist/js/sim/ps1.js";
import {
 PS2_UNLOCK_YEAR,PS2_MAX_STATIONS,PS2_GAME_CATALOG,PS2_BASE_BENCH_PRICE,
 ps2Unlocked,ps2BenchPrice,ps2GamePrice,ps2DefaultHourlyPrice,ps2SessionPrice
} from "../dist/js/sim/ps2.js";
import {annualHourlyCeiling} from "../dist/js/sim/historicalEconomy.js";
import {drawPs2MiniGame,ps2MiniGameTick} from "../dist/js/render/ps2MiniGames.js";
import {drawPs2Station,drawPs2Controller,ps2ControllerAnchor} from "../dist/js/render/ps2Art.js";

const atYear=(year,mode="historical")=>{
 const s=createGame(2006,mode);
 s.totalMinutes=(year-1998)*360*DAY_MINUTES;
 s.cash=12345;
 return s;
};
test("o PS1 permanece em 2002 e o PS2 tem marco próprio em 2006",()=>{
 assert.equal(PS1_UNLOCK_YEAR,2002);
 assert.equal(PS2_UNLOCK_YEAR,2006);
 for(const year of [1998,2002,2005])assert.equal(ps2Unlocked(atYear(year)),false);
 assert.equal(ps2Unlocked(atYear(2006)),true);
 assert.equal(ps2Unlocked(atYear(2030)),true);
 assert.equal(ps2Unlocked(atYear(2006,"classic")),false);
});
test("cinco jogos PS2 originais com IDs exclusivos, separados dos CDs PS1",async()=>{
 const {PS1_CD_CATALOG}=await import("../dist/js/sim/ps1.js");
 assert.equal(PS2_GAME_CATALOG.length,5);
 const ids=PS2_GAME_CATALOG.map(x=>x.id),ps1=new Set(PS1_CD_CATALOG.map(x=>x.id));
 assert.equal(new Set(ids).size,5);
 assert.ok(ids.every(id=>!ps1.has(id)));
 assert.equal(PS2_MAX_STATIONS,3);
});
test("preços são cotações de 2006, sem debitar dinheiro ou mudar save",()=>{
 const s=atYear(2006),before=JSON.stringify(s);
 assert.equal(ps2BenchPrice(s),PS2_BASE_BENCH_PRICE);
 assert.equal(ps2DefaultHourlyPrice(s),4);
 assert.equal(ps2SessionPrice(s,30),2);
 assert.equal(ps2SessionPrice(s,45),3);
 assert.ok(PS2_GAME_CATALOG.every(x=>ps2GamePrice(s,x.id)===x.basePrice));
 assert.equal(JSON.stringify(s),before);
});
test("a cotação respeita teto histórico de tarifa até 2030",()=>{
 for(let year=2006;year<=2030;year++){
  const s=atYear(year),price=ps2DefaultHourlyPrice(s);
  assert.ok(price>0&&price<=annualHourlyCeiling(year),"teto anual de "+year);
  assert.equal(Math.round(price*4),price*4,"passos de R$ 0,25");
  assert.ok(ps2BenchPrice(s)>=PS2_BASE_BENCH_PRICE);
  for(const game of PS2_GAME_CATALOG){
   assert.ok(ps2GamePrice(s,game.id)>=game.basePrice);
  }
 }
});
test("as cenas procedurais são determinísticas e recortadas no visor",()=>{
 assert.equal(ps2MiniGameTick(Number.NaN),0);
 assert.equal(ps2MiniGameTick(-10),0);
 assert.equal(ps2MiniGameTick(.2),2);
 for(const title of PS2_GAME_CATALOG){
  const paint=at=>{
   const rects=[];
   drawPs2MiniGame((x,y,w,h,color)=>{rects.push([x,y,w,h,color]);},title.id,at);
   return rects;
  };
  const a=paint(1.2);
  assert.ok(a.length>10,title.id+" precisa desenhar um jogo visível");
  assert.deepEqual(paint(1.2),a);
  assert.ok(a.every(([x,y,w,h])=>x>=0&&y>=0&&w>0&&h>0&&x+w<=1.00000001&&y+h<=1.00000001));
  assert.notDeepEqual(a,paint(2.4),title.id+" deve animar");
 }
});
function mockCanvas(){
 const calls=[],values={};
 const ctx=new Proxy(values,{get(target,key){
  if(key in target)return target[key];
  return (...args)=>{calls.push([key,...args]);};
 },set(target,key,value){target[key]=value;return true;}});
 return {ctx,calls};
}
test("renderizador PS2 desenha TV, gabinete, bancada, controles e cadeira sem imagens",()=>{
 const cam={zoom:.86,originX:500,originY:220},point={x:3,y:2};
 const solo=mockCanvas();
 drawPs2Station(solo.ctx,cam,point,0,false,0,null,false);
 assert.ok(solo.calls.some(x=>x[0]==="fillText"&&x[1]==="PS2"));
 const singleChairs=solo.calls.filter(x=>x[0]==="ellipse").length;
 const duo=mockCanvas();
 drawPs2Station(duo.ctx,cam,point,100,true,1.4,"cidade-em-fuga",true);
 assert.ok(duo.calls.filter(x=>x[0]==="ellipse").length>=singleChairs);
 assert.ok(duo.calls.some(x=>x[0]==="fillText"&&x[1]==="!"));
 assert.ok(duo.calls.filter(x=>x[0]==="fill").length>solo.calls.filter(x=>x[0]==="fill").length);
 const pad=mockCanvas();
 drawPs2Controller(pad.ctx,cam,{x:3.5,y:2.8},.8);
 assert.ok(pad.calls.some(x=>x[0]==="bezierCurveTo"));
 assert.deepEqual(ps2ControllerAnchor({x:3.5,y:2.8}),{
  point:{x:3.62,y:2.7199999999999998},height:24
 });
});
test("código PS2 é original, só Canvas, e não modifica as rotinas PS1",()=>{
 const root=new URL("../src/",import.meta.url);
 const sim=readFileSync(new URL("sim/ps2.ts",root),"utf8");
 const art=readFileSync(new URL("render/ps2Art.ts",root),"utf8");
 const games=readFileSync(new URL("render/ps2MiniGames.ts",root),"utf8");
 assert.doesNotMatch(sim,/\b(document|window|HTMLElement|CanvasRenderingContext2D)\b/);
 assert.doesNotMatch(art+games,/\b(fetch|new Image|document\.createElement|WebGLRenderingContext|XMLHttpRequest)\b/);
 assert.doesNotMatch(art,/drawPs1Station|drawPs1Controller/);
 assert.match(art,/drawPs2MiniGame/);
});
