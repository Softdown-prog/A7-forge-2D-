import {chromium} from "playwright";
import {spawn} from "node:child_process";
import {resolve} from "node:path";
import assert from "node:assert/strict";
const serve=spawn(process.execPath,[resolve(import.meta.dirname,"serve.mjs")],{stdio:["ignore","pipe","inherit"]});
let browser;
try{
 await new Promise((ok,fail)=>{serve.stdout.once("data",ok);serve.once("error",fail);});
 browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
 for(const width of [390,1280])for(const choice of ["accept","reject"]){
  const context=await browser.newContext({viewport:{width,height:820}});
  const page=await context.newPage(),errors=[];
  page.on("pageerror",error=>errors.push(String(error)));
  await page.goto("http://127.0.0.1:4173/",{waitUntil:"domcontentloaded"});
  const banner=page.locator("#privacy-banner"),choiceButton=page.locator("#privacy-"+choice);
  await banner.waitFor({state:"visible"});
  assert.equal(await page.locator("#privacy-settings").count(),0,"No floating privacy button should remain");
  await choiceButton.click();
  await banner.waitFor({state:"hidden"});
  const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem("lhs.privacy-choice.v1")??"null"));
  assert.equal(stored.choice,choice==="accept"?"accepted":"rejected");
  await page.reload({waitUntil:"domcontentloaded"});
  await banner.waitFor({state:"hidden"});
  // Existing decision remains hidden until the 30-day expiry.
  await page.evaluate(()=>{
   const key="lhs.privacy-choice.v1",data=JSON.parse(localStorage.getItem(key));
   data.at=Date.now()-30*24*60*60*1000-1;
   localStorage.setItem(key,JSON.stringify(data));
  });
  await page.reload({waitUntil:"domcontentloaded"});
  await banner.waitFor({state:"visible"});
  await page.evaluate(()=>localStorage.clear());
  await page.reload({waitUntil:"domcontentloaded"});
  await banner.waitFor({state:"visible"});
  assert.deepEqual(errors,[],"No client JS errors");
  console.log(JSON.stringify({width,choice,persistent:true,expiresAfter30Days:true,clearedStorage:true,noFloatingButton:true}));
  await context.close();
 }
}finally{await browser?.close();serve.kill();}
