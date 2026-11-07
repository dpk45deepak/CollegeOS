const fs = require('fs');
const path = require('path');

const endpoints = JSON.parse(fs.readFileSync('scripts/endpoints_report.json', 'utf8'));

// Group by module / controller
const controllers = {};
endpoints.forEach(ep => {
  if (!controllers[ep.file]) {
    controllers[ep.file] = [];
  }
  controllers[ep.file].push(ep);
});

console.log('Controllers and their endpoints:');
for (const [file, eps] of Object.entries(controllers)) {
  console.log(`\n=== ${file} (${eps.length} endpoints) ===`);
  eps.forEach(ep => {
    console.log(`  [${ep.method}] ${ep.rawRoute} -> ${ep.fnName}(${ep.params}) [${ep.permissions}]`);
  });
}

