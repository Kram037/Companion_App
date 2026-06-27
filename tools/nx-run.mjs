import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const nx = resolve(process.platform === 'win32' ? 'node_modules\\.bin\\nx.cmd' : 'node_modules/.bin/nx');
const args = process.argv.slice(2);
const nxArgs = args.length === 1 && args[0].includes(':') ? ['run', args[0]] : args;

const result = spawnSync(nx, nxArgs, {
  stdio: 'inherit',
  shell: process.platform === 'win32',
  env: { ...process.env, NX_DAEMON: 'false' },
});

if (result.error) {
  console.error(result.error.message);
}

process.exit(result.status ?? 1);
