import {Inject,Injectable} from '@nestjs/common';
import type {NestMiddleware} from '@nestjs/common';
import type {NextFunction,Response} from 'express';
import {QuotaExceededError,USER_QUOTA_PORT} from '../user-quota.js';
import type {UserQuotaPort} from '../user-quota.js';
import type {PreviewAuthenticatedRequest} from './firebase-auth.middleware.js';

/** After Firebase Auth and verified-email only. Fail closed on missing database. */
@Injectable()
export class UserQuotaMiddleware implements NestMiddleware{
 constructor(@Inject(USER_QUOTA_PORT) private readonly quota:UserQuotaPort){}

 async use(request:PreviewAuthenticatedRequest,response:Response,next:NextFunction):Promise<void>{
  if(typeof request.uid!=='string'||request.uid.length===0){
   response.status(401).json({error:'Sessão inválida ou expirada.'});
   return;
  }
  if(request.authToken?.email_verified!==true){
   response.status(403).json({error:'Confirme seu email antes de usar a nuvem.'});
   return;
  }
  try{
   await this.quota.reserve(request.uid);
  }catch(error){
   if(error instanceof QuotaExceededError)
    response.status(429).json({error:'Muitas solicitações. Tente novamente em um minuto.'});
   else
    response.status(503).json({error:'Serviço temporariamente indisponível.'});
   return;
  }
  next();
 }
}
