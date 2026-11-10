const fs = require("fs");
let c = fs.readFileSync("Backend/src/attendance/attendance.service.ts", "utf8");
c = c.replace(
  "if (!key) return 'LEC_1';",
  "if (!key) throw new BadRequestException(`${mode} attendance requires timetableSlotId or periodKey`);"
);
fs.writeFileSync("Backend/src/attendance/attendance.service.ts", c);
console.log("Restored resolvePeriodKey throwing contract");

