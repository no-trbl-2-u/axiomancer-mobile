# Hermetic E2E Inventory

> **Purpose.** A single audit surface for the test suite: the hermetic
> Jest layer (self-contained, deterministic, isolated) plus the
> browser-driven Playwright `*-e2e.mjs` layer that boots a real web
> export against localhost.
> Every row links the test file, what it pins, and the pattern it uses.
> Regenerated 2026-07-01 against commit `160ae90`. Re-run the catalog
> with the commands at the bottom.

See [`docs/testing.md`](./testing.md) for the full standard. This doc
is the **catalog** — testing.md is the **contract**.

The runner is **Jest** (`npm test` → `jest`, `jest-expo` preset). Both
`package-lock.json` and `pnpm-lock.yaml` are checked in, but the
canonical repro is `npm test` / `node scripts/*-e2e.mjs`.

## 1. What "hermetic" means here (one-liner)

A test is hermetic iff it is **self-contained** (no network, no real
AsyncStorage / FS / timers / Reanimated / image fetch), **deterministic**
(no wall-clock, no real `Math.random`, no PIDs / env), and **isolated**
(no shared mutable state; `afterEach` restores mocks).

The Jest layer (sections 3–6) is hermetic in this strict sense. The
browser-e2e layer (section 7) is **hermetic-at-the-boundary**:
localhost-only, headless, and seeded where RNG matters, but it does run
a real `expo export` + local HTTP server, so it lives outside the Jest
glob and is invoked by its own `e2e:*` npm scripts.

## 2. Patterns in play (Jest layer)

The Jest suite uses five patterns. Each test file uses exactly one as
its primary pattern (a few mix two — noted in the row).

| # | Pattern | What it asserts on | Mounts React? | Engine state? |
|---|---|---|---|---|
| **P1** | **Presenter-contract** | `select<Screen>ViewModel(state, localUi?) → ViewModel` shape + values | No | Real engine (`createGameStore`) wrapped by `createAppStore` |
| **P2** | **Action-layer integration** | Dispatching actions through `createAppActions(...)` updates engine state correctly; then assert via P1 | No | Real engine |
| **P3** | **renderHook / context** | A hook or context provider (e.g. `useCombatMode`, `useGameEvents`) emits the expected sequence on subscribe / dispatch / unmount | Provider only (no screens) | Real engine |
| **P4** | **Screen render** | Mounting an `app/…/<screen>.tsx` (or a component) does not throw and renders the right strings | Full screen + jest-expo's RN host | Real engine |
| **P5** | **Source-grep contract** | Layout / routing / hermeticity invariants the type system can't catch (`<GestureHandlerRootView>` wraps root; folder routes named `<dir>/index`; no stray `_layout.*` files in `app/`; test-convention guards) | No | None — reads source files as text |

All five run under `npm test` (Jest + `jest-expo` preset). Reanimated
is mocked via `react-native-reanimated/mock` in `jest.setup.ts`.
RNG is replaced by `test-utils/rng.ts` (`mockFixedRng`, `mockSequentialRng`,
`mockAlternatingRng`) which calls the engine's `setRng()`.
AsyncStorage uses the official jest mock for persistence tests, and
elsewhere `test-utils/memoryAdapter.ts` provides an in-memory
`PersistenceAdapter` that tracks `saveCount` for explicit-save-gate
assertions.

## 3. Inventory — `state/e2e/`

> Counts: `desc` = `describe()` blocks, `it` = `it()` / `test()` blocks
> (grep-derived, matching section 8). Folder totals at the bottom.

| File | Pattern | Pins | desc | it |
|---|---|---|---:|---:|
| `aesthetic-mode.engine.test.tsx` | P3 | `useAesthetic` context: default 'canonical', AsyncStorage hydration (valid / corrupt), setMode write-through, toggle round-trip, provider guard, `skipHydration` opt-out | 4 | 12 |
| `aftermath-snapshot.engine.test.ts` | P1 | Aftermath snapshot regression guard (victory / parley / defeat payload shape survives round-trip) | 1 | 5 |
| `app-components.engine.test.tsx` | P4 | App-component smoke: top-level components mount at fresh boot without throwing | 3 | 6 |
| `app-routes.engine.test.tsx` | P4 | `app/index.tsx` onboarding flow + route surfaces render VM-driven content | 2 | 10 |
| `cache.flow.engine.test.ts` | P2 | Loot-cache ("The Reliquary") store flow end-to-end via the action layer | 1 | 4 |
| `cache.loot-table.engine.test.ts` | P1 (pure) | Cache loot-table reward depth / roster composition | 1 | 4 |
| `character.engine.test.ts` | P1 | Character VM shape + stat-row composition + saves/tests block + 7 equipment slots in display order; alignment slice (cell name, three-axis bucketing, boundaries, a11y sentence) | 11 | 42 |
| `character-preset.engine.test.ts` | P2 | `applyCharacterPreset` replaces the player with an engine preset | 2 | 3 |
| `codex-unlock-consumer.engine.test.ts` | P2 | `actions.endCombat` returns the engine `CombatEndReport` and unlocks codex entries (Phase 78) | 1 | 6 |
| `combat-encounter.screen.test.tsx` | P4 | `/combat-encounter` screen reveal → board; **pins the HP-only redesign**: the DoT/Control `combat-pressure-tracks` and the tap-draft `combat-read-banner` are asserted **absent** | 3 | 5 |
| `combat-hud.engine.test.ts` | P1 | HUD percent clamping (HP → 0..1); effect-array composition; degenerate-character invariants | 5 | 16 |
| `combat-mode.engine.test.tsx` | P3 | `useCombatMode` context: `lastOutcome` one-shot signal, `exitCombatWith` (+ aftermath snapshot payload), `clearLastOutcome`, `inEncounterModal` session flag, `aftermathData` + `dismissAftermath`, run-stats counters (`encountersFaced` / `deepestNodeId` / `recordDeepestNode` / `resetRunStats`) | 4 | 21 |
| `combat-tutorial.screen.test.tsx` | P4 | Combat-tutorial screen gating + step progression | 2 | 5 |
| `debug-seed.engine.test.ts` | P2 | `actions.debugSeed()` end-to-end: inventory + known cards + map reset, set-idempotent on re-seed | 1 | 5 |
| `dev-presets.engine.test.ts` | P2 | `applyPlayerTierPreset` L1/L15/L30/L50 ladder | 2 | 10 |
| `dev-route.screen.test.tsx` | P4 | `/dev` Developer screen renders under a DEV build | 2 | 3 |
| `engine-events.engine.test.ts` | P2 | `_recentEvents` ring buffer populated by real engine dispatches; newest-first ordering; capacity at `RECENT_EVENTS_CAPACITY`; un-wired store returns `null` emitter | 4 | 11 |
| `engine-events.hook.test.tsx` | P3 | `useGameEvents` subscribes on mount, fires in dispatch order, unsubscribes on unmount, tolerates a non-stable handler reference | 1 | 3 |
| `event-assets.test.ts` | P1 (pure) | Exhaustively maps `ResolvedEvent.kind` → `EventArtSlug` (no store; pure unit-shape) | 2 | 12 |
| `event.codex.engine.test.ts` | P1 (pure) | `selectEventCodexHeader`: EVENT/<variant> + KIND/<kind> tokens, uppercase + hyphen→dot normalization | 1 | 5 |
| `event.engine.test.ts` | P1 | Event VM + `selectHasActiveEvent` / `selectHasActivePacedEvent` / `selectHasActiveCombatPrelude` across all event kinds (encounter, rest, gathering, loot-cache, interaction, village, narration); combat-prelude STRIKE/KNEEL relabel; action subtitles | 11 | 59 |
| `event.screen.test.tsx` | P4 | `app/event/index.tsx` renders right VM-driven content per kind; pick dispatches the right action; `canSkip` gating | 3 | 12 |
| `exploration.codex.engine.test.ts` | P1 (pure) | `selectExplorationCodexHeader`: REGION/<slug> + NODE/<slug>, normalization, UNKNOWN/NONE fallbacks | 1 | 5 |
| `exploration.engine.test.ts` | P1+P2 | Exploration VM shape; `moveTo` / `changeMap` action layer; event-callout shape; deep-freeze invariant; encounter-modal seam pin | 13 | 32 |
| `flee-action.engine.test.ts` | P2 | Flee/retreat action narrative feedback + state effect | 1 | 3 |
| `gathering.flow.engine.test.ts` | P2 | Gathering ("The Gleaning") store flow — a clean gleaning end-to-end | 2 | 8 |
| `gathering.screen.test.tsx` | P4 | Gathering screen — site intro + board render | 5 | 10 |
| `gathering.tutorial.engine.test.ts` | P2 | The pinned gathering tutorial session (scripted step order) | 3 | 5 |
| `hazard-deck.screen.test.tsx` | P4 | Hazard deck / card-library screen render | 2 | 7 |
| `hazard.flow.engine.test.ts` | P2 | Hazard minigame store flow (draft → play → outcome → rewards) | 2 | 11 |
| `hazard-out-of-combat-death.engine.test.ts` | P2 | Hazard damage can drop the player out of combat and route to defeat | 1 | 4 |
| `hazard-scar-rest-recovery.engine.test.ts` | P2 | Hazard "scar" recovers at an inn rest | 1 | 4 |
| `hazard.screen.test.tsx` | P4 | Hazard screen — danger intro + board render | 4 | 11 |
| `hermeticity.audit.engine.test.ts` | **P5** | Self-policing test-convention guard: no network / wall-clock / unguarded `Math.random` / real AsyncStorage leaks into `state/e2e/` | 3 | 6 |
| `inventory.engine.test.ts` | P1+P2 | Inventory VM (canonical tabs in order); `useItem` / `equipItem` / `dropItem` end-to-end; equipment dock; replace-preview; `parseHealAmount` | 20 | 58 |
| `inventory-feedback.engine.test.ts` | P1 (pure) | `selectInventoryToast` — synthetic `inventory:changed` events produce correct toasts; unrelated kinds yield `null` | 1 | 8 |
| `inventory.modal.engine.test.ts` | P1 | Item-modal VM: USE preview HP delta; EQUIP / EQUIP·REPLACE label branches; null on unknown item id | 4 | 20 |
| `inventory.screen.test.tsx` | P4 | Inventory screen renders empty + populated; modal confirm routes through action layer | 3 | 4 |
| `map-encounter-minigames.engine.test.ts` | P2 | Map encounter → minigame routing (northern-forest): each node kind launches the matching minigame session | 2 | 5 |
| `memoir.engine.test.ts` | P1 | Memoir VM shape; quest section composition (active + completed); alignment / chronicle sections | 5 | 26 |
| `minigame-seeds.engine.test.ts` | P1 | Minigame seed-resolver precedence (dev hook → node → default) | 1 | 4 |
| `navigation.engine.test.ts` | P1 | `selectActiveTab` / `selectTabBadges` / full nav VM under varied game states | 4 | 14 |
| `new-player-journey.engine.test.tsx` | P2 (integration) | Fresh state through the first encounter — full new-player journey | 1 | 6 |
| `one-economy.engine.test.ts` | P2 | Victory spoils come from the engine `endCombat` report (single source of currency/loot) | 2 | 5 |
| `performance.regression.test.tsx` | P4 | Performance regression guards (render-cost budgets on primary surfaces) | 5 | 9 |
| `quest.flow.engine.test.ts` | P2 | Quest-board store flow end-to-end | 1 | 6 |
| `quest.screen.test.tsx` | P4 | Quest screen render + interaction | 3 | 10 |
| `rest.flow.engine.test.ts` | P2 | Rest ("the inn") store flow end-to-end | 1 | 5 |
| `re-trigger.engine.test.tsx` | P2 (integration) | Encounter re-trigger regression guard (Phase 118) | 1 | 6 |
| `route-registration.engine.test.ts` | **P5** | `<GestureHandlerRootView>` wraps `app/_layout.tsx`; `<Tabs.Screen name="…">` strings match folder-route IDs (`<dir>/index`) | 2 | 5 |
| `route-tree.engine.test.ts` | **P5** | No stray `_layout.*` files in `app/` other than `_layout.tsx` (Expo Router's `require.context` would mount them in production) | 3 | 4 |
| `smoke-render.engine.test.tsx` | P4 (broad) | Mounts each primary surface at fresh-store boot; asserts render doesn't throw, no `{…}` template-string leaks, no missing-fragment crashes | 4 | 18 |
| `store.engine.test.ts` | P2 | `createAppStore` lifecycle: load / save gating (explicit-only); `_recentEvents` initialized; engine-store passthrough | 4 | 10 |
| `tabs.engine.test.ts` | P1 | Tab visibility mutex (MAP ⊕ combat prelude never both); combat-prelude detection feeds the mutex | 6 | 11 |
| **Totals (`state/e2e/`, 54 files)** | | | **178** | **599** |

## 4. Inventory — `state/presenters/__tests__/`

Pure presenter-VM contracts (P1 unless noted). 14 files.

| File | Pins | desc | it |
|---|---|---:|---:|
| `aftermath.engine.test.ts` | Aftermath VM presenter: victory / parley / defeat branches (epithet derivation, per-tier flavor, reward threading, killer block) | 5 | 48 |
| `combat-card-vm.test.ts` | Combat-card VM shape (name, cost, effect chips, rarity tier) | 4 | 12 |
| `combat-hud.engine.test.ts` | Combat HUD presenter (HP bar clamp, effect chips) | 4 | 11 |
| `encounter-seal.engine.test.ts` | `selectEncounterSealChrome(mode, round?)`: prelude / combat / aftermath chain-bar labels + accent colors, lowercase-roman rounds, defensive sentinel | 1 | 9 |
| `enemy-art.test.ts` | Enemy-art slug resolution | 1 | 3 |
| `hazard-deck.engine.test.ts` | Hazard-deck / card-library VM | 2 | 6 |
| `hazard.engine.test.ts` | Hazard board VM (dice, cards, routes, meters) | 6 | 15 |
| `hazard-vm-lock.engine.test.ts` | Hazard VM lock / no-re-cast invariant | 1 | 3 |
| `levelup.engine.test.ts` | Level-up VM (ascend strip, derived preview) | 2 | 5 |
| `onboarding.engine.test.ts` | Onboarding VM | 1 | 3 |
| `roman.test.ts` | Roman-numeral helper (1..10 + decimal fallback) | 1 | 6 |
| `stances.test.ts` | Stance metadata / glyph mapping | 1 | 3 |
| `tooltip.engine.test.ts` | Tooltip presenter contract | 18 | 60 |
| `village.engine.test.ts` | Village event VM | 2 | 13 |
| **Totals (14 files)** | | **49** | **197** |

## 5. Inventory — `state/persistence/e2e/`

| File | Pattern | Pins | desc | it |
|---|---|---|---:|---:|
| `asyncStorageAdapter.engine.test.ts` | P2 | `createAsyncStorageAdapter` round-trips via AsyncStorage's jest mock; envelope wrap/unwrap; error recovery; v2→v3 alignment backfill end-to-end | 4 | 16 |
| `migrations.engine.test.ts` | P1 (pure) | v1→v2 backfills `derivedStats` / `nonCombatStats`; v2→v3 backfills `state.alignment` via `defaultAlignment()`; schema-version pin + DEFAULT_MIGRATIONS infrastructure | 5 | 17 |

## 6. Inventory — component-level & script-helper hermetic tests

The `components/` tree holds **135** hermetic `*.test.tsx` files in
total (mostly P4 render contracts) — far more than can be tabled here.
The rows below are the **seam-critical** ones (combat/aftermath modal
chain, error boundary, corrupt-save, dev affordances); enumerate the
rest with the reproduction commands in section 8.

| File | Pattern | Pins | desc | it |
|---|---|---|---:|---:|
| `components/event/__tests__/EncounterModalOverlay.test.tsx` | P4 | Modal-over-map seam: mount conditions, FLEE-disabled-for-boss branch, non-dismissible backdrop, prelude→combat mode transition, combat→aftermath swap for victory / parley / defeat, phase-aware seal chrome | 10 | 27 |
| `components/event/aftermath/__tests__/CombatVictoryPanel.test.tsx` | P4 | Victory panel render contract: enemy name + epithet (null collapse), final-blow phrase, reward strip + xp em-dash branch, loot list branches, CARRY ON button wiring | 3 | 14 |
| `components/event/aftermath/__tests__/CombatFriendshipPanel.test.tsx` | P4 | Friendship/parley panel: pixel-emblem mount, enemy / epithet / pact phrase / AN ACCORD label, reward strip, journal-entry branches, PART AS FRIENDS wiring | 2 | 11 |
| `components/event/aftermath/__tests__/CombatDefeatPanel.test.tsx` | P4 | Defeat panel: eyebrow + character name + killer block (null collapse) + damage ledger + cause phrase + run-summary rows, BEGIN AGAIN + page-close wiring | 2 | 13 |
| `components/event/aftermath/__tests__/PixelEmblem.test.tsx` | P4 | The app's lone pixel-art carve-out: frame mount, exact `<Rect>` count vs PIXEL_HEART, default cell scaling, `cell` prop; invariant fence on the PIXEL_HEART grid + character set | 2 | 7 |
| `components/__tests__/ErrorBoundary.test.tsx` | P4 | App-wide React ErrorBoundary + in-world `<ErrorScreen>` fallback: passthrough, error-code mapping, diagnostics panel, COPY toggle, TRY AGAIN + return-to-hearth reset wiring | 4 | 13 |
| `components/__tests__/CorruptSaveModal.test.tsx` | P4 | Boot-time corrupt-save prompt: mount on visible prop, confirm/cancel routing, ritual voice register, per-button accessibilityLabel | 4 | 8 |
| `components/__tests__/DebugSeedButton.test.tsx` | P4 | Dev-only debug-seed button: DEV-gate, tap routes through `actions.debugSeed()`, result-line update, idempotent re-seed, accessibility | 3 | 6 |
| `components/__tests__/DevAutoSeed.test.tsx` | P4 | Boot-time auto-seed for DEV: empty inventory triggers a single `actions.debugSeed()`, renders nothing, idempotent when populated, production-gated | 2 | 4 |
| `components/__tests__/DebugMapResetButton.test.tsx` | P4 | Dev-only map-reset: DEV gate, tap re-seeds currentMap via `actions.changeMap`, accessibility | 3 | 4 |
| `components/__tests__/StanceGlyph.test.tsx` | P4 | StanceGlyph + GlyphHeart asset wiring (per-stance source resolution, fallback) | 4 | 16 |

Script-helper tests cover **pure helpers** extracted from `.mjs`
scripts. Real `expo export`, EAS build, and server are integration
concerns exercised by the browser-e2e layer (section 7).

| File | Pins | desc | it/test |
|---|---|---:|---:|
| `scripts/__tests__/deploy-check.test.ts` | EAS build status → exit-code mapping | 3 | 8 |
| `scripts/__tests__/smoke-bundler.test.ts` | Smoke-bundler pure helpers (CLI flag parse, output dir prep) | 4 | 11 |
| `scripts/__tests__/smoke-screens.test.ts` | Smoke-screens pure helpers (route enumeration, expected-text matchers) | 8 | 17 |
| `scripts/__tests__/hermes-ui-playtest.test.ts` | Hermes UI-playtest harness pure helpers | 3 | 7 |
| `scripts/__tests__/playtest-skill.test.ts` | Playtest card/skill-driver pure helpers | 2 | 5 |

## 7. Browser-e2e suite — `scripts/*-e2e.mjs` (Playwright)

Six wired browser-driven end-to-end scripts. Each boots a real
`expo export` (web), serves it on `127.0.0.1`, and drives **headless
Chromium** with real pointer/tap gestures. They are localhost-only and
seeded through `globalThis.__AXM_*` dev hooks before boot, so they are
deterministic without being pure-hermetic (they run a real bundler +
server, hence they live outside the Jest glob). All six are wired to
`npm` scripts — no orphans.

| Script | npm script | Seed / dev hook | What it drives + asserts |
|---|---|---|---|
| `scripts/hazard-e2e.mjs` | `e2e:hazard` | `__AXM_HAZARD_SEED__` / `__AXM_HAZARD_ID__` | Boots the hazard minigame, dismisses the danger-intro, drags cards from the fanned hand into the play area, drags mana dice onto staged cards, presses PLAY, taps through the O/X stamps + outcome + rewards ledger for **both** routes; asserts the no-re-cast doctrine (identical die ids across all three rounds) and full phase order |
| `scripts/combat-encounter-e2e.mjs` | `e2e:combat` | `__AXM_COMBAT_SEED__` | Launches `/combat-encounter` and plays the card-and-dice combat. **⚠ Currently rotted:** its docstring + board assertions still target the **removed** two-Pressure-Track UI (`combat-pressure-tracks` / `track-dot` / `track-control`, Erosion/Saturation summary) that the HP-only redesign purged — the Jest screen test now pins those testIDs as **absent**. Expect `e2e:combat` (and `e2e:minigames`) to exit 1 until it is re-pointed at the HP-only board |
| `scripts/gathering-e2e.mjs` | `e2e:gathering` | `__AXM_GATHER_SEED__` / `__AXM_GATHER_SITE__` | Plays "The Gleaning" for **both** stances: GLEAN (inspect plot, take plots, use field tool, descend a stratum, withdraw clean → spoils → claim) and STRIP (take greedily until the WRATH meter fills, assert reprisal flashes, ERUPTION interrupt, ROUTED outcome, pieces-lost ledger) |
| `scripts/encounter-routing-e2e.mjs` | `e2e:encounters` | (routing guard; no RNG seed) | Opens the DEV menu and clicks each "TRIGGER ENCOUNTER" button (HAZARD / REST / GATHER / TREASURE / QUEST); asserts the app lands on the matching full-screen minigame route **and** that the minigame mounted — never the "/event → NO EVENT IN PROGRESS" dead-end (2026-06-14 regression guard) |
| `scripts/theme-switch-e2e.mjs` | `e2e:theme` | (deterministic UI) | Serves the export, opens `/character`, expands the COLOUR THEME picker, switches themes, asserts the palette re-paints in place (no reload, no console errors) |
| `scripts/loot-rarity-e2e.mjs` | `e2e:loot` | (engine `generateRarityDrop`) | Opens SELF → DEV TOOLS → `/dev` and presses each LOOT button (COMMON / UNCOMMON / RARE / UNIQUE), asserting the engine's affix contract from on-screen feedback (0 / 1 / 2 named affixes, 3 fixed mods for unique) |

`e2e:minigames` chains four of these (`hazard` → `combat` → `gathering`
→ `encounters`) with `*_E2E_REUSE_EXPORT=1` so the web export is built
once and reused.

## 8. Auditing the methodology — falsifiable checks

If any of these returns a hit in `state/e2e/`, the hermetic boundary
has leaked and that test is **no longer** hermetic. These are the same
greps `hermeticity.audit.engine.test.ts` enforces in-suite:

```bash
# 1. No real network
grep -rE 'fetch\(|axios|XMLHttpRequest' state/e2e/

# 2. No real timers / wall-clock (must be inside jest.useFakeTimers blocks)
grep -rE 'Date\.now\(|setTimeout\(|setInterval\(' state/e2e/ \
  | grep -v 'jest\.useFake\|fakeTimers'

# 3. No unguarded Math.random (must be replaced via mockFixedRng etc.)
grep -rEn 'Math\.random' state/e2e/

# 4. No render() leaking into presenter-contract tests (only screen.tsx tests should render)
grep -rE 'render\(' state/e2e/*.engine.test.ts

# 5. No real AsyncStorage (must go through createMemoryAdapter or the official mock)
grep -rE "from '@react-native-async-storage" state/e2e/
```

## 9. Reproducing this inventory

```bash
# Every test file on disk (224 at commit 160ae90):
find . -name '*.test.ts' -o -name '*.test.tsx' | grep -v node_modules

# Catalog the hermetic e2e folder with one-line summaries:
ls state/e2e/
grep -rEh "^\s*(describe|it|test)\(" state/e2e/

# Block counts per file:
for f in state/e2e/*.test.ts state/e2e/*.test.tsx; do
  it=$(grep -cE "^\s*(it|test)\(" "$f")
  desc=$(grep -cE "^\s*describe\(" "$f")
  echo "$(basename $f): $desc desc / $it it"
done

# Run the hermetic-suite only:
npm test -- state/e2e

# Just the catalog, no execution:
npm test -- --listTests

# Browser-e2e (real export + headless chromium):
npm run e2e:hazard        # or e2e:gathering / e2e:encounters / e2e:theme / e2e:loot
npm run e2e:minigames     # chained, single reused export
```

## 10. Known intentional gaps

These are **not** covered by the hermetic Jest layer. Most are now
covered by the browser-e2e layer (section 7); the remainder need
out-of-band verification:

- **Real `expo export` / Metro bundling.** Exercised by every
  `scripts/*-e2e.mjs` (they build a real web export) and by
  `scripts/smoke-bundler.mjs` + EAS Build.
- **Real browser rendering + pointer gestures.** Covered by the
  Playwright browser-e2e suite (localhost, headless Chromium).
- **Real `AsyncStorage` IO.** Adapter logic is pinned via the jest
  mock; on-device behaviour relies on `react-native-async-storage`
  itself.
- **Reanimated animations.** Mocked at module level in Jest; visual
  rise/fade timings are not asserted.
- **Image asset loading.** `expo-font` and image `require()`s are
  jest-shimmed; broken asset paths surface at build / browser-e2e time.
- **EAS Build.** Verified via `deploy:check` + the `deploy-check`
  helper tests.

When a seam needs deeper coverage, the browser-e2e layer (section 7) is
the vehicle for player-facing / rendering contracts, and the
`smoke-render.engine.test.tsx` harness for cheap mount probes.
