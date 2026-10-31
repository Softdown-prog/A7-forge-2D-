/** React presentation islands for management tasks. The TypeScript adapters remain
 * the only owner of selected page, purchased hardware, staff and network state.
 */
import React,{useEffect,useState} from "react";
import {WORKSPACE_TASKS} from "./adminWorkspaceData.mjs";

function useSelectedTask(area,initial){
 const [current,setCurrent]=useState(initial);
 useEffect(()=>{
  const sync=event=>{
   if(event.detail?.area===area)setCurrent(event.detail.page);
  };
  document.addEventListener("lhs:management-page-selected",sync);
  const active=document.querySelector('#section-'+area+' > .management-pages [aria-pressed="true"]');
  if(active?.dataset.panelChoice)setCurrent(active.dataset.panelChoice);
  return ()=>document.removeEventListener("lhs:management-page-selected",sync);
 },[area]);
 return current;
}

function openTask(area,page){
 const root=document.getElementById("section-"+area);
 const button=root?.querySelector('.management-pages button[data-panel-choice="'+page+'"]');
 if(!(button instanceof HTMLButtonElement)||button.disabled)return false;
 button.click(); // The existing TypeScript controller selects and renders the page.
 return true;
}

function TaskBoard({area,eyebrow,title,description}){
 const tasks=WORKSPACE_TASKS[area],selected=useSelectedTask(area,tasks[0].id);
 return <section className="react-workspace" data-react-workspace={area} aria-label={title}>
  <div className="react-workspace-heading">
   <div><span className="react-workspace-eyebrow">{eyebrow}</span><h4>{title}</h4></div>
   <p>{description}</p>
  </div>
  <nav className="react-workspace-grid" aria-label={"Tarefas de "+title}>
   {tasks.map(task=><button key={task.id} type="button" className="react-workspace-task"
    data-react-task={task.id} aria-pressed={selected===task.id}
    aria-controls={"page-"+area+"-"+task.id} onClick={()=>openTask(area,task.id)}>
    <span className="react-workspace-task-icon" aria-hidden="true">{task.icon}</span>
    <span className="react-workspace-task-copy"><strong>{task.label}</strong><small>{task.description}</small></span>
    <span className="react-workspace-task-arrow" aria-hidden="true">›</span>
   </button>)}
  </nav>
 </section>;
}

/** Mirrors only the active station buttons already rendered by the maintenance UI.
 * It never invents a computer, changes a configuration or reads the game save.
 */
function StationQuickSwitch({page}){
 const [snapshot,setSnapshot]=useState({signature:"",stations:[]});
 useEffect(()=>{
  const host=document.getElementById("pc-maintenance");
  if(!host)return;
  const attr=page==="monitors"?"lcdSelect":"hardwareSelect";
  const read=()=>{
   const nodes=Array.from(host.querySelectorAll(page==="monitors"?
    "button[data-lcd-select]":"button[data-hardware-select]"));
   const stations=nodes.map(button=>({
    id:button.dataset[attr],label:button.textContent?.trim()??"",
    selected:button.getAttribute("aria-pressed")==="true",disabled:button.disabled
   })).filter(station=>station.id!==undefined);
   const signature=JSON.stringify(stations);
   setSnapshot(current=>current.signature===signature?current:{signature,stations});
  };
  const observer=new MutationObserver(read);
  observer.observe(host,{subtree:true,childList:true,attributes:true,attributeFilter:["aria-pressed","disabled"]});
  read();
  return ()=>observer.disconnect();
 },[page]);
 if(!["hardware","windows","monitors"].includes(page)||snapshot.stations.length===0)return null;
 const chosen=snapshot.stations.find(station=>station.selected);
 const attr=page==="monitors"?"lcd-select":"hardware-select";
 return <section className="react-station-switch" aria-label="Seleção rápida de computadores">
  <div className="react-station-switch-heading">
   <div><strong>Escolha a estação</strong><small>Selecione um PC para consultar as peças e opções disponíveis.</small></div>
   <span aria-live="polite">{chosen?.label??"Selecione uma estação"}</span>
  </div>
  <div className="react-station-switch-buttons">
   {snapshot.stations.map(station=><button type="button" key={station.id}
    data-react-station={station.id} disabled={station.disabled}
    aria-pressed={station.selected} onClick={()=>{
     const original=document.querySelector('#pc-maintenance button[data-'+attr+'="'+station.id+'"]');
     if(original instanceof HTMLButtonElement&&!original.disabled)original.click();
    }}>{station.label}</button>)}
  </div>
 </section>;
}

export function ComputerWorkspace(){
 const page=useSelectedTask("computers","operations");
 return <>
  <TaskBoard area="computers" eyebrow="CENTRAL DOS COMPUTADORES"
   title="Operação, peças e manutenção"
   description="Alterne entre reparos, evolução do hardware, Windows, monitores e receita por estação."/>
  <StationQuickSwitch page={page}/>
 </>;
}
export function ServicesWorkspace(){
 return <TaskBoard area="services" eyebrow="SERVIÇOS DO SALÃO"
  title="Equipe, internet e circulação"
  description="Encontre funcionários, contratos e pontos sem passagem sem procurar em uma lista longa."/>;
}
