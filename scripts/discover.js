const fs = require('fs');
const path = require('path');

function getControllers(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getControllers(fullPath));
    } else if (file.endsWith('.controller.ts')) {
      results.push(fullPath);
    }
  });
  return results;
}

const controllers = getControllers('Backend/src');
console.log('Total controllers:', controllers.length);
let totalEndpoints = 0;
const report = [];

controllers.forEach(ctrl => {
  const content = fs.readFileSync(ctrl, 'utf-8');
  // Match @Controller('...') or @Controller()
  const ctrlMatch = content.match(/@Controller\((?:['"]([^'"]*)['"])?\)/);
  const prefix = ctrlMatch ? (ctrlMatch[1] || '') : '';

  // Extract roles / permissions / guards if any
  const lines = content.split('\n');

  // Let's find methods decorated with HTTP verbs
  // A controller method usually has @Get/@Post/... followed by decorators and method signature
  const regex = /@(Get|Post|Put|Patch|Delete)\((?:['"]([^'"]*)['"])?\)([\s\S]*?)(?:async\s+)?([a-zA-Z0-9_]+)\s*\(([\s\S]*?)\)/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    totalEndpoints++;
    const method = match[1].toUpperCase();
    const subPath = match[2] || '';
    const betweenDecoratorsAndMethod = match[3];
    const fnName = match[4];
    const params = match[5];
    const fullRoute = '/' + [prefix, subPath].filter(Boolean).join('/').replace(/\/+/g, '/');
    
    // Extract permissions or roles
    const permMatch = betweenDecoratorsAndMethod.match(/@RequirePermissions\(([^)]+)\)/);
    const rolesMatch = betweenDecoratorsAndMethod.match(/@Roles\(([^)]+)\)/);
    const isPublic = betweenDecoratorsAndMethod.includes('@Public()');

    report.push({
      file: path.relative('Backend/src', ctrl),
      controller: path.basename(ctrl),
      method,
      subPath,
      prefix,
      fullRoute: '/api/v1' + (fullRoute.startsWith('/') ? fullRoute : '/' + fullRoute),
      rawRoute: fullRoute,
      fnName,
      params: params.replace(/\s+/g, ' ').trim(),
      permissions: permMatch ? permMatch[1].trim() : (rolesMatch ? rolesMatch[1].trim() : (isPublic ? 'Public' : 'Authenticated')),
    });
  }
});

console.log('Total discovered endpoints:', totalEndpoints);
fs.writeFileSync('scripts/endpoints_report.json', JSON.stringify(report, null, 2));
console.log('Saved to scripts/endpoints_report.json');

