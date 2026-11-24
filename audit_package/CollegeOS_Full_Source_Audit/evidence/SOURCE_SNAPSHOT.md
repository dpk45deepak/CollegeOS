# Source Snapshot

Repository: `https://github.com/dpk45deepak/CollegeOS`  
Branch used: `main`  
Retrieval date: 2026-11-24

The recursive GitHub tree returned `truncated: false` and 457 tracked files.

Inventory:
- Backend TypeScript: 218
- Frontend TypeScript/TSX: 118
- Frontend `page.tsx` routes: 37
- Prisma models: 63
- Prisma migration SQL files: 1
- Backend `.spec.ts`: 27
- Backend `.e2e-spec.ts`: 3
- Frontend test files: 4

Primary source files inspected include:

## Security / auth / tenancy
- `Backend/src/common/guards/tenant.guard.ts`
- `Backend/src/common/guards/jwt-auth.guard.ts`
- `Backend/src/common/guards/permissions.guard.ts`
- `Backend/src/auth/auth.controller.ts`
- `Backend/src/auth/auth.service.ts`
- `Backend/src/auth/dto/auth.dto.ts`
- `Backend/src/auth/permissions.ts`
- `Backend/src/security/principal.service.ts`
- `Backend/src/security/rbac.service.ts`
- `Backend/src/access/access.service.ts`
- `Backend/src/access/ownership.service.ts`
- `Backend/src/users/users.service.ts`

## Core academic / workflows
- `Backend/src/academic/academic.service.ts`
- `Backend/src/students/students.service.ts`
- `Backend/src/teachers/teachers.service.ts`
- `Backend/src/attendance/attendance.service.ts`
- `Backend/src/attendance/attendance-analytics.service.ts`
- `Backend/src/assignments/assignments.service.ts`
- `Backend/src/examinations/examinations.service.ts`
- `Backend/src/timetable/timetable.service.ts`
- `Backend/src/fees/fees.service.ts`
- `Backend/src/scholarships/scholarships.service.ts`
- `Backend/src/placements/placements.service.ts`
- `Backend/src/complaints/complaints.service.ts`
- `Backend/src/complaints/workflow.ts`
- `Backend/src/campus/campus.service.ts`
- `Backend/src/messaging/messaging.service.ts`

## Platform / AI / files
- `Backend/src/admin/admin.controller.ts`
- `Backend/src/analytics/analytics.service.ts`
- `Backend/src/reports/reports.service.ts`
- `Backend/src/search/search.service.ts`
- `Backend/src/portal/portal.service.ts`
- `Backend/src/documents/documents.service.ts`
- `Backend/src/storage/storage.controller.ts`
- `Backend/src/storage/storage.service.ts`
- `Backend/src/storage/storage.module.ts`
- `Backend/src/redis/redis.service.ts`
- `Backend/src/realtime/realtime.gateway.ts`
- `Backend/src/ai/chat/chat.service.ts`
- `Backend/src/ai/rag/rag-answer.service.ts`
- `Backend/src/ai/rag/reranker.ts`
- `Backend/src/ai/providers/openai-compat.provider.ts`

## Database / deployment
- `Backend/prisma/schema.prisma`
- `Backend/prisma/migrations/20261010000000_init/migration.sql`
- `Backend/prisma/sql/hardening.sql`
- `Backend/package.json`
- `Backend/.env.example`
- `Backend/Dockerfile`
- `Backend/docker/entrypoint.sh`
- `Backend/api/index.ts`
- `Frontend/package.json`
- `Frontend/next.config.ts`
- `Frontend/.env.example`

## Frontend high-risk paths
- `Frontend/src/lib/api/auth.ts`
- `Frontend/src/lib/api/student.ts`
- `Frontend/src/lib/api/teacher.ts`
- `Frontend/src/services/api/attendance.api.ts`
- `Frontend/src/services/api/ai.api.ts`
- `Frontend/src/services/api/analytics.api.ts`
- `Frontend/src/services/api/documents.api.ts`
- `Frontend/src/app/(auth)/login/page.tsx`
- `Frontend/src/app/(auth)/verify-email/page.tsx`
- `Frontend/src/app/(admin)/admin/users/page.tsx`
- `Frontend/src/app/(admin)/admin/analytics/page.tsx`
- `Frontend/src/app/(student)/student/attendance/page.tsx`
- `Frontend/src/app/(teacher)/teacher/attendance/page.tsx`
- `Frontend/src/app/(student)/student/assignments/page.tsx`
- `Frontend/src/app/(teacher)/teacher/assignments/page.tsx`
- `Frontend/src/app/(student)/student/fees/page.tsx`
- `Frontend/src/app/(student)/student/complaints/page.tsx`
- `Frontend/src/app/(student)/student/exams/page.tsx`
- `Frontend/src/app/(student)/student/results/page.tsx`
- `Frontend/src/app/documents/page.tsx`
- `Frontend/src/app/(hod)/hod/dashboard/page.tsx`
