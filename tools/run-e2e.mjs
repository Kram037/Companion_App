import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { build, preview } from 'vite';

await build({ logLevel: 'error' });
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
