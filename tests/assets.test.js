const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createHash } = require('node:crypto');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

test('deployed CSS and app URLs match their content to avoid stale cached assets', () => {
  for (const file of ['app.js', 'style.css']) {
    const source = fs.readFileSync(path.join(root, file), 'utf8').replace(/\r\n/g, '\n');
    const version = createHash('sha256').update(source).digest('hex').slice(0, 12);
    assert.ok(html.includes(`"${file}?v=${version}"`), `Run npm run version-assets after changing ${file}`);
  }
});

test('Chart.js loads locally before the app without a CDN dependency', () => {
  const scripts = [...html.matchAll(/<script src="([^"]+)" defer><\/script>/g)].map((match) => match[1]);
  assert.ok(scripts.every((url) => !/^https?:/.test(url)));
  assert.equal(scripts[0], 'vendor/chart.umd-4.4.3.js');
  assert.ok(scripts[1].startsWith('app.js?v='));
  const context = {};
  vm.runInNewContext(fs.readFileSync(path.join(root, scripts[0]), 'utf8'), context);
  assert.equal(context.Chart.version, '4.4.3');
});
