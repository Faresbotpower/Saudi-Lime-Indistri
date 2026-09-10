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

Steps 1 to 5 of the build order in `CLAUDE.md` are complete: shell, the whole engine under `src/engine` behind `runPlan(levers, data)`, View 3 (Financial plan) wired live, and View 2 (Growth portfolio) with In, Deferred and Out columns, shared-layout card moves with a status pulse, trigger-point mini-bars, the capital envelope strip and the full RFQ initiative sheet. 115 tests.

Calibration note: list prices and unit costs in the data do not reproduce the 2026 actuals on their own. The engine computes a price factor and an all-in cost factor once under the Base preset so the base year matches `baseCase.revenue` and `baseCase.ebitda`, and writes both to the trace. If you change volumes, prices or costs, expect those factors to move; keep them near 1 by updating `baseCase` too.

Portfolio rules worth knowing:

- Export volumes are gated by initiatives: level 1 (GCC) needs `gcc_export_sales`, level 2 needs `jeddah_export_terminal` (`export.requiresInitiative`). Their P&L comes from the volume model, not their run rates, so nothing is counted twice. The same applies to initiatives with `capacityAddKt`.
- A viable initiative with negative NPV at the plan discount rate is deferred with reason "returns" and is never funded. Remove the `belowHurdle` filter in `src/engine/portfolio.ts` to fund by envelope alone.
- Terminal value is `terminalMultiple` times 2031 EBITDA for every initiative.
- Export tons carry variable cost plus logistics; domestic tons carry the calibrated all-in cost. With `logisticsCostPerTon.extended` at 140 the East Africa and South Asia leg is break-even and classifies as restructure. Lower it if that market should read as grow.
- Classification thresholds live in `classificationThresholds`; the family category used by rules (for example the bricks exit) is that of the family's largest cell by 2031 revenue.
