# LHS NestJS 12 middleware preview

**Isolated research only, not production.** The canonical backend is
backend/server.mjs (Express 5, Node.js 22). Do not change its start command,
Docker image, VPS route, Firebase, save logic or Mercado Pago webhooks.

The actual NestJS AppModule registers three NestMiddleware classes in order:
1. SecurityHeadersMiddleware: Cache-Control no-store and nosniff.
2. TraceMiddleware: generates X-LHS-Trace-Id for diagnosis, including for
   subsequent CORS denials and preflight responses. This does not overwrite
   Mercado Pago's signed X-Request-Id.
3. OriginPolicyMiddleware: exact ALLOWED_ORIGINS policy and CORS preflight.

The preview exposes diagnostic paths only: /__nest_probe/health, /auth,
/verified and /limited (all under /__nest_probe). None are mounted in the
production backend. No real account, save or payment routes exist.

Local development, explicitly opt-in only:
- npm ci --ignore-scripts --no-audit --no-fund (uses committed package-lock.json)
- npm run build
- npm test
- LHS_NEST_PREVIEW_ENABLED=1 npm run start:preview

The local preview listens ONLY on 127.0.0.1:18080 by default. Production
NODE_ENV refuses startup. Without an explicit flag, it also refuses startup.

**Reproducible dependencies:** The reviewed npm v3 package-lock.json is
versioned with this isolated preview. CI uses npm ci, never re-resolves
packages or deploys this preview. This preview cannot replace Express until separate
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
- Protected diagnostic paths register middleware for every HTTP method, including
  implicit `HEAD` for `GET`. Preflight `OPTIONS` still terminates at the earlier
  CORS middleware; unsupported methods do not bypass authentication.
- This is **not** a Firebase Admin SDK integration: no actual users are verified.
  The existing `/v1/auth/verification-email` exception and Firestore rate limits
  remain exclusively in Express. Real Firebase connection and quota parity are
  separate review stages before any cutover.

## User quota preview (mock transactional storage only)
- UserQuotaMiddleware runs after Firebase token and email verification, only on GET /__nest_probe/limited.
- The transactional adapter models rateLimits/{verified UID}: exactly 30 successful requests per fixed minute, then 429, with expiresAt at now + 120 seconds.
- UID comes solely from verified Firebase claims; no headers, queries or bodies set it.
- Default quota port denies all calls with 503. HTTP tests inject a mock transactional store; there is no live Firebase or Firestore connection.
- Storage errors and corrupt counters fail closed as 503, never in-memory fallback.
- Real Firestore integration and account API migration require separate approval.


## Local Firestore emulator integration (no production access)

A separate, guarded SDK adapter is available in src/emulator-firestore.ts,
but is never referenced by main.ts, bootstrap.ts or the canonical Express backend.

- The Firebase Admin SDK can be imported ONLY after four fail-closed checks:
  explicit LHS_NEST_EMULATOR_ENABLED=1, a loopback-only host formatted
  FIRESTORE_EMULATOR_HOST=127.0.0.1:8088 (port configurable), NODE_ENV not
  production, and no GOOGLE_APPLICATION_CREDENTIALS.
- The project ID is always demo-lhs-nest-quota, with a uniquely named SDK app.
  The local emulator receives transactions; no real Firebase project, service
  account, credential, account or payment endpoint is used.
- The isolated CI starts the official Firestore emulator using firebase-tools
  15.34.1 and JDK21, then runs HTTP requests through the actual NestJS middleware.
  It checks the 30/minute cutoff, HTTP429, expiry timestamp, minute rollover,
  UID separation, and that protected/paid routes remain absent.
- The emulator SDK and CLI are devDependencies of this preview only; they do
  not change the canonical Express backend or its build and deployment.
- The committed package-lock.json makes CI reproducible but does **not** approve
  any production NestJS service. This rehearsal is not a database migration.

