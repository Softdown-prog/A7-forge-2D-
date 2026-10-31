/** React-owned navigation islands mounted BEFORE the existing game bootstrap.
 * React owns stable menu / header buttons; the application controls their actions,
 * focus, aria state and disabled state through the existing TypeScript adapters.
 * Never re-create a game canvas or simulation state in React.
 */
import React,{useState} from "react";
import {createRoot} from "react-dom/client";
import {flushSync} from "react-dom";

const ICONS={
 play:"play",continue:"continue",users:"users",settings:"settings",
 pause:"pause",cart:"cart",mail:"mail"
};
function MenuActions(){
 return <>
  <button id="menu-new" type="button" className="primary" data-icon={ICONS.play}>Abrir minha lan house<span className="button-arrow" aria-hidden="true">→</span></button>
  <button id="menu-continue" type="button" data-icon={ICONS.continue}>Continuar partida</button>
  <button id="menu-account" type="button" data-icon={ICONS.users} aria-controls="player-account">Minha Conta · 🍪</button>
  <button id="menu-options" type="button" data-icon={ICONS.settings} aria-expanded="false" aria-controls="menu-settings">Opções</button>
 </>;
}
const CHAPTERS=[
 {id:"abrir",label:"01 · Comece pequeno",title:"Sua primeira lan house",
  body:"Três computadores, um balcão e muita vontade de crescer. Ajuste os preços e conquiste os primeiros clientes.",
  note:"1998 · O começo de tudo"},
 {id:"crescer",label:"02 · Faça crescer",title:"Cada decisão muda o salão",
  body:"Organize as mesas, amplie o espaço e cuide de cada estação. A evolução acontece diante dos seus olhos.",
  note:"Gestão · Layout · Expansão"},
 {id:"historia",label:"03 · Viva a época",title:"A internet tem uma história",
  body:"Do correio às novas tecnologias, descubra eventos e mudanças ao longo de uma campanha que atravessa décadas.",
  note:"Evolução · Oportunidades · Memórias"}
];
function MenuTour(){
 const [selected,setSelected]=useState(CHAPTERS[0].id);
 const chapter=CHAPTERS.find(x=>x.id===selected)??CHAPTERS[0];
 return <div className="react-chapters">
  <div className="react-chapters-heading"><span>UM SALÃO. MUITAS HISTÓRIAS.</span><span className="react-chapters-rule" aria-hidden="true"/></div>
  <div className="react-chapters-tabs" role="tablist" aria-label="Conheça o jogo">
   {CHAPTERS.map(c=><button key={c.id} type="button" role="tab" aria-selected={c.id===selected}
    aria-controls="react-chapter-content" id={"react-tab-"+c.id}
    className={c.id===selected?"react-chapter-tab active":"react-chapter-tab"}
    onClick={()=>setSelected(c.id)}>{c.label}</button>)}
  </div>
  <div className="react-chapter-detail" id="react-chapter-content" role="tabpanel"
   aria-labelledby={"react-tab-"+chapter.id} key={chapter.id}>
   <span className="react-chapter-marker" aria-hidden="true">✦</span>
   <div><strong>{chapter.title}</strong><p>{chapter.body}</p>
    <span className="react-chapter-note">{chapter.note}</span>
   </div>
  </div>
 </div>;
}
function GameHeaderActions(){
 return <>
  <button id="open-account" className="slice" type="button" aria-controls="player-account">🍪 Minha Conta</button>
  <button id="open-menu" className="slice" type="button" data-icon={ICONS.pause}>Menu<span className="keyboard-hint">ESC</span></button>
  <button id="open-shop" className="slice" type="button" data-icon={ICONS.cart}
   aria-controls="shop" aria-expanded="false">Compras</button>
  <button id="open-notices" className="slice notices-trigger" type="button" data-icon={ICONS.mail}
   aria-controls="notices" aria-expanded="false" aria-label="Mensagens da lan house">
   <span className="notice-label">Correio</span><span className="notices-count" id="notices-count" hidden>0</span>
  </button>
  <button id="open-admin" className="slice primary" type="button" data-icon={ICONS.settings}
   aria-controls="admin" aria-expanded="false">Administrar</button>
 </>;
}
function mountReactControls(){
 const ids=[
  ["react-menu-actions",<MenuActions/>],
  ["react-menu-tour",<MenuTour/>],
  ["react-topbar-actions",<GameHeaderActions/>]
 ];
 // flushSync ensures getElementById in locateGameElements finds the real React
 // buttons before the existing imperative TypeScript controllers attach.
 for(const [id,view] of ids){
  const node=document.getElementById(id);
  if(!node)throw new Error("React UI root ausente: "+id);
  const root=createRoot(node);
  flushSync(()=>root.render(view));
 }
 document.documentElement.dataset.uiFramework="react";
}
mountReactControls();
// Separate game bootstrap: the browser continues to execute the original
// TypeScript Canvas modules without React entering the animation hot path.
import("./main.js").catch(err=>{
 console.error("Falha ao iniciar o motor da lan house:",err);
 const menu=document.getElementById("save-message");
 if(menu)menu.textContent="Não foi possível iniciar o jogo. Atualize a página para tentar novamente.";
});
