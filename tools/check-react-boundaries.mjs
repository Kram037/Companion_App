import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const roots = ['src/app', 'src/components', 'src/features'];
const files = [];
const routeFiles = [];
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

function collectRouteFiles(path) {
  const stat = statSync(path);
  if (stat.isDirectory()) {
    for (const entry of readdirSync(path)) collectRouteFiles(join(path, entry));
  } else if (/\.(?:js|ts|tsx)$/.test(path)) {
    routeFiles.push(path);
  }
}

collectRouteFiles('js');
collectRouteFiles('src');

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

const realtime = readFileSync('js/Core/realtime.js', 'utf8');
if (/_appRefresh(?:Running|Queued)|refreshCurrentPageData|scheduleAppEventsRefresh/.test(realtime)) {
  errors.push('js/Core/realtime.js: refresh globale legacy non consentito');
}
if (/\b(?:renderCombattimentoContent|renderSessioneContent|renderSchedaPersonaggio|loadCampagnaDetails|loadCampagne)\s*\(/.test(realtime)) {
  errors.push('js/Core/realtime.js: realtime deve invalidare query, non renderizzare pagine');
}

for (const file of routeFiles) {
  const text = readFileSync(file, 'utf8');
  if (/sessionStorage\.(?:getItem|setItem|removeItem)\(['"]current(?:Page|CampagnaId|SessioneId|PersonaggioId)['"]/.test(text)) {
    errors.push(`${relative('.', file)}: la navigazione deve usare URL params, non sessionStorage`);
  }
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log(`Checked ${files.length} React boundary files`);
