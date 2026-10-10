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
│   ├── src/app/             # App Router routes (Public informational pages & Role-based Portals)
│   ├── src/components/      # UI components, layout shell, search palette, drawers
│   ├── src/lib/api/         # Centralized typed API client & endpoint modules
│   ├── src/lib/auth/        # Session management & authStore
│   └── src/__tests__/       # Vitest unit & integration test suites (13 tests)
├── Backend/                  # NestJS 10 REST API, Socket.IO & AI Orchestration
│   ├── prisma/              # Prisma schema & database migration definitions
│   ├── src/                 # Domain modules, RBAC guards, RAG & supervisor agents
│   └── src/**/*.spec.ts     # Jest test suites (156 tests)
├── docs/                     # Integrated architecture, audit & integration specs
│   ├── INTEGRATION_AUDIT.md # Comprehensive audit of both codebases & 33 feature mappings
│   ├── API_INTEGRATION.md   # Unified API contracts, response envelopes & DTO mappings
│   ├── ARCHITECTURE.md      # Dual-mode runtime and data-flow topology
│   ├── SECURITY.md          # Multi-tenant isolation, RBAC, and AI guardrails
│   ├── DEPLOYMENT.md        # Environment variables, Docker, and cloud hosting blueprints
│   └── TESTING.md           # Test matrices and verification evidence
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

# Run unit & domain tests (156 tests across 27 suites)
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

# Run Vitest test suites (13 tests across 3 files)
npm test

# Build production bundle (verifies all 35 routes)
npm run build

# Start Next.js development server (runs on http://localhost:3001)
npm run dev -- -p 3001
```

Visit [http://localhost:3001](http://localhost:3001) in your browser.

---

## Verification Status

| Component | Test Suite | Result | Production Build |
|---|---|---|---|
| **Backend (NestJS)** | 27 Jest Suites | **156 / 156 Passed** | **Compiled Successfully** (`dist/`) |
| **Frontend (Next.js)** | 3 Vitest Suites | **13 / 13 Passed** | **35 / 35 Routes Compiled** (`.next/`) |

---

## Documentation

- [Integration Audit](./docs/INTEGRATION_AUDIT.md) — Comprehensive audit and feature classification
- [API Integration Specification](./docs/API_INTEGRATION.md) — Exact endpoints, request/response DTOs, and error codes
- [System Architecture](./docs/ARCHITECTURE.md) — Data flow, auth contracts, and service topology
- [Security Model](./docs/SECURITY.md) — RBAC, multi-tenancy, token rotation, and AI safety
- [Deployment Guide](./docs/DEPLOYMENT.md) — Environment variables, Docker, and cloud hosting
- [Testing Guide](./docs/TESTING.md) — Test suites, command execution, and test plans

---

## License

Institutional Enterprise License — Satyug Darshan Institute of Engineering and Technology (SDIET).
