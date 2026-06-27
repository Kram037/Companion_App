import { readdirSync, statSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';

const roots = ['js', 'sw.js', 'update-version.js', 'tools'];
const files = [];

function collect(path) {
  const stat = statSync(path);
  if (stat.isDirectory()) {
    for (const entry of readdirSync(path)) collect(join(path, entry));
  } else if (/\.(mjs|js)$/.test(path)) {
    files.push(path);
  }
}

for (const root of roots) collect(root);

for (const file of files) {
  const result = spawnSync(process.execPath, ['--check', file], { stdio: 'inherit' });
  if (result.status) process.exit(result.status);
}

console.log(`Checked ${files.length} JavaScript files`);
