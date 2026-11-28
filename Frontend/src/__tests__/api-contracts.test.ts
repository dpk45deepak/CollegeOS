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

  it("adminApi.getAnalyticsData normalizes backend CGPA range/count and placement summary object", async () => {
    global.fetch = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes("/analytics/overview")) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            success: true,
            data: {
              attendanceThreshold: 75,
              feeCollection: { collected: 500000, outstanding: 100000 },
              complaints: { avgResolutionHours: 12, total: 10, resolved: 8 },
            },
          }),
        };
      }
      if (url.includes("/analytics/departments")) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            success: true,
            data: [{ department: "CSE", attendancePct: 86, avgCgpa: 8.2 }],
          }),
        };
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: {
            cgpaDistribution: [
              { range: "7.0-7.9", count: 40 },
              { range: "8.0-8.9", count: 55 },
            ],
            placementStats: {
              totalJobs: 12,
              openJobs: 5,
              drivesCount: 3,
              applicationsCount: 64,
              offersIssued: 20,
              offersAccepted: 18,
              averageCtc: 9.5,
              placementRatePct: 72,
            },
          },
        }),
      };
    });

    const data = await adminApi.getAnalyticsData();
    expect(data.cgpaDistribution).toEqual([
      { bracket: "7.0-7.9", students: 40 },
      { bracket: "8.0-8.9", students: 55 },
    ]);
    expect(data.placementStats).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ company: "Offers Issued", offers: 20 }),
        expect.objectContaining({ company: "Offers Accepted", offers: 18 }),
      ]),
    );
  });

  it("studentApi.payFee forwards explicit gateway parameter and preserves gateway metadata", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({
        success: true,
        data: {
          paymentId: "pay_rzp_1",
          gatewayRef: "order_123",
          clientPayload: { keyId: "rzp_test", orderId: "order_123", amount: 500000, currency: "INR" },
        },
      }),
    });

    const res = await studentApi.payFee(5000, "fee_1", "razorpay");
    expect(res.gateway).toBe("razorpay");
    expect(res.paymentId).toBe("pay_rzp_1");
    expect(res.clientPayload?.orderId).toBe("order_123");
    const fetchCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(JSON.parse(fetchCall[1].body)).toEqual({ gateway: "razorpay", amount: 5000 });
  });
});
