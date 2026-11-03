import {Inject,Injectable} from '@nestjs/common';
import type {NestMiddleware} from '@nestjs/common';
import type {NextFunction,Request,Response} from 'express';
import {FIREBASE_TOKEN_VERIFIER} from '../firebase-token-verifier.js';
import type {FirebaseIdTokenVerifier,VerifiedFirebaseIdToken} from '../firebase-token-verifier.js';

export interface PreviewAuthenticatedRequest extends Request{
 uid?:string;
 authToken?:VerifiedFirebaseIdToken;
}

/** Match Express authenticateAccount(): exact Bearer token, revoked check, exact 401. */
@Injectable()
export class FirebaseAuthMiddleware implements NestMiddleware{
 constructor(
  @Inject(FIREBASE_TOKEN_VERIFIER) private readonly verifier:FirebaseIdTokenVerifier
 ){}

 async use(request:PreviewAuthenticatedRequest,response:Response,next:NextFunction):Promise<void>{
  const match=/^Bearer (\S+)$/.exec(request.headers.authorization??'');
  if(!match){
   response.status(401).json({error:'Entre na conta para usar a nuvem.'});
   return;
  }

  let identity:VerifiedFirebaseIdToken;
  try{
   identity=await this.verifier.verifyIdToken(match[1]!,true);
   if(typeof identity?.uid!=='string'||identity.uid.length===0)
    throw new Error('Invalid Firebase identity');
  }catch{
   response.status(401).json({error:'Sessão inválida ou expirada.'});
   return;
  }
  // The UID always comes from the verified ID token, never from the request body.
  request.uid=identity.uid;
  request.authToken=identity;
  next();
 }
}
