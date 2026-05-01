# Toss Invest Console — UI kit

A click-thru recreation of the Toss Invest web console (`tossinvest.com`). Three core surfaces:

1. **Home** — market overview, watchlist rail, news strip
2. **Stock detail** — price, chart, order panel
3. **My account** — holdings, performance

## Files
- `index.html` — interactive shell (switches between screens)
- `Shell.jsx` — top bar, left nav, right rail
- `HomeScreen.jsx`
- `StockDetailScreen.jsx`
- `AccountScreen.jsx`
- `ui.jsx` — primitives (Button, Card, Pill, StockRow, MiniChart)

Loaded via `<script type="text/babel">` with React 18.3.1 + Babel standalone.

## Caveats
- Logos are typographic placeholders.
- Icon set is Lucide (substitute).
- Korean copy is illustrative; numbers are dummy.
