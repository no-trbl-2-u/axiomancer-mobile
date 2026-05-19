# Hermetic E2E Inventory

> **Purpose.** A single audit surface for the hermetic e2e test suite.
> Every row links the test file, what it pins, and the pattern it uses.
> Generated 2026-05-19 against commit `12a485d` for an external audit
> of the methodology. Re-run the catalog with the commands at the
> bottom.

See [`docs/testing.md`](./testing.md) for the full standard. This doc
is the **catalog** — testing.md is the **contract**.

## 1. What "hermetic" means here (one-liner)

A test is hermetic iff it is **self-contained** (no network, no real
AsyncStorage / FS / timers / Reanimated / image fetch), **deterministic**
(no wall-clock, no real `Math.random`, no PIDs / env), and **isolated**
(no shared mutable state; `afterEach` restores mocks).

## 2. Patterns in play

The suite uses five patterns. Each test file uses exactly one as its
primary pattern (a few mix two — noted in the row).

| # | Pattern | What it asserts on | Mounts React? | Engine state? |
|---|---|---|---|---|
| **P1** | **Presenter-contract** | `select<Screen>ViewModel(state, localUi?) → ViewModel` shape + values | No | Real engine (`createGameStore`) wrapped by `createAppStore` |
| **P2** | **Action-layer integration** | Dispatching actions through `createAppActions(...)` updates engine state correctly; then assert via P1 | No | Real engine |
| **P3** | **renderHook / context** | A hook or context provider (e.g. `useCombatMode`, `useGameEvents`) emits the expected sequence on subscribe / dispatch / unmount | Provider only (no screens) | Real engine |
| **P4** | **Screen render** | Mounting an `app/(tabs)/<screen>.tsx` does not throw and renders the right strings | Full screen + jest-expo's RN host | Real engine |
| **P5** | **Source-grep contract** | Layout / routing invariants the type system can't catch (`<GestureHandlerRootView>` wraps root; folder routes named `<dir>/index`; no stray `_layout.*` files in `app/`) | No | None — reads source files as text |

All five run under `pnpm test` (Jest + `jest-expo` preset). Reanimated
is mocked via `react-native-reanimated/mock` in `jest.setup.ts`.
RNG is replaced by `test-utils/rng.ts` (`mockFixedRng`, `mockSequentialRng`,
`mockAlternatingRng`) which calls the engine's `setRng()`.
AsyncStorage uses the official jest mock for persistence tests, and
elsewhere `test-utils/memoryAdapter.ts` provides an in-memory
`PersistenceAdapter` that tracks `saveCount` for explicit-save-gate
assertions.

## 3. Inventory — `state/e2e/`

> Counts: `desc` = `describe()` blocks, `it` = `it()` blocks. Folder
> totals at the bottom.

| File | Pattern | Pins | desc | it |
|---|---|---|---:|---:|
| `character.engine.test.ts` | P1 | Character VM shape + stat-row composition + saves/tests block + 7 equipment slots in display order | 8 | 28 |
| `combat.engine.test.ts` | P1+P2 | Combat VM across all four phases (`choosing_stance` → `committed` → `resolving` → `aftermath`); every terminal condition (victory/defeat/flee/parley/friendship); stance preview via `localUi`; accessibility labels | 13 | 44 |
| `combat-hud.engine.test.ts` | P1 | HUD percent clamping (HP/mana → 0..1); effect-array composition; degenerate-character invariants | 5 | 18 |
| `combat-mode.engine.test.tsx` | P3 | `useCombatMode` context: `lastOutcome` one-shot signal, `exitCombatWith`, `clearLastOutcome`, `selectAftermathCopy(outcome)` (victory/parley vs defeat/flee) | 2 | 10 |
| `combat.screen.test.tsx` | P4 | `app/(tabs)/combat.tsx` renders in every phase the engine can put it into (no-combat, choosing, committed, resolving, aftermath) | 2 | 7 |
| `engine-events.engine.test.ts` | P2 | `_recentEvents` ring buffer is populated by real engine dispatches (`combat:started`, `combat:ended`); newest-first ordering; capacity at `RECENT_EVENTS_CAPACITY`; un-wired store returns `null` emitter | 4 | 12 |
| `engine-events.hook.test.tsx` | P3 | `useGameEvents` subscribes on mount, fires in dispatch order, unsubscribes on unmount, tolerates a non-stable handler reference (internal ref) | 1 | 3 |
| `event-assets.test.ts` | P1 (pure) | Exhaustively maps `ResolvedEvent.kind` → `EventArtSlug` (no store; pure unit-shape) | 2 | 14 |
| `event.engine.test.ts` | P1 | Event VM + `selectHasActiveEvent` / `selectHasActivePacedEvent` / `selectHasActiveCombatPrelude` across all event kinds (encounter, rest, gathering, loot-cache, interaction, village); combat-prelude STRIKE/KNEEL relabel; action subtitles | 10 | 52 |
| `event.screen.test.tsx` | P4 | `app/event/index.tsx` renders right VM-driven content per kind; pick dispatches the right action; `canSkip` gating | 3 | 13 |
| `exploration.engine.test.ts` | P1+P2 | Exploration VM shape; `moveTo` / `changeMap` action layer; event-callout shape; deep-freeze invariant; **encounter-modal seam** pin | 13 | 31 |
| `inventory.engine.test.ts` | P1+P2 | Inventory VM (5 canonical tabs in order); `useItem` / `equipItem` / `dropItem` end-to-end; equipment dock; replace-preview; `parseHealAmount` | 18 | 46 |
| `inventory-feedback.engine.test.ts` | P1 (pure) | `selectInventoryToast` — synthetic `inventory:changed` events produce correct toasts; unrelated event kinds yield `null` (no false toasts) | 1 | 8 |
| `inventory.modal.engine.test.ts` | P1 | Item-modal VM: USE preview HP delta; EQUIP / EQUIP·REPLACE label branches; null on unknown item id | 4 | 9 |
| `inventory.screen.test.tsx` | P4 | Inventory screen renders empty + populated; modal confirm routes through action layer | 2 | 3 |
| `memoir.engine.test.ts` | P1 | Memoir VM shape; quest section composition (active + completed); alignment / chronicle sections (extension-stable shape) | 5 | 26 |
| `navigation.engine.test.ts` | P1 | `selectActiveTab` / `selectTabBadges` / full nav VM under varied game states | 4 | 15 |
| `route-registration.engine.test.ts` | **P5** | `<GestureHandlerRootView>` wraps `app/_layout.tsx`; `<Tabs.Screen name="…">` strings match folder-route IDs (`<dir>/index`) — pins the 2026-05-19 runtime regressions | 2 | 5 |
| `route-tree.engine.test.ts` | **P5** | No stray `_layout.*` files in `app/` other than `_layout.tsx` (Expo Router's `require.context` would mount them as routes / layouts in production) | 3 | 4 |
| `smoke-render.engine.test.tsx` | P4 (broad) | Mounts each primary surface at fresh-store boot; asserts: render doesn't throw, no `{…}` template-string leaks, no missing-fragment crashes | 3 | 18 |
| `store.engine.test.ts` | P2 | `createAppStore` lifecycle: load / save gating (explicit-only); `_recentEvents` initialized; engine-store passthrough | 4 | 11 |
| `tabs.engine.test.ts` | P1 | Tab visibility mutex: MAP ⊕ COMBAT (never both); combat-prelude detection feeds the mutex | 6 | 11 |
| `token-crucible.engine.test.ts` | P1 (pure) | Token-Crucible VM: skill-library partition; `canAfford` matrix; deep-freeze invariant | 4 | 10 |
| `aesthetic-mode.engine.test.tsx` | P3 | `useAesthetic` context: default 'canonical', AsyncStorage hydration (valid / corrupt), setMode write-through, toggle round-trip, provider guard (Phase 50 tick A) | 3 | 10 |
| `combat.codex.engine.test.ts` | P1 (pure) | `selectCodexStatusLine` + `selectCodexEnemySlug`: enemy name slug rules, design-source ENC/ROUND/STATE format, roman 1..10 + decimal fallback, all engine phases threaded verbatim (Phase 50 tick B) | 2 | 11 |
| `event.codex.engine.test.ts` | P1 (pure) | `selectEventCodexHeader`: EVENT/<variant> left + KIND/<kind> right tokens, uppercase + hyphen→dot normalization, all variants threaded (Phase 50 tick C) | 1 | 5 |
| **Totals (`state/e2e/`)** | | | **123** | **421** |

## 4. Inventory — `state/persistence/e2e/`

| File | Pattern | Pins | desc | it |
|---|---|---|---:|---:|
| `asyncStorageAdapter.engine.test.ts` | P2 | `createAsyncStorageAdapter` round-trips via AsyncStorage's jest mock; envelope wrap/unwrap; error recovery | 4 | 15 |
| `migrations.engine.test.ts` | P1 (pure) | v1 → v2 migration backfills `derivedStats` / `nonCombatStats` via engine helpers; current schema version pin | 3 | 0¹ |

¹ All assertions live in `describe`-level setup or `test()` (not `it()`) — see source.

## 5. Inventory — component-level hermetic tests

| File | Pattern | Pins | desc | it |
|---|---|---|---:|---:|
| `components/event/__tests__/EncounterModalOverlay.test.tsx` | P4 | Modal-over-map seam: backdrop fade, panel rise, action-button subtitle render, auto-dismiss timing; codex header mount/omit per aesthetic mode (Phase 50 tick C) | 3 | 10 |
| `components/StanceGlyph.test.tsx` | P4 | StanceGlyph + GlyphHeart asset wiring (per-stance source resolution, fallback) | 4 | 16 |

## 6. Inventory — script-helper tests (non-e2e but hermetic)

These cover **pure helpers** extracted from `.mjs` scripts. Real
`expo export`, EAS build, server, and browser are integration concerns
and explicitly out of scope.

| File | Pins | desc | it/test |
|---|---|---:|---:|
| `scripts/__tests__/deploy-check.test.ts` | EAS build status → exit code mapping | 3 | 8 |
| `scripts/__tests__/smoke-bundler.test.ts` | Smoke-bundler pure helpers (CLI flag parse, output dir prep) | 4 | 11 |
| `scripts/__tests__/smoke-screens.test.ts` | Smoke-screens pure helpers (route enumeration, expected text matchers) | 7 | 16 |

## 7. Auditing the methodology — falsifiable checks

If any of these returns a hit in `state/e2e/`, the hermetic boundary
has leaked and that test is **no longer** hermetic. Run them as
spot-checks:

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

All five currently return zero hits across `state/e2e/` (verified
2026-05-19 against commit `12a485d`).

## 8. Reproducing this inventory

```bash
# Catalog with one-line summaries:
ls state/e2e/
grep -rEh "^\s*(describe|it|test)\(" state/e2e/

# Block counts per file:
for f in state/e2e/*.test.ts state/e2e/*.test.tsx; do
  it=$(grep -cE "^\s*it\(" "$f")
  desc=$(grep -cE "^\s*describe\(" "$f")
  echo "$(basename $f): $desc desc / $it it"
done

# Run the hermetic-suite only:
pnpm test state/e2e

# With coverage:
pnpm test state/e2e --coverage

# Just the catalog, no execution:
pnpm test --listTests
```

## 9. Known intentional gaps

These are **not** covered by hermetic e2e and require
out-of-band verification:

- **Real `expo export` / Metro bundling.** Covered by
  `scripts/smoke-bundler.mjs` (integration) and EAS Build.
- **Real `AsyncStorage` IO.** Adapter logic is pinned via the jest
  mock; on-device behaviour relies on `react-native-async-storage`
  itself.
- **Reanimated animations.** Mocked at module level; visual rise/fade
  timings are not asserted.
- **Image asset loading.** `expo-font` and image require()s are
  jest-shimmed; broken asset paths surface only at build time.
- **EAS Build.** Verified via `deploy:check` + the `deploy-check`
  helper tests.
- **End-to-end gesture handling.** Pinned structurally by P5
  (`route-registration`) but real pan/zoom not exercised.

If any of these need coverage, the most likely vehicle is the
`smoke-render.engine.test.tsx` harness — extending it with deeper
mount probes — rather than reaching for a Detox / Playwright layer
that would re-introduce network and timer non-determinism.
