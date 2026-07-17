import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const files = readdirSync('src/api')
  .filter(name => name.endsWith('.ts') && !name.endsWith('.test.ts'))
  .map(name => join('src/api', name));
const errors = [];

for (const file of files) {
  const source = readFileSync(file, 'utf8');
  if (/\.select\s*\(\s*['"`]\s*\*/.test(source) || /\.select\s*\(\s*['"`][^'"`]*\(\*\)/.test(source)) {
    errors.push(`${file.replaceAll('\\', '/')}: usa colonne esplicite invece di select('*')`);
  }
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log(`Checked ${files.length} typed API files`);
