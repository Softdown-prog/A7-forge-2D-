import {Injectable} from '@nestjs/common';
import type {NestMiddleware} from '@nestjs/common';
import type {NextFunction,Request,Response} from 'express';

/** Mirror the exact, case-sensitive Express ALLOWED_ORIGINS allowlist. */
@Injectable()
export class OriginPolicyMiddleware implements NestMiddleware{
 private readonly origins=new Set((process.env.ALLOWED_ORIGINS??'').split(',').filter(Boolean));
 use(request:Request,response:Response,next:NextFunction):void{
  const origin=request.headers.origin;
  if(origin!==undefined){
   if(typeof origin!=='string'||!this.origins.has(origin)){
    response.status(403).json({error:'Origem não autorizada.'});
    return;
   }
   response.setHeader('Access-Control-Allow-Origin',origin);
   response.setHeader('Vary','Origin');
   response.setHeader('Access-Control-Allow-Headers',
    'Authorization, Content-Type, Idempotency-Key, X-LHS-Sandbox-Only');
   response.setHeader('Access-Control-Allow-Methods','GET, POST, OPTIONS');
  }
  if(request.method==='OPTIONS'){response.status(204).end();return;}
  next();
 }
}
