const fs = require("fs");
let c = fs.readFileSync("Frontend/src/lib/api/teacher.ts", "utf8");

const target = `  submitAttendance: async (
    classId: string,
    records: { studentId: string; status: "PRESENT" | "ABSENT" | "LATE" }[],
    date?: string
  ) => {
    return apiClient<{ success: boolean; message: string }>(
      "/attendance",
      {
        method: "POST",
        body: JSON.stringify({
          subjectOfferingId: classId,
          date: date ? new Date(date).toISOString() : new Date().toISOString(),
          records: records.map((r) => ({
            studentId: r.studentId,
            status: r.status,
          })),
        }),
      }
    );
  },`;

const replacement = `  submitAttendance: async (
    classId: string,
    records: { studentId: string; status: "PRESENT" | "ABSENT" | "LATE" }[],
    date?: string,
    periodKey?: string
  ) => {
    return apiClient<{ success: boolean; message: string }>(
      "/attendance",
      {
        method: "POST",
        body: JSON.stringify({
          subjectOfferingId: classId,
          date: date ? new Date(date).toISOString() : new Date().toISOString(),
          periodKey: periodKey || "LEC_1",
          records: records.map((r) => ({
            studentId: r.studentId,
            status: r.status,
          })),
        }),
      }
    );
  },`;

if (c.replace(/\r\n/g, "\n").includes(target.replace(/\r\n/g, "\n"))) {
  c = c.replace(/\r\n/g, "\n").replace(target.replace(/\r\n/g, "\n"), replacement);
  fs.writeFileSync("Frontend/src/lib/api/teacher.ts", c);
  console.log("Successfully updated submitAttendance in Frontend/src/lib/api/teacher.ts");
} else {
  console.error("Target block not matched!");
  process.exit(1);
}

