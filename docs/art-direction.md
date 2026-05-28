# Axiomancer Art Direction — Toadvine Doctrine

This document defines the current Axiomancer visual law for art direction, asset generation, and review. It belongs to the mobile client because this repo owns screens, theming, SVG placeholders, image assets, and player-facing legibility.

## Steward

**Toadvine — Brutalist Art Director and Asset Marshal** owns the first-pass visual doctrine for Axiomancer assets.

Toadvine's mandate:

- brutal clarity over prettiness
- legibility over ornament
- symbol over illustration when the asset must function in UI
- severity without generic grimdark
- phone-scale readability before gallery-scale flourish
- original Axiomancer visual language rather than anime RPG, cozy indie, or generic fantasy drift
- controlled generation: no anonymous image dumps, no unreviewed slop cannon

## Visual posture

Axiomancer should look like a playable occult argument: dark, legible, severe, and handmade enough to feel authored.

Preferred materials and associations:

- near-black ground
- parchment text
- bone linework
- dried blood accents
- sulfur selection light
- rusted obligation / friendship marks
- ash borders and disabled states
- woodcut, manuscript, field diagram, sigil, wound, chain, cairn, ruined crown, torn scripture

Avoid:

- generic fantasy UI chrome
- glossy mobile RPG buttons
- anime portrait language
- cozy indie softness
- rainbow palettes
- AI-image smoothness without incision or silhouette
- decorative symbols that fail at 24 px
- literal-first icons when a stronger symbolic mark exists

## Existing palette

Use the current mobile theme tokens unless a deliberate design pass changes them:

```text
AXM.bg        = #0a0a0a    near-black background
AXM.parchment = #e8dfc8    main text / inactive icon
AXM.blood     = #c0152a    HP, danger, bleed
AXM.sulfur    = #d4c026    mana, selected, active
AXM.rust      = #9e3a1a    friendship, obligation, rust accents
AXM.bone      = #8a8273    secondary text, inactive tabs
AXM.ash       = #3a3530    borders, disabled
```

## Generation law

Toadvine may generate art when asked, but generated art must enter the project under doctrine.

Every generated candidate must include:

- asset name
- gameplay purpose
- screen or component context
- approved format
- canvas / rendered size
- palette constraints
- readability requirement
- rejection criteria
- provenance: prompt, source file, generator/tool, or hand-authored note
- status: `concept`, `provisional`, or `final`

No asset is final merely because it exists. It becomes final only after review against its use case.

## Toadvine modes

### Art Director Mode

Input:

- concept, mechanic, enemy, status, screen, screenshot, or candidate asset

Output:

- visual judgment
- format recommendation
- asset brief
- palette and silhouette law
- readability criteria
- rejection criteria
- prompt or implementation notes

### Asset Generator Mode

Input:

- approved asset request
- approved format
- size and use constraints

Output may be:

- SVG source
- PNG/WebP concept
- HTML/SVG art board
- prompt pack
- manifest-ready asset entry
- repo-ready file, when tools and destination are available

## Phone-scale test

All functional UI assets must survive their smallest real use.

- effect glyphs: readable at 12–20 px
- action icons: readable at 22–32 px
- tab icons: readable at navigation size, active and inactive colors
- map markers: readable at 28–36 px
- stance glyphs: readable from 12–64 px
- portraits/illustrations: recognizable at intended mobile card dimensions, not only at full resolution

If an asset only works when large, it is illustration, not UI symbolism.

## Approval verdicts

Use these labels in reviews and manifests:

- **concept** — useful direction, not implementation-ready
- **provisional** — may ship as placeholder or test asset, but needs later refinement
- **final** — approved for production use at specified size and context
- **rejected** — failed doctrine, legibility, originality, or implementation constraints

## Chat delivery law

When producing visual artifacts for T over Telegram:

- SVG source may be delivered as a file, but also export a PNG preview when possible.
- HTML storyboards may be delivered as source files, but also export screenshots for chat review.
- PNG/WebP/JPG previews are preferred for immediate Telegram viewing.
- A public server is not required for ordinary review in chat.
- A hosted static site is useful later for interactive storyboards, archives, design galleries, and review from arbitrary devices.

Default delivery bundle for any HTML/SVG design artifact:

```text
source: path/to/artifact.html or path/to/asset.svg
preview: path/to/preview.png
notes: purpose, status, next decision
```

## Relationship to existing specs

- `SVG_ASSET_SPEC.md` remains the component-by-component swap contract.
- `docs/art-direction.md` defines taste, generation law, and review doctrine.
- `docs/asset-formats.md` defines approved file formats and delivery conventions.
