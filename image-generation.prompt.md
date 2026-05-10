## My questions and strategic note first

**One question worth surfacing:**

For the vector icon assets (stance glyphs, effect glyphs, action icons, tab bar icons) the spec requires SVG with `currentColor` so they tint at runtime. A raster image generator (PNG) breaks that contract. Do you want:

<!-- TODO: Answer this question! -->
- **Track A:** AI writes SVG XML directly (woodcut-style paths) — no image-gen MCP needed, works with `SvgXml`, preserves tinting
- **Track B:** generate PNG rasters via `GenerateImage` / an image MCP — works for illustrations but requires giving up `currentColor` for icons

The spec already splits the assets this way (§1–4 + §10 are vectors; §5–7 are rasters). The best workflow respects that split. If you agree, the prompt below codifies it.

**On MCP:** Your only enabled MCP is `user-scryfall` (Magic card art — not useful here). For raster illustration generation, the prompt needs either Cursor's built-in `GenerateImage` tool or an external image-gen MCP (e.g., fal.ai, Replicate, Stability AI). I'll call that out in the prompt explicitly so you know what to wire up before running it.

**Better strategy — one thing I'd push on:**

The "identify" step is already 90% done — `SVG_ASSET_SPEC.md` is a complete, ordered checklist. Don't have the AI scan the codebase looking for SVGs; have it read the checklist, pick the first unchecked item, and work from the spec's contract. This makes the identification step deterministic and avoids the agent accidentally targeting non-placeholder SVGs (like XpChain, which the spec explicitly marks as optional/keep-as-is).

---

## The prompt

```
You are working in the Axiomancer Mobile repo. Your task is to swap
one placeholder SVG asset for a real generated asset, commit it
atomically, and leave the test suite green.

────────────────────────────────────────
STEP 0 · PICK YOUR TARGET
────────────────────────────────────────
Read SVG_ASSET_SPEC.md. Find the first unchecked item in the
"Asset checklist" at the bottom (lines starting with `- [ ]`).
That is the asset you will work on. Do not touch already-checked items
or anything not on the checklist.

After picking, print a one-line plan:
  Asset: <name> | Type: <vector|raster> | Source file: <file> | Spec section: <§N>

────────────────────────────────────────
STEP 1 · CLASSIFY (vector vs raster)
────────────────────────────────────────
Vector (SVG) assets: Stance Glyphs, Effect Glyphs, Action Icons,
  Map Node Markers, Tab Bar Icons (§1–4, §10).
  Contract: monochrome, `currentColor`, scalable from 12–64 px,
  delivered as a raw SVG string imported into the component.

Raster (PNG) assets: Ink Splatter, Enemy Illustration,
  Event Illustrations, Character Body Diagram (§5–8).
  Contract: fixed pixel dimensions per spec, transparent background
  where needed, 2× resolution for @2x devices.

────────────────────────────────────────
STEP 2 · GUARD — NEVER OVERWRITE HAND-AUTHORED ASSETS
────────────────────────────────────────
Before generating anything, check whether a file already exists at the
target path (e.g. `assets/images/<name>.png` or
`assets/images/<name>.svg`).

  - If the file exists AND has a sibling `.provenance.json`, it was
    AI-generated. You may regenerate it.
  - If the file exists and has NO provenance sidecar, it is hand-authored.
    STOP. Print:
      REFUSE: <path> is hand-authored. No changes made.
    Then exit without writing anything.

────────────────────────────────────────
STEP 3 · GENERATE THE ASSET
────────────────────────────────────────

### 3A · Vector path (icons, glyphs, tab icons)

Write SVG XML directly. Do not call an image-generation tool.

Requirements:
- Single-path or minimal-path woodcut silhouette. No gradients.
  No raster fills. No embedded images.
- All strokes and fills use `currentColor` or `inherit` — never
  a hardcoded hex color.
- ViewBox matches the spec's contract square (e.g. `0 0 64 64`).
- Validate: the SVG must pass `SvgXml` rendering — no unsupported
  attributes (no `filter`, no `foreignObject`, no `mask` unless
  react-native-svg supports it in the project's installed version;
  check `package.json`).

Save as: `assets/images/<kebab-name>.svg` (raw SVG text, not a React file).

Then write the import shim in the component:
  ```tsx
  import { SvgXml } from 'react-native-svg';
  const <camelName>Xml = require('@/assets/images/<kebab-name>.svg') as string;
  // Replace the inline <Svg …> block per SVG_ASSET_SPEC.md §N
  ```

### 3B · Raster path (illustrations, splatter)

**Requires an image-generation tool.** Before running this step, confirm
one of the following is available:
  (a) Cursor's built-in GenerateImage tool, OR
  (b) An image-generation MCP (e.g. fal.ai, Replicate, Stability AI)
      configured in this project's MCP settings.

If neither is available, STOP and print:
  BLOCKED: No image-generation tool available. Add an image-gen MCP
  (e.g. fal.ai) to .cursor/mcp.json and re-run.

If a tool is available, generate with this prompt template:
  "High-contrast woodcut ink illustration on transparent background.
   <subject from spec>. Mörk Borg aesthetic: pitch black lines, no
   color, heavy cross-hatching, rough edges. <W>×<H> px."

Save as: `assets/images/<kebab-name>.png` at 2× resolution.
If the spec requires multiple variants (e.g. splatter §5 needs 3–4),
generate each one.

────────────────────────────────────────
STEP 4 · WRITE PROVENANCE SIDECAR
────────────────────────────────────────
Create `assets/images/<kebab-name>.provenance.json`:

```json
{
  "generated_by": "cursor-agent",
  "date": "<YYYY-MM-DD>",
  "tool": "<GenerateImage | <mcp-server-name> | hand-written-svg>",
  "prompt": "<exact prompt used, or 'hand-written SVG' for 3A>",
  "spec_section": "<§N>",
  "target_dimensions": "<W>x<H>",
  "source_file": "<component file where it is wired>"
}
```

────────────────────────────────────────
STEP 5 · WIRE THE ASSET INTO THE COMPONENT
────────────────────────────────────────
Follow the exact swap pattern in SVG_ASSET_SPEC.md §N for this asset.
No other changes to the component. Do not reformat surrounding lines.

After wiring:
- The placeholder `<Svg …>` block (or inline SVG) must be fully removed.
- The component's external API (props interface) must be unchanged.
- No new `Math.random()` calls. No hardcoded colors (use AXM palette tokens).

────────────────────────────────────────
STEP 6 · TEST THE SWAP
────────────────────────────────────────
Run in order, stop and fix on first failure:

1. `npx tsc --noEmit`
   Fix all new type errors before proceeding.

2. `npm test`
   All tests must be green. If the swap breaks an existing snapshot,
   update the snapshot ONLY if the change is intentional (the placeholder
   SVG is gone, replaced by the asset). Print which snapshots changed.

3. If the swapped component has no hermetic e2e test yet, write one at
   `app/<route>/e2e/<feature>.engine.test.ts` (or
   `components/<Component>.test.tsx` for pure render tests) that:
   - Renders the component with each relevant prop variant.
   - Asserts the asset import resolves (mock it with `jest.mock`).
   - Asserts no `undefined` is rendered where a string is expected.
   Mock `expo-font` → `[true]` and `react-native-reanimated/mock`.

4. Re-run `npm test` after writing the new test. Green twice in a row.

────────────────────────────────────────
STEP 7 · ATOMIC COMMIT
────────────────────────────────────────
Stage exactly:
  - `assets/images/<kebab-name>.<ext>` (the asset)
  - `assets/images/<kebab-name>.provenance.json` (provenance)
  - The modified component file(s) (the wiring)
  - Any new or updated test file(s)
  - `SVG_ASSET_SPEC.md` with the checklist item ticked (`- [x]`)

Commit message format (no emojis, no Co-Authored-By):
  feat(assets): swap <asset-name> placeholder for generated <vector|png>

  Replaces the inline SVG in <SourceFile> with <asset-path>.
  Spec: SVG_ASSET_SPEC.md §N. Provenance: assets/images/<name>.provenance.json.

Do not stage unrelated files. Do not amend an existing commit.

────────────────────────────────────────
HARD RULES (non-negotiable)
────────────────────────────────────────
- Never overwrite a hand-authored asset (Step 2 guard).
- Never upload assets to external services. Assets land in assets/images/,
  served by the project's own bundler.
- No Co-Authored-By lines. No emojis anywhere.
- Atomic commit: asset + provenance + wiring + tests + checklist tick,
  all in one commit, nothing else.
- Never add Math.random() to a screen. Never hardcode hex colors.
- If any step produces an unresolvable error, print BLOCKED: <reason>
  and stop. Do not commit partial work.
```

---

## What to add before running this

1. **Image-gen MCP** — for the raster illustrations (§5–8), add one to `.cursor/mcp.json`. fal.ai is the most straightforward; Replicate also works. The prompt already handles the "no tool available" case gracefully.

2. **SVG raw import support** — for the vector path (Step 3A), Metro needs to know how to `require()` `.svg` files as strings. That's either `metro-svg-transformer` or the asset already being imported via `SvgXml` with a string. Worth confirming this is set up before the vector track runs.

3. **The test harness (Spec 01)** — Step 6 depends on `npm test` working. If Spec 01 isn't done yet, the prompt will BLOCKED at Step 6's `npm test` call, which is the correct behavior.