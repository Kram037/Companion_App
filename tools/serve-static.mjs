import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, resolve, sep } from 'node:path';

const root = resolve(process.argv[2] || '.');
const port = Number(process.argv[3] || 8000);
const types = {
  '.css': 'text/css',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
};

const server = createServer((req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const relative = decodeURIComponent(url.pathname).replace(/^\/+/, '') || 'index.html';
  const file = resolve(join(root, relative));

  if (file !== root && !file.startsWith(root + sep)) {
    res.writeHead(403).end('Forbidden');
    return;
  }

  const target = existsSync(file) && statSync(file).isDirectory() ? join(file, 'index.html') : file;
  if (!existsSync(target)) {
    if ((req.headers.accept || '').includes('text/html')) {
      res.writeHead(200, { 'Content-Type': types['.html'] });
      createReadStream(join(root, 'index.html')).pipe(res);
      return;
    }
    res.writeHead(404).end('Not found');
    return;
  }

  res.writeHead(200, { 'Content-Type': types[extname(target)] || 'application/octet-stream' });
  createReadStream(target).pipe(res);
}).listen(port, () => {
  console.log(`Companion App: http://127.0.0.1:${port}/`);
});

function shutdown() {
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 500).unref();
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
