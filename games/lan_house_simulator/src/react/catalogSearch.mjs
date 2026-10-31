/** Pure, accent-insensitive search over rendered shop descriptions (presentation only). */
export function normalizeCatalogSearch(value){
 return String(value??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLocaleLowerCase("pt-BR").trim().replace(/\s+/g," ");
}
export function catalogSearchMatch(query,parts){
 const wanted=normalizeCatalogSearch(query);
 if(!wanted)return true;
 return normalizeCatalogSearch(parts.join(" ")).includes(wanted);
}
