import { describe, it, expect, vi, beforeEach } from "vitest";
import { studentApi } from "../lib/api/student";
import { teacherApi } from "../lib/api/teacher";
import { hodApi } from "../lib/api/hod";
import { adminApi } from "../lib/api/admin";
import { messagesApi } from "../lib/api/messages";

describe("College OS API Client Contracts & Paginated Response Unboxing", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("studentApi.getAssignments correctly unboxes paginated items and maps subjectOffering", async () => {
    const mockPaginatedData = {
      items: [
        {
          id: "asg_1",
          title: "Operating Systems Assignment 1",
          description: "Deadlock prevention algorithms",
          dueAt: "2026-10-25T18:30:00.000Z",
          maxMarks: 50,
          subjectOffering: {
            subject: { name: "Operating Systems", code: "CS502" },
            teacher: { user: { firstName: "Pooja", lastName: "Sharma" } },
          },
          submission: { status: "GRADED", marks: 45, feedback: "Excellent implementation" },
        },
      ],
      total: 1,
      page: 1,
      pageSize: 20,
      totalPages: 1,
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: mockPaginatedData,
      }),
    });

    const assignments = await studentApi.getAssignments();
    expect(assignments).toHaveLength(1);
    expect(assignments[0].title).toBe("Operating Systems Assignment 1");
    expect(assignments[0].subjectCode).toBe("CS502");
    expect(assignments[0].teacherName).toBe("Pooja Sharma");
    expect(assignments[0].totalMarks).toBe(50);
    expect(assignments[0].obtainedMarks).toBe(45);
  });

  it("teacherApi.getTodayClasses correctly unboxes paginated offerings", async () => {
    const mockOfferings = {
      items: [
        {
          id: "off_1",
          subject: { code: "CS601", name: "Database Management" },
          section: { name: "B.Tech CSE - 6A" },
          defaultRoom: { number: "LH-201" },
          _count: { enrollments: 62 },
        },
      ],
      total: 1,
      page: 1,
      pageSize: 20,
      totalPages: 1,
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: mockOfferings,
      }),
    });

    const classes = await teacherApi.getTodayClasses();
    expect(classes).toHaveLength(1);
    expect(classes[0].subjectCode).toBe("CS601");
    expect(classes[0].section).toBe("B.Tech CSE - 6A");
    expect(classes[0].room).toBe("LH-201");
    expect(classes[0].enrolledStudents).toBe(62);
  });

  it("hodApi.getDepartmentMetrics aggregates overview and faculty count", async () => {
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes("/analytics/overview")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            success: true,
            data: {
              students: 480,
              attendancePercentage: 81.4,
              studentsBelowThreshold: 24,
            },
          }),
        });
      }
      if (url.includes("/teachers")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            success: true,
            data: {
              items: [],
              total: 28,
            },
          }),
        });
      }
      return Promise.reject(new Error("Unknown route"));
    });

    const metrics = await hodApi.getDepartmentMetrics();
    expect(metrics.totalStudents).toBe(480);
    expect(metrics.totalFaculty).toBe(28);
    expect(metrics.avgAttendance).toBe(81.4);
    expect(metrics.studentsBelow75).toBe(24);
  });

  it("adminApi.getUsers unboxes paginated user directory", async () => {
    const mockUsers = {
      items: [
        {
          id: "usr_1",
          loginId: "CSE-T01",
          email: "hod.cse@sdiet.edu",
          firstName: "Dr. Ramesh",
          lastName: "Kumar",
          status: "ACTIVE",
          createdAt: "2026-01-15T09:00:00.000Z",
          userRoles: [{ role: { key: "HOD" }, department: { code: "CSE" } }],
        },
      ],
      total: 1,
      page: 1,
      pageSize: 20,
      totalPages: 1,
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: mockUsers,
      }),
    });

    const users = await adminApi.getUsers();
    expect(users).toHaveLength(1);
    expect(users[0].name).toBe("Dr. Ramesh Kumar");
    expect(users[0].role).toBe("HOD");
    expect(users[0].department).toBe("CSE");
  });

  it("messagesApi.getConversations unboxes paginated conversations list", async () => {
    const mockConversations = {
      items: [
        {
          id: "conv_1",
          type: "DIRECT",
          participants: [
            { user: { id: "u1", loginId: "21CS042", firstName: "Arun", lastName: "Verma" } },
          ],
        },
      ],
      total: 1,
      page: 1,
      pageSize: 20,
      totalPages: 1,
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: mockConversations,
      }),
    });

    const conversations = await messagesApi.getConversations();
    expect(conversations).toHaveLength(1);
    expect(conversations[0].id).toBe("conv_1");
  });
});
