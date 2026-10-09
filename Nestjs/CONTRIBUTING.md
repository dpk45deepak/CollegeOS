# Contributing

## Setup & checks

```bash
npm install && npm run prisma:generate
npm run lint && npm run typecheck && npm test
npm run test:e2e          # smoke (needs Redis);  E2E_DB=1 for DB-backed security tests
```

CI-equivalent gate: lint, `tsc`, unit tests, smoke e2e, `nest build`.

## Conventions

- Controllers: HTTP only (DTOs, decorators, `@RequirePermissions`). Business logic in services. No Prisma in controllers.
- **No `any`** (lint error). Use `unknown` + narrowing or Prisma types.
- Every tenant query includes `collegeId`; verify client-supplied ids with `OwnershipService`.
- Pure logic (math, state machines, matching) lives in plain functions with unit tests (`*.spec.ts`).
- Cross-module reactions go through domain events (`src/common/events.ts`), not direct imports.
- Never log secrets/PII; never hardcode credentials; never commit `.env`.
- Money in paise integers.

## Add an endpoint

1. DTO with class-validator + `@ApiProperty`.
2. Service method (scope via `AccessService`).
3. Controller route with `@RequirePermissions('X')`; mark `@Public()` only deliberately.
4. Tests; `npm run docs:api` to refresh docs/API.md.

## Add a permission

Add it to the catalog and role map in `src/auth/permissions.ts`, re-seed (`npm run seed`), regenerate docs.

## Add an AI tool

Implement `AiTool` in `src/ai/tools/` (name, JSON-schema params, `permission`, `execute` calling a **service**), register it
in `ToolRegistry`, add it to the relevant agent's allow-list, add a registry test (permission denied, tenant isolation).

## Commits / PRs

Small, focused, with tests. Describe behaviour changes and any security impact.
