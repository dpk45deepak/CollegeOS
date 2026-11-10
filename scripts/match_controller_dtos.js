const fs = require("fs");
const path = require("path");

const dtos = JSON.parse(fs.readFileSync("scripts/dtos_extracted.json", "utf8"));

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

const controllerFiles = getFiles("Backend/src").filter(f => f.endsWith(".controller.ts"));
const endpoints = [];

controllerFiles.forEach(cf => {
  const code = fs.readFileSync(cf, "utf8");
  // Get Controller prefix
  const ctrlMatch = code.match(/@Controller\s*\(\s*['"`]?([^'"`)]*)['"`]?\s*\)/);
  const ctrlPrefix = ctrlMatch ? ctrlMatch[1] : "";

  // Split by method decorator
  const parts = code.split(/@(Post|Patch|Put|Delete)\s*\(\s*['"`]?([^'"`)]*)['"`]?\s*\)/g);
  for (let i = 1; i < parts.length; i += 3) {
    const httpMethod = parts[i].toUpperCase();
    const subRoute = parts[i + 1];
    const methodBlock = parts[i + 2].slice(0, 300); // method signature area

    // Check for @Body
    const bodyMatch = methodBlock.match(/@Body\s*\([^)]*\)\s*(\w+)?:\s*([a-zA-Z0-9_.]+)/);
    let dtoName = bodyMatch ? bodyMatch[2].replace(/^D\./, "") : null;

    let fullPath = "/" + [ctrlPrefix, subRoute].filter(Boolean).join("/").replace(/\/+/g, "/");

    endpoints.push({
      file: cf,
      method: httpMethod,
      route: fullPath,
      dtoName,
      dto: dtoName ? dtos[dtoName] : null
    });
  }
});

console.log("Found POST/PATCH/PUT endpoints:", endpoints.length);
endpoints.forEach(e => {
  if (e.dto) {
    const req = e.dto.fields.filter(f => !f.isOptional).map(f => f.name);
    const opt = e.dto.fields.filter(f => f.isOptional).map(f => f.name);
    console.log(`${e.method} ${e.route} -> DTO: ${e.dtoName} | Req: [${req.join(", ")}] | Opt: [${opt.join(", ")}]`);
  } else if (e.dtoName) {
    console.log(`${e.method} ${e.route} -> DTO: ${e.dtoName} (definition not parsed)`);
  } else {
    console.log(`${e.method} ${e.route} -> NO BODY DTO`);
  }
});
