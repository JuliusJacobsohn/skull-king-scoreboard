const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const assets = { '/': 'index.html', '/index.html': 'index.html', '/app.js': 'app.js', '/style.css': 'style.css' };
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };
http.createServer((req, res) => {
  const file = assets[new URL(req.url, 'http://localhost').pathname];
  if (!file) { res.writeHead(404).end(); return; }
  res.setHeader('Content-Type', types[path.extname(file)]);
  fs.createReadStream(path.join(__dirname, '..', file)).pipe(res);
}).listen(4173, '127.0.0.1');
