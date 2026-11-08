import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {PUBLIC_ROUTES} from '../scripts/audit_clean_angular_cutover.mjs';

const root=resolve(import.meta.dirname,'..');
const read=file=>readFileSync(resolve(root,file),'utf8');
const catalog=JSON.parse(read('frontend-angular/src/site-rewrite/game-guides/guide-catalog.json'));
const metadata=JSON.parse(read('frontend-angular/src/site-rewrite/page-metadata.json'));

test('guide catalog has continuous sequential numbering from 1 to N with unique 3-digit IDs and slugs',()=>{
 assert.equal(catalog.length,38,'Expected 38 comprehensive player manual guides');
 const ids=new Set(),slugs=new Set(),paths=new Set();
 catalog.forEach((item,index)=>{
  const expectedNumber=index+1;
  const expectedId=String(expectedNumber).padStart(3,'0');
  assert.equal(item.number,expectedNumber,'Sequential number mismatch at index '+index);
  assert.equal(item.id,expectedId,'3-digit ID mismatch for guide '+expectedNumber);
  assert.match(item.slug,/^[a-z0-9]+(?:-[a-z0-9]+)*$/,'Invalid slug: '+item.slug);
  const expectedPath='/sobre-o-jogo/guias/'+expectedId+'-'+item.slug+'/';
  assert.equal(item.path,expectedPath,'Canonical route mismatch for '+item.id);
  assert.ok(item.title.length>=15,'Guide title too short: '+item.id);
  assert.ok(item.summary.length>=40,'Guide summary too short: '+item.id);
  assert.ok(item.unlockBadge.length>=5,'Missing unlock badge: '+item.id);
  assert.ok(item.uiPath.length>=5,'Missing UI path: '+item.id);
  assert.equal(ids.has(item.id),false,'Duplicate guide ID: '+item.id);
  assert.equal(slugs.has(item.slug),false,'Duplicate guide slug: '+item.slug);
  assert.equal(paths.has(item.path),false,'Duplicate guide path: '+item.path);
  ids.add(item.id);
  slugs.add(item.slug);
  paths.add(item.path);
 });
});

test('all 15 thematic groups A through O are covered and every guide has full editorial sections',()=>{
 const moduleSources=[
  read('frontend-angular/src/site-rewrite/game-guides/guides-a-c.ts'),
  read('frontend-angular/src/site-rewrite/game-guides/guides-d-h.ts'),
  read('frontend-angular/src/site-rewrite/game-guides/guides-i-l.ts'),
  read('frontend-angular/src/site-rewrite/game-guides/guides-m-o.ts')
 ].join('\n');
 const groups=new Set(catalog.map(item=>item.groupCode));
 assert.deepEqual([...groups],['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O']);
 const validIds=new Set(catalog.map(item=>item.id));
 for(const item of catalog){
  assert.ok(moduleSources.includes("id:'"+item.id+"'"),'Missing full guide implementation for '+item.id);
  assert.ok(moduleSources.includes("slug:'"+item.slug+"'"),'Missing slug in guide implementation for '+item.id);
  assert.ok(moduleSources.includes("path:'"+item.path+"'"),'Missing path in guide implementation for '+item.id);
 }
 for(const field of [
  'whatIs:[','whyItMatters:[','whenAvailable:[','howToUse:[',
  'whatHappensNext:[','costsAndLimits:[','commonProblems:[','playerTips:[','relatedIds:['
 ]){
  assert.equal((moduleSources.match(new RegExp(field.replace('[','\\['),'g'))||[]).length,catalog.length,
   'Every guide must define '+field);
 }
 const relatedMatches=[...moduleSources.matchAll(/relatedIds:\[([^\]]+)\]/g)];
 assert.equal(relatedMatches.length,catalog.length);
 relatedMatches.forEach((match,idx)=>{
  const currentId=catalog[idx].id;
  const refs=[...match[1].matchAll(/'(\d{3})'/g)].map(m=>m[1]);
  assert.ok(refs.length>=3,'Guide '+currentId+' must link to at least 3 related guides');
  for(const ref of refs){
   assert.ok(validIds.has(ref),'Broken related guide reference '+ref+' in guide '+currentId);
   assert.notEqual(ref,currentId,'Guide '+currentId+' should not reference itself in relatedIds');
  }
 });
 // Ensure no developer jargon or forbidden patterns leak into tutorial texts
 assert.doesNotMatch(moduleSources,/<script\b|<iframe\b|\[innerHTML\]|fetch\(|onclick=|website\/|react-entry|stationId|historicalEconomy|topGamesMagazines|customerLifecycle|simulationState|>=\s*\d|<=\s*\d|\.[A-ZÀ-Ú]/);
});

test('AboutGameComponent preserves original /sobre-o-jogo/ content and exposes the numbered manual index',()=>{
 const aboutTs=read('frontend-angular/src/site-rewrite/about-game.ts');
 const aboutHtml=read('frontend-angular/src/site-rewrite/about-game.html');
 const guideHtml=read('frontend-angular/src/site-rewrite/game-guides/guide-page.html');
 const guideTs=read('frontend-angular/src/site-rewrite/game-guides/guide-page.ts');
 const appTs=read('frontend-angular/src/site-rewrite/site-app.ts');
 const appHtml=read('frontend-angular/src/site-rewrite/site-app.html');
 const siteData=read('frontend-angular/src/site-rewrite/site-data.ts');

 assert.match(aboutHtml,/Manual do Jogador — Todas as mecânicas explicadas/);
 assert.equal((aboutHtml.match(/<h1\b/g)||[]).length,1,'About page must keep a single H1');
 assert.equal((aboutHtml.match(/class="about-feature"/g)||[]).length,6,'Original 6 feature cards must remain intact');
 assert.match(aboutHtml,/\[href\]="item\.path"/);
 assert.match(aboutTs,/readonly guideGroups=GAME_GUIDE_GROUPS/);

 assert.equal((guideHtml.match(/<h1\b/g)||[]).length,1,'Each guide page template must render exactly one H1');
 for(const heading of [
  '1. O que é?','2. Por que isso importa?','3. Quando fica disponível?',
  '4. Como utilizar?','5. O que acontece depois?','6. Custos e limitações',
  '7. Problemas comuns','8. Dicas para o jogador','9. Assuntos relacionados'
 ])assert.ok(guideHtml.includes(heading),'Missing mandatory tutorial section heading: '+heading);

 assert.match(guideHtml,/href="\/sobre-o-jogo\/#manual-do-jogador"/);
 assert.match(guideHtml,/Guia anterior/);
 assert.match(guideHtml,/Próximo guia/);
 assert.match(guideTs,/selector:'lhs-game-guide'/);
 assert.match(guideTs,/ChangeDetectionStrategy\.OnPush/);
 assert.match(appTs,/import \{GameGuideComponent\} from '\.\/game-guides\/guide-page'/);
 assert.match(appHtml,/<lhs-game-guide \[path\]="path"><\/lhs-game-guide>/);

 for(const item of catalog){
  assert.ok(siteData.includes("'"+item.path+"'"),'Missing guide path in site-data.ts: '+item.path);
  assert.ok(PUBLIC_ROUTES.includes(item.path),'Missing guide path in PUBLIC_ROUTES: '+item.path);
  assert.ok(metadata[item.path]?.title?.startsWith(item.number+'. '),'Missing or unnumbered metadata title for '+item.path);
  assert.equal(metadata[item.path]?.description,item.summary,'Metadata description mismatch for '+item.path);
 }
});
