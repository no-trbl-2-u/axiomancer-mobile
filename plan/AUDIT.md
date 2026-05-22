# Site audit

> Latest findings from `/iterate audit`. Rewritten on each
> audit pass. The Pending list at the bottom queues `/iterate`.

> **Next-oversight directive (set via `/oversight` 2026-05-22,
> 27th call):** when the user next invokes `/oversight`,
> schedule a **live-drive playtest tick** — Claude uses the
> Playwright MCP workflow from `setup/04_claude_playtest.md`
> to drive a full encounter (exploration tap → modal mount →
> stance commit → action commit → resolve → continue or exit)
> against the user's running `pnpm web` instance. The playtest
> surfaces any visible regressions the code-read audits miss,
> filed as fresh iterate rows. **The user wanted this scheduled
> for an oversight call, not autonomously fired** — so /march
> should NOT spontaneously launch a playtest tick in the
> meantime.

> Bias: memoir-surface (set via `/oversight` 2026-05-16 after
> critique pass 7 surfaced 4 MED findings clustered on
> `state/presenters/memoir.engine.ts` +
> `app/(tabs)/memoir/index.tsx` — same shape as the
> event-surface cluster that followed the Phase 32 port).
> `/iterate` weights cluster members 1.5× until the surface
> drains: the 4 MED rows (JSDoc stale, `emptyMoral` /
> `emptyPhilosophical` unconsumed, PARLEYED-WITH-for-flee
> re-voice to FLED per oversight 2026-05-16, and the Phase 33
> shipped-state body SACK → SATCHEL fix) plus the LOW
> `'untested.'` chip-vs-narrative split. Once those rows
> close, bias resets and `/iterate` resumes natural HIGH-first
> ordering across the remaining queue (smoke-screens memoir
> route + SACK docs sweep). Prior event-surface bias closed
> 2026-05-16 after 3 of 4 cluster rows drained
> (HIGH event.tsx chrome `994fb02`, MED ENCOUNTER dedup
> `11c47db`, LOW empty-state voice `d6bf779`); the 4th cluster
> row (LOW STRIFE STIRS) is moving to Done as
> `[accepted-as-design]` per oversight 2026-05-16.

## Top 5 findings (scored) — 2026-05-13 (stale; archived below)

### [3.8] Drain 8 lint warnings (unused imports + stale eslint-disable) — picked

- issue: #11
- category: tests (quality / verify-gate noise)
- impact: 4 (warnings are non-fatal but mask real signal; the
  audit log explicitly tracks the count "7 pre-existing" → now
  8, and unchecked warnings drift upward)
- ease: 9.5 (every warning is an import-list trim or a one-line
  delete; mechanical, no behaviour change)
- next: edit `app/(tabs)/character/index.tsx`,
  `app/(tabs)/event.tsx`, `app/_layout.tsx`,
  `components/ActionIcon.tsx`, `components/BodyDiagram.tsx`,
  `components/NodeMark.tsx`; run `npm run verify`; commit

### [3.0] Migrate `Consumable.effectId` from string parsing to structured `healAmount: number` ✅

- issue: #12 (closed by commit `a5438c5`)
- category: refactor / data (engine integration debt)
- **Resolved 2026-05-13.** Mobile now reads `consumable.healAmount`
  directly; legacy `effectId: 'Heal N HP'` strings stay supported
  via `parseHealAmount` for backward compat. Caught a latent
  double-heal bug along the way — the engine's `store.useConsumable`
  already applies `healAmount` internally via `useConsumableEffect`,
  so the mobile-side `healCharacter` call now gates to the
  legacy-string path only. See commit `a5438c5`.

### [2.5] `state/presenters/navigation.engine.ts` carries 3 TODOs blocked on engine surface

- category: refactor / external-dependency
- impact: 5 (active events, XP/level-up, event-state checks all
  fall back to defaults — Phase 8 navigation polish is shipped
  but these stubs are silent dead ends once engine Spec 09 land)
- ease: 5 (waits on engine surface; tracked in the
  `[needs-user-call]` Phase 6 row below)
- next: defer — same blocker as Phase 6

### [2.0] `state/mocks/combat.skills.fixture.ts` still mocks skills (engine Spec 04)

- category: refactor / data
- impact: 5 (combat surface reads mocked skills; engine Spec 04
  shipped but the mobile mock was never migrated to engine
  selectors — drift risk)
- ease: 4 (need to wire engine skill selectors into the combat
  presenter and delete the fixture)
- next: future tick — sized like a small refactor, not a
  one-tick fix

### [needs-user-call] Phase 6 (Spec 08 — Event screen wiring) — RESOLVED ✅

- Resolved 2026-05-15 — Phase 6 shipped. See Done section for details.

## Pending

### [4.0] Mechanics-vs-UI logic audit — event surface ✅ (drifts filed as [4.5] / [2.5])

- category: docs / quality (project coherence)
- impact: 8 (event-modal flow is the most user-visible surface
  after combat; drift would manifest as visible bugs the user
  has not yet reported)
- ease: 5 (research-heavy — enumerate decisions in
  `EncounterModalOverlay`, `event.tsx`, `event.engine.ts`,
  `EventGate`, `EventArt` dispatch; trace each against engine
  `resolveMapEvent` / `MapEvent` / `DialogueChoice`)
- next: file as iterate tick. Deliverable:
  `docs/mechanics-ui-audit-2026-05-22-event.md` mirroring the
  combat audit's shape (one row per decision, verdict ALIGNED /
  DRIFT / MOBILE-ONLY, fix proposals on drift rows). Replicate
  the index table at the top.
- source: oversight 27th (2026-05-22) — user-direct: "run the
  other 3 mechanics audits (event / exploration / inventory)"

### [4.5] DRIFT — FLEE subtitle promises `-ii morale` that engine never applies ✅

- category: bug (chrome integrity / player-trust)
- impact: 6 (the non-boss FLEE button's chrome subtitle reads
  `forfeit the path · -ii morale`; the action layer's flee
  branch sets the event slice and routes back to exploration
  without touching `state.moralMeter`. Player taps FLEE,
  morale meter is unchanged — chrome lies)
- ease: 7 (small action-layer edit in `pickEventChoiceAction`
  flee branch: dispatch a moralMeter delta of -2 alongside the
  event clear; +1 hermetic case)
- next: file iterate fix tick. Either wire the engine moral
  decrement to match the chrome, or drop the `-ii morale`
  text and replace with `'forfeit the path'` (engine-honest).
  Recommendation: wire it — gives the FLEE choice real
  weight; the engine's moralMeter is already surfaced on the
  SELF tab so the side-effect is visible.
- source: event-surface mechanics audit 2026-05-22, row 10

### [2.5] DRIFT — `(encounter as any).enemies[0]` cast in composeCombatPrelude (event-audit row 4)

- category: refactor / typing hygiene
- impact: 2 (no behavior change; the `as any` cast hides any
  future engine field rename)
- ease: 8 (drop the cast; `encounter.enemies` is already on
  the engine's `Encounter` type post-Phase-60b)
- next: file iterate fix tick.
- source: event-surface mechanics audit 2026-05-22, row 4

### [4.0] Mechanics-vs-UI logic audit — exploration surface ✅ (drifts filed as [3.5]/[3.0]/[3.0]/[2.5])

### [3.5] DRIFT — exploration encounter icon is `'flee'` (looks like the FLEE button) (exploration-audit row 10)

- category: bug (chrome / visual vocabulary)
- impact: 6 (every exploration screen with an encounter node
  shows the FLEE icon on its step-card; reads as "this lets
  you flee" rather than "this starts combat" — high-visibility
  chrome inconsistency)
- ease: 8 (one-line swap in
  `state/presenters/exploration.engine.ts:120` —
  `'encounter' → 'sword'` to match the combat ATTACK icon)
- next: file iterate fix tick. Live-verify via the playtest
  runbook (visible on Fishing Village's fv-3 encounter node).
- source: exploration-surface mechanics audit 2026-05-22, row 10

### [3.0] DRIFT — no test pins mobile NodeType ↔ engine event-pool registration (exploration-audit row 4)

- category: tests (latent contract)
- impact: 5 (a node typed `'encounter'` in the layout fixture
  could be registered to fire e.g. `'rest-shared'`; today they
  agree but no test enforces it. New map additions risk silent
  visual/behavior mismatch)
- ease: 6 (write a hermetic test that walks every node in
  both layouts and asserts the registered pool matches the
  type; gate by checking only when chaos-pool DEV toggle is
  OFF)
- next: file iterate fix tick.
- source: exploration-surface mechanics audit 2026-05-22, row 4

### [3.0] DRIFT — exploration presenter still reads legacy `availableNodes` / `completedNodes` / `lockedNodes` (exploration-audit row 1)

- category: refactor (Phase 27 migration tail)
- impact: 4 (if engine ever stops dual-populating the legacy
  fields the presenter silently loses signal; today no risk)
- ease: 5 (migrate `selectExplorationViewModel` to engine
  `discoveredNodes` / `consumedNodes` reads; remove the
  `moveToAction` legacy chain; preserve the visual edges via
  the layout fixture's `connectedNodes`)
- next: file iterate fix tick (gated on confirming the engine
  surface is rich enough for the visual classification UI needs).
- source: exploration-surface mechanics audit 2026-05-22, row 1

### [2.5] DRIFT — `(state as any).world` cast in exploration presenter + moveToAction (exploration-audit row 7)

- category: refactor / typing hygiene
- impact: 2 (cast hides any future engine field rename; no
  behavior change)
- ease: 8 (drop the `as any` at ~5 sites; let GameStore /
  AppStoreState narrow `state.world` directly)
- next: file iterate fix tick.
- source: exploration-surface mechanics audit 2026-05-22, row 7


- category: docs / quality (project coherence)
- impact: 8 (exploration drives the map / move / event-trigger
  loop; drift here breaks the gameplay-traversal feedback
  layer)
- ease: 5 (research-heavy — `exploration/index.tsx`,
  `exploration.engine.ts`, `moveToAction`,
  `resolveCurrentMapEvent`, `event-pools.ts`; trace against
  engine `revealAdjacent` / `markNodeConsumed` / `changeMap` /
  `getMapDefinition` / `resolveMapEvent`)
- next: file as iterate tick. Deliverable:
  `docs/mechanics-ui-audit-2026-05-22-exploration.md`.
- source: oversight 27th (2026-05-22)

### [3.8] Mechanics-vs-UI logic audit — inventory surface ✅ (three-audit series complete; drifts filed as [3.5]/[3.0]/[2.5])

### [3.5] DRIFT — "first-equipment-per-slot = worn" convention is undeclared (inventory-audit row 1)

- category: refactor / contract hygiene
- impact: 5 (presenter + equipItemAction + character presenter
  all rely on this convention; no test or shared helper pins
  it. If any consumer ever traverses inventory in a different
  order, all worn UI flips silently)
- ease: 7 (extract a `firstEquippedPerSlot(inventory)` helper
  and have all three consumers route through it; or push for
  an engine-side `equipped` flag)
- next: file iterate fix tick.
- source: inventory-surface mechanics audit 2026-05-22, row 1

### [3.0] DRIFT — `BURDEN_MAX` silently caps burden display (inventory-audit row 11)

- category: bug (chrome integrity)
- impact: 4 (a player with 60 items reads "50/50" — bar appears
  full, data lies; could mask hoarding bugs in DEV mode + just
  confuse players on real saves)
- ease: 7 (return uncapped total from `computeBurden`; render
  overflow visual treatment on the burden bar)
- next: file iterate fix tick.
- source: inventory-surface mechanics audit 2026-05-22, row 11

### [2.5] DRIFT — `readShilling` defensively reads `shilling ?? currency` (inventory-audit row 7)

- category: refactor / typing hygiene
- impact: 2 (the defensive `??` chain hides which engine field
  is actually canonical; if engine ever standardizes, the
  presenter silently picks the other)
- ease: 8 (check engine `Character` type, pick canonical field,
  drop `as any` cast)
- next: file iterate fix tick.
- source: inventory-surface mechanics audit 2026-05-22, row 7


- category: docs / quality (project coherence)
- impact: 7 (inventory has the most engine-bound decisions
  per byte — equip preview, slot constraints, consumable
  semantics, drop logic — but is a lower-traffic surface
  than combat/event)
- ease: 5 (research-heavy — `inventory.tsx`, the inventory
  presenter, equip/replace/drop actions, modal logic; trace
  against engine equip-slot rules, `useConsumable`,
  `templateToEquipment`)
- next: file as iterate tick. Deliverable:
  `docs/mechanics-ui-audit-2026-05-22-inventory.md`.
- source: oversight 27th (2026-05-22)

### [3.2] Phase 65 diagnostic strip + COMBAT_DEBUG_PICKUP.md delete (ungated 2026-05-21 oversight 26th)

- category: refactor / housekeeping
- impact: 4 (8 diagnostic streams + 1 toast + 1 brief file linger
  in main; modest noise, no behavior impact)
- ease: 8 (mechanical delete pass across 3 files)
- **Ungated 2026-05-21 oversight 26th** — `[9.5]` Next Round
  closed (user-confirmed combat "MOSTLY as expected"). Loop
  can ship this whenever an iterate tick picks it up. Strip
  scope:
  - `state/presenters/combat.engine.ts` — diagnostic logs
    already stripped in Phase 65 Tick A.
  - `app/(tabs)/combat.tsx` — `[combat] onPickStance fired:`,
    `[combat] phase after setCombatPhase:`, `[combat]
    onPickAction fired:`, `[combat] phase after resolveRound:`,
    `[CombatPanel.render] vm.phase=`, `[combat]
    onContinueRound fired —`, the four
    `[combat] onContinueRound branch=` lines, plus the
    diagnostic toast on stance/action taps.
  - `state/actions.ts` — `[actions.resolveRound] entry`,
    `calling updateCombat`, `post-updateCombat`.
  - Delete `plan/COMBAT_DEBUG_PICKUP.md` in the same commit.
- source: Phase 65 close-out (filed 2026-05-21); ungated
  oversight 26th

### [5.9] User-enablement playtest runbook (let Claude drive the live app)

- category: docs / workflow (high impact — unblocks
  loop-driven self-testing)
- impact: 9 (today the loop ships fixes blind; user has to
  run a preview build and paste console output for every
  retest cycle. A runbook that lets Claude drive
  `expo start --web` via Playwright MCP closes the loop —
  next bug surfaces in a Claude session, gets fixed, gets
  verified, all in one turn)
- ease: 6 (write `setup/04_claude_playtest.md` mirroring
  `setup/02_eas.md` shape; verify the workflow in a Claude
  session by walking through it end-to-end against the
  current app)
- next: file as next iterate tick. Concrete deliverables:
  1. `setup/04_claude_playtest.md` — ELI5 step-by-step. Cover:
     prereqs (pnpm install, expo cli), `pnpm web` invocation,
     the URL it serves on (typically http://localhost:8081),
     how to leave the server running in a separate terminal so
     Claude's bash isn't blocked, how to confirm Claude can
     reach it (`mcp__playwright__browser_navigate` smoke test),
     and how to wind down cleanly.
  2. Verify the workflow during the same iterate tick — start
     the server in a background bash, navigate via Playwright,
     drive through an encounter (walk → FIGHT → stance → action),
     screenshot key states, confirm the workflow works
     end-to-end. The runbook gets a "verified by Claude on
     <commit-sha>" line.
  3. Followup row: once verified, a recurring iterate-style
     "playtest tick" can be added to /march's repertoire
     (drive a fresh encounter every N ticks, flag any visible
     regression).
- source: user 2026-05-21 oversight 26th (direct request):
  "If it doesn't exist already give me a document to walk me
  through step-by-step (ELI5) to provide you the ability to
  walk through the gameplay to fully test things yourself"

### [3.7] Mechanics-vs-UI logic consistency audit — combat surface ✅ (combat done; event/exploration/inventory deferred)

- Resolved 2026-05-21 for the combat surface via
  `docs/mechanics-ui-audit-2026-05-21-combat.md`. 11 decisions
  audited; 6 ALIGNED, 2 MOBILE-ONLY by design, 3 DRIFT (one
  MED, two LOW). Drift sub-rows filed below (rows [5.0], [3.0],
  [2.5]). Other surfaces (event / exploration / inventory)
  scoped out of this tick — file as separate audit ticks if
  the user wants them.

### [5.0] DRIFT — stance advantage chips ignore effect-driven advantage modifiers (`resolveEffectiveAdvantage`) ✅

- category: bug (combat UX, presenter)
- impact: 7 (the ADV / DIS chip on a stance card can mislead
  the player when they carry any effect with advantage
  grants/denies; the actual roll inside `resolveCombatRound`
  uses `resolveEffectiveAdvantage` and may invert the chip)
- ease: 7 (thread `player.effects` into `buildStanceOptions`;
  call engine's already-public `resolveEffectiveAdvantage(raw,
  effects, stanceKey)` per option)
- next: file iterate fix tick. See
  `docs/mechanics-ui-audit-2026-05-21-combat.md` row 4 for
  the full citation + fix proposal.
- source: mechanics-vs-UI audit 2026-05-21

### [3.0] DRIFT — HUD HP fallback can briefly show stale out-of-combat HP

- category: bug (combat UX, hud)
- impact: 4 (post-combat aftermath window shows out-of-combat
  HP rather than the post-combat HP; impact small today
  because exploration doesn't display HP and the character
  tab is hidden during combat)
- ease: 8 (one-line action-layer change in `endCombat`: copy
  `state.combat.player.health` to `state.player.health` before
  clearing the combat slice)
- next: file iterate fix tick. See
  `docs/mechanics-ui-audit-2026-05-21-combat.md` row 11.
- source: mechanics-vs-UI audit 2026-05-21

### [2.5] DRIFT — `playerChoice.skillId` typed via `as any` cast at three sites

- category: refactor / typing hygiene
- impact: 2 (no behavior change; cast hides any future engine
  field rename)
- ease: 7 (declare a mobile-extended `MobileCombatState` shape
  in `state/store.ts`, drop the three `as any` casts in
  `state/actions.ts`)
- next: file iterate fix tick. See
  `docs/mechanics-ui-audit-2026-05-21-combat.md` row 10.
- source: mechanics-vs-UI audit 2026-05-21



> **User-direct report 2026-05-21 (latest preview build):** four
> combat-mechanics bugs blocking playability. Filed at HIGH
> severity; user-source +0.5 bump applied per iterate §4.

### [9.5] Combat regression — "Next Round" exits / completes combat even with no damage done ✅ (likely closed; user-confirmed combat "MOSTLY as expected")

- Resolved 2026-05-21 (oversight 26th call). User report:
  "Okay, so combat is now working MOSTLY as expected." User
  speculates remaining oddness may be enemy-strength tuning
  rather than a vm-staleness bug. The `onContinueRound`
  diagnostics in `b76303e` were never narrowed because the
  bug stopped reproducing — likely an artifact of testing
  earlier-than-Tick-A bundles. Diagnostic stream now safe to
  strip (see `[3.5]` row below — no longer gated).
- Re-open and file fresh narrowing tick if the symptom returns
  in a future preview build.


### [9.5] Combat regression — "MP" label still appears in player HP/MP bars ✅

- Resolved 2026-05-21 in Phase 65 Tick C-partial. Audit found the
  user-reported "MP" bars had already been dropped pre-Phase-65:
  `components/StatusCard.tsx` dropped its mana bar (Phase-62
  bug-sweep, header comment 20-24); `app/(tabs)/combat.tsx`
  `PlayerHud` dropped its mana bar (line 411-415, same sweep).
  The only remaining `MP` literal lived in the skill picker's
  cost row (`{s.manaCost} MP` at combat.tsx:878); this commit
  renames it to lowercase `mana` to match the surrounding
  voice register (`cost` label is lowercase).

### [9.8] Combat regression — `selectCombatViewModel` returns stale `vm.phase` despite fresh `combat.phase=resolving` input (NARROWED, ready-to-fix)

- category: bug (combat blocking, presenter layer)
- impact: 10 (combat completely non-functional — engine
  mutates correctly but screen never sees `vm.phase`
  transition out of `choosing_action`)
- **Root cause confirmed 2026-05-21 oversight 25th call** from
  user-pasted diagnostic output (build `48ab19d` after
  diagnostics in commits `4adb97a` + `48ab19d`):
  ```
  [actions.resolveRound] post-updateCombat store combat=
    {phase=resolving, enemy.hp=60, player.hp=6}
  [useCombatViewModel.hook] inner combat.phase= resolving
  [useCombatViewModel.memo] RECOMPUTING — combat.phase= resolving
  [useCombatViewModel.return] vm.phase= choosing_action   ← STALE
  [CombatPanel.render] vm.phase= choosing_action
                       engine.combat.phase= resolving
  ```
  Engine mutates fine. `useGameState` returns the fresh
  `combat` slice. `useMemo` recomputes on the fresh input.
  But the value returned out of the memo is `vm.phase =
  choosing_action`. That means the bug is **inside
  `selectCombatViewModel(state, localUi)`**: given a
  `combat.phase=resolving` input it still emits
  `vm.phase=choosing_action`. Either the selector reads phase
  from the wrong field (`localUi` overrides? a stale snapshot
  captured at hook init?) or the phase-to-vm-state mapping
  has a missing case for `'resolving'`.
- Rules out: A (layout — scroll fix didn't change symptom);
  B (provider scope — inner `combat.phase` matches outer); D
  (engine no-op — `resolveRound` post-update store shows
  `phase=resolving` and damage applied).
- next: open `state/presenters/combat.engine.ts:selectCombatViewModel`
  and trace how `vm.phase` is computed. Look specifically for
  (a) a `localUi`/closure capture pinning phase at hook init
  time; (b) a switch/map that doesn't handle `'resolving'`
  and defaults to `'choosing_action'`; (c) any reference to
  `playerChoice.action` that gates the phase output.
- ship-in: **Phase 65 — combat regression cluster diagnostic
  (filed 2026-05-21 oversight 25th)**. Same root cause likely
  drives the [9.5] action-selection-has-no-effect row;
  diagnostic phase covers both plus the modal-closes-early
  row.
- source: user 2026-05-21 (preview build, 3x; latest with
  inner-vs-outer diagnostics)

### [9.8] Encounter UX — keep entire encounter inside the modal (PROMOTED → Phase 63)

- category: bug (UX architecture)
- impact: 10 (user-stated top priority: "KEEP the full
  encounter inside the modal, the user cannot exit the modal
  until the encounter is resolved. Keep it all living inside
  the same modal opened during the encounter trigger")
- **promoted 2026-05-21 oversight 23rd → Phase 63 parent +
  4 sub-phases:**
  - 63a — extract combat UI into reusable `<CombatPanel>`
  - 63b — mount `<CombatPanel>` inside `EncounterModalOverlay`
  - 63c — wire aftermath dismissal in the modal
  - 63d — retire the standalone `/combat` route
- See `plan/steps/01_build_plan.md` for the full sub-phase
  briefs.
- source: user 2026-05-21 (preview build)

### [9.5] Combat regression — Heart appears pre-selected; there is no default/starting stance (RE-DIAGNOSED 2026-05-21 oversight 25th)

- category: bug (combat UX, default-state leak)
- impact: 8 (player misreads pre-highlighted Heart as
  "already selected" or "unselectable"; combat onboarding
  confusing)
- **Re-diagnosed 2026-05-21 oversight 25th call** from
  user clarification: "the heart select is just the default
  choice. That needs to go away. There's no default/starting
  stance." Earlier reports of "Heart cannot be selected"
  were a misread — Heart IS selectable, but it appears
  pre-selected on entry to a fresh combat, which made it
  look unresponsive (tapping it didn't visibly change
  anything, because it was already "the selected one").
- attempted fixes (now believed unnecessary):
  - `pointerEvents='none'` on StanceGlyph wrapper (commit
    `602e680`) — root cause was misread, not a hit-test
    bug. The fix can stay (defensive) or be reverted.
- next: open `state/presenters/combat.engine.ts` +
  `app/(tabs)/combat.tsx`; find where the initial
  `selectedStance` defaults to `'heart'` or where Heart's
  card receives the `selected: true` styling on phase
  `choosing_stance` with no stance committed. Required
  state: no stance card carries the selected visual until
  the player picks one.
- ship-in: **Phase 65 — combat regression cluster diagnostic
  (filed 2026-05-21 oversight 25th)**.
- source: user 2026-05-21 (preview build, twice + clarification
  via oversight 25th)

### [9.5] Combat regression — Action selection has no effect (LIKELY-DUPLICATE of [9.8])

- category: bug (combat blocking)
- impact: 10 (combat completely unusable — player can pick
  ATTACK/DEFEND/SKILL/ITEM but nothing happens)
- **Re-diagnosed 2026-05-21 oversight 25th call:** user's
  diagnostic output confirms `onPickAction` → `resolveRound`
  fires AND mutates `combat.phase=resolving` + enemy.hp,
  but `vm.phase` stays `choosing_action`. So actions DO
  have effect on the engine state — the symptom is that
  the screen never re-renders to reflect that effect. Same
  root cause as [9.8] above (`selectCombatViewModel` returns
  stale `vm.phase`). Likely closes when [9.8] closes.
- ship-in: **Phase 65 — combat regression cluster diagnostic
  (filed 2026-05-21 oversight 25th)**. Will be marked
  `[duplicate of [9.8]]` and closed at Phase 65 land if the
  hypothesis holds.
- source: user 2026-05-21 (preview build, twice now)

### [9.5] Combat regression — Encounter modal closes before resolution

- category: bug (combat blocking)
- impact: 8 (player must pick FIGHT/FLEE; modal dismissing
  early leaves the encounter unresolved + the map in an
  inconsistent state)
- ease: ? (likely modal mount-condition issue —
  `EncounterModalOverlay` mounts on `vm.kind === 'combat-prelude'`
  but unmounts on some race)
- next: trace EncounterModalOverlay's `vm.preludeChrome === null`
  guard. The overlay returns early if preludeChrome is null;
  if anything in the pending-event slice gets cleared before
  the player picks, the modal vanishes. Possibly related to
  Phase 60b's `Encounter.enemy → enemies[0]` migration, or
  Phase 40's `selectHasActivePacedEvent` filtering.
- ship-in: **Phase 65 — combat regression cluster diagnostic
  (filed 2026-05-21 oversight 25th)**.
- source: user 2026-05-21 (preview build)

## Done

### [3.2] `components/Splatter.tsx` colocated test coverage ✅
- Resolved 2026-05-21 (commit `9eb3359`). Added 6 hermetic
  cases pinning circle count (29 = main + 28 droplets),
  determinism (same seed → identical positions), and prop
  passthrough (size, color). 865/865 green at land (+6 over
  859).

### [3.5] `components/ScreenBg.tsx` colocated test coverage ✅
- Resolved 2026-05-21 (commit `b77378b`). Added 6 hermetic
  cases pinning children-pass-through and the `scrollable`
  prop branch (default → ScrollView; false → fixed View;
  scroll indicator hidden). 859/859 green at land (+6 over
  853).

### [4.5] Drain 32 lint warnings introduced by Phase 60f + Phase 61 ✅
- Resolved 2026-05-21 (commit `ab2c0d7`). `npm run lint --
  --fix` across 16 files removed ~25 unused
  `eslint-disable-next-line` directives + 4 `ReadonlyArray<T>`
  → `readonly T[]` style fixes. Lint 0 warnings (was 32);
  tsc clean; jest 853/853 unchanged.

### [3.2] `components/MindMark.tsx` colocated test coverage ✅
- Resolved 2026-05-21 (commit `fb83c43`). Added 6 hermetic cases
  pinning the null-render branch (default / explicit 0 /
  negative) and the badge render branch (SVG circles + 'MARK ×N'
  text reflects stacks). 853/853 green at land (+6 over 847).

### [3.6] `components/NodeMark.tsx` colocated test coverage ✅
- Resolved 2026-05-21 (commit `806a0c4`). Added 7 hermetic cases
  pinning kind → SVG branch (skull / X / sulfur ring /
  parchment ring) and the size-prop passthrough across every
  kind. 847/847 green at land (+7 over 840).

### [3.2] `components/EffectGlyph.tsx` colocated test coverage ✅
- Resolved 2026-05-21 (commit `82f3314`). Added 10 hermetic
  cases pinning kind → SVG branch resolution (one per known
  kind, asserts Path count) and default-case fallback to a
  styled placeholder View. 840/840 green at land (+10 over
  830).

### [3.5] `components/AftermathBanner.tsx` colocated test coverage ✅
- Resolved 2026-05-21 (commit `cd7ddfc`). Added 10 hermetic
  cases pinning render shape (eyebrow/title/subtitle/rewards
  conditional, testID), accessibility (live region, label,
  announce one-shot), and the auto-dismiss timer (default
  2500ms, custom displayMs, unmount cleanup). 830/830 green
  at land (+10 over 820).

### [3.2] `components/FriendshipMeter.tsx` colocated test coverage ✅
- Resolved 2026-05-21 (commit `ebd1fe1`). Added 9 hermetic cases
  pinning heart count, fill semantics, counter text, and the
  compact label-toggle. 820/820 green at land (+9 over 811).

### [3.5] `components/EffectChip.tsx` colocated test coverage ✅

- Resolved 2026-05-21 (commit `ec927b7`). Added
  `components/__tests__/EffectChip.test.tsx` with 11 hermetic
  cases pinning color-map, tint-map, duration / intensity
  conditional rendering, and the dim opacity branch. 811/811
  green at land (+11 over 800).

### [Done 2026-05-20] `axiomancer-mechanics@0.10.2` adopted; surface drift drained ✅

- category: external-dependency (engine package)
- source: cross-repo versioning audit (integrated 2026-05-15)
- **Resolved 2026-05-20** with Phase 60f (commit `a6cd028`).
  The engine published 0.10.2 mid-cycle with 9 breaking surface
  changes (`getCoastalMap` removed; `Encounter.enemy` → `enemies[0]`;
  `DialogueChoice` / `DialogueNode` flattened; `Character.mana`
  removed; `ActiveEffect` shape change + latent `composeHazard` bug;
  `GameStore` ↔ `AppStoreState` strictness; `EffectStatTarget`
  literal union; `MobileNotificationsSlice` `toast` required;
  `GameState` lost string index signature). Mobile migrated the
  drift across **Phases 60a–60f**: 60a (`baf66fa`), 60d (`579a6a7`),
  60b (`0ee7f63`), 60c (`7e29be5`), 60e (`8596409`), 60f
  (`a6cd028`). Lockfile pin now at 0.10.2; verify gate green at
  760/760. Upgrade doc at `docs/engine-upgrade-0.10.0-to-0.10.2.md`.
- handoff doc: [`docs/engine-team-handoff-2026-05-16.md`](../docs/engine-team-handoff-2026-05-16.md)
  (historical context for the original three engine asks; all
  resolved at engine Phase 50 / GH#64 closing comment).

### [needs-user-call] Phase 32 — port-commit ambiguity RESOLVED ✅
- Resolved 2026-05-16 via `/oversight`. The prior oversight pass
  filed this row when the user thought a port commit had landed
  under a different name but the loop couldn't locate it. Since
  then, commit `ff37b46`
  ("feat: tabs + event combat-prelude — port from the design
  handoff") landed as the canonical Phase 32 port, and
  `08bcf5e` shipped its `spec32 tick A` presenter follow-up.
  Phase 32's detect-and-defer dispatch rule now has a real
  reference point; no more ambiguity. Row closed.

### [paused] Phase 33 — MEMOIR tab paused after ticks A + B — RESUMED ✅
- Filed 2026-05-16 via `/oversight` after the user paused
  Phase 33 mid-flight (ticks A `6515cb5` + B `2f70eac` shipped;
  C alignment + D chronicle remained). Resumed 2026-05-16 via a
  later `/oversight` pass: the paused note is removed from the
  build plan, Phase 33's row goes back to active `[ ]`, and
  `/march` picks Phase 33 up again on the next tick.

### [9.5] Tab labels rendering as `{ TAB NAME }"--index"` literally ✅
- category: tests / bug
- source: user report during oversight 2026-05-16
- **Resolved 2026-05-16** via Phase 30 Tick B (commit `ab9f646`).
  Source `_layout.tsx` already carried correct strings; defensive
  fix layered two contracts: `TAB_TITLES` presenter constant
  (state/presenters/tabs.engine.ts) + explicit `tabBarLabel:` on
  every `<Tabs.Screen>` (the documented expo-router escape
  hatch). Strings later flipped to the all-places register via
  Phase 31 (`542f7c9` — `WILDS · STRIFE · SELF · SACK`). Live
  tab-bar verification waits on the next manual EAS preview
  build.

### [9.0] Combat encounter screen is rendering blank ✅
- category: tests / bug
- source: user report during oversight 2026-05-16
- **Resolved 2026-05-16** via Phase 30 Tick C (commit `fb53af0`).
  The `!vm.isInCombat` loading branch returned an empty
  `<View />` placeholder; replaced with visible
  `<Text>{vm.loadingMessage}</Text>` rendering 'the field
  stirs.' (lowercase ritual, uppercased via `textTransform`).
  Tick C added the loadingMessage field to CombatViewModel +
  populated both code paths + pinned the contract with a
  hermetic test. Verify 410/410.

### [9.0] Character tab is crashing on the deployed build ✅
- category: tests / bug
- source: user report during oversight 2026-05-16
- **Resolved 2026-05-16** via Phase 30 Tick A (commit `5e24706`).
  Diagnosed by the new smoke-render harness on its first run:
  `useGameState(selectCharacterViewModel)` was churning
  `useSyncExternalStore` because the presenter returned a
  frozen-new object every call (same pattern previously fixed
  in event screen). Refactored to slim-slice
  `useGameState((s) => s.player)` + `useMemo` the VM. Verify
  401/401 at Tick A close.

### [voice] Revise `app/(tabs)/combat.tsx:122` — "Thy hands are empty." → no second-person archaic pronouns ✅

- category: voice (bearings compliance)
- source: oversight 2026-05-15; bumped 2026-05-15
- issue: #38
- **Resolved 2026-05-15.** `setToast('Thy hands are empty.');` → `setToast('Hands are empty.');` per the original /oversight option-description. Verify green at 357/357. Closes #38. See commit `85e9078`.

### [design-source] Token Crucible (commit `261a238`) — design lives in Claude Design ✅

- category: process (loop visibility)
- source: `/oversight` 2026-05-15
- **Resolved 2026-05-15.** User confirmed the Token Crucible design (and the broader upstream design source for handoffs like it) lives in **Claude Design** at: <https://claude.ai/design/p/019e0f5a-a0f0-753b-be1e-8939e6011384>. Reference added to `plan/bearings.md` under "External services". Future `feat: <X> — port from design handoff` commits should land alongside a candidate row before shipping, and `/plan-a-phase` reads this URL when a design handoff is referenced.

### [needs-user-call] Phase 6 (Spec 08 — Event screen wiring) — RESOLVED ✅

- **Resolved 2026-05-15.** Phase 6 shipped end-to-end across
  four sub-tick commits: `2c4d2b0` (presenter + store slice),
  `31e42f0` (action layer), `beba7d4` (screen refactor),
  `87d0b4c` (close-out). The five product questions were
  already answered in the spec body (A / C / B / Future spec /
  Yes); the `[skipped]` rationale was stale and got flipped
  via `/oversight` earlier today. Spec 08 marked DONE at H1.
  Verify green at 321/321.



### [3.5b] Visual-smoke pipeline — `smoke-screens.mjs` + baseline workflow ✅

- proposed: 2026-05-15 (shipped silently in commit `796d7b7`
  "Add smoke" before being tracked here — filed retroactively
  via `/oversight` 2026-05-15 per user direction)
- category: tests (coverage gap — visual regression, sibling
  to the [3.5] bundler smoke)
- impact: 4 (catches rendered-output regressions the bundler
  smoke can't see: layout shifts, asset drift, theme breakage;
  works hand-in-hand with the export-time smoke from [3.5])
- ease: 4 (Playwright-driven; baseline-approve flow + diff
  artefacts; opt-in like its bundler-smoke sibling)
- **Resolved 2026-05-15.** Two-part landing in commit `796d7b7`:
  - **(script)** `scripts/smoke-screens.mjs` (350 lines) drives
    `expo export --platform web` then snapshots a configured
    screen list, comparing against committed
    `screenshots/baseline/*` PNGs. `scripts/baseline-approve.mjs`
    promotes `screenshots/current/` over the baselines after
    review.
  - **(test)** `scripts/__tests__/smoke-screens.test.ts` (180
    lines) covers the hermetic helpers (argument building, diff
    classification, exit-code contract).
  - **(.gitignore)** `screenshots/baseline/` committed; ephemeral
    `screenshots/current/`, `screenshots/diff/`, `.smoke-dist/`
    ignored (this commit).
- residual / follow-ups (iterate-shaped, not blocking):
  - Not yet wired into `.github/workflows/verify.yml` —
    Playwright + a real export is heavier than the [3.5] bundler
    smoke; CI wiring deserves its own audit row if/when needed.
  - Baseline coverage starts small (see
    `screenshots/baseline/README.md` for the seeded surface list).

### [3.5] Add a bundler smoke test (boot Expo + curl `/` + assert 200) ✅

- proposed: 2026-05-14, filed via `/oversight` from user note
  `missing-e2e.md` (now archived into this finding)
- category: tests (coverage gap — environmental, not unit)
- impact: 5 (today's hermetic Jest suite cannot detect Metro /
  Expo bundler regressions: favicon/manifest middleware,
  filesystem-cache permission failures, asset-pipeline breakage.
  The next time the bundler fails to boot, nothing flags it
  before a user hits the symptom — exactly how the
  2026-05-14 `EACCES` cache-dir incident surfaced)
- ease: 4 (small Node script + CI workflow; needs to run
  outside Jest because Metro spawns its own workers)
- source signal: `missing-e2e.md` user note (archived into this
  row 2026-05-14 — original file deleted from working tree)
- **Resolved 2026-05-15.** Two-part landing:
  - **(script + hermetic test)** `scripts/smoke-bundler.mjs`
    runs `expo export --platform web` against a tmp output dir,
    then asserts `index.html` lands with a non-trivial byte
    count. Exit contract mirrors `deploy-check.mjs` (0 ok /
    1 failed / 2 timeout / 3 config). Hermetic helpers
    (`buildExportArgs`, `classifyExportResult`) covered by
    `scripts/__tests__/smoke-bundler.test.ts`. Wired as an
    opt-in `npm run smoke:bundler` — deliberately not part of
    `pnpm verify` because a real export takes 30–60 s.
  - **(CI wiring)** `.github/workflows/verify.yml` runs both
    `npm run verify` and `npm run smoke:bundler` (with an
    8-minute timeout via `SMOKE_BUNDLER_TIMEOUT_MS`) as parallel
    jobs on every push to `main` and every PR against `main`.
    Optional follow-up the loop cannot do itself: turn the
    `verify` job into a required status check via branch
    protection (Settings tab).

### [3.8] Drain 8 lint warnings (unused imports + stale eslint-disable) ✅

- **Resolved 2026-05-13.** See commit `5c32f87` (issue #11).
  Trimmed unused `ScrollView`, `Defs`, `RadialGradient`, `Stop`,
  `Line` (×2), `G` imports across the 5 component / screen
  files; removed the now-stale `// eslint-disable-next-line
  no-console` in `app/_layout.tsx:48`. `npm run verify` clean
  (lint 0/0, typecheck clean, 209/209 tests pass).

### [needs-user-call] Confirm hosting / deploy contract ✅

- **Resolved 2026-05-13.** User provisioned `.env` (gitignored,
  verified) with `EXPO_ID` + `EXPO_TOKEN`. The `EXPO_ID`
  (`9c04…`) matches the `projectId` already hardcoded in
  `app.json:59` under `extra.eas.projectId`, so the build will
  resolve the right EAS project. `EXPO_TOKEN` is what
  `eas build` reads for non-interactive auth.
- `package.json` already wires the deploy gate:
  `deploy:preview` runs `verify` (currently green, 185/185)
  then `eas build --platform android --profile preview`
  against the `preview` profile in `eas.json` (Android APK,
  internal distribution).
- **Residual work (non-blocking, not user-gated):**
  (1) the `eas build` invocation needs `EXPO_TOKEN` exported
  in the shell — `.env` isn't auto-loaded by npm scripts.
  Either prefix with `dotenv -e .env --` or document the
  `export $(grep -v '^#' .env | xargs)` recipe in the runbook.
  (2) Phase 11 (asset-pipeline) is the natural home for the
  written runbook + CI secret mirror. Queue for `/iterate`.
- The loop is now safe at **L2+** for the deploy gate.

### [HIGH] Verify gate is RED — engine API drift from latest mechanics bump ✅

- **Resolved 2026-05-13.** Renamed `effect → effectId` on every
  `Consumable` literal in
  `state/actions.ts:550`,
  `state/presenters/inventory.modal.engine.ts:81`, and the three
  failing fixtures (`state/e2e/inventory.engine.test.ts`,
  `state/e2e/inventory.modal.engine.test.ts`,
  `state/e2e/inventory.screen.test.tsx`). Added
  `rarity: 'common'` + `requiredLevel: 1` to every `Equipment`
  literal in the same three fixtures.
- `npm run verify`: lint clean (7 pre-existing unused-import
  warnings, 0 errors), typecheck clean, **185 / 185 tests pass**.
- Note: the audit framed this as "mechanical renames," and it
  was — but `Consumable.effectId` is *semantically* an ID
  reference, not a free-form description. We're currently
  stuffing strings like `'Heal 6 HP'` into it so the existing
  `parseHealAmount` string-parser keeps working. A follow-up
  pass should migrate to the structured `healAmount?: number`
  field (and likely `inlineEffect?: Effect`) that the new
  mechanics package exposes. Flagged for a future `/iterate`
  pick-up — not blocking.

### [needs-user-call] Confirm canonical project name + tagline ✅

- **Resolved 2026-05-13** via defensible-default acceptance.
  Canonical name is **"Axiomancer Mobile"** (matches
  `package.json` `"name": "axiomancer-mobile"` and existing
  prose in README/specs). No code change required. Tagline
  remains the README's existing one-liner ("Expo / React Native
  client for the Axiomancer TTRPG") until product asks for
  something marketing-shaped.
- If you want a different public name, say so and I'll thread
  it through `package.json`, README, and `app.json`.

### [needs-user-call] Confirm GitHub PAT scope for `/triage` ✅

- **Resolved 2026-05-13** via defensible-default acceptance:
  do nothing for now. `/triage` exits cleanly when `GH_TOKEN`
  is unset, so the loop is safe. Re-open this item when you
  actually want `/triage` to start labeling issues; the recipe
  is unchanged (fine-grained PAT with Issues:RW + Metadata:R on
  `no-trbl-2-u/axiomancer-mobile`, set `GH_TOKEN` + `GH_REPO`
  in `.env`).

### [low] README references missing companion docs ✅

- **Resolved 2026-05-13.** Removed the three broken pointers
  (`Knowledge-Gaps.md`, `BRAINDUMP.md`, `GAME-ROADMAP.md`) from
  `README.md`. If you want any of those docs authored later,
  re-open as its own item — I didn't speculate about content
  the user hasn't asked for.

### [low] Spec 07 (Exploration) shipped but not flipped `[DONE]` ✅

- **Resolved 2026-05-13.** Added `[DONE on 2026-05-13 — see
  commit 06fc907]` under the H1 in
  `specs/07-exploration-screen-wiring.md`, matching the
  convention used in Spec 06.
