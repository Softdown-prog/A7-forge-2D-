# Express → NestJS: authentication-only HTTP differential test

**Scope:** isolation/verification only. The canonical production backend is
`games/lan_house_simulator/backend/server.mjs` (Express).

The test `test/express-auth-differential.test.mjs` instantiates two local,
loopback-only HTTP servers. The Express server uses the **actual exported**
`authenticateAccount()` middleware from
`backend/verification-email.mjs`. The NestJS server uses
`src/middleware/firebase-auth.middleware.ts` through the real preview
application. Both receive independent instances of the same deterministic
fake `verifyIdToken` implementation. No live Firebase project, user, credential,
Firestore database or external payment service is used.

## Compared behavior

| Request/auth situation | Expected in Express | Expected in Nest preview |
|---|---|---|
| Missing Authorization | 401 missing-login error | 401 same error |
| `Basic` scheme or lowercase `bearer` | 401 missing-login error | 401 same error |
| Extra whitespace or no token | 401 missing-login error | 401 same error |
| Expired or revoked fake token | 401 session-invalid error | 401 same error |
| Valid token, email unverified | 200 at auth-only endpoint | 200 at auth-only endpoint |
| Valid token, email verified | 200 at auth-only endpoint | 200 at auth-only endpoint |

The differential test asserts response bodies, HTTP status, absence of
`X-Powered-By`, equivalent calls to the verifier, `checkRevoked=true`,
and no sensitive claims/token leakage in the JSON response.

**Important:** the Express fixture installs only the actual exported
`authenticateAccount` middleware plus an equivalent error response
handler. It does **not** run the production Express bootstrap, full `/v1`
pipeline or Firebase Admin SDK. Therefore passing this test does not
establish end-to-end parity for real users.

## Known differences and unverified behavior

- The Nest middleware explicitly refuses malformed verifier responses with
  an empty UID. The canonical Express authenticator assumes that Firebase
  Admin SDK returns a valid UID and currently does not perform that extra
  validation. This is an intentionally stricter Nest contract for an
  invalid fake-verifier response; it is **not proof of full equivalence**.
- Email verification is checked in the Nest preview in other HTTP tests,
  but this differential fixture compares **authentication only**.
- The quota middleware is verified with mock transactions and an isolated
  Firestore emulator. No production Firestore instance is used.
- `/health`, `/healthz`, `/v1/config`, account and save routes,
  payment ordering and signed Mercado Pago webhooks have not been ported
  or proven equivalent. The preview deliberately returns 404 on live API
  paths.

## Before any real cutover

A separate, reviewed test environment must demonstrate full route contract
parity (including real Firebase Admin token behavior and email verification),
Firestore transaction semantics, error shaping, CORS, save size limits,
idempotent payment processing and webhook signature checks. Do not merge
payment or save routes into the preview as a shortcut.

The lockfile is fixed using `npm ci`, and this test is run by
`npm test` after the Nest TypeScript compilation in isolated CI.
