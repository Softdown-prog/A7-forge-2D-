import test from 'node:test';
import assert from 'node:assert/strict';
import {buildSync} from 'esbuild';
const source=new URL('../frontend-angular/src/site-rewrite/donate-history.ts',import.meta.url).pathname;
const bundle=buildSync({entryPoints:[source],bundle:true,format:'esm',platform:'node',write:false});
const {readDonateOrders,returnedOrderId}=await import('data:text/javascript;base64,'+
 Buffer.from(bundle.outputFiles[0].text).toString('base64'));
const example={id:'a'.repeat(64),priceCents:500,cookies:50,status:'approved',mode:'production'};
test('typed history models only provider summaries, never browser URL data',()=>{
 const parsed=readDonateOrders({orders:[example,{...example,id:'b'.repeat(64),status:'refunded',mode:'sandbox'}]});
 assert.equal(parsed.length,2);
 assert.equal(parsed[0].statusLabel,'Pagamento aprovado pelo provedor');
 assert.equal(parsed[1].statusLabel,'Reembolsado');
 assert.equal(parsed[1].mode,'sandbox');
 assert.equal(parsed[0].id,example.id);
 assert.ok(!JSON.stringify(parsed).includes('checkoutUrl'));
 assert.deepEqual(readDonateOrders({orders:[]}),[]);
});
for(const bad of [null,{}, {orders:{}},{orders:Array(11).fill(example)},
 {orders:[{...example,id:'../wrong'}]},
 {orders:[{...example,mode:'unsafe'}]},
 {orders:[{...example,priceCents:-1}]},
 {orders:[{...example,cookies:1.5}]},
 {orders:[{...example,status:42}]},
 {orders:[{...example,id:'<script>alert(1)</script>'}]}
])test('invalid order responses never become UI state',()=>{
 assert.throws(()=>readDonateOrders(bad));
});
test('unrecognized provider statuses are never falsely labeled paid',()=>{
 assert.equal(readDonateOrders({orders:[{...example,status:'unexpected'}]})[0].statusLabel,
 'Status não reconhecido');
});

test('return parameters are references only, reject ambiguous or invalid order IDs',()=>{
 const id='a'.repeat(64);
 assert.equal(returnedOrderId('?order='+id+'&status=approved'),id);
 for(const query of ['', '?status=approved','?order=bad','?order='+id+'&order='+id,'?order='+id.toUpperCase()])
  assert.equal(returnedOrderId(query),null);
});
