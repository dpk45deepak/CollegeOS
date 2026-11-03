# College OS — Demo User Credentials & Test Personas

This document outlines the demo accounts and pre-seeded academic scenarios created by the seed script (`Backend/prisma/seed.ts`).

---

## 🔑 Authentication Essentials

- **Tenant / College Code**: `SDIET` (Except `PLATFORM` Super Admin, which has no college code).
- **Default Password**: Set via `SEED_PASSWORD` during database seeding (e.g. `Dev-Passw0rd-123`).
  - *Note: Passwords must be at least 10 characters long and contain both letters and numbers.*
- **College Name**: Satyug Darshan Institute of Engineering and Technology
- **Domain**: `sdcet.example`
- **Login Format**:
  - Web UI: Select role / enter `Login ID`, `Password`, and `College Code: SDIET`
  - REST API: `POST /api/v1/auth/login` with body `{ "loginId": "...", "password": "...", "collegeCode": "SDIET" }`

---

## 👥 Seeded User Accounts by Role

### 1. Platform Super Admin (Multi-Tenant Root)
| Login ID | Name | Role | College Code | Email | Purpose |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `PLATFORM` | Platform Admin | `SUPER_ADMIN` | *(Leave empty)* | `platform@college-os.example` | System-wide administrator. Can manage colleges, global settings, and system roles. |

---

### 2. College Administration & Operations
All accounts below belong to `collegeCode: SDIET`.

| Login ID | Name | Role | Email | Responsibilities & Test Scenarios |
| :--- | :--- | :--- | :--- | :--- |
| `ADMIN001` | Anita Verma | `COLLEGE_ADMIN` | `admin001@sdcet.example` | Institution-level configuration, timetable conflicts, user directory, published circulars. |
| `ACC001` | Rohit Mehta | `ACCOUNTANT` | `acc001@sdcet.example` | Fee structures, student fee ledgers, payment tracking, pending scholarship approvals. |
| `EXAM001` | Sunita Rao | `EXAM_CONTROLLER` | `exam001@sdcet.example` | Exam schedules (Mid-Sem & End-Sem), hall ticket generation, marks approval, GPA publishing. |
| `PLC001` | Karan Malhotra | `PLACEMENT_OFFICER`| `plc001@sdcet.example` | Companies (`Acme Software`, `Nova Analytics`), job drives, applicant eligibility review. |
| `SUP001` | Imran Sheikh | `SUPPORT_STAFF` | `sup001@sdcet.example` | IT and campus facility complaints, maintenance tickets (e.g., Lab Wi-Fi tickets). |

---

### 3. Faculty & Department Heads (HOD)
All faculty accounts belong to `collegeCode: SDIET`.

| Login ID | Name | Department | Roles | Assigned Subject / Responsibility |
| :--- | :--- | :--- | :--- | :--- |
| `CSE-T01` | Dr. Meera Kulkarni | Computer Science | `HOD`, `TEACHER` | Professor & HOD. Teaches **CS501 (DBMS)**. Reviews attendance condonations & escalated grievances. |
| `CSE-T02` | Arjun Nair | Computer Science | `TEACHER` | Assistant Professor. Teaches **CS502 (Operating Systems)**. |
| `CSE-T03` | Pooja Iyer | Computer Science | `TEACHER` | Assistant Professor. Teaches **CS503 (Computer Networks)**. |
| `CSE-T04` | Sandeep Joshi | Computer Science | `TEACHER` | Assistant Professor. Teaches **CS504 (Software Engineering)**. |
| `CSE-T05` | Neha Bansal | Computer Science | `TEACHER` | Assistant Professor. Teaches **CS505 (Theory of Computation)**. |
| `CE-T01` | Vikram Singh | Civil Engineering | `HOD`, `TEACHER` | Professor & HOD of Civil Engineering. |

---

### 4. Students (B.Tech Computer Science — 5th Semester)
Section A (`secA`) and Section B (`secB`) students. All belong to `collegeCode: SDIET`.

| Login ID | Name | Sec & Roll | CGPA | Key Scenario / Condition |
| :--- | :--- | :--- | :--- | :--- |
| `CSE23001` | **Aarav Sharma** | Sec A, Roll A01 | ~8.9 | **Star Student**: High attendance (~92%), full fees paid, portfolio projects, skills (`typescript`, `react`, `sql`), eligible for merit scholarships. |
| `CSE23002` | **Diya Patel** | Sec A, Roll A02 | ~8.2 | Standard profile, partial fee paid, Python/ML skills, has active scholarship grievance `GRV-2026-00001`. |
| `CSE23003` | **Kabir Khan** | Sec A, Roll A03 | ~7.2 | **Attendance Shortage Alert**: Attendance ~60% (below 75% minimum threshold). Ideal for testing safe-bunk / condonation workflows. |
| `CSE23004` | **Ananya Reddy** | Sec A, Roll A04 | ~8.4 | Standard profile, React/Node skills. |
| `CSE23005` | **Rohan Das** | Sec A, Roll A05 | ~6.8 | **Sudden Attendance Decline**: Attendance dropped severely in the last 5 days (<15%). At-risk student alert. |
| `CSE23006` | **Ishita Gupta** | Sec A, Roll A06 | ~7.9 | Marked absent grievance `GRV-2026-00003` currently under HOD review. |
| `CSE23007` | **Vivaan Mishra** | Sec A, Roll A07 | ~7.6 | **Borderline Attendance**: Attendance ~78% (close to 75% debarment cut-off). |
| `CSE23008` | **Saanvi Joshi** | Sec A, Roll A08 | ~8.1 | Standard profile. |
| `CSE23009` | **Aditya Rao** | Sec A, Roll A09 | ~7.5 | Standard profile. |
| `CSE23010` | **Myra Kapoor** | Sec A, Roll A10 | ~6.5 | **Severe Attendance Debarment**: Attendance ~55%. Flagged as examination defaulter. |
| `CSE23011` | Reyansh Jain | Sec A, Roll A11 | ~7.8 | Standard profile. |
| `CSE23012` | Kiara Menon | Sec A, Roll A12 | ~8.0 | Standard profile. |
| `CSE23013` | Arnav Bhatt | Sec B, Roll B01 | ~7.3 | Section B student. |
| `CSE23014` | Zoya Ali | Sec B, Roll B02 | ~7.7 | Section B student. |
| `CSE23015` | Dev Chauhan | Sec B, Roll B03 | ~7.0 | Section B student. |
| `CSE23016` | Tara Pillai | Sec B, Roll B04 | ~8.3 | Section B student. |
| `CSE23017` | Yash Agarwal | Sec B, Roll B05 | ~7.4 | Section B student. |
| `CSE23018` | Navya Nambiar | Sec B, Roll B06 | ~8.2 | Section B student. |

#### Additional B.Tech Civil Engineering Students:
- `CE23001` — Neel Thakur (Roll C1, CGPA 7.1)
- `CE23002` — Riya Saxena (Roll C2, CGPA 7.1)
- `CE23003` — Om Kulkarni (Roll C3, CGPA 7.1)

---

### 5. Parent Account
| Login ID | Name | Role | Email | Linked Student |
| :--- | :--- | :--- | :--- | :--- |
| `PAR-CSE23001` | Suresh Sharma | `PARENT` | `par-cse23001@sdcet.example` | Ward: Aarav Sharma (`CSE23001`) |

---

## 🧪 Pre-Configured Test Scenarios

1. **Safe-Bunk Simulator & Debarment**:
   - Log in as `CSE23003` or `CSE23010` to test debarment notices and recovery calculations.
   - Log in as `CSE23007` to test borderline recovery scenarios.
2. **Teacher Grading & Attendance**:
   - Log in as `CSE-T01` (Dr. Meera Kulkarni) to review attendance roll call for CS501 and grade submissions.
3. **HOD Grievance & Condonation Workflow**:
   - Log in as `CSE-T01` to view departmental metrics and resolve attendance complaint `GRV-2026-00003`.
4. **Fees & Accounts**:
   - Log in as `ACC001` to view fee statuses (paid, partial, overdue) across B.Tech batches.
5. **AI Knowledge Base & Policy Grounding**:
   - Sample policies are pre-indexed: Attendance Policy 2026-27, Examination Rules 2026-27, Scholarship Guidelines, Lab Safety Manual.

