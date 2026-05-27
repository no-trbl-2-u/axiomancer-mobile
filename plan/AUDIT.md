# Site audit — 2026-05-27

## Top 5 findings (scored)

### [9.0] README.md promises Jest not installed but 1530 tests pass successfully ✅
- category: content-gaps
- impact: 10
- ease: 9
- next: remove the "Testing Setup Required" warning box from README.md lines 15-19
- source: audit
- observation: README.md lines 15-19 contain a warning box stating "This project does not have Jest or any test runner installed yet" but running `npm test` successfully executes 1530 tests across 121 test suites. This creates false expectations for new contributors.
- evidence: Warning box says "The `npm test` command listed below will not work until you complete Spec 01" but `npm test` passes with full test suite
- suggested_fix: Remove the obsolete warning box from README.md since the test harness is fully operational
- addressed: 2026-05-27 via commit `bb828b5`
- fix: Removed the obsolete warning box from README.md lines 15-19. The test harness is fully operational with 1530 passing tests across 121 test suites. New contributors can now run `npm test` without confusion.

### [6.3] Console statements in production code paths need dev guards ✅
- category: perf
- impact: 9
- ease: 7
- next: add __DEV__ checks around console.error in ErrorBoundary.tsx, console.warn in asyncStorageAdapter.ts and combat.engine.ts
- source: audit
- observation: Found 3 console statements without __DEV__ guards that will execute in production builds
- evidence: ErrorBoundary.tsx line 67 console.error, asyncStorageAdapter.ts line 118 console.warn, combat.engine.ts console.warn for stance triangle drift
- suggested_fix: wrap console statements with if (__DEV__) checks to prevent production logging
- addressed: 2026-05-27 via commit `e94efa3`
- fix: Added __DEV__ guards around console.error in ErrorBoundary.tsx and console.warn in asyncStorageAdapter.ts. Combat.engine.ts console.warn was already properly gated. Console statements now only execute in development builds, preventing production logs from exposing debug information.

### [5.6] Missing alt text on exploration map node buttons ✅
- category: a11y
- impact: 8
- ease: 7
- next: add descriptive accessibilityLabel to map node buttons in exploration screen
- source: audit
- observation: Map nodes in exploration screen render as pressible elements but lack accessibilityLabel attributes
- evidence: exploration screen has tappable map nodes without proper screen reader support
- suggested_fix: add accessibilityLabel with descriptive text like "Node available", "Node completed", "Node locked" based on node state
- addressed: already implemented at commit `3f33d72`
- fix: Accessibility labels are already properly implemented. Map nodes have descriptive accessibilityLabel with node state descriptions ("sealed", "walked", "here", "open"). Travel options also have proper accessibility labels. Issue #213 filed erroneously due to stale audit finding.
- issue: #213

### [4.8] Large icon files could impact bundle size
- category: perf  
- impact: 6
- ease: 8
- next: optimize large PNG files in assets/images directory, especially iOS marketing icon and store assets
- source: audit
- observation: Found several icon files ranging from 22KB to 53KB which are larger than necessary for mobile apps
- evidence: iOS marketing icon is 53KB, several store icons are 22-29KB each
- suggested_fix: run image optimization on large icon files to reduce bundle size while maintaining visual quality

### [4.0] Missing sitemap.xml for web build SEO
- category: seo
- impact: 8
- ease: 5
- next: add sitemap.xml generation for web builds listing available routes
- source: audit  
- observation: app.json has good OpenGraph and Twitter metadata but no sitemap.xml for web builds
- evidence: web configuration in app.json lacks sitemap reference
- suggested_fix: add sitemap.xml file listing the main routes (/, /combat, /character, /exploration, /inventory, /memoir)

## Historical findings

> Latest findings from `/iterate audit`. Rewritten on each
> audit pass. The Pending list at the bottom queues `/iterate`.

> **Combat-surface design gate (set via /oversight 2026-05-27,
> 42nd call).** Combat UI layout/chrome changes are frozen until
> the combat UX design handoff from Claude Design lands and ships.
> Non-visual combat fixes (presenter data accuracy, tooltips on
> existing surfaces, log format) are allowed. This avoids rework
> on surfaces the design handoff will reshape.
>
> **Cross-stat level-up effects deferred (set via /oversight
> 2026-05-27, 42nd call).** The [5.0] cross-stat effects candidate
> needs engine `previewAllocation()` helper. Deferred until engine
> release. Do not approximate client-side.
>
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
> surface first.
>
> </details>

## Top 5 findings (scored)

### [8.0] FLEE feedback and morale visibility missing (HIGH external critique) ✅
- issue: via CRITIQUE.md finding [HIGH] /encounter — FLEE gives no feedback, morale has no UI surface
- category: external-critique
- impact: 8 (HIGH priority deep-playtest finding - fleeing encounters gave no feedback and morale cost was invisible to players)
- ease: 10 (Phase 92 implementation already complete with tests)
- addressed: 2026-05-27 via march iterate review - Phase 92 already implemented
- fix: Verified existing Phase 92 implementation provides both requirements: narrative feedback after fleeing via toast message "you fled the encounter. the path bends away.\n\nmorale -2" in actions.ts, and morale value visible on SELF tab as "willpower" via character presenter. Test coverage exists in flee-action.engine.test.ts. Marked CRITIQUE.md finding as addressed.
- source: external-critique (deep-playtest F03)

### [7.2] Console warning statement not gated behind __DEV__ in LevelUpModal ✅
- issue: #197
- category: performance / tech-debt
- impact: 8 (console.warn statement executes in production builds, leaking debug information to users and potentially exposing internal error handling)
- ease: 9 (simple __DEV__ guard can be added around the console.warn statement)
- addressed: 2026-05-26 via commit `0569380`
- fix: Gated console.warn statement in LevelUpModal.tsx derived stats preview calculation behind __DEV__ check. Console statements now only execute in development builds, preventing production logs from exposing debug information. Error fallback behavior unchanged.
- source: audit/iterate

### [4.8] Missing test coverage for TooltipProvider component ✅
- issue: #204
- category: tests
- impact: 6 (shared tooltip primitive component without test coverage could miss regressions in tooltip functionality)
- ease: 8 (straightforward component test following existing patterns)
- addressed: 2026-05-26 via audit review - comprehensive test coverage already exists
- fix: Test file already exists at `components/tooltip/__tests__/TooltipProvider.test.tsx` with 6 test cases covering show/hide behavior, auto-dismiss timeout, toggle-off functionality, null content handling, and NOOP context. All tests pass. Audit finding was stale.
- source: audit/iterate

### [4.8] Missing test coverage for TapTooltip component ✅
- category: tests
- impact: 6 (tooltip display component without test coverage, could miss regressions in tooltip rendering)
- ease: 8 (standard component test for rendering behavior and prop handling)
- addressed: 2026-05-26 via audit review - comprehensive test coverage already exists
- fix: Test file already exists at `components/tooltip/__tests__/TapTooltip.test.tsx` with 3 test cases covering title/body/footnote rendering, footnote omission behavior, and testID override functionality. All tests pass. Audit finding was stale.
- source: audit/iterate

### [8.1] SVG illustrations lack accessibility labels for screen readers ✅
- issue: #193
- category: a11y
- impact: 9 (BossIllustration, EncounterIllustration, and PlaceholderIllustration components render complex SVG graphics with zero accessibility attributes. Screen readers announce nothing for these critical visual elements that convey important game state)
- ease: 9 (straightforward to add `accessibilityLabel` and `accessibilityRole="image"` props to each Svg component. Only 3 files need editing with descriptive labels)
- addressed: 2026-05-25 via commit `f04e468`
- fix: Added accessibilityLabel and accessibilityRole="image" props to all three SVG illustration components. BossIllustration and EncounterIllustration have specific descriptive labels, PlaceholderIllustration has dynamic labels based on event type slug covering all EventArtSlug variants (rest, gathering, loot-cache, interaction-generic, village, cutscene, hazard, encounter, boss).
- source: audit/iterate

### [7.2] Missing test coverage for core illustration components ✅
- category: tests
- impact: 8 (BossIllustration, EncounterIllustration, and PlaceholderIllustration have no test files despite being critical visual components. Only 68 out of 572 TSX files have accessibility labels - significant coverage gap)
- ease: 9 (create component tests following existing patterns in components/__tests__/ directory. Test rendering and prop handling)
- addressed: 2026-05-25 via commit `3a7a7e0`
- fix: Created comprehensive hermetic test coverage for BossIllustration (7 test cases) and EncounterIllustration (8 test cases) components. Tests cover accessibility attributes, SVG element structure, and visual element organization. PlaceholderIllustration already had existing test coverage. All tests follow project patterns and pass verification.
- source: audit/iterate

### [6.4] Console statements left in production code ✅
- issue: #194
- category: performance / tech-debt
- impact: 8 (app/_layout.tsx contains console.warn statements that will execute in production builds. DebugFriendship.tsx has console.warn in user-facing code path)
- ease: 8 (remove or gate console statements behind __DEV__ checks. Simple code cleanup)
- addressed: 2026-05-25 via commit `c4f37b8`
- fix: Gated all console.warn statements behind __DEV__ checks in app/_layout.tsx (persistence error logging) and components/DebugFriendship.tsx (debug warnings). Console statements now only execute in development builds, preventing production logs from exposing debug information.
- source: audit/iterate

### [5.6] No web metadata for SEO and social sharing ✅
- issue: #195
- category: seo
- impact: 8 (app.json lacks Open Graph tags, Twitter cards, meta descriptions, or JSON-LD structured data. Web builds have no social media preview capability or search engine optimization)
- ease: 7 (add metadata to app.json web configuration or create index.html with proper meta tags)
- addressed: 2026-05-26 via commit `48e5520`
- fix: Added comprehensive web metadata to app.json including title, description, lang, theme/background colors, Open Graph tags for social media sharing, and Twitter Card tags. Web builds now have proper SEO and social preview capability following gothic TTRPG theme and branding.
- source: audit/iterate

### [4.8] High number of TODO/FIXME markers indicating incomplete implementation ✅
- category: data-gaps / content-gaps
- impact: 6 (30 TODO/FIXME markers found across 11 files indicating unfinished features and potential content gaps that could affect user experience)
- ease: 8 (audit each TODO/FIXME to determine if it represents a genuine gap requiring immediate attention or can be safely documented/deferred)
- addressed: 2026-05-26 via audit review - no TODO/FIXME markers found in source code
- fix: Comprehensive search of app/, components/, and state/ directories found zero TODO/FIXME markers in TypeScript source files. Previously identified markers may have been in documentation or resolved in prior commits. Audit finding was stale.
- source: audit/iterate

## Pending

### [6.3] Equipment modal preview shows no stat changes instead of real equipment effects ✅
- issue: #206
- category: external-critique
- impact: 9 (equipment preview modal showed 'No stat change — engine modifiers pending' instead of actual stat differences, preventing users from making informed equipment decisions)
- ease: 7 (engine integration work to simulate equipment changes in modal presenter)
- addressed: 2026-05-27 via commit `4f6031f`
- fix: Fixed equipment preview modal to display actual stat changes instead of showing placeholder message. Modal now correctly simulates equipping/unequipping items using engineEquipItem/engineUnequipItem to show real stat deltas (+2 Physical Attack, etc.). Updated state/presenters/inventory.modal.engine.ts to calculate proper before/after stats and removed outdated 'engine modifiers pending' messaging.
- source: external-critique (HIGH finding from user-jot critique pass)

### [3.5] Morale bars render hardcoded placeholder values (needs engine backing)
- category: data / engine-contract
- impact: 4 (morale bar visible on WILDS StatusCard + SELF Pools section
  with hardcoded 7/10 values and a placeholder BREAK threshold at 20%.
  Players see a non-functional resource meter. Once the engine ships a
  morale system, the bars need wiring to real state.)
- ease: 7 (when engine surfaces `player.morale` / `player.moraleMax`,
  the StatusCard and character screen read directly from `useGameState`;
  the visual scaffolding is already in place)
- observed: Combat UX Boards design implementation 2026-05-27. P6
  morale bars shipped as visual scaffolding per design spec. Ledger
  data (sources/sinks) is also placeholder copy.
- next: file as `[needs-engine-release]` until the engine ships morale.
  When it does, one /iterate tick wires `useGameState((s) => s.player.morale)`
  into `StatusCard.tsx` and `character/index.tsx`.
- source: /oversight 2026-05-27, Combat UX Boards design handoff

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
- addressed: 2026-05-27 via commit `ff22eda`
- fix: Added pointerEvents="none" to ADV/DIS badges in stance cards to prevent DOM hierarchy violations. The badges remain visible and testable but don't create nested button structures that break HTML semantics and screen reader navigation. Console errors no longer appear on stance picker render during combat rounds with advantage/disadvantage matchups.
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
- observed: `pnpm web` console output 2026-05-17. See full
  deprecation warning text in triage skill findings.
- next: scan for any direct uses of the deprecated props in
  mobile components (unlikely), otherwise wait for upstream
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
- observed: engine 0.10.x ships node-sets per map but **not**
  edge-sets. Mobile still hardcodes the adjacency graph in
  `fv-layout.ts` / `nf-layout.ts` rather than reading edges
  off `MapDefinition`. Blocks `/plan-a-phase` Phase 27 OPEN
  → SHIPPED migration because it relies on the edges field
  shipping first.
- next: wait for engine `MapDefinition.edges` then file to
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
- observed: same issue as the row above — engine API surface
  gaps block presenter cleanup

## Done

### [3.2] 8x `npm run lint` warnings at verify-gate (all unused imports) ✅
- resolved: 2026-05-25 during audit
- issue: #11
- category: tests (quality / verify-gate noise)
- Resolved 2026-05-24. The 8-warning backlog drained
  over multiple `run lint` commits that fired alongside
  other iterate ticks. No changes required; verify gate
  is now warning-free. Final warning (unused
  `FlatList` import in `app/(tabs)/combat.tsx`) cleared
  this tick.

### [3.0] DRIFT — mobile reads legacy `Consumable.effectId` strings, not structured `healAmount` (phase-2-audit row) ✅
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

### [2.5] DRIFT — hardcoded skill fixture file vs. engine `skills.getAll()` (phase-2-audit row) ✅
- resolved: 2026-05-24 — Phase 79 audit
- category: refactor / data
- Resolved 2026-05-24 during Phase 79 audit. The fixture file
  carried 5-hardcoded skills (one per stance/stat combo) to
  feed the skill-picker UI while engine Spec 04 was unshipped.
  Engine 0.10.0 ships real skill data; mobile reads
  `skills.getAll()` directly. Fixture deleted (commit
  `e48a50c`).

### [2.5] Missing event-tab presenter (navigation bridge) — **[paused pending Phase 6]** ✅
- resolved: 2026-05-15 — Phase 6 shipped
- Resolved 2026-05-15 — Phase 6 shipped. See Done section for details.

### [3.2] 8x `npm run lint` warnings at verify-gate (all unused imports) ✅
- resolved: 2026-05-15 during phase 2 wrap
- Resolved 2026-05-15 — Phase 2 shipped with clean verify
  gate (`185 tests` + `npm run lint` warnings at `0`).

### [2.5] DRIFT — mobile reads legacy `Consumable.effectId` strings, not structured `healAmount` (phase-2-audit row) ✅
- resolved: 2026-05-13 — Phase 2 ticket close
- **Resolved 2026-05-13.** Mobile now reads `consumable.healAmount`
  directly from the engine; dropped the `parseHealAmount`
  string parser. Three fixture files updated to include
  `healAmount: 6` fields alongside the descriptive `effectId`.
  Engine 0.4.0 → 0.5.0 migration shipped.

### [2.5] Missing event-tab presenter (navigation bridge) — **[paused pending Phase 6]** ✅
- resolved: 2026-05-15 — Phase 6 shipped
- Resolved 2026-05-15 — Phase 6 shipped.

### [3.2] Add missing `.gitignore` entries for Expo and React Native
- resolved: 2026-05-13 — accepted as design debt
- Resolved 2026-05-13 — Phase 2 shipped.