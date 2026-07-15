import { execFileSync, spawn } from 'node:child_process';
import { once } from 'node:events';
import { preview } from 'vite';

process.env.VITE_BASE = '/';
execFileSync(process.execPath, ['node_modules/vite/bin/vite.js', 'build'], {
  stdio: 'inherit',
});
const server = await preview({
  preview: { host: '127.0.0.1', port: 8000, strictPort: true },
});

const tests = spawn(process.execPath, [
  'node_modules/@playwright/test/cli.js',
  'test',
  ...process.argv.slice(2),
], { stdio: 'inherit' });
const [code] = await once(tests, 'exit');

server.httpServer.closeAllConnections?.();
await new Promise(resolve => server.httpServer.close(resolve));
process.exitCode = Number(code) || 0;
