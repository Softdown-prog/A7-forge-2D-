import test from "node:test";
import assert from "node:assert/strict";
import {createGame,stepGame,entrance} from "../dist/js/sim/engine.js";
import {navigableRoute} from "../dist/js/sim/navigation.js";
import {purchaseApproach} from "../dist/js/sim/layout.js";
import {computerSeat} from "../dist/js/sim/route.js";
import {pcPosition} from "../dist/js/sim/simulationState.js";

function isolatedStore(){
 const s=createGame(7352);
 // Uma máquina de bebidas isolada por três paredes: o PC e a saída
 // continuam conectados pelo corredor inferior, sem teletransporte.
 s.interiorWalls=[
  ...[0,1,2].map(y=>({axis:"y",x:5,y})),
  ...[5,6,7].map(x=>({axis:"x",x,y:3}))
 ];
 s.pcPoweredOff=[true,true,true]; // Nenhum novo visitante interfere no caso.
 return s;
}
function customer(stage="standing"){
 const pos=computerSeat(pcPosition(0));
 return {id:10,x:pos.x,y:pos.y,stage,target:{...pos},route:[],
  costume:"regular",pcIndex:stage==="standing"?0:null,
  usedMinutes:45,waitingMinutes:0,offlineWait:0,happy:true,
  poseMinutes:2,wantsSnack:true,desiredItem:"soda",wallet:25};
}
test("sem rota para o lanche, cliente conclui sessão e vai embora sem virar compra fantasma",()=>{
 const s=isolatedStore(),c=customer();
 s.customers=[c];
 assert.equal(navigableRoute(s,c,purchaseApproach("soda",s)),null);
 assert.ok(navigableRoute(s,c,entrance(s)),"a saída deve continuar alcançável");
 const revenue=s.revenue,purchases=s.purchases,served=s.served;
 stepGame(s,1);
 assert.equal(c.stage,"leaving");
 assert.equal(c.pcIndex,null);
 assert.equal(s.revenue,revenue);
 assert.equal(s.purchases,purchases);
 assert.equal(s.served,served);
 for(let i=0;i<90&&s.customers.includes(c);i++)stepGame(s,1);
 assert.equal(s.customers.includes(c),false,"sair fisicamente pela porta");
});
test("divisória construída durante compra não prende cliente no corredor",()=>{
 const s=createGame(8291),c=customer("shopping");
 const goal=purchaseApproach("soda",s);
 c.target={...goal};c.poseMinutes=0;
 s.customers=[c];
 assert.ok(navigableRoute(s,c,goal));
 s.interiorWalls=isolatedStore().interiorWalls;
 s.pcPoweredOff=[true,true,true];
 assert.equal(navigableRoute(s,c,goal),null);
 assert.ok(navigableRoute(s,c,entrance(s)));
 const cash=s.cash,served=s.served,purchases=s.purchases;
 let sawExit=false;
 for(let i=0;i<80&&s.customers.includes(c);i++){
  stepGame(s,1);
  if(c.stage==="leaving")sawExit=true;
 }
 assert.equal(sawExit,true,"após travamento real reavaliar trajeto bloqueado");
 assert.equal(s.customers.includes(c),false,"caminhar até a saída");
 assert.equal(s.cash,cash,"não inventar receita ou cobrança");
 assert.equal(s.served,served);
 assert.equal(s.purchases,purchases);
});
test("fila temporariamente congestionada não provoca desistência indevida",()=>{
 const s=createGame(1640),c=customer("shopping");
 c.stalledMinutes=15;
 const position=purchaseApproach("soda",s);
 c.target={...position};
 s.pcPoweredOff=[true,true,true];
 s.customers=[c];
 assert.ok(navigableRoute(s,c,position));
 stepGame(s,1);
 assert.equal(c.stage,"shopping","rota estática livre deve preservar a compra");
});
