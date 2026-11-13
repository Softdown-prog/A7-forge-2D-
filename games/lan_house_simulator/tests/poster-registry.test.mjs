import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createPosterRegistry,POSTER_KINDS,posterFor} from "../dist/js/render/posters/registry.js";
import {POSTER_KINDS as publicKinds,drawPosterPlate} from "../dist/js/render/posterArt.js";
import {coasterPoster} from "../dist/js/render/posters/coaster.js";
import {tacticalPoster} from "../dist/js/render/posters/tactical.js";
import {golfPoster} from "../dist/js/render/posters/golf.js";
import {artilleryPoster} from "../dist/js/render/posters/artillery.js";
import {cityPoster} from "../dist/js/render/posters/city.js";
import {terminalPoster} from "../dist/js/render/posters/terminal.js";
import {arcadePoster} from "../dist/js/render/posters/arcade.js";

const designs={coaster:coasterPoster,tactical:tacticalPoster,golf:golfPoster,
 artillery:artilleryPoster,city:cityPoster,terminal:terminalPoster,arcade:arcadePoster};

test("each poster has one registered painter and stable public identifiers",()=>{
 const names=["coaster","tactical","golf","artillery","city","terminal","arcade"];
 assert.deepEqual(POSTER_KINDS,names);
 assert.strictEqual(publicKinds,POSTER_KINDS,"public kind list keeps the original reference");
 for(const kind of names)assert.strictEqual(posterFor(kind),designs[kind]);
 assert.throws(()=>posterFor("not-a-poster"),/Unknown poster artwork/);
});
test("registry rejects two painters for the same artwork name",()=>{
 assert.throws(()=>createPosterRegistry([["city",cityPoster],["city",arcadePoster]]),/Duplicate poster artwork/);
 assert.deepEqual([...createPosterRegistry([["city",cityPoster]])].map(([kind])=>kind),["city"]);
});
test("general poster painter never imports individual designs directly",()=>{
 const source=readFileSync(new URL("../src/render/posterArt.ts",import.meta.url),"utf8");
 assert.match(source,/posterFor\(kind\)/);
 assert.doesNotMatch(source,/from\s*["']\.\/posters\/(?:coaster|tactical|golf|artillery|city|terminal|arcade)\.js/);
});
test("seven poster designs still paint without a browser DOM",()=>{
 const actions=[];
 const ctx=new Proxy({},{
  get(target,key){if(key in target)return target[key];return (...args)=>actions.push([String(key),...args]);},
  set(target,key,value){target[key]=value;return true;}
 });
 for(const kind of POSTER_KINDS){
  actions.length=0;drawPosterPlate(ctx,kind);
  assert.ok(actions.some(a=>a[0]==="fillRect"),kind+" must draw its frame");
  assert.ok(actions.some(a=>a[0]==="fillText"),kind+" must retain its title");
 }
});
