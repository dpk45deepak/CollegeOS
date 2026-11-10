const fs = require("fs");
const endpoints = JSON.parse(fs.readFileSync("scripts/endpoints_report.json", "utf8"));
const frontend = JSON.parse(fs.readFileSync("scripts/frontend_calls.json", "utf8"));

function normalize(p) {
  if (!p || typeof p !== "string") return "";
  let s = p.replace(/^\/api\/v1/, "");
  if (!s.startsWith("/")) s = "/" + s;
  s = s.replace(/:[a-zA-Z0-9_]+/g, "*");
  s = s.replace(/\$\{[^}]+\}/g, "*");
  s = s.replace(/\/\*(\/\*)*/g, "/*");
  return s.toLowerCase();
}

console.log("Total Backend Endpoints:", endpoints.length);
console.log("Total Frontend Calls:", frontend.length);

const feEndpoints = frontend
  .filter(f => f && f.endpoint)
  .map(f => ({
    raw: f.endpoint,
    norm: normalize(f.endpoint),
    file: f.file,
    line: f.line
  }));

let covered = [];
let notCovered = [];

for (const ep of endpoints) {
  const route = ep.fullRoute || ep.rawRoute;
  if (!route) continue;
  const epNorm = normalize(route);

  // match
  const matches = feEndpoints.filter(fe => {
    if (!fe.norm) return false;
    const escaped = epNorm.replace(/[\-\[\]\/\{\}\(\)\+\?\.\\\^\$\|]/g, "\\$&");
    const pattern = "^" + escaped.replace(/\\\*/g, "[^/]+") + "$";
    try {
      const re = new RegExp(pattern);
      return re.test(fe.norm) || fe.norm === epNorm;
    } catch {
      return fe.norm === epNorm;
    }
  });

  if (matches.length > 0) {
    covered.push({ ep, matches });
  } else {
    notCovered.push(ep);
  }
}

console.log("\n==========================================");
console.log("Matched / Integrated Endpoints in UI:", covered.length);
console.log("Not Directly Called by Frontend:", notCovered.length);
console.log("==========================================\n");

const byController = {};
for (const ep of notCovered) {
  const route = ep.fullRoute || ep.rawRoute;
  byController[ep.controller] = byController[ep.controller] || [];
  byController[ep.controller].push(`${ep.method} ${route}`);
}

console.log("Breakdown of uncalled endpoints by controller:");
for (const [ctrl, eps] of Object.entries(byController)) {
  console.log(`\n### ${ctrl} (${eps.length} uncalled endpoints):`);
  eps.forEach(e => console.log(`  - ${e}`));
}
