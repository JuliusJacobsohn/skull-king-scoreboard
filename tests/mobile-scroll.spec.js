const { test, expect } = require('@playwright/test');
const path = require('node:path');
const KEY = 'skullking_mobile_v1';

function fixtures() {
  const players = Array.from({ length: 6 }, (_, i) => ({ id: `p${i}`, name: `Player ${i + 1}`, total: 550 }));
  const done = Array.from({ length: 10 }, (_, i) => ({
    round: i + 1,
    entries: Object.fromEntries(players.map((p) => [p.id, { bid: 0, won: 0, pirates: 0, mermaid: false, pts: (i + 1) * 10 }])),
    totals: Object.fromEntries(players.map((p) => [p.id, (i + 1) * (i + 2) * 5]))
  }));
  const state = { mode: 'game', round: 11, roundPhase: 'bids', sessionId: 'active', startedAt: '2025-01-01', players, done, current: {} };
  const archives = Array.from({ length: 20 }, (_, i) => ({
    id: `game${i}`, sessionId: `game${i}`, startedAt: `2025-01-${String(i + 1).padStart(2, '0')}`,
    players: Array.from({ length: 24 }, (_, j) => `Player ${j + 1}`),
    roundsPlayed: 10, winners: ['Player 1'],
    finalTotals: Array.from({ length: 24 }, (_, j) => ({ name: `Player ${j + 1}`, total: 550 - j * 10 })),
    rounds: done.map((round) => ({ round: round.round, entries: players.map((p) => ({ name: p.name, ...round.entries[p.id], total: round.totals[p.id] })) }))
  }));
  return { state, archives };
}

test.beforeEach(async ({ page }) => {
  await page.route('https://cdn.jsdelivr.net/**', (route) => route.fulfill({
    path: path.join(__dirname, '../node_modules/chart.js/dist/chart.umd.js'), contentType: 'text/javascript'
  }));
  await page.setViewportSize({ width: 360, height: 640 });
  await page.goto('/');
  await page.evaluate(({ state, archives, key }) => {
    localStorage.setItem(key, JSON.stringify(state));
    localStorage.setItem(`${key}_archived_games`, JSON.stringify(archives));
  }, { ...fixtures(), key: KEY });
  await page.reload();
});

async function scrollToBottom(panel) {
  const size = await panel.evaluate((el) => ({ height: el.clientHeight, scroll: el.scrollHeight }));
  expect(size.height).toBeGreaterThan(400);
  expect(size.scroll).toBeGreaterThan(size.height);
  await panel.evaluate((el) => el.scrollTo(0, el.scrollHeight));
  await expect.poll(() => panel.evaluate((el) => el.scrollTop)).toBeGreaterThan(0);
}

async function checkHorizontal(table, panel) {
  const sizes = await table.evaluate((el) => ({ width: el.clientWidth, scroll: el.scrollWidth }));
  expect(sizes.width).toBeLessThanOrEqual(await panel.evaluate((el) => el.clientWidth));
  expect(sizes.scroll).toBeGreaterThan(sizes.width);
  await table.evaluate((el) => el.scrollTo(el.scrollWidth, 0));
  expect(await table.evaluate((el) => el.scrollLeft)).toBeGreaterThan(0);
}

test('round history scrolls to the last round and across all players', async ({ page, browserName }) => {
  await page.locator('#btnHistory').click();
  await expect(page.locator('#btnTabGraph')).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('#histGraphCanvas')).toBeInViewport();
  const graph = await page.evaluate(() => {
    const chart = Chart.getChart('histGraphCanvas');
    return { labels: chart.data.labels, scores: chart.data.datasets.map((dataset) => dataset.data) };
  });
  expect(graph.labels).toEqual(Array.from({ length: 11 }, (_, i) => String(i)));
  expect(graph.scores).toEqual(Array.from({ length: 6 }, () => [0, 10, 30, 60, 100, 150, 210, 280, 360, 450, 550]));
  await page.locator('#btnTabHistory').click();
  const panel = page.locator('#tabPanelHistory');
  if (browserName === 'chromium') {
    // Start the gesture on the horizontally scrollable table itself.
    const touch = await page.context().newCDPSession(page);
    await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 170, y: 500 }] });
    for (let y = 475; y >= 250; y -= 25) {
      await touch.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 170, y }] });
      await page.evaluate(() => new Promise(requestAnimationFrame));
    }
    await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await expect.poll(() => panel.evaluate((el) => el.scrollTop)).toBeGreaterThan(0);
    await touch.detach();
  }
  await scrollToBottom(panel);
  await expect(page.locator('#histBody tr').last()).toBeInViewport();
  await checkHorizontal(panel.locator('.histWrap'), panel);
  await expect(page.locator('#btnCloseHistory')).toBeInViewport();
  await page.locator('#btnTabGraph').click();
  await expect(page.locator('#histGraphCanvas')).toBeInViewport();
  expect(await page.locator('#histGraphCanvas').evaluate((el) => el.clientHeight)).toBeGreaterThan(400);
});

test('a new game shows round zero without adding a saved round', async ({ page }, testInfo) => {
  page.once('dialog', (dialog) => dialog.accept());
  await page.locator('#btnNewGame').click();
  for (const name of ['Alice', 'Bob']) {
    await page.locator('#playerName').fill(name);
    await page.locator('#btnAdd').click();
  }
  await page.locator('#btnStart').click();
  const saved = await page.evaluate((key) => localStorage.getItem(key), KEY);
  await page.screenshot({ path: testInfo.outputPath('compact-undo.png') });
  await page.locator('#btnHistory').click();
  await expect(page.locator('#btnTabGraph')).toHaveAttribute('aria-selected', 'true');
  expect(await page.evaluate(() => {
    const chart = Chart.getChart('histGraphCanvas');
    return { labels: chart.data.labels, scores: chart.data.datasets.map((dataset) => dataset.data) };
  })).toEqual({ labels: ['0'], scores: [[0], [0]] });
  expect(await page.evaluate((key) => localStorage.getItem(key), KEY)).toBe(saved);
  await page.screenshot({ path: testInfo.outputPath('round-zero.png') });
});

test('archive list and expanded game details have reachable content', async ({ page }) => {
  page.once('dialog', (dialog) => dialog.accept());
  await page.locator('#btnNewGame').click();
  await page.locator('#btnSetupHistory').click();
  const panel = page.locator('#tabPanelArchiveGames');
  await scrollToBottom(panel);
  const last = page.locator('.archiveGameCard').last();
  await last.locator('summary').click();
  await scrollToBottom(panel);
  await expect(last.locator('tbody tr').last()).toBeInViewport();
  await checkHorizontal(last.locator('.histWrap'), panel);
  await expect(page.locator('#btnCloseArchive')).toBeInViewport();
});

test('statistics table scrolls away and all four full-size charts are reachable', async ({ page }, testInfo) => {
  page.once('dialog', (dialog) => dialog.accept());
  await page.locator('#btnNewGame').click();
  await page.locator('#btnSetupStats').click();
  const panel = page.locator('#tabPanelArchiveStats');
  await expect(page.locator('#statsBody tr')).toHaveCount(24);
  await checkHorizontal(panel.locator('.histWrap'), panel);
  await scrollToBottom(panel);
  await expect(page.locator('#statsPlayerSelect')).not.toBeInViewport();
  await expect(page.locator('#statsPositionCanvas')).toBeInViewport();
  for (const chart of await page.locator('.statsChartCard').all()) {
    expect(await chart.evaluate((el) => el.clientHeight)).toBeGreaterThanOrEqual(200);
  }
  expect(await page.locator('.statsCharts').evaluate((el) => el.scrollHeight - el.clientHeight)).toBe(0);
  await expect(page.locator('#btnCloseArchive')).toBeInViewport();
  await page.screenshot({ path: testInfo.outputPath('statistics-bottom.png') });
  await panel.evaluate((el) => el.scrollTo(0, 0));
  await page.locator('#statsPlayerSelect').selectOption('player 24');
  await page.locator('#btnTabArchiveGames').click();
  await page.locator('#btnTabArchiveStats').click();
  await scrollToBottom(panel);
  await expect(page.locator('#statsPositionCanvas')).toBeInViewport();
  await page.locator('#btnCloseArchive').click();
  await expect(page.locator('body')).not.toHaveClass(/modalOpen/);
});
