/** Normalização de termos do guia, sem serviço externo ou persistência. */
export function normalizeHelpText(value){
 return String(value??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLocaleLowerCase("pt-BR").replace(/[^\p{L}\p{N}]+/gu," ").trim().replace(/\s+/g," ");
}
export function matchesHelpQuery(content,query){
 const terms=normalizeHelpText(query).split(" ").filter(Boolean);
 const text=normalizeHelpText(content);
 return terms.every(term=>text.includes(term));
}
