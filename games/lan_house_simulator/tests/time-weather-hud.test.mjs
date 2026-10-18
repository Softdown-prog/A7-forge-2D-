import test from "node:test";
import assert from "node:assert/strict";
import {createGame} from "../dist/js/sim/engine.js";
import {DAY_MINUTES} from "../dist/js/sim/types.js";
import {timeWeatherSnapshot,renderTimeWeatherPanel} from "../dist/js/ui/timeWeatherPanel.js";

test("date and clock follow the LHS 30-day month, 360-day year",()=>{
 const s=createGame(20,"historical");
 for(const [n,date,clock] of [
  [0,"01/01/1998","10:00"],[59,"01/01/1998","10:59"],
  [719,"01/01/1998","21:59"],[720,"02/01/1998","10:00"],
  [29*DAY_MINUTES,"30/01/1998","10:00"],
  [30*DAY_MINUTES,"01/02/1998","10:00"],
  [360*DAY_MINUTES,"01/01/1999","10:00"]
 ]){
  s.totalMinutes=n;
  const view=timeWeatherSnapshot(s);
  assert.equal(view.date,date);assert.equal(view.time,clock);
 }
});
test("rain is described as today's condition without inventing tomorrow's forecast",()=>{
 const s=createGame(9,"historical"),rng=s.rng;
 s.weather="rain";
 const rainy=timeWeatherSnapshot(s);
 assert.equal(rainy.weather,"Chuva");
 assert.match(rainy.impact,/procura/);
 assert.match(rainy.outlook,/só será definido/);
 s.weather="sun";
 assert.equal(timeWeatherSnapshot(s).weather,"Tempo firme");
 assert.equal(s.rng,rng);
});
test("closed panel updates only the summary; open panel updates details without resetting open",()=>{
 const s=createGame(37,"historical");
 const nodes=new Map([...["calendar-hud","weather-hud","time-weather-panel",
  "time-weather-date","time-weather-day","time-weather-hour","time-weather-condition",
  "time-weather-effect","time-weather-outlook"]].map(id=>[id,{
   id,innerHTML:"",textContent:"",attrs:new Set(),hasAttribute(n){return this.attrs.has(n)}
  }]));
 const doc={getElementById:id=>nodes.get(id)};
 const icon=name=>"<"+name+">";
 renderTimeWeatherPanel(s,icon,doc);
 assert.equal(nodes.get("time-weather-date").textContent,"");
 assert.match(nodes.get("calendar-hud").innerHTML,/01\/01\/1998/);
 nodes.get("time-weather-panel").attrs.add("open");
 s.totalMinutes=30*DAY_MINUTES+85;s.weather="rain";
 renderTimeWeatherPanel(s,icon,doc);
 assert.equal(nodes.get("time-weather-date").textContent,"01/02/1998");
 assert.equal(nodes.get("time-weather-hour").textContent,"11:25");
 assert.equal(nodes.get("time-weather-condition").textContent,"Chuva");
 assert.ok(nodes.get("time-weather-panel").hasAttribute("open"));
});
