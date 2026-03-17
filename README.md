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
  - **Graph**: score progression chart (x = round, y = total score) with one line color per player.
- Local persistence via `localStorage`.
- New game reset with confirmation prompt.

### Usage
1. Add players on the setup screen.  
2. Start the game.  
3. For each round, set Bid, Won, and optional bonuses for each player. The last `Won` value can auto-fill after the other players are set.  
4. Press **Round done** to apply scoring and advance to the next round.  
5. Open **History** to switch between the table and graph views.

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
