/** Bounded, zero-cost lexical contextual search over tracked source files. */
import path from "node:path";
const STOP=new Set(("a o os as um uma uns umas de da do das dos para por no na nos nas e em com que qual onde como quando isso este esta esse essa oque sua seu " +
 "the an and or of in to from for with by on at is are be this that these those it its we you our your their into " +
 "returns return function const let var if else true false null undefined new export import async await public private static void number string boolean type interface readonly extends implements class").split(/\s+/));
const groups=[
 ["purchase","compra","comprar","compras","adquirir","purchase","purchases","buy","buying","shop","loja"],
 ["ps1","ps1","playstation1"],["ps2","ps2","playstation2"],
 ["save","save","saved","salvar","salvamento","persistencia","persistir","storage","serializar"],
 ["load","load","loading","carregar","carregamento","restaurar","restore","importacao","importar"],
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
export function searchContext(index,query,{prefix="",limit=15}={}){
 const requested=queryTerms(query),max=Math.min(50,Math.max(1,Number(limit)||15));
 const files=index.files.filter(f=>!prefix||f.path===prefix||f.path.startsWith(prefix+"/"));
 const df=new Map(requested.map(t=>[t,0])),total=Math.max(1,files.length);
 const fields=files.map(f=>({
  file:f,
  name:new Set(groupsIn(path.posix.basename(f.path))),
  folder:new Set(groupsIn(path.posix.dirname(f.path).split("/").slice(-2).join(" "))),
  symbols:new Set((f.symbols??[]).flatMap(s=>groupsIn(s.name)))
 }));
 for(const {file,name,symbols,folder} of fields)for(const t of requested){
  if(file.contextTerms?.[t]||name.has(t)||symbols.has(t)||folder.has(t))
   df.set(t,df.get(t)+1);
 }
 const results=[];
 for(const {file,name,symbols,folder} of fields){
  let score=0,matched=0;
  const evidence=[];
  for(const t of requested){
   const count=Number(file.contextTerms?.[t]??0);
   const filename=name.has(t),symbol=symbols.has(t),directory=folder.has(t);
   if(!count&&!filename&&!symbol&&!directory)continue;
   matched++;
   const idf=1+Math.log(1+(total-(df.get(t)??0)+0.5)/((df.get(t)??0)+0.5));
   score+=idf*(Math.log2(1+count)*1.8+(filename?5:0)+(symbol?3:0)+(directory?0.6:0));
   evidence.push({term:t,where:filename?"filename":symbol?"symbol":count?"source":"folder"});
  }
  if(!matched)continue;
  score*=matched===requested.length?1.55:matched/requested.length;
  results.push({path:file.path,score:Math.round(score*100)/100,
   matchedTerms:matched,queryTerms:requested.length,evidence,
   symbols:(file.symbols??[]).filter(s=>groupsIn(s.name).some(t=>requested.includes(t))).slice(0,5),
   description:file.contextHeadings?.[0]??null});
 }
 return results.sort((a,b)=>b.score-a.score||b.matchedTerms-a.matchedTerms||
  a.path.localeCompare(b.path)).slice(0,max);
}
