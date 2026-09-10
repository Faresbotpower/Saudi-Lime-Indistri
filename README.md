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

Steps 1 to 5 of the build order in `CLAUDE.md` are complete: shell, the whole engine under `src/engine` behind `runPlan(levers, data)`, Views 3, 2, 1, 4 and 5 are live: Financial plan, Growth portfolio, Strategic direction, Operations and people (year scrubber, site gauges, capex sparklines, people and supply chain panels) and Roadmap (quarterly Gantt in the five layers with ghost bars, dependency lines, critical path and milestones). View 1 carries the Strata reveal: three bands (assumptions, initiatives, plan) that light top to bottom with connector lines when a lever or a chip is hovered, the Where-to-play 2x2 with animated bubbles, and the classification table with the change against Base. 139 tests.

Testing note: Chrome freezes animations in a hidden tab, so a view switch driven by the exit animation never completes there. Keep the tab visible when checking motion by hand.

Calibration note: list prices and unit costs in the data do not reproduce the 2026 actuals on their own. The engine computes a price factor and an all-in cost factor once under the Base preset so the base year matches `baseCase.revenue` and `baseCase.ebitda`, and writes both to the trace. If you change volumes, prices or costs, expect those factors to move; keep them near 1 by updating `baseCase` too.

Portfolio rules worth knowing:

- Export volumes are gated by initiatives: level 1 (GCC) needs `gcc_export_sales`, level 2 needs `jeddah_export_terminal` (`export.requiresInitiative`). Their P&L comes from the volume model, not their run rates, so nothing is counted twice. The same applies to initiatives with `capacityAddKt`.
- A viable initiative with negative NPV at the plan discount rate is deferred with reason "returns" and is never funded. Remove the `belowHurdle` filter in `src/engine/portfolio.ts` to fund by envelope alone.
- Terminal value is `terminalMultiple` times 2031 EBITDA for every initiative.
- Export tons carry variable cost plus logistics; domestic tons carry the calibrated all-in cost. With `logisticsCostPerTon.extended` at 140 the East Africa and South Asia leg is break-even and classifies as restructure. Lower it if that market should read as grow.
- Classification thresholds live in `classificationThresholds`; the family category used by rules (for example the bricks exit) is that of the family's largest cell by 2031 revenue.
