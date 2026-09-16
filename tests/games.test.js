const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');

const KEY = 'skullking_mobile_v1';
const ARCHIVE = `${KEY}_archived_games`;
const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const script = fs.readFileSync(path.join(__dirname, '../app.js'), 'utf8');

// Run the actual app against an in-memory DOM. No browsers or network are launched.
function app(storage = {}) {
  const dom = new JSDOM(html, { url: 'http://localhost', runScripts: 'outside-only' });
  const { window } = dom;
  window.structuredClone = structuredClone;
  // jsdom has no top-layer dialog implementation; emulate only its open/close state.
  window.HTMLDialogElement.prototype.showModal = function () { this.open = true; };
  window.HTMLDialogElement.prototype.close = function () {
    this.open = false;
    this.dispatchEvent(new window.Event('close'));
  };
  window.confirm = () => true;
  window.alert = (message) => { throw new Error(message); };
  for (const [key, value] of Object.entries(storage)) window.localStorage.setItem(key, value);
  window.eval(script);
  return {
    window,
    el: (selector) => window.document.querySelector(selector),
    click(selector) {
      const element = this.el(selector);
      assert.ok(element, `Missing element: ${selector}`);
      assert.ok(!element.disabled, `Disabled element: ${selector}`);
      element.click();
    },
    read: (key = KEY) => JSON.parse(window.localStorage.getItem(key)),
    storage: () => Object.fromEntries(Object.keys(window.localStorage).map((key) => [key, window.localStorage.getItem(key)])),
    reload() { const saved = this.storage(); window.close(); return app(saved); },
    start(names) {
      for (const name of names) { this.el('#playerName').value = name; this.click('#btnAdd'); }
      this.click('#btnStart');
      return this.read().sessionId;
    },
    pick(player, field, value) {
      const row = window.document.querySelectorAll('.entryRow')[player];
      const button = [...row.querySelectorAll(`${field} button`)].find((el) => el.textContent === String(value));
      assert.ok(button && !button.disabled);
      button.click();
    },
    resume(id) { this.click(`.openGameButton[data-session-id="${id}"]`); },
    finishRound() {
      this.click('#btnRoundAction');
      this.pick(0, '.rowWon', this.read().round);
      this.click('#btnRoundAction');
    }
  };
}

function current(state) {
  const { openGames, setupDraft, undo, ...game } = state;
  return game;
}

function archiveFixture(sessionId = 'old') {
  return {
    id: sessionId, sessionId, startedAt: '2025-01-01T12:00:00Z',
    finishedAt: '2025-01-01T13:00:00Z', updatedAt: '2025-01-01T13:00:00Z',
    players: ['Ada', 'Ben'], roundsPlayed: 4,
    rounds: [1, 2, 3, 4].map((round) => ({
      round,
      entries: [
        { name: 'Ada', bid: 0, won: round, pirates: 0, mermaid: false, pts: -10 * round, total: -5 * round * (round + 1) },
        { name: 'Ben', bid: 0, won: 0, pirates: 0, mermaid: false, pts: 10 * round, total: 5 * round * (round + 1) }
      ]
    })),
    finalTotals: [{ name: 'Ada', total: -100 }, { name: 'Ben', total: 100 }], winners: ['Ben']
  };
}

test('undo skips all input selections; reopening a round restores its inputs and scores', () => {
  let ui = app();
  ui.start(['Alice', 'Bob']);
  ui.pick(0, '.rowBid', 1);
  ui.pick(0, '.rowBid', 0);
  ui.pick(0, '.rowBid', 1);
  assert.equal(ui.el('#btnUndoGame').disabled, true);
  ui.click('#btnRoundAction');
  ui.pick(0, '.rowWon', 1);
  ui.pick(0, '.bonusPirates', 1);
  ui.click('.bonusMermaid button');
  const results = current(ui.read());
  ui.click('#btnRoundAction');
  assert.deepEqual(ui.read().players.map((p) => p.total), [100, 10]);
  ui.pick(0, '.rowBid', 2);
  ui.pick(1, '.rowBid', 1);
  ui = ui.reload();
  ui.click('#btnUndoGame');
  assert.deepEqual(current(ui.read()), results);
  assert.deepEqual(ui.read(ARCHIVE), []);
  ui.click('#btnUndoGame');
  assert.equal(ui.read().roundPhase, 'bids');
  assert.deepEqual(ui.read().current, results.current);
  assert.equal(ui.el('#btnUndoGame').disabled, true);
  ui.window.close();
});

test('switching games and reloading preserves unfinished results, bids and a setup draft independently', () => {
  let ui = app();
  const a = ui.start(['Alice', 'Bob']);
  ui.pick(0, '.rowBid', 1);
  ui.click('#btnRoundAction');
  ui.pick(0, '.rowWon', 1);
  const aState = current(ui.read());
  ui.click('#btnMainMenu');
  const b = ui.start(['Chris', 'Dana']);
  ui.pick(1, '.rowBid', 1);
  const bState = current(ui.read());
  ui.click('#btnMainMenu');
  ui.el('#playerName').value = 'Next player'; ui.click('#btnAdd');
  ui = ui.reload();
  assert.equal(ui.el('#openGamesList').children.length, 2);
  ui.resume(a);
  assert.deepEqual(current(ui.read()), aState);
  ui.click('#btnMainMenu');
  assert.equal(ui.read().players[0].name, 'Next player');
  ui.resume(b);
  assert.deepEqual(current(ui.read()), bState);
  ui.click('#btnMainMenu');
  ui.resume(a);
  ui.click('#btnUndoGame');
  assert.equal(ui.read().roundPhase, 'bids');
  ui.click('#btnMainMenu'); ui.resume(b);
  assert.deepEqual(current(ui.read()), bState);
  ui.window.close();
});

test('ending is disabled in the first round and can finish after round four with pending inputs', () => {
  let ui = app();
  const id = ui.start(['Alice', 'Bob']);
  assert.equal(ui.el('#btnEndGame').disabled, true);
  ui.click('#btnRoundAction');
  ui.pick(0, '.rowWon', 1);
  assert.equal(ui.el('#btnEndGame').disabled, true);
  ui.click('#btnRoundAction');
  for (let round = 2; round <= 4; round += 1) ui.finishRound();
  ui.click('#btnRoundAction');
  ui.pick(0, '.rowWon', 5);
  const scores = ui.read().players.map((p) => p.total);
  ui.click('#btnEndGame');
  ui.click('#btnCancelFinish');
  assert.equal(ui.read().mode, 'game');
  ui.click('#btnEndGame');
  ui.click('#btnConfirmFinish');
  assert.equal(ui.read().mode, 'setup');
  assert.equal(ui.read().openGames.length, 0);
  const finished = ui.read(ARCHIVE).find((game) => game.sessionId === id);
  assert.equal(finished.status, 'finished');
  assert.equal(finished.roundsPlayed, 4);
  assert.deepEqual(finished.finalTotals.map((p) => p.total), scores);
  ui = ui.reload();
  assert.equal(ui.read().openGames.length, 0);
  assert.deepEqual(ui.read(ARCHIVE), [finished]);
  ui.window.close();
});

test('legacy history is backed up, preserved, resumable and finishable without affecting other games', () => {
  const legacy = archiveFixture();
  const other = archiveFixture('other');
  const oldArchive = JSON.stringify([legacy, other]);
  let ui = app({ [ARCHIVE]: oldArchive });
  const backup = ui.read(`${KEY}_backup_before_sessions`);
  assert.equal(backup.archive, oldArchive);
  assert.deepEqual(ui.read(ARCHIVE).map(({ status, ...game }) => game), [legacy, other]);
  assert.equal(ui.read().openGames.length, 2);
  ui.resume('old');
  assert.equal(ui.read().round, 5);
  assert.deepEqual(ui.read().players.map((p) => p.total), [-100, 100]);
  ui.click('#btnMainMenu');
  ui.click('#btnSetupHistory');
  ui.click('.btnFinishArchived');
  ui.click('#btnConfirmFinish');
  const finished = ui.read(ARCHIVE).find((game) => game.sessionId === 'old');
  assert.equal(finished.status, 'finished');
  assert.deepEqual(finished.rounds, legacy.rounds);
  assert.deepEqual(finished.finalTotals, legacy.finalTotals);
  assert.equal(ui.read().openGames.length, 1);
  ui = ui.reload();
  assert.deepEqual(ui.read(`${KEY}_backup_before_sessions`), backup);
  assert.deepEqual(ui.read(ARCHIVE).find((game) => game.sessionId === 'other'), { ...other, status: 'open' });
  assert.equal(ui.read().openGames[0].sessionId, 'other');
  ui.window.close();
});

test('legacy active game and old tap journals migrate without losing inputs or changing games', () => {
  let ui = app();
  const id = ui.start(['Alice', 'Bob']);
  ui.click('#btnRoundAction'); ui.pick(0, '.rowWon', 1);
  const old = current(ui.read());
  old.undo = [{ label: 'undoNewGame', before: { sessionId: 'wrong-game', round: 9 } }];
  const raw = JSON.stringify(old);
  ui.window.close();
  ui = app({ [KEY]: raw });
  assert.deepEqual(current(ui.read()), current(old));
  assert.equal(ui.read(`${KEY}_backup_before_sessions`).state, raw);
  ui.click('#btnMainMenu'); ui = ui.reload(); ui.resume(id);
  assert.deepEqual(current(ui.read()), current(old));
  ui.click('#btnUndoGame');
  assert.equal(ui.read().sessionId, id);
  assert.equal(ui.read().roundPhase, 'bids');
  ui.window.close();
});

test('finishing another game from history preserves the active game and its scores', () => {
  let ui = app();
  const a = ui.start(['Alice', 'Bob']); ui.finishRound(); ui.click('#btnMainMenu');
  const b = ui.start(['Chris', 'Dana']); ui.finishRound();
  const stateB = current(ui.read());
  ui.click('#btnMainMenu'); ui.click('#btnSetupHistory');
  const buttons = [...ui.window.document.querySelectorAll('.archiveGameCard')];
  buttons.find((card) => card.textContent.includes('Alice')).querySelector('.btnFinishArchived').click();
  ui.click('#btnConfirmFinish');
  assert.equal(ui.read(ARCHIVE).find((game) => game.sessionId === a).status, 'finished');
  ui.click('#btnCloseArchive'); ui.resume(b);
  assert.deepEqual(current(ui.read()), stateB);
  ui.window.close();
});
