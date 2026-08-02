import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const sourceFiles = [];
const errors = [];

function collect(path) {
  const stat = statSync(path);
  if (stat.isDirectory()) {
    for (const entry of readdirSync(path)) collect(join(path, entry));
    return;
  }
  if (/\.(ts|tsx)$/.test(path) && !/\.test\.(ts|tsx)$/.test(path)) sourceFiles.push(path);
}

collect('src');

for (const file of sourceFiles) {
  const source = readFileSync(file, 'utf8');
  const rel = relative('.', file).replaceAll('\\', '/');
  const isApiFile = rel.startsWith('src/api/');

  if (source.includes('@supabase/supabase-js') && rel !== 'src/api/supabaseClient.ts') {
    errors.push(`${rel}: @supabase/supabase-js e' autorizzato solo nel client singleton`);
  }
  if (/\bgetSupabaseClient\b/.test(source) && !isApiFile) {
    errors.push(`${rel}: accesso Supabase consentito solo tramite src/api`);
  }
  if ((/\bwindow\.supabaseClient\b/.test(source) || /\.rpc\s*\(/.test(source)) && !isApiFile) {
    errors.push(`${rel}: query Supabase consentite solo in src/api`);
  }

  if (!isApiFile) continue;
  if (/\.select\s*\(\s*\)/.test(source)
    || /\.select\s*\(\s*['"`]\s*\*/.test(source)
    || /\.select\s*\(\s*['"`][^'"`]*\(\*\)/.test(source)) {
    errors.push(`${rel}: usa colonne esplicite invece di select() o select('*')`);
  }
  if (rel !== 'src/api/databaseContract.ts'
    && /\.(?:from|rpc)\s*\(\s*['"`]/.test(source)) {
    errors.push(`${rel}: nomi di tabelle e RPC devono provenire da databaseContract.ts`);
  }
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log(`Checked ${sourceFiles.length} typed source files and API boundaries`);
