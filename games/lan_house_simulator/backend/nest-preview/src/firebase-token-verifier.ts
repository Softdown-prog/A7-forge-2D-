/**
 * This is a verification port, not the Firebase Admin SDK implementation.
 * Production authentication remains exclusively in backend/server.mjs.
 */
export interface VerifiedFirebaseIdToken{
 readonly uid:string;
 readonly email_verified?:boolean;
}
export interface FirebaseIdTokenVerifier{
 verifyIdToken(token:string,checkRevoked:true):Promise<VerifiedFirebaseIdToken>;
}
export const FIREBASE_TOKEN_VERIFIER=Symbol('LHS_FIREBASE_TOKEN_VERIFIER');

/** Always reject unless a verifier is supplied by an isolated test fixture. */
export const disabledFirebaseVerifier:FirebaseIdTokenVerifier={
 async verifyIdToken(_token:string,_checkRevoked:true):Promise<VerifiedFirebaseIdToken>{
  throw new Error('Firebase verifier is not configured for the NestJS preview');
 }
};
