# Axiomancer Asset Formats — Toadvine Production Contract

This document defines the pre-approved formats for Axiomancer visual assets and how Toadvine should deliver them for review and implementation.

## Approved formats

### SVG

Use SVG for functional, scalable, phone-readable marks:

- stance glyphs
- effect glyphs
- action icons
- tab icons
- map node markers
- faction marks
- UI ornaments
- borders, dividers, seals, sigils

Requirements:

- square canvas when used as an icon unless the component contract says otherwise
- `currentColor` for monochrome UI glyphs
- readable at the smallest rendered size
- minimal paths; no unnecessary embedded raster images
- no hidden licensing or external references
- stable viewBox
- filename uses kebab-case

Preferred source path:

```text
assets/images/svg/<asset-name>.svg
```

### PNG / WebP

Use PNG or WebP for raster art:

- enemy portraits
- boss/event illustrations
- atmospheric panels
- splatters and textures
- concept art
- store screenshots or promotional images

Requirements:

- transparent background where compositing matters
- 2x source resolution when feasible
- clear intended rendered size
- no text baked into art unless deliberately part of the image
- provenance recorded in a companion prompt/notes file for generated art

Preferred source paths:

```text
assets/images/enemies/<enemy-name>.png
assets/images/events/<event-name>.webp
assets/images/textures/<texture-name>.png
```

### HTML

Use HTML for reviewable design artifacts:

- style boards
- storyboard panels
- asset sheets
- visual direction comparisons
- UI composition studies
- interactive prototypes

Requirements:

- self-contained when practical
- exact local path recorded
- screenshot exported for Telegram review when possible
- no remote dependencies unless intentional
- status marked as concept/provisional/final

Preferred path:

```text
design/toadvine/<yyyy-mm-dd>/<artifact-name>.html
```

### Markdown

Use Markdown for decisions and production records:

- asset briefs
- prompt packs
- manifest entries
- review verdicts
- rejection notes
- implementation handoffs

Preferred path:

```text
design/toadvine/<yyyy-mm-dd>/<artifact-name>.md
```

## Telegram review delivery

Telegram can show raster images directly in chat. It will not render local HTML inline as an interactive browser surface, and SVG support should not be treated as reliable for inline preview.

Therefore Toadvine's default Telegram bundle is:

```text
1. Source file: .html or .svg when relevant
2. Preview image: .png/.jpg/.webp screenshot or raster export
3. Short verdict: what it is, status, and next decision
```

Examples:

```text
source: design/toadvine/2026-05-28/status-glyph-board.html
preview: design/toadvine/2026-05-28/status-glyph-board.png
status: concept
```

```text
source: assets/images/svg/bleed-glyph.svg
preview: design/toadvine/2026-05-28/bleed-glyph-preview.png
status: provisional
```

## Hosting rule

A server is not required for normal Toadvine review. Hermes can send preview images and source files back through Telegram.

Use hosting later when any of these become true:

- T wants to open interactive storyboards from any device without file transfer
- multiple reviewers need a stable URL
- design artifacts should become public/devlog material
- an archive/gallery is needed
- prototypes need live browser interaction, not static screenshots

Recommended future hosting shape:

```text
SomberSoft static design gallery
  /axiomancer/toadvine/<date>/<artifact>/
    index.html
    screenshots/
    assets/
    manifest.json
```

Until then, local files plus Telegram previews are sufficient.

## Asset request template

Use this when asking Toadvine to generate or judge art:

```text
Asset name:
Game purpose:
Screen/component:
Format: SVG | PNG | WebP | HTML | Markdown
Rendered size:
Palette:
Must read at:
Mood/material:
Reject if:
Status target: concept | provisional | final
```

## Generated-art provenance template

Every generated raster concept or AI-assisted SVG should carry provenance:

```text
Asset:
Date:
Tool/model:
Prompt:
Negative prompt / rejection criteria:
Seed/settings, if known:
Edited by:
Status:
Review verdict:
```

## Implementation notes

- `SVG_ASSET_SPEC.md` remains the swap contract for current placeholder SVGs.
- Use `docs/art-direction.md` for taste and doctrine.
- Use this file for file-format decisions, review bundles, and hosting decisions.
