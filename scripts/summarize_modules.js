const fs = require('fs');

const data = JSON.parse(fs.readFileSync('scripts/endpoints_report.json', 'utf8'));

const summary = {};
data.forEach(item => {
  const mod = item.file.split(/[\\/]/)[0];
  if (!summary[mod]) {
    summary[mod] = [];
  }
  summary[mod].push(item);
});

console.log('Modules breakdown:');
Object.keys(summary).sort().forEach(mod => {
  console.log(`- ${mod}: ${summary[mod].length} endpoints`);
});

