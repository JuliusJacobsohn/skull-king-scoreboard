[Fully vibe-coded, does not represent me as a developer]

## Skull King Scoreboard

[Live site](https://juliusjacobsohn.github.io/skull-king-scoreboard/) — single-page, offline-friendly scoreboard for the Skull King card game.

### What it does
- Manage players and order, then track bids, tricks won, pirates, and mermaid bonuses per round.
- Scores are auto-calculated each round and totals are shown live.
- Round history table keeps a log of points and running totals.
- Data is saved to `localStorage` so a refresh or short disconnect does not lose your game.

### How to use
1) Add players on the setup screen (order matters for turn highlighting).  
2) Hit **Start game** to switch to the scoring view.  
3) For each round, enter Bid, Won, Pirates (+30 each), and Mermaid (+50 vs. Skull King).  
4) Press **Round done** to lock the round, advance the round counter, and record history.  
5) Use **New game** to clear everything and go back to player setup.

### Scoring reference
- Bid > 0: exact = `20 * bid`; miss = `-10 * |bid - won|`.
- Bid = 0: exact = `10 * round`; miss = `-10 * round`.
- Bonuses: `+30` per pirate beaten by Skull King; `+50` if Mermaid beats Skull King.

### Keyboard tips (desktop)
- Tab order cycles per column (Bid → Won → Pirates → Mermaid) across players.
- Shift+Tab moves backward; the last Mermaid input tabs to **Round done**.

### Development
- Pure HTML/CSS/JS with no build step or dependencies.
- Edit `index.html` and open it directly in a browser to test changes.
