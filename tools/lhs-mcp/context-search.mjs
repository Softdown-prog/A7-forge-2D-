/** Bounded, zero-cost lexical contextual search over tracked source files. */
import path from "node:path";
const STOP=new Set(("a o os as um uma uns umas de da do das dos para por no na nos nas e em com que qual onde como quando isso este esta esse essa oque sua seu " +
 "the an and or of in to from for with by on at is are be this that these those it its we you our your their into " +
 "returns return function const let var if else true false null undefined new export import async await public private static void number string boolean type interface readonly extends implements class").split(/\s+/));
const groups=[
 ["purchase","compra","comprar","compras","adquirir","purchase","purchases","buy","buying","shop","loja"],
 ["ps1","ps1","playstation1"],["ps2","ps2","playstation2"],
 ["save","save","saved","salvar","salvamento","persistencia","persistir","storage","serializar","partida"],
 ["load","load","loading","carregar","carregamento","restaurar","restore","importacao","importar","imported","importing"],
 ["queue","fila","filas","queue","queues","waiting","espera"],
 ["customer","cliente","clientes","customer","customers","visitor"],
 ["stock","estoque","mercadorias","mercadoria","stock","inventory","merchandise"],
 ["staff","funcionario","funcionarios","staff","employee","employees","worker"],
 ["power","energia","power","electricity","eletricidade","consumo"],
 ["printer","impressao","imprimir","impressora","printer","printing"],
 ["cleaning","limpeza","limpar","faxineiro","cleaning","cleaner"],
 ["mobile","mobile","celular","smartphone","telefone","touch"],
 ["furniture","moveis","movel","mobilia","furniture","placement","posicionamento"],
 ["audio","audio","som","sound","volume","musica","music"],
 ["simulation","simulacao","simular","simulator","simulation","engine","motor"],
 ["money","dinheiro","caixa","cash","money","revenue","receita","preco","price"],
 ["network","rede","internet","network","connection","conexao"],
 ["mail","correio","carta","cartas","mail","postal","inbox"],
 ["weather","clima","weather","chuva","rain"],
 ["render","desenho","render","rendering","canvas","draw"],
 ["admin","administracao","admin","management","gerenciamento"],
 ["license","licenca","licencas","licenciamento","license","licenses","licensing"],
 ["computer","computador","computadores","pc","pcs","computer","computers"],
 ["maintenance","manutencao","manter","reparar","reparo","maintenance","repair","service","servicing"],
 ["wear","desgaste","desgastado","wear","degradation","depreciation"],
 ["hardware","hardware","equipamento","equipamentos","peca","pecas","componentes","device","devices"],
 ["supplier","fornecedor","fornecedores","supplier","suppliers","vendor","vendors"],
 ["reputation","reputacao","avaliacao","reputation","rating","satisfacao","satisfaction"],
 ["panel","painel","paineis","panel","panels","dashboard","hud"],
 ["settings","configuracao","configuracoes","preferencias","preferences","settings","options","opcoes"],
 ["night","corujao","madrugada","noturno","noite","overnight","night"],
 ["cookie","cookie","cookies"],
 ["donation","doacao","doacoes","donation","donations","donate"],
 ["network","fibra","optica","fiber","fibre"],
 ["marketing","campanha","campanhas","divulgacao","promocao","marketing","campaign","advertising"],
 ["controls","controles","controle","control","controls","controller","controllers","botoes","botoes","button","buttons"],
 ["transfer","exportacao","exportar","exported","exporting","transferencia","transferir","transfer","download","baixar"],
 ["console","console","consoles","videogame","videogames"],
 ["pricing","precificacao","tarifa","tarifas","pricing","pricecap","teto"],
 ["mail","carteiro","correspondencia","correspondencias","courier","postman","delivery"],
 ["game","jogo","jogos","game","games","gaming"]
];
const aliases=new Map();
for(const [canonical,...words] of groups)for(const w of words)aliases.set(w,canonical);
const canonical=t=>aliases.get(t)??t;
export function tokenize(text){
 const clean=String(text??"")
  .replace(/([a-z0-9])([A-Z])/g,"$1 $2")
  .replace(/([A-Z])([A-Z][a-z])/g,"$1 $2")
  .normalize("NFKD").replace(/\p{M}/gu,"").toLowerCase();
 return (clean.match(/[\p{L}\p{N}]+/gu)??[])
  .filter(t=>t.length>=2&&t.length<=40&&!STOP.has(t));
}
export function queryTerms(query){
 if(typeof query!=="string"||query.length>180)throw Error("Query must be text up to 180 characters");
 const terms=[...new Set(tokenize(query).map(canonical))].slice(0,12);
 if(!terms.length)throw Error("Query needs meaningful search words");
 return terms;
}
export function contextFromSource(content,ext){
 // Do not emit raw code or string literal values into the downloadable index.
 const isDoc=[".md",".mdx",".txt"].includes(ext);
 const code=isDoc?content:content.replace(
  /"(?:\\.|[^"\\\r\n])*"|'(?:\\.|[^'\\\r\n])*'|\x60(?:\\.|[^\x60\\])*\x60/g," ");
 const counts=new Map();
 for(const word of tokenize(code).slice(0,12000)){
  const t=canonical(word);counts.set(t,Math.min(24,(counts.get(t)??0)+1));
 }
 const headings=[],comment=/^(?:\/\/\/?\s*|\/\*\*?\s*|\*\s*|#\s*|<!--\s*)(.+)/;
 for(const line of content.split(/\r?\n/).slice(0,240)){
  const candidate=(isDoc?/^(?:#{1,4}\s+|[-*]\s+)(.+)/.exec(line.trim())?.[1]:
   comment.exec(line.trim())?.[1])?.replace(/\*\/$|-->$/,"").trim();
  if(!candidate||candidate.length<12||candidate.length>180||
    /[<>{}=$]/.test(candidate)||tokenize(candidate).length<3)continue;
  headings.push(candidate.slice(0,140));
  if(headings.length===3)break;
 }
 for(const word of tokenize(headings.join(" "))){
  const t=canonical(word);counts.set(t,Math.min(24,(counts.get(t)??0)+1));
 }
 const terms=Object.fromEntries([...counts.entries()]
  .sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]))
  .slice(0,300).sort(([a],[b])=>a.localeCompare(b)));
 return {terms,headings};
}
const groupsIn=s=>[...new Set(tokenize(s).map(canonical))];
// Cache is per index object, never persisted in the GitHub artifact. A refreshed
// buildIndex creates a new object. Do not mutate index.files in place after use.
const preparedIndexes=new WeakMap();
function scoped(pathname,prefix){
 return !prefix||pathname===prefix||pathname.startsWith(prefix+"/");
}
export function prepareContextSearch(index){
 if(!index||typeof index!=="object"||!Array.isArray(index.files))
  throw Error("A valid indexed catalog is required");
 const cached=preparedIndexes.get(index);
 if(cached?.files===index.files&&cached.length===index.files.length)return cached;
 const postings=new Map();
 for(let id=0;id<index.files.length;id++){
  const file=index.files[id];
  const name=new Set(groupsIn(path.posix.basename(file.path)));
  const folder=new Set(groupsIn(path.posix.dirname(file.path).split("/").slice(-2).join(" ")));
  const symbols=new Set((file.symbols??[]).flatMap(s=>groupsIn(s.name)));
  const terms=new Set([...name,...folder,...symbols,...Object.keys(file.contextTerms??{})]);
  for(const term of terms){
   const tf=Object.hasOwn(file.contextTerms??{},term)?Number(file.contextTerms[term]):0;
   const record={id,tf:Number.isFinite(tf)&&tf>0?tf:0,
    filename:name.has(term),symbol:symbols.has(term),directory:folder.has(term)};
   const list=postings.get(term);
   if(list)list.push(record);
   else postings.set(term,[record]);
  }
 }
 const prepared={files:index.files,length:index.files.length,postings};
 preparedIndexes.set(index,prepared);
 return prepared;
}
export function searchContext(index,query,{prefix="",limit=15}={}){
 const terms=queryTerms(query);
 // PS1 and PS2 already identify console types. Generic console references
 // should not outweigh modules that implement the specific behavior.
 const requested=terms.some(t=>t==="ps1"||t==="ps2")
  ?terms.filter(t=>t!=="console"):terms;
 const max=Math.min(50,Math.max(1,Number(limit)||15));
 const prepared=prepareContextSearch(index);
 const total=prefix?index.files.reduce((n,f)=>n+(scoped(f.path,prefix)?1:0),0):index.files.length;
 if(!total)return [];
 // Each posting is a single matching file/term pair. Only walk relevant files:
 // no per-query CamelCase tokenization and no scanning all symbols.
 const candidates=new Map(),df=new Map();
 for(const term of requested){
  let documentFrequency=0;
  for(const posting of prepared.postings.get(term)??[]){
   const file=index.files[posting.id];
   if(!scoped(file.path,prefix))continue;
   documentFrequency++;
   let matches=candidates.get(posting.id);
   if(!matches){matches=new Map();candidates.set(posting.id,matches);}
   matches.set(term,posting);
  }
  df.set(term,documentFrequency);
 }
 const results=[];
 for(const [id,matches] of candidates){
  const file=index.files[id];
  let score=0;
  const evidence=[];
  for(const term of requested){
   const match=matches.get(term);
   if(!match)continue;
   const {tf,filename,symbol,directory}=match;
   const idf=1+Math.log(1+(total-(df.get(term)??0)+0.5)/((df.get(term)??0)+0.5));
   // Names and declared symbols are stronger ownership signals than
   // words mentioned repeatedly by aggregator or presentation modules.
   score+=idf*(Math.log2(1+Math.min(tf,8))*1.25+
    (filename?9:0)+(symbol?5:0)+(directory?0.35:0));
   evidence.push({term,where:filename?"filename":symbol?"symbol":tf?"source":"folder"});
  }
  const matched=matches.size;
  const names=[...matches.values()].filter(m=>m.filename).length;
  const declarations=[...matches.values()].filter(m=>m.symbol).length;
  // Reward coherent responsibility rather than pinning particular paths.
  const ownershipBoost=1+Math.max(0,names-1)*0.32+
   Math.max(0,declarations-1)*0.14;
  score*= (matched===requested.length?1.55:matched/requested.length)*ownershipBoost;
  results.push({path:file.path,score:Math.round(score*100)/100,
   matchedTerms:matched,queryTerms:requested.length,evidence,
   symbols:(file.symbols??[]).filter(s=>groupsIn(s.name).some(t=>matches.has(t))).slice(0,5),
   description:file.contextHeadings?.[0]??null});
 }
 return results.sort((a,b)=>b.score-a.score||b.matchedTerms-a.matchedTerms||
  a.path.localeCompare(b.path)).slice(0,max);
}
