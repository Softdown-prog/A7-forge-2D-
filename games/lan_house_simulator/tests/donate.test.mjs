import test from 'node:test';
import assert from 'node:assert/strict';
import {donatePage} from '../website/donate-view.mjs';
import {createDonateController,checkoutUrl} from '../website/donate-client.mjs';
import {createAccountClient} from '../website/account-client.mjs';

function page(){
 const nodes=new Map();function element(){return {textContent:'',disabled:false,hidden:false,checked:false,children:[],listeners:{},dataset:{},addEventListener(type,fn){this.listeners[type]=fn;},append(...items){this.children.push(...items);},replaceChildren(){this.children=[];},focus(){this.focused=true;},scrollIntoView(){}};}
 const buttons=['donate-5','donate-10'].map(packageId=>Object.assign(element(),{dataset:{donatePackage:packageId}}));
 const doc={location:{href:'https://site.example/donate/?status=approved&collection_status=approved'},getElementById(id){if(!nodes.has(id))nodes.set(id,element());return nodes.get(id);},querySelectorAll:()=>buttons,createElement:element};
 return {doc,nodes,buttons};
}
test('Donate explains amounts, account requirement and future cosmetics without internal details',()=>{
 const html=donatePage();for(const text of ['Doar R$ 5','Doar R$ 10','50','100','R$ 0,10','confirme seu email','ainda não está disponível','exclusivamente a melhorias'])assert.ok(html.includes(text),text);
 for(const internal of [/Cloud Run/i,/Firestore/i,/webhook/i,/access.token/i,/Mercado Pago/i,/\bAPI\b/])assert.doesNotMatch(html,internal);
 assert.equal((html.match(/<h1>/g)||[]).length,1);assert.equal((html.match(/id="account-app"/g)||[]).length,1);
});
test('only exact secure checkout hosts are accepted',()=>{
 assert.equal(new URL(checkoutUrl('https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=x')).hostname,'www.mercadopago.com.br');
 for(const url of ['javascript:alert(1)','https://evilmercadopago.com/x','https://www.mercadopago.com.br.evil/x','https://user:password@www.mercadopago.com.br/x'])assert.throws(()=>checkoutUrl(url));
});
test('disabled and sandbox configurations cannot initiate public payments',async()=>{
 for(const config of [{paymentsEnabled:false,paymentsMode:'production'},{paymentsEnabled:true,paymentsMode:'sandbox'}]){
  const p=page();let calls=0;const c=createDonateController({api:async()=>{calls++;}},{document:p.doc,request:async()=>new Response(JSON.stringify(config))});await c.initialize('https://api.example');c.setConnected(true);
  await p.buttons[0].listeners.click();assert.equal(p.buttons[0].disabled,true);assert.equal(calls,0);
 }
});
test('login and terms are required; retries reuse the idempotency key and return URL never grants credit',async()=>{
 const p=page(),calls=[];let ids=0;const c=createDonateController({api:async(path,body,retry,headers)=>{calls.push({path,body,headers});return path==='/v1/orders'&&body?{id:'order',url:'https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=x'}:{orders:[]};}},{document:p.doc,uuid:()=>`key-${++ids}`,request:async()=>new Response(JSON.stringify({paymentsEnabled:true,paymentsMode:'production'}))});
 await c.initialize('https://api.example');await p.buttons[0].listeners.click();assert.equal(calls.length,0);assert.equal(p.nodes.get('account-email').focused,true);
 c.setConnected(true);await p.buttons[0].listeners.click();assert.equal(calls.length,0);
 p.doc.getElementById('donate-terms').checked=true;await p.buttons[0].listeners.click();await p.buttons[0].listeners.click();
 const orders=calls.filter(c=>c.body);assert.equal(orders.length,2);assert.equal(ids,1);assert.deepEqual(orders[0].body,{packageId:'donate-5',acceptedTerms:true});assert.equal(orders[0].headers['Idempotency-Key'],orders[1].headers['Idempotency-Key']);assert.equal(p.doc.getElementById('donate-checkout').hidden,false);
 assert.equal(calls.some(c=>c.path.includes('approved')),false);assert.equal(p.doc.getElementById('cookies-balance').textContent,'');
 c.setConnected(false);assert.equal(p.doc.getElementById('donate-checkout').hidden,true);
});
test('token refresh preserves the same order idempotency header',async()=>{
 const headers=[];let attempts=0;const json=(data,status=200)=>new Response(JSON.stringify(data),{status});
 const client=createAccountClient({apiUrl:'https://api.example',firebaseApiKey:'public-test'},{request:async(url,options)=>{
  if(url.includes('signInWithPassword'))return json({idToken:'old',refreshToken:'refresh'});
  if(url.includes('lookup'))return json({users:[{emailVerified:true}]});
  if(url.includes('securetoken'))return json({id_token:'fresh',refresh_token:'refresh'});
  headers.push(options.headers);return ++attempts===1?json({error:'Expired'},401):json({id:'order'});
 }});
 await client.signIn('player@example.invalid','test-only');await client.api('/v1/orders',{packageId:'donate-5'},false,{'Idempotency-Key':'stable-key'});
 assert.deepEqual(headers.map(h=>h['Idempotency-Key']),['stable-key','stable-key']);assert.equal(headers[1].Authorization,'Bearer fresh');
});
