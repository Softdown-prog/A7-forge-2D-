import {randomUUID} from 'node:crypto';
import {Injectable} from '@nestjs/common';
import type {NestMiddleware} from '@nestjs/common';
import type {NextFunction,Request,Response} from 'express';

/** Separate from Mercado Pago's signed X-Request-Id; never trust caller IDs. */
@Injectable()
export class TraceMiddleware implements NestMiddleware{
 use(_request:Request,response:Response,next:NextFunction):void{
  response.setHeader('X-LHS-Trace-Id',randomUUID());
  next();
 }
}
