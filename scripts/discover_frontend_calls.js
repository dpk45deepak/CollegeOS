const fs = require('fs');
const path = require('path');

function getFrontendCalls(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getFrontendCalls(fullPath));
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      // Look for apiClient calls or strings matching /api/ or routes
      const regex = /apiClient(?:<[^>]+>)?\s*\(\s*[`'"]([^`'"]+)[`'"]/g;
      let m;
      while ((m = regex.exec(content)) !== null) {
        results.push({ file: path.relative('Frontend/src', fullPath), endpoint: m[1] });
      }
    }
  });
  return results;
}

const calls = getFrontendCalls('Frontend/src');
console.log('Total apiClient calls found:', calls.length);

const uniqueEndpoints = [...new Set(calls.map(c => c.endpoint))].sort();
console.log('Unique endpoints called:');
uniqueEndpoints.forEach(e => console.log('  ', e));

fs.writeFileSync('scripts/frontend_calls.json', JSON.stringify(calls, null, 2));

