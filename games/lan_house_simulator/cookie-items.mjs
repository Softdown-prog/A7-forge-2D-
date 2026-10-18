// Catálogo oficial no backend. IDs/preços nunca são aceitos do navegador.
// A compra desconta somente Cookies que já foram creditados e confirmados.
export const COOKIE_ITEMS=Object.freeze({
 "headset-rgb-neon":Object.freeze({name:"Fone Gamer RGB Neon",cookies:40,unlockYear:2012}),
 "chair-gamer-neon":Object.freeze({name:"Cadeira Gamer Neon",cookies:50,unlockYear:2012}),
 "keyboard-rainbow-rgb":Object.freeze({name:"Teclado Rainbow RGB",cookies:25,unlockYear:2012}),
 "neon-open-sign":Object.freeze({name:"Placa Neon ABERTO",cookies:30,unlockYear:1998}),
 "arcade-checker-floor":Object.freeze({name:"Piso Arcade Xadrez",cookies:25,unlockYear:1998}),
 "exclusive-arcade-posters":Object.freeze({name:"Pôsteres Exclusivos",cookies:12,unlockYear:1998}),
 "tony-cyber":Object.freeze({name:"Tony Cyber",cookies:60,unlockYear:2010}),
 "aquarium-rgb":Object.freeze({name:"Aquário Iluminado RGB",cookies:45,unlockYear:2008}),
 "pixel-led-clock":Object.freeze({name:"Relógio Pixel LED",cookies:30,unlockYear:2000})
});
export function summarizeLedger(docs){
 const events=docs.map(e=>({
  id:String(e.id),type:String(e.type||"other"),
  delta:Number.isSafeInteger(e.delta)?e.delta:0,
  itemId:typeof e.itemId==="string"?e.itemId:null,
  at:typeof e.at==="string"?e.at:(e.at?.toDate?.()?.toISOString()??null),
  mode:e.mode==="sandbox"?"sandbox":"production"
 }));
 return events;
}
export function totalItemSpending(entries){
 return entries.reduce((sum,e)=>sum+(e.type==="item"&&Number.isSafeInteger(e.delta)&&e.delta<0?-e.delta:0),0);
}
