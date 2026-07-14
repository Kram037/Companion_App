import { defineConfig } from 'vite';
import { basename, join, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { copyFileSync, cpSync, existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';

const viteOutDir = 'dist/apps/companion-app';

function copyLegacyAssets() {
  const include = ['css', 'images', 'js', 'risorse', 'manifest.json', 'sw.js'];
  const exclude = [
    resolve('risorse', 'Manuali'),
    resolve('risorse', 'mostri', 'Lista Mostri.pdf'),
  ].map(path => path.toLowerCase());

  return {
    name: 'copy-legacy-assets',
    writeBundle() {
      const outDir = resolve(viteOutDir);
      for (const item of include) {
        const src = resolve(item);
        if (!existsSync(src)) continue;
        cpSync(src, join(outDir, basename(item)), {
          recursive: true,
          filter: path => !exclude.includes(resolve(path).toLowerCase()),
        });
      }
      injectServiceWorkerManifest(outDir);
      copyFileSync(join(outDir, 'index.html'), join(outDir, '404.html'));
    },
  };
}

function injectServiceWorkerManifest(outDir: string) {
  const indexPath = join(outDir, 'index.html');
  const html = readFileSync(indexPath, 'utf8');
  const urls = new Set(['./', './index.html', './manifest.json']);

  for (const match of html.matchAll(/(?:src|href)=["']([^"']+)["']/g)) {
    const ref = match[1];
    if (/^(?:https?:|data:|#)/.test(ref)) continue;
    urls.add(`./${decodeURIComponent(ref.replace(/^\.?\//, '').split('?')[0])}`);
  }
  const assetsDir = join(outDir, 'assets');
  if (existsSync(assetsDir)) {
    for (const file of readdirSync(assetsDir)) urls.add(`./assets/${file}`);
  }

  const sortedUrls = [...urls].sort();
  const hash = createHash('sha256').update(html);
  for (const url of sortedUrls) {
    const file = resolve(outDir, decodeURIComponent(url.replace(/^\.\//, '')));
    if (existsSync(file) && statSync(file).isFile()) hash.update(readFileSync(file));
  }

  const swPath = join(outDir, 'sw.js');
  const sw = readFileSync(swPath, 'utf8')
    .replace(/const CACHE_NAME = '[^']+';/, `const CACHE_NAME = 'companion-app-${hash.digest('hex').slice(0, 12)}';`)
    .replace('const BUILD_ASSET_URLS = [];', `const BUILD_ASSET_URLS = ${JSON.stringify(sortedUrls, null, 4)};`);
  writeFileSync(swPath, sw);
}

export default defineConfig({
  plugins: [copyLegacyAssets()],
  base: './',
  server: {
    host: '127.0.0.1',
    port: 5173,
  },
  resolve: {
    alias: {
      '@api': '/src/api',
      '@components': '/src/components',
      '@core': '/src/core',
      '@features': '/src/features',
      '@app-types': '/src/types',
    },
  },
  build: {
    outDir: viteOutDir,
    emptyOutDir: true,
  },
});
