const fs = require("fs");

// 1. complaints.api.ts
let api = fs.readFileSync("Frontend/src/services/api/complaints.api.ts", "utf8");

api = api.replace(
  `export type ComplaintCategory =
  | "ACADEMIC"
  | "FACILITY"
  | "HOSTEL"
  | "FINANCE"
  | "DISCIPLINE"
  | "HARASSMENT"
  | "EXAMINATION"
  | "OTHER";`,
  `export type ComplaintCategory =
  | "ACADEMIC"
  | "FACULTY"
  | "INFRASTRUCTURE"
  | "HOSTEL"
  | "TRANSPORT"
  | "IT"
  | "FEES"
  | "SCHOLARSHIP"
  | "EXAMINATION"
  | "ATTENDANCE"
  | "OTHER"
  | "FACILITY"
  | "FINANCE"
  | "DISCIPLINE"
  | "HARASSMENT";`
);

api = api.replace(
  'export type ComplaintPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";',
  'export type ComplaintPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT" | "CRITICAL";'
);

api = api.replace(
  `export type ComplaintStatus =
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "RESOLVED"
  | "REOPENED"
  | "CLOSED";`,
  `export type ComplaintStatus =
  | "OPEN"
  | "ASSIGNED"
  | "INVESTIGATING"
  | "RESOLVED"
  | "AWAITING_FEEDBACK"
  | "CLOSED"
  | "ESCALATED"
  | "REOPENED"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "IN_PROGRESS";`
);

const oldUpdateStatus = `  updateStatus: async (id: string, dto: { status: ComplaintStatus; note?: string }): Promise<ComplaintItem> => {
    return apiClient<ComplaintItem>(\`/complaints/\${id}/status\`, {
      method: "PATCH",
      body: JSON.stringify(dto),
    });
  },`;

const newUpdateStatus = `  updateStatus: async (id: string, dto: { status: ComplaintStatus; note?: string }): Promise<ComplaintItem> => {
    let normalizedStatus = dto.status;
    if (dto.status === "SUBMITTED") normalizedStatus = "OPEN";
    else if (dto.status === "UNDER_REVIEW") normalizedStatus = "ASSIGNED";
    else if (dto.status === "IN_PROGRESS") normalizedStatus = "INVESTIGATING";

    return apiClient<ComplaintItem>(\`/complaints/\${id}/status\`, {
      method: "PATCH",
      body: JSON.stringify({
        status: normalizedStatus,
        note: dto.note,
      }),
    });
  },`;

api = api.replace(/\r\n/g, "\n");
if (api.includes(oldUpdateStatus.replace(/\r\n/g, "\n"))) {
  api = api.replace(oldUpdateStatus.replace(/\r\n/g, "\n"), newUpdateStatus);
}

fs.writeFileSync("Frontend/src/services/api/complaints.api.ts", api);
console.log("Successfully patched complaints.api.ts");

// 2. student.ts
let student = fs.readFileSync("Frontend/src/lib/api/student.ts", "utf8");

const oldStudentCreate = `  createComplaint: async (data: {
    category: Complaint["category"];
    subject: string;
    description: string;
    priority?: string;
  }) => {
    return apiClient<Complaint>(
      "/complaints",
      {
        method: "POST",
        body: JSON.stringify({
          subject: data.subject,
          description: data.description,
          category: data.category?.toUpperCase() || "ACADEMIC",
          priority: data.priority?.toUpperCase() || "MEDIUM",
        }),
      }
    );
  },`;

const newStudentCreate = `  createComplaint: async (data: {
    category: Complaint["category"];
    subject: string;
    description: string;
    priority?: string;
  }) => {
    let cat = (data.category || "").toUpperCase();
    if (cat === "FEE" || cat === "FINANCE") cat = "FEES";
    else if (cat === "FACILITY" || cat === "INFRASTRUCTURE") cat = "INFRASTRUCTURE";
    else if (cat === "RAGGING/HARASSMENT" || cat === "HARASSMENT" || cat === "DISCIPLINE") cat = "OTHER";
    else if (!["ACADEMIC", "FACULTY", "INFRASTRUCTURE", "HOSTEL", "TRANSPORT", "IT", "FEES", "SCHOLARSHIP", "EXAMINATION", "ATTENDANCE", "OTHER"].includes(cat)) {
      cat = "OTHER";
    }

    let pri = (data.priority || "MEDIUM").toUpperCase();
    if (pri === "CRITICAL") pri = "URGENT";

    return apiClient<Complaint>(
      "/complaints",
      {
        method: "POST",
        body: JSON.stringify({
          subject: data.subject,
          description: data.description,
          category: cat,
          priority: pri,
        }),
      }
    );
  },`;

student = student.replace(/\r\n/g, "\n");
if (student.includes(oldStudentCreate.replace(/\r\n/g, "\n"))) {
  student = student.replace(oldStudentCreate.replace(/\r\n/g, "\n"), newStudentCreate);
}

fs.writeFileSync("Frontend/src/lib/api/student.ts", student);
console.log("Successfully patched student.ts");

// 3. complaints/page.tsx
let page = fs.readFileSync("Frontend/src/app/(student)/student/complaints/page.tsx", "utf8");

page = page.replace(
  'const [newStatus, setNewStatus] = useState<ComplaintStatus>("IN_PROGRESS");',
  'const [newStatus, setNewStatus] = useState<ComplaintStatus>("INVESTIGATING");'
);

const oldValidation = `  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) return;
    createMutation.mutate({
      category,
      priority,
      subject,
      description,
      location,
    });
  };`;

const newValidation = `  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) {
      toast.error("Please fill in subject and description");
      return;
    }
    if (subject.trim().length < 5) {
      toast.error("Subject must be at least 5 characters long");
      return;
    }
    if (description.trim().length < 10) {
      toast.error("Description must be at least 10 characters long");
      return;
    }
    createMutation.mutate({
      category,
      priority,
      subject: subject.trim(),
      description: description.trim(),
      location: location.trim() || undefined,
    });
  };`;

page = page.replace(/\r\n/g, "\n");
if (page.includes(oldValidation.replace(/\r\n/g, "\n"))) {
  page = page.replace(oldValidation.replace(/\r\n/g, "\n"), newValidation);
}

// Select options in create modal
const oldCatSelect = `<select
                value={category}
                onChange={(e) => setCategory(e.target.value as Complaint["category"])}
                className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs"
              >
                <option value="Infrastructure">Infrastructure</option>
                <option value="Academic">Academic</option>
                <option value="Hostel">Hostel</option>
                <option value="Library">Library</option>
                <option value="Fee">Fee / Accounts</option>
                <option value="Ragging/Harassment">Ragging / Anti-Harassment</option>
              </select>`;

const newCatSelect = `<select
                value={category}
                onChange={(e) => setCategory(e.target.value as Complaint["category"])}
                className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs"
              >
                <option value="INFRASTRUCTURE">Infrastructure & Campus Facilities</option>
                <option value="ACADEMIC">Academic & Curriculum</option>
                <option value="FACULTY">Faculty & Instruction</option>
                <option value="HOSTEL">Hostel & Accommodation</option>
                <option value="FEES">Fees & Financial Accounts</option>
                <option value="EXAMINATION">Examinations & Seating</option>
                <option value="ATTENDANCE">Attendance & Debarment Dispute</option>
                <option value="IT">IT & Lab Systems</option>
                <option value="TRANSPORT">Campus Transport</option>
                <option value="OTHER">Other / General Grievance</option>
              </select>`;

if (page.includes(oldCatSelect.replace(/\r\n/g, "\n"))) {
  page = page.replace(oldCatSelect.replace(/\r\n/g, "\n"), newCatSelect);
}

fs.writeFileSync("Frontend/src/app/(student)/student/complaints/page.tsx", page);
console.log("Successfully patched complaints/page.tsx");
