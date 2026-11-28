import { describe, it, expect, vi, beforeEach } from "vitest";
import { apiClientWithMeta } from "../lib/api/client";
import { adminApi } from "../lib/api/admin";
import { studentApi } from "../lib/api/student";
import { teacherApi } from "../lib/api/teacher";
import { documentsApi } from "../services/api/documents.api";
import { feesApi } from "../services/api/fees.api";
import { examsApi } from "../services/api/exams.api";
import { reportsApi } from "../services/api/reports.api";
import { storageApi } from "../services/api/storage.api";
import { getRoleHomePath, isAuthorizedForPath, resolvePrimaryRole } from "../lib/roles";

describe("Stakeholder Role Routing & Navigation Guards (All 11 Roles)", () => {
  it("routes every stakeholder role to its dedicated portal home", () => {
    expect(getRoleHomePath("STUDENT")).toBe("/student/dashboard");
    expect(getRoleHomePath("PARENT")).toBe("/parent/dashboard");
    expect(getRoleHomePath("TEACHER")).toBe("/teacher/dashboard");
    expect(getRoleHomePath("HOD")).toBe("/hod/dashboard");
    expect(getRoleHomePath("ACCOUNTANT")).toBe("/accountant/dashboard");
    expect(getRoleHomePath("EXAM_CONTROLLER")).toBe("/exam-controller/dashboard");
    expect(getRoleHomePath("PLACEMENT_OFFICER")).toBe("/placement-officer/dashboard");
    expect(getRoleHomePath("SUPPORT_STAFF")).toBe("/support/dashboard");
    expect(getRoleHomePath("LIBRARY_STAFF")).toBe("/library/dashboard");
    expect(getRoleHomePath("COLLEGE_ADMIN")).toBe("/admin/dashboard");
    expect(getRoleHomePath("SUPER_ADMIN")).toBe("/admin/dashboard");
  });

  it("enforces role boundaries without blocking shared workspace routes", () => {
    expect(isAuthorizedForPath("/accountant/dashboard", "ACCOUNTANT")).toBe(true);
    expect(isAuthorizedForPath("/accountant/dashboard", "STUDENT")).toBe(false);
    expect(isAuthorizedForPath("/parent/dashboard", "PARENT")).toBe(true);
    expect(isAuthorizedForPath("/student/fees", "PARENT")).toBe(true);
    expect(isAuthorizedForPath("/student/exams", "STUDENT")).toBe(true);
    expect(isAuthorizedForPath("/admin/users", "TEACHER")).toBe(false);
    expect(isAuthorizedForPath("/campus-life", "TEACHER")).toBe(true);
    expect(isAuthorizedForPath("/support/dashboard", "SUPPORT_STAFF")).toBe(true);
    expect(isAuthorizedForPath("/library/dashboard", "LIBRARY_STAFF")).toBe(true);
    expect(isAuthorizedForPath("/student/complaints", "HOD")).toBe(true);
    expect(isAuthorizedForPath("/student/complaints", "TEACHER")).toBe(false);
  });

  it("prioritizes higher privilege role keys when multiple roles are assigned", () => {
    expect(resolvePrimaryRole(["TEACHER", "HOD"])).toBe("HOD");
    expect(resolvePrimaryRole(["STUDENT", "COLLEGE_ADMIN"])).toBe("COLLEGE_ADMIN");
  });
});

describe("API Client Pagination Meta Preservation & Contract Safety", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("preserves meta pagination without breaking Array.isArray callers", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: [{ id: "u1" }],
        meta: { page: 2, limit: 20, total: 45, totalPages: 3 },
      }),
    });

    const { data, meta } = await apiClientWithMeta<any[]>("/users");
    expect(Array.isArray(data)).toBe(true);
    expect(data).toHaveLength(1);
    expect(meta?.total).toBe(45);
    expect(meta?.totalPages).toBe(3);
  });

  it("adminApi.getAttentionMetrics unwraps { items } and maps backend actions to UI routes", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: {
          generatedAt: "2026-11-25T00:00:00Z",
          scope: "college",
          items: [
            {
              key: "fees_overdue",
              severity: "HIGH",
              count: 4,
              message: "₹50,000 overdue",
              action: "GET /api/v1/fees?status=OVERDUE",
            },
          ],
        },
      }),
    });

    const metrics = await adminApi.getAttentionMetrics();
    expect(metrics).toHaveLength(1);
    expect(metrics[0].count).toBe(4);
    expect(metrics[0].actionUrl).toBe("/accountant/dashboard");
  });

  it("studentApi.getScholarships computes deterministic matchScore without NaN", async () => {
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes("/scholarships/matches")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            success: true,
            data: [
              {
                scholarship: {
                  id: "sch1",
                  name: "Merit Excellence Grant",
                  provider: "SDIET",
                  type: "MERIT",
                  amount: 25000,
                  requiredDocuments: ["ID Card"],
                },
                match: { fit: "ELIGIBLE", met: ["CGPA >= 8.0"], unmet: [], toVerify: [] },
              },
            ],
          }),
        });
      }
      return Promise.resolve({ ok: true, status: 200, json: async () => ({ success: true, data: [] }) });
    });

    const list = await studentApi.getScholarships();
    expect(list).toHaveLength(1);
    expect((list[0] as any).matchScore).toBe(100);
    expect((list[0] as any).title).toBe("Merit Excellence Grant");
    expect(Number.isNaN((list[0] as any).matchScore)).toBe(false);
  });

  it("reportsApi.downloadCsv & storageApi.downloadFile send Bearer auth and throw on HTTP failure", async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
    });
    global.fetch = fetchSpy;
    (globalThis as any).window = globalThis;
    (globalThis as any).localStorage = {
      getItem: (k: string) => (k === "college_os_token" ? "jwt_test_123" : null),
    };

    await expect(reportsApi.downloadCsv("fees")).rejects.toThrow(/403/);
    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/v1/reports/fees",
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: "Bearer jwt_test_123" }),
      }),
    );

    await expect(storageApi.downloadFile("c1/reports/test.pdf")).rejects.toThrow(/403/);
    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/v1/files/download?key=c1%2Freports%2Ftest.pdf",
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: "Bearer jwt_test_123" }),
      }),
    );

    delete (globalThis as any).window;
    delete (globalThis as any).localStorage;
  });

  it("teacherApi covers missing submissions, leave status history, and lecture exceptions", async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true, data: { pastDue: true, students: [] } }),
    });
    global.fetch = fetchSpy;

    await teacherApi.getMissingSubmissions("asg-1");
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining("/assignments/asg-1/missing"),
      expect.anything(),
    );

    await teacherApi.getMyLeaves();
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining("/leave-requests"),
      expect.anything(),
    );

    await teacherApi.createTimetableException({
      slotId: "slot1",
      date: "2026-11-26",
      type: "CANCELLED",
      reason: "Faculty medical leave",
    });
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining("/timetable/exceptions"),
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("specialist portal actions invoke documents visibility, fee structures, and grading scheme contracts", async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true, data: { id: "ok1" } }),
    });
    global.fetch = fetchSpy;

    await documentsApi.updateVisibility("doc-1", { visibility: "TEACHERS" });
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining("/documents/doc-1/visibility"),
      expect.objectContaining({ method: "PATCH" }),
    );

    await feesApi.createStructure({
      name: "BTech Odd Sem",
      academicYear: "2026-27",
      components: [{ name: "Tuition", amount: 50000 }],
    });
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining("/fees/structures"),
      expect.objectContaining({ method: "POST" }),
    );

    await examsApi.createGradingScheme({
      name: "10-Point",
      bands: [{ grade: "A", min: 80, max: 100, points: 10 }],
      isDefault: true,
    });
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining("/grading-schemes"),
      expect.objectContaining({ method: "POST" }),
    );
  });
});
