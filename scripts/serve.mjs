// SPDX-License-Identifier: GPL-3.0-only — Copyright (C) 2026 Luca Amore
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../_site/', import.meta.url));
try { await stat(root); } catch { console.error('Run npm run build first.'); process.exit(1); }
const port = Number(process.env.PORT || 8000);
const mime = { '.html': 'text/html; charset=utf-8', '.svg': 'image/svg+xml', '.md': 'text/plain; charset=utf-8', '.txt': 'text/plain; charset=utf-8' };
createServer(async (req, res) => {
  try {
    let path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    // Also emulate the GitHub project-site base path during local testing.
    if (path === '/computational-kitchen') path += '/';
    if (path.startsWith('/computational-kitchen/')) path = path.slice('/computational-kitchen'.length);
    let file = resolve(root, `.${path}`);
    if (file !== resolve(root) && !file.startsWith(resolve(root) + sep)) { res.writeHead(403); res.end(); return; }
    if ((await stat(file)).isDirectory()) {
      if (!path.endsWith('/')) { res.writeHead(302, { Location: `${req.url.split('?')[0]}/` }); res.end(); return; }
      file = resolve(file, 'index.html');
    }
    const body = await readFile(file);
    res.writeHead(200, { 'Content-Type': mime[extname(file)] || 'text/plain; charset=utf-8', 'X-Content-Type-Options': 'nosniff' });
    res.end(req.method === 'HEAD' ? undefined : body);
  } catch { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); res.end('404 — This ingredient is not in the pantry.'); }
}).listen(port, '127.0.0.1', () => console.log(`Kitchen open: http://127.0.0.1:${port}/computational-kitchen/`));
