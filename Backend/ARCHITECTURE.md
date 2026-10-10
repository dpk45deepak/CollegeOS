# College OS — Architecture

> **College Operating System + AI Copilot.** Core workflows (attendance, grievances, scholarships, placements) are
> automated and explained; the AI layer sits *on top of* services, never beside the database.

## 1. System overview

```mermaid
flowchart TB
  C[Web / Mobile / Admin clients] --> API[NestJS API  /api/v1  + Socket.IO]
  subgraph API_Layer[NestJS monolith - modular]
    direction TB
    CORE[Core domain modules<br/>students, attendance, exams, fees, complaints...]
    AI[AI platform<br/>RAG, agents, tool registry, provider abstraction]
    RT[Realtime<br/>notifications, messaging, live attendance, AI streaming]
    CORE <--> BUS((Domain events))
    AI --> TOOLS[Tool registry]
    TOOLS --> SVC[Domain services]
    CORE --> SVC
    RT <--> BUS
  end
  API --> API_Layer
  SVC --> PG[(PostgreSQL + pgvector)]
  SVC --> R[(Redis)]
  R --> BQ[BullMQ workers<br/>email, notification, doc-processing,<br/>embedding, analytics, report]
  BQ --> PG
  SVC --> OBJ[(Object storage<br/>local / S3 / R2)]
  AI --> LLM[[LLM providers<br/>OpenAI-compatible, Gemini, OpenRouter, local]]
```

**Rules that hold everywhere**

1. Controllers: HTTP only. Business logic in services. DB access in services/repositories.
2. The LLM never touches the DB: `LLM → Tool → Service → DB`. Tools re-check permission and tenant on every call.
3. RAG permissions are enforced in the SQL `WHERE` clause *before* any text reaches the model.
4. Modules talk through domain events (`@nestjs/event-emitter` in-process, BullMQ for async work), not each other's internals.
5. Every query is tenant-scoped (`collegeId`); `RequestContext.requireTenantId()` throws if tenant is missing.

## 2. Module dependency graph

```mermaid
flowchart LR
  common --> prisma & redis & config
  auth --> users & audit & notifications
  users --> prisma
  org[colleges / departments / programs / batches / semesters / sections] --> prisma
  students --> users & org
  teachers --> users & org
  subjects --> org
  attendance --> students & subjects & audit
  attendance -. events .-> analytics & notifications & risk[risk engine]
  timetable --> subjects & teachers & rooms
  assignments --> subjects & students
  examinations --> subjects & students
  results --> examinations
  fees --> students
  scholarships --> students
  placements --> students
  complaints --> users & org & audit
  notifications --> queue
  messaging --> users
  documents --> storage & queue
  rag --> documents & embeddings & pgvector
  ai-tools --> students & attendance & timetable & examinations & assignments & fees & scholarships & complaints & placements & rag
  agents --> ai-tools & rag & llm[LLM provider]
  chat --> agents
  analytics --> attendance & results & fees & complaints & placements
  search --> students & teachers & documents & notices
```

## 3. Folder structure

```
.
├── prisma/
│   ├── schema.prisma          # 63 models / 35 enums
│   └── sql/hardening.sql      # pgvector HNSW, tsvector GIN, append-only audit trigger
├── docker/postgres/init.sql
├── src/
│   ├── main.ts                # helmet, CORS, versioning, validation, swagger, shutdown hooks
│   ├── app.module.ts
│   ├── config/                # env validation (fail-fast) + typed AppConfigService
│   ├── common/                # filters, interceptors, middleware, decorators, dto, utils (request context)
│   ├── prisma/  redis/  queue/  health/
│   ├── auth/ users/ academic/ students/ teachers/ attendance/ timetable/ assignments/ examinations/
│   ├── fees/ scholarships/ placements/ complaints/ notifications/ realtime/ messaging/ campus/
│   ├── storage/ documents/ analytics/ reports/ search/ audit/ admin/ portal/ security/ access/
│   └── ai/{chat,rag,embeddings,document-processing,agents,tools}/
└── test/
```

## 4. ER overview (core relationships)

```mermaid
erDiagram
  College ||--o{ Campus : has
  College ||--o{ Department : has
  College ||--o{ Program : offers
  Program ||--o{ Batch : runs
  Department ||--o{ Batch : hosts
  Batch ||--o{ Semester : has
  Semester ||--o{ Section : splits
  Section ||--o{ Student : contains
  User ||--o| Student : is
  User ||--o| Teacher : is
  User ||--o{ UserRole : holds
  Role ||--o{ UserRole : grants
  Role ||--o{ RolePermission : has
  Permission ||--o{ RolePermission : in
  User ||--o{ AuthSession : "devices"
  Subject ||--o{ SubjectOffering : taught_as
  Section ||--o{ SubjectOffering : receives
  Teacher ||--o{ SubjectOffering : teaches
  SubjectOffering ||--o{ TimetableSlot : scheduled
  SubjectOffering ||--o{ AttendanceSession : meets
  AttendanceSession ||--o{ Attendance : records
  Attendance ||--o{ AttendanceCorrection : corrected_by
  SubjectOffering ||--o{ Assignment : sets
  Assignment ||--o{ Submission : receives
  SubjectOffering ||--o{ Exam : examines
  Exam ||--o{ ExamResult : yields
  FeeStructure ||--o{ StudentFee : applied
  StudentFee ||--o{ Payment : paid_by
  Payment ||--o{ Refund : refunded
  Company ||--o{ Job : posts
  Job ||--o{ JobApplication : receives
  JobApplication ||--o{ Interview : has
  JobApplication ||--o{ Offer : yields
  Complaint ||--o{ ComplaintEvent : timeline
  Document ||--o{ DocumentChunk : split_into
  Conversation ||--o{ Message : contains
  Student ||--o{ AcademicRiskAssessment : assessed
```

Design notes: `SubjectOffering` (subject × semester × section × teacher) is the anchor for attendance, exams,
assignments and timetable, which makes teacher-scope checks a single join. `DocumentChunk` denormalises
visibility/department/type so permission filters run inside the vector query. `AuditLog` and `ComplaintEvent`
deliberately have no FK to `User`.

## 5. Cross-cutting

| Concern | Approach |
|---|---|
| Tenancy | `collegeId` on every tenant table; `TenantGuard` populates `RequestContext` |
| AuthZ | Roles → Permissions (DB), `@RequirePermissions()` guard, plus resource-scope checks (teacher ↔ section) |
| Errors | Global filter → `{success:false, statusCode, message, errorCode, timestamp, requestId}`; no stack traces in prod |
| Responses | `{success, data, meta?, timestamp, requestId}`; lists use `Paginated` → `{data, meta:{page,limit,total,totalPages}}` |
| Logging | pino (JSON in prod), request ID on every line, auth/cookie/password redaction |
| Queues | 6 BullMQ queues, 5 attempts, exponential backoff, failed jobs retained as dead-letter set |
| Health | `GET /health` (liveness), `GET /health/ready` (PostgreSQL + Redis) |
| Shutdown | `enableShutdownHooks` + tini PID 1 → clean close of HTTP, Prisma, Redis, BullMQ |

## 6. Status

All 14 phases are implemented; see README "Verification status" for what has and has not been exercised against a real
database/LLM. Authentication, scope and AI flow details: [docs/SECURITY.md](docs/SECURITY.md), [docs/RAG.md](docs/RAG.md),
[docs/AI_AGENTS.md](docs/AI_AGENTS.md).
