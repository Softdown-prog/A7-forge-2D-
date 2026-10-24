import test from "node:test";
import assert from "node:assert/strict";
import {summarizeNightTrophies} from "../dist/js/sim/nightTrophyStats.js";

test("quadro começa vazio, sem fabricar títulos",()=>{
 assert.deepEqual(summarizeNightTrophies(),{
  total:0,uniqueChampions:0,finalsTwo:0,finalsThree:0,champions:[]
 });
});

test("ranking usa apenas troféus reais persistidos, ordenados por títulos e última final",()=>{
 const trophies=[
  {fridayDay:2,winnerId:7,participants:2},
  {fridayDay:9,winnerId:8,participants:3},
  {fridayDay:16,winnerId:7,participants:3},
  {fridayDay:23,winnerId:9,participants:2},
  {fridayDay:30,winnerId:8,participants:3},
  {fridayDay:37,winnerId:7,participants:2}
 ];
 const before=structuredClone(trophies);
 assert.deepEqual(summarizeNightTrophies(trophies),{
  total:6,uniqueChampions:3,finalsTwo:3,finalsThree:3,
  champions:[
   {winnerId:7,titles:3,lastFridayDay:37},
   {winnerId:8,titles:2,lastFridayDay:30},
   {winnerId:9,titles:1,lastFridayDay:23}
  ]
 });
 assert.deepEqual(trophies,before,"leitura não altera saves");
});

test("desempate prioriza a sexta mais recente e depois menor ID",()=>{
 const trophies=[
  {fridayDay:2,winnerId:10,participants:2},
  {fridayDay:9,winnerId:3,participants:3},
  {fridayDay:9,winnerId:2,participants:2}
 ];
 assert.deepEqual(summarizeNightTrophies(trophies).champions.map(x=>x.winnerId),[2,3,10]);
});
