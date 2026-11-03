import {createPreviewApp} from './bootstrap.js';

/** Opt-in and loopback-only. Production and unconfigured starts fail closed. */
if(process.env.LHS_NEST_PREVIEW_ENABLED!=='1'||process.env.NODE_ENV==='production')
 throw new Error('Prévia NestJS desativada; o backend Express permanece canônico.');
const port=Number(process.env.LHS_NEST_PREVIEW_PORT??18080);
if(!Number.isInteger(port)||port<1024||port>65535)
 throw new Error('Porta inválida para a prévia NestJS.');
const app=await createPreviewApp();
await app.listen(port,'127.0.0.1');
