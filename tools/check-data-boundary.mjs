import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';

const manifestPath = 'risorse/runtime-data-manifest.json';
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const entries = Array.isArray(manifest.entries) ? manifest.entries : [];
const outputs = new Set(entries.map(entry => normalize(entry.output)));
const errors = [];

function normalize(path) {
  return String(path || '').replaceAll('\\', '/');
}

function collectDataFiles(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return collectDataFiles(path);
    return entry.name.endsWith('.js') ? [normalize(relative('.', path))] : [];
  });
}

for (const file of [
  ...collectDataFiles('js/Personaggi/data'),
  ...collectDataFiles('js/Compendio/data'),
]) {
  if (!outputs.has(file)) errors.push(`runtime data non dichiarato: ${file}`);
}

for (const [index, entry] of entries.entries()) {
  if (!entry.output) errors.push(`entry ${index}: output mancante`);
  if (!entry.global) errors.push(`${entry.output}: global mancante`);
  if (!['generated', 'manual-runtime'].includes(entry.kind)) errors.push(`${entry.output}: kind non valido`);
  if (!existsSync(entry.output)) errors.push(`${entry.output}: output inesistente`);

  for (const source of entry.sources || []) {
    if (!existsSync(source)) errors.push(`${entry.output}: source inesistente: ${source}`);
  }

  if (entry.kind === 'generated' && !entry.generator) {
    errors.push(`${entry.output}: generator mancante`);
  }
  if (entry.generator && !existsSync(entry.generator)) {
    errors.push(`${entry.output}: generator inesistente: ${entry.generator}`);
  }
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log(`Checked ${entries.length} runtime data outputs`);
