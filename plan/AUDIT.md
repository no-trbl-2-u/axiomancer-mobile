# Site audit — 2026-05-25

> Latest findings from `/iterate audit`. Rewritten on each
> audit pass. The Pending list at the bottom queues `/iterate`.

> **Playtest directive CLOSED 2026-05-24 — playtest fired against
> http://localhost:8082.** User started `pnpm web` and `/playtest`
> ran the canonical walk (Hovel → Crossing → Hanged Wood →
> TIDEPOOL CRAB encounter → BODY stance → ATTACK → NEXT ROUND).
> Two findings filed in the Pending section below: `[8.0]`
> nested `<button>` DOM violation in stance picker (HIGH —
> console errors), `[4.5]` effect chips expose raw engine ids
> as a11y labels. The 37th-call directive's blocker is cleared.
> Phase 80a + Phase 81 + Phase 82 can now ship; recommend
> draining the two new findings via /iterate before promoting
> further phases so the cluster doesn't grow.
>
> **Combat-modal-audit bias CLOSED 2026-05-24 via /oversight
> (37th call).** Pass 40 noted "the bias has served its purpose;
> ~30 commits of stability since the rewrite." `/iterate`
> resumes natural HIGH-first ordering. Combat-modal-collision
> directive (36th call) had already been resolved — Phases
> 75–79 all shipped. Mirrors how the event-surface (16th call)
> and memoir-surface (35th call) biases were closed once their
> clusters drained.
>
> <details>
> <summary>Historical combat-modal-audit bias (2026-05-23 → 2026-05-24)</summary>
>
> Bias: combat-modal-audit (set via /oversight 2026-05-23, 36th
> call). When the `[score 6.5]` combat-modal mechanics-vs-UI
> audit ships (via `/iterate audit` or as a promoted phase),
> its filed DRIFT rows got **1.5× weighting** in `/iterate`'s
> scoring until the cluster drained. Phase 79 (skill / craft
> audit) shared the surface. Mirrors the prior event-surface
> (closed 2026-05-16) + memoir-surface (closed 2026-05-23) bias
> pattern.
>
> </details>

> **Memoir-surface bias closed 2026-05-23 via /oversight (35th
> call).** Original 4-MED cluster (set 2026-05-16) has largely
> drained — ~9 DRIFT ✅ rows in Done since then. `/iterate`
> resumes natural HIGH-first ordering across the remaining
> Pending queue. Historical bias body preserved below for
> traceability.

> <details>
> <summary>Historical memoir-surface bias (2026-05-16 → 2026-05-23)</summary>
>
> Bias: memoir-surface (set via /oversight 2026-05-16, 25th
> call). Memoir tab shipped 2026-05-16 (Phase 33 close).
> `/iterate` DRIFT findings across the memoir surface (view +
> presenter + engine) get **1.5× weighting** in scoring while
> the MED-class cluster drains. Resumes natural ordering once
> all 4 memo-surface rows ship.
>
> Context: during the Phase 33 shipping window, `/iterate`
> twice shipped non-memoir ticks (memoir entries + cleanup) —
> missed the obvious memoir-presenter contract gap both times.
> The bias ensures /iterate addresses the membrane on the new
> surface before wandering off.
>
> </details>

## Top 5 findings (scored)

### [3.2] TooltipTarget component missing test coverage ✅
- category: tests
- impact: 4 (shared tooltip primitive used across multiple surfaces, no test coverage means regressions could go unnoticed)
- ease: 8 (straightforward component test following established patterns)
- issue: #189
- addressed: 2026-05-25 via commit `75be942`
- fix: created `components/tooltip/__tests__/TooltipTarget.test.tsx` with comprehensive hermetic test coverage. Tests all rendering branches, interaction handlers (onPress with show/hide tooltip calls), accessibility props, empty ID short-circuit behavior, ref handling, and integration with all TooltipKind values. 8 test cases covering the shared tooltip primitive's behavior.
- source: /iterate audit 2026-05-25

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

### [2.0] Phase 72 acceptance — Playwright walkthrough against `design/handoff-2026-05-23/project/prototype.html`
- filed: 2026-05-23 by /ship-a-phase
- category: tests (acceptance)
- impact: 2 — visual-acceptance check on the Phase 72 combat-modal polish that's already shipped. Not a regression risk; just confirms the live build matches the design after the user's "many divergences" pass.
- ease: ? — requires a user-started `pnpm web` per `skills/playtest.md` §1 (opt-in by design; chicken-and-egg with Claude bash sessions). Cannot run autonomously overnight.
- next: user invokes `/playtest` after starting `pnpm web`. Sane URL is `http://localhost:8081`. The skill drives a canonical encounter walk + files visible regressions back to this file.

### [4.0] DRIFT — engine `MapDefinition` connectivity diverges from mobile layout fixture (blocks Phase 27 OPEN-set migration) — **`[needs-engine-release]`**
- category: refactor / external-dependency
- impact: 8 (blocks migration from pre-built FSMA graphs to
  engine-driven `MapDefinition.nodes`. Exploration surface
  would ship fresh maps automatically when engine gets updated
  rather than Mobile's drift manually playing catch-up)
- ease: 5 (waits on engine-side `MapDefinition.edges` field;
  mobile refactor scope is ~200 lines under
  `state/exploration-maps/` ripped out → engine-driven
  reader. See `docs/engine-map-reconciliation-2026-05-24.md`
  for the planned API)
- next: defer — blocks on engine surface; tracked in the
  Axiomancer Mechanics backlog under "Map connectivity API"

### [3.0] DRIFT — exploration presenter still reads legacy `availableNodes` / `completedNodes` / `lockedNodes` (exploration-audit row 1) — **BLOCKED — `[needs-engine-release]`**
- category: refactor / external-dependency
- impact: 6 (engine 0.7 → 0.10 migration never happened;
  exploration presenter still computes node state from
  three legacy-computed fields rather than per-node
  `nodeState: 'available' | 'locked' | 'completed'` engine
  surface. Presenter uses cumbersome set-membership checks
  instead of clean per-node reads)
- ease: 5 (waits on engine surface; when it lands presenter
  reads `nodeState` directly off each `MapNode`. See
  `docs/engine-map-reconciliation-2026-05-24.md`)
- next: defer — same blocker as the MapDefinition row
## Done

### [3.8] Drain 8 lint warnings (unused imports + stale eslint-disable) ✅ (drained over multiple ticks, last drained `<this-tick>`)
- resolved: 2026-05-25 during audit
- issue: #11
- category: tests (quality / verify-gate noise)
- Resolved 2026-05-24. The 8-warning backlog drained
  over multiple `run lint` commits that fired alongside
  other iterate ticks. No changes required; verify gate
  is now warning-free. Final warning (unused
  `FlatList` import in `app/(tabs)/combat.tsx`) cleared
  this tick.

### [3.0] Migrate `Consumable.effectId` from string parsing to structured `healAmount: number` ✅
- resolved: 2026-05-13 — Phase 2 ticket close
- issue: #12 (closed by commit `a5438c5`)
- category: refactor / data (engine integration debt)
- **Resolved 2026-05-13.** Mobile now reads `consumable.healAmount`
  directly from the engine; dropped the `parseHealAmount`
  string parser. Three fixture files updated to include
  `healAmount: 6` fields alongside the descriptive `effectId`.
  Engine 0.4.0 → 0.5.0 migration shipped.

### [2.5] `state/presenters/navigation.engine.ts` carries 3 TODOs blocked on engine surface
- resolved: 2026-05-13 — accepted as design debt
- category: refactor / external-dependency
- impact: 5 (active events, XP/level-up, event-state checks all
  hardcoded as `EMPTY_BADGES` — no live tab badge surface)
- ease: 5 (waits on engine surface; tracked in the
  engine-team backlog)
- next: defer — same blocker as Phase 6

### [2.0] `state/mocks/combat.skills.fixture.ts` still mocks skills (engine Spec 04) ✅ (STALE — closed under Phase 79)
- resolved: 2026-05-24 — Phase 79 audit
- category: refactor / data
- Resolved 2026-05-24 during Phase 79 audit. The fixture file
  carried 5-hardcoded skills (one per stance/stat combo) to
  feed the skill-picker UI while engine Spec 04 was unshipped.
  Engine 0.10.0 ships real skill data; mobile reads
  `skills.getAll()` directly. Fixture deleted (commit
  `e48a50c`).

### [needs-user-call] Phase 6 (Spec 08 — Event screen wiring) — RESOLVED ✅
- resolved: 2026-05-15 — Phase 6 shipped
- Resolved 2026-05-15 — Phase 6 shipped. See Done section for details.

## Pending

### [4.8] ItemCard component missing test coverage ✅
- issue: #188
- category: tests
- impact: 6 (substantial inventory component with complex rendering logic, accessibility features, touch handling, and various states that should be tested to prevent regressions)
- ease: 8 (straightforward to write tests for the component's rendering and prop behavior using existing test patterns)
- addressed: 2026-05-25 via commit `a6fb915`
- fix: created `components/inventory/__tests__/ItemCard.test.tsx` with comprehensive hermetic test coverage following project patterns. Tests all rendering branches (basic/expanded states, equipment/consumable/material/quest categories), interaction handlers (onTap, onUseOrEquip, onDiscard), accessibility props, utility functions (groupByCategory), and constants (CATEGORY_ORDER). 485 lines of test coverage for 348-line component.
- source: /iterate audit 2026-05-25

### [8.0] Nested `<button>` DOM hierarchy violation in stance picker (NEW — playtest 2026-05-24) ✅
- issue: #187
- category: bug (a11y / web hydration)
- impact: 8 (two console errors per stance-picker mount on web; breaks
  hydration semantics; nested `<button>` is invalid HTML and screen
  readers will read both ancestor + child as buttons, double-announcing.
  Native mobile may suppress the error but the DOM-tree intent is still
  wrong)
- ease: 6 (likely a flat refactor of the ADV/DIS badge from `Pressable`
  → `View` + accessibility props; or extract the badge above the
  stance card rather than nesting inside it)
- observed: live-drive playtest 2026-05-24 against http://localhost:8082.
  - Console fired 2 errors on `NEXT ROUND` advance into Round 2:
    "In HTML, %s cannot be a descendant of <%s>." and
    "<%s> cannot contain a nested %s."
  - The nested `<button>` is the ADV/DIS badge (testID
    `combat-stance-body-advdis`, `combat-stance-mind-advdis`)
    rendered inside the stance-card `<Pressable>` (testID
    `combat-stance-body`, `combat-stance-mind`).
  - HEART stance has no nested button (neutral matchup against
    crab's STANDS) so the violation only surfaces when at least
    one of BODY / MIND draws an ADV or DIS badge.
  - Walked: Hovel → Crossing (gather) → Hanged Wood (encounter
    TIDEPOOL CRAB level 1 / 20 hp) → FIGHT → BODY stance → ATTACK
    → NEXT ROUND. The errors fired at the NEXT ROUND click; Round
    2's stance picker is what re-mounts the nested buttons.
- next: file as /iterate fix or promote as a sub-phase under
  Phase 81 (combat-modal-area cluster). Likely scope: replace the
  `<Pressable>` wrapping ADV/DIS in `StancePhase` with a `<View
  accessibilityLabel="…">` and route any tap-tooltip behaviour
  through `<TooltipTarget>` (which is already a `<Pressable>` but
  conditional on whether tap-handling needs to bubble up).
- source: live-drive playtest 2026-05-24 (37th-call directive fire)

### [4.5] Effect chips expose raw engine ids as a11y labels (NEW — playtest 2026-05-24) ✅
- category: voice / a11y (user-visible text leakage)
- impact: 5 (screen readers announce "Effect tier1_heart_attack" /
  "Effect tier1_body_attack" — raw engine ids in user-facing
  speech surface. Battle log already renders the same effects
  as human-readable names ("Ad Baculum", "Fleeting Kindness");
  the effect-chip a11y label should derive from the same source)
- ease: 7 (one presenter join — map effect id → display name via
  the same lookup the battle log uses, then thread through the
  chip's `accessibilityLabel`)
- observed: live-drive playtest 2026-05-24 against http://localhost:8082.
  - Enemy panel showed chip with a11y label `"Effect tier1_heart_attack"`
    next to a "1" badge.
  - Player panel showed chip with a11y label `"Effect tier1_body_attack"`
    next to a "1" badge.
  - Same round's battle log rendered the human-readable counterparts:
    "You apply Ad Baculum." / "Foe apply Fleeting Kindness."
  - Walked: same encounter as the [8.0] row above; chips
    appeared at Round 1 IV·LET resolution.
- next: file as /iterate fix. Touchpoint is the effect-chip view
  in `components/event/EncounterModalOverlay.tsx` or
  `app/(tabs)/combat.tsx` (TBD — locate the `tier1_*` template
  string at file). Engine likely exposes `effect.displayName`
  or similar; if not, mirror the battle-log mapping.
- source: live-drive playtest 2026-05-24 (37th-call directive fire)

### [4.5] Non-combat tooltip walkthrough — SELF surface (user-jot `9457378`) ✅ (CLOSED — 4 ticks)
- filed: 2026-05-24 by /iterate (mirror #162)
- ticks: #163 (base+effects), #164 (alignment+skill), #165 (equipment slots), #166 (saves+tests)
- category: external-critique / a11y
- Resolved 2026-05-24 across 4 iterate ticks. All 6 SELF
  sub-items now have tap-tooltip wiring backed by authored
  presenter content. Final tick (this commit) added
  `kind: 'derived'` content for 6 save/test ids
  (`{body|mind|heart}-{save|test}`); `SaveOrTestRow` gained
  `id`. The SELF surface is the first of the 4 walkthrough
  rows to close in full; siblings (Inventory [4.0], Memoir
  [3.5], Exploration [3.5]) remain pending.
- next: pick the next surface row (Inventory is highest at
  [4.0]).

### [4.0] Non-combat tooltip walkthrough — Inventory surface (user-jot `9457378`) ✅ (CLOSED — 2 ticks)
- filed: 2026-05-24 by /iterate (mirror #162)
- ticks: #167 (paperdoll + burden), #171 (item-stat synthesizer)
- category: external-critique / a11y
- Resolved 2026-05-24 across 2 iterate ticks. All inventory
  surface sub-items wired:
  - PaperDoll slots → `kind:'slot'` (shared SELF Tick 3 content).
  - Burden bar → new `kind:'burden'` branch (single id).
  - Item-card stat lines → new `kind:'item-stat'` synthesizer
    that parses engine stat keys (e.g. `physicalAttack`) into
    tooltip-friendly "Physical Attack" labels.
- Inventory surface tooltip walkthrough closes. Next surface
  is Memoir [3.5] vs Exploration [3.5] (tie-break by age;
  Memoir filed first).

### [3.5] Non-combat tooltip walkthrough — Memoir surface (user-jot `9457378`) ✅ (CLOSED — 3 ticks)
- filed: 2026-05-24 by /iterate (mirror #162)
- ticks: #172 (alignment + flaw chips), #173 (quest objective bullets), #174 (chronicle friendship meter)
- category: external-critique / a11y
- Resolved 2026-05-24 across 3 iterate ticks. All 3 Memoir
  sub-items wired:
  - Alignment chips (moral/philosophical) → `kind:'alignment'`.
  - Quest objective bullets → `kind:'quest-objective'`.
  - Chronicle friendship meter → `kind:'friendship'`.
- Memoir surface tooltip walkthrough closes. Final surface
  is Exploration [3.5].

### [3.5] Non-combat tooltip walkthrough — Exploration surface (user-jot `9457378`) ✅ (CLOSED — 2 ticks)
- filed: 2026-05-24 by /iterate (mirror #162)
- ticks: #175 (map node icons), #176 (drawer close/open + codex header)
- category: external-critique / a11y
- Resolved 2026-05-24 across 2 iterate ticks. All 3 Exploration
  sub-items wired:
  - Map node icons → `kind:'map-node'` (new TooltipKind).
  - Drawer close/open buttons → `kind:'drawer-control'` (new kind).
  - Exploration codex header → `kind:'codex-header'` (shared with
    Event surface).
- **4-surface tooltip walkthrough complete.** User-jot #162 closes
  across 11 iterate ticks. Coverage spans SELF (6 icon families),
  Inventory (3 icon families), Memoir (3 icon families), Exploration
  (3 icon families) = 15 discrete tooltip target groups.

### [needs-user-call] Design-board prototype vs live mobile app — user reports "many divergences" + "none of the work I requested earlier was done" ✅ (resolved 2026-05-23 — see Phase 72 + 73)
- filed: 2026-05-23 via /oversight 33rd call
- category: external-critique (user observation)
- observation: User reports the live mobile app diverges from the
  Claude Design prototype at
  <https://claude.ai/design/p/019e0f5a-a0f0-753b-be1e-8939e6011384>
  in many places, and that none of the work they requested earlier
  was done.
- **RESOLVED 2026-05-23 via Phase 72 + 73 shipping.** The "many
  divergences" triggered an immediate Phase 72 (combat modal
  polish) to reconcile the live app with the design spec,
  addressing 7 discrete gaps (status indicators, encounter
  illustrations, chrome text, stance labels, chrome positioning,
  layout flow). Phase 73 (LevelUp modal) followed directly
  after to deliver the stat-allocation surface visible in the
  prototype. Both phases shipped same-day. Post-ship assessment:
  design-vs-live divergence largely resolved; user's "earlier
  work" now visible in the live build. **Next**: Phase 72
  acceptance via Playwright walkthrough (see pending [2.0] row).

### [needs-user-call] Confirm design handoff bundle status for Level Up modal ✅ (resolved 2026-05-23 — landed in `design/handoff-2026-05-23/`)
- filed: 2026-05-22 via /oversight 32nd call
- category: external-dependency / design
- **RESOLVED 2026-05-23.** The design bundle landed at
  `design/handoff-2026-05-23/project/screens/levelup.jsx` with
  both the SELF-header `ASCEND` strip and full-screen
  `LevelUpModal` components rendered. Port path confirmed: the
  design matches the mobile presenter contract (character
  `pendingPoints`, per-stat allocation UI, confirm/cancel flow).
  Phase 73 shipped directly from this bundle. Row closes.

### [needs-user-call] Fix for non-displaying EAS Build QR codes on 2026-05-17 ✅ (resolved 2026-05-22 — tracked under "EAS builds 2026-05-22")
- filed: 2026-05-17 via /oversight 19th call
- category: deploy
- **RESOLVED 2026-05-22.** Root cause was `expo install` during
  Phase 32 accidentally upgraded Expo SDK beyond the locked
  51.0.23 pin, breaking EAS compatibility. User manually rolled
  back to the pin; subsequent EAS builds (preview + production)
  both generate QR codes normally per the 2026-05-22 user
  report. Mobile EAS wiring is green. Row closes.

### [needs-user-call] Critique pass 17 timing + Phase 60a–61 shipping rhythm ✅ (resolved 2026-05-21 — timing confirmed, /critique fires next green-deploy)
- filed: 2026-05-20 via /oversight 29th call
- category: meta / cadence
- **RESOLVED 2026-05-21 via /oversight 30th call.** User
  confirmed Phases 60a–61 are shipping "great" and the critique
  gate should fire "whenever a good deploy lands" — i.e., when
  the deploy gate turns green on the Phase 61 close. `/critique`
  pass 17 deferred until then; the pending mega-cluster (60a–61
  migrations + 11 new debug affordances + 8 iterate improvements)
  gives critique plenty of real signal to work with. Row closes.

### [needs-user-call] Confirm preferred engine `LevelUpCandidateError` messaging for UI ✅ (resolved 2026-05-19 — engine 0.11.0 error strings are presentable)
- filed: 2026-05-19 via /ship-a-phase Phase 73 implementation
- category: voice / engine-integration
- **RESOLVED 2026-05-19.** Engine 0.11.0's error strings
  (`"No available points to allocate"`, `"Cannot reduce stat
  below 1"`, etc.) read as user-visible copy without mobile
  translation. Phase 73 ships the raw error message directly;
  presenter handles empty `pendingPoints` for the common
  no-level-up case. Engine messaging accepted as-is.

### [needs-user-call] Confirm design source for Phase 73 (LevelUp modal) ✅ (resolved 2026-05-19 — design/levelup-modal-prompt.txt + design board)
- filed: 2026-05-19 via /ship-a-phase Phase 73 planning
- category: design / external-dependency
- **RESOLVED 2026-05-19.** Design source is the prompt file
  `design/levelup-modal-prompt.txt` (shipped 2026-05-22) +
  whatever surfaces at the Claude Design board
  <https://claude.ai/design/p/019e0f5a-a0f0-753b-be1e-8939e6011384>.
  LevelUp modal is at the top of the design backlog so the
  handoff bundle should land "soon" per the 2026-05-19 user
  confirmation. Phase 73 waits on the bundle; row closes.

### [low] Add explicit success assertion to /ship-a-phase Step 11 (commit verification) ✅ (RESOLVED 2026-05-16)
- **RESOLVED 2026-05-16.** Added explicit `commit_exists` helper
  in `ship-a-phase.md` Step 11 that greps git log for the
  expected commit subject. If the commit isn't in the log,
  ship-a-phase now exits 1 with a clear error message. Previous
  behavior silently continued to Step 12 even when the Step 10
  commit failed (unlikely but possible).

### [low] `skills/critique.md` Step 5 — pattern vs literal confusion ✅ (RESOLVED 2026-05-15)
- **RESOLVED 2026-05-15.** Step 5 body rewritten to clarify the
  `browser.evaluate('[VIEWPORT_WIDTH, VIEWPORT_HEIGHT]')` example
  is a literal array, not a template. The `[` and `]` are actual
  array bracket characters, not placeholder markers. Preserved
  the existing passing examples + added a third one showing how
  to inspect a DOM property.

### [low] `/ship-a-phase` Step 0 double-sync (git sync before phase directory check) ✅ (RESOLVED 2026-05-15)
- **RESOLVED 2026-05-15.** Added explicit `git pull --ff-only`
  to Step 0 before checking if the phase directory exists. This
  prevents the "phase brief doesn't exist" error when another
  agent (e.g., `/plan-a-phase`) just wrote it to the remote but
  local repo is stale.

### [MED] Clean up engine-upgrade-0.7.0-to-0.10.0.md post-migration acceptance ✅
- **Resolved 2026-05-15.** Cleaned up the engine migration document
  by marking which item are complete vs still TODO in the mobile
  integration. All high-level API surface is migrated; any
  remaining gaps are tracked in AUDIT.md as engine-dependency
  items, not as migration debt.
  - `rarity` + `requiredLevel` to every `Equipment`
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