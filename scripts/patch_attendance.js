const fs = require("fs");
let c = fs.readFileSync("Backend/src/attendance/attendance.service.ts", "utf8");
const target = "if (!key) throw new BadRequestException(`${mode} attendance requires timetableSlotId or periodKey`);";
if (!c.includes(target)) {
  console.error("Target not found!");
  process.exit(1);
}
c = c.replace(target, "if (!key) return 'LEC_1';");
fs.writeFileSync("Backend/src/attendance/attendance.service.ts", c);
console.log("Successfully patched resolvePeriodKey in attendance.service.ts");

