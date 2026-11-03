# LHS NestJS 12 middleware preview

**Isolated research only, not production.** The canonical backend is
backend/server.mjs (Express 5, Node.js 22). Do not change its start command,
Docker image, VPS route, Firebase, save logic or Mercado Pago webhooks.

The actual NestJS AppModule registers three NestMiddleware classes in order:
1. SecurityHeadersMiddleware: Cache-Control no-store and nosniff.
2. OriginPolicyMiddleware: exact ALLOWED_ORIGINS policy and CORS preflight.
3. TraceMiddleware: generates X-LHS-Trace-Id for diagnosis. This does not
   overwrite Mercado Pago's signed X-Request-Id.

There is only a diagnostic GET/OPTIONS /__nest_probe/health route, and it is
not mounted in the production backend. No accounts, saves or payments exist.

Local development, explicitly opt-in only:
- npm install --package-lock-only --ignore-scripts
- npm ci --ignore-scripts
- npm run build
- npm test
- LHS_NEST_PREVIEW_ENABLED=1 npm run start:preview

The local preview listens ONLY on 127.0.0.1:18080 by default. Production
NODE_ENV refuses startup. Without an explicit flag, it also refuses startup.

**Release blockers:** The initial CI resolves a disposable dependency lock
and uploads it for review. Commit a reviewed lockfile and switch to npm ci
before any deployment. This preview cannot replace Express until separate
contract tests prove parity for /health, /healthz, /v1/config, auth, Firestore
per-UID quotas, email verification, 2MB saves and all payment/webhook behavior.
Pay particular attention to signature validation, idempotency and refunds.
Never run two backends on the production hostname during this rehearsal.

NestJS is a Node.js framework; it does not replace Node.js itself.

## Firebase authentication preview (no live Firebase connection)
- The `FirebaseAuthMiddleware` receives a typed, injectable `FirebaseIdTokenVerifier` port.
  The **default implementation rejects all tokens**, so a Nest preview process cannot
  accidentally authenticate users or touch Firebase credentials.
- Tests inject a fake verifier and verify revoked-token checks `verifyIdToken(token,true)`,
  exact 401 responses for absent/invalid tokens, and UID sourced only from verified claims.
  No UID, email, or bearer token appears in the diagnostic responses.
- `VerifiedEmailMiddleware` is applied **after authentication** only on
  `GET /__nest_probe/verified`, mirroring the current 403 email verification gate.
  The unverified diagnostic endpoint is `GET /__nest_probe/auth`.
- This is **not** a Firebase Admin SDK integration: no actual users are verified.
  The existing `/v1/auth/verification-email` exception and Firestore rate limits
  remain exclusively in Express. Real Firebase connection and quota parity are
  separate review stages before any cutover.
