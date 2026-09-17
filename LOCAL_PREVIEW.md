# STRATA local redesign

Isolated clone: `/Users/fares/saudi-lime-redesign`
Local branch: `design/local-uplift`
Preview: http://127.0.0.1:5174

Prepared locally, then approved for GitHub push and Vercel production deployment on 17 September 2026.

## Run locally

Use Node 22.12 or newer (required by the existing Vite 8 dependencies).

```sh
npm install
npm run dev -- --host 127.0.0.1 --port 5174
```

This machine's default Node is 20.18. A separate Node 22 runtime was installed only in `/private/tmp/strata-runtime`, so the preview was started with:

```sh
PATH=/private/tmp/strata-runtime/node_modules/node/bin:$PATH npm run dev -- --host 127.0.0.1
```

## Design

Cinematic limestone imagery connects the STRATA name to the actual material of Saudi Lime's business. Petroleum green, pale jade and mineral white replace the old high-contrast neon palette. Manrope handles the interface; DM Serif Display provides the cover's editorial accent. The seven existing analytical views retain their content and use distinct compositions: a compact forecast-led Financial plan, photographic Operations, an open Roadmap timeline, relationship-led Direction, funding-first Portfolio, editorial function briefs and a comparison-led Tracker.

Native entry transitions do not gate view mounting on an outgoing animation. Existing Framer Motion chart, number, portfolio and walkthrough interactions remain available. Reduced motion is respected. The cockpit now adapts to smaller screens: below 1000px the lever rail becomes a keyboard-accessible drawer; below 700px KPI, portfolio, site and support grids stack. Tables and the roadmap retain readable widths inside horizontal scroll regions.

## Walkthrough preservation

The 14-chapter script, timings, actions, narration, engine, assumptions and state are unchanged. The player publishes its existing focus selector to the responsive shell so the mobile drawer opens for rail targets and closes for content targets. Keyboard navigation includes the tour controls, and resizing replays the current focus. The new `WalkthroughLayout.test.tsx` executes every chapter's actions against the actual app and verifies all chapter and action spotlight targets remain mounted. Existing player tests cover timers, Next, Stop, completion and state changes.

## Artwork

Asset: `public/images/limestone-strata.png`
Generated using the built-in image-generation tool. It is an abstract geological artwork, not a photograph of a named SLIC facility.

Prompt: Premium landscape website hero background. Photorealistic Saudi Arabian limestone strata, a monumental pale ivory layered formation rising from the lower right toward the center. Oblique aerial close perspective, terraced curved ridges, chalky tactile edges, dark midnight petroleum blue atmosphere. Right two thirds contain the geological sculpture; left third quiet dark negative space. Cinematic directional light, restrained teal reflections, realistic mineral texture and subtle haze. No people, text, lettering, logos, grids, diagrams or watermarks.

## Second-pass verification

Three parallel agents implemented the rail, view compositions and analytics improvements, followed by parent integration and an independent responsive-walkthrough review. Build and lint pass; all 193 tests in 34 files pass. A production build still reports the existing large application bundle warning. Initial verification was performed before remote publication.

Latest editorial pass: warm limestone canvas, open chart sections and initiative lists, full-width chapter mastheads, edge-to-edge strategy diagram, and next-chapter navigation. Scenario controls now open on demand on desktop as well as mobile. Walkthrough focus events automatically reveal the drawer; Escape closes it and restores focus. Landing Enter uses an 800 ms exit transition (immediate for reduced motion), and walkthrough timing begins after exit.
