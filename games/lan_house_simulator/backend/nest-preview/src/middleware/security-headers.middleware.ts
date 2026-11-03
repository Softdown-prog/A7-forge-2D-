import {Injectable} from '@nestjs/common';
import type {NestMiddleware} from '@nestjs/common';
import type {NextFunction,Request,Response} from 'express';

/** Same no-store/nosniff baseline as the current Express server. */
@Injectable()
export class SecurityHeadersMiddleware implements NestMiddleware{
 use(_request:Request,response:Response,next:NextFunction):void{
  response.setHeader('Cache-Control','no-store');
  response.setHeader('X-Content-Type-Options','nosniff');
  next();
 }
}
