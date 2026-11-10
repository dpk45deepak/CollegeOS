const fs = require("fs");
const path = require("path");

// Read all DTO files in Backend/src
function getFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(getFiles(file));
    } else {
      results.push(file);
    }
  });
  return results;
}

const backendFiles = getFiles("Backend/src");
const dtoFiles = backendFiles.filter(f => f.endsWith(".dto.ts"));

console.log("Found DTO files:", dtoFiles.length);

const dtos = {};

dtoFiles.forEach(f => {
  const content = fs.readFileSync(f, "utf8");
  // Find classes
  const classMatches = content.matchAll(/export class (\w+)(?: extends \w+)?\s*\{([^}]+)\}/gs);
  for (const m of classMatches) {
    const className = m[1];
    const body = m[2];
    const fields = [];
    const lines = body.split("\n");
    for (const l of lines) {
      const propMatch = l.match(/(\w+)(\??|\!?):\s*([a-zA-Z0-9_<>\[\]]+)/);
      if (propMatch) {
        const name = propMatch[1];
        const isOptional = propMatch[2] === "?" || l.includes("@IsOptional()");
        const type = propMatch[3];
        fields.push({ name, isOptional, type, line: l.trim() });
      }
    }
    dtos[className] = { file: f, fields };
  }
});

console.log("Extracted DTO classes:", Object.keys(dtos).length);
fs.writeFileSync("scripts/dtos_extracted.json", JSON.stringify(dtos, null, 2));
