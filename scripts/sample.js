const fs = require("fs");
const eps = JSON.parse(fs.readFileSync("scripts/endpoints_report.json", "utf8"));
const fe = JSON.parse(fs.readFileSync("scripts/frontend_calls.json", "utf8"));
console.log("EP sample:", JSON.stringify(eps.slice(0, 3), null, 2));
console.log("FE sample:", JSON.stringify(fe.slice(0, 3), null, 2));

