import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const files = [];
const errors = [];

function collect(path) {
  const stat = statSync(path);
  if (stat.isDirectory()) {
    for (const entry of readdirSync(path)) collect(join(path, entry));
  } else if (/\.(?:js|ts|tsx)$/.test(path)) {
    files.push(path);
  }
}

collect('js');
collect('src');

for (const file of files) {
  const text = readFileSync(file, 'utf8');
  const rel = relative('.', file).replaceAll('\\', '/');

  if (/sessionStorage\.(?:getItem|setItem|removeItem)\([^)]*current(?:Page|CampagnaId|SessioneId|PersonaggioId)/.test(text)) {
    errors.push(`${rel}: lo stato di route deve provenire dall'URL, non da sessionStorage`);
  }
  if (rel !== 'js/Core/state.js' && /(?:window\.)?AppState\.current(?:Page|CampagnaId|SessioneId|PersonaggioId)\s*=(?!=)/.test(text)) {
    errors.push(`${rel}: usare setAppNavigationState per aggiornare la navigazione`);
  }
  if (rel.startsWith('js/') && /(?:history\.(?:pushState|replaceState)|['"]popstate['"])/.test(text)) {
    errors.push(`${rel}: React Router e' l'unico proprietario della history`);
  }
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log(`Checked ${files.length} navigation boundary files`);
