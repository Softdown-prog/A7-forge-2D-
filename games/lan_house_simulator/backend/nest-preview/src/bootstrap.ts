import 'reflect-metadata';
import type {INestApplication} from '@nestjs/common';
import {NestFactory} from '@nestjs/core';
import type {Express} from 'express';
import {PreviewAppModule} from './app.module.js';

/** Inert by default; no socket is opened until the caller explicitly listens. */
export async function createPreviewApp():Promise<INestApplication>{
 const app=await NestFactory.create(PreviewAppModule,{logger:false});
 const express=app.getHttpAdapter().getInstance() as Express;
 express.disable('x-powered-by');
 express.set('trust proxy',1);
 await app.init();
 return app;
}
