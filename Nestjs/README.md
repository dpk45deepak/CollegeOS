# College OS — AI-powered College ERP backend

A multi-tenant **College Operating System + AI Copilot**: NestJS · TypeScript (strict) · PostgreSQL + pgvector · Prisma ·
Redis · BullMQ · Socket.IO · provider-agnostic LLMs.

Core workflows (attendance, grievances, scholarships, placements, fees, exams) are deterministic services. The AI layer
sits **on top** of those services (`LLM → Tool → Service → DB`) and never touches the database directly.

| Doc | What it covers |
|---|---|
| [ARCHITECTURE.md](ARCHITECTURE.md) | System diagram, module graph, ER overview, cross-cutting concerns |
| [docs/API.md](docs/API.md) | All 192 endpoints with required permission (generated) |
| [docs/PERMISSIONS.md](docs/PERMISSIONS.md) | Role → permission matrix (generated) |
| [docs/DATABASE.md](docs/DATABASE.md) | Schema, tenancy, indexes, pgvector, hardening SQL |
| [docs/RAG.md](docs/RAG.md) | Ingestion, hybrid retrieval, permission filtering, refusal |
| [docs/AI_AGENTS.md](docs/AI_AGENTS.md) | Tool registry, supervisor, six agents, advisor, grievance drafts |
| [docs/SECURITY.md](docs/SECURITY.md) | Threat model, controls, known limits |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Docker, env vars, migrations, operations |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Conventions, how to add a module / tool / permission |

## What is implemented

Auth (JWT + rotating refresh tokens, lockout), permission-based RBAC for 11 roles, tenant isolation, org hierarchy,
students/teachers/guardians, smart attendance (3 modes, correction workflow, analytics, shortage math), timetable with
conflict detection, assignments, exams/results/GPA, fees (integer paise, gateway abstraction), scholarships, placements
(non-discriminatory explainable matching), complaints (state machine, SLA, escalation, routing), notices/events/clubs,
notifications (email / in-app / push / WhatsApp abstraction), WebSocket gateway, messaging, documents + file pipeline,
permission-aware RAG with citations, AI chat with tool registry, supervisor + 6 agents, personal advisor, grievance
assistant, risk engine, analytics + "What needs attention today?", CSV reports, global search, audit log (append-only),
6 BullMQ queues with retries and dead-letter retention.

## Quick start (Docker)

```bash
cp .env.example .env
# set JWT_SECRET and JWT_REFRESH_SECRET:  openssl rand -base64 48
docker compose up -d --build
curl localhost:3000/health/ready
open http://localhost:3000/docs        # Swagger (non-production only)
```

`docker-compose.yml` sets `ALLOW_DB_PUSH=true` so a first run works without migrations. Before real deployments, create
and commit migrations (below) and remove that flag.

## Local development

```bash
cp .env.example .env                    # fill JWT secrets
docker compose up -d postgres redis
npm install
npm run prisma:generate
npx prisma migrate dev --name init      # FIRST TIME: creates prisma/migrations/ — commit it
npm run db:harden                       # pgvector HNSW, tsvector, append-only audit trigger (idempotent)
SEED_PASSWORD='Dev-Passw0rd-123' npm run seed
npm run start:dev
```

Seeded logins (`POST /api/v1/auth/login`, body `{ collegeCode: "SDCET", loginId, password }`): `ADMIN001`, `SUP001`,
`ACC001`, teachers `CSE-T01…CSE-T05`, `CE-T01`, students `CSE23001…CSE23018`, `CE23001…CE23003`, parent `PAR-CSE23001`;
platform super-admin `PLATFORM` (no `collegeCode`). The seed refuses to run when `NODE_ENV=production`.

## Scripts

| Script | Purpose |
|---|---|
| `npm run build` / `start:prod` | Compile / run |
| `npm test` | 156 unit tests (pure logic + services with mocks) |
| `npm run test:e2e` | Smoke e2e (real DI graph, stubbed Prisma, needs Redis); DB-backed security e2e runs with `E2E_DB=1` |
| `npm run docs:api` | Regenerate docs/API.md and docs/PERMISSIONS.md from the live route table |
| `npm run db:harden` | Apply `prisma/sql/hardening.sql` |
| `npm run lint` / `typecheck` | ESLint (`no-explicit-any` is an error) / `tsc --noEmit` |

## Verification status — read this

Verified in the build environment: `tsc` strict, `nest build`, ESLint clean, **27 suites / 156 unit tests**, **7 smoke e2e
tests** against the real dependency graph (all modules, guards, filters, queues, gateways, Swagger generation).

**Not verified** (no PostgreSQL / LLM / Docker was available): raw SQL (hybrid retrieval, analytics aggregates), pgvector
operations, `prisma migrate`, the seed run, the 15 DB-backed security e2e tests (written, skipped without `E2E_DB=1`),
Docker image build, and any real LLM/embedding calls. Expect to shake out small issues on first run against a database;
run `E2E_DB=1 npm run test:e2e` against a throwaway DB first.

Stubs / limits: `NoopScanner` malware scanner by default, mock payment gateway only (disabled in production), push and
WhatsApp are provider interfaces, PDF rendering is an interface (CSV is implemented), no OCR for scanned PDFs.
