import test from "node:test";
import assert from "node:assert/strict";
import {futureNightClock,NIGHT_FIRST_ARRIVAL_OFFSET,NIGHT_MORNING_EXIT_OFFSET} from "../dist/js/sim/futureNightClock.js";
import {weekdayIndex,campaignDate} from "../dist/js/sim/campaignWeek.js";

test("sexta 22h, sexta 23h, sábado 0h e sábado 7h sem virar dois dias",()=>{
 const fri=2;
 const checks=[[0,"sexta-feira","22:00",2],[NIGHT_FIRST_ARRIVAL_OFFSET,"sexta-feira","23:00",2],
  [119,"sexta-feira","23:59",2],[120,"sábado","00:00",3],
  [180,"sábado","01:00",3],[NIGHT_MORNING_EXIT_OFFSET,"sábado","07:00",3],
  [600,"sábado","08:00",3]];
 for(const [minute,weekday,time,day] of checks){
  const view=futureNightClock(fri,minute);
  assert.equal(view.weekday,weekday);assert.equal(view.time,time);
  assert.equal(view.calendarDay,day);assert.equal(view.fridayDay,fri);
 }
});

test("a madrugada atravessa um mês e um ano sem usar calendário real",()=>{
 for(const unit of [30,360]){
  const friday=Array.from({length:360*8},(_,i)=>i+1).find(d=>
   d%unit===0&&weekdayIndex(d)===4);
  assert.ok(friday!==undefined);
  const before=futureNightClock(friday,119),after=futureNightClock(friday,120);
  assert.equal(before.date,campaignDate(friday));
  assert.equal(after.date,campaignDate(friday+1));
  assert.notEqual(after.date,before.date);
  assert.equal(after.calendarDay,before.calendarDay+1);
 }
});

test("dados de madrugada inválidos não corrompem o estado",()=>{
 for(const day of [0,-1,1,3,NaN])assert.throws(()=>futureNightClock(day,0),RangeError);
 for(const elapsed of [-1,721,23.4,NaN])assert.throws(()=>futureNightClock(2,elapsed),RangeError);
});
