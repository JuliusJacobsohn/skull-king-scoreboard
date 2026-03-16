[Fully vibe-coded, does not represent me as a developer]

## Skull King Scoreboard

[Live site](https://juliusjacobsohn.github.io/skull-king-scoreboard/) - single-page, offline-friendly scoreboard for Skull King.

### Overview
Skull King Scoreboard is a lightweight web app for tracking a Skull King game round by round.  
It is designed for quick mobile use, works without a backend, and persists state locally in the browser.

### Features
- Player setup with ordering (turn highlight follows player order).
- Fast, tap-friendly round input for:
  - Bid
  - Won tricks
  - Pirates bonus
  - Mermaid bonus
- Live round points preview and running totals.
- Round history view with per-round points and totals.
- Local persistence via `localStorage`.
- New game reset with confirmation prompt.

### Usage
1. Add players on the setup screen.  
2. Start the game.  
3. For each round, set Bid, Won, and optional bonuses for each player.  
4. Press **Round done** to apply scoring and advance to the next round.  
5. Open **History** to review previous rounds and totals.

### Scoring
- Bid > 0: exact = `20 * bid`; miss = `-10 * |bid - won|`.
- Bid = 0: exact = `10 * round`; miss = `-10 * round`.
- Bonuses:
  - Pirates: `+30` each (maximum 6).
  - Mermaid vs Skull King: `+50`.
  - Bonuses apply only when the bid is hit exactly (`won == bid`).

### Development
- Pure HTML/CSS/JS with no build step or dependencies.
- Open `index.html` directly in a browser while editing.
