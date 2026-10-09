# College OS — Production-Grade AI-Powered Academic Operating System

> An intelligent, autonomous academic operating system combining the best of **Modern SaaS**, **Linear**, **Notion**, **Google Classroom**, **Modern Banking**, and **AI Copilot**. Built for students, teachers, HODs, and administrators to eliminate bureaucracy and foster academic excellence.

---

## 🌟 Key Highlights & Philosophy

- **Not Just Another ERP**: Avoids tedious infinite tables and cluttered forms. Instead, acts as a **Personal Assistant** that proactively answers: *"What needs my attention today?"*
- **Autonomous AI Copilot (`/student/ai` & Floating Modal)**: Grounded against verified institutional bylaws and real-time attendance registers.
- **Safe-Bunk & Recovery Calculator**: Interactive simulator computing `(Attended + X) / (Total + X) >= 75%` to prevent examination debarments.
- **Instant Role Simulation**: Switch between **Student**, **Teacher**, **HOD**, and **Admin** instantly with zero credential friction.
- **Role-Based Workspaces**:
  - **Student**: Action feed, safe-bunk attendance, timetable, assignments countdown, exam seating, fee payments, scholarship AI match, placement recommendations, grievance timeline.
  - **Teacher**: Rapid attendance roll-call (<15s), assignment rubrics & grading queue, at-risk defaulters list.
  - **HOD**: Department intelligence, faculty workload hours, course pass rates, condonation hearings.
  - **Admin**: "What Needs Attention Today" triage, Recharts analytics, user RBAC directory, conflict-free timetable engine, AI agent observability.
- **Command Palette (`⌘K` / `Ctrl+K`)**: Rapid search across courses, assignments, notices, documents, and scholarships.
- **Responsive & PWA Ready**: Mobile bottom navigation bar with elevated center AI trigger.

---

## 🛠 Technology Stack

- **Framework**: [Next.js 15 (App Router)](https://nextjs.org/)
- **Language**: TypeScript (Strict typing, zero `any`)
- **Styling**: Tailwind CSS + CSS Design Tokens + Dark Mode (`class` based)
- **Component Primitives**: shadcn/ui design patterns, Lucide React icons
- **State Management**: TanStack Query (server state & caching) + Zustand (client UI & Auth)
- **Data Visualizations**: Recharts
- **Testing**: Vitest unit & integration test suite
- **Real-Time Integration**: Socket.IO client notification & sync hooks

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js `v18+` or `v20+` (Tested on Node `v24`)
- npm `v9+`

### 2. Installation
```bash
git clone <repo-url>
cd gravity-frontend
npm install
```

### 3. Environment Configuration
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Default variables:
```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
NEXT_PUBLIC_SOCKET_URL=http://localhost:3000
NEXT_PUBLIC_DEMO_MODE=true
NEXT_PUBLIC_COLLEGE_NAME=Apex Institute of Technology
NEXT_PUBLIC_COLLEGE_SHORT_CODE=AIT
```

### 4. Running the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Running the Tests
```bash
npm run test
```

### 6. Production Build
```bash
npm run build
npm start
```

---

## 🧭 Application Routes

### Marketing & Auth
- `/` — Modern landing page with hero showcases, personas, and architecture.
- `/login` — Institutional login with 1-click test role access and Google SSO.
- `/forgot-password` — Password recovery flow.
- `/reset-password` — Credential reset form.
- `/verify-email` — 2FA 6-digit device verification.

### Student Experience (`/student/...`)
- `/student/dashboard` — Personal assistant feed, priority cards, today's timetable.
- `/student/ai` — Dedicated Copilot with tool results, source citations, and official badges.
- `/student/attendance` — Attendance breakdown with live Safe-Bunk recovery simulator.
- `/student/timetable` — Weekly grid (desktop) & timeline (mobile).
- `/student/assignments` — Assignments queue, countdown timers, and submission dialog.
- `/student/exams` — Mid-term schedule, seating numbers, and hall ticket download.
- `/student/results` — SGPA/CGPA transcript and AI subject diagnostics.
- `/student/fees` — Fee ledger, payment gateway simulator, and official receipt generator.
- `/student/scholarships` — AI compatibility matcher with "Why am I eligible?" explainer.
- `/student/placements` — Recommended jobs with skill match scores and 1-click application.
- `/student/complaints` — Grievance ticket tracker with timeline and student rating.

### Teacher Experience (`/teacher/...`)
- `/teacher/dashboard` — Classes scheduled, grading queues, and at-risk students.
- `/teacher/attendance` — Roll call interface with Present/Absent/Late rapid toggles.
- `/teacher/assignments` — Assignment creator, rubric builder, and submission evaluation.
- `/teacher/students` — Class analytics and attendance defaulters monitor.

### HOD Experience (`/hod/...`)
- `/hod/dashboard` — Department intelligence, faculty workloads, and course pass rates.

### Admin Experience (`/admin/...`)
- `/admin/dashboard` — "What Needs Attention Today" triage and operations hub.
- `/admin/analytics` — Recharts visualizations for attendance, enrollment, CGPA, and fees.
- `/admin/users` — User directory with RBAC filters and CSV batch import/export.
- `/admin/academics` — Conflict-free timetable engine (teacher, room, section conflict detection).
- `/admin/ai-observability` — Audit log panel for agent queries, tool execution, and latency.

### Shared Campus Hub
- `/notices` — Official circulars with attachments and priority tags.
- `/documents` — Knowledge base with RAG search modal and ordinance citations.
- `/messages` — Real-time chat (Student ↔ Teacher, Admin bulletins).
- `/profile` — Academic identity, verified credentials, and active device sessions.
- `/settings` — Theme selector (Light/Dark/System), AI preferences, and notification toggles.

---

## 🔒 Security & Privacy Guidelines
- **Strict RBAC**: Routes adapt to authenticated roles (`STUDENT`, `TEACHER`, `HOD`, `ADMIN`).
- **No Client Secrets**: API keys, database credentials, and LLM secrets are strictly kept on the NestJS backend.
- **Privacy Boundary**: Private student-teacher messages and exam grades are excluded from generic vector indexing.
- **PCI-DSS Compliant Payment UX**: No sensitive payment credentials are stored or processed on the client.
