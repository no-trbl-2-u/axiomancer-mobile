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

### [3.15] Phase 70/71 stale refs + missing test-doc entries ✅ (drained `ca77530`)

### [3.0] Engine-dup — 5 lowercase-roman helpers across presenters + panel ✅ (drained — consolidated to `state/presenters/roman.ts`)

- category: refactor (engine-dup)
- impact: 5 — 5 functions, 3 distinct shapes, with one of them already carrying a "Duplicates `combat.engine.ts::toRoman` rather than depending on…" acknowledgment comment in `state/presenters/event.engine.ts:337`. Consolidating extends the closed `[3.0]-[3.5]` engine-dup audit series (`StanceKey`, `MAX_EFFECTS_SHOWN`, debug-seed equipment slot list).
- ease: 6 — proper Roman algorithm in a new shared util; 5 mechanical call-site rewrites; tests confirm round-tokens still render as strings (existing test pins are typeof-only, not value-pinned, so the "n ≥ 11 → 'xi'" improvement is non-breaking).
- next: ship — new `state/presenters/util/roman.ts` exporting `toRomanLower(n, fallback?)`; refactor the 5 callers; small hermetic test pin for the new util.
- callers to drain:
  - `state/presenters/combat.engine.ts:830-836` — `ROMAN` array + `toRoman()` lookup
  - `state/presenters/combat.codex.engine.ts:22-30` — `ROMAN_LOWER_CODEX` array + `toRomanLowerCodex()` lookup
  - `state/presenters/event.engine.ts:337+` — duplicate self-acknowledged
  - `state/presenters/encounter-seal.engine.ts:50` — proper algorithm with `·` fallback (Phase 71)
  - `components/event/aftermath/CombatDefeatPanel.tsx:44` — proper algorithm with `·` fallback (Phase 70 Tick C)

- category: tests (doc) + refactor (stale comments)
- impact: 4.5 — `docs/E2E_INVENTORY.md` is the canonical test-coverage map (the doc /iterate audits read against); a stale row + 6 missing files means future audits read the wrong picture. Stale comments in shipped code mislead the next reader about which fallback path is live.
- ease: 7 — text edits only; no code-logic changes.
- next: drain — fix `app/(tabs)/combat.tsx:259` (claims AftermathBanner is the parley fallback, but Tick B retired the banner); fix the doc-block in `state/presenters/aftermath.engine.ts` line 145 (still talks about the legacy banner as the parley render path); update `docs/E2E_INVENTORY.md` row 51 (drop `selectAftermathCopy` from the description, refresh counts) + add 6 new aftermath-related test-file rows.

### [5.5] Combat HUD HP scaling mismatch — exploration card shows 22/38, combat HUD shows 10/10 ✅ (root cause + fix shipped)

**Root cause (investigated 2026-05-22):** the exploration card's
`<StatusCard />` was rendered with NO props, so it displayed the
component's default placeholder values
(`name='WORM-EATEN PILGRIM', level=7, hp=22, hpMax=38`). The
combat HUD's `10/10` was the REAL `state.player.health /
maxHealth`. Not an HP scaling mismatch — the exploration card
was never wired to engine state.

**Fix:** `StatusCard` now reads from engine `state.player` via
`useGameState`. Props win when explicitly passed (preserves the
test-fixture override path). Tests rewritten to use
`withAllProviders`. Component tests refreshed.

Prior text preserved below for traceability:

- category: bug (combat numbers / player trust)
- impact: 8 (player sees `HP 22/38` walking the map; tap an
  encounter → combat HUD reads `HP 10/10`. The mismatch is
  not explained anywhere; player would reasonably ask "where
  did 28 HP go?" or "which number is real?")
- ease: ? (root cause investigation needed)
- next: file iterate tick. Investigation paths:
  - (a) engine `startCombat` may compute combat.player.health
    from derived stats with a different formula than
    out-of-combat (e.g. `combat.player.maxHealth = Math.floor
    (player.maxHealth / 4)`)
  - (b) the combat HUD reads from a different source than the
    exploration card — one reads `state.combat?.player ?? state
    .player`, the other reads `state.player` only
  - (c) `combatBegin` may reset to combat-only baseline
    rather than carrying over `state.player.health`
- observed: live-drive playtest 2026-05-22 (oversight 28th call).
  - exploration card: `HP 22/38` (`state.player.health` /
    `.maxHealth`)
  - combat HUD: `HP 10/10` (`combat.player.health` /
    `.maxHealth`)
  - level 7 character, fresh combat against MOURNFUL GULL
    (level 2, 60 hp)
- source: live-drive playtest (oversight 28th call)

### [2.5] Three console deprecation warnings from web bundle (LOW)

- category: tests / tech-debt
- impact: 2 (deprecation warnings, not errors; will become
  errors in a future React Native / Expo version but not
  today)
- ease: 5 (the warnings reference text/style prop name
  changes — `textShadow*` → `textShadow`, `shadow*` →
  `boxShadow`, `props.pointerEvents` → `style.pointerEvents`.
  All three originate from transitive Expo / RN dependencies
  per the stack trace, not mobile code; mostly waiting on
  an upstream release to suppress)
- observed: live-drive playtest 2026-05-22 — 3 warnings on
  every page load. Zero errors.
- next: tracking only; revisit when Expo SDK ships a fix.
- source: live-drive playtest (oversight 28th call)

### [3.0] DRIFT — character Equipment slot labels `'Accessory'` (not `'Trinket'`) — cross-tab vocabulary mismatch ✅

- category: bug (chrome / cross-tab consistency)
- impact: 5 (player sees `Accessory` on SELF tab; same slot
  reads `TRINKET` on SATCHEL tab Equipment Dock. Inconsistent
  vocabulary across the same player's gear interaction)
- ease: 8 (align `SLOT_LABELS.accessory` to `'Trinket'` in
  `state/presenters/character.engine.ts:156-164`, matching
  the inventory dock + chat 1 spec)
- next: file iterate fix tick.
- source: character-surface mechanics audit 2026-05-22, row 9

### [2.5] DRIFT — `(player as any).effects` cast in character presenter ✅

- category: refactor / typing hygiene
- impact: 2 (engine `Character.effects: ActiveEffect[]` typed
  cleanly; cast is stale holdover)
- ease: 8 (drop cast; one-line presenter edit)
- next: file iterate fix tick.
- source: character-surface mechanics audit 2026-05-22, row 4

### [2.5] DRIFT — `(state as any).philosophicalAlignment` cast + dead fallback ✅

- category: refactor / typing hygiene
- impact: 2 (Phase 51 migration v2→v3 backfills the field on
  every persisted save; the defensive fallback covers only
  sparse test fixtures that shouldn't exist)
- ease: 8 (drop cast + fallback; one-line presenter edit)
- next: file iterate fix tick.
- source: character-surface mechanics audit 2026-05-22, row 6

### [2.5] DRIFT — `buildEffects(player)` called 3x in same return object ✅

- category: refactor (perf / brittleness)
- impact: 2 (negligible cost today; redundancy becomes
  brittle if buildEffects extends to engine library reads)
- ease: 8 (lift to single `const effects = buildEffects(player);`
  call; reference `effects.length` in the a11y branch)
- next: file iterate fix tick.
- source: character-surface mechanics audit 2026-05-22, row 10

### [3.0] DRIFT — `(e.payload as any)` casts in memoir chronicle event mapper ✅

- category: refactor / typing hygiene
- impact: 3 (bypasses engine's typed-event-payload guarantees
  from `is*Event` guards; surfaces would catch payload-shape
  changes if typing were intact)
- ease: 5 (bigger than a one-line drop; some chained reads
  go deeper than the engine's typed payload shape and need
  narrower extension types)
- next: file iterate fix tick.
- source: memoir-surface mechanics audit 2026-05-22, row 4

### [2.5] DRIFT — `selectMemoirViewModel(state: GameStore)` should widen to AppStoreState to drop `_recentEvents` cast ✅

- category: refactor / typing hygiene
- impact: 2 (mobile `_recentEvents` is honestly outside engine
  GameStore; widen the param type so the cast disappears)
- ease: 7 (one-line signature swap + import)
- next: file iterate fix tick.
- source: memoir-surface mechanics audit 2026-05-22, row 1

### [2.5] DRIFT — `(state as any).quests` cast in memoir presenter ✅

- category: refactor / typing hygiene
- impact: 2 (engine `GameState.quests: QuestLog` typed cleanly;
  cast is stale)
- ease: 8 (drop cast; import `QuestLog`)
- next: file iterate fix tick.
- source: memoir-surface mechanics audit 2026-05-22, row 2

### [2.5] DRIFT — `(state as any).moralMeter` cast in memoir presenter ✅

- category: refactor / typing hygiene
- impact: 2 (engine `GameState.moralMeter: number` typed cleanly)
- ease: 8 (drop cast; one-line)
- next: file iterate fix tick.
- source: memoir-surface mechanics audit 2026-05-22, row 3

### [2.5] DRIFT — `(q: any)` / `(o: any)` quest + objective casts in memoir presenter ✅

- category: refactor / typing hygiene
- impact: 2 (engine `Quest` / `QuestObjective` typed cleanly;
  the `synthesizeObjectiveText` helper may need a narrower
  extension type for fields not on engine's QuestObjective)
- ease: 6 (drop casts; type properly; may surface fields
  not on engine shape)
- next: file iterate fix tick.
- source: memoir-surface mechanics audit 2026-05-22, row 5

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

### [2.5] DRIFT — `(encounter as any).enemies[0]` cast in composeCombatPrelude ✅

- category: refactor / typing hygiene
- impact: 2 (no behavior change; the `as any` cast hides any
  future engine field rename)
- ease: 8 (drop the cast; `encounter.enemies` is already on
  the engine's `Encounter` type post-Phase-60b)
- next: file iterate fix tick.
- source: event-surface mechanics audit 2026-05-22, row 4

### [4.0] Mechanics-vs-UI logic audit — exploration surface ✅ (drifts filed as [3.5]/[3.0]/[3.0]/[2.5])

### [3.5] DRIFT — exploration encounter icon is `'flee'` (looks like the FLEE button) ✅

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

### [3.0] DRIFT — no test pins mobile NodeType ↔ engine event-pool registration ✅

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

### Engine duplication drain (user-jot 2026-05-22 oversight 29th)

> User asked for a list of "hardcoded values that are supposed
> to be swapped out with code from the mechanics." Found via
> repo-wide scan. Rows below are the actionable subset; rows
> already acknowledged-as-intentional (mobile-only chrome,
> Phase 60d stop-gaps, defensive defense-in-depth) are
> documented in the scan report but not re-filed here.

### [4.0] Engine-dup — `templateToEquipment` helper duplicated at 2 sites ✅

- category: refactor / engine-duplication
- impact: 6 (two parallel implementations of the same
  Equipment template→Equipment mapping; drift risk on the
  Equipment shape if engine surface evolves)
- ease: 7 (extract to `state/utils/equipment.ts` (or sibling
  to `state/selectors/equipment.ts`); both callers route
  through the shared helper)
- sites:
  - `state/actions.ts:852-862` (debug seed / loot grant path)
  - `state/exploration-maps/event-pools.ts:200-210`
    (treasure pool synthesis)
- next: file iterate fix tick.
- source: user-jot 2026-05-22 — engine-duplication scan

### [3.5] Engine-dup — `StanceKey` type re-declared in token-crucible presenter ✅

- issue: #136 (closed by this commit)
- Resolved 2026-05-22. Dropped the local `StanceKey = 'heart' | 'body' | 'mind'` re-declaration in `state/presenters/token-crucible.engine.ts`; imported `type Stance` from `axiomancer-mechanics` and re-typed all internal refs (interface field, function generics, local `STANCES` array) to use the engine union directly. No external consumer imported `StanceKey` from this module — TokenCrucible.tsx + the e2e test pull `CRUCIBLE_STANCE_ORDER` only. 1055/1055 green at land.
- category: refactor / typing hygiene (engine-duplication)
- impact: 3 (mobile re-declares the engine's `Stance` union
  as a local `StanceKey` type; future engine extension
  silently won't propagate)
- ease: 9 (one-line import swap — drop local `StanceKey`,
  import `type Stance` from `axiomancer-mechanics` and alias
  where needed)
- sites:
  - `state/presenters/token-crucible.engine.ts:32`
- source: user-jot 2026-05-22 — engine-duplication scan

### [3.0] Engine-dup — `MAX_EFFECTS_SHOWN` constant duplicated in 2 presenters ✅

- issue: #137 (closed by this commit)
- Resolved 2026-05-22. Created `state/presenters/constants.ts` with `MAX_EFFECTS_SHOWN = 4` as the single source; both `combat.engine.ts` and `combat-hud.engine.ts` now import from there. Future bumps live in one place. 1055/1055 green at land.
- category: refactor (single-source consolidation)
- impact: 3 (display-only cap; two presenters carry their
  own copy of `const MAX_EFFECTS_SHOWN = 4`. Engine has no
  opinion; consolidate to one mobile-local constant)
- ease: 8 (lift to `state/presenters/_constants.ts` (or
  similar); both presenters import)
- sites:
  - `state/presenters/combat-hud.engine.ts:6`
  - `state/presenters/combat.engine.ts:560`
- source: user-jot 2026-05-22 — engine-duplication scan

### [3.0] Engine-dup — debug seed hardcodes equipment slot list instead of using engine library ✅

- issue: #138 (closed by this commit)
- Resolved 2026-05-22. Typed the seed-slot array as `ReadonlyArray<EquipmentSlot>` (engine slot renames now tsc errors) and swapped template lookup from a hand-rolled `equipmentTemplates.find` to the engine's `getTemplatesBySlot(slot)[0]`. UX preserved: still seeds the same 3 major slots (head/body/weapon). Dropped the unused `equipmentTemplates` import. 1055/1055 green at land.
- category: refactor (engine-duplication)
- impact: 3 (debug-only path; hardcoded `['head', 'body',
  'weapon']` should iterate the engine's `equipmentTemplates`
  / `getTemplatesBySlot` so new slots auto-seed)
- ease: 7 (swap the hardcoded array for an engine library
  query; preserve the "one item per major slot" UX intent)
- sites:
  - `state/actions.ts:884` (debug seed action)
- source: user-jot 2026-05-22 — engine-duplication scan

### [2.5] Engine-dup — `STANCES` array literal in token-crucible

- category: refactor (engine-duplication)
- impact: 2 (local `STANCES: readonly StanceKey[] = ['heart',
  'body', 'mind']` array; should derive from the engine
  `Stance` union or a centralized mobile constant)
- ease: 8 (small refactor; depends on whether the [3.5]
  StanceKey type fix ships first)
- sites:
  - `state/presenters/token-crucible.engine.ts:78`
- next: file iterate fix tick after [3.5] StanceKey row.
- source: user-jot 2026-05-22 — engine-duplication scan

### [4.0] DRIFT — engine `MapDefinition` connectivity diverges from mobile layout fixture (blocks Phase 27 OPEN-set migration) — **`[needs-engine-release]`**

- **Resolution path (oversight 2026-05-22, 30th call): engine widens.** User picked option (a): the engine `MapDefinition` for `fishing-village` (and any sibling continents) gets the branching edges that the mobile layout fixture already declares. Engine becomes the documented unlock graph. Mobile follows by migrating the [3.0] row per the original oversight-29th design **after** the engine PR lands. Until then, this row stays open as `[needs-engine-release]` and the mobile loop should not pick it again.

- category: bug (engine / mobile data-source disagreement; **needs-user-call** — likely engine fix, not mobile fix)
- impact: 7 (blocks the oversight 29th OPEN-set design migration entirely; latent visual-vs-traversal mismatch — mobile draws edges the engine doesn't know exist, so engine-driven gating would hide them)
- ease: ? (engine repo edit; out of mobile-iterate scope)
- observation: discovered while attempting the [3.0] OPEN-set migration. Engine `MapDefinition` for `fishing-village` (in `axiomancer-mechanics/dist/World/Continents/Coastal-Village/maps.js:227`) declares the nodes as a strictly linear chain — `fv-2.connectedNodes = ['fv-3']`, `fv-3.connectedNodes = ['fv-4']`, etc. The mobile layout fixture (`state/exploration-maps/fishing-village.layout.ts:24`) has branching — `fv-2.connectedNodes = ['fv-3', 'fv-4']`, `fv-4.connectedNodes = ['fv-5', 'fv-6']`, and so on. The mobile fixture is the source of truth for the *visual* graph; the engine `MapDefinition` is the source of truth for the *unlock* graph the [3.0] row wants to migrate the OPEN set onto. They disagree, and the engine variant is strictly narrower.
- evidence: a direct presenter swap (`world.currentMap.availableNodes` → `discoveredNodes`) fails 4 hermetic exploration tests — fv-3/fv-4/fv-5/fv-6 fall to `locked` after their first move, because `revealAdjacent` reads from the engine's narrower connectivity graph.
- next: surface to user via `/oversight`. Likely outcomes: (a) engine MapDefinition expands to match the mobile layout's branching (preferred — engine becomes source of truth); (b) the mobile layout collapses to match the engine's linear chain (loses visual richness); (c) the OPEN-set design accepts the narrower engine graph and the user-facing visual map narrows. The [3.0] row stays BLOCKED until this is resolved.
- source: discovered while attempting [3.0] migration (`/iterate` 2026-05-22).

### [3.0] DRIFT — exploration presenter still reads legacy `availableNodes` / `completedNodes` / `lockedNodes` (exploration-audit row 1) — **BLOCKED — `[needs-engine-release]`**

- **Resolution path (oversight 2026-05-22, 30th call):** waits on the engine-widens PR (see [4.0] above). Once engine MapDefinition matches the mobile layout's branching graph, this row's `discoveredNodes` migration runs cleanly. Until the engine PR lands, this row stays open and the mobile loop should not pick it again.
- **Blocked 2026-05-22** by newly-filed [4.0] engine/mobile map-connectivity divergence (see row below). Direct migration attempt this tick (swap OPEN-set source `availableNodes` → `discoveredNodes`) failed 4 hermetic tests in `state/e2e/exploration.engine.test.ts`: fv-3 / fv-4 / fv-5 / fv-6 classify as `locked` instead of `available` because the engine `MapDefinition` for `fishing-village` declares `fv-2.connectedNodes = ['fv-3']` (linear) while the mobile layout fixture has `['fv-3', 'fv-4']` (branching). `revealAdjacent` reads from the engine, so `discoveredNodes` post-move is narrower than the visual graph the screen draws. The migration cannot ship until engine / mobile-fixture connectivity is reconciled.
- category: refactor (Phase 27 migration tail)
- impact: 5 (design semantic settled via oversight 29th;
  fixes the latent risk of engine dropping the legacy fields
  + widens OPEN to match engine's actual reveal history)
- ease: 5 (presenter migration to `discoveredNodes` /
  `consumedNodes` + corresponding moveToAction legacy-chain
  retirement; preserve `connectedNodes` for visual edges)
- **Design decision (oversight 29th call, 2026-05-22):** OPEN =
  every node ever-reachable (broader; matches engine
  `discoveredNodes`). Player will see neighbors-of-past-
  visits stay OPEN even after the player moves on; visual
  map widens accordingly. Engine semantic is the source of
  truth.
- next: file iterate fix tick. Concrete shape:
  1. Migrate `selectExplorationViewModel` to read
     `world.currentMap.discoveredNodes` for the OPEN set
     (instead of `availableNodes`).
  2. Migrate to read `world.currentMap.consumedNodes`
     where appropriate (`completedNodes` stays for the
     TRODDEN classification since "visited" is distinct from
     "event-consumed").
  3. Update the legend / "available" count to match the new
     semantic.
  4. Retire the `moveToAction` legacy `worldCompleteNode` +
     `worldUnlockNode` chain (engine `revealAdjacent` +
     `completeNode` cover it). Keep one round of dual-write
     until consumer migration verified.
  5. Pre-existing exploration test suite must be updated to
     match the new semantic (some assertions on OPEN node
     count will widen).
- source: exploration-surface mechanics audit 2026-05-22, row 1; design call via oversight 29th 2026-05-22.

### [2.5] DRIFT — `(state as any).world` cast in exploration presenter + moveToAction ✅

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

### [3.5] DRIFT — "first-equipment-per-slot = worn" convention is undeclared ✅

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

### [3.0] DRIFT — `BURDEN_MAX` silently caps burden display ✅

- category: bug (chrome integrity)
- impact: 4 (a player with 60 items reads "50/50" — bar appears
  full, data lies; could mask hoarding bugs in DEV mode + just
  confuse players on real saves)
- ease: 7 (return uncapped total from `computeBurden`; render
  overflow visual treatment on the burden bar)
- next: file iterate fix tick.
- source: inventory-surface mechanics audit 2026-05-22, row 11

### [2.5] DRIFT — `readShilling` defensively reads `shilling ?? currency` ✅

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

### [3.2] Phase 65 diagnostic strip + COMBAT_DEBUG_PICKUP.md delete ✅

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

### [5.9] User-enablement playtest runbook (let Claude drive the live app) ✅

- Resolved 2026-05-22. `setup/04_claude_playtest.md` shipped, walking the user through `pnpm web` + Playwright MCP smoke test. The recurring playtest cadence was then formalized as Phase 67 (`966a990` `feat(spec67a): /playtest skill — Playwright regression sentinel + hermetic structural test`). Drained as Done during the audit-hygiene sweep 2026-05-22.
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

### [3.0] DRIFT — HUD HP fallback can briefly show stale out-of-combat HP ✅ (closed as non-issue)

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

### [2.5] DRIFT — `playerChoice.skillId` typed via `as any` cast at three sites ✅

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

### [9.8] Combat regression — `selectCombatViewModel` returns stale `vm.phase` despite fresh `combat.phase=resolving` input ✅

- Resolved 2026-05-21 via Phase 65 Tick A — commit `8f7265c` `fix(spec65a): useCombatViewModel — vm.phase stuck while engine advances; React Compiler ignored opaque store.getState() deps`. Root cause confirmed: the `useMemo` deps array passed `store.getState()` opaquely; the React Compiler couldn't trace the inner reads, so the memo never invalidated when `combat.phase` advanced. Fix threaded the combat slice through explicit deps. Drained as Done during the audit-hygiene sweep 2026-05-22.

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

### [9.8] Encounter UX — keep entire encounter inside the modal ✅ (PROMOTED → Phase 63; all 4 sub-ticks shipped)

- Resolved 2026-05-21 via Phase 63 (parent + 4 sub-ticks 63a/b/c/d, all marked `[x]` in `plan/steps/01_build_plan.md`). Combat UI extracted into reusable `<CombatPanel>`, mounted inside `EncounterModalOverlay`, aftermath dismissal wired, standalone `/combat` route retired. Drained as Done during the audit-hygiene sweep 2026-05-22.

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

### [9.5] Combat regression — Heart appears pre-selected; there is no default/starting stance ✅

- Resolved 2026-05-21 via Phase 65 Tick B — commit `33f8fdc` `feat(spec65b): no default stance — fix [9.5] Heart appears pre-selected`. `previewStance` now stays `null` until the player previews via `localUi.selectedStance` or commits via `playerChoice.stance`; presenter comment at `state/presenters/combat.engine.ts:1096-1100` documents the contract. Drained as Done during the audit-hygiene sweep 2026-05-22.

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

### [9.5] Combat regression — Action selection has no effect ✅ (duplicate of [9.8])

- Resolved 2026-05-21. Hypothesis confirmed: same root cause as the [9.8] vm.phase staleness. When Phase 65 Tick A (`8f7265c`) fixed the memo-staleness in `useCombatViewModel`, action selection visibly took effect again. Drained as Done during the audit-hygiene sweep 2026-05-22.

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

### [9.5] Combat regression — Encounter modal closes before resolution ✅

- Resolved 2026-05-21 via Phase 63 (modal-contained encounter). Combat now lives inside `EncounterModalOverlay`; the modal cannot dismiss until the encounter resolves (Phase 63c). The original symptom — the overlay vanishing on a pending-event race — is structurally impossible once Phase 63b/c land. Confirmed by the 2026-05-22 live-drive playtest (oversight 28th call). Drained as Done during the audit-hygiene sweep 2026-05-22.

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

### [6.0] FEATURE — Debug "POPULATE" button (user-direct request 2026-05-22) ✅
- Resolved 2026-05-22. Sibling to `DebugSeedButton` (which seeds
  a representative sample). New `<DebugPopulateAllItems>` walks
  the engine's three central item registries
  (`equipmentTemplates`, `uniqueTemplates`, `consumableLibrary`)
  and pushes one of each into the player's inventory. Uniques
  receive `rarity: 'unique'` override per-item so the chrome
  surfaces the rarity correctly.
  - New action: `populateAllItems()` →
    `{ itemsAdded, breakdown: { equipment, unique, consumable } }`
  - New component: `DebugPopulateAllItems.tsx` (mirrors
    DebugSeedButton's dashed-ash / sulfur-accent / mono-label
    shape).
  - Mounted between SEED and COMBAT in the SELF-tab DevMenu.
  - 6 hermetic test cases (DEV gate, action routing pins
    "every registry" intent — at least one equipment + one
    consumable + one unique present after tap, accessibility,
    non-destructive second tap).
  - Out of scope: materials (no central registry — inline in
    `event-pools.ts`) and quest-items (per-quest, no
    registry). Could expand later if needed.
  1066/1066 green at land (+6 over 1060).

### [2.5] DRIFT — 4 `as any` casts in `ErrorBoundary.tsx` (MapState probe + globalThis.navigator probe) ✅
- Resolved 2026-05-22. Two clusters in the error-display
  surface:
  - **MapState completedNodes probe (×2 — lines 185, 187):**
    was `(world.currentMap as any).completedNodes` despite
    engine `MapState.completedNodes: NodeId[]` being declared
    required at `World/types.d.ts:81`. Casts dropped. The
    `Array.isArray` defense-in-depth stays (this is an
    error-display surface — better to render `0` than throw
    inside the ErrorBoundary on store-state corruption).
  - **globalThis.navigator probe (×2 — lines 207, 209):**
    cross-runtime narrow needed for the web/native split.
    Replaced 2x `(globalThis as any).navigator.userAgent` with
    a single `GlobalWithNavigator` narrow extension type +
    one `as` cast. No DOM-lib types pulled in.
  1060/1060 green at land. Production `as any` count now 5
  (persistence migrations, 2 RN styling quirks, tokens
  ViewStyle double-cast, and the templateToEquipment boundary
  cast — all genuinely intentional).

### [2.5] DRIFT — 2 more `as any` casts in `components/Debug*` (DialogueJump setState + MapResetButton selector) ✅
- Resolved 2026-05-22. Tail of the Debug-component sweep:
  - `components/DebugDialogueJump.tsx:95` —
    `store.setState({ event: {...} } as any)`. Same
    Phase-69 wrapper-already-correct gap; dropped.
  - `components/DebugMapResetButton.tsx:25` —
    `useGameState((s) => (s as any).world?.currentMap?.name)`.
    `useGameState`'s selector is typed
    `(state: AppStoreState) => U` (see
    `state/GameStoreProvider.tsx:61`); `s.world` is
    `WorldState | undefined` natively. Cast was redundant.
  1060/1060 green at land. Production `as any` count now down
  to 7 (1 persistence-migrations + 4 ErrorBoundary defensive
  probes + Splatter style typing + tokens ViewStyle).

### [2.5] DRIFT — 5 setState `as any` casts in `components/Debug*` — finish the Phase 69 sweep ✅
- Resolved 2026-05-22. Phase 69 drained the `state/actions.ts`
  setState casts but didn't reach `components/Debug*` —
  same wrapper-typing-already-correct gap, different surface.
  Dropped 5 casts:
  - `components/DebugQuestState.tsx:92, 100, 107` —
    `store.setState({ quests: log } as any)` × 3 (start /
    advance / complete handlers)
  - `components/DebugXpGrant.tsx:39, 55` —
    `store.setState({ player: {...} } as any)` × 2
    (grant-xp / force-level-up handlers)
  All five use `useGameStore()` which returns `AppStore =
  StoreApi<AppStoreState>` — `setState` already accepts the
  partial shapes passed. No code change beyond cast removal.
  1060/1060 green at land.

### [2.5] DRIFT — 2 `as any` casts in shared item helpers (`material`, `templateToEquipment`) ✅
- Resolved 2026-05-22. Two construction helpers in the data
  layer:
  - `state/exploration-maps/event-pools.ts:183` `material(...)` —
    returns engine `Material = BaseItem & { category: 'material';
    quantity: number }`. The function already supplies all 5
    required fields. The `as any as Material` cast was fully
    redundant. Dropped.
  - `state/selectors/equipment.ts:templateToEquipment` —
    legitimately a boundary cast: returns an `Equipment` shape
    plus mobile-side `stackable` / `quantity` / `modifiers`
    fields the engine type doesn't declare. Promoted the cast
    from `as any as Equipment` to `as unknown as Equipment`,
    boundary now explicit instead of an `any` masking
    typos. JSDoc updated to describe the wrapper.
  1060/1060 green at land.

### [3.0] DRIFT — final 3 `as any` casts in `state/actions.ts` (pushLog, enemyChoice.action, playerChoice cleared) ✅
- Resolved 2026-05-22. Three remaining casts at the bottom of
  the action-layer sweep:
  - `pushLog` at `state/actions.ts:285`: was casting a
    `{severity, text}` mobile-shape entry to `any` for the
    engine `combatAppendLog(state, entry: BattleLogEntry)`
    reducer. Introduced a local `MobileLogEntry =
    { severity: LogSeverityKey; text: string }` type and cast
    through `unknown` instead of `any` — boundary stays the
    same but the shape is documented. The presenter
    (`combat.engine.ts:1131-1133`) already filters these
    metadata entries at the read side; both shapes coexist
    at runtime.
  - `action: enemyAction.action as any` at line 557:
    `enemyAction` is engine-typed `CombatAction`; `.action` is
    `Action`. Assignment target `enemyChoice.action` accepts
    `Action | undefined` (`Partial<CombatAction>`). Cast was
    redundant. Dropped along with both surrounding
    eslint-disables.
  - `{ playerChoice: {} } as any` at line 601: empty `{}` IS
    a valid `Partial<CombatAction>`. Cast was redundant.
    Dropped.
  After this commit, `state/actions.ts` is `as any`-free in
  code (only documentation comments referencing prior closes
  remain). 1060/1060 green at land.
  This finishes the action-layer cast sweep that ran across
  4 ticks this session.

### [3.0] DRIFT — `summarizeRoundEvents` typed `unknown[]` + `as Record<string, any>` probe; latent dead branch ✅
- Resolved 2026-05-22. `summarizeRoundEvents` at `state/actions.ts:301`
  accepted `readonly unknown[]` and cast each event to
  `Record<string, any>` for ad-hoc probing — bypassing the engine's
  clean discriminated `RoundEvent` union (`Combat/combat.resolver.d.ts:246`).
  Caller already passes a typed `resolution.combatEvents:
  RoundEvent[]`. Retyped the parameter to `readonly RoundEvent[]`;
  TS now narrows each `phase`/`kind` branch automatically — drops
  the cast, drops the `?? 0` defaults (engine fields are
  non-optional under the narrowed shape), drops the
  `Number(...)` coercions, drops the `String(...)` on
  `effect.name`.
  Discovered a **dead branch** along the way:
  `ev.phase === 'scenario' && ev.kind === 'both-defend'` never
  fires — engine's `ScenarioEvent` union has no `'both-defend'`
  variant (likely an older engine shape; current
  `combat.resolver.d.ts:67-145` doesn't list it). Removed.
  1060/1060 unchanged at land — confirms the branch was unreachable.

### [2.5] DRIFT — `setLastResolution` triple-`as any` in combat action layer ✅
- Resolved 2026-05-22. `setLastResolution` at `state/actions.ts:413`
  was casting the function declaration line, the inner
  `lastResolution: summary as any`, and the outer return `} as any`
  — all three lines guarded by eslint-disables. The whole stack
  exists because engine `CombatState` (`Combat/types.d.ts:31-42`)
  has no `lastResolution` field; mobile tacks one on for the
  presenter to read at `combat.engine.ts:895`.
  Defined a local `MobileCombatState = CombatState & { readonly
  lastResolution?: ResolutionSummary }` and changed
  `setLastResolution`'s return type to it. All three `as any`
  casts drop; the documented extension makes the mobile slice
  findable rather than invisible. 1060/1060 green at land.
  Follows the pattern that closed the memoir [2.5] DRIFT
  (`MemoirObjectiveInput` extension type) earlier this session.

### [2.5] DRIFT — `event.payload as any` cast in inventory-feedback presenter ✅
- Resolved 2026-05-22. Engine declares
  `TypedInventoryChangedEvent.payload: EnginePayload` (`{action,
  state, ...}`), but the runtime non-dispatch `addItem` path ships
  `{item, state}` and skips the `action` slot — so the presenter
  can't trust the typed shape. Replaced `as any` with a precise
  local `InventoryChangedPayloadProbe` extension type listing
  every field the presenter actually reads, cast through `unknown`
  so subsequent reads stay typed. Tightened the per-field reads
  with `typeof === 'string'` guards so the toast strings are
  type-safe. Picked via fresh presenter-cast sweep — last `as any`
  in `state/presenters/` outside annotated audit holdouts.
  1060/1060 green at land.

### [2.5] DRIFT — `rawBaseStats as any` cast in memoir `buildPhilosophicalAlignment` ✅
- Resolved 2026-05-22. Tightened the function's input type from
  `unknown` to `BaseStats | undefined` — the only caller passes
  `player?.baseStats`, which is exactly that. Engine
  `BaseStats` (`Character/types.d.ts:4-8`) declares
  `heart/body/mind: number` as required, so the per-field
  `typeof === 'number'` probe was redundant; collapsed to a
  single `stats && Number.isFinite(...)` guard (defense against
  NaN / Infinity injected by a future effect). Cast drops.
  Picked via fresh presenter-cast sweep. 1060/1060 green at land.

### [2.5] DRIFT — `(item as any).quantity` cast in inventory presenter `quantityFor` ✅
- Resolved 2026-05-22. Tightened the union narrowing from
  `isConsumable(item) || ('quantity' in item && typeof item.quantity === 'number')`
  to `isConsumable(item) || isMaterial(item)` (the only two
  `Item` union members carrying `quantity: number` per engine
  `Items/types.d.ts:55-78`). Cast drops; the `?? 1` fallback
  stays — needed for a test fixture that synthesizes
  consumable-shaped items without the engine-required field,
  and a useful defense in depth against further shape drift.
  Picked via fresh presenter-cast sweep. 1060/1060 green at land.

### [3.2] `components/event/EventArt.tsx` colocated test coverage ✅
- Resolved 2026-05-22. Added 5 hermetic cases pinning the
  slug → component dispatch — `encounter` / `boss` route to
  their bespoke illustrations (no 60-segment placeholder grid;
  ≥1 Path), `rest` / `gathering` / `hazard` route to
  `PlaceholderIllustration` with the slug forwarded (60-segment
  grid + the expected per-slug Path counts from the placeholder
  contract). Picked via fresh audit (F. Tests category — sole
  remaining untested component with logic, vs. the bare-SVG
  Boss/Encounter illustrations). 1060/1060 green at land (+5
  over 1055).

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
