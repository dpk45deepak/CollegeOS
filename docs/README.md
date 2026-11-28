# College OS Documentation

Concise, source-verified engineering and operations documentation for **College OS** (`Frontend/` Next.js 15 App Router + `Backend/` NestJS 10 REST/Socket.IO API).

## Documentation Index

| Document | Audience | Purpose |
| :--- | :--- | :--- |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Engineers & Architects | System topology, NestJS modular monolith, Next.js role portals, BullMQ queues, and Socket.IO `/realtime` gateway |
| [API_INTEGRATION.md](./API_INTEGRATION.md) | Full-Stack Engineers | REST response/error envelopes, auth lifecycle, verified DTO contracts, and Socket.IO realtime events |
| [DATABASE.md](./DATABASE.md) | Backend & Data Engineers | Prisma schema inventory, multi-tenant `collegeId` isolation, `pgvector` embeddings, and financial/attendance invariants |
| [AI_AGENTS.md](./AI_AGENTS.md) | AI & Backend Engineers | `Supervisor`, 6 specialist agents, 14 permission-checked domain tools, complaint drafts, and call telemetry |
| [RAG.md](./RAG.md) | AI & Knowledge Engineers | Document ingestion, chunking, `DocumentVisibility` access control, and `/ai/knowledge/ask` + `/search` |
| [CROSS_MODULE_WORKFLOWS.md](./CROSS_MODULE_WORKFLOWS.md) | Product & QA | End-to-end sequence diagrams across onboarding, attendance, assignments, exams, grievances, and fees |
| [SECURITY.md](./SECURITY.md) | Security & DevOps | RBAC permissions (`Backend/src/auth/permissions.ts`), JWT rotation/Redis revocation, malware scanning, and webhook HMAC checks |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | DevOps & Developers | Local Docker setup, complete environment variable matrix, Web Push Service Worker (`/sw.js`), and cloud hosting |
| [AWS_DEPLOYMENT_DECISION_AND_GUIDE.md](./AWS_DEPLOYMENT_DECISION_AND_GUIDE.md) | DevOps | AWS compute comparison and ECS Fargate + ALB + Neon + Upstash + S3 rollout guide |
| [TESTING.md](./TESTING.md) | QA & Engineers | Verified Frontend (Vitest) and Backend (Jest) test suites, production builds, and user journey checks |
| [DEMO_CREDENTIALS.md](./DEMO_CREDENTIALS.md) | Evaluators & QA | Development logins and pre-seeded test scenarios from `Backend/prisma/seed.ts` |

## Auto-Generated Backend Reference

Full generated endpoint tables and permission matrices live under `Backend/docs/`:
- `Backend/docs/API.md` & `Backend/docs/PERMISSIONS.md` (regenerate via `cd Backend && npm run docs:api`)
- Live Swagger UI (non-production): `http://localhost:3000/docs`
