import { describe, it, expect, vi, beforeEach } from "vitest";
import { aiApi } from "../lib/api/ai";
import { ApiError } from "../lib/api/client";

describe("AI Copilot API Engine Integration", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("resolves attendance deficit queries with backend tool execution and citations", async () => {
    const mockBackendResponse = {
      success: true,
      data: {
        reply: "Your current attendance in DBMS is 71.1%. You need to attend 7 consecutive classes to cross 75%.",
        mode: "tool",
        citations: [
          {
            documentId: "doc_policy_2026",
            title: "SDIET Academic Regulations",
            pageNumber: 14,
            snippet: "Mandatory minimum attendance threshold is 75% per course.",
          },
        ],
        collegeData: [
          {
            tool: "attendance_calculator.solve_threshold",
            ok: true,
            summary: "Deficit of 3.9% identified. 7 classes required.",
            data: { currentPercent: 71.1, requiredClasses: 7 },
          },
        ],
      },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockBackendResponse,
    });

    const res = await aiApi.sendMessage("Why is my attendance low in DBMS?");
    expect(res.content).toContain("71.1%");
    expect(res.isOfficial).toBe(true);
    expect(res.citations).toBeDefined();
    expect(res.citations?.length).toBe(1);
    expect(res.citations?.[0].title).toBe("SDIET Academic Regulations");
    expect(res.toolExecution?.toolName).toBe("attendance_calculator.solve_threshold");
    expect(res.toolExecution?.summary).toContain("7 classes required");
  });

  it("resolves exam questions with hall ticket location and syllabus", async () => {
    const mockBackendResponse = {
      success: true,
      data: {
        reply: "Your Mid-Term Examination is on Oct 24 in Hall 4.",
        mode: "tool",
        collegeData: [
          {
            tool: "exam_scheduler.get_schedule",
            ok: true,
            summary: "Hall ticket seating allocated.",
          },
        ],
      },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockBackendResponse,
    });

    const res = await aiApi.sendMessage("When is my next exam and where is my seat?");
    expect(res.content).toContain("Mid-Term Examination");
    expect(res.content).toContain("Hall 4");
    expect(res.isOfficial).toBe(true);
  });

  it("resolves scholarship discovery queries with tool execution", async () => {
    const mockBackendResponse = {
      success: true,
      data: {
        reply: "You qualify for the Apex Merit Excellence Award based on your CGPA.",
        mode: "tool",
        collegeData: [
          {
            tool: "scholarship_matcher.evaluate_student_profile",
            ok: true,
            summary: "Matched 1 eligible merit scholarship.",
          },
        ],
      },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockBackendResponse,
    });

    const res = await aiApi.sendMessage("Find scholarships for me");
    expect(res.content).toContain("Apex Merit Excellence Award");
    expect(res.toolExecution?.toolName).toBe("scholarship_matcher.evaluate_student_profile");
  });

  it("throws ApiError when backend AI service is unavailable without falling back to mock fixtures", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => ({
        success: false,
        message: "AI Supervisor unavailable",
      }),
    });

    await expect(aiApi.sendMessage("Test message")).rejects.toThrowError(ApiError);
  });
});
