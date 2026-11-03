import {MiddlewareConsumer,Module,RequestMethod} from '@nestjs/common';
import type {NestModule} from '@nestjs/common';
import {OriginPolicyMiddleware} from './middleware/origin-policy.middleware.js';
import {SecurityHeadersMiddleware} from './middleware/security-headers.middleware.js';
import {TraceMiddleware} from './middleware/trace.middleware.js';
import {PreviewController} from './preview.controller.js';

/** One NestJS middleware chain; the Express business API remains canonical. */
@Module({controllers:[PreviewController]})
export class PreviewAppModule implements NestModule{
 configure(consumer:MiddlewareConsumer):void{
  consumer.apply(SecurityHeadersMiddleware,OriginPolicyMiddleware,TraceMiddleware)
   .forRoutes({path:'__nest_probe/health',method:RequestMethod.ALL});
 }
}
