import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';

/** Player-facing facts must match the actual simulation, not old design notes. */
const root=resolve(import.meta.dirname,'..');
const read=file=>readFileSync(resolve(root,file),'utf8');
const sim=name=>read('src/sim/'+name+'.ts');
const guideDir='frontend-angular/src/site-rewrite/game-guides/';
const guideSources=['guides-a-c.ts','guides-d-h.ts','guides-i-l.ts','guides-m-o.ts']
 .map(file=>read(guideDir+file)).join('\n');
const catalog=JSON.parse(read(guideDir+'guide-catalog.json'));
const metadata=JSON.parse(read('frontend-angular/src/site-rewrite/page-metadata.json'));

function guide(number){
 const begin=guideSources.indexOf('\n {\n  number:'+number+',');
 assert.notEqual(begin,-1,'Missing guide '+number);
 const end=guideSources.indexOf('\n }',begin);
 assert.notEqual(end,-1,'Unterminated guide '+number);
 return guideSources.slice(begin,end+3);
}
function field(body,key){
 const line=body.split('\n').find(s=>s.startsWith('  '+key+':'));
 assert.ok(line,'Missing '+key);
 const raw=line.slice(key.length+3).trim().replace(/,$/,'');
 return raw.startsWith('"')?JSON.parse(raw):raw.slice(1,-1).replace(/\\'/g,"'");
}
function table(number){
 const match=guide(number).match(/\n  table:(\{[\s\S]*?\n  \}),/);
 assert.ok(match,'Missing authoritative catalog table in guide '+number);
 return JSON.parse(match[1]);
}
function sourceEntries(filename,constant){
 const source=sim(filename);
 const list=source.match(new RegExp('export const '+constant+'=\\[([\\s\\S]*?)\\] as const;'));
 assert.ok(list,'Missing source catalog '+constant);
 return [...list[1].matchAll(/\{id:"([^"]+)",title:"([^"]+)",genre:"([^"]+)",basePrice:(\d+),releaseYear:(\d+)\}/g)]
  .map(([,id,title,genre,basePrice,releaseYear])=>({id,title,genre,basePrice:+basePrice,year:+releaseYear}));
}
const ps1=sourceEntries('ps1','PS1_CD_CATALOG');
const ps2=sourceEntries('ps2','PS2_GAME_CATALOG');
const money=n=>'R$ '+n.toFixed(2).replace('.',',');
const issueMonths=new Map();
const issues=[...ps1,...ps2].map((game,index)=>{
 const month=(issueMonths.get(game.year)??0)+1;
 issueMonths.set(game.year,month);
 return {...game,number:index+1,month};
});
const months=['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
const expectedRows=games=>games.map(game=>{
 const issue=issues.find(v=>v.id===game.id);
 assert.ok(issue);
 return [game.title,String(game.year),money(game.basePrice),game.genre,
  'Top Games #'+issue.number+' — '+months[issue.month-1]+'/'+issue.year];
});

test('PS1 and PS2 public catalogs match all 28 real game titles, years, prices and individual magazine issues',()=>{
 assert.equal(ps1.length,13);
 assert.equal(ps2.length,15);
 assert.equal(issues.length,28);
 assert.deepEqual(table(20).rows,expectedRows(ps1));
 assert.deepEqual(table(21).rows,expectedRows(ps2));
 assert.match(sim('ps1'),/PS1_MAX_STATIONS=3/);
 assert.match(sim('ps2'),/PS2_MAX_STATIONS=3/);
 assert.match(guide(20),/máximo de 3 bancadas|limite de 3 bancadas|limite implementado é de três bancadas/i);
 assert.match(guide(21),/limite de 3 bancadas|máximo de três bancadas/i);
 assert.doesNotMatch(guide(20),/4 bancadas|Copa de Bairro 99/);
 assert.doesNotMatch(guide(21),/4 bancadas|Clássico de Domingo 2006/);
 assert.match(sim('topGamesMagazines'),/TOP_GAMES_ISSUES:[\s\S]*?catalogue\.map/);
 assert.match(guide(22),/uma revista individual para cada jogo/i);
 assert.match(guide(22),/R\$ 12,00/);
 assert.match(sim('topGamesMagazines'),/TOP_GAMES_MONTHLY_BASE_PRICE=12/);
});

test('12 merchandise rows and unlock years correspond exactly to PRODUCTS in the game engine',()=>{
 const actual=sim('merchandise');
 const list=actual.match(/export const PRODUCTS = \[([\s\S]*?)\] as const;/);
 assert.ok(list);
 const entries=[...list[1].matchAll(/\{id:'([^']+)',name:'([^']+)',category:'([^']+)',year:(\d+),price:([\d.]+),packCost:([\d.]+),pack:(\d+),/g)]
  .map(([,id,name,category,year,price,packCost,pack])=>({id,name,category,year:+year,price:+price,packCost:+packCost,pack:+pack}));
 assert.equal(entries.length,12);
 assert.equal(entries.filter(x=>x.year===1998).length,8);
 const categories={soda:'Bebidas',candy:'Doces',snacks:'Salgadinhos'};
 assert.deepEqual(table(24).rows,entries.map(p=>[p.name,categories[p.category],
  String(p.year),String(p.pack)+' un.',money(p.packCost),money(p.price)]));
 assert.doesNotMatch(guide(24),/12 produtos detalhados liberados no ano 2000|12 mercadorias liberadas no ano 2000/i);
});

test('VIP, promotion, staffing and printing tutorials reject unsupported bonuses and prices',()=>{
 assert.match(sim('vip'),/if\(rep<55\)return false/);
 assert.match(sim('vip'),/rep>=85\?19:rep>=70\?12:7/);
 assert.match(guide(32),/reputação 55/);
 assert.match(guide(32),/não aplica um bônus fixo de cobrança/i);
 assert.match(sim('promotion'),/PROMOTION_VISITOR_MULTIPLIER = 1\.4/);
 assert.match(sim('promotion'),/PROMOTION_COST = 120/);
 assert.match(guide(30),/40%/);
 assert.match(guide(30),/somente no dia/);
 assert.doesNotMatch(guide(30),/\+28%|3 dias/);
 assert.match(sim('staff'),/cleaner:cleanerWage,technician:technicianWage/);
 assert.match(sim('staff'),/monthlyWage1998 as cleanerWage/);
 assert.match(sim('staff'),/monthlyWage1998 as technicianWage/);
 assert.match(sim('characters/cleaner'),/monthlyWage1998=210/);
 assert.match(sim('characters/technician'),/monthlyWage1998=330/);
 assert.match(guide(25),/R\$ 7,00 por dia/);
 assert.match(guide(25),/R\$ 11,00 por dia/);
 assert.match(sim('printService'),/PRINT_PAGES_PER_DAY=35/);
 assert.match(guide(26),/35 páginas por dia/);
 assert.match(sim('discCopy'),/DISC_COPIER_YEAR=2001/);
 assert.match(sim('discCopy'),/DISC_COPIES_PER_DAY=24/);
 assert.match(guide(27),/a partir de 2001/);
 assert.match(guide(27),/24 cópias por dia/);
});

test('all 38 guide catalog titles and public page descriptions match their complete articles',()=>{
 assert.equal(catalog.length,38);
 const keys=['id','slug','path','groupCode','groupTitle','title','summary','unlockBadge','uiPath'];
 for(const item of catalog){
  const body=guide(item.number);
  for(const key of keys){
   assert.equal(item[key],field(body,key),'Catalog mismatch in guide '+item.number+' field '+key);
  }
  assert.equal(metadata[item.path]?.title,
   item.number+'. '+item.title+' — Manual do Jogador');
  assert.equal(metadata[item.path]?.description,item.summary);
 }
});
