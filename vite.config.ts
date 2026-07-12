import { defineConfig } from 'vite';
import { basename, join, resolve } from 'node:path';
import { cpSync, existsSync } from 'node:fs';

const viteOutDir = 'dist/vite/companion-app';

function copyLegacyAssets() {
  const include = ['css', 'images', 'js', 'risorse', 'manifest.json', 'sw.js'];
  const exclude = [
    resolve('risorse', 'Manuali'),
    resolve('risorse', 'mostri', 'Lista Mostri.pdf'),
  ].map(path => path.toLowerCase());

  return {
    name: 'copy-legacy-assets',
    closeBundle() {
      const outDir = resolve(viteOutDir);
      for (const item of include) {
        const src = resolve(item);
        if (!existsSync(src)) continue;
        cpSync(src, join(outDir, basename(item)), {
          recursive: true,
          filter: path => !exclude.includes(resolve(path).toLowerCase()),
        });
      }
    },
  };
}

export default defineConfig({
  plugins: [copyLegacyAssets()],
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
      '@types': '/src/types',
    },
  },
  build: {
    outDir: viteOutDir,
    emptyOutDir: true,
  },
});
