# STRATA

Dynamic strategy cockpit for Saudi Lime Industries Company, 2027 to 2031. A Sia proof of concept. All data is illustrative, scaled to a company of SLIC's size (2026 revenue about SAR 300m), not SLIC's actuals; it is replaced with SLIC data in Phase 3.

STRATA is the layer the approved plan lands in. The approach has ten steps in two phases (four of analysis, six of business plan building) and then Phase 3, make it live. The cascade the app carries is the one the plan is built in: facts, shifts, objectives, scorecard, initiatives, projects, plans, model. Nothing from Phase 1 is reworked in Phase 2, and nothing from Phase 2 is rebuilt here.

## Run

```
npm install
npm run dev        # http://localhost:5173
npm test           # Vitest
npm run build      # static files in dist/
```

Node 20.19 or newer, or 22.12 or newer, is recommended by Vite 8. Vercel's default Node 22 runtime is fine.

## Deploy

Import the repository in Vercel, or run `vercel deploy --prod` from this folder. `vercel.json` sets the build command and output directory. No environment variables, no server functions. The app is static files and runs from any hosting: an SLIC internal web server, a SharePoint document library, or any static host, all without licence. That is the answer for the IT discussion.

## How to change the numbers

Every number lives in two files, and nothing else needs to change:

- `data/assumptions.json`: base year, five-year history and the previous plan's 2024 targets, sites, products, sectors, prices, cost structure, the energy block (fuel prices per GJ, kiln energy per ton, each site's 2026 fuel mix and gas transition year, emission factors, the 2025 GHG baseline), the envelope rule, lever definitions, scenario presets.
- `data/initiatives.json`: the initiative portfolio with viability rules, and on every initiative the objectives it serves, the functional plan it feeds, two to four projects whose capex sums to the initiative capex, and what it needs to work.
- `data/objectives.json`: the shift agenda (ten shifts on the chairman pathways, each decided against its levers), fifteen objectives with owners, targets and OKRs, and the balanced scorecard (twenty KPIs with 2026 baselines and 2027 to 2031 targets; `computedFrom` makes a KPI read live from the engine; `lead: true` marks the readings the triggers use).

A test fails if an objective has no initiative, an initiative has no objective, or project capex does not sum to the initiative capex.

UI copy lives in `src/strings.ts`. Brand notes and site screenshots are in `docs/brand/`.

## Cover page and walkthrough

The app opens on a cover page with the ten steps of the approach (Phase 1 and Phase 2 in two tones, STRATA lit): Enter goes to the cockpit, Play the walkthrough runs a ten-chapter guided tour that follows the approach (the cascade, Scorecard, Growth portfolio and projects, Plans and requirements, Financial plan from the baseline, Roadmap, Tracker and the quarterly review, make it live), on auto-pilot and silent (about four minutes at reading pace). A spotlight follows the part of the screen being described, a bar at the bottom carries the chapter title and text, and Next chapter and Stop are always available. The chapters, spotlight targets and timings are in `src/ui/walkthrough/script.ts`; the text is in `src/strings.ts` (also in `docs/walkthrough/explainer.md`). Clicking the STRATA wordmark returns to the cover.

## Seven views

1. **Strategic direction.** Opens on the "From facts to objectives" band: the ten shifts, each expanding to its objectives with owner, target and a status flag (on track, at risk, unfunded when nothing feeding it is in plan). Hover a shift and the strata below light the assumptions, initiatives and plan lines it reaches, the same mechanism as a lever hover. The Board view strip carries initiative counts, envelope headroom, diversification and the decisions due.
2. **Scorecard.** The balanced scorecard in four perspectives: twenty KPIs, 2026 baseline, 2027 to 2031 targets, the live value from the engine where `computedFrom` exists, and a delta chip against the target for the chosen year. Lead indicators (steel consumption, energy index, carbon price) are marked and list the initiative rules that read them. Under the grid, the OKRs under every objective.
3. **Growth portfolio.** Eighteen initiatives in three lanes. Each card names the objectives it serves and its project count; the sheet opens with the cascade breadcrumb (shift, objective, initiative), the projects with dates and capex, and what the initiative needs to work.
4. **Plans and requirements.** The five plans of the approach: Commercial (D6), Operations and supply chain (D7 and D8), Digital and data (D9), Sustainability (D13), HR and organization (D18). Each card lists what moves against Base, its projects with status, capex by year, the headcount change, and "What this plan needs to work" rolled up from the initiatives in plan. The site gauges and the unit costs sit inside the Operations plan, the people panel inside HR.
5. **Financial plan.** Five years of history (2022 to 2026) in grey to the left of the 2026 divider, then the plan. The Baseline chip opens the 2026 actuals card (proposal deliverable D2) with the history and the calibration factors.
6. **Roadmap.** Projects as thin bars under their initiative header bar, in the five layers; ghost bars, dependencies, milestones and the critical path as before.
7. **Tracker.** The six levers against actuals, then every scorecard KPI against its 2027 target, with the lead indicators typed as actuals. Quarterly review mode: pick a quarter and read the KPIs due, the triggers evaluated on the typed actuals, and the decisions due.

Every Explain sheet carries the cascade the number sits in: lever, shift, objective, initiative, project, plan line, KPI. Export PDF prints the whole plan for the current levers and inputs (strategic direction with the shift agenda, scorecard, growth portfolio with projects, plans and requirements, financial plan with history, operations and people, roadmap with projects, plan against actual) with the ten steps and the lever settings on the first page; use Save as PDF in the print dialog.

The plan the update brief calls "AI" is labelled "Digital and data" in the product, because the original brief keeps that word out of the interface; its id in the data stays `ai`.

## Typed inputs

Every lever card has an Inputs section. It holds the exact lever value (multiplier, energy index, envelope in SAR m, carbon price in SAR per tCO2) and the assumptions that lever drives, each as a typed number with its unit: sector volumes and growth, giga phasing, fuel prices (natural gas in SAR per MMBtu and diesel in SAR per litre set the energy index), energy share of cost, maintenance capex, discount rate, terminal multiple, working capital, export potential and economics, emissions per site. A base year card carries the 2026 actuals, list prices, unit costs, site capacity, utilization and people ratios. Typed values sit on top of the data files, feed the engine directly, are marked as edited, and reset per card or from the chip in the top bar.

## Demo in five minutes

1. Open on Base, Strategic direction. Open a shift in "From facts to objectives" and hover it: the objectives, the initiatives and the plan lines it reaches light up. This is the cascade the plan was built in.
2. Scorecard. The performance framework with its baselines and targets, live where the engine computes it, lead indicators marked. It exists before the initiatives.
3. Growth portfolio. Open the PCC plant: shift, objective, initiative, its projects and what it needs to work.
4. Financial plan. Click Baseline 2026, then move Energy cost to 140. EBITDA compresses, the PCC plant drops out, the Operations plan loses its projects, the roadmap re-sequences.
5. Close on the Tracker. Type a 2027 energy actual of 140, read the triggers fired, then switch to Quarterly review and pick Q2 2027: the KPIs due, the triggers evaluated, the decisions due. This is what SLIC owns after handover.

## The gas transition, the envelope and the owners

SLIC's sites run on diesel and crude in 2026 and move to natural gas from 2027 (Jeddah 2028). Lime energy cost per ton is computed from each site's fuel mix and the fuel prices per GJ, per site and per year, and bricks kilns burn the same site fuel. Lever L2 is the gas price index with three named settings: Gas on time (100), Gas late one year (120, the allocation slips a year at every site) and Gas at 140. The Financial plan shows 2026 twice, the actual on diesel and crude and the pro forma on gas, and the plan line starts from the pro forma. Emissions per ton are process plus fuel; the Sustainability plan shows the path from the 2025 baseline to 2031 with the decarbonization roadmap (gas by site, kiln efficiency, electrification of ancillaries, the capture pilot) and the carbon cost exposure under L6.

SLIC has no capital envelope. Lever L3 has a Derived setting that computes one from the plan: after-tax operating cash flow of the base business over 2027 to 2031, less maintenance capex and a dividend floor, plus debt capacity at the net debt ceiling (`envelopeRule` in the assumptions). The Financial plan shows the three lines and the result.

Owners after handover, as SLIC stated them: financial model, Finance Department; tracker and quarterly cycle, Organizational Excellence Department. Acquisitions are in (a domestic bolt-on of the Atra 2024 kind, and a mineral-processing services adjacency evaluated on its own return); shared ownership structures are excluded and the words do not appear in the data or the interface. Logistics is third party and EXW. Bricks stay an existing line with a keep, fix or exit choice decided on the margin after the gas switch.

## Screenshots for the proposal

`docs/screenshots/` holds the three the proposal needs, taken from the deployed build at 1440 by 900: `financial-plan-gas-140.png` (actual against pro forma 2026 under Gas at 140), `growth-portfolio-bricks-open.png` (the Bricks keep, fix or exit card with its trigger), `tracker-quarterly-review.png` (quarterly review mode with 2027 actuals), plus the cover and the cascade. `docs/STRATA-report-base.pdf` is the exported report under Base.

## Deployment protection

Keep the GitHub repository private. A private repository does not protect the Vercel URL: turn on Vercel Authentication or password protection in the project's Deployment Protection settings before sharing the link outside Sia.

## Build status

The build order in `CLAUDE.md` is complete and the update brief (STRATA_Update_Brief_v2) is applied on top: the engine under `src/engine` behind `runPlan(levers, data)` ends with a cascade step that rolls every initiative down to its projects and up to its objectives and its plan, and reads the scorecard live. Seven views: Strategic direction, Scorecard, Growth portfolio, Plans and requirements, Financial plan, Roadmap (quarterly Gantt in the five layers with ghost bars, dependency lines, critical path and milestones), and Tracker (2027 actuals for demand, energy and carbon re-run the engine; the triggers-fired panel lists the decisions now due; the quarterly review reads a quarter). View 1 carries the Strata reveal: three bands (assumptions, initiatives, plan) that light top to bottom with connector lines when a lever or a chip is hovered, the Where-to-play 2x2 with animated bubbles, and the classification table with the change against Base. 231 tests.

Step 10 added the 2.5 s intro (once per session, click to skip), the Explain toggle (slash icons on every KPI, card, site and classification row open a sheet with the trace and lever values), the lever ripple timing (rail 0 ms, cards 100 ms, chart lines 250 ms, roadmap bars 350 ms), a 16 ms throttle on slider input, reduced-motion handling for Framer and Recharts, and a projector legibility pass (14 px body, 16 px tables).

The store's default view is Strategic direction. Testing note: Chrome freezes animations in a hidden tab, so a view switch driven by the exit animation never completes there. Keep the tab visible when checking motion by hand.

Calibration note: the illustrative base is scaled to SLIC's size. The previous plan (2021 to 2024) targeted revenue of 187 and EBITDA of 55 from a 2020 base around 135, and SLIC acquired Atra Mining in 2024, so the 2026 base is revenue 300, EBITDA 60 (20 percent), capex 25, headcount 650. Lime-family volumes are half and limestone volumes two fifths of the first illustrative set, initiative capex is 42 percent and run-rate value 35 percent of it, and the capital envelope default is 250 (range 100 to 600). List prices and unit costs in the data do not reproduce the 2026 actuals on their own: the engine computes a price factor and an all-in cost factor once under the Base preset so the base year matches `baseCase.revenue` and `baseCase.ebitda`, and writes both to the trace. Under Base the plan runs revenue 300 to about 450 and EBITDA 60 to about 155 by 2031 (the gas switch alone restates 2026 EBITDA to about 82), cumulative free cash flow about 330, capital committed 175 of 250; Downside defers two initiatives; Gas at 140 flips the PCC plant out and brings the bricks exit in. If you change volumes, prices, costs or fuel prices, expect those numbers to move; keep the calibration factors near 1 by updating `baseCase` too.

Portfolio rules worth knowing:

- Export volumes are gated by initiatives: level 1 (GCC) needs `gcc_export_sales`, level 2 needs `jeddah_export_terminal` (`export.requiresInitiative`). Their P&L comes from the volume model, not their run rates, so nothing is counted twice. The same applies to initiatives with `capacityAddKt`.
- A viable initiative with negative NPV at the plan discount rate is deferred with reason "returns" and is never funded. Remove the `belowHurdle` filter in `src/engine/portfolio.ts` to fund by envelope alone.
- Terminal value is `terminalMultiple` times 2031 EBITDA for every initiative.
- Export tons carry variable cost plus logistics (third party, EXW); domestic tons carry the calibrated all-in cost. `logisticsCostPerTon.extended` is set to 95 SAR per ton so the East Africa and South Asia leg reads as grow under the Extended ambition.
- The Riyadh kiln replacement (`riyadh_kiln_replace`) is a strategic choice against the retrofit: out unless the energy index is at or above 115, then funded within the envelope like any other initiative (deferred on capital when the envelope is tight). It does not touch the Base case.
- The bricks choice (`bricks_choice`) reads the bricks margin in 2028 from the rule context (`margin.bricks[2028] < 0.08`): on gas at index 100 the line earns above the threshold and the exit stays out; from index 115 the gas allocation is dearer or later and the exit comes in.
- Classification thresholds live in `classificationThresholds`; the family category used by rules (for example the bricks exit) is that of the family's largest cell by 2031 revenue.
