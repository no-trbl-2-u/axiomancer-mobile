# 01 — Build plan

> Style guardrails for every phase below. Always ship hermetic
> Jest tests alongside code — never "add tests later". Break
> work into small, focused components in folders. Pure helpers
> (presenters, store adapters) go in their own modules with
> their own tests. Prefer 5 small files with clear names over 1
> dense file. Engine logic stays in `axiomancer-mechanics`.

## Status (at-a-glance)

`/march`, `/ship-a-phase`, and (transitively) `/loop` read this
block to find the next phase. Format: `[ ]` pending → `[x]`
shipped (with commit hash). Tick in this file in the same
commit that ships the phase.

**Already shipped (pre-loop, prior history):**

- [x] Spec 01 — Test harness setup (`jest-expo` +
      `@testing-library/react-native`, hermetic-test standard
      in `docs/testing.md`). See `specs/01-test-harness-setup.md`
      `[DONE on 2026-05-11]`.
- [x] Spec 02 — Engine store integration (Zustand store wrapping
      `createGameStore`; `<GameStoreProvider>`, `useGameState`,
      `useGameActions`, typed action wrappers). See
      `specs/02-engine-store-integration.md` `[DONE on
      2026-05-11 — see commit efef5f5]`.
- [x] Spec 03 — Presenter layer contract
      (`select<Screen>ViewModel(state, localUi?) → ViewModel`,
      `docs/presenters.md`, 5 `*.engine.ts` stubs + e2e shape
      tests, route-tree guard, deep-freeze invariant). See
      `specs/03-presenter-layer.md` `[DONE on 2026-05-12 — see
      commit e378f99]`.
- [x] Spec 04 — Combat screen wiring (canonical sibling for
      every later screen-wiring phase). See
      `specs/04-combat-screen-wiring.md` `[DONE on 2026-05-12]`.
- [x] Spec 05 — Character screen wiring
      (`selectCharacterViewModel`, `app/(tabs)/character/`
      route folder, read-only stat surface). See
      `specs/05-character-screen-wiring.md` `[DONE on
      2026-05-13 — see commit 4afb4ed]`.
- [x] Spec 06 — Inventory screen wiring. See
      `specs/06-inventory-screen-wiring.md` `[DONE on 2026-05-13]`.
- [x] Spec 07 — Exploration screen wiring. Implementation
      landed in commit `06fc907` ("Exploration spec
      implementation"); spec doc flipped to `[DONE on 2026-05-13]`
      in commit `527f021` as part of phase 2's audit close-out.
- [x] Spec 09 — AsyncStorage persistence adapter
      (`createAsyncStorageAdapter`, `schemaVersion` migration
      runner, debounced writes, preload-before-mount in
      `app/_layout.tsx`, 15 hermetic e2e). See
      `specs/09-asyncstorage-persistence.md` `[DONE on
      2026-05-13]` and `plan/phases/phase_7_asyncstorage_persistence.md`.

**Next up (autonomous loop's queue):**

- [x] Phase 1 — Adopt nexus methodology. Shipped in commit
      `a703908` ("chore: adopt nexus methodology"); closed out
      in this commit.
- [x] Phase 2 — Fix engine API drift (verify-gate unblocker).
      Shipped in commit `527f021` ("Fix audit issues"); see
      `plan/phases/phase_2_engine_drift.md` for the retroactive
      brief. Verify gate is GREEN (185 / 185).
- [x] Phase 3 — Spec 02: Engine store integration. Shipped in
      commit `efef5f5` ("Engine store integration") on
      2026-05-11; see `plan/phases/phase_3_engine_store_integration.md`
      for the retroactive brief.
- [x] Phase 4 — Spec 03: Presenter layer. Shipped across
      commits `e56184e` (scaffolds + e2e stubs) and `e378f99`
      (contract doc + spec status) on 2026-05-12; see
      `plan/phases/phase_4_presenter_layer.md` for the
      retroactive brief.
- [x] Phase 5 — Spec 05: Character screen wiring. Shipped in
      commit `4afb4ed` ("feat(spec05): wire character screen to
      engine via selectCharacterViewModel") on 2026-05-13; see
      `plan/phases/phase_5_character_screen_wiring.md` for the
      retroactive brief.
- [x] Phase 6 — Spec 08: Event screen wiring. Shipped across
      four sub-ticks on 2026-05-15: Tick A presenter + store
      slice (`2c4d2b0`), Tick B action layer (`31e42f0`),
      Tick C screen refactor (`beba7d4`), Tick D close-out
      (this commit). Brief at
      `plan/phases/phase_6_event_screen_wiring.md`. All five
      Spec 08 product questions resolved
      (A / C / B / Future spec / Yes); two VM kinds
      (`combat-prelude`, `narrative-choice`); illustrations
      under `components/event/` (out of router tree);
      `eventActions.pickEventChoice` dispatches `applyDialogue`
      or `startCombat` per VM kind; `selectHasActiveEvent`
      reads engine truth; consequence chips + skip button
      shipped. Phase 19 closes as drained by Tick A (one-line
      `selectHasActiveEvent` flip). Verify green at 321 / 321.
- [x] Phase 7 — Spec 09: `AsyncStorage` persistence adapter.
      Shipped on main across commits `aa187cd` (e2e), `09bc44e`
      (specs / adapter / migrations) and `2f8ecea` (layout
      wiring), with this commit closing out the spec Q-answers,
      DoD ticks, and Phase log. See
      `plan/phases/phase_7_asyncstorage_persistence.md`.
- [x] Phase 8 — Spec 10: Navigation + app-shell polish (deep
      links, back behaviour, tab badges, splash → first screen
      handoff). See commit `6fc00dd`.
- [x] Phase 9 — Spec 11: Asset pipeline. Drain the SVG
      placeholder backlog via the existing
      `.cursor/skills/swap-asset-placeholder/SKILL.md` flow.
      One real asset per tick. `78006f1`
- [x] Phase 10 — Spec 12: Accessibility + theming polish
      (a11y labels, reduce-motion, font-scaling, large-text,
      dark-only confirmation). See commit `d5d5e5e`.
- [x] Phase 11 — EAS Build deploy-gate wiring. Replace the
      stub in `scripts/deploy-check.mjs` with a real EAS Build
      API poll (`https://api.expo.dev/v2/projects/<id>/builds`)
      keyed to HEAD's commit SHA. Document `EXPO_TOKEN` setup
      in `setup/02_eas.md` (new file). See commit `0f703d2`.
- [x] Phase 12 — App icon + splash screen polish (final assets,
      adaptive icons, splash background = `AXM.bg`). See commit `4e0fde5`.
- [x] Phase 13 — TestFlight + Play Internal Track first cut.
      Production EAS builds, store listings drafted, internal
      testers invited. See commit `e49f8db`.
- [x] Phase 14 — UI fixes: Character crash + Event tab → modal.
      Promoted via `/oversight` on 2026-05-14 (score 9.0).
      Implementation landed in commit `5dd597b` ("Bug issues");
      verified end-to-end against the brief's acceptance criteria
      by `/march` on 2026-05-14 and closed formally in this
      commit. Event screen lives outside `(tabs)/`, served by a
      `fullScreenModal` Stack.Screen with `EventGate` as the
      driver; `selectCharacterViewModel` null-guards on missing
      `derivedStats` / `nonCombatStats` with `?? {}` / `?? 0`.
      Verify gate green at 249 / 249. See
      `plan/phases/phase_14_ui_fixes.md`.
- [x] Phase 15 — Persistence migration: backfill missing engine
      state fields on save load. Promoted from
      `plan/PHASE_CANDIDATES.md` via `/oversight` on 2026-05-14
      (score 6.0). Add a `schemaVersion N → N+1` step that
      populates `derivedStats` / `nonCombatStats` from
      `attributes` / `archetype` (engine helpers if available,
      zero-fills otherwise). Drop the `(player as any)` casts
      and `?? 0` fallbacks introduced in Phase 14. See commit
      `c8e29a8`.
- [skipped] Phase 16 — Drain `combat.skills.fixture.ts` mock: wire
      engine skill selectors into the combat presenter. Promoted
      from `plan/PHASE_CANDIDATES.md` via `/oversight` on
      2026-05-15 (score 5.5). Brief at
      `plan/phases/phase_16_engine_skills.md`. **Skipped
      2026-05-15 — same pattern as Phase 6:** the work is fully
      designed, but it's blocked on an upstream package release.
      `axiomancer-mechanics@0.6.0` does not re-export
      `skillLibrary` / `getSkillById` from its top-level index,
      and its published dist is missing several `types.d.ts`
      files that would let us deep-import. Engine release must
      add either the top-level re-export OR a complete `./Skills`
      subpath export (see the brief's "BLOCKED" header for the
      recipe). The `[skipped]` marker stops `/march` from
      re-attempting `/ship-a-phase` every tick; flip back to
      `[ ]` (or let `/oversight` flip it) once a new engine
      release lands with the exports.
- [x] Phase 17 — Token Crucible: five-resource pool UI (port
      from design handoff). Shipped in commit `261a238`
      ("feat: Token Crucible — port five-resource pool UI from
      design handoff") on 2026-05-15. Added `app/crucible.tsx`,
      `components/TokenCrucible.tsx`, `components/tokens.tsx`,
      `state/mocks/tokens.fixture.ts`; touched
      `app/(tabs)/character/index.tsx`, `app/_layout.tsx`,
      `state/e2e/route-tree.engine.test.ts`. **Backfilled
      retroactively** via `/oversight` 2026-05-15 — the row
      exists for traceability; the feature shipped directly
      by the user from a design handoff outside the autonomous
      loop. Retroactive brief at
      `plan/phases/phase_17_token_crucible.md` — drafted via
      Phase 28 (commit `ab3912a`).
- [x] Phase 19 — `selectHasActiveEvent` real wiring. **Drained
      by Phase 6 Tick A** (`2c4d2b0`) — the rewrite of
      `state/presenters/event.engine.ts` flipped
      `selectHasActiveEvent` from `false` to a read against
      `state.event.pending` (plus a combat short-circuit per
      Spec 08 Q4). No standalone commit needed; the brief
      called this absorption out upfront.
- [x] Phase 23 — Migrate event subsystem from `processNode` /
      `ProcessNodeResult` to `resolveMapEvent` / `ResolvedEvent`.
      Shipped across four sub-ticks on 2026-05-15: Tick A type
      migration + fixtures (`f7d4212`), Tick B action layer
      rename `processCurrentNode` → `resolveCurrentMapEvent`
      (`3eb49c2`), Tick C screen render coverage for the five
      new kinds (`ec7b52c`), Tick D close-out (this commit).
      Restored verify from RED → 337 / 337. Brief at
      `plan/phases/phase_23_mapevents_migration.md`. Spec 08
      product answers (A / C / B / Future spec / Yes) carried
      through unchanged; VM shape stable; screen layer
      untouched. 8 engine kinds composed (encounter,
      interaction, gathering, rest, village, cutscene, hazard,
      loot-cache); new procedural illustrations for village /
      cutscene / hazard.
- [x] Phase 26 — Drain stale presenter stubs (audit gaps B, L,
      partially M). Shipped 2026-05-15 in this commit. Three
      drains in one tick: (1) `navigation.engine.ts` —
      `selectTabBadges` reads `selectHasActiveEvent` for the
      event badge and `player.experience` vs
      `experienceToNextLevel` for the level-up badge; both
      park on the character tab; `EMPTY_BADGES` reference
      stability preserved on the steady-state path; (2)
      `combat.engine.ts` — `STANCE_DERIVED` constant deleted;
      `buildStanceOptions` now reads `player.derivedStats`
      via the engine's three stat triples
      (`emotional*` / `physical*` / `mental*`), rounded at
      the mapper boundary; (3) `state/actions.ts` — file
      header rewritten (drops `0.3.0` reference and
      "engine Spec ~04" hedge); `skillLookup` comment names
      Phase 16 explicitly. +5 hermetic tests. Brief at
      `plan/phases/phase_26_drain_presenter_stubs.md`.
- [x] Phase 25 — Typed event surface consumer (engine 12 / 21
      catch-up). Shipped across two sub-ticks on 2026-05-15:
      Tick A emitter wiring + ring-buffer presenter
      (`3d2f497`), Tick B `useGameEvents` hook + close-out
      (this commit). Brief at
      `plan/phases/phase_25_typed_events.md`. Engine
      `createEventEmitter()` now flows through the mobile
      store; 10 typed events land in a mobile-private
      `_recentEvents` tail (capacity 20, newest-first).
      Consumers narrow via the engine's `is*Event` guards.
      The brief's original "drop bespoke severity inference"
      goal was revised at plan time — engine `combat:round`
      payload is `{state}` only, no per-event detail — so
      `summarizeRoundEvents` stays. Phase 25 wires the
      channel; specific consumers (level-up badge auto-clear,
      inventory feedback, dialogue cursor confirmation) ship
      as iterate rows.
- [x] Phase 27 — Exploration `moveToAction` migration to engine
      `revealAdjacent` / `markNodeConsumed`. Shipped 2026-05-16
      in this commit. Additive migration per the brief:
      `moveToAction` adds `revealAdjacent` after the legacy
      `worldUnlockNode` chain, populating the engine's parallel
      `discoveredNodes` field; `resolveCurrentMapEvent` adds
      `markNodeConsumed` after a non-`none` event resolves.
      `state/exploration-maps/types.ts` JSDoc names the new
      boundary ("visual-layout-only post-Phase-27"). +4
      hermetic e2e cases pin the new behaviour and no-regression
      on legacy fields. Screen + presenter migration deferred
      to a future Phase 30 TBD. Brief at
      `plan/phases/phase_27_exploration_migration.md`.
- [x] Phase 28 — Token Crucible retroactive brief + hermetic
      test coverage. Shipped 2026-05-16 in this commit. Three
      deliverables landed: (1) `plan/phases/phase_17_token_crucible.md`
      retroactive brief authored from commit `261a238` + the
      Claude Design URL; (2) `state/presenters/token-crucible.engine.ts`
      extracted with `selectTokenCrucibleViewModel`;
      `components/TokenCrucible.tsx` refactored to consume the
      VM; (3) `state/e2e/token-crucible.engine.test.ts` adds
      10 hermetic cases (VM shape, skill partition,
      `canAfford` matrix, deep-freeze invariant). Closes the
      bearings hard-rule violation that Phase 17 backfilled
      without tests-alongside-code. Brief at
      `plan/phases/phase_28_crucible_tests.md`.
- [x] Phase 29 — Typed-event consumers (level-up badge
      auto-clear, inventory feedback, dialogue confirmation).
      Promoted via `/oversight` 2026-05-15 (score 6.5). Shipped
      across 3 sub-ticks: Tick A `52a1803` (levelUp acknowledge
      flag + selectTabBadges predicate); Tick B `2845d34`
      (inventory action toast via `<ToastHost>` + pure mapper);
      Tick C `861ff7f` (event-modal ✓ flash on `dialogue:applied`).
      `useGameEvents` (Phase 25) carried the load — no new
      infrastructure. Verify: 371 → 382 tests across the phase.
      Brief at `plan/phases/phase_29_typed_event_consumers.md`.
- [x] Phase 30 — Hermetic render coverage + production bug fix
      pass. Promoted via `/oversight` 2026-05-16 in response to
      three user-observed runtime bugs the VM-shape suite did
      not catch. Shipped across 3 sub-ticks: Tick A (`5e24706`)
      shipped `state/e2e/smoke-render.engine.test.tsx` (15
      cases: no-throw / no-template-leak / non-empty body across
      five surfaces) and fixed the **character-tab crash** —
      `useGameState(selectCharacterViewModel)` was churning
      `useSyncExternalStore` because the presenter returned a
      frozen-new object every call (same pattern previously
      fixed in event screen); refactored to slim-slice + memo'd
      VM. Tick B (`ab9f646`) extracted `TAB_TITLES` to
      `state/presenters/tabs.engine.ts` and wired both `title:`
      and the defensive `tabBarLabel:` escape hatch on each
      `<Tabs.Screen>`. Tick C (`fb53af0`) added
      `vm.loadingMessage = 'the field stirs.'` and replaced the
      empty-View placeholder with visible copy. Absorbs and
      supersedes the original Phase 31 candidate (presenter-copy
      invariant guard) — the render harness catches that class
      as a strict superset. Verify: 391 → 410 across the phase.
      Brief at `plan/phases/phase_30_hermetic_render_coverage.md`.
- [x] Phase 31 — Tabs design pass (all-places register).
      Promoted via `/oversight` 2026-05-16 with explicit register
      pick from the user. Shipped in commit `542f7c9` — one-line
      presenter edit of `TAB_TITLES` thanks to Phase 30 Tick B's
      extraction. Strings flipped:
      `MAP · COMBAT · SHEET · SACK` →
      `WILDS · STRIFE · SELF · SACK`. Icons stay as-is (the new
      noun-icon pairing is coherent). Drains the long-deferred
      `[needs-user-call]` critique row from pass 2 (commit
      `d967f27`). Verify: 410/410 unchanged. Brief at
      `plan/phases/phase_31_tabs_design_pass.md`.
- [ ] Phase 32 — UI refresh from Claude Design handoff (rolling
      port). Filed via `/plan-a-phase` 2026-05-16 with topic
      "Update the UI with the new designs from Claude design."
      Multi-tick **rolling phase** mirroring the Phase 17 →
      Phase 28 pattern: each new design surface lands as a
      user-driven `feat: <surface> — port from design handoff`
      commit; the next `/march` tick extracts the presenter,
      adds hermetic tests, and integrates the screen with the
      smoke-render harness (Phase 30 Tick A). One sub-tick per
      ported surface; phase closes when the user has finished
      porting and the loop has tested every sub-tick. Design
      source: Claude Design at
      <https://claude.ai/design/p/019e0f5a-a0f0-753b-be1e-8939e6011384>
      (authenticated; loop cannot fetch — user drives the port,
      loop drives the tests + cleanup). **Dispatch rule (set via
      `/oversight` 2026-05-16): detect-and-defer.** `/march`
      reads recent commits for `feat: <surface> — port from
      design handoff` since the last `spec32 tick` commit; if
      none, it skips Phase 32 and falls through to its normal
      cascade. The loop never invents a port. See brief
      §"Dispatch rule (for `/march`)" for the full rule. Brief
      at `plan/phases/phase_32_design_refresh.md`.
- [x] Phase 33 — MEMOIR tab (journal: story / quests / alignment
      / philosopher-quote slot). Filed via `/plan-a-phase`
      2026-05-16. Adds a new fifth route at
      `app/(tabs)/memoir/index.tsx` — a journal surface
      summarizing story progress (recent typed-event chronicle),
      active + completed quests (`state.quests` QuestLog),
      moral + provisional philosophical alignment readouts
      (`state.moralMeter` + a placeholder mapping derived from
      highest base stat), and a slot for philosopher quotes
      (rendered null until exact alignments are defined). 4
      sub-ticks: route + tab registration + empty state (A);
      quests section (B); alignment readouts (C); story
      chronicle from `_recentEvents` (D). The philosopher-quote
      lookup is a follow-up phase, gated on the user defining
      alignments. **This is the deliberate navigation-phase
      commit** that adds a new route per bearings line 97-101
      ("route names do not [change] without a deliberate
      navigation-phase commit"). The bottom tab bar grows from 4
      visible tabs to 5 (WILDS/STRIFE pair + SELF + MEMOIR +
      SATCHEL; WILDS and STRIFE remain mutually exclusive). Brief
      at `plan/phases/phase_33_memoir_tab.md`. Shipped across
      four sub-ticks: A `6515cb5` (route + skeleton VM), B
      `2f70eac` (quests section), C `6105b90` (moral band +
      provisional philosophical alignment), D `9ccdee2`
      (chronicle from `_recentEvents`). Paused between B and C
      via `/oversight` 2026-05-16; resumed via `/oversight`
      after the event-surface critique cluster's HIGH row
      cleared (`994fb02`). Verify green at 459/459. The
      philosopher-quote slot stays `null` until exact alignments
      + a quote inventory are defined (follow-up phase).
> bug findings, presenter refactors, asset backlog, ongoing
> audits. `/march` makes that transition automatic. (Block II
> phases 20/21 and Block III phases 22/24 in
> `plan/PHASE_CANDIDATES.md` are gated on engine releases or
> stay below promotion threshold; `/expand` re-evaluates.)

> **Note on the deploy gate before phase 11 ships:** auto-deploy
> is **not** a thing for this project. `npm run deploy:check` is
> a stub that exits 0 with a notice. The shipping skills still
> call it as Step 12 so the contract stays uniform.

---

## Per-phase scope

Each row above corresponds to one phase. The detailed brief
lives at `plan/phases/phase_<N>_<topic>.md`. If a brief is
missing when the loop reaches its phase, the loop generates one
from the scope below + the matching `specs/NN-*.md` document.

### Phase 1 — Adopt nexus methodology

Land the nexus overlay (`agents.md`, `plan/`, `skills/`,
`.claude/`, `scripts/deploy-check.mjs`, `.env.example`) without
touching `app/`, `components/`, `state/`, or any other product
code. Detailed brief: `plan/phases/phase_1_bootstrap.md`.

### Phase 2 — Fix engine API drift (verify-gate unblocker)

Inserted at adoption time because `npm run verify` is RED on
the current `main`. The most recent commit (`845a4a7`,
"Install latest mechanics package") bumped
`axiomancer-mechanics` past a breaking API change without
migrating callers:

- `Consumable.effect` → `Consumable.effectId`
- `Equipment` now requires `rarity` and `requiredLevel`

Files to migrate:

- `state/actions.ts:550` — rename `.effect` to `.effectId`
  (or the equivalent lookup, depending on how the consumable
  resolves).
- `state/e2e/inventory.engine.test.ts` — fixtures at lines 42,
  48, 58: rename + add the two missing required fields.
- `state/e2e/inventory.modal.engine.test.ts` — fixtures at
  lines 42, 46, 84.
- `state/e2e/inventory.screen.test.tsx` — fixtures at lines 66,
  70.

For `rarity` / `requiredLevel` defaults, check the engine's
`Equipment` type definition in
`node_modules/axiomancer-mechanics` for the enum / numeric
range; pick conservative defaults (`rarity: "common"`,
`requiredLevel: 1`) and note the call in the commit body.

`pnpm test` should be green twice + `npx tsc --noEmit` clean
before flipping the row. Move the `[HIGH]` AUDIT entry to
"Done".

### Phase 3 — Spec 02: Engine store integration

Pull `createGameStore` from `axiomancer-mechanics`. Wrap it in
a `zustand` store at `state/store.ts`. Provide a
`GameStoreProvider` and per-screen selectors. Migrate one
screen as a proof (combat already works against the new
contract — use it as the sibling). Detailed brief generated by
`/plan-a-phase` from `specs/02-engine-store-integration.md`.

### Phase 4 — Spec 03: Presenter layer

Lock the `select<Screen>ViewModel(state, t) → ViewModel`
contract. Document in `docs/presenters.md`. Land hermetic e2e
infra under `state/e2e/`. Detailed brief generated from
`specs/03-presenter-layer.md`.

### Phase 5 — Spec 05: Character screen wiring

Apply the canonical-sibling pattern from Spec 04:
`character.engine.ts` (pure), `character.tsx` (view shell),
hermetic e2e at `state/e2e/character.engine.test.ts`,
`character.copy.ts` for strings. Brief from
`specs/05-character-screen-wiring.md`.

### Phase 6 — Spec 08: Event screen wiring

Same shape. **Engine dependency satisfied as of
`axiomancer-mechanics@0.6.0`** — `createGameStore` exposes
`moveToNode` / `processNode` / `applyDialogue` on
`GameActions`, and `ProcessNodeResult` / `ProcessedEvent` /
`DialogueTree` / `MapEvent` types are public. The remaining
blocker is the **five open product questions in
`specs/08-event-screen-wiring.md`** (VM kind split,
machine-readable vs descriptive consequences, slug→asset map
location, mid-combat events, skip-button behaviour). While those
remain unanswered the `[skipped]` row stays; the
`[needs-user-call]` AUDIT entry tracks resolution. Brief from
`specs/08-event-screen-wiring.md`.

### Phase 7 — Spec 09: AsyncStorage persistence

Add an `AsyncStorage` adapter that satisfies the engine's
storage interface. Wire `GameStoreProvider` to rehydrate on
mount + persist on every transition. Hermetic e2e against a
memory adapter; integration against a stub `AsyncStorage`.
Brief from `specs/09-asyncstorage-persistence.md`.

### Phase 8 — Spec 10: Navigation + app shell polish

Deep links (Expo Router config), back-behaviour audit, tab
badges (e.g., new event indicator), splash → first screen
handoff sans flicker. Brief from
`specs/10-navigation-and-app-shell.md`.

### Phase 9 — Spec 11: Asset pipeline

Drain the SVG placeholder backlog one asset at a time per
`.cursor/skills/swap-asset-placeholder/SKILL.md`. Each tick
ships one real asset + its size variants + its swap commit.
This is the natural transition point to `/iterate` once the
other screen phases are done. Brief from
`specs/11-asset-pipeline.md`.

### Phase 10 — Spec 12: Accessibility + theming polish

`accessibilityLabel` audits, `accessibilityRole`, reduce-motion
respect, font-scaling sanity, large-text support, dark-only
confirmation. Brief from
`specs/12-accessibility-and-theming.md`.

### Phase 11 — EAS Build deploy gate wiring

Replace the `scripts/deploy-check.mjs` stub with a real EAS
Build API poll. Add a `setup/02_eas.md` runbook covering the
EXPO_TOKEN scopes, the `EAS_PROJECT_ID` lookup, the polling
budget, and the failure-mode contract. Verify with one
deliberately broken deploy + one good deploy.

### Phase 12 — App icon + splash screen polish

Final adaptive icons (foreground / background per Android
spec), iOS app icon, splash background = `AXM.bg`, splash
logotype in Pirata One. Asset swap follows the standard
contract.

### Phase 13 — TestFlight + Play Internal Track first cut

Production EAS builds, store listing drafts, screenshots from
the simulators, internal testers invited. The end of the
substrate; `/iterate` takes over after.

### Phase 14 — UI fixes: Character crash + Event tab → modal

Two-issue cleanup that landed informally in commit `5dd597b`
("Bug issues") before being promoted. (1) Move the Event screen
out of the `(tabs)/` group and present it as a full-screen modal
gated by `selectHasActiveEvent` — the EVENT tab no longer
belongs alongside MAP/COMBAT/SHEET/SACK. (2) Add null-safe
fallbacks in `selectCharacterViewModel`'s `buildDerived` /
`buildSaves` helpers so a save without `derivedStats` /
`nonCombatStats` renders zeros instead of throwing. Brief at
`plan/phases/phase_14_ui_fixes.md`; row stays open for the next
`/march` tick to validate the listed acceptance criteria.

### Phase 15 — Persistence migration: backfill engine state fields

Replace the Phase 14 null-guard with a durable fix: extend the
existing `schemaVersion` migration runner (shipped in Phase 7)
with a step that populates `derivedStats` and `nonCombatStats`
on load. Prefer engine helpers if exposed; zero-fill otherwise.
Drop the `(player as any)` casts + `?? 0` fallbacks once the
migration is guaranteed to run. Brief to be drafted by
`/plan-a-phase` from `specs/09-asyncstorage-persistence.md` (no
dedicated spec — this is an additive migration on the existing
adapter).

---

## Carry-overs / known gaps (update as phases ship)

- **No `setup/` runbooks yet.** Phase 10 (EAS) and a
  follow-up GitHub runbook are queued; until then,
  `agents.md` "Operational secrets" is the canonical config
  doc.

## Phase log (commit hashes)

- phase 1 — a703908 — adopt nexus methodology overlay (substrate;
  no product code changes)
- phase 2 — 527f021 — engine API drift fix (effect → effectId on
  Consumable; rarity + requiredLevel on Equipment fixtures;
  verify gate green at 185 / 185)
- phase 3 — efef5f5 — engine store integration (Spec 02;
  GameStoreProvider, useGameState, useGameActions, typed action
  wrappers, hermetic e2e harness)
- phase 4 — e378f99 — presenter layer contract (Spec 03;
  docs/presenters.md, 5 *.engine.ts stubs, route-tree guard,
  freeze.ts helper, deep-freeze invariant; preceded by scaffolds
  in e56184e)
- phase 5 — 4afb4ed — character screen wiring (Spec 05;
  selectCharacterViewModel, character/ route folder, hermetic
  e2e, read-only stat surface)
- phase 6 — 2c4d2b0 / 31e42f0 / beba7d4 / <this commit> —
  event screen wiring (Spec 08; four sub-ticks: presenter +
  store slice, action layer, screen refactor, close-out);
  selectEventViewModel composes from ProcessNodeResult +
  DialogueTree cursor; two VM kinds (combat-prelude,
  narrative-choice); eventActions {processCurrentNode,
  pickEventChoice, dismissEvent}; illustrations under
  components/event/ (out of router tree); +20 hermetic tests
  verify green at 321/321. Phase 19 closed as drained by
  Phase 6 Tick A — selectHasActiveEvent reads engine truth.
- phase 7 — aa187cd / 09bc44e / 2f8ecea — AsyncStorage
  persistence adapter (Spec 09; createAsyncStorageAdapter,
  migrations runner, preload-before-mount, 15 hermetic e2e,
  +200/200 verify green; first phase the loop built from
  scratch)
- phase 8 — 6fc00dd — navigation + app shell polish (Spec 10;
  smart cold-start routing, deep links for character/events,
  tab badges, hardware back disabled during combat, hermetic
  navigation presenter tests; +209/209 verify green)
- phase 14 — 5dd597b — UI fixes: Character crash + Event tab →
  modal (event screen moved out of (tabs)/ behind a
  fullScreenModal Stack.Screen + new `EventGate` driver;
  `selectCharacterViewModel` null-guards `derivedStats` /
  `nonCombatStats` with `?? {}` / `?? 0`; brief verified by
  /march on 2026-05-14; verify green at 249/249)
- phase 15 — c8e29a8 — persistence migration v1→v2 backfill
  engine state fields (schema version bumped to 2 with migration
  step that populates missing derivedStats/nonCombatStats using
  engine helpers; character presenter null-guards removed;
  verify green at 260/260)
- phase 23 — f7d4212 / 3eb49c2 / ec7b52c / 93f4091 —
  event subsystem migration to engine 0.7.0 (ResolveMapEventResult
  / ResolvedEvent / 8 typed MapEvent kinds; engine 0.6 →
  0.7 drift recovery; four sub-ticks: type migration +
  fixtures, action rename processCurrentNode →
  resolveCurrentMapEvent, screen render coverage for new
  kinds, close-out; +new procedural illustrations for
  village / cutscene / hazard; restored verify from RED →
  337/337; engine pin tightened to exact 0.7.0 in the
  preceding oversight commit c698073 to stop further
  auto-bump drift)
- phase 26 — d8d2e33 — drain stale presenter stubs
  (one tick: navigation.engine selectTabBadges reads
  selectHasActiveEvent + player.experience vs
  experienceToNextLevel; combat.engine STANCE_DERIVED
  deleted and stance picker reads player.derivedStats via
  the engine's emotional/physical/mental stat triples;
  state/actions.ts file-header + line-420 skillLookup
  comment swept to current 0.7.0 surface and Phase 16
  reference; +5 hermetic tests; 342/342)
- phase 25 — 3d2f497 / 8baf594 — typed event surface
  consumer (two ticks: A wires GameEventEmitter through
  createAppStore + new mobile-private _recentEvents ring
  buffer + selectRecentEngineEvents presenter; B adds
  useGameEvents React hook + close-out). Engine 10 typed
  events now flow to mobile; consumers narrow via is*Event
  guards from axiomancer-mechanics. +15 hermetic tests
  (11 emitter contract + 4 hook subscription); 357/357.
  Bespoke severity inference in summarizeRoundEvents
  remained intact — engine combat:round payload is
  {state} only; the brief revised the original "drop
  inference" goal at plan time.
- phase 27 — 25ed90c — exploration moveToAction
  migration (engine revealAdjacent / markNodeConsumed,
  additive). moveToAction now populates the engine's parallel
  discoveredNodes field after a successful move via
  revealAdjacent (engine derives neighbours from
  getMapDefinition). resolveCurrentMapEvent populates the
  consumedNodes field after a non-'none' event resolves.
  Legacy availableNodes / completedNodes writes stay for the
  screen — screen + presenter migration to the new fields
  deferred to a future Phase 30 TBD.
  state/exploration-maps/types.ts JSDoc names the new
  boundary explicitly (visual-layout-only post-Phase-27).
  +4 hermetic e2e cases; 361/361.
- phase 28 — <this commit> — Token Crucible retroactive brief
  + hermetic test coverage. Three deliverables in one tick:
  (1) plan/phases/phase_17_token_crucible.md authored from
  commit 261a238 + the Claude Design URL; (2)
  state/presenters/token-crucible.engine.ts extracted with
  selectTokenCrucibleViewModel; components/TokenCrucible.tsx
  refactored to consume the VM; (3)
  state/e2e/token-crucible.engine.test.ts adds 10 hermetic
  cases (VM shape, skill partition, canAfford matrix,
  deep-freeze invariant). Closes the bearings hard-rule
  violation that Phase 17 backfilled without tests-alongside-
  code. +10 tests; 371/371.
