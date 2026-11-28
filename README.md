# College OS — AI-Powered College Operating System

> **Beyond Traditional ERP — An Intelligent Operating System for Modern Colleges.**

College OS is a modern, unified college-management platform that integrates academic workflows, student operations, faculty administration, and an AI assistant grounded in authorized college records.

This repository integrates the **Next.js 15 App Router Frontend** with the **NestJS 10 REST API Backend**, backed by **PostgreSQL (Prisma ORM)**, **Redis (BullMQ)**, and **pgvector**.

---

## Core Capabilities

- **Informational Public Website:** Explains the platform's vision, architecture, attendance intelligence, and AI governance at `/`.
- **Institutional Authentication:** Secure JWT authentication (`POST /auth/login`), refresh token rotation (`POST /auth/refresh`), session invalidation (`POST /auth/logout`), and profile verification (`GET /users/me`).
- **Academic Management:** Student and faculty profiles, departments, programs, sections, subjects, timetables, assignments, examinations, and results.
- **Attendance Intelligence:** Lecture-wise attendance (`PER_LECTURE` mode), regulatory 75% threshold monitoring, shortage analytics, and auditable correction requests.
- **Faculty Class Attendance:** Dedicated classroom attendance marking workflow for faculty with live roster synchronization.
- **College Knowledge AI:** Retrieval-Augmented Generation (RAG) over approved institutional policies and handbooks with source citations, powered by NestJS supervisor agent and authorized domain tools.
- **Role-Based Portals:** Tailored workspaces for Students, Teachers, HODs, and Administrators enforcing backend RBAC permissions (`@RequirePermissions(...)`).
- **Real-Time Communication:** Notification system and WebSocket event streaming via Socket.IO.

---

## Technology Stack

| Layer | Technology |
|---|---|
| **Web Frontend** | Next.js 15 App Router, React 19, TypeScript |
| **Styling & Components** | Tailwind CSS, Lucide React, Framer Motion, shadcn/ui patterns |
| **Server State Management** | TanStack Query v5 |
| **Client State Management** | Zustand |
| **Backend API** | NestJS 10, TypeScript, REST API (`/api/v1`) |
| **Database & ORM** | PostgreSQL with `pgvector`, Prisma 5.22 ORM |
| **Cache & Background Jobs** | Redis 7, BullMQ |
| **Realtime** | Socket.IO (`/realtime`) |
| **AI Orchestration** | Supervisor agent with domain tool registry & RAG embeddings |
| **Testing** | Vitest (Frontend), Jest (Backend) |

---

## Repository Layout

```text
college-os/
├── Frontend/                 # Next.js 15 App Router frontend (React 19, TanStack Query, Tailwind)
│   ├── src/app/             # App Router routes (48 compiled public & role portal routes)
│   ├── src/components/      # UI components, layout shell, search palette, drawers
│   ├── src/lib/api/         # Typed HTTP client, auth session & endpoint adapters
│   ├── src/lib/auth/        # Session management & authStore
│   └── src/__tests__/       # Vitest unit & contract suites (8 files, 38 tests)
├── Backend/                  # NestJS 10 REST API, Socket.IO & AI Orchestration
│   ├── prisma/              # Prisma schema, migrations & SDIET seed script
│   ├── src/                 # Domain modules, RBAC guards, RAG, gateways & supervisor agents
│   ├── docs/                # Auto-generated API.md & PERMISSIONS.md (`npm run docs:api`)
│   └── src/**/*.spec.ts     # Jest test suites (36 suites, 199 tests)
├── docs/                     # Architecture, API integration, AI/RAG, security, deployment & testing guides
│   ├── README.md            # Documentation index
│   ├── ARCHITECTURE.md      # System topology, module boundaries & runtime modes
│   ├── API_INTEGRATION.md   # REST envelopes, verified DTO contracts & Socket.IO events
│   ├── DATABASE.md          # Prisma models, tenancy, pgvector & data invariants
│   ├── AI_AGENTS.md         # Supervisor, 6 specialist agents & 14 permission-checked tools
│   ├── RAG.md               # Document ingestion, visibility filtering & hybrid retrieval
│   ├── SECURITY.md          # Multi-tenant isolation, RBAC, malware scanning & AI guardrails
│   ├── DEPLOYMENT.md        # Environment variables, Docker, Web Push & cloud hosting
│   └── TESTING.md           # Automated test suites, builds & verification commands
├── docker-compose.yml       # Local PostgreSQL + Redis + pgvector infrastructure
└── README.md
```

---

## Quick Start (Local Development)

### 1. Prerequisites
- Node.js >= 20.x
- Docker & Docker Compose (for PostgreSQL & Redis)

### 2. Infrastructure Setup
Start the local PostgreSQL (with `pgvector`) and Redis containers:
```bash
docker-compose up -d
```

### 3. Backend Setup & Startup
```bash
cd Backend

# Install dependencies & generate Prisma client
npm install
npx prisma generate

# Run migrations and seed institutional database
npx prisma migrate dev --name init
npm run seed

# Run unit & domain tests (199 tests across 36 suites)
npm test

# Build and start development API server (runs on http://localhost:3000/api/v1)
npm run start:dev
```
API Documentation (Swagger UI) is available at: `http://localhost:3000/docs`

### 4. Frontend Setup & Startup
```bash
cd ../Frontend

# Install dependencies
npm install

# Run Vitest test suites (38 tests across 8 files)
npm test

# Build production bundle (verifies all 48 routes)
npm run build

# Start Next.js development server (runs on http://localhost:3001)
npm run dev -- -p 3001
```

Visit [http://localhost:3001](http://localhost:3001) in your browser.

---

## Verification Status

| Component | Test Suite | Result | Production Build |
|---|---|---|---|
| **Backend (NestJS)** | 36 Jest Suites | **199 / 199 Passed** | **Compiled Successfully** (`dist/`) |
| **Frontend (Next.js)** | 8 Vitest Files | **38 / 38 Passed** | **48 / 48 Routes Compiled** (`.next/`) |

---

## Documentation

- [Documentation Index](./docs/README.md) — Complete guide to `docs/` and auto-generated `Backend/docs/`
- [API Integration Specification](./docs/API_INTEGRATION.md) — Envelopes, verified REST DTOs, and Socket.IO `/realtime` contracts
- [System Architecture](./docs/ARCHITECTURE.md) — Module boundaries, role workspaces, queues, and runtime modes
- [Cross-Module Workflows](./docs/CROSS_MODULE_WORKFLOWS.md) — Sequence diagrams across core academic & administrative flows
- [Security Model](./docs/SECURITY.md) — RBAC, multi-tenancy, malware scanning, webhooks, and AI boundaries
- [Deployment Guide](./docs/DEPLOYMENT.md) — Docker setup, environment matrix, Web Push, and cloud hosting
- [Testing Guide](./docs/TESTING.md) — Verified test suites, build checks, and core journeys

---

## License

Institutional Enterprise License — Satyug Darshan Institute of Engineering and Technology (SDIET).
