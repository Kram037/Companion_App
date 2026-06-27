import { readFileSync } from 'node:fs';

const html = readFileSync('index.html', 'utf8');
const forbidden = [...html.matchAll(/<script[^>]+src=["']([^"']*js\/(?:Personaggi|Compendio)\/data\/[^"']+)["']/g)]
  .map(match => match[1]);

if (forbidden.length) {
  console.error(`Data runtime nel bootstrap iniziale:\n${forbidden.join('\n')}`);
  process.exit(1);
}

console.log('Checked index bootstrap');
