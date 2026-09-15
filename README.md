[Fully vibe-coded, does not represent me as a developer]

## Skull King Scoreboard

[Live site](https://juliusjacobsohn.github.io/skull-king-scoreboard/) - single-page scoreboard for Skull King.

### Overview
Skull King Scoreboard is a lightweight web app for tracking a Skull King game round by round.  
It is designed for quick mobile use, works without a backend, and persists state locally in the browser.

### Features
- Player setup with ordering (turn highlight follows player order).
- Fast, tap-friendly round input for Bid, Won tricks, Pirates bonus, and Mermaid bonus.
- Auto-fill for the final `Won` value: once `n - 1` players have entered `Won`, the last player is set to `round - sum(other won)`.
- Live round points preview and running totals.
- History modal with two tabs:
  - **History**: per-round points and totals table.
  - **Graph** (default): score progression chart (x = round, y = total score) with one line color per player, starting at round 0 with zero scores.
- Local persistence via `localStorage`.
- Undo individual bids, trick results (including automatic fills), bonuses, bid confirmation, completed rounds, player setup, and new-game resets. A compact undo control sits above the round entries, away from the main action; its accessible label and tooltip name the action it will undo. Undo history survives reloads.
- New game reset with confirmation prompt.
- Mobile history and statistics use one vertical scrolling area per tab; wide tables can also be swiped horizontally.

### Usage
1. Add players on the setup screen.  
2. Start the game.  
3. For each round, set Bid, Won, and optional bonuses for each player. The last `Won` value can auto-fill after the other players are set.  
4. Press **Round done** to apply scoring and advance to the next round.  
5. Open **History** to switch between the table and graph views.

### Saved games and undo
- Existing games and archives continue using the same `skullking_mobile_v1` storage keys. Deploying an update to the same GitHub Pages origin preserves them; no reset or manual migration is needed.
- Older saves support reopening completed rounds and returning from results to bids. Individual taps made before this update cannot be reconstructed.
- Undoing a completed round updates that game's archive and player statistics. Completing the corrected round replaces the same archive entry.

### Scoring
- Bid > 0: exact = `20 * bid`; miss = `-10 * |bid - won|`.
- Bid = 0: exact = `10 * round`; miss = `-10 * round`.
- Bonuses:
  - Pirates: `+30` each (maximum 6).
  - Mermaid vs Skull King: `+50`.
  - Bonuses apply only when the bid is hit exactly (`won == bid`).

### Development
- Pure HTML/CSS/JS with no build step.
- Graph view uses [Chart.js](https://www.chartjs.org/) loaded via CDN (`jsdelivr`).
- Open `index.html` directly in a browser while editing.
- Browser regression tests: `npm ci`, `npx playwright install chromium webkit`, then `npm test`. Tests use isolated browser storage and mobile Android/iPhone viewports. Set `PLAYWRIGHT_CHROMIUM_CHANNEL=chrome` to use an installed Chrome instead of the bundled Chromium.
