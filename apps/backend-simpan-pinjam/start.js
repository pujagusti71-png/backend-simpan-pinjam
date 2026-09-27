const fs = require('fs');
const path = require('path');

const candidates = [
  path.join(__dirname, 'dist', 'src', 'main.js'),
  path.join(__dirname, 'dist', 'main.js'),
  path.join(__dirname, 'dist', 'src', 'main'),
  path.join(__dirname, 'dist', 'main'),
];

const target = candidates.find((file) => fs.existsSync(file));

if (!target) {
  console.error('CRITICAL: Could not find compiled NestJS main entrypoint in dist! Checked:');
  candidates.forEach((c) => console.error(' -', c));
  process.exit(1);
}

console.log(`[start.js] Starting backend from: ${target}`);
require(target);
