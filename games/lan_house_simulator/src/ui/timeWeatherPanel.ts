import {dayNumber,displayTime} from "../sim/engine.js";
import {gameYear} from "../sim/era.js";
import {DAY_MINUTES,type GameState} from "../sim/types.js";
import {GAME_LAST_MINUTE} from "../sim/mailCalendar.js";

/** Uses only the existing simulation clock and the observed day's weather.
 * The next day's weather is randomized at the daily rollover, not forecast. */
export function timeWeatherSnapshot(s:GameState){
 const day=Math.max(0,Math.floor(s.totalMinutes/DAY_MINUTES));
 const date=String(day%30+1).padStart(2,"0")+"/"+
   String(Math.floor(day%360/30)+1).padStart(2,"0")+"/"+gameYear(s);
 const time=displayTime(s);
 const rainy=s.weather==="rain";
 return {
  day:dayNumber(s),date,time,
  weather:rainy?"Chuva":"Tempo firme",
  weatherIcon:rainy?"rain":"sun",
  impact:rainy
   ?"A chuva reduz a procura e aumenta a chance de interrupções na conexão."
   :"Sem penalidade de chuva na procura; a conexão ainda pode apresentar falhas.",
  outlook:s.totalMinutes>=GAME_LAST_MINUTE
   ?"Campanha concluída. Não há novos dias no calendário."
   :"O tempo de amanhã só será definido quando o próximo dia começar."
 };
}
/** Text nodes update only when values change; the native details element handles
 * expansion/focus without a custom modal, animation loop or scroll anchoring. */
export function renderTimeWeatherPanel(
 s:GameState,iconMarkup:(kind:string)=>string,doc:Document=document
):void{
 const view=timeWeatherSnapshot(s);
 const setText=(id:string,text:string)=>{
  const node=doc.getElementById(id);
  if(node&&node.textContent!==text)node.textContent=text;
 };
 const setHtml=(id:string,html:string)=>{
  const node=doc.getElementById(id);
  if(node&&node.innerHTML!==html)node.innerHTML=html;
 };
 const ended=s.totalMinutes>=GAME_LAST_MINUTE;
 setHtml("calendar-hud",iconMarkup("calendar")+
  (ended?"Fim da campanha · ":"")+"Dia "+view.day+" · "+view.date+" · "+view.time);
 setHtml("weather-hud",iconMarkup(view.weatherIcon)+view.weather);
 const panel=doc.getElementById("time-weather-panel");
 if(!panel?.hasAttribute("open"))return;
 setText("time-weather-date",view.date);
 setText("time-weather-day",(ended?"Último dia":"Dia "+view.day)+" da campanha");
 setText("time-weather-hour",view.time);
 setText("time-weather-condition",view.weather);
 setText("time-weather-effect",view.impact);
 setText("time-weather-outlook",view.outlook);
}
