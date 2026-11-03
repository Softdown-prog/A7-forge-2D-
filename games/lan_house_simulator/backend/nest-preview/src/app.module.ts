import {MiddlewareConsumer,Module,RequestMethod} from '@nestjs/common';
import type {NestModule} from '@nestjs/common';
import {OriginPolicyMiddleware} from './middleware/origin-policy.middleware.js';
import {SecurityHeadersMiddleware} from './middleware/security-headers.middleware.js';
import {TraceMiddleware} from './middleware/trace.middleware.js';
import {FirebaseAuthMiddleware} from './middleware/firebase-auth.middleware.js';
import {VerifiedEmailMiddleware} from './middleware/verified-email.middleware.js';
import {UserQuotaMiddleware} from './middleware/user-quota.middleware.js';
import {PreviewController} from './preview.controller.js';

/** One NestJS middleware chain; the Express business API remains canonical. */
@Module({controllers:[PreviewController]})
export class PreviewAppModule implements NestModule{
 configure(consumer:MiddlewareConsumer):void{
  consumer.apply(SecurityHeadersMiddleware,TraceMiddleware,OriginPolicyMiddleware)
   .forRoutes(
    {path:'__nest_probe/health',method:RequestMethod.ALL},
    {path:'__nest_probe/auth',method:RequestMethod.ALL},
    {path:'__nest_probe/verified',method:RequestMethod.ALL},
    {path:'__nest_probe/limited',method:RequestMethod.ALL}
   );
  // Secure all methods, including implicit HEAD responses to GET routes.
  // OPTIONS is handled by OriginPolicyMiddleware before these guards.
  consumer.apply(FirebaseAuthMiddleware)
   .forRoutes(
    {path:'__nest_probe/auth',method:RequestMethod.ALL},
    {path:'__nest_probe/verified',method:RequestMethod.ALL},
    {path:'__nest_probe/limited',method:RequestMethod.ALL}
   );
  consumer.apply(VerifiedEmailMiddleware)
   .forRoutes(
    {path:'__nest_probe/verified',method:RequestMethod.ALL},
    {path:'__nest_probe/limited',method:RequestMethod.ALL}
   );
  consumer.apply(UserQuotaMiddleware)
   .forRoutes({path:'__nest_probe/limited',method:RequestMethod.ALL});
 }
}
