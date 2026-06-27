import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';

const outDir = resolve(process.argv[2] || 'dist/apps/companion-app');
const root = resolve('.');
const include = [
  'css',
  'docs',
  'images',
  'js',
  'risorse',
  'sql',
  'index.html',
  'manifest.json',
  'sw.js',
  'TODO.md',
  'update-version.js',
];
const exclude = [
  resolve('risorse', 'Manuali'),
  resolve('risorse', 'mostri', 'Lista Mostri.pdf'),
].map(p => p.toLowerCase());

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

for (const item of include) {
  const src = join(root, item);
  if (!existsSync(src)) continue;
  cpSync(src, join(outDir, basename(item)), {
    recursive: true,
    filter: path => !exclude.includes(resolve(path).toLowerCase()),
  });
}

console.log(`Built static app in ${outDir}`);
