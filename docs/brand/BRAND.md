# Sia brand extraction, 10 September 2026

Source: https://www.sia-partners.com (homepage, About us, Insights). Capabilities returned a 404 that day.
Screenshots: sia-homepage.jpg, sia-about-us.jpg, sia-insights.jpg in this folder.
Method: computed styles read from the live DOM, counted by frequency.

## What the website overrides in the deck palette

| Token | Deck reference | Live site | Used in STRATA |
|---|---|---|---|
| ink | #0B2735 | rgb(10,21,30) = #0A151E, 1,547 uses, body text and dark buttons | #0A151E |
| navy (text on light) | #1A2636 | #0A151E for body, #173044 for section headings | #173044 |
| teal | #00C9B1 | rgb(29,233,182) = #1DE9B6, 135 uses, slash and toggles only | #1DE9B6 |
| sand | #F7F3EF warm | white with #F6F6F6 / #F5F5F5 panels, pastel gradient heroes | #F7F7F5 |
| line | #D5D0CA | #D6D6D6 | #D6D6D6 |
| muted | #6B7B8D | #757575 and #A3A3A3 | #6F7A85 on light, #A3A3A3 on dark |

Amber and coral do not exist on the site. They are kept from the deck for meaning only.

## Type
- Sora everywhere on the site (custom "Sora-sia" face), weights 400 dominant, 600 and 700 rare.
- Section headings: Sora 400, 32 to 35px, letter-spacing -0.04em. Headings are light, not bold.
- Body: 15px / 24px, letter-spacing 0.5px.
- Buttons: Sora 14px, pill radius 28px, dark fill with white text, or outlined 1px on light.
- STRATA keeps Inter for body and numbers (tabular figures), Sora for headings, labels and buttons.

## Shape
- Card radius 15px, pill buttons 28px or full, inner chips 7.5px.
- Shadows are rare and very soft: rgba(0,0,0,0.1) 30px 30px 64px. STRATA uses the deck's single soft shadow on light cards.
- Signature motifs: a thin teal diagonal slash drawn before headline text, a large outlined parallelogram (slash shape) as a ghost background element, and soft peach to lavender to sky pastel gradients on hero surfaces.

## Motion feel
- Hover transitions: all 0.15s ease (100 uses) and 0.15s ease-in-out. Nothing bouncy.
- Reveals: opacity 0.3s to 1s ease. Content fades up, it does not fly in.
- Takeaway for STRATA: fast and quiet on interaction, slow and soft on reveal. Motion carries meaning, decoration stays still.
