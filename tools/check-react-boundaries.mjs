import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const roots = ['src/app', 'src/components', 'src/features'];
const files = [];
const errors = [];

function collect(path) {
  try {
    const stat = statSync(path);
    if (stat.isDirectory()) {
      for (const entry of readdirSync(path)) collect(join(path, entry));
      return;
    }
    if (/\.(ts|tsx)$/.test(path)) files.push(path);
  } catch {
    // Optional roots such as src/components may not exist yet.
  }
}

for (const root of roots) collect(root);

for (const file of files) {
  const text = readFileSync(file, 'utf8');
  const rel = relative('.', file).replaceAll('\\', '/');

  if (/\binnerHTML\b|dangerouslySetInnerHTML/.test(text)) {
    errors.push(`${rel}: React UI non deve usare innerHTML/dangerouslySetInnerHTML`);
  }
  if (/\bgetSupabaseClient\b|\bsupabase\s*\./.test(text)) {
    errors.push(`${rel}: React UI deve usare src/api, non Supabase diretto`);
  }
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log(`Checked ${files.length} React boundary files`);
