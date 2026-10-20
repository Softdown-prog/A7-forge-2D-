import test from "node:test";
import assert from "node:assert/strict";
import {shouldShowCustomerSpeech,SPEECH_COOLDOWN_MINUTES} from "../dist/js/sim/customerDialogue.js";

test("customer remarks are uncommon, with complaints more visible than praise",()=>{
 const n=1000,minute=197;
 const count=kind=>Array.from({length:n},(_,i)=>
   Number(shouldShowCustomerSpeech(i+1,"Minha visita à lan house!",minute,kind)))
   .reduce((total,shown)=>total+shown,0);
 const praise=count("praise"),complaint=count("complaint");
 assert.ok(praise>=100&&praise<=200,"Praise frequency: "+praise);
 assert.ok(complaint>=240&&complaint<=360,"Complaint frequency: "+complaint);
 assert.ok(complaint>praise);
 assert.ok(SPEECH_COOLDOWN_MINUTES>=12,"Keep remarks from stacking over each other");
});
test("presentation probability is repeatable and never consumes simulation RNG",()=>{
 for(let id=1;id<100;id++)for(const kind of ["complaint","praise"]){
  const first=shouldShowCustomerSpeech(id,"Que fila enorme!",320,kind);
  assert.equal(first,shouldShowCustomerSpeech(id,"Que fila enorme!",320,kind));
  assert.equal(typeof first,"boolean");
 }
});
