# STRATA

Dynamic strategy cockpit for Saudi Lime Industries Company, 2027 to 2031. A Sia proof of concept. All data is illustrative.

## Run

```
npm install
npm run dev        # http://localhost:5173
npm test           # Vitest
npm run build      # static files in dist/
```

Node 20.19 or newer, or 22.12 or newer, is recommended by Vite 8. Vercel's default Node 22 runtime is fine.

## Deploy

Import the repository in Vercel. `vercel.json` sets the build command and output directory. No environment variables, no server functions.

## How to change the numbers

Every number lives in two files, and nothing else needs to change:

- `data/assumptions.json`: base year, sites, products, sectors, prices, cost structure, lever definitions, scenario presets.
- `data/initiatives.json`: the initiative portfolio with viability rules.

UI copy lives in `src/strings.ts`. Brand notes and site screenshots are in `docs/brand/`.

## Build status

Steps 1 and 2 of the build order in `CLAUDE.md` are complete: shell, then engine steps 1 to 4 (demand, capacity, price, cost) under `src/engine` with 43 tests.

Calibration note: list prices and unit costs in the data do not reproduce the 2026 actuals on their own. The engine computes a price factor and an all-in cost factor once under the Base preset so the base year matches `baseCase.revenue` and `baseCase.ebitda`, and writes both to the trace. If you change volumes, prices or costs, expect those factors to move; keep them near 1 by updating `baseCase` too.
