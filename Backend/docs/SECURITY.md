# Security

## Request pipeline

`Throttler → JwtAuthGuard → TenantGuard → PermissionsGuard → ValidationPipe(whitelist, forbidNonWhitelisted) → handler`.
Routes are private by default; `@Public()` is explicit (health, login, refresh, payment webhooks).

## Controls

| Area | Control |
|---|---|
| Passwords | bcrypt, never logged/returned; no default accounts; seed requires `SEED_PASSWORD` and refuses production |
| Tokens | 15m JWT access; opaque refresh `<sessionId>.<secret>` stored HMAC-hashed; rotation on every refresh; **reuse of an old token revokes the whole family**; Redis blacklist of revoked sessions |
| Login | lockout after 5 failures / 15 min; identical errors for unknown user vs wrong password (no enumeration) |
| RBAC | 11 roles → permissions in DB (`docs/PERMISSIONS.md`); plus row-level scope in `AccessService` (own section / department / child) |
| Tenancy | `collegeId` on every query; client-supplied ids verified (cross-tenant → 404); `x-tenant-id` honoured only for SUPER_ADMIN |
| Input | class-validator whitelist; unknown fields rejected; SQL via Prisma or parameterised raw queries |
| Output | global exception filter (no stack traces in prod); consistent envelope |
| Headers/CORS | helmet; explicit `CORS_ORIGINS` |
| Rate limits | global throttler (`THROTTLE_*`) |
| Logs | pino with redaction (authorization, cookies, passwords, tokens) |
| Audit | append-only `AuditLog` (DB trigger blocks UPDATE/DELETE); written transactionally with attendance corrections, results, fees, role changes |
| Files | magic-byte validation, size limit, safe names, scanner interface (default `NoopScanner` — **plug in ClamAV for production**) |
| Payments | no card data stored; gateway abstraction; webhook signature verified over raw body; mock gateway disabled in production |
| Exports | CSV cells starting with `= + - @` are neutralised (formula injection) |
| AI | LLM never accesses DB; tool permission re-check; RAG filter in SQL; messages/complaints not indexed; call logs hold no prompts; predictions never presented as guaranteed; matching ignores sensitive attributes |
| Search | permission-aware per entity; private messages never searched |

## Known limits / to do before production

- Malware scanning is a no-op by default.
- Push / WhatsApp providers are interfaces, not integrations.
- No MFA, no OAuth providers wired (interface only).
- Run a dependency audit (`npm audit`) and a pen-test; DB-backed security tests (`E2E_DB=1`) have not been run in CI here.
- Prompt-injection: document text is passed to the model as quoted context with instructions to ignore embedded commands, but this is mitigation, not proof; permissions are enforced outside the model, so injection cannot widen data access.
- Secrets: keep in your secret manager; `.env` is git-ignored.
