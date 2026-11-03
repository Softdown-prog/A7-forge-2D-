import 'reflect-metadata';
import type {DynamicModule,INestApplication} from '@nestjs/common';
import {NestFactory} from '@nestjs/core';
import type {Express} from 'express';
import {PreviewAppModule} from './app.module.js';
import {disabledFirebaseVerifier,FIREBASE_TOKEN_VERIFIER} from './firebase-token-verifier.js';
import type {FirebaseIdTokenVerifier} from './firebase-token-verifier.js';

/** Inert by default; no socket is opened until the caller explicitly listens. */
export async function createPreviewApp(
 verifier:FirebaseIdTokenVerifier=disabledFirebaseVerifier
):Promise<INestApplication>{
 const module:DynamicModule={
  module:PreviewAppModule,
  providers:[{provide:FIREBASE_TOKEN_VERIFIER,useValue:verifier}]
 };
 const app=await NestFactory.create(module,{logger:false});
 const express=app.getHttpAdapter().getInstance() as Express;
 express.disable('x-powered-by');
 express.set('trust proxy',1);
 await app.init();
 return app;
}
