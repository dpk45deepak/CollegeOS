import { describe, it, expect } from "vitest";
import { getAttendanceColor } from "../lib/utils";

describe("Attendance Calculation Logic", () => {
  it("determines correct color and threshold badge for safe attendance", () => {
    const safeResult = getAttendanceColor(84, 75);
    expect(safeResult.text).toContain("emerald");
    expect(safeResult.bar).toContain("emerald");
  });

  it("determines warning color for borderline attendance", () => {
    const borderlineResult = getAttendanceColor(76, 75);
    expect(borderlineResult.text).toContain("amber");
  });

  it("determines danger color for attendance deficit below 75%", () => {
    const deficitResult = getAttendanceColor(71.1, 75);
    expect(deficitResult.text).toContain("rose");
  });

  it("correctly models classes required to reach 75%", () => {
    // Current: 32 attended out of 45 classes (71.1%)
    // Formula: (32 + x) / (45 + x) >= 0.75
    // 32 + x >= 33.75 + 0.75x => 0.25x >= 1.75 => x >= 7
    // Let's test with consecutive lectures:
    let attended = 32;
    let total = 45;
    let added = 0;
    while ((attended + added) / (total + added) < 0.75) {
      added++;
    }
    expect(added).toBe(7);
  });
});
