import { describe, it, expect, vi, beforeEach } from "vitest";
import { normalizeUserProfile } from "../lib/api/auth";
import { studentApi } from "../lib/api/student";

describe("Cycle 2 Student Hydration & Workflow Contracts", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("normalizeUserProfile hydrates student academic metadata from /users/me", () => {
    const user = normalizeUserProfile({
      id: "u1",
      collegeId: "c1",
      loginId: "ME23009",
      email: "me23009@college.edu",
      firstName: "Rohan",
      lastName: "Verma",
      status: "ACTIVE",
      userRoles: [{ role: { key: "STUDENT" }, departmentId: "dep_me" }],
      student: {
        id: "stu1",
        collegeStudentId: "ME23009",
        rollNumber: "23ME009",
        cgpa: "8.45",
        department: { id: "dep_me", name: "Mechanical Engineering", code: "ME" },
        program: { id: "prog_me", name: "B.Tech Mechanical", code: "BTME" },
        batch: { id: "bat23", name: "2023-2027" },
        semester: { id: "sem5", number: 5, academicYear: "2026-27" },
        section: { id: "secB", name: "B" },
      },
    });

    expect(user.rollNumber).toBe("23ME009");
    expect(user.department).toBe("Mechanical Engineering");
    expect(user.program).toBe("B.Tech Mechanical");
    expect(user.semester).toBe(5);
    expect(user.cgpa).toBe(8.45);
    expect(user.section).toBe("B");
  });

  it("studentApi.getFees and payFee target the first unpaid fee head when head 0 is paid", async () => {
    const mockFees = [
      {
        id: "fee_paid",
        netPayable: 50000,
        amountPaid: 50000,
        outstanding: 0,
        dueDate: "2026-07-01T00:00:00.000Z",
        status: "PAID",
        feeStructure: { name: "Tuition Sem 4", academicYear: "2025-26", components: [{ name: "Tuition", amount: 50000 }] },
        payments: [],
      },
      {
        id: "fee_due",
        netPayable: 12000,
        amountPaid: 0,
        outstanding: 12000,
        dueDate: "2026-10-01T00:00:00.000Z",
        status: "PENDING",
        feeStructure: { name: "Hostel Fee", academicYear: "2026-27", components: [{ name: "Hostel", amount: 12000 }] },
        payments: [],
      },
    ];

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true, data: mockFees }),
    });
    global.fetch = fetchMock;

    const feeSummary = await studentApi.getFees();
    expect(feeSummary.id).toBe("fee_due");
    expect(feeSummary.pendingAmount).toBe(12000);
    expect(feeSummary.feeHeads).toHaveLength(2);

    await studentApi.payFee(12000);
    const postCall = fetchMock.mock.calls[2];
    expect(String(postCall[0])).toContain("/fees/fee_due/payments");
  });

  it("studentApi.getAssignments maps attachmentKeys and LATE submission status", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: [
          {
            id: "asg1",
            title: "Graph Traversal",
            attachmentKeys: ["colleges/c1/assignments/spec.pdf"],
            dueAt: "2026-10-15T00:00:00.000Z",
            maxMarks: 20,
            subjectOffering: { subject: { code: "CS301", name: "Algorithms" } },
            submission: { status: "LATE", marks: 16 },
          },
        ],
      }),
    });

    const list = await studentApi.getAssignments();
    expect(list[0].status).toBe("LATE");
    expect(list[0].attachments).toEqual([
      { name: "spec.pdf", size: "", url: "colleges/c1/assignments/spec.pdf" },
    ]);
  });

  it("studentApi.getResults retains exam metadata and distinguishes 0 grade points", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: [
          {
            id: "res1",
            marksObtained: 25,
            grade: "F",
            gradePoints: 0,
            passed: false,
            exam: {
              id: "ex1",
              title: "Mid Sem",
              type: "MID_SEM",
              maxMarks: 100,
              subjectOffering: {
                subject: { code: "CS301", name: "Algorithms", credits: 4 },
                semester: { number: 5, academicYear: "2026-27" },
              },
            },
          },
        ],
      }),
    });

    const transcript = await studentApi.getResults();
    expect(transcript.results[0].gradePoint).toBe(0);
    expect(transcript.results[0].examType).toBe("MID_SEM");
    expect(transcript.sgpa).toBe(0);
  });

  it("studentApi.getComplaints reads assignedTo User and real events timeline", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: [
          {
            id: "cmp1",
            ticketNo: "TKT-0042",
            category: "IT",
            subject: "Lab Projector Dim",
            description: "Needs bulb replacement",
            priority: "HIGH",
            status: "ASSIGNED",
            assignedTo: { id: "sup1", firstName: "Vikram", lastName: "Rao" },
            events: [
              { id: "ev1", type: "ASSIGNED", note: "Routed to IT Desk", createdAt: "2026-11-20T10:00:00Z" },
            ],
          },
        ],
      }),
    });

    const list = await studentApi.getComplaints();
    expect(list[0].assignedTo).toBe("Vikram Rao");
    expect(list[0].timeline[0].title).toBe("ASSIGNED");
    expect(list[0].timeline[0].description).toBe("Routed to IT Desk");
  });
});
