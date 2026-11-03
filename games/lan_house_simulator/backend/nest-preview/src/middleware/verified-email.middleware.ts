import {Injectable} from '@nestjs/common';
import type {NestMiddleware} from '@nestjs/common';
import type {NextFunction,Response} from 'express';
import type {PreviewAuthenticatedRequest} from './firebase-auth.middleware.js';

/** Preserve Express email_verified gate before optional user quota checks. */
@Injectable()
export class VerifiedEmailMiddleware implements NestMiddleware{
 use(request:PreviewAuthenticatedRequest,response:Response,next:NextFunction):void{
  if(request.authToken?.email_verified!==true){
   response.status(403).json({error:'Confirme seu email antes de usar a nuvem.'});
   return;
  }
  next();
 }
}
