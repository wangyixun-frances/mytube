// Local dev server, zero dependencies: `npm start` → http://localhost:3000
import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import * as search from './api/search.js';
import * as login from './api/login.js';

// Minimal .env loader
if (existsSync('.env')) {
  for (const line of readFileSync('.env', 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/i);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  }
}

const PORT = process.env.PORT || 3000;
const routes = { '/api/search': search, '/api/login': login };

createServer(async (req, res) => {
  const path = req.url.split('?')[0];
  try {
    if (path === '/' || path === '/index.html') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(readFileSync('index.html'));
    }
    const handler = routes[path]?.[req.method];
    if (handler) {
      const chunks = [];
      for await (const c of req) chunks.push(c);
      const body = chunks.length ? Buffer.concat(chunks) : undefined;
      const response = await handler(new Request(`http://localhost${req.url}`, {
        method: req.method,
        headers: req.headers,
        body: req.method === 'GET' || req.method === 'HEAD' ? undefined : body,
      }));
      res.writeHead(response.status, Object.fromEntries(response.headers));
      return res.end(await response.text());
    }
    res.writeHead(404).end('Not found');
  } catch (e) {
    res.writeHead(500).end(String(e));
  }
}).listen(PORT, () => console.log(`mytube → http://localhost:${PORT}`));
