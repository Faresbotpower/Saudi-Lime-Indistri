# STRATA

**Dynamic Strategy Cockpit for Saudi Lime Industries Company (SLIC), 2027-2031.**
Built by Sia as a proof of concept attached to RFQ SLIC/RFQ/2026/SBP-01.

The name: limestone forms in strata. So does a strategy. Each layer of the plan sits on the assumptions below it, and when the ground moves, the layers above re-settle. STRATA shows the Board which layers move when.

This file is the full brief. Read it completely before writing any code. When in doubt, do less and do it well.

---

## 1. What we are building

A single-page web application, deployable as static files on Vercel, that turns a five-year strategic business plan into a live system.

The user (a Board member or executive at SLIC) moves six levers. An engine recomputes which strategic initiatives are viable, ranks and selects them within a capital envelope, and consolidates the result into the deliverables the RFQ asks for: strategic direction, growth portfolio, five-year financials, operations and organization impact, implementation roadmap, and a plan-vs-actual tracker.

Every output must be traceable in two clicks to the lever and rule that produced it. This is a decision tool, not a dashboard.

**This is a demo.** All data is illustrative. A permanent banner must say so. Never present the numbers as SLIC actuals.

**Not in scope.** No backend, no auth, no database, no AI or LLM calls, no proprietary dependencies that would require SLIC to buy a license. The RFQ (Section 4.3) requires tools to run without any consultant license. The app must work as static files opened from any hosting.

---

## 2. Design system

### Brand source

Sia's public brand is at **https://www.sia-partners.com**. Open it, screenshot the homepage and two inner pages, and extract the exact colors, type scale, spacing rhythm and motion feel from what you see. What follows is the reference we already use in Sia proposal decks; the website overrides it if they differ.

Logo files are in `assets/`:

- `sia_logo.png` for light backgrounds (dark wordmark, teal slash)
- `sia_logo_white.png` for dark backgrounds

The signature mark is the teal diagonal slash `/`. Use it as a motif: list markers, active-state indicators, section dividers, loading state. Do not overuse it.

### Palette (reference)

| Token          | Hex       | Use                                                     |
| -------------- | --------- | ------------------------------------------------------- |
| `--ink`        | `#0B2735` | Primary dark background (cover, side panel)             |
| `--ink-2`      | `#162D3D` | Cards on dark, elevated surfaces                        |
| `--ink-3`      | `#1F3A4D` | Hover state on dark                                     |
| `--navy`       | `#1A2636` | Body text on light                                      |
| `--teal`       | `#00C9B1` | The accent. Slash, active states, positive deltas, CTAs |
| `--teal-dim`   | `#0E8F82` | Teal on light backgrounds where contrast is needed      |
| `--sand`       | `#F7F3EF` | Light background (content area)                         |
| `--sand-2`     | `#EFE9E2` | Light cards, table stripes                              |
| `--line`       | `#D5D0CA` | Borders on light                                        |
| `--line-dark`  | `#2A4456` | Borders on dark                                         |
| `--muted`      | `#6B7B8D` | Secondary text                                          |
| `--muted-dark` | `#A8B0B8` | Secondary text on dark                                  |
| `--amber`      | `#F2B24C` | Warnings, deferred initiatives                          |
| `--coral`      | `#E4634F` | Negative deltas, out-of-plan, risk                      |

Rule: teal is the only saturated color that appears at rest. Amber and coral appear only to carry meaning (deferred, negative, risk). Never use teal decoratively on something that is not interactive or not a positive signal.

### Typography

Sia's decks use **Sora** for headings. Load it from Google Fonts. Body in **Inter**. Numbers in Inter with `font-variant-numeric: tabular-nums` everywhere a number can change, so digits do not jitter during animation.

Scale: 12 / 14 / 16 / 20 / 28 / 40 / 64. Headings tight (`letter-spacing: -0.02em`), labels loose and uppercase (`letter-spacing: 0.08em`, 11px).

### Layout

- Desktop first, 1440 reference, works down to 1024. Mobile is a stretch goal, not required.
- Left rail (dark, 320px): the six levers and scenario presets. Always visible.
- Main area (sand): six views, switched by a top tab bar. Only one view visible at a time.
- Top bar: STRATA wordmark, "Illustrative data" banner, scenario name, reset button, Sia logo on the right.
- 8px grid. 24px gutters. Cards with 12px radius. No drop shadows on dark; a single soft shadow on light cards (`0 8px 24px rgba(11,39,53,0.08)`).

### Motion (this matters, spend time here)

The client asked for "super animations". The bar is: every lever change should feel like the plan physically re-settling, and every view transition should feel like turning to the next page of the same document. Motion has to explain, not decorate.

Libraries: **Framer Motion** for layout and presence, **Recharts** with animation enabled for charts (or D3 with custom transitions if Recharts is too rigid), a **count-up** utility for numbers. Optionally **GSAP** for the intro sequence only.

Required motion behaviours:

1. **Lever change ripple.** When a lever moves, outputs update in a visible cascade: assumptions strip first (0 ms), initiative cards re-sort (100 ms, layout animation with `layoutId`), financial lines redraw (250 ms, path morph), roadmap bars slide (350 ms). Total under 800 ms. The user should see cause and effect in order.
2. **Number transitions.** Every KPI counts from old to new value (300 to 500 ms, ease-out). Deltas vs base case appear as a small chip that fades in beside the number, teal for up, coral for down.
3. **Initiative cards.** Cards move between the In / Deferred / Out columns with a shared-layout animation. A card that flips status gets a 600 ms pulse in its new color. Trigger point is shown as a small inline bar with a marker for the current lever value.
4. **Charts.** Lines morph, they do not redraw. Area fills fade. Scenario comparison overlays fade in. Axis ranges animate when they change.
5. **View transitions.** Tabs cross-fade with a 12px vertical slide (200 ms). Persistent elements (lever rail, top bar) do not move.
6. **Intro.** On first load, a 2.5 s sequence: dark screen, teal slash draws in, STRATA wordmark fades up, then the shell assembles (rail slides in from left, main area fades up, cards stagger in at 40 ms intervals). Skippable on click. Do not play again in the session.
7. **Strata reveal.** On the Strategic Direction view, the three layers (Assumptions, Initiatives, Plan) are drawn as stacked horizontal bands. Hovering a lever highlights, top to bottom, the assumptions it touches, the initiatives those assumptions affect, and the plan lines that change. This is the visual argument of the whole product. Get this one right.
8. **Reduced motion.** Respect `prefers-reduced-motion`. Replace all motion with 120 ms fades.

Performance: 60 fps on a 2020 laptop. Recompute the engine synchronously (it is small), throttle lever input to 16 ms, memoize views.

### Sound

None.

### Language

English UI. Structure copy so an Arabic pass is possible later (all strings in one `strings.ts` file). RTL not required for the POC.

---

## 3. Information architecture

```
Top bar: STRATA / scenario name / Illustrative data / Reset / Sia logo
Left rail: 6 levers + 4 scenario presets + "Explain this result" toggle
Views (tabs):
  1. Strategic direction   (where to play, classification, strata reveal)
  2. Growth portfolio      (initiative cards, triggers)
  3. Financial plan        (P&L, capex, FCF, scenario compare)
  4. Operations and people (sites, utilization, capex phasing, headcount, Saudization)
  5. Roadmap               (5-year Gantt in the five RFQ layers)
  6. Tracker               (plan vs actual, triggers fired)
```

### The six levers (left rail)

| #   | Lever                   | Control                                                                              | Range                                   | Default        |
| --- | ----------------------- | ------------------------------------------------------------------------------------ | --------------------------------------- | -------------- |
| L1  | Domestic demand outlook | Segmented: Delayed / On plan / Accelerated, plus fine slider on giga-project phasing | 0.7x to 1.3x of base demand growth      | On plan (1.0x) |
| L2  | Energy cost             | Slider                                                                               | Gas and fuel index 80 to 160 (base 100) | 100            |
| L3  | Capital envelope        | Slider                                                                               | SAR 200m to 1,500m over 5 years         | SAR 600m       |
| L4  | Risk appetite           | Segmented: Organic only / Selective inorganic / Aggressive                           | 1, 2, 3                                 | Selective (2)  |
| L5  | Export ambition         | Segmented: Domestic / GCC / GCC + East Africa and South Asia                         | 0, 1, 2                                 | GCC (1)        |
| L6  | Carbon cost             | Segmented: None / Voluntary / Regulated                                              | SAR 0 / 40 / 120 per tCO2               | None           |

Each lever shows: name, current value, a one-line "what this moves" description, and a small list of the assumption keys it touches (linking to the Strategic Direction view).

### Scenario presets

Buttons that set all six levers at once: **Base**, **Growth**, **Upside**, **Downside** (the four cases the RFQ requires in 3.1). Custom lever changes switch the scenario name to "Custom". Presets are defined in `data/assumptions.json`.

### "Explain this result"

A toggle. When on, every card and KPI shows a small `/` icon; clicking it opens a side sheet listing the rules and assumptions that produced that value, with the lever values applied. This is the traceability requirement.

---

## 4. The engine

Location: `src/engine/`. Pure TypeScript, no React imports, fully unit tested with Vitest. The UI never computes anything; it calls `runPlan(levers, data)` and renders the result.

### 4.1 Data inputs

- `data/assumptions.json`: base year, sites, products, end-use sectors, base volumes and prices, cost structure, fixed assumptions, lever definitions, scenario presets.
- `data/initiatives.json`: the initiative portfolio with viability rules.
- Both files are the only place numbers live. A consultant edits them without touching code.

### 4.2 Pipeline (in order)

1. **Demand.** For each sector `s` and year `y` (2027 to 2031):
   `demand[s][y] = baseVolume[s] * (1 + growth[s] * L1.multiplier) ^ (y - 2026) * gigaPhasing[s][y]`
   Export demand added when L5 > 0: `exportDemand[y] = exportPotential[L5][y]`, phased in over the ramp years in assumptions.
2. **Capacity.** Sum of site capacities by product family, plus capacity added by selected initiatives (with ramp curves). Utilization = min(demand, capacity) / capacity. Unmet demand is lost, not backlogged.
3. **Price.** Domestic price index moves with utilization: `priceIndex[y] = 1 + elasticity * (utilization[y] - baseUtilization)`, clamped to [0.9, 1.15]. Export prices are fixed in assumptions at a discount to domestic.
4. **Cost per ton.** `energyCost = baseEnergyCost * (L2 / 100)`; carbon cost = `L6 * emissionsPerTon` on lime products only (limestone and aggregates have near-zero process emissions); other costs from assumptions with a productivity factor from selected initiatives.
5. **Initiative viability.** For each initiative, evaluate `rules` (see schema). An initiative is `viable` if all rules pass, `deferred` if it fails only a capital or dependency rule, `out` if it fails a strategic rule (risk appetite, export ambition, demand threshold). Record for each initiative the **trigger point**: the lever value at which its status would change, computed by scanning the failing lever across its range.
6. **Portfolio selection.** Among viable initiatives, sort by `NPV / capex` (10% discount rate, 2027 to 2031 cash flows plus a terminal value of 5x year-5 EBITDA for initiatives still ramping), honour dependencies (an initiative cannot be selected before its dependency), and select greedily until the capital envelope (L3) is exhausted. Selected = `in`. Viable but unfunded = `deferred` with reason "capital".
7. **Consolidation.** Base business P&L plus selected initiative impacts, by year: revenue, EBITDA, capex, working capital (a fixed % of revenue delta), FCF. Headcount from base plus initiative headcount deltas, Saudization ratio from assumptions and the workforce initiative if selected. Utilization by site.
8. **Classification.** For each product family and each market (domestic sectors and export regions), score attractiveness (demand growth, price index, margin) and position (share, capacity fit). Map to the RFQ categories: grow / maintain / improve / restructure / harvest / exit, with thresholds in assumptions. Output the 2x2 coordinates for the view.
9. **Roadmap.** Place selected initiatives on a 2027-2031 timeline by start year (respecting dependencies) and ramp, grouped in the five RFQ layers: immediate priorities and quick wins, foundation, major transformation and growth, scale-up and geographic expansion, downstream and adjacent diversification.
10. **Trace.** Every output number carries an array of `{ rule, assumptionKey, leverId, value }` so the Explain sheet can display it.

### 4.3 Output shape

```ts
type PlanResult = {
  scenarioName: string
  years: number[] // [2027..2031]
  financials: {
    revenue: number[]
    ebitda: number[]
    ebitdaMargin: number[]
    capex: number[]
    fcf: number[]
    cumulativeFcf: number[]
  }
  baseCase: PlanResult['financials'] // always computed with Base preset for delta chips
  sites: { id: string; name: string; capacity: number[]; utilization: number[]; capex: number[] }[]
  people: { headcount: number[]; saudization: number[]; costPerTon: number[] }
  classification: {
    id: string
    label: string
    family: string
    market: string
    attractiveness: number
    position: number
    category: 'grow' | 'maintain' | 'improve' | 'restructure' | 'harvest' | 'exit'
  }[]
  initiatives: {
    id: string
    status: 'in' | 'deferred' | 'out'
    reason?: string
    startYear?: number
    npv: number
    capex: number
    trigger?: { leverId: string; threshold: number; direction: 'above' | 'below' }
  }[]
  roadmap: { layer: string; items: { id: string; start: number; end: number }[] }[]
  capital: { envelope: number; committed: number; headroom: number }
  trace: Record<string, TraceEntry[]>
}
```

### 4.4 Tests

Vitest. Minimum:

- Base preset reproduces the base-case numbers in `assumptions.json` within 0.5%.
- Raising L2 to 160 reduces EBITDA in every year and never increases it.
- Setting L4 to Organic only makes every `inorganic: true` initiative `out`.
- Reducing L3 to 200 defers, never removes, a viable initiative.
- Dependencies are never violated in the selected set.
- Trigger points, when re-applied as lever values, flip the status they claim to flip.

---

## 5. The six views

### View 1: Strategic direction

- Top: the **Strata reveal** (Section 2, motion item 7). Three stacked bands. Assumptions band lists the assumption keys as chips. Initiatives band shows initiative names as chips colored by status. Plan band shows the five financial lines as chips. Hover a lever in the rail, or a chip in any band, to light the dependency path.
- Bottom left: **Where to play 2x2**, attractiveness (y) vs competitive position (x). Bubbles = product-market cells, size = revenue. Bubbles move with animation when levers change. Category label on hover.
- Bottom right: **Classification table**: product-market, category, one-line rationale from trace, delta vs base (e.g. "maintain → grow").

### View 2: Growth portfolio

- Three columns: **In plan**, **Deferred**, **Out**. Cards move between them.
- Each card: name, layer chip, capex, NPV, EBITDA at run rate, owner, dependency chips, trigger point mini-bar ("becomes viable if L5 ≥ GCC", "deferred until envelope ≥ SAR 720m").
- Top strip: capital envelope bar (committed vs headroom), count of initiatives by status, diversification share of 2031 revenue from products and markets not served today (an RFQ 3.1 requirement).
- Click a card: side sheet with the full RFQ initiative card fields (objective, rationale, impact, investment, complexity, timeline, owner, milestones, dependencies, risks, KPIs).

### View 3: Financial plan

- Four KPI tiles: 2031 revenue, 2031 EBITDA margin, cumulative capex, cumulative FCF. Each with delta chip vs base.
- Main chart: revenue and EBITDA 2026 (actual, base year) to 2031, with the base case as a dashed ghost line.
- Second chart: capex and FCF bars by year, stacked base business vs initiatives.
- Scenario compare strip: the four presets side by side (revenue 2031, EBITDA 2031, cumulative FCF), current custom scenario highlighted.
- Footnote: "Illustrative. The engagement delivers a formula-driven Excel model (RFQ 3.1); this view mirrors its output."

### View 4: Operations and people

- Three site cards (Riyadh, Al Kharj, Jeddah): capacity, utilization gauge animating by year (a year scrubber at the top of the view applies to the whole view), capex phasing sparkline, initiatives touching the site.
- People panel: headcount by year, Saudization ratio vs Nitaqat target line, cost per ton trend, workforce initiative status.
- Supply chain panel: energy cost per ton under current L2, carbon cost per ton under L6, export logistics cost per ton under L5.

### View 5: Roadmap

- Gantt, 2027 to 2031 by quarter, rows grouped in the five RFQ layers. Selected initiatives only. Deferred initiatives appear as ghost bars at their earliest possible start with a "needs SAR Xm more" label.
- Dependency lines drawn between bars. Critical path highlighted in teal.
- Milestone diamonds at initiative ramp completion.

### View 6: Tracker

- A table of the six levers with three columns: Plan assumption (from current scenario), Actual (editable input, defaults empty), Status.
- When an actual is entered, the engine reruns with actuals replacing plan values for elapsed years, and a "Triggers fired" panel lists initiatives whose status would change and what decision is now due.
- A plan vs actual line for revenue and EBITDA. 2027 is the only year with editable actuals in the POC.
- This view is the argument that the plan survives handover. Keep the copy plain.

---

## 6. Tech and repo

- Vite + React 18 + TypeScript. Tailwind for layout, CSS variables for the palette (Section 2). Framer Motion. Recharts (or D3). Vitest. ESLint + Prettier.
- No UI kit. Build the components. Fewer, better.
- Structure:

```
/data/assumptions.json
/data/initiatives.json
/assets/sia_logo.png, sia_logo_white.png
/src/engine/{demand,capacity,price,cost,viability,portfolio,consolidate,classify,roadmap,trace,index}.ts
/src/engine/__tests__/
/src/state/levers.ts        (zustand or a reducer; keep it small)
/src/ui/shell/{TopBar,LeverRail,Tabs,Banner,Intro}.tsx
/src/ui/views/{Direction,Portfolio,Financials,Operations,Roadmap,Tracker}.tsx
/src/ui/components/{KpiTile,CountUp,DeltaChip,InitiativeCard,StrataReveal,Gantt,Gauge,ExplainSheet,...}.tsx
/src/strings.ts
/vercel.json
```

- `npm run build` outputs `dist/` as static files. No environment variables. No server functions.
- Deploy target: Vercel (Fares's account). Add a `README.md` with one-line deploy instructions and a "how to change the numbers" section for consultants.

---

## 7. Build order

Do these in sequence. Commit after each. Do not start a step before the previous one has passing tests or a visual check.

1. Repo scaffold, palette, fonts, empty shell with the six tabs and the lever rail rendering static values.
2. Engine steps 1 to 4 (demand, capacity, price, cost) with tests against the base case.
3. Engine steps 5 to 7 (viability, portfolio, consolidation) with tests.
4. Engine steps 8 to 10 (classification, roadmap, trace).
5. View 3 (Financial plan) wired live. This is the first demo-able state. Stop and review.
6. View 2 (Growth portfolio) with card animations and trigger points.
7. View 1 (Strategic direction) including the Strata reveal.
8. Views 4 and 5.
9. View 6 (Tracker).
10. Intro sequence, Explain sheet, polish pass on motion, reduced-motion mode.
11. README, deploy.

Expected effort: 3 focused sessions.

---

## 8. Quality bar

- The demo lasts 5 minutes in front of the VP Supply Chain and the CFO. Lead with View 3, then View 2, then View 1. Everything must be legible on a projector at 1080p: minimum 14px body, 16px in tables.
- No placeholder text, no lorem ipsum, no "coming soon".
- No em dashes anywhere in the UI copy. Use commas, colons or full stops.
- The word "AI" does not appear in the product. The initiative "Digital plant and predictive maintenance" is the only place technology is mentioned, and it is described as what it does.
- "Illustrative data" banner cannot be dismissed.
- Every number that can change has a trace. If you cannot write the trace, the number should not exist.
- Sia is written "Sia", never "Sia Partners".

---

## 9. Story for the demo (so the build serves it)

1. Open on Base. "This is a plan. Every consultancy will give you one of these."
2. Move L2 energy cost to 140. Watch EBITDA compress, the kiln retrofit move from deferred to in, the PCC plant move to deferred, the roadmap re-sequence. "This is what happens to that plan in a bad gas year. Yours would have been out of date. This one re-decides."
3. Switch L5 to GCC + East Africa. Jeddah export terminal enters, Jeddah utilization jumps, classification of Western Region flips to grow. Show the trigger point on the card: "This was always going to be the decision. Now you know when."
4. Open the Tracker, type an actual for 2027 demand. Show the triggers fired panel. "This is what you own after we leave."
5. Close on the Strata reveal: hover Capital envelope, watch the layers light up. "Assumptions, initiatives, plan. Move one, the rest re-settles. That is what a dynamic strategy is."
