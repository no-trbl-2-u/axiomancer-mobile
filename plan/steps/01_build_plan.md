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
- [x] Phase 16 — Drain `combat.skills.fixture.ts` mock: wire
      engine skill selectors into the combat presenter. Shipped
      `eb95806` — `feat(spec16): wire engine skill selectors —
      drain combat.skills.fixture.ts mock`. New
      `state/selectors/combat-skills.ts` adapter exports
      `COMBAT_SKILLS` (engine library projected to mobile shape)
      + `getCombatSkillById`. Consumers (`combat.engine.ts`,
      `actions.ts`, two e2e fixtures, debug-seed test) all
      swapped imports. `state/mocks/combat.skills.fixture.ts`
      deleted. +10 hermetic tests; 875/875 green (was 865).
      Brief at `plan/phases/phase_16_engine_skills.md`.
- [x] Phase 21 — Engine-driven `executeSkill` wiring. Shipped
      `7a69658` — `feat(spec21): engine-driven executeSkill
      wiring`. Two changes in `state/actions.ts:resolveRound`:
      `skillLookup` swapped from `() => null` stub to the engine's
      `getSkillById`; `playerCombatAction` now passes
      `{ action: 'skill', skillId }` (was downgraded to
      `'attack'`). +2 hermetic cases pin the contract (mana
      drains by manaCost via the engine library; unknown skillIds
      tolerated). 877/877 green (was 875). Engine per-resource
      pools deferred (Tick C in the original brief; mobile single-
      mana model still satisfies the picker's insufficient-mana
      gating).
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
- [x] Phase 32 — UI refresh from Claude Design handoff (rolling
      port). Filed via `/plan-a-phase` 2026-05-16. Eight sub-ticks
      shipped A–H covering the highest-density slice of the
      design bundle (vendored at `design/handoff-2026-05-16/`):
      A `08bcf5e` event combat-prelude chrome, B `8c5f985`
      exploration step-cards, C `843f304` combat phase-stack,
      D `bf13539` encounter modal seam, E `2a23047` inventory
      Equipment Dock, F `cc38107` inventory slot filter, G
      `05127df` per-slot ItemGlyphs, H `d7489a2` exploration
      node toast. Closed via `/oversight` 2026-05-19 — further
      design-bundle work has been factored into discrete phases
      34–43 (one per remaining `design-spec.md` row) so /march
      can dispatch /ship-a-phase against each one without
      waiting for user port commits. Brief at
      `plan/phases/phase_32_design_refresh.md`.
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

**Design-spec drain queue (filed via `/oversight` 2026-05-19).**
Phases 34–43 are the ten un-ported surfaces enumerated in
`design-spec.md`, factored out of Phase 32's rolling-port
contract so `/march` can dispatch `/ship-a-phase` against each
one autonomously (no user-port-commit gate). Each phase brief
lives inline below; detailed scope + design-source pointers
remain in `design-spec.md`. Phase 44 is the loop-caught
regression check for the routing/gesture bug surfaced
2026-05-19 (commit `3a14f5f`).

- [x] Phase 34 — Routing + gesture regression check. Shipped via
      `state/e2e/route-registration.engine.test.ts` (new file, +5
      hermetic cases). Source-grep approach rather than
      router-mount: reads `app/_layout.tsx` + `app/(tabs)/_layout.tsx`
      as text, asserts (a) `GestureHandlerRootView` is imported
      from `react-native-gesture-handler` AND used as the
      outermost JSX wrapper in the returned tree; (b) every
      `<Tabs.Screen name="X">` value matches a real expo-router
      route ID computed from the actual file shape (`foo.tsx`
      → `foo`; `foo/index.tsx` → `foo/index`); (c) no
      `<Tabs.Screen name="X">` uses the short form when a
      folder route at `X/index.tsx` exists. Catches both
      classes that bit on 2026-05-19 (`3a14f5f`). Verify
      502/502 (was 497; +5).
- [x] Phase 35 — Inventory equip-preview stat deltas. Shipped:
      added `ReplacePreview` interface + `replacePreview: ReplacePreview
      | null` on `InventoryItemRow`. Presenter `buildRows` now
      runs a second pass that computes signed net deltas from
      `Equipment.statModifiers` (skips multipliers for v1) when
      a non-equipped equipment item has an equipped sibling in
      the same slot. Screen renders a blood-rail replace block
      on expanded ItemCards: REPLACES eyebrow, strike-through
      old name → arrow → new name, NET row of stat-delta chips
      (sulfur positive / blood negative). +6 hermetic cases
      pinning the contract (null on non-equipment / self-row /
      empty-slot; signed deltas; zero-drop; multiplier-skip).
      Verify 508/508 (was 502; +6).
- [x] Phase 36 — Inventory equip-replace label. Shipped: extended
      `ItemModalViewModel` with `replacingName: string | null`
      (structured data so the screen doesn't parse the label).
      New `findEquippedInSlot` helper returns the equipped
      sibling. `buildEquipmentModal` now ships
      `confirmLabel = 'EQUIP · REPLACE <NAME>'` when replacing,
      `'EQUIP'` when bare-slot, `'WORN'` when target is itself
      worn. Existing test reshaped to assert the new label;
      +1 new test for the bare-slot+WORN path. Verify 509/509.
- [x] Phase 37 — Inventory item slot tag. Shipped: small mono
      eyebrow `SLOT · <NAME>` on every collapsed equipment
      ItemCard (uses the existing `row.sub` field uppercased).
      Hidden when expanded (the expanded "WOULD EQUIP TO" /
      "EQUIPPED IN" block covers the same affordance more
      visibly) and on non-equipment rows. Ports `design/
      handoff-2026-05-16/project/screens/inventory.jsx:382-388`.
      Verify 509/509 unchanged (presenter contract untouched —
      slot tag reads existing `vm.row.sub`).
- [x] Phase 38 — Combat phase-stack collapse. Largely shipped
      via Phase 32 tick C — the `PhaseStackEntry.state`
      (`'past' | 'current' | 'future'`) + `summary: string`
      contract already drove the design's vertical-collapse
      behavior; the screen (`app/(tabs)/combat.tsx`) branches
      on `entry.state === 'current'` to render the body and
      keeps past rows as one-line header + summary. Discovery
      while closing this phase: the JSDoc claim that "action
      and skill are not buffered across phase changes" was
      stale — the engine preserves `playerChoice.action`
      across phase changes too, so past-action rows DO surface
      their committed value when the screen passes through
      `choosing_skill` / `resolving`. Close-out: +2 hermetic
      cases pinning past-action summary + future-row empty
      summary; JSDoc refreshed to match reality. Verify
      511/511 (was 509; +2). The skill-row summary still
      stays empty pending a library-label helper (follow-up
      to Phase 21 when engine skills land properly).
- [x] Phase 39 — Diegetic-stack backdrop opacity. Shipped: tuned
      `EncounterModalOverlay`'s backdrop fill from
      `rgba(10,10,10,0.85)` to `rgba(10,10,10,0.65)` so the
      exploration map shows through at ~35% visibility per
      chat 2 §IV ("map persists at 35% opacity behind every
      modal"). Mirrors the design's prototype.jsx:454 combat
      shell backdrop (0.6); ours is marginally darker so the
      panel border reads sharp on lighter map regions.
      Inline JSDoc cites the design source. Paced events
      were considered but currently render full-screen
      (`presentation: 'fullScreenModal'`); the diegetic-stack
      rework for paced is bigger and lives with Phase 40
      (event-shell audit). Verify 511/511 unchanged.
- [x] Phase 40 — Event-shell distinction audit. Audited not
      0-LOC after all: found a real shell-double-mount
      regression. `EventGate.tsx` was routing `router.push('/event')`
      on every active event regardless of kind, while the
      exploration screen separately mounted
      `<EncounterModalOverlay>` for `combat-prelude` events.
      The two shells would mount simultaneously when a
      combat-prelude fired. Fix: new presenter selector
      `selectHasActivePacedEvent` (false for combat-prelude;
      true only for narrative-choice). EventGate now reads
      the paced-only selector, leaving combat-prelude events
      entirely in the diegetic-stack path. +3 hermetic
      tests pinning the new selector contract. Verify
      514/514 (was 511; +3).
- [x] Phase 41 — Combat aftermath banner. Shipped: new
      `components/AftermathBanner.tsx` (parchment-on-panelBg
      panel, sulfur 1px border, 2500ms auto-dismiss timer
      matching the design's prototype). One-shot
      `lastOutcome` signal added to `state/combat-mode.tsx`
      (`'victory' | 'defeat' | 'flee' | 'parley'`) with
      `exitCombatWith(outcome)` + `clearLastOutcome()`
      API. Combat screen's `onContinueRound` branches on
      enemy.hp / player.hp / friendshipCounter to signal the
      correct outcome on the way out; early DEPART path
      stays silent (uses plain `exitCombat`). Exploration
      screen mounts the banner only for `'victory'` and
      `'parley'` outcomes (the IT IS DONE eyebrow fits
      both — copy varies: "The foe fell." vs "The foe
      yielded."). +6 hermetic combat-mode tests pinning the
      signal + auto-clear semantics. Verify 520/520 (was 514;
      +6).
- [x] Phase 42 — Combat-tab mutex extension. Shipped: new
      `selectHasActiveCombatPrelude` selector (true when
      there's a pending event AND vm.kind === 'combat-prelude').
      `(tabs)/_layout.tsx` now reads `inCombat ||
      hasCombatPrelude` and passes the OR'd value to
      `isTabHidden`, so the WILDS slot flips to STRIFE as
      soon as the encounter modal mounts — before the player
      commits FIGHT. Mirrors prototype.jsx:42
      `combatTabShown = route === 'strife' || modal?.kind
      === 'event-combat'`. +4 hermetic cases (paced/prelude
      mutual exclusion, mid-combat short-circuit). Verify
      524/524 (was 520; +4).
- [x] Phase 43 — Encounter modal boss kneel/strike variant.
      Shipped: `composeCombatPrelude` now relabels the two
      choice buttons when `isBoss` is true — FIGHT → STRIKE,
      FLEE → KNEEL. Choice IDs stay `'fight'` / `'flee'` so
      the screen's onFight/onFlee handlers still dispatch
      correctly. KNEEL stays engine-disabled (matches the
      current boss-blocks-flee semantics; no "submit to
      boss" mechanic exists yet). +2 hermetic cases pinning
      the label swap on boss vs the FIGHT/FLEE retention on
      non-boss. Verify 526/526 (was 524; +2). No engine
      surface gate needed — `isBoss` was already on
      `ResolveMapEventResult`.

**Second design-spec drain queue (filed via `/oversight`
2026-05-19, 5th call).** Three prototype micro-interactions
(`design-spec.md` items 11-13) plus three spot-check audit
phases for subtle deviations surfaced when the user asked
"any deviations from the claude design prototype?". The audit
phases ship 0-LOC fix-or-confirm reports unless something is
actually wrong, then a single follow-up port to the same
phase row.

- [x] Phase 44 — Modal enter animations. Shipped: rise (280ms
      ease-out, translateY 20→0 + opacity 0→1) on
      `EncounterModalOverlay` (separate animation on
      backdrop opacity vs panel transform) and
      `AftermathBanner`; fade (200ms ease-out, opacity 0→1)
      on the exploration `<NodeToast>` (extracted into its
      own component for clean mount-time animation). All
      three use `react-native-reanimated` `withTiming` +
      `useSharedValue` + `useAnimatedStyle`. Mirrors
      `prototype.jsx:632-638` keyframes. Verify 530/530
      unchanged.
- [x] Phase 45 — Event-modal action-button subtitles. Shipped:
      new `subtitle: string | null` field on `EventChoice`
      (distinct from existing `description` / `consequences`
      — pure chrome). Combat-prelude composer populates it:
      FIGHT = `'<roman level> · <roman hp> vitae · adv.
      unknown'` (lowercase-roman cost), FLEE = `'forfeit
      the path · -ii morale'` (non-boss) /
      `'sealed · no retreat'` (boss). All other VM kinds ship
      `subtitle: null`. Local `toRomanLowerEvent` helper
      (duplicates combat.engine.ts's private helper to avoid
      cross-presenter dependency). EncounterModalOverlay
      renders the subtitle under each label when non-null;
      existing fleeDisabledHint render guarded with
      `&& fleeSubtitle === null` so disabled-FLEE boss path
      doesn't double up. +3 hermetic cases (non-boss subtitle
      shape, boss flee subtitle, non-combat-prelude null
      check). Verify 533/533 (was 530; +3).
- [x] Phase 46 — Paced-event kind-meta variants. Shipped:
      refreshed eyebrow + title copy on all 5 paced-event
      composers to match the design's `kindToMeta` table
      (prototype.jsx:497-503). Specifically:
      `composeRest` 'A QUIET PLACE'/'THE FIRE LOWERS' →
      'A FIRE LOWERS'/'THE STONE HEARTH'.
      `composeItemBag(gathering)` 'A GATHERING'/'THE BRUSH
      YIELDS' → 'A SMALL HARVEST'/'A STAND OF MIRE-MINT'.
      `composeItemBag(loot-cache)` 'A FIND'/'THE CACHE OPENS'
      → 'A FOUND THING'/'A BURIED CHEST'.
      `composeInteraction` 'A VOICE' → 'INTERACTION' (title
      stays the engine NPC name).
      `composeVillage` 'A VILLAGE' → 'A SETTLEMENT'.
      Engine kind vocabulary checked — `gathering`,
      `loot-cache`, `interaction`, `village`, `rest` all
      present; no [needs-engine-release] gate. +1 hermetic
      case pinning the rest variant's new eyebrow + title.
      Verify 534/534 (was 533; +1).
- [x] Phase 47 — Stance-picker gloss copy audit. Audited not
      0-LOC: gloss copy wasn't present at all (StanceOption
      had no `gloss` field). Shipped: added `gloss: string`
      to `StanceOption`; new `STANCE_GLOSS` map
      (heart='parley, mercy', body='iron, force',
      mind='cipher, ruse'); `buildStanceOptions` populates
      it. Screen renders an italic-serif bone-color gloss
      line between the stance label and the BEATS/WEAK row.
      +1 hermetic case pinning the exact phrases. Verify
      535/535 (was 534; +1).
- [x] Phase 48 — EncounterModalOverlay panel position audit.
      Audit found a 4px drift: current panel was `top: 56,
      bottom: 80`; design ships `top: 56, bottom: 84`.
      Tightened `bottom` to 84 so the tab-bar inset reads
      identically to the design specimen. Inline JSDoc cites
      `prototype.jsx:456` and the chat-2 §IV diegetic-stack
      decision. Verify 535/535 unchanged.
- [x] Phase 49 — Token Crucible inline strip placement audit.
      Audit found the strip wasn't placed in combat at all
      (Phase 17 shipped the full `<TokenCrucible>` at the
      `/crucible` route + as a character-sheet integration,
      but the design's compact "above-the-action-picker
      strip with OPEN ▸ button" was missing). Shipped the
      port: new `<CrucibleStrip>` component in
      `app/(tabs)/combat.tsx` rendered at the top of
      `ActionPhase`. Compact horizontal row: CRUCIBLE
      eyebrow + 5 token chips (glyph + count, dim when zero)
      + OPEN ▸ button routing to `/crucible`. Token pool
      mirrors `TokenCrucible.tsx` DEFAULT_POOL until the
      engine exposes real `player.tokens` (gated alongside
      Phase 20/21 engine-release work). Verify 535/535
      unchanged.
- [x] Phase 50 — Cold-codex aesthetic toggle (filed via
      `/oversight` 2026-05-19, 7th call). Promotes the
      design-spec.md item 4 candidate that was reserved for
      `Phase 25` originally (Phase 25 already taken by typed-
      event consumer; renumbered to 50). Adds a togglable
      aesthetic mode `'canonical' | 'codex'` covering combat /
      event / exploration per chat 2 §"Open caveats" — the
      stripped-back monochrome variant for high-stakes
      surfaces. Rolling phase, multi-tick:

      - Tick A: aesthetic context (`useAesthetic()`) +
        `__DEV__` toggle in bearings or a hidden setting +
        AppStorage persistence; default 'canonical'.
      - Tick B: combat codex variant — bone-and-ash chrome,
        heavier hairlines, drops sulfur saturation on the
        action / stance pickers.
      - Tick C: event codex variant — same treatment on the
        EncounterModalOverlay + paced event shell.
      - Tick D: exploration codex variant — map nodes + step-
        cards desaturated.
      - Tick E (follow-up): extend to SELF + SATCHEL surfaces
        if user commits to the direction (chat 2 explicitly
        notes this as a follow-up not part of the initial
        port).

      Design source: `screens-canonical.jsx` variant branches
      keyed on `variant === 'codex'` (every screen function
      takes `{ variant = 'canonical' }`). Each subtick lands
      its own `feat(spec50 tick X): <surface> codex variant`
      commit; phase closes when the user signals
      "codex toggle complete" via `/oversight`.

      **Closed 2026-05-19 via `/oversight` (9th call)** after
      ticks A (`93841f1`) / B (`3d9a553`) / C (`f1c6c08`) /
      D (`3ed9bc8`) shipped. Tick E (SELF + SATCHEL codex
      extension) **deferred indefinitely** per the original
      brief's "follow-up if user commits to the direction"
      clause — the engine-side alignment surface (Phase 52,
      now promoted) supersedes for the SELF tab; SATCHEL
      extension can be re-filed as a candidate later if the
      direction firms up.
- [x] Phase 51 — `axiomancer-mechanics` bump 0.7.0 → 0.10.0
      (filed via `/oversight` 2026-05-19, 8th call). The cron
      generated `docs/engine-upgrade-0.7.0-to-0.10.0.md` at
      commit `30c03ca` covering the surface diff; this row is
      the shipping unit. Two required pieces:

      - **Schema migration v2 → v3** in
        `state/persistence/migrations.ts` for the new
        top-level `state.alignment: PhilosophicalAlignment`
        field added in engine Phase 42. Default to
        `{ epistemic: 0, ethical: 0, metaphysical: 0 }` per the
        engine's `defaultAlignment()`. Add a hermetic case to
        `state/persistence/e2e/asyncStorageAdapter.engine.test.ts`
        that loads a `schemaVersion: 2` envelope and asserts
        `alignment` equals the default.
      - **Pin bump** in `package.json` from `"0.7.0"` →
        `"0.10.0"` (still exact). `WorldMap` → `MapState`
        rename already pre-applied in commit `7a8c8e5`, so the
        bump itself is a one-line edit + `pnpm install`.

      Verify gate: `pnpm exec tsc --noEmit`, full `pnpm test`,
      `pnpm exec eslint . --max-warnings=0`. Sanity-check
      handoff items per the upgrade-guide §5: `skillLibrary` /
      `getSkillById` still expected undefined at top-level
      (engine Phase 50 not yet shipped); 8 of 9
      `dist/<sub>/types.d.ts` still expected missing. Keep
      local stop-gaps in `state/mocks/combat.skills.fixture.ts`
      and the local `PersistenceAdapter` shim until engine
      0.10.1 lands those fixes.

      **Ordering note (historic):** ships AFTER Phase 50 per
      `/oversight` 2026-05-19. Phase 50 (cold-codex) is purely UI and
      doesn't touch the engine boundary, so no conflict.
      Single commit, no rolling sub-ticks. Commit message:
      `feat(spec51): bump axiomancer-mechanics 0.7.0 → 0.10.0
      + v2→v3 alignment migration`.
- [x] Phase 52 — Surface engine `PhilosophicalAlignment` on
      SELF tab (promoted via `/oversight` 2026-05-19, 9th call;
      filed by `/expand` pass 29 in `a2ee151` at [score 7.2]).
      Engine 0.10.0 (shipped via Phase 51) introduces the
      three-axis alignment cube and updates `state.alignment`
      as the player plays via dialogue / map-event
      `alignmentDelta` payloads. Mobile carries the value
      through the v2→v3 migration but renders nothing yet.
      Light-touch adoption to make the upgrade observable.

      Scope (single phase):

      - Read `state.alignment` in
        `state/presenters/character.engine.ts`; expose
        `{ cellName, axisBuckets }` on the
        `CharacterViewModel`.
      - Resolve the active `PhilosophicalAlignmentCell` via
        engine's `getAlignmentCell(alignment)`. The cell
        object carries name, description, fallacies, virtues
        — for tick A render only `cellName` + the three axis
        buckets; richer surfaces (fallacy chips, virtue
        callouts) are follow-ups.
      - Render a small alignment row on the SELF tab beneath
        the existing stats/saves block. Cell name in
        `FONTS.gothic`; three-axis bucket chips
        (`epistemology=mid · outlook=mid · scope=mid`) in
        `FONTS.mono`. Matches the chrome register of the
        existing rows.
      - Hermetic test: VM exposes a totally-shaped alignment
        slice for a fresh game (defaults to mid/mid/mid via
        `defaultAlignment()`); the cell name resolves; bucket
        chips render for each axis value.
      - Verify gate: `pnpm exec tsc --noEmit`, full
        `pnpm test`. Commit:
        `feat(spec52): alignment cell on SELF tab — port engine 0.10.0 Philosophy module`.
- [x] Phase 53 — Save-corrupted UX modal (Spec 09 Q7=A
      follow-up). Promoted via `/oversight` 2026-05-19 (10th
      call) — last non-engine-gated candidate in the queue.
      Phase 51's migration-default fix
      (`state/persistence/asyncStorageAdapter.ts` defaulting
      `migrations = DEFAULT_MIGRATIONS` instead of `{}`) made the
      persistence layer actually run migrations in production,
      raising the surface area of corrupt-save failures from
      "never fires" to "real possibility on schema bumps". The
      current `preload()` failure path is a `console.warn` that
      silently boots a fresh game — Spec 09 Q7=A calls for a
      user-facing prompt.

      Scope (single phase):

      - Lift the `preload()` failure into provider state.
        `GameStoreProvider` gains a `corruptSave: boolean`
        signal (true when `persistenceAdapter.preload()`
        rejects); the layout passes it through.
      - New `<CorruptSaveModal>` component prompts "Save
        corrupted — start a new game?" with two actions:
        `Confirm` (calls `adapter.clear()` + boots fresh) and
        `Cancel` (keeps the app at the splash so the user can
        troubleshoot / reach support).
      - Wire into `app/_layout.tsx`: when `corruptSave === true`
        and `loaded && preloaded`, render the modal instead of
        the splash; the existing `console.warn` stays as a dev
        breadcrumb.
      - Hermetic test:
        - Poisoned envelope (`JSON.parse` throws inside
          `preload`) flips `corruptSave` true; modal mounts.
        - `Confirm` clears the slot + flips `corruptSave` false;
          provider boots a fresh `createNewGameState`.
        - `Cancel` leaves `corruptSave` true; modal stays
          mounted; no clear.
      - Voice register check: modal copy uses lowercase ritual
        (per Phase 33's voice register), no second-person
        archaic pronouns. Body suggestion:
        `"the page was torn. begin anew?"` — adjust on review.

      Verify gate: `pnpm exec tsc --noEmit`, full `pnpm test`,
      `pnpm exec eslint . --max-warnings=0`. Single commit:
      `feat(spec53): save-corrupted UX modal — Spec 09 Q7=A
      follow-up`.
- [x] Phase 54 — Debug seed button (manual-testing affordance).
      Promoted via `/oversight` 2026-05-19 (11th call) — user
      free-form request: "Could I add a 'debug' button that makes
      my character have a few items from each category and a few
      skills that also resets the current map? I want to make
      sure I'm able to test items and combat." Highest-trust
      signal class per /iterate §4. Dev-only affordance; no score
      gate.

      Scope (single phase):

      - New `<DebugSeedButton>` component at
        `components/DebugSeedButton.tsx`. Mirrors the
        `AestheticDevToggle` pattern: `__DEV__`-guarded
        (production renders null), dashed border + sulfur accent,
        mounted at the bottom of the SELF tab beside the existing
        aesthetic toggle.
      - On press, dispatch a single composite action through
        `useGameActions()` that:
        1. Adds 2-3 representative items per engine category via
           `consumableLibrary` + `equipmentTemplates` (Items
           category: one Consumable, three Equipment covering
           head/body/weapon, one Material if a Material library
           exists; QuestItem if exposed). Use the existing
           `addItem` reducer.
        2. Teaches 2-3 skills via `learnSkill` covering both
           `paradox` and `fallacy` categories. Source from the
           local `state/mocks/combat.skills.fixture.ts` stop-gap
           until engine `skillLibrary` re-export lands.
        3. Resets the current map by calling
           `getCoastalMap(currentMap.name)` and threading
           through the engine's `changeMap` reducer. Re-seeds
           nodes; clears `discoveredNodes` / `consumedNodes`.
      - Toast or accessibility-announce on success ("debug seed
        applied · N items · M skills · map reset") so the
        developer knows the action fired.
      - Hermetic test at `state/e2e/debug-seed.engine.test.tsx`:
        - Initial state has empty inventory / no learned skills.
        - After firing the seed action: inventory has at least
          one entry per represented category; knownSkills has
          ≥2 entries covering both categories; world.currentMap
          is back at startingNode.
        - Component-level test: `__DEV__=false` renders null.
        - Component-level test: tapping the button calls the
          seed action exactly once.

      Voice register: dev-only affordance, mono register on
      labels matches `AestheticDevToggle`. Toast can be
      lowercase ritual.

      Verify gate: `pnpm exec tsc --noEmit`, full `pnpm test`,
      `pnpm exec eslint . --max-warnings=0`. Single commit:
      `feat(spec54): debug seed button — items + skills + map reset
      (dev-only)`.
- [x] Phase 58 — Debug map-reset + chaos-pool toggle
      (manual-testing affordance). Promoted via `/oversight`
      2026-05-20 (13th call) — user free-form addendum:
      "Make sure to add a 'debug' button to reset the current
      map and that the 'encounters' (combat, hazard,
      gathering, etc) are randomized for now so I can continue
      testing manually." Ordered FIRST in dispatch despite
      higher number; user-direct testing unblock outranks the
      pass-30 candidates.

      Scope (single phase):

      - New `<DebugMapResetButton>` mounted beside the
        existing dev affordances on the SELF tab. On press:
        `actions.changeMap(currentMapName)` re-seeds the
        current map via the engine's `getCoastalMap` —
        fresh `currentNode`, cleared `discoveredNodes` /
        `consumedNodes` / `completedNodes`. Map-only escape
        hatch (vs. `DebugSeedButton`'s composite seed which
        also touches inventory + skills).
      - New `chaos-pool` registered in `event-pools.ts` with
        weighted entries spanning multiple event kinds —
        encounter, hazard, gathering, loot-cache, rest.
      - New `<DebugChaosToggle>` (DEV-only) that flips between
        canonical pools and the chaos pool. When ON, calls
        `setNodeEventPoolOverride(continent, mapId, nodeId,
        'chaos-pool')` for every node in both layouts. When
        OFF (default), re-calls `registerExplorationEventPools()`
        to restore the per-type overrides.
      - Hermetic tests:
        - map-reset button mutates the map to startingNode +
          cleared sets.
        - chaos-pool toggle ON: across 20 seeded-RNG resolves,
          at least 3 distinct event kinds surface.
        - chaos-pool toggle OFF: walking onto fv-3 (encounter
          node) returns to firing an encounter, not chaos.

      Verify gate: `pnpm exec tsc --noEmit`, full `pnpm test`,
      `pnpm exec eslint . --max-warnings=0`. Single commit:
      `feat(spec58): debug map-reset + chaos-pool toggle (dev-only)`.
- [x] Phase 55 — Multi-entry encounter pools per map.
      Promoted via `/oversight` 2026-05-20 (13th call) from
      `/expand` pass 30 ([3.5]).

      Scope (single phase):

      - Expand `encounter-fishing-village` pool to entries
        for tidepool-crab / sea-mist-wisp / wet-hound /
        mournful-gull, weighted so simple foes appear more
        often than the wet-hound (normal difficulty).
      - Expand `encounter-northern-forest` similarly with
        lullaby-moth / disatree / forest-sprite /
        argumentative-crow, same weighting principle.
      - Hermetic test: across 20 seeded-RNG resolves on
        an encounter node, the resolved enemy ids include
        at least 2 distinct slugs (proves the pool samples).

      Commit: `feat(spec55): multi-entry encounter pools per map`.
- [x] Phase 56 — Per-quest-node NPC wiring. Promoted via
      `/oversight` 2026-05-20 (13th call) from `/expand`
      pass 30 ([3.0]).

      Scope (single phase):

      - Replace `questCommon` with per-map quest pools that
        thread different `npcName` values per quest node
        (fv-6 Ash Mire → 'boy-priest' per the layout's
        description; nf-6 Pilgrim's Cairn → 'pilgrim-ghost'
        or similar; pick locale-thematic names).
      - Verify against the engine's NPC + dialogue registry
        in 0.10.0 — if the engine's `getDialogueNode` can't
        resolve mobile-side npcNames, stub a minimal mobile-
        side mapping so the interaction event still
        surfaces meaningfully on the screen.
      - Hermetic test: resolveMapEvent on each quest node
        returns an interaction event with the expected
        npcName.

      Commit: `feat(spec56): per-quest-node NPC wiring`.
- [x] Phase 57 — Treasure + gathering payload contents.
      Promoted via `/oversight` 2026-05-20 (13th call) from
      `/expand` pass 30 ([3.0]).

      Scope (single phase):

      - Per-map treasure pools that drop 1-3 items
        appropriate to the locale. fishing-village →
        consumables + low-tier coastal equipment; northern-
        forest → consumables + low-tier wilderness gear.
        Source items from `consumableLibrary` /
        `equipmentTemplates` (use `templateToEquipment`
        helper from `state/actions.ts` for the conversion).
      - Per-map gathering pools that drop 1-2 materials.
        If the engine ships a `Material` library accessible
        via 0.10.0 surface, use that; otherwise synthesize
        minimal Material-shaped objects.
      - Hermetic test: walking onto fv-4 (Iron Spring,
        treasure) fires a loot-cache event with non-empty
        items. Inventory grows after
        `resolveCurrentMapEvent`.

      Commit: `feat(spec57): treasure + gathering payload contents`.
- [x] Phase 59 — Character presets adoption (engine 18
      consumer; from PHASE_CANDIDATES pass 5 [score 4.5]).
      Promoted via `/oversight` 2026-05-20 (14th call). Shipped
      `6028859` — `feat(spec59): character preset picker —
      dev affordance for archetype swap`. Adds
      `actions.applyCharacterPreset(presetId)` +
      `<DebugPresetPicker>` (DEV-only); covers apprentice /
      wanderer / sage from the engine's `characterPresets`
      array. Closes mirror issue #94.
- [x] Phase 60 — Engine bump axiomancer-mechanics 0.10.0
      → 0.10.2. Queued via `/triage` 2026-05-20 from user-filed
      issue #93. **Re-shaped via `/oversight` 2026-05-20 (16th
      call) into a multi-phase sequence (60a/60d/60b promoted;
      60c/60e/60f below threshold in PHASE_CANDIDATES).** This
      parent row tracks the bump as a whole; the sub-phases are
      the actual `[ ]` work units. The lockfile bump itself ships
      as the last sub-phase (60f) once the surface drift is
      drained across 60a–60e.

      **Surface drift discovered 2026-05-20 by `/ship-a-phase`
      attempt** — issue #93's brief said the bump was
      surface-additive ("no breaking changes"), but
      `npm install axiomancer-mechanics@0.10.2 && npm run verify`
      surfaced **58 typecheck errors across 5+ files** beyond
      the documented additions. The bump was reverted in the
      same tick to keep the loop green.

      **Actual drift surface (0.10.0 → 0.10.2):**

      - `getCoastalMap` **removed** — replaced by
        `getMapDefinition` (different signature). Consumers:
        `state/actions.ts`, `state/e2e/exploration.engine.test.ts`,
        `state/e2e/event-pools.engine.test.ts`.
      - `Encounter.enemy` **removed** from the public type —
        likely now `enemyId` or fetched via a resolver. Consumers:
        `state/e2e/event.engine.test.ts`,
        `state/e2e/event.screen.test.tsx`,
        `state/e2e/event-assets.test.ts`,
        `state/presenters/event.engine.ts`.
      - `DialogueChoice.id` / `.label` **removed** —
        flattened or restructured. Consumers:
        `state/presenters/event.engine.ts`, `state/actions.ts`.
      - `DialogueNode.speaker` **removed**.
      - `Character.mana` / `.maxMana` **removed** from the public
        `Character` type — `combat-hud.engine.test.ts` writes these
        as a presentation stop-gap; presenter layer needs to lift
        them onto a mobile-side type.
      - `ActiveEffect` shape changed — no `id` / `name`.
      - `EffectStatTarget` tightened to a literal union.
      - `GameStore` vs `AppStoreState` drift — mobile's slice
        composition (event / notifications / `_recentEvents`)
        no longer aligns with the engine's `GameStore` shape;
        type narrowings in test files break.
      - `GameState` lost its index signature.

      **Brief is now ambiguous (skill §10.8).** Phase 60 needs
      user re-scoping before the loop should attempt it again.
      Two viable shapes:

      1. **Single bigger phase** — accept the breadth, fix all
         consumers in one commit. Estimate: 1–2h of focused work.
      2. **Multi-phase compatibility sequence** —
         - 60a: rename `getCoastalMap` → `getMapDefinition` and
           reconcile the map-events module wiring.
         - 60b: `Encounter.enemy` → new shape; presenter +
           tests + actions.
         - 60c: `DialogueChoice` / `DialogueNode` flattening;
           presenter + actions.
         - 60d: `Character.mana` lift to mobile type; remove from
           engine-shape writes.
         - 60e: `ActiveEffect` shape; `GameStore` slice
           reconciliation; misc.
         - 60f: lockfile bump + upgrade doc.

      Either way, the issue-93 brief should be amended on the
      engine repo so future bumps surface breaking changes
      transparently in the CHANGELOG.

      **Status (post-oversight 16th call, 2026-05-20):** user
      selected the **multi-phase shape**. 60a/60d/60b promoted
      as the work rows below; 60c/60e/60f remain in
      `plan/PHASE_CANDIDATES.md` under `## Considered (below
      threshold)` for follow-up promotion once the trio ships
      clean. The lockfile bump (60f) is gated on 60a–60e
      landing.
- [x] Phase 60a — `getCoastalMap` → `getMapDefinition` rename.
      Promoted via `/oversight` 2026-05-20 (16th call). Shipped
      `baf66fa` — `feat(spec60a): migrate getCoastalMap →
      createMapState(getMapDefinition)`. Migrated 4 call sites
      (2 in `state/actions.ts`, 2 in e2e tests) directly to the
      two-step pattern; both surfaces exist on 0.10.0 so no shim
      was needed. 760/760 tests green. Closes mirror issue #95.
- [x] Phase 60d — Lift `Character.mana`/`maxMana` to a
      mobile-side `combatMana` slice. Promoted via `/oversight`
      2026-05-20 (16th call). Shipped `579a6a7` —
      `feat(spec60d): lift Character.mana to mobile combatMana
      slice`. New `CombatManaState` interface on AppStoreState;
      `ensureManaOnCombatPlayer` deleted; both presenters
      (combat-hud + combat) widened to AppStoreState and read
      from `state.combatMana`. 760/760 tests green. Closes
      mirror issue #96.
- [x] Phase 60b — `Encounter.enemy` → `enemies[0]` migration.
      Promoted via `/oversight` 2026-05-20 (16th call). Shipped
      `0ee7f63` — `feat(spec60b): migrate Encounter.enemy →
      enemies[0]`. Investigation revealed the engine's canonical
      shape (`{enemies, origin}`) already shipped on 0.10.0; the
      migration is to that shape (not `enemyId` as the candidate
      brief had hypothesized). 5 fixtures + 2 consumers migrated;
      760/760 tests green. Closes mirror issue #97.
- [x] Phase 60c — `DialogueChoice` / `DialogueNode` flattening.
      Promoted via `/oversight` 2026-05-20 (17th call). Shipped
      `7e29be5` — `feat(spec60c): migrate dialogue rendering to
      flattened DialogueChoice/Node`. Engine source confirmed
      the new shape (`choice.text`, no `choice.id`/`label`; no
      `node.speaker`). 2 consumers migrated; VM choice id now
      derived from `visibleChoices` index. 760/760 tests green.
      Closes mirror issue #98.
- [x] Phase 60e — `ActiveEffect` + `GameStore` slice
      reconciliation. Promoted via `/oversight` 2026-05-20
      (18th call). Shipped `8596409` — `feat(spec60e):
      reconcile ActiveEffect + AppStoreState/GameStore
      alignment`. Investigation confirmed `ActiveEffect`
      carries `effectId` (not `id`/`name`); fixed a real
      latent bug in `composeHazard` where every hazard
      consequence rendered the literal `'effect'`. Also
      pre-emptively migrated 18 test fixture sites
      (navigation × 4, exploration × 13, migrations × 3 casts)
      to honor the strict AppStoreState shape under 0.10.2.
      760/760 tests green. Closes mirror issue #99.
- [x] Phase 60f — Lockfile bump `axiomancer-mechanics`
      0.10.0 → 0.10.2 + upgrade doc. Promoted via `/oversight`
      2026-05-20 (19th call) after 60a–60e all shipped clean.
      Shipped `a6cd028` — `feat(spec60f): bump axiomancer-mechanics
      0.10.0 → 0.10.2 + upgrade doc`. The bump surfaced 56 residual
      typecheck errors (test-fixture sites 60a–60e missed) — all
      same root cause as 60e (strict 0.10.2 types catching
      implicit GameStore → AppStoreState coercions). Folded the
      fixture sweep into this same commit rather than spawning a
      Phase 60g. 760/760 tests green at the bumped pin. Closes
      the Phase 60 parent + drains the engine-bump AUDIT row.
      Closes mirror issue #93.

      Scope (single phase, single commit):

      - One-line edit in `package.json`: `"axiomancer-mechanics":
        "0.10.0"` → `"0.10.2"` (still exact pin).
      - `pnpm install` to refresh `pnpm-lock.yaml`.
      - Author `docs/engine-upgrade-0.10.0-to-0.10.2.md`
        mirroring the `0.7.0-to-0.10.0` template — enumerate the
        9 surface drifts already drained by 60a–60e (so the doc
        is a "what was already done" reference, not a fresh
        migration plan), name the latent `composeHazard` bug
        60e caught, point at the mirror issues #95/96/97/98/99
        for traceability.
      - Verify gate: `pnpm exec tsc --noEmit`, full `pnpm test`,
        `pnpm exec eslint . --max-warnings=0`. Expectation:
        already green at 760/760 against 0.10.0 surface; the
        bump should not regress because the surface is already
        migrated.
      - Close Phase 60 parent row (flip `[parent]` → `[x]`
        with this commit's hash).
      - Drain the AUDIT.md `[in-progress via Phase 60a…]` row
        to Done.

      Commit: `feat(spec60f): bump axiomancer-mechanics 0.10.0
      → 0.10.2 + upgrade doc`. Closes mirror issue #93.

**DEV-mode coverage expansion (Phase 61 parent + sub-phases,
filed via `/oversight` 2026-05-20, 19th call).** Promoted from
`plan/PHASE_CANDIDATES.md` [score 6.0] after user-jot `7821f13`
("Let's figure out a way to expand the frontend with a 'dev'
mode where I can test the implementation of every mechanic
we've ported so far.") and the matching iterate row at
`dcda455`. User selected the **parent-with-sub-ticks shape**
(Phase 60 mold) over per-mechanic small phases — easier to
track scope creep on the meta-feature. Sub-phases ship in
listed order; each one is a `/ship-a-phase` dispatch.

- [x] Phase 61 — DEV-mode coverage expansion. All six
      sub-phases shipped: 61a `e846942` (menu structure), 61b
      `5fef0fd` (XP + level-up), 61c `01cd261` (mana
      drain/restore), 61d `bd24fc4` (alignment shift), 61e
      `1ce56b1` (effect apply), 61f `01932f7` (event-kind
      trigger override). SELF-tab DevMenu now exposes 11
      collapsible debug affordances spanning every ported
      mechanic class (existing 6 + new 5). 800/800 green at
      Phase 61 close (was 766 at Phase 61a's land).
- [x] Phase 61a — DEV menu structure refresh. Shipped
      `e846942` — `feat(spec61a): dev-menu structure refresh —
      collapsible group on SELF tab`. New `<DevMenu>` wrapper
      around the six existing Debug* affordances; dashed-border
      panel matching the AestheticDevToggle chrome register;
      `__DEV__`-gated; default state collapsed. +6 hermetic
      DevMenu tests (DEV gate true/false, collapsed default,
      expand on press, toggle round-trip, initiallyExpanded
      shortcut). 766/766 green (was 760).
- [x] Phase 61b — XP + level-up affordance. Shipped
      `5fef0fd` — `feat(spec61b): dev-menu XP + level-up grant`.
      New `<DebugXpGrant>` row with two buttons (+100 XP /
      LEVELUP). LEVELUP seeds experience to threshold then
      dispatches engine `levelUp()`; the engine reducer loops
      through stacked level-ups and emits `character:levelup`,
      which flips `notifications.levelUpAcknowledged` false and
      re-arms the character-tab badge. +7 hermetic tests. 773/773
      green (was 766).
- [x] Phase 61c — Mana drain/restore. Shipped `01cd261` —
      `feat(spec61c): dev-menu mana drain/restore`. New
      `<DebugManaControl>` row with two buttons (DRAIN / FULL)
      mutating the mobile `combatMana` slice. Seeds from null
      when no combat is active; preserves `.max` when slice
      exists. +7 hermetic tests. 780/780 green (was 773).
- [x] Phase 61d — Philosophical alignment shift. Shipped
      `bd24fc4` — `feat(spec61d): dev-menu alignment shift`.
      Three-axis panel (epistemology / outlook / scope per the
      engine's `PhilosophicalAlignment` shape — brief used the
      aspirational names epistemic/ethical/metaphysical;
      engine names won as the canonical surface) with ±10
      buttons routing through `shiftPhilosophicalAlignment`.
      +7 hermetic tests. 787/787 green (was 780).
- [x] Phase 61e — Active effect apply (player + enemy). Shipped
      `1ce56b1` — `feat(spec61e): dev-menu effect apply`.
      Two static effect targets (BUFF · ME →
      `buff_body_defense_up` / BLEED · FOE → `debuff_bleed`)
      routed through the engine's `applyEffect` helper. Enemy
      branch no-ops + warns when no combat is active (CombatState
      carries singular `enemy` per engine 0.10.2). Picker UI
      deferred — two static ids are enough for manual-test
      observability. +6 hermetic tests. 793/793 green (was 787).
- [x] Phase 61f — Event-kind trigger override. Shipped
      `01932f7` — `feat(spec61f): dev-menu event-kind trigger
      override`. Five-button panel (REST / GATHER / TREASURE /
      QUEST / FIGHT) routed through new
      `forceEventKindOnNode(mapId, nodeId, kind)` helper in
      `event-pools.ts`. Reuses existing `poolIdForNode` mapping
      so per-map pool variations propagate automatically. +7
      hermetic tests. 800/800 green (was 793).

      **Follow-ups out of scope for Phase 61** (re-file as
      candidates if the user wants them): dialogue-tree jump,
      quest state mutation, friendship counter, currency
      grant, combat-HUD spot overrides. The candidate body in
      `plan/PHASE_CANDIDATES.md` enumerates them.

**DEV-mode follow-up affordances (Phase 62 parent + sub-phases,
filed via `/oversight` 2026-05-21, 21st call).** Promoted from
`plan/PHASE_CANDIDATES.md` [score 5.5] — the deferred items from
user-jot `7821f13` that Phase 61 explicitly named as out of
scope. User selected the parent-with-sub-ticks shape (Phase 61
mold). Each sub-phase adds one Debug* row inside the existing
DevMenu (Phase 61a wrapper); none change production surfaces.

- [parent] Phase 62 — DEV-mode follow-up affordances. Tracks
      the meta-feature; sub-phases 62a–62e are the actual work
      units. Closes when 62e ships clean (or when the user
      signals "62 complete" via `/oversight`).
- [x] Phase 62a — Dialogue tree jump. Shipped `b5f681e` —
      `feat(spec62a): dev-menu dialogue tree jump`. New
      `<DebugDialogueJump>` row with two static trees (OMEN /
      FRIEND) that seed `state.event.pending` with a synthetic
      interaction event + dialogueCursor at the tree root.
      `selectHasActiveEvent` flips true on tap → `EventGate`
      routes to /event. No engine registry exists for picker
      driven mode; synthetic trees stay inline. +6 hermetic
      tests; 881/881 green (was 875).
- [x] Phase 62b — Quest state mutation. Shipped `ef8475e` —
      `feat(spec62b): dev-menu quest state mutation`. New
      `<DebugQuestState>` with three actions per quest (START
      / ADV / DONE) across two synthetic Quests (starting-quest
      + gather-wood). Each button routes through engine
      `startQuest` / `progressQuest` / `completeQuest`. Memoir
      tab reflects the state changes. +7 hermetic tests; 888/888
      green (was 881).
- [x] Phase 62c — Friendship counter override. Shipped `2f058d8`
      — `feat(spec62c): dev-menu friendship counter override`.
      New `<DebugFriendship>` with +1 / RESET buttons mutating
      `state.combat.friendshipCounter`. Combat-only; warns +
      no-ops outside combat. +8 hermetic tests; 896/896 green
      (was 888).
> **Priority note (oversight 2026-05-21, 23rd call):** Phases 62d
> and 62e are now **paused indefinitely**. The user re-prioritized
> the [9.8] modal-contained-encounter refactor (Phase 63) over
> any further Phase 62 dev affordances. `/march` will skip 62d/e
> until they are explicitly un-paused via `/oversight`.

- [paused] Phase 62d — Currency grant. New `<DebugCurrencyGrant>`
      row. Single `+100` button that adds to the player's
      currency slice (engine field — verify shape first; may
      not exist yet, in which case 62d defers as `[skipped]`
      pending engine surface). Tests pin: amount added,
      idempotent across stacked presses. Commit:
      `feat(spec62d): dev-menu currency grant`.
- [paused] Phase 62e — Combat-HUD spot overrides. New
      `<DebugCombatOverrides>` panel with three slider/button
      groups: player HP (set to 1 / max), enemy HP (set to 1 /
      max), mind-marks (clear / +3). Only active during
      combat; warns + no-ops otherwise. Tests pin: each
      override mutates the right field of state.combat.
      Commit: `feat(spec62e): dev-menu combat HUD overrides`.

      **Out-of-scope for Phase 62** (re-file if needed):
      enemy effect-apply (covered by Phase 61e's BLEED · FOE
      button); event-kind trigger (covered by Phase 61f); RNG
      seed control could be a future phase if signals warrant.

**Modal-contained encounter refactor (Phase 63 parent +
sub-phases, filed via `/oversight` 2026-05-21, 23rd call).**
Promoted from `plan/AUDIT.md` [9.8] row after user signaled
top priority: "KEEP the full encounter inside the modal, the
user cannot exit the modal until the encounter is resolved.
Keep it all living inside the same modal opened during the
encounter trigger." Current flow routes FIGHT to a separate
`/combat` tab via `router.replace('/combat')`; user wants
the encounter to live entirely inside `EncounterModalOverlay`
until resolution + aftermath.

This may resolve the [9.8] "Base combat mechanics not wired
into UI" bug as a side effect (the router transition may be
part of why selections don't visibly drive combat). If not,
that row gets revisited via `/iterate` once Phase 63 lands.

- [x] Phase 63 — Modal-contained encounter. All four
      sub-phases shipped: 63a `4c4993c` (extract CombatPanel),
      63b `8deeb27` (mount CombatPanel inside modal),
      63c `a18ee12` + `ce90615` (session lifecycle + tab-bar
      regression fix), 63d `d6d23c1` (retire STRIFE tab).
      Combat now lives entirely inside the
      EncounterModalOverlay; bottom tab bar shows 4 tabs
      (WILDS / SELF / MEMOIR / SATCHEL). Encounter session
      tracked via `combat-mode.inEncounterModal`. The
      combat-mechanics bug investigation ([9.8] AUDIT row)
      stays open pending user retest on the next preview
      build.
- [x] Phase 63a — Extract combat UI from `(tabs)/combat.tsx`.
      Shipped `4c4993c` — `feat(spec63a): extract CombatPanel
      from combat tab`. Split `CombatScreen` into a thin shell
      (default export, wraps `<ScreenBg>`) + a `CombatPanel`
      named export with the actual content (no ScreenBg).
      Canonical import path at
      `components/combat/CombatPanel.tsx` re-exports for
      callers outside the (tabs) folder. +2 hermetic surface
      tests. 898/898 green (was 896).
- [x] Phase 63b — Mount `<CombatPanel>` inside
      `EncounterModalOverlay`. Shipped `8deeb27` —
      `feat(spec63b): combat lives inside EncounterModalOverlay`.
      Internal `useState<'prelude' | 'combat' | 'aftermath'>`
      on the overlay; FIGHT advances prelude → combat and
      swaps content to a ScrollView-wrapped `<CombatPanel>`.
      `router.replace('/combat')` removed from exploration's
      `onEncounterFight`; useRouter import dropped. +3 hermetic
      cases pin the prelude→combat transition. 901/901 green
      (was 898).
- [x] Phase 63c — Modal-contained encounter session: fix the
      mid-encounter unmount bug + lock the tab bar during the
      modal. Shipped `a18ee12` —
      `feat(spec63c): modal-contained encounter session`. User
      retest of 63b surfaced that the modal disappeared on
      FIGHT (selectHasActiveEvent short-circuits when combat
      starts) and that the tab bar stayed navigable
      mid-encounter. 63c lifts encounter-session state to
      combat-mode (`inEncounterModal` flag + open/close API),
      mounts the modal whenever the flag is true OR a prelude
      is ready (so it spans the full combat lifecycle), hides
      the tab bar via `tabBarStyle: { display: 'none' }`
      while the modal is open, and swaps CombatPanel's
      `router.replace('/exploration')` calls for a
      `finalizeCombatExit` helper that closes the modal
      in-place when inside it (preserves the legacy tab path).
      +4 hermetic combat-mode cases pin the session lifecycle.
      905/905 green (was 901). Aftermath-inside-modal is a
      follow-on; the existing AftermathBanner on exploration
      surfaces post-victory per the Phase 41 flow.
- [x] Phase 63d — Retire STRIFE tab from the bottom bar.
      Shipped `d6d23c1` —
      `feat(spec63d): retire STRIFE tab from bottom bar; combat
      is modal-only`. STRIFE tab `href: null` unconditionally
      (route file stays for DebugCombatButton dev path + deep
      links; just not surfaced in the user-facing bar).
      WILDS↔STRIFE mutex retired entirely from the layout;
      exploration is the leftmost positional tab. Stale
      imports / combatContext plumbing dropped. 905/905 green.

      **Out-of-scope for Phase 63** (re-file if needed):
      combat-mechanics bug investigation (AUDIT [9.8] row stays
      open; revisit via `/iterate` once user confirms 63 works
      end-to-end on a fresh preview); DEV-menu additions
      (62d/e stay paused). The legacy `selectVisibleTabs` /
      `isTabHidden` functions stay in `tabs.engine.ts` with
      their existing tests — dead code now; a future iterate
      can prune.

**Multi-screen integration test harness (Phase 64, filed via
`/oversight` 2026-05-21, 24th call).** Promoted from
`plan/PHASE_CANDIDATES.md` [score 7.5]. Closes the testing gap
documented in `plan/NEEDS_HUMAN_ATTENTION.md` — every Phase
62/63 regression this session was an integration bug invisible
to single-component tests. The three corrective commits on
Phase 63 (`ce90615`, `d460b64`, plus this oversight) all
addressed regressions that would have surfaced earlier with
multi-screen integration coverage.

- [x] Phase 64 — Multi-screen integration test harness. Shipped
      `a4c0c4b` — `feat(spec64): multi-screen integration test
      harness — provider helper + encounter-flow suite`. Ticks
      A-C shipped together: `test-utils/withAllProviders.tsx`
      bundles the four contexts; `encounter-flow.engine.test.tsx`
      adds 5 hermetic cases (3 overlay-lifecycle + 2 combat-
      action engine mutation). The combat-action cases PASSED,
      confirming engine + action layer mutate state correctly
      end-to-end — narrowing the [9.8] combat-mechanics row's
      candidate roots from A/B/C/D to A or C (layout-or-memo,
      not engine). 911/911 green (was 906).

**Combat regression cluster diagnostic (Phase 65, filed via
`/oversight` 2026-05-21, 25th call).** Promoted in response
to user-pasted diagnostic console output that narrowed the
`[9.8]` AUDIT row from "candidate roots A/C" to a confirmed
sub-hypothesis 2: `selectCombatViewModel` in
`state/presenters/combat.engine.ts` returns
`vm.phase=choosing_action` even when fed a fresh
`combat.phase=resolving` (engine mutates, `useMemo`
recomputes, but the selector's phase mapping is wrong). One
phase bundles all five `[9.x]` combat regressions because the
root cause is shared (or believed shared) and the chrome
cleanup is trivial in the same surface.

- [ ] Phase 65 — Combat regression cluster diagnostic. Single
      phase, 3 ticks. Ships the fix that unblocks playable
      combat + drains the four open `[9.x]` rows in
      `plan/AUDIT.md` Pending. Replaces the prior "modal
      aftermath" candidate at Phase 65 (renumbered to Phase 66;
      its conflict line "needs [9.8] resolved first" makes it
      a downstream phase).

      - **Tick A — `[9.8]` root-cause fix.** Open
        `state/presenters/combat.engine.ts:selectCombatViewModel`.
        Trace how `vm.phase` is derived from the incoming
        `state.combat.phase`. Inspect for: (a) a `localUi` or
        closure capture that pins phase at hook init time;
        (b) a switch/map that doesn't enumerate `'resolving'`
        and defaults to `'choosing_action'`; (c) any branch
        that reads `playerChoice.action` and overrides phase
        downstream. Land the fix. Add ≥2 hermetic cases to
        `state/e2e/combat.engine.test.ts` (or a new
        `state/e2e/combat-vm.engine.test.ts`) that:
        - call `selectCombatViewModel({...state,
          combat: {...combat, phase: 'resolving'}})` directly
          and assert `vm.phase === 'resolving'`;
        - drive the engine via the integration harness from
          Phase 64 — `setPlayerStance` → `setPlayerAction` →
          `resolveRound` → assert next render's `vm.phase` is
          NOT `'choosing_action'`.
        Closes `[9.8]` + `[9.5] Action selection has no
        effect` (duplicate).
      - **Tick B — Heart pre-selected default fix.** Find
        where the stance picker's initial selected-state
        renders Heart pre-highlighted on a fresh combat with
        no committed stance. Required state: no stance card
        carries the selected visual until the player taps
        one. Likely a `selectedStance ?? 'heart'` fallback in
        `combat.engine.ts` or the `<StanceOption>`
        component. Drop the fallback; pass `null`/`undefined`
        through. +1 hermetic case asserting no stance has
        `selected: true` on `vm.phase === 'choosing_stance'`
        when `playerChoice.stance == null`. Closes `[9.5]
        Heart pre-selected`.
      - **Tick C — Chrome cleanup + diagnostic strip.**
        - Replace `label="MP"` in `components/StatusCard.tsx`
          + `app/(tabs)/combat.tsx` with the chosen semantic
          (drop on character screen since combatMana is
          combat-only post-Phase-60d; rename to lowercase
          `'mana'` in-combat). Closes `[9.5] MP label leak`.
        - Audit `EncounterModalOverlay`'s
          `vm.preludeChrome === null` guard against the
          updated Phase 60b enemy shape; tighten the modal
          mount predicate so the modal stays mounted across
          the combat-prelude → combat transition without
          racing the event-slice clear. Closes `[9.5]
          Encounter modal closes before resolution` (if not
          already absorbed by Tick A's vm fix).
        - Strip the diagnostic stream listed in
          `plan/COMBAT_DEBUG_PICKUP.md` §"Diagnostic streams
          currently live in code": eight log families across
          `combat.tsx`, `actions.ts`, `combat.engine.ts`,
          plus the diagnostic toast.
        - Delete `plan/COMBAT_DEBUG_PICKUP.md` (its premise
          closes when [9.8] does).

      Verify gate: `pnpm exec tsc --noEmit`, full `pnpm test`,
      `pnpm exec eslint . --max-warnings=0`. Tick A and B
      can ship as separate commits; Tick C is one cleanup
      commit at the end. Commit prefixes:
      `feat(spec65a): selectCombatViewModel phase passthrough
      — fix [9.8]`, `feat(spec65b): no default stance — fix
      [9.5] heart pre-selected`, `feat(spec65c): combat
      chrome cleanup + diagnostic strip`.

      Phase 66 (modal aftermath, formerly candidate Phase 65)
      becomes the natural next-up once 65 lands clean and
      user retests playable combat.

> **`design-spec.md` cold-codex item (4)** is **not** in
> phases 34–43. Per its own brief body it needs a fresh
> `Phase 25 — Aesthetic toggle` candidate filed via
> `/oversight`, since it's three screens + a togglable
> aesthetic mode (much larger surface). Stays in
> `PHASE_CANDIDATES.md` rather than the build plan.

> bug findings, presenter refactors, asset backlog, ongoing
> audits. `/march` makes that transition automatic. (Block II
> phases 20/21 and Block III phase 24 in
> `plan/PHASE_CANDIDATES.md` are gated on engine releases or
> stay below promotion threshold; `/expand` re-evaluates.
> Block III phase 22 promoted to Phase 59 via `/oversight`
> 2026-05-20.)

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
