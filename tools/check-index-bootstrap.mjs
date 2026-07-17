import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const html = readFileSync('index.html', 'utf8');
const legacySupabase = readFileSync('js/Core/supabase.js', 'utf8');
const runtimeLoaders = [
  readFileSync('js/Core/data-loader.js', 'utf8'),
  readFileSync('js/Core/state.js', 'utf8'),
];
if (/cdn\.jsdelivr\.net\/npm\/@supabase/.test(html)) {
  console.error('Supabase deve essere incluso nel bundle Vite, non caricato da CDN');
  process.exit(1);
}
if (/\bcreateClient\b|supabaseCreateClient/.test(legacySupabase)) {
  console.error('Il client Supabase deve essere creato solo da src/api/supabaseClient.ts');
  process.exit(1);
}
const scripts = [...html.matchAll(/<script[^>]+src=["']([^"']+)["']/g)]
  .map(match => match[1]);
const lazyModules = [
  'js/Combattimento/combat.js',
  'js/Compendio/compendio.js',
  'js/Laboratorio/laboratorio.js',
];
const forbidden = scripts.filter(src => (
  /js\/(?:Personaggi|Compendio)\/data\//.test(src)
  || lazyModules.some(module => src.includes(module))
));

if (forbidden.length) {
  console.error(`Script runtime nel bootstrap iniziale:\n${forbidden.join('\n')}`);
  process.exit(1);
}

const loadedLegacyScripts = new Set([
  ...scripts.map(src => src.replace(/^\//, '').split('?')[0]),
  ...runtimeLoaders.flatMap(source => [...source.matchAll(/['"](js\/[^?'"]+\.js)(?:\?[^'"]*)?['"]/g)].map(match => match[1])),
]);
const legacyScripts = [];
function collectLegacyScripts(path) {
  if (statSync(path).isDirectory()) {
    for (const entry of readdirSync(path)) collectLegacyScripts(join(path, entry));
  } else if (path.endsWith('.js')) {
    legacyScripts.push(path.replaceAll('\\', '/'));
  }
}
collectLegacyScripts('js');

const orphaned = legacyScripts.filter(path => !loadedLegacyScripts.has(path));
if (orphaned.length) {
  console.error(`Script legacy non raggiungibili dal bootstrap:\n${orphaned.join('\n')}`);
  process.exit(1);
}

console.log('Checked index bootstrap');
