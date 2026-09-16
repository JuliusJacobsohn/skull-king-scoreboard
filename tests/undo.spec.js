const { test, expect } = require('@playwright/test');
const KEY = 'skullking_mobile_v1';
const ARCHIVE = `${KEY}_archived_games`;

async function read(page) {
  return page.evaluate((key) => JSON.parse(localStorage.getItem(key)), KEY);
}
function gameOnly(state) {
  const { undo, ...game } = state;
  return game;
}
async function pick(page, player, field, value) {
  await page.locator('.entryRow').nth(player).locator(field).getByRole('button', { name: String(value), exact: true }).click();
}
async function setup(page) {
  await page.goto('/');
  for (const name of ['Alice', 'Bob', 'Charlie']) {
    await page.locator('#playerName').fill(name);
    await page.locator('#btnAdd').click();
  }
  await page.locator('#btnStart').click();
}
test.beforeEach(async ({ page }) => {
  // Scoring and undo work independently of the optional chart CDN.
  await page.route('https://cdn.jsdelivr.net/**', (route) => route.abort());
});

test('undo skips input selections and returns directly to bids', async ({ page }) => {
  await setup(page);
  await pick(page, 0, '.rowBid', 1);
  await pick(page, 0, '.rowBid', 0);
  await pick(page, 0, '.rowBid', 1);
  await expect(page.locator('#btnUndoGame')).toBeDisabled();
  await page.locator('#btnRoundAction').click();
  await pick(page, 0, '.rowWon', 1);
  await pick(page, 1, '.rowWon', 0);
  await pick(page, 0, '.bonusPirates', 1);
  await page.locator('.bonusMermaid button').first().click();
  const before = await read(page);
  await page.reload();
  await page.locator('#btnUndoGame').click();
  const after = await read(page);
  expect(after.roundPhase).toBe('bids');
  expect(after.current).toEqual(before.current);
  await expect(page.locator('#btnUndoGame')).toBeDisabled();
});

test('round undo restores scores and results in one tap after editing the next bids', async ({ page }) => {
  await setup(page);
  await pick(page, 0, '.rowBid', 1);
  await page.locator('#btnRoundAction').click();
  await pick(page, 0, '.rowWon', 1);
  await pick(page, 1, '.rowWon', 0);
  await pick(page, 0, '.bonusPirates', 1);
  await page.locator('.bonusMermaid button').first().click();
  const results = gameOnly(await read(page));
  await page.locator('#btnRoundAction').click();
  expect((await read(page)).players.map((p) => p.total)).toEqual([100, 10, 10]);
  await pick(page, 1, '.rowBid', 2);
  await pick(page, 2, '.rowBid', 1);
  await page.reload();
  await page.locator('#btnUndoGame').click();
  expect(gameOnly(await read(page))).toEqual(results);
  expect(await page.evaluate((key) => JSON.parse(localStorage.getItem(key)), ARCHIVE)).toEqual([]);
  await page.locator('#btnRoundAction').click();
  expect((await read(page)).players.map((p) => p.total)).toEqual([100, 10, 10]);
});

test('old granular undo journals cannot replay clicks or cross into another game', async ({ page }) => {
  await setup(page);
  await page.locator('#btnRoundAction').click();
  const before = await read(page);
  await page.evaluate((key) => {
    const state = JSON.parse(localStorage.getItem(key));
    state.undo = [
      { label: 'undoNewGame', before: { sessionId: 'other-game', round: 8 } },
      { label: 'undoWon', before: { current: {} } }
    ];
    localStorage.setItem(key, JSON.stringify(state));
  }, KEY);
  await page.reload();
  await page.locator('#btnUndoGame').click();
  const after = await read(page);
  expect(after.sessionId).toBe(before.sessionId);
  expect(after.round).toBe(1);
  expect(after.roundPhase).toBe('bids');
  expect(after.current).toEqual(before.current);
  await expect(page.locator('#btnUndoGame')).toBeDisabled();
});

test('legacy saved games reopen rounds, preserve other archives and update statistics on correction', async ({ page }) => {
  const oldGame = {
    mode: 'game', round: 2, roundPhase: 'bids', sessionId: 'legacy', startedAt: '2025-01-01T12:00:00Z',
    players: [{ id: 'a', name: 'Alice', total: 20 }, { id: 'b', name: 'Bob', total: 10 }],
    current: { a: { bid: '0', won: '0', pirates: '0', mermaid: false, wonTouched: false }, b: { bid: '0', won: '0', pirates: '0', mermaid: false, wonTouched: false } },
    done: [{ round: 1, entries: { a: { bid: 1, won: 1, pirates: 0, mermaid: false, pts: 20 }, b: { bid: 0, won: 0, pirates: 0, mermaid: false, pts: 10 } }, totals: { a: 20, b: 10 } }]
  };
  const other = { id: 'other', sessionId: 'other', players: ['Dana'], finalTotals: [{ name: 'Dana', total: 70 }], roundsPlayed: 1, winners: ['Dana'], rounds: [], startedAt: '2024-01-01', finishedAt: '2024-01-01', updatedAt: '2024-01-01' };
  await page.goto('/');
  await page.evaluate(({ key, archive, oldGame, other }) => {
    localStorage.setItem(key, JSON.stringify(oldGame));
    localStorage.setItem(archive, JSON.stringify([other, { ...other, id: 'legacy', sessionId: 'legacy' }]));
  }, { key: KEY, archive: ARCHIVE, oldGame, other });
  await page.reload();
  expect(await read(page)).toEqual(oldGame);
  await page.locator('#btnUndoGame').click();
  expect((await read(page)).players.map((p) => p.total)).toEqual([0, 0]);
  expect((await read(page)).current.a.bid).toBe('1');
  let archive = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)), ARCHIVE);
  expect(archive).toEqual([other]);
  await page.reload();
  await page.locator('#btnUndoGame').click();
  await pick(page, 0, '.rowBid', 0);
  await pick(page, 1, '.rowBid', 1);
  await page.locator('#btnRoundAction').click();
  await page.locator('#btnRoundAction').click();
  archive = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)), ARCHIVE);
  expect(archive).toHaveLength(2);
  expect(archive.find((g) => g.sessionId === 'legacy').finalTotals.map((p) => p.total)).toEqual([-10, -10]);
  expect(archive.find((g) => g.sessionId === 'other')).toEqual(other);
  await page.locator('#btnUndoGame').click();
  await page.locator('#btnRoundAction').click();
  expect(await page.evaluate((key) => JSON.parse(localStorage.getItem(key)).length, ARCHIVE)).toBe(2);
});
