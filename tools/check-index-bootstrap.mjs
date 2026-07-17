import { readFileSync } from 'node:fs';

const html = readFileSync('index.html', 'utf8');
const legacySupabase = readFileSync('js/Core/supabase.js', 'utf8');
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

console.log('Checked index bootstrap');
