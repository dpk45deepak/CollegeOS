const fs = require("fs");
let c = fs.readFileSync("Frontend/src/services/api/exams.api.ts", "utf8");

c = c.replace(
  'export type ExamType = "MID_TERM" | "END_TERM" | "INTERNAL" | "PRACTICAL" | "VIVA";',
  'export type ExamType = "INTERNAL" | "MID_SEM" | "END_SEM" | "PRACTICAL" | "VIVA" | "MID_TERM" | "END_TERM";'
);

const oldCreate = `  create: async (dto: CreateExamDto): Promise<ExamItem> => {
    return apiClient<ExamItem>("/exams", {
      method: "POST",
      body: JSON.stringify(dto),
    });
  },`;

const newCreate = `  create: async (dto: CreateExamDto): Promise<ExamItem> => {
    const normalizedType =
      dto.type === "MID_TERM" ? "MID_SEM" : dto.type === "END_TERM" ? "END_SEM" : dto.type;
    return apiClient<ExamItem>("/exams", {
      method: "POST",
      body: JSON.stringify({
        ...dto,
        type: normalizedType,
      }),
    });
  },`;

c = c.replace(/\r\n/g, "\n");
if (c.includes(oldCreate.replace(/\r\n/g, "\n"))) {
  c = c.replace(oldCreate.replace(/\r\n/g, "\n"), newCreate);
}

const oldEnter = `  enterResults: async (
    examId: string,
    results: Array<{ studentId: string; marksObtained: number }>,
    reason?: string
  ): Promise<ExamResultItem[]> => {
    return apiClient<ExamResultItem[]>(\`/exams/\${examId}/results\`, {
      method: "PUT",
      body: JSON.stringify({ results, reason }),
    });
  },`;

const newEnter = `  enterResults: async (
    examId: string,
    results: Array<{ studentId: string; marksObtained: number }>,
    reason?: string
  ): Promise<ExamResultItem[]> => {
    return apiClient<ExamResultItem[]>(\`/exams/\${examId}/results\`, {
      method: "PUT",
      body: JSON.stringify({
        results,
        reason: reason && reason.trim().length >= 10 ? reason.trim() : undefined,
      }),
    });
  },`;

if (c.includes(oldEnter.replace(/\r\n/g, "\n"))) {
  c = c.replace(oldEnter.replace(/\r\n/g, "\n"), newEnter);
}

fs.writeFileSync("Frontend/src/services/api/exams.api.ts", c);
console.log("Successfully patched exams.api.ts");
