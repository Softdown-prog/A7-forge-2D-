import {sourceModule,assertCompositionAdaptersExclude} from "./helpers/composition.mjs";
import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createGame,isValidSave} from "../dist/js/sim/engine.js";
import {LCD_CATALOG} from "../dist/js/sim/computerModels.js";
import {createLcdPreviewSample} from "../dist/js/application/lcdPreviewSamplePort.js";
import {createLcdPreviewCache} from "../dist/js/ui/lcdPreviewCache.js";

function fixture(){
 const paints=[],surfaces=[],created=[];
 let available=true;
 const doc={createElement:tag=>{
  created.push(tag);
  const context={fillStyle:"",fillRect:()=>{}};
  const surface={width:0,height:0,tag,context,
   getContext:kind=>kind==="2d"&&available?context:null,
   toDataURL:()=>{assert.equal(surface.width,320);assert.equal(surface.height,190);
    return "data:image/png;catalog="+surfaces.indexOf(surface);
   }};
  surfaces.push(surface);return surface;
 }};
 const draw=(ctx,sample)=>paints.push({ctx,sample});
 return {cache:createLcdPreviewCache(doc,createLcdPreviewSample,draw),
  doc,paints,surfaces,created,setAvailable:value=>available=value};
}
test("cada modelo recebe PC de geração 3 e modelo LCD solicitado",()=>{
 for(const entry of LCD_CATALOG){
  const state=createLcdPreviewSample(entry.id);
  assert.deepEqual(state.pcTiers,[3,3,3]);
  assert.deepEqual(state.pcLcdModels,[entry.id,null,null]);
 }
});
test("miniatura não compartilha referência com a partida ativa",()=>{
 const active=createGame(1024),before=JSON.stringify(active);
 const sample=createLcdPreviewSample(LCD_CATALOG[0].id);
 assert.notEqual(sample,active);
 assert.equal(JSON.stringify(active),before);
 assert.ok(isValidSave(active));
});
test("preparar modelos distintos não reutiliza estado de simulação",()=>{
 const a=createLcdPreviewSample(LCD_CATALOG[0].id);
 const b=createLcdPreviewSample(LCD_CATALOG[1].id);
 a.pcTiers[0]=5;
 assert.equal(b.pcTiers[0],3);
 assert.notEqual(a.pcLcdModels[0],b.pcLcdModels[0]);
});
test("miniatura usa canvas de 320 por 190 e contexto 2D",()=>{
 const x=fixture(),result=x.cache(LCD_CATALOG[0].id);
 assert.match(result,/^data:image\/png/);
 assert.deepEqual(x.created,["canvas"]);
 assert.equal(x.surfaces[0].width,320);
 assert.equal(x.surfaces[0].height,190);
});
test("primeira chamada desenha com estado descartável correto",()=>{
 const x=fixture(),id=LCD_CATALOG[0].id;
 x.cache(id);
 assert.equal(x.paints.length,1);
 assert.deepEqual(x.paints[0].sample.pcLcdModels,[id,null,null]);
 assert.equal(x.paints[0].ctx,x.surfaces[0].context);
});
test("segunda chamada com o mesmo modelo usa cache sem criar canvas",()=>{
 const x=fixture(),id=LCD_CATALOG[0].id;
 const a=x.cache(id),b=x.cache(id);
 assert.equal(a,b);assert.equal(x.surfaces.length,1);assert.equal(x.paints.length,1);
});
test("modelos diferentes recebem imagens e amostras diferentes",()=>{
 const x=fixture(),a=x.cache(LCD_CATALOG[0].id),b=x.cache(LCD_CATALOG[1].id);
 assert.notEqual(a,b);assert.equal(x.surfaces.length,2);
 assert.notEqual(x.paints[0].sample,x.paints[1].sample);
});
test("contexto não disponível devolve vazio e permite retentar",()=>{
 const x=fixture();x.setAvailable(false);
 assert.equal(x.cache(LCD_CATALOG[0].id),"");
 assert.equal(x.paints.length,0);
 x.setAvailable(true);
 assert.match(x.cache(LCD_CATALOG[0].id),/^data:image\/png/);
 assert.equal(x.surfaces.length,2);
});
test("cache fica isolado por instância da tela",()=>{
 const a=fixture(),b=fixture(),id=LCD_CATALOG[0].id;
 a.cache(id);b.cache(id);
 assert.equal(a.surfaces.length,1);assert.equal(b.surfaces.length,1);
});
test("falha de desenho não registra imagem incompleta no cache",()=>{
 const calls=[],context={};
 const doc={createElement:()=>({
  width:0,height:0,getContext:()=>context,toDataURL:()=>"data:valid"
 })};
 let attempt=0;
 const cache=createLcdPreviewCache(doc,()=>({}),()=>{calls.push(++attempt);
  if(attempt===1)throw Error("Canvas");
 });
 assert.throws(()=>cache("lcd05"),/Canvas/);
 assert.equal(cache("lcd05"),"data:valid");
 assert.deepEqual(calls,[1,2]);
});
test("cache devolve uma imagem previamente criada mesmo que o contexto desapareça",()=>{
 const x=fixture(),id=LCD_CATALOG[0].id,first=x.cache(id);
 x.setAvailable(false);
 assert.equal(x.cache(id),first);
 assert.equal(x.surfaces.length,1);
});
test("apresentação não importa motor nem mantém save",()=>{
 const root=new URL("../src/",import.meta.url);
 const ui=readFileSync(new URL("ui/lcdPreviewCache.ts",root),"utf8");
 const app=readFileSync(new URL("application/lcdPreviewSamplePort.ts",root),"utf8");
 const render=readFileSync(new URL("render/lcdPreviewArtwork.ts",root),"utf8");
 assert.doesNotMatch(ui,/from\s*["']\.\.\/(?:sim|application|render|audio)\//);
 assert.doesNotMatch(ui,/\b(GameState|localStorage|stepGame|save\(|new SceneRenderer)\b/);
 assert.match(app,/sample\.pcTiers=\[3,3,3\]/);
 assert.match(app,/sample\.pcLcdModels=\[id,null,null\]/);
 assert.match(render,/drawRetroComputer\(context,/);
});
test("main injeta o renderer e mantém o mesmo painel administrativo",()=>{
 assert.match(sourceModule("bootstrap/bootstrapGame.ts"),/const lcdPreview=createLcdPreviewCache\(document,createLcdPreviewSample,drawLcdPreviewArtwork\)/);
 assert.match(sourceModule("ui/gamePanels.ts"),/renderLcdMonitorsPanel\(host,lcdMonitorsPort\.snapshot\(state\.selection\.selectedLcdPc\),lcdPreview,document\)/);
 assertCompositionAdaptersExclude(/const lcdPreviews=new Map/);
});
