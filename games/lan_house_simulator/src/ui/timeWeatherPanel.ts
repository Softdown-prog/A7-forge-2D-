import type {TimeWeatherSnapshot} from "../application/timeWeatherSnapshot.js";
/** DOM-only calendar/weather presenter. Receives a snapshot, never GameState. */
const publishedSnapshots=new WeakMap<Document,string>();
function publishAngularTimeWeather(view:TimeWeatherSnapshot,doc:Document):void{
 if(typeof doc.dispatchEvent!=="function"||typeof CustomEvent!=="function")return;
 const fingerprint=JSON.stringify(view);
 if(publishedSnapshots.get(doc)===fingerprint)return;
 publishedSnapshots.set(doc,fingerprint);
 doc.dispatchEvent(new CustomEvent("lhs:time-weather-updated",{detail:view}));
}
export function renderTimeWeatherPanel(view:TimeWeatherSnapshot,iconMarkup:(kind:string)=>string,doc:Document=document):void{
 const setText=(id:string,value:string)=>{
  const node=doc.getElementById(id);
  if(node&&node.textContent!==value)node.textContent=value;
 };
 const setHtml=(id:string,html:string)=>{
  const node=doc.getElementById(id);
  if(node&&node.innerHTML!==html)node.innerHTML=html;
 };
 setHtml("calendar-hud",iconMarkup("calendar")+
  (view.ended?"Fim da campanha · ":"")+"Dia "+view.day+" · "+view.weekday+" · "+view.date+" · "+view.time);
 setHtml("weather-hud",iconMarkup(view.weatherIcon)+view.weather);
 publishAngularTimeWeather(view,doc);
 const panel=doc.getElementById("time-weather-panel");
 if(!panel?.hasAttribute("open"))return;
 setText("time-weather-date",view.date);
 setText("time-weather-day",(view.ended?"Último dia":"Dia "+view.day)+" da campanha · "+view.weekday);
 setText("time-weather-hour",view.time);
 setText("time-weather-condition",view.weather);
 setText("time-weather-effect",view.impact);
 setText("time-weather-outlook",view.nightActive
  ?"Encontro noturno em andamento. O sábado normal reabre às 10h, após a saída da turma."
  :view.outlook);
}
