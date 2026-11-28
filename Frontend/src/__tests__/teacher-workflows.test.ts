import { describe, it, expect, vi, beforeEach } from "vitest";
import { teacherApi } from "../lib/api/teacher";

describe("Cycle 3 Faculty Workflow Contracts", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("teacherApi.getTodayClasses uses live /attendance/teacher/scheduled-sessions state", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: [
          {
            slotId: "slot_1",
            subjectOfferingId: "off_cs301",
            subject: { id: "sub1", code: "CS301", name: "Algorithms" },
            section: { id: "secA", name: "A" },
            semester: { id: "sem5", number: 5 },
            teacher: { id: "t1", name: "Prof. Verma" },
            room: { id: "r1", code: "LH-201" },
            date: "2026-11-26",
            startMinute: 540,
            endMinute: 600,
            startTime: "09:00",
            endTime: "10:00",
            enrolledStudents: 42,
            isMarked: true,
            markedCount: 42,
          },
        ],
      }),
    });

    const classes = await teacherApi.getTodayClasses();
    expect(classes).toHaveLength(1);
    expect(classes[0].attendanceMarked).toBe(true);
    expect(classes[0].subjectCode).toBe("CS301");
    expect(classes[0].room).toBe("LH-201");
    expect(classes[0].time).toBe("09:00 - 10:00");
  });
});
