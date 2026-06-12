# NEEDS_ATTENTION

> Repo-level audit ledger — known debt, half-finished migrations, and
> divergences that are *deliberately not being fixed right now*. Each
> entry names the evidence and the decision that's actually pending.
> Audited 2026-06-12 (post-Phase-137 + dead-code cleanup, engine at
> ^0.20.0). Remove entries when resolved; date new ones.

## 1. `combatMana` slice — deprecated since Phase 105, still load-bearing

**What:** `state/store.ts` marks the slice `@deprecated Phase 105 —
replaced with engine CombatState.combatResources. Remove in follow-up.`
The follow-up never landed: `StatusCard`, `DebugManaControl`,
`DebugHudOverrides`, `DebugPlaythroughPresets`, the combat-HUD
presenters, and `state/actions.ts` all still read/write it.

**Pending work:** migrate those readers to the engine's
`combatResources`, then delete the slice, its seeding in `startCombat`,
and the dev controls. This is real work, not a deletion — budget a
phase.

## 2. The generic `/event` modal is a fallback that may deserve deletion

**What:** after Phase 137, nothing routes to `/event` in production
(interaction → `/dialogue`, village → `/village`, cutscene →
`/cutscene`; rest / gathering / loot-cache / hazard / quest are
intercepted into minigames; encounters render via
`EncounterModalOverlay`). The 2026-06-12 cleanup stripped its dead
chrome and kept it as the `selectPacedEventRoute` fallback for
unforeseen paced kinds.

**Pending decision:** keep the defensive shell (current state, costs a
route + ~350 lines + tests) or delete it and make the fallback a no-op
with a logged warning. Either is fine; decide once a new paced kind
actually ships.

## 3. Village and cutscene events have NO authored source in mobile

**What:** the new `/village` and `/cutscene` screens are production-
unreachable today. Mobile registers per-node pool overrides for **every**
node in both map layouts (`state/exploration-maps/event-pools.ts`), and
none of its pools contain a `village` or `cutscene` entry — while the
engine's own per-node content (`MapEvents/content.ts`, which DOES author
them) is fully shadowed by those overrides. The screens are covered by
hermetic tests and the dialogue/leave plumbing works, but no map node can
fire either kind.

**Pending decision:** the content source-of-truth question — either
consume the engine's authored pools (drop or narrow mobile's blanket
overrides) or author village/cutscene entries in mobile's pools.
Cross-filed in mechanics' NEEDS_ATTENTION.md §5.

## 4. Village shop has no sell side

**What:** `/village` buys through engine `buyItem`; the engine also
ships `sellItem` + `defaultSellPrice` (Phase 37) but no mobile surface
uses them. Players can spend shillings at a settlement but never raise
them there.

**Pending work:** a SELL tab on the village screen (engine reducers
exist; this is UI + an action-layer wrapper).

## 5. Minigame e2e harnesses don't cover the Phase 137 encounters

**What:** `scripts/hazard-e2e.mjs` and `scripts/gathering-e2e.mjs` drive
the older minigames through the web build; quest / rest / cache have
jest coverage only (`state/e2e/quest.flow…`, `rest.flow…`,
`cache.flow…`, `quest.screen…`). The dev-seed globals are already in
place (`__AXM_QUEST_SEED__`, `__AXM_REST_SEED__`, `__AXM_CACHE_SEED__`).

**Pending work:** sibling `quest-e2e.mjs` / `rest-e2e.mjs` /
`cache-e2e.mjs` scripts when browser-level coverage is wanted.

## 6. Keepsake flags accumulate without a consumer

**What:** rests bank `night-keepsake:<label>` flags and caches bank
`cache-keepsake:<label>` flags (plus gathering's older
`gleaning-token-banked:*`). Nothing reads them yet, and a long save will
accrue an unbounded flag list.

**Pending decision:** give keepsakes a consumer (memoir entries, codex
unlocks, a future faction hook) or cap/cycle them. Cheap now, annoying
after a hundred rests.

## 7. Quest board completion is cosmetic by design — for now

**What:** finishing `build-the-boat` records
`quest-board-done:build-the-boat:<tier>` and gates nothing (decided
2026-06-12). The fv-15 "Sea Cave" node hosts the only board; story beats
2+ are unauthored engine-side.

**Pending work (when story gating is wanted):** read the flag in
exploration unlocks / quest log, and author the next boards in the
engine.

## 8. Cache trap fates are hidden information stored client-side

**What:** the Reliquary's sealed trap states live in the session object
in the store; the presenter (`state/presenters/cache.engine.ts`) is the
only leak boundary. Anyone with dev tools can read them. Acceptable for
a single-player game; noted so nobody mistakes the presenter gate for a
security boundary.

## 9. `RUNTIME_TYPE_DIVERGENCE_ISSUE.md` remains open

**What:** the documented engine-type vs runtime-shape divergence issue
still stands (last reviewed 2026-06-12 — doc still accurate). It
predates Phase 137 and is unaffected by it; kept here so the standalone
file isn't forgotten.
