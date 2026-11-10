const fs = require("fs");
let c = fs.readFileSync("Frontend/src/app/(teacher)/teacher/attendance/page.tsx", "utf8");

// Add toast import if missing
if (!c.includes('import { toast } from "sonner";')) {
  c = c.replace(
    'import { Skeleton } from "@/components/ui/skeleton";',
    'import { Skeleton } from "@/components/ui/skeleton";\nimport { toast } from "sonner";'
  );
}

// Add selectedPeriod state
if (!c.includes('const [selectedPeriod, setSelectedPeriod] = useState("LEC_1");')) {
  c = c.replace(
    'const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split("T")[0]);',
    'const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split("T")[0]);\n  const [selectedPeriod, setSelectedPeriod] = useState("LEC_1");'
  );
}

// Update submitMutation
const oldMutation = `  const submitMutation = useMutation({
    mutationFn: () =>
      teacherApi.submitAttendance(
        selectedClass,
        roster.map((s) => ({ studentId: s.id, status: s.status })),
        selectedDate
      ),
    onSuccess: (data) => {
      setIsConfirmOpen(false);
      setSubmittedMessage(data.message || "Attendance records submitted successfully.");
      setTimeout(() => setSubmittedMessage(null), 4000);
    },
  });`;

const newMutation = `  const submitMutation = useMutation({
    mutationFn: () =>
      teacherApi.submitAttendance(
        selectedClass,
        roster.map((s) => ({ studentId: s.id, status: s.status })),
        selectedDate,
        selectedPeriod
      ),
    onSuccess: (data) => {
      setIsConfirmOpen(false);
      setSubmittedMessage(data.message || "Attendance records submitted successfully.");
      toast.success(data.message || "Attendance registered successfully!");
      setTimeout(() => setSubmittedMessage(null), 4000);
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to submit attendance records");
    },
  });`;

c = c.replace(/\r\n/g, "\n");
if (c.includes(oldMutation.replace(/\r\n/g, "\n"))) {
  c = c.replace(oldMutation.replace(/\r\n/g, "\n"), newMutation);
}

// Add Lecture Period selector in the grid
const oldGrid = `<div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">`;
const newGrid = `<div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">`;
if (c.includes(oldGrid)) {
  c = c.replace(oldGrid, newGrid);
}

const targetSelect = `              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs"
            >
              {(classes || []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.subjectCode}: {c.subjectName} ({c.section})
                </option>
              ))}
            </select>
          </div>`;

const periodDropdown = `              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs"
            >
              {(classes || []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.subjectCode}: {c.subjectName} ({c.section})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground block mb-1">
              Lecture Period / Slot
            </label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs"
            >
              <option value="LEC_1">Period 1 (09:00 - 10:00)</option>
              <option value="LEC_2">Period 2 (10:00 - 11:00)</option>
              <option value="LEC_3">Period 3 (11:15 - 12:15)</option>
              <option value="LEC_4">Period 4 (12:15 - 01:15)</option>
              <option value="LEC_5">Period 5 (02:00 - 03:00)</option>
              <option value="LAB_1">Practical / Lab Session</option>
            </select>
          </div>`;

if (c.includes(targetSelect)) {
  c = c.replace(targetSelect, periodDropdown);
}

fs.writeFileSync("Frontend/src/app/(teacher)/teacher/attendance/page.tsx", c);
console.log("Successfully patched TeacherAttendancePage with period selector and error toast!");
