# Visual / UX Audit — June 2026

**Goal:** push the UI toward *engagement* — new-player clarity, readability,
and visual *pop* — without losing the dark-gothic identity. Bold direction:
layout & hierarchy rework, a real theming system, and custom SVG art.

All captures are iPhone-portrait (390×844), driven through the dev menu on the
exported web build (`scripts/audit-capture.mjs`).

---

## What changed (foundation)

### 1. A theming system (`theme/palette.ts`)

Colour accents are now **theme-driven**. A registry of named palettes is derived
from ~17 base hues via `makePalette()`; `theme/axm.ts` resolves the active
palette **once at module-load**, so all 150+ components that read `AXM.*` pick up
the theme with **zero per-component change**. Switching reloads the bundle so the
new palette re-resolves cleanly (robust against React Native's static
`StyleSheet.create` caching).

- **Integrated default — `Ashen Gold`:** the canonical palette retuned toward
  richer, higher-contrast accents (brighter gold, a more saturated blood-red,
  crisper parchment). This is the "pop" you see on *every* screen below.
- **Dev switcher (`DebugThemeSwitcher`):** buttons in the SELF-tab dev menu flip
  the active colour theme live — a preview harness for the future biome worlds.
- **Biome preview themes:** `Coastal Verdant`, `Ember Depths`, `Frost Marrow`,
  `Plague Bloom` (see the gallery at the bottom).

### 2. Custom SVG art

- **`TitleEmblem`** — a heraldic crest (a radiant *eye of knowledge* above a
  *sword of steel*, framed by an astrolabe ring + sulfur halo). Theme-aware.
- **`EncounterIllustration`** — rewritten from a crude placeholder into a moonlit
  clearing: a horned creature with glowing eyes, a layered treeline for depth, a
  glowing moon, and drifting embers.
- **`FiligreeRule`** — reusable diamond-centred divider for framing text blocks.

---

## Screen-by-screen

> Left = **before** (pre-audit). Right = **after**.

### Title
The weakest first impression — all text, dead-empty top. Now anchored by the
crest, with a glowing wordmark, a framed gold subtitle, filigree-framed flavor,
and a glowing call-to-action.

| Before | After |
|---|---|
| <img src="before/00-title.png" width="300"> | <img src="after/00-title.png" width="300"> |

### Exploration (WILDS)
Global palette lift: brighter gold tab + labels, richer vitae red, crisper
parchment headings. The map reads with more contrast.

| Before | After |
|---|---|
| <img src="before/01-exploration.png" width="300"> | <img src="after/01-exploration.png" width="300"> |

### Character / SELF (top + scrolled)
Stronger accent contrast on stat values, derived table, and the paper-doll
figure.

| Before (top) | After (top) |
|---|---|
| <img src="before/02-character-top.png" width="300"> | <img src="after/02-character-top.png" width="300"> |

| Before (mid) | After (mid) |
|---|---|
| <img src="before/03-character-mid.png" width="300"> | <img src="after/03-character-mid.png" width="300"> |

### Satchel
| Before | After |
|---|---|
| <img src="before/04-satchel.png" width="300"> | <img src="after/04-satchel.png" width="300"> |

### Memoir
| Before | After |
|---|---|
| <img src="before/05-memoir.png" width="300"> | <img src="after/05-memoir.png" width="300"> |

### Combat prelude — **new illustration**
The headline art change: the placeholder creature scene is now an atmospheric
moonlit clearing with a horned, glowing-eyed beast.

| Before | After |
|---|---|
| <img src="before/06-combat-prelude.png" width="300"> | <img src="after/06-combat-prelude.png" width="300"> |

### Combat — choose a stance  ⚠️ **layout bug fixed**
The three stance cards were a fixed 160px and overflowed the 390px screen,
clipping both edges — **the MIND stance was unreachable**. Cards now flex to
share the row, so all three stances (and their ADV/DIS badges) are visible and
tappable. Plus the global palette lift on selection gold + vitae red.

| Before (Mind clipped) | After (all three fit) |
|---|---|
| <img src="before/07-combat-fight.png" width="300"> | <img src="after/07-combat-fight.png" width="300"> |

### Combat — DO (action menu)
Stance locked in (collapses to a summary line); the Attack/Defend/Skill/Item
2×2 grid was already responsive — it gets the palette lift.

| Before | After |
|---|---|
| <img src="before/08-combat-do.png" width="300"> | <img src="after/08-combat-do.png" width="300"> |

### Combat — LET (strike resolves)
The roll bars (you vs. foe), ripples, and COMMIT read with stronger gold/red
contrast.

| Before | After |
|---|---|
| <img src="before/09-combat-let.png" width="300"> | <img src="after/09-combat-let.png" width="300"> |

### Combat — round 2 stance
The clearest demonstration of the stance fix: all three stances visible with
their ADV (gold) / DIS (red) badges, so the rock-paper-scissors read is legible.

| Before (clipped) | After |
|---|---|
| <img src="before/10-combat-round2.png" width="300"> | <img src="after/10-combat-round2.png" width="300"> |

### Combat — aftermath (victory)
The win was anticlimactic: flat reward numbers, an empty middle. Now: larger
glowing reward values, a ceremonial laurel watermark filling the void, and a
gold-glow CARRY ON.

| Before | After |
|---|---|
| <img src="before/11-combat-aftermath.png" width="300"> | <img src="after/11-combat-aftermath.png" width="300"> |

### Boss prelude
| Before | After |
|---|---|
| <img src="before/12-boss-prelude.png" width="300"> | <img src="after/12-boss-prelude.png" width="300"> |

### Hazard intro
| Before | After |
|---|---|
| <img src="before/13-hazard.png" width="300"> | <img src="after/13-hazard.png" width="300"> |

---

## Theme showcase (dev switcher)

The same exploration screen under each biome preview theme — flip them live from
the SELF-tab dev menu.

| Coastal Verdant | Ember Depths |
|---|---|
| <img src="themes/exploration-coastal-verdant.png" width="280"> | <img src="themes/exploration-ember-depths.png" width="280"> |

| Frost Marrow | Plague Bloom |
|---|---|
| <img src="themes/exploration-frost-marrow.png" width="280"> | <img src="themes/exploration-plague-bloom.png" width="280"> |

---

## Not yet done (proposed follow-ups)

This pass landed the **foundation** (theming, global palette pop) + the
**showcase** screens (title, encounter art). The global palette already lifts
every screen, but these had no individual layout/art pass yet — prioritised for
the next round:

- **Bespoke enemy / boss art** — the boss is still the older placeholder figure;
  per-creature illustrations are the natural next "go big" step.
- **Per-screen hierarchy passes** for Satchel, Memoir, Character, and the
  event/minigame screens (rest, gather, treasure, quest, gathering, cache,
  dialogue, village, cutscene).
- **Tab-bar icon refresh** — serviceable today; could gain filled/glow active
  states.
