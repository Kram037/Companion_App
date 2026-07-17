import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

function collect(root, pattern) {
  const files = [];
  for (const entry of readdirSync(root)) {
    const path = join(root, entry);
    if (statSync(path).isDirectory()) files.push(...collect(path, pattern));
    else if (pattern.test(path)) files.push(path);
  }
  return files;
}

const legacyFiles = collect('js', /\.js$/);
const referenceFiles = [...legacyFiles, ...collect('src', /\.(?:ts|tsx)$/), 'index.html'];
const definitionsText = legacyFiles.map(file => readFileSync(file, 'utf8')).join('\n');
const referencesText = referenceFiles.map(file => readFileSync(file, 'utf8')).join('\n');
const definitions = new Set();
const pattern = /(?:^|\s)(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(|window\.([A-Za-z_$][\w$]*)\s*=/gm;

for (const match of definitionsText.matchAll(pattern)) definitions.add(match[1] || match[2]);

const references = new Map();
for (const match of referencesText.matchAll(/[A-Za-z_$][\w$]*/g)) {
  references.set(match[0], (references.get(match[0]) || 0) + 1);
}
const unused = [...definitions].filter(name => (references.get(name) || 0) < 2);
const reportOnly = process.argv.includes('--report');

if (unused.length) {
  console.warn(`Simboli legacy senza chiamanti${reportOnly ? ' (report)' : ''}:\n${unused.sort().map(name => `- ${name}`).join('\n')}`);
  if (!reportOnly) process.exit(1);
} else {
  console.log(`Checked ${definitions.size} legacy symbols`);
}
