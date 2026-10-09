import { describe, it, expect } from "vitest";
import { aiApi } from "../lib/api/ai";

describe("AI Copilot API Engine", () => {
  it("resolves attendance deficit queries with tool citation", async () => {
    const res = await aiApi.sendMessage("Why is my attendance low in DBMS?");
    expect(res.content).toContain("71.1%");
    expect(res.isRecommendation).toBe(true);
    expect(res.citations).toBeDefined();
    expect(res.citations?.length).toBeGreaterThan(0);
    expect(res.toolExecution?.toolName).toBe("attendance_calculator.solve_threshold");
  });

  it("resolves exam questions with hall ticket location and syllabus", async () => {
    const res = await aiApi.sendMessage("When is my next exam and where is my seat?");
    expect(res.content).toContain("Mid-Term Examination");
    expect(res.content).toContain("Hall 4");
    expect(res.isOfficial).toBe(true);
  });

  it("resolves scholarship discovery queries", async () => {
    const res = await aiApi.sendMessage("Find scholarships for me");
    expect(res.content).toContain("Apex Merit Excellence Award");
    expect(res.toolExecution?.toolName).toBe("scholarship_matcher.evaluate_student_profile");
  });
});
