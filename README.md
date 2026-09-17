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
- Score progression graph in a fixed-height panel below the game, starting at round 0.
- History modal with two tabs:
  - **History**: per-round points and totals table.
  - **Graph** (default): score progression chart (x = round, y = total score) with one line color per player, starting at round 0 with zero scores.
- Local persistence via `localStorage`.
- Undo bid confirmation or reopen a completed round to correct its results, even after reloading. Change individual bids, results, and bonuses directly.
- Main menu with open games, new-game setup, and finished games showing the winners. Switch games and resume unfinished bids or results.
- End a game after any completed round, or mark it finished from history. Finished games remain in history and player statistics.
- Mobile history and statistics use one vertical scrolling area per tab; wide tables can also be swiped horizontally.

### Usage
1. Add players on the setup screen.
2. Start a new game, or resume an open game from the main menu.
3. For each round, enter and confirm bids, then set Won and optional bonuses. The last `Won` value can auto-fill after the other players are set.
4. Press **Round done** to apply scoring and advance to the next round.
5. Open **History** to switch between the table and graph views.
6. Use **Main menu** to pause or switch games, or **End game** to finish with the scores from completed rounds.

### Scoring
- Bid > 0: exact = `20 * bid`; miss = `-10 * |bid - won|`.
- Bid = 0: exact = `10 * round`; miss = `-10 * round`.
- Bonuses:
  - Pirates: `+30` each (maximum 6).
  - Mermaid vs Skull King: `+50`.
  - Bonuses apply only when the bid is hit exactly (`won == bid`).

### Development
- Pure HTML/CSS/JS with no build step.
- Graph view uses [Chart.js](https://www.chartjs.org/) bundled locally with the site.
- Open `index.html` directly in a browser while editing.
- After changing `app.js` or `style.css`, run `npm run version-assets` to refresh their cache keys.
- Run `npm ci` and `npm test` for the app's state, persistence, and migration tests. These run in Node without launching a browser.
- Use browser control at a mobile viewport to check layout and touch interactions.
- Optional standalone browser suite: `npx playwright install chromium webkit`, then `npm run test:browser`. It uses isolated browser storage and Android/iPhone viewports. Set `PLAYWRIGHT_CHROMIUM_CHANNEL=chrome` to use installed Chrome instead of bundled Chromium.
