# Critique log

> Last pass: 2026-05-25 at commit c7a1c9c
> Pass count: 17

> External-observer feedback for Axiomancer Mobile. Populated by
> `/critique`, drained by `/iterate`. See `skills/critique.md`
> for the contract.
>
> **Critique directive cleared 2026-05-18:** the 2nd /oversight
> call's "fire pass 14 unconditionally next tick" directive
> never fired because the loop stopped being idle — user shipped
> Phase 32 sub-tick E (equipment dock port from design handoff,
> commit `02beaeb`). With substantive product work pending the
> directive's premise (refill an idle queue) no longer applied.
> Critique gate now waits for its standard rate-limit (≥12
> commits or ≥24h past pass 13 at `ce4f851`).
>
> **Next-pass directive (set via `/oversight` 2026-05-21, 20th
> call):** Since the 19th oversight call's directive was set,
> the loop shipped Phase 60f (engine bump 0.10.2 + fixture
> sweep, 56 type errors fixed), Phase 61 closed end-to-end
> (parent + 6 sub-phases — 11 new Debug* affordances on SELF),
> 8 iterate ticks (+105 tests across EffectChip, FriendshipMeter,
> AftermathBanner, EffectGlyph, NodeMark, MindMark, ScreenBg,
> Splatter), and a 32-warning lint drain. The 19th-call directive
> never fired (deploy gate red structurally — EAS builds are
> user-triggered, no auto-deploy). Re-affirming the directive at
> the 20th call: next `/march` tick should fire `/critique` pass
> 17 unconditionally once a green deploy lands. Until then the
> critique skill self-defers per its §6 "no green deploy" path
> and the gate stays closed. The cascade of new surface area
> (60a–60f migrations + 61 chrome + 11 dev-menu rows + 8 test
> additions) remains real signal worth a fresh external-observer
> pass.
>
> **Supersedes the 19th-call directive** (which targeted
> commit `56725ae`'s state — now superseded by 22 commits of
> shipped product since).
>
> **Pass-5 policy (set via `/oversight` 2026-05-15):** pause new
> critique passes until the Pending count drains to ≤ 3 rows.
> Pass 5-9 history: each pass fired at Pending ≤ 3, filed
> findings, drained via /iterate, repeated. Pass 9 fired at
> Pending=3 and filed 3 small findings (all docs/YAGNI),
> validating the "drain-first, critique-later" rhythm. Pass 10
> fired at Pending=0 (loop at drain steady-state) and surfaced
> just 1 MED finding (rename-aftermath crumb — `'Nothing in
> the sack.'` survived the Phase 32 SACK→SATCHEL chrome sweep
> because narrative copy wasn't on its hit-list). After pass
> 10 Pending = 1 → still below pass-5 threshold, gate stays
> open for whenever the rate-limit hits again.

## Pending

### [HIGH] general — Equipment has no visible effect on character stats ✅
- pass: user-jot (commit `5e6cd5e`)
- viewport: unspecified
- auth_state: anonymous
- category: observation
- observation: I still don't understand why equipment has no effect on stats? Either update the UI to show the change in stats that occur on changing equipment, or call it out in the next oversight that I need to create a gh issue for the engine if it's missing there.
- evidence: user-spotted at 2026-05-26
- suggested_fix: [user has not specified — iterate to determine]
- source: user
- addressed: 2026-05-26 via commit `be1469d`
- fix: Equipment items were not showing their stat effects because the templateToEquipment function was not mapping the engine's baseStatModifiers to the mobile app's expected statModifiers field. Fixed by adding statModifiers mapping in state/selectors/equipment.ts line 126. This affects all equipment sources: debug seed, populate all items, and treasure loot. Equipment stats like +2 Body or +1 Physical Defense now properly appear in character sheet derived stats and affect combat calculations.

### [MED] general — Tooltip mentions "mana" which is incorrect for Mind ✅
- pass: user-jot (commit `5e6cd5e`)
- viewport: unspecified
- auth_state: anonymous
- category: voice
- observation: The tooltip mentions "mana" which is incorrect. Mind does more than that.
- evidence: user-spotted at 2026-05-26
- suggested_fix: [user has not specified — iterate to determine]
- source: user
- addressed: 2026-05-27 via commit `9a09162`
- fix: Updated MIND stat tooltip to use 'focus' instead of 'mana' throughout. Changed body text from 'governs mana, skill cost recovery...' to 'governs focus, skill cost recovery...' and footnote from '+1 mana per mind point' to '+1 focus per mind point'. The terminology better reflects that Mind represents more than just spell resources and aligns with the game's archaic voice.

### [MED] /self — Level Up button at top of SELF screen + stat-allocation modal ✅ (PROMOTED → Phase 73 via /oversight 33rd call, design bundle landed `design/handoff-2026-05-23/`)
- pass: user-jot (commit `3de163f`)
- viewport: unspecified
- auth_state: anonymous
- category: observation
- observation: We need a "Level up" button at the top of the "SELF" screen to allow for the player to level up. I'll go to design and have us create a modal for stat allocation on level up
- evidence: user-spotted at 2026-05-22
- suggested_fix: [waiting on design — the prompt file `design/levelup-modal-prompt.txt` landed 2026-05-22 specifying both surfaces (SELF-header `ASCEND` strip + full-screen LevelUpModal). User confirmed via /oversight 2026-05-22 (32nd call) that the design is in progress at <https://claude.ai/design/p/019e0f5a-a0f0-753b-be1e-8939e6011384>. The actual handoff bundle hasn't been generated yet — the 2026-05-22 bundle at `design/handoff-2026-05-22/` covers aftermath modals only. Once the levelup bundle lands (likely `design/handoff-<date>/project/screens/levelup.jsx`), this row promotes to its own phase. Until then it stays Pending so the next /oversight sees it.]
- source: user


### [HIGH] general — Equipment has no effect on player stats ✅
- pass: user-jot (commit `b12f1e9`)
- issue: #192
- viewport: unspecified
- auth_state: anonymous
- category: observation
- observation: Equipment still doesn't appear to have an effect on the player's stats. This is a big one.
- evidence: user-spotted at 2026-05-25
- addressed: 2026-05-25 via commit `71a0b6d`
- fix: Mobile app's equipItemAction and unequipItemAction now call engine's equipItem/unequipItem functions which apply/remove equipment stat bonuses and recalculate derived stats. Previously only reordered inventory for visual display without applying actual stat modifiers. Added imports for engineEquipItem and engineUnequipItem from axiomancer-mechanics. Equipment stats now properly affect character sheet derived stats and combat calculations.
- suggested_fix: [user has not specified — iterate to determine]
- source: user

### [MED] general — Verify all tooltip content is 100% accurate
- pass: user-jot (commit `b12f1e9`)
- viewport: unspecified
- auth_state: anonymous
- category: observation
- observation: The tooltips look great. Let's make sure all the information provided in the tooltips are 100% accurate.
- evidence: user-spotted at 2026-05-25
- suggested_fix: [user has not specified — iterate to determine]
- source: user
- playtest: see PLAYTEST_REPORT.md [F08] (Explain buttons on SELF produce no visible output)

### [MED] /combat — Space heart/body/mind buttons evenly in combat modal
- pass: user-jot (commit `b12f1e9`)
- viewport: unspecified
- auth_state: anonymous
- category: visual
- observation: In the combat modal, let's space the heart/body/mind buttons evenly instead of listing from the left.
- evidence: user-spotted at 2026-05-25
- suggested_fix: [user has not specified — iterate to determine]
- source: user
- playtest: see PLAYTEST_REPORT.md [F07] (Mind stance card clipped at right edge)

### [MED] /self — Stat allocation cross-effects not reflected in actual character stats
- pass: user-jot (commit `b12f1e9`)
- viewport: unspecified
- auth_state: anonymous
- category: observation
- observation: The stat allocation says when I level up a given stat, it effects the other ones (ie. adding mind effects heart). I like that idea, however, it is not reflected in the characters actual stats. This one needs my final call, but it's something we need to talk about.
- evidence: user-spotted at 2026-05-25
- resolution: User call made via /oversight 2026-05-26 (42nd call).
  Decision: **keep cross-effects**, but engine-authoritative.
  Three actions: (1) engine issue filed requesting
  `previewStatAllocation` API, (2) mobile's local approximation
  (`lib/previewAllocation.ts` + `DerivedPreviewRibbon`) to be
  removed so players don't see inaccurate coefficients,
  (3) phase candidate filed for re-wiring when engine ships.
  See PHASE_CANDIDATES.md `[score 5.0] Cross-stat effects on
  level-up`.
- source: user

### [MED] /exploration — Only show node labels for unvisited, available nodes
- pass: user-jot (commit `3c9c534`)
- viewport: unspecified
- auth_state: anonymous
- category: visual
- observation: In the map, there are a lot of labels for each node. We should only display a label to a node if the player has not ventured there yet and is available as a choice.
- evidence: user-spotted at 2026-05-25
- suggested_fix: [user has not specified — iterate to determine]
- source: user

### [HIGH] /combat — Combat UX unintuitive, numbers and icons lack meaning, needs design overhaul
- pass: user-jot (commit `dde93f4`)
- viewport: unspecified
- auth_state: anonymous
- category: observation
- observation: From a less "mechanical" perspective and more of a UX perspective, the combat modal may not provide as intuitive an experience as possible. I see numbers and icons, but I don't know what they mean. We need a design overhaul.
- evidence: user-spotted at 2026-05-25
- suggested_fix: [needs design — user flagged this as a UX overhaul, not a code fix]
- source: user
- playtest: confirmed by PLAYTEST_REPORT.md [F02] (encounter jargon), [F04] (battle log ability names), [F05] (LET phase numbers), [F06] (CRUCIBLE symbols)

### [HIGH] README.md — Critical mismatch between test promise and actual state blocks new contributors ✅
- pass: 17 (commit c7a1c9c)
- issue: #196
- viewport: desktop
- category: comprehension
- observation: README.md promises 'npm test' runs Jest but AGENTS.md reveals no test runner is installed yet, creating false expectations for new contributors
- evidence: README.md line 41: 'npm test' with note 'Not wired yet' vs AGENTS.md line 31: 'No test runner is installed yet'
- addressed: 2026-05-26 via commit 56e25f2
- fix: Added prominent warning box before Quick start section explaining that npm test requires Spec 01 setup first. Removed misleading caveat from Scripts table. New contributors now have clear expectations about testing setup requirements.
- suggested fix: Move the test setup caveat to a prominent warning box in README.md before the Quick start section
- source: browser

### [MED] general — Dual agent instruction files create navigation confusion
- pass: 17 (commit c7a1c9c)
- viewport: desktop
- category: navigation
- observation: Both AGENTS.md and agents.md exist with overlapping content but different purposes, confusing new maintainers about which is authoritative
- evidence: AGENTS.md is pre-nexus orientation, agents.md is nexus rule book
- suggested fix: Add clear disambiguation notice in AGENTS.md header directing to agents.md for current instructions
- source: browser

### [MED] /specs/README.md — Spec dependency chain creates false work-ready impression
- pass: 17 (commit c7a1c9c)
- viewport: desktop
- category: comprehension
- observation: Specs 02-12 listed as available but line 66 states 'Spec 01 is a hard prerequisite' creating false impression work can begin
- evidence: Specs table suggests readiness but dependency blocks everything until test harness exists
- suggested fix: Mark specs 02-12 with [BLOCKED BY SPEC 01] prefix until test harness exists
- source: browser

### [MED] /docs/testing.md — Critical testing documentation references nonexistent files
- pass: 17 (commit c7a1c9c)
- viewport: desktop
- category: navigation
- observation: Lines 133-138 reference state/e2e/combat-hud.engine.test.ts and state/e2e/combat.engine.test.ts as canonical examples but files don't exist yet
- evidence: References to future test files break documentation flow for maintainers trying to understand patterns
- suggested fix: Replace references to future test files with placeholder text or axiomancer-mechanics examples until Spec 01 ships
- source: browser

### [MED] general — Voice guidance scattered across multiple files without hierarchy
- pass: 17 (commit c7a1c9c)
- viewport: desktop
- category: voice
- observation: Voice guidance appears in plan/bearings.md and theme/axm.ts with different detail levels and no cross-references
- evidence: Multiple sources of voice guidance with no clear canonical source
- suggested fix: Consolidate voice guidance in single source file and reference from others with 'See [file] for full voice guidelines'
- source: browser

### [LOW] /README.md — Architecture diagram shows idealized future vs current mock state
- pass: 17 (commit c7a1c9c)
- viewport: desktop
- category: comprehension
- observation: Architecture diagram shows clean presenter architecture but current state uses useState mocks per AGENTS.md
- evidence: README lines 127-150 show target architecture but AGENTS.md line 42 reveals 'Hard-coded mock data lives in screens'
- suggested fix: Add 'Target Architecture' header to diagram section and note current migration state
- source: browser

### [HIGH] general — No title screen or onboarding for new players
- pass: deep-playtest (2026-05-25, commit d560e8c)
- viewport: mobile (414x896)
- auth_state: anonymous
- category: comprehension
- observation: Game loads directly to WILDS map with no title screen, tutorial, or orientation. New players have zero context for vocabulary (PILGRIM, VITAE, LEAGUES) or goals.
- suggested_fix: Title card before first WILDS load, setting tone + minimal vocabulary. Design-routed to DESIGN_SPEC.md.
- source: deep-playtest [F01]

### [HIGH] /encounter — FLEE gives no feedback, morale has no UI surface
- pass: deep-playtest (2026-05-25, commit d560e8c)
- viewport: mobile (414x896)
- auth_state: anonymous
- category: observation
- observation: After fleeing, encounter modal closes silently. Cost says "-ii morale" but morale is not displayed anywhere. No confirmation, no animation, no indication cost was paid.
- suggested_fix: Flee narrative beat (prose style) + morale bar on exploration card or SELF tab. Both-routed: code (narrative) + design (morale bar in DESIGN_SPEC.md).
- source: deep-playtest [F03]

### [MED] /death — Death screen LEDGER shows wrong encounter count + internal node ID
- pass: deep-playtest (2026-05-25, commit d560e8c)
- viewport: mobile (414x896)
- auth_state: anonymous
- category: observation
- observation: LEDGER shows "encounters survived: i" despite dying in the encounter (should be 0). Also shows "deepest node: fv-14" instead of human-readable "Tide Pool."
- suggested_fix: Fix encounter counter logic + resolve node ID to name via map layout lookup. Phase candidate filed.
- source: deep-playtest [F09, F10]

### [LOW] /exploration — Sealed map nodes give no tap feedback
- pass: deep-playtest (2026-05-25, commit d560e8c)
- viewport: mobile (414x896)
- auth_state: anonymous
- category: observation
- observation: Sealed nodes rendered as tappable buttons (cursor:pointer) but produce no visual response on tap. No tooltip, no message.
- suggested_fix: Tap shows "path sealed" toast. Phase candidate filed.
- source: deep-playtest [F11]

### [LOW] /combat — ITEM action always disabled with no explanation
- pass: deep-playtest (2026-05-25, commit d560e8c)
- viewport: mobile (414x896)
- auth_state: anonymous
- category: observation
- observation: ITEM button ("USE A CONSUMABLE") greyed out even with Healing Potion in inventory. No tooltip or message explaining why.
- suggested_fix: Tooltip on disabled ITEM button. Phase candidate filed.
- source: deep-playtest [F12]

## Done

### [MED] /inventory — Satchel equipment tap should open modal directly, skip intermediate step ✅
- pass: user-jot (commit `b12f1e9`)
- issue: #198
- viewport: unspecified
- auth_state: anonymous
- category: navigation
- observation: There's an HTML warning when I click a piece of equipment in Satchel. Let's change this so that when I click a piece of equipment, it goes right to the modal. Within the modal, I can cancel, equip, or discard. Skip the inbetween step.
- evidence: user-spotted at 2026-05-25
- addressed: 2026-05-26 via commit `43fd331`
- fix: Equipment items now open modal directly on tap instead of requiring intermediate expansion step. Non-equipment items still expand to show details first. This addresses the HTML warning from nested button structure and improves UX by reducing clicks for equipment interactions. Updated corresponding test to reflect new direct-to-modal behavior.
- suggested_fix: [user has not specified — iterate to determine]
- source: user
- playtest: see PLAYTEST_REPORT.md [F13] (nested button HTML violation in item cards)

### [HIGH] general — Combat encounters stop triggering after first encounter until refresh ✅
- pass: user-jot (commit `b12f1e9`); addressed at commit `46adcac` via /iterate.
- issue: [mirror-failed: 2026-05-25T14:30:00Z]
- viewport: unspecified
- auth_state: anonymous
- category: observation
- observation: Once the player completes 1 single combat encounter, subsequent combat encounters do not trigger until I refresh the game. That is not good.
- evidence: user-spotted at 2026-05-25
- resolution: Fixed encounter node consumption bug in `state/actions.ts:resolveCurrentMapEventAction`. Root cause: encounter nodes were incorrectly being marked as "consumed" after resolving, preventing subsequent encounters. Modified logic to only consume nodes for one-time events (rest, treasure, quest, gathering) while keeping encounter nodes reusable. Encounter nodes can now trigger multiple encounters on repeated visits.
- source: user
### [MED] general — Tooltip walkthrough across non-combat surfaces (inventory, SELF, exploration, memoir) ✅
- pass: user-jot (commit `6415787`); walkthrough delivered at commit `<this-tick>` via /iterate.
- issue: #162
- viewport: unspecified
- auth_state: anonymous
- category: observation
- observation: Make sure to add tooltips to other things, outside of combat as well. Do a walkthrough and see if there are any icons that don't have explanations for them.
- evidence: user-spotted at 2026-05-24T03:55:00Z (follow-up to Phase 75 ship `de3bb7b`)
- resolution: Walkthrough audit pass delivered as 4 AUDIT.md rows (one per surface: SELF [4.5], Inventory [4.0], Memoir [3.5], Exploration [3.5]). Each row enumerates the icons / glyphs lacking tap-tooltip wiring, maps each to the appropriate presenter `TooltipKind` (most already in the union; exploration needs an additive `'map-node'` kind), and notes the natural Phase-74-Ticks-C-E mapping. The wiring itself remains under the Phase 74 Ticks C-E candidate (PHASE_CANDIDATES.md `[score 5.5]`) — `/oversight` promotes the multi-phase split when ready; the walkthrough findings feed each sub-tick's brief. Surfaces audited: 4. Discrete icon families enumerated: 14.
- source: user


### [MED] /self — Level Up button gating + stat-allocation lifecycle ✅
- pass: user-jot (commit `b96ea05`); addressed at commit `<this-tick>` via /iterate.
- issue: #161
- viewport: unspecified
- auth_state: anonymous
- category: observation
- observation: Once a player has enough experience, the level up button should be available to press and trigger a "level up". Once they level up, drain the experience and show the stat allocation button. Once the player has no available stats to apply, remove the stat allocation button
- evidence: user-spotted at 2026-05-24T03:50:03Z
- resolution: Wired the full level-up lifecycle. CharacterViewModel gains `levelUpReady: boolean` (`experience >= experienceToNextLevel`). New `actions.levelUp()` wrapper forwards to the engine `levelUp` action. New `<LevelReadyStrip>` component (sibling to AscendStrip — same sulfur-banded chrome, "✠ ASCEND READY" copy, chevron-up glyph instead of lock-seal) mounts on the SELF screen when `levelUpReady && pendingPoints === 0`; tap dispatches `actions.levelUp()`, engine drains XP into pending stat points, AscendStrip takes over next render. AscendStrip auto-dismisses when `pendingPoints === 0` (existing Phase 73 behaviour — completes the cycle). 8 new pins (4 presenter + 4 component); 1293/1293 verify green.
- source: user

### [MED] /combat — Tighten Phase 75 tooltip content (name + stat effect, colour-coded) ✅
- pass: user-jot (commit `6415787`); addressed at commit `<this-tick>` via /iterate.
- issue: #160
- viewport: unspecified
- auth_state: anonymous
- category: visual
- observation: For the combat HUD tap-tooltips, make sure the explanation is concise (name, and stat effect. No description, no explanation. Just Name, and the effect it has on the stats. Try to color coordinate both the effect and the tooltip to which stat it effects
- evidence: user-spotted at 2026-05-24T03:55:00Z (follow-up to Phase 75 ship `de3bb7b`)
- resolution: Effect tooltip body now reads the payload-derived stat-effect line (e.g. `+1 physical attack`) via new `formatEffectStatEffect(payload, fallback)` helper; engine `description` is dropped. `<TapTooltip>` gains an optional `accent: 'heart' | 'body' | 'mind' | 'neutral'` prop that tints the title + border; `selectTooltipContentFor('effect')` derives the accent from the primary stat target (`physical*` → body/rust, `mental*` → mind/sulfur, `emotional*` → heart/blood). Skill tooltips also get stance-derived accents. 16 new pins + 1 contract update; 1285/1285 verify green.
- source: user

### [MED] general — Tap-tooltip phase ✅ (PROMOTED → PHASE_CANDIDATES.md candidate)
- pass: user-jot (commit `cfc524c`); promoted via oversight 31st call 2026-05-22 to `plan/PHASE_CANDIDATES.md` as `[score 5.0] Tap-tooltip primitive + per-surface wiring`. Multi-tick scope — touches every interactive icon across SELF / combat / inventory surfaces. Next `/expand` or `/oversight` decides the slicing (one global primitive + per-surface wiring vs. per-surface ticks).

### [MED] general — Expand DEV mode to cover every ported mechanic ✅
- pass: user-jot (commit 7821f13); addressed at commit `<this-tick>` by filing as a phase candidate (not a one-tick fix — meta-feature ask requires planning).
- Filed as `[score 6.0] DEV-mode coverage expansion — one debug affordance per ported mechanic` in `plan/PHASE_CANDIDATES.md` `## Pending`. Includes initial gap inventory (XP / mana / alignment / effects / event-kind triggers / dialogue jump / quest state / friendship / currency / HUD overrides) + suggested phased breakdown (Phases 61-66 as small per-mechanic phases, or one bigger parent phase with sub-rows).
- Next: `/oversight` decides on the slicing (parent-with-sub-rows vs. per-mechanic small phases) and promotes the first piece.

### [MED] general — no combat encounters in the first map ✅
- pass: user-jot (commit c3c4e4e); addressed at commit `<this-tick>` via `state/exploration-maps/event-pools.ts`
- Root cause: mobile's layout files annotated nodes with type (encounter / boss / rest / gather / treasure / quest), but the engine's map-event pool registry was empty — `resolveMapEvent` returned `{ kind: 'none' }` on every node. Walking onto an encounter node did nothing because no pool was registered for the engine's `lookupPool(continent, mapName, nodeId)` to find.
- Fix: a new module that registers one pool per node type (encounter / boss per map; rest / gather / treasure / quest shared across maps) and then a per-node `setNodeEventPoolOverride` call for every node in both fishing-village and northern-forest layouts. Auto-registers on module import; `app/_layout.tsx` imports it as a side-effect so production picks up the registration at boot. Enemy slugs picked from the engine's `EnemiesByMap` library (fishing-village → tidepool-crab / coastal-tyrant; northern-forest → disatree / the-disagreement).
- Result: walking onto `fv-3` now fires an `encounter` event with `tidepool-crab`. The existing flow does the rest: tab-mutex flips, STRIFE tab becomes visible, combat starts.

### [MED] general — manual combat trigger + starting-character seed for testing ✅
- pass: user-jot (commit 686d598); addressed at commit `<this-tick>` via DebugCombatButton + DevAutoSeed
- Manual trigger: SELF tab DEBUG · COMBAT row's STRIKE button calls `actions.startCombat(createMockEncounterEnemy())` + `enterCombat()` + routes to /(tabs)/combat. Bypasses the tab-mutex catch-22 (STRIFE tab hidden until combat active; combat-active requires encounter node; first map has none — second jot row).
- Auto-seed: `<DevAutoSeed />` mounts inside the providers tree at the root layout; on first DEV boot with empty inventory, fires `actions.debugSeed()` once. Persisted state means subsequent launches skip. `__DEV__` false → no-op.

### [MED] /app/(tabs)/exploration/index.tsx:373-379 — aftermath banner display literals lifted onto presenter ✅
- pass: 16 (commit 56725ae); addressed at commit fd410cc
- viewport: repository
- category: voice
- observation: Phase 41 shipped the aftermath banner with
  four display literals inline at the view layer ('IT IS WON' /
  'IT IS DONE' / 'The foe yielded.' / 'The foe fell.') chosen
  by branching on `lastOutcome`. Hard Rule #8 violation —
  per-outcome copy + the outcome→copy mapping both belong on
  a presenter.
- fix: new `selectAftermathCopy(outcome): AftermathCopy | null`
  helper in `state/combat-mode.tsx` returning `{eyebrow,
  title, subtitle}` for victory + parley, null for defeat +
  flee. Banner becomes prop-driven (no string defaults).
  Exploration screen reads the helper; banner mounts only
  when copy is non-null (filters silent outcomes
  automatically). +4 hermetic cases pinning the per-outcome
  contract.

### [LOW] /components/AftermathBanner.tsx:53 — accessibilityLiveRegion + announceForAccessibility added ✅
- pass: 16 (commit 56725ae); addressed at commit fd410cc
- viewport: repository
- category: a11y
- observation: Banner had `pointerEvents="none"` on its root
  with no accessibility props. The 2500ms auto-dismiss meant
  a screen-reader user got no notification of the victory.
- fix: added `accessibilityLiveRegion="polite"` +
  `accessibilityLabel` on the root View; the useEffect that
  starts the dismiss timer also fires
  `AccessibilityInfo.announceForAccessibility(`${eyebrow}.
  ${title}`)` as a one-shot.

### [MED] /plan/phases/phase_32_design_refresh.md:88-109 — Sub-tick log stale (only A-D listed; E-H shipped) ✅
- pass: 15 (commit f1a8a94); addressed at commit e78dbb6
- viewport: repository
- category: docs
- observation: Phase 32 brief's Sub-tick log table stopped at
  tick D (encounter modal seam, 2026-05-17) with closing
  "Next: tick E (awaiting user port commit)". Ticks E (dock),
  F (slot filter), G (per-slot glyphs), H (node toast) have
  all shipped since but weren't enumerated in the canonical
  log location. A fresh maintainer reading the brief would
  miss four shipped ticks.
- fix: appended rows E (02beaeb / 2a23047), F (9c6024d /
  cc38107), G (05127df — self-contained), H (d7489a2 —
  self-contained); updated trailing "Next:" line to "tick I
  (awaiting next port commit per dispatch rule)" with a
  cross-link to design-spec.md for the inventory of
  un-ported surfaces.

### [LOW] /design-spec.md:266-270 — internal contradiction on cold-codex sizing ✅
- pass: 15 (commit f1a8a94); addressed at commit e78dbb6
- viewport: repository
- category: docs
- observation: closing summary claimed "items 1-10 above are
  all single-port-sized" but item 4 (cold-codex aesthetic
  variant) explicitly described as "three screens" and "much
  larger surface than the per-port sub-ticks" — recommended
  as a fresh `Phase 25` candidate. Self-contradiction.
- fix: rephrased the summary to "Items 1-3 and 5-10 are each
  single-port-sized; item 4 is the exception" with one-line
  explanation pointing back to item 4's body.

### [LOW] /app/(tabs)/inventory/index.tsx:30-66 — per-slot `ItemGlyph` variants ported (helmet / gauntlet / boot / breastplate / ring) ✅
- pass: 14 (commit 2a23047); addressed at commit 05127df
- viewport: repository
- category: design-fidelity
- observation: ItemGlyph fell through to one quad-path glyph
  for Head/Body/Hands/Feet/Accessory — 5 of 7 Equipment Dock
  slots rendered identically when filled, undermining the
  dock's "WORN VS. UNWORN AT A GLANCE" hint copy.
- fix: ported the 5 bespoke per-slot SVG paths from
  `design/handoff-2026-05-16/project/screens/inventory.jsx:
  513-541` to `app/(tabs)/inventory/index.tsx` ItemGlyph,
  translating `<svg>/<path>/<circle>` to react-native-svg
  primitives (`Svg`/`Path`/`Circle`). Each branch carries a
  one-line glyph-meaning comment (helmet w/ horns, gauntlet
  pair, boot profile, breastplate w/ shoulders, ring w/
  stone). Verify 497/497 unchanged.



### [MED] /app/(tabs)/inventory/index.tsx:149 — `'— bare —'` lifted onto `EquipmentDockViewModel.bareLabel` ✅
- pass: 14 (commit 2a23047); addressed at commit 594105b
- issue: #91
- viewport: repository
- category: voice
- observation: `SlotCard` rendered the empty-slot copy
  `'— bare —'` as an inline literal at the view layer. Hard
  Rule #8 violation; sibling chrome (`headerLabel`,
  `hintLabel`) already on the VM.
- fix: added `bareLabel: string` to `EquipmentDockViewModel`;
  `DOCK_BARE_LABEL = '— bare —'` constant in
  `inventory.engine.ts`; `buildEquipmentDock` emits it.
  Screen's `SlotCard` now takes a `bareLabel` prop and reads
  `vm.bareLabel` from the dock VM. +1 hermetic case pinning
  the new field. Verify 492/492 unchanged.

### [MED] /app/(tabs)/inventory/index.tsx PaperDoll — 10× `"#0a0807"` → `AXM.silhouette` ✅
- pass: 14 (commit 2a23047); addressed at commit 2a22a74
- issue: #90
- viewport: repository
- category: consistency
- observation: The Phase 32 tick E port shipped `PaperDoll`
  with 10 inline `fill="#0a0807"` literals. Same Hard Rule #8
  class as the just-drained 8× `'#100d0a'` sweep.
- fix: added `AXM.silhouette = '#0a0807'` to `theme/axm.ts`
  with a JSDoc comment placing it visually between `deepBg`
  (void) and `dockBg` (panel) — warmer than deepBg, cooler
  than dockBg. Replaced 10 `fill="#0a0807"` with
  `fill={AXM.silhouette}`. Same value; no behavioural delta.
  Verify 492/492 unchanged.

### [MED] sweep — 8× hex literal `'#100d0a'` → `AXM.panelBg` across combat/inventory/exploration/_layout ✅
- pass: 13 follow-up; filed via `/oversight` 2026-05-18;
  addressed at commit 9339e3e
- issue: #89
- viewport: repository
- category: consistency
- observation: After three prior single-component drains
  (memoir `8a4f69c`, character `9531270`, StatusCard
  `8b3747b`), 8 more `'#100d0a'` occurrences remained
  across 4 files. `/oversight` directed a sweep rather than
  4 more single-component ticks.
- fix: eight mechanical replacements
  (`backgroundColor: '#100d0a'` → `backgroundColor: AXM.panelBg`)
  across `app/(tabs)/combat.tsx:199,804,818,829`,
  `app/(tabs)/inventory/index.tsx:388,448`,
  `app/(tabs)/exploration/index.tsx:496`,
  `app/(tabs)/_layout.tsx:199`. Same value; no behavioural
  delta. Verify 488 / 488 unchanged. Project is now
  `'#100d0a'`-free outside `theme/axm.ts`.

### [MED] /components/StatusCard.tsx:56 — hex literal `'#100d0a'` → `AXM.panelBg` ✅
- pass: 13 (commit ce4f851); addressed at commit 8b3747b
- issue: #88
- viewport: repository
- category: consistency
- observation: StatusCard's `card` style hard-coded
  `'#100d0a'` — same literal pass 11 / pass 12 drained from
  memoir + character. Reusable component, Hard Rule #8.
- fix: one-line replace `backgroundColor: '#100d0a'` →
  `backgroundColor: AXM.panelBg` in
  `components/StatusCard.tsx:56`. Verify 488/488 unchanged.
  Broader hex-literal terrain (8 more `'#100d0a'` in
  combat/inventory/exploration/_layout) noted on the row's
  pending-state body for future passes.

### [MED] /state/presenters/event.engine.ts:323 — combat-prelude `body` lowercase ritual register ✅
- pass: 12 (commit a836031); addressed at commit 3b54f98
- issue: #87
- viewport: repository
- category: voice
- observation: Combat-prelude `body` was sentence-case stat
  block `'Level N. M HP.'` rendered under a drop-cap as
  primary narrative prose, while every sibling prelude /
  narrative body holds lowercase ritual register
  (`'the world is still.'`, `'something stirs'`, `'no
  retreat from this one.'`).
- fix: changed `body` to
  `` `level ${enemy.level} · ${enemy.health} hp.` `` in
  `state/presenters/event.engine.ts:323`. Lowercases the
  shape, swaps the period separator for a middot (matches
  other chrome separators across the surface like
  `'CONTINENT · UNKNOWN'`, `'MAP ii of vii'`-style
  formatting), drops 'HP' to 'hp' for register consistency.
  Updated the one test fixture pinning the old literal
  (`components/event/__tests__/EncounterModalOverlay.test.tsx:46`).
  Verify 488 / 488 unchanged.

### [MED] /app/(tabs)/character/index.tsx:226,229,253 — hex literal `'#100d0a'` × 3 → `AXM.panelBg` ✅
- pass: 12 (commit a836031); addressed at commit 9531270
- issue: #86
- viewport: repository
- category: consistency
- observation: Three style entries (`baseCard`, `derivedTable`,
  `slotCell`) hard-coded `'#100d0a'` — same literal / use case
  pass 11 drained from memoir (commit `8a4f69c`). Bearings
  line 109 locks "no hex literals in components".
- fix: three mechanical replacements
  (`backgroundColor: '#100d0a'` → `backgroundColor: AXM.panelBg`)
  in `app/(tabs)/character/index.tsx:226,229,253`. Mirrors
  the memoir pass-11 fix exactly. Same value; no behavioural
  delta. Verify 488 / 488 unchanged.

### [LOW] /app/(tabs)/memoir/index.tsx:174,189 — view layer label-literal comparisons → isEmpty / rationale.length ✅
- pass: 11 (commit 5be0022); addressed at commit 0e173a4
- issue: #85
- viewport: repository
- category: consistency
- observation: MemoirScreen renders the moral / philosophical
  empty-state lines conditionally on
  `vm.moralAlignment.chip.label === 'UNDECLARED'` (line 174)
  and `vm.philosophicalAlignment.label === 'UNTESTED'` (line
  189). A future voice pass that renames either band would
  silently break the conditional.
- fix: added `isEmpty: boolean` to MoralAlignment VM kind;
  DEFAULT_MORAL ships `isEmpty: true`; buildMoralAlignment
  derives it from `band.label === DEFAULT_MORAL.chip.label`
  (encapsulates rename within memoir.engine.ts). Screen
  swaps to `vm.moralAlignment.isEmpty` and (for
  philosophical) `vm.philosophicalAlignment.rationale.length
  === 0` — symmetric with line 184's existing
  `rationale.length > 0` guard. +1 hermetic test pinning the
  isEmpty contract. Verify 488 / 488 (was 487).

### [LOW] /state/presenters/inventory.engine.ts:133 — `EMPTY_MESSAGE` lowercased ('Nothing' → 'nothing') ✅
- pass: 11 (commit 5be0022); addressed at commit b90bf73
- issue: #84
- viewport: repository
- category: voice
- observation: `EMPTY_MESSAGE = 'Nothing in the satchel.'`
  was the sole sentence-cased narrative empty-state across
  every presenter; sibling surfaces all ship lowercase
  ritual register (bearings line 184).
- fix: one-character edit, `'Nothing'` → `'nothing'` in
  `state/presenters/inventory.engine.ts:133`. Aligns
  inventory with the 7 other lowercase ritual empty-states
  shipped by sibling presenters. Verify 487/487 unchanged;
  no test asserted on the literal.

### [MED] /state/presenters/exploration.engine.ts:288 — `dayDisplay` 'XXIV' YAGNI deletion ✅
- pass: 11 (commit 5be0022); addressed at commit 4913ab9
- issue: #83
- viewport: repository
- category: comprehension
- observation: Populated selector branch shipped
  `dayDisplay: 'XXIV'` as a fixed Roman numeral while the
  field's JSDoc claimed a live in-game day value. Every
  player on every map saw "day XXIV" regardless of
  progression.
- fix: confirmed engine surface has no `day` / `turn` /
  `stepCount` state (`node_modules/axiomancer-mechanics/dist/`
  has no day field). Per suggested-fix branch B (delete when
  engine doesn't expose state), deleted the `dayDisplay`
  field from `ExplorationViewModel` interface (line 88), the
  FALLBACK_VM (line 230), and the populated branch (line
  288); deleted the screen's `dayBox` / `dayLabel` / `dayNum`
  block (`app/(tabs)/exploration/index.tsx:172-175`) and the
  three matching StyleSheet entries; dropped the
  `expect(typeof vm.dayDisplay).toBe('string')` line in
  `state/e2e/exploration.engine.test.ts:37`. Same YAGNI
  pattern previously used for `swipeHint` (commit `5a8c2ea`).
  Verify 487 / 487 unchanged. Re-add via /expand when a real
  engine day counter ships.

### [MED] /app/(tabs)/memoir/index.tsx:249,280 — hex literal `'#100d0a'` → `AXM.panelBg` ✅
- pass: 11 (commit 5be0022); addressed at commit 8a4f69c
- issue: #82
- viewport: repository
- category: consistency
- observation: MemoirScreen's `questCard` and `measureChip`
  StyleSheet entries inlined the raw hex `'#100d0a'` for
  `backgroundColor`, despite `theme/axm.ts:11` already
  exporting `panelBg: '#100d0a'` named for this exact use.
  Bearings line 109 locks "no hex literals in components".
- fix: two mechanical replacements
  (`backgroundColor: '#100d0a'` → `backgroundColor: AXM.panelBg`)
  in `app/(tabs)/memoir/index.tsx:249,280`. Same value, no
  behavioural delta. Verify 487 / 487 unchanged.

### [LOW] /state/presenters/event.engine.ts:152 — `STRIFE STIRS` is verb-as-chrome — `[accepted-as-design]` ✅
- pass: 6 (commit 08bcf5e); resolved via /oversight 2026-05-16
- viewport: repository
- category: voice
- observation: Reader twice flagged the sash text as
  sentence-shaped (subject + present-tense verb) cased like
  chrome — bearings line 180 reserves uppercase for chrome
  labels and lowercase ritual for narrative.
- resolution: **Accepted as intentional design.** The sash
  itself is a chrome element (diagonal flag at the
  illustration's top-left), and the slightly-verb-shaped
  phrasing reads as an in-world omen on the encounter card
  rather than as inappropriate narrative-in-chrome. A
  verb-as-chrome exception is now pinned in
  `plan/bearings.md` Hard Rules so future critique passes
  don't re-surface this row.

### [MED] /state/presenters/inventory.engine.ts:133 — EMPTY_MESSAGE 'sack' → 'satchel' (Phase 32 catch-up) ✅
- pass: 10 (commit 306e3f1); addressed at commit 2822455
- issue: #81
- viewport: repository
- category: consistency
- observation: Phase 32 SACK→SATCHEL rename swept chrome but
  not this narrative line; the empty-state copy was the only
  surviving 'sack' on the inventory surface.
- fix: single-string flip in `state/presenters/inventory.
  engine.ts:133` — `'Nothing in the sack.'` → `'Nothing in
  the satchel.'`. Lowercase ritual register preserved; no
  test asserted on the literal. Verify 487 / 487 unchanged.

### [LOW] /state/e2e/combat.engine.test.ts — buildPhaseStack `'ended'` branch pinned ✅
- pass: 8 (commit 9a4bdeb); addressed at commit f87a5ec
- issue: #80
- viewport: repository
- category: comprehension
- observation: phaseStack contract tests covered every
  non-ended phase but not the `currentPhase === 'ended' ?
  'resolving' : currentPhase` special case in buildPhaseStack
  — a regression dropping the special case would silently
  collapse every row to past post-fight + stop rendering the
  ResolvePanel.
- fix: 1 test added — drive combat to `phase === 'ended'`,
  assert phaseStack[3] stays current with key 'resolving'
  and label 'IV · LET'; the three earlier rows are all past.
  Inline comment explains why the special case matters so a
  future reader doesn't strip it. Verify 487 / 487 (+1 from
  486).

### [LOW] /components/event/EncounterModalOverlay.tsx:1-19 — JSDoc now mentions vm.preludeChrome contract ✅
- pass: 9 (commit 65dc6ad); addressed at commit cfac6f1
- issue: #79
- viewport: repository
- category: docs
- observation: File JSDoc described backdrop / seal-chain /
  mount-conditions but never the four-string `vm.preludeChrome`
  contract or the `preludeChrome === null` defensive guard.
- fix: appended a paragraph naming all four chrome strings,
  documenting the defensive null return, and pointing at the
  new `components/event/__tests__/EncounterModalOverlay.test.tsx`
  for component-level pins.

### [LOW] /state/presenters/exploration.engine.ts:99-116 — drawerCopy.swipeHint YAGNI dead-field deleted ✅
- pass: 9 (commit 65dc6ad); addressed at commit 5a8c2ea
- issue: #78
- viewport: repository
- category: consistency
- observation: `swipeHint` declared + populated + tested
  but unconsumed since Phase 32 dropped horizontal swipe.
- fix: deleted from the VM type, JSDoc paragraph,
  `DRAWER_COPY` constant, and test assertion. Same shape
  as pass-4 `vm.a11y` and pass-7 `emptyMoral` drains.
  Re-add if a future horizontal surface materializes.

### [MED] /components/event/EncounterModalOverlay.tsx — hermetic component test added ✅
- pass: 8 (commit 9a4bdeb); addressed at commit 234c7a6
- issue: #77
- viewport: repository
- category: comprehension
- observation: New ~330-line overlay shipped without a
  component test — mount conditions, FLEE-disabled-for-boss
  branch, and non-dismissible backdrop all unguarded.
- fix: new file `components/event/__tests__/EncounterModalOverlay.test.tsx`
  with 8 hermetic cases across 3 describe blocks (mount
  conditions / FLEE-disabled-for-boss / non-dismissible
  backdrop). Verify 486 / 486 (+8 from 478; suite count
  29 → 30).

### [LOW] /state/presenters/memoir.engine.ts:127,359 — `'untested.'` chip/narrative register split ✅
- pass: 7 (commit 3385951); addressed at commit aeec2c3
- issue: #76
- viewport: repository
- category: voice
- observation: Same `'untested.'` string used as both chip
  label (chrome register expects ALL-CAPS no period) and
  empty-state line (narrative register).
- fix: chip label flipped to `'UNTESTED'` (matches RUTHLESS /
  STERN / UNDECLARED / BENEVOLENT / SAINTLY); empty-state
  line `emptyPhilosophical` unchanged at `'untested.'`. Screen
  check + 2 test pins updated; JSDoc block added at the
  constant explaining the split.

### [MED] /state/presenters/event.engine.ts:75-82 — PreludeChrome JSDoc refreshed to four-field reality ✅
- pass: 9 (commit 65dc6ad); addressed at commit d843be8
- issue: #75
- viewport: repository
- category: docs
- observation: JSDoc said "both strings" but the interface
  carried 4 fields after pass-7/8 chrome lifts — undercount.
- fix: rewrote summary to enumerate all 4 strings (eyebrow,
  sash, seal-bar, flee-disabled hint); noted the SEALED · NO
  RETREAT chain bars + FLEE-disabled hint as the additions
  from pass-7/8; added a note about the null branch the
  EncounterModalOverlay early-return guard depends on.

### [MED] /plan/ docs — SACK→SATCHEL sweep across briefs ✅
- pass: 6 (commit 08bcf5e); addressed at commit b342553
- issue: #74
- viewport: repository
- category: docs
- observation: Phase 32's SACK→SATCHEL rename landed in
  presenter + tests but plan/ docs still spelled SACK in
  places; grep returned 16 hits and a fresh maintainer
  couldn't tell historical from live.
- fix: hybrid sweep — `phase_33_memoir_tab.md:254` flipped to
  SATCHEL (was a current-state claim about live tab bar);
  `phase_31_tabs_design_pass.md` + `phase_8_navigation_app_shell_polish.md`
  gained a one-line breadcrumb at the top noting the
  rename. Historical-quote contexts (rename narrative in
  build plan, Phase 31 brief body, prior CRITIQUE Done rows,
  AUDIT bias descriptions) left as-is — they quote what the
  surface was at a given commit, not what it is now.

### [MED] /components/event/EncounterModalOverlay.tsx:42-43 — seal + flee-hint chrome routed through vm.preludeChrome ✅
- pass: 8 (commit 9a4bdeb); addressed at commit ec5f875
- issue: #73
- viewport: repository
- category: voice
- observation: Two encounter-modal chrome strings parked at
  view-module scope (`SEAL_LABEL`, `FLEE_DISABLED_HINT`)
  instead of flowing through `vm.preludeChrome` per the
  established pattern from pass 6's ENCOUNTER_LABEL drain.
- fix: extended `PreludeChrome` with `sealLabel` +
  `fleeDisabledHint`; populated in `withPreludeChrome`;
  `ChainBar` takes label as prop; overlay reads both off the
  VM. The two existing `preludeChrome contract` shape pins
  now include the full 4-field VM in lockstep.

### [MED] /app/(tabs)/exploration/index.tsx:281,324 — drawer header + LEAGUES column label lifted onto VM ✅
- pass: 8 (commit 9a4bdeb); addressed at commit 6251e83
- issue: #72
- viewport: repository
- category: voice
- observation: WHITHER PILGRIM eyebrow + LEAGUES column label
  were inline JSX; same Hard Rule #8 class drained pass 6/7.
- fix: extended `ExplorationViewModel.drawerCopy` with `title`
  + `leaguesLabel`; populated in `DRAWER_COPY` constant;
  screen reads `vm.drawerCopy.title` + `…leaguesLabel`. 2
  pins added to the existing drawer-copy test case.

### [MED] /plan/steps/01_build_plan.md:334-335 — Phase 33 row body refreshed SACK → SATCHEL ✅
- pass: 7 (commit 3385951); addressed at commit 2f846a3
- issue: #71
- viewport: repository
- category: docs
- observation: Phase 33's row body (ticked `[x]` at `6c1ddfa`
  after the rename) still spelled the fourth tab `SACK` —
  fresh stale reference in post-rename narrative.
- fix: single-line swap `SACK` → `SATCHEL` on line 335.
  Historical-quote contexts (pre-Phase-31 quotes) still
  covered by the standing SACK docs sweep row.

### [HIGH] /app/(tabs)/combat.tsx:9-15,312 — file-level + section JSDoc refreshed post phase-stack swap ✅
- pass: 8 (commit 9a4bdeb); addressed at commit 5ffb330
- issue: #70
- viewport: repository
- category: docs
- observation: File JSDoc + line-321 section banner still
  described the horizontal swipe carousel removed in
  `9222bf9` — actively misleading for fresh maintainers.
- fix: rewrote the Q5-carousel paragraph in present tense
  describing the vertical PhaseStack pattern (past/current/
  future states, sulfur dot indicator, swap removed the
  swipe-to-change-phase affordance); section banner flipped
  to "header + vertical PhaseStack". Reference commit
  `9222bf9` for the port history.

### [HIGH] /app/(tabs)/combat.tsx:761 — ResolvePanel `✠ DEPART` / `✠ NEXT ROUND` chrome lifted onto VM ✅
- pass: 8 (commit 9a4bdeb); addressed at commit 0981e46
- issue: #69
- viewport: repository
- category: voice
- observation: Continue button inlined two chrome literals
  in JSX — same Hard Rule #8 class drained pass 6 / pass 7.
- fix: added `nextActionLabel: string` to `ResolveSlice`
  (phase-driven), pinned `NEXT_ROUND_LABEL` + `DEPART_LABEL`
  at module scope, dropped unused `isEnded` prop from
  ResolvePanel, +3 hermetic pins. Verify 478 / 478 (+3 from
  475).

### [MED] /scripts/smoke-screens.mjs:34-42 + test mirror — memoir route added to smoke coverage ✅
- pass: 6 (commit 08bcf5e); addressed at commit 78bb861
- issue: #68
- viewport: repository
- category: consistency
- observation: ROUTES list + mirror test missed Phase 33's
  MEMOIR tab; visual smoke coverage silently skipped the new
  journal surface for the entire phase shipping window.
- fix: added `{ name: 'memoir', path: '/memoir' }` to ROUTES
  in both files; mirror test flipped from "five (4 tabs)" to
  "six (5 tabs)" with `'memoir'` added to arrayContaining.
  Baseline PNG generates on the next harness run.

### [MED] /app/(tabs)/memoir/index.tsx + memoir.engine.ts:358-359 — VM `emptyMoral` / `emptyPhilosophical` strings now consumed ✅
- pass: 7 (commit 3385951); addressed at commit 883af26
- issue: #67
- viewport: repository
- category: consistency
- observation: VM exposed `emptyMoral` + `emptyPhilosophical`
  strings the screen never read — dead VM contract, same
  class as the `vm.a11y` finding drained pass 4.
- fix: MeasureSection now renders `emptyMoral` beneath the
  moral chip when label === 'UNDECLARED'; renders
  `emptyPhilosophical` beneath the philosophical chip when
  label === 'untested.'. Satisfies the Phase 33 brief
  §"Empty / loading / error states" copy contract. New
  testIDs `memoir-moral-empty` + `memoir-philosophical-empty`
  for future smoke-render pins.

### [MED] /state/presenters/memoir.engine.ts:236,244 — `PARLEYED WITH` for flee outcome → re-voiced to FLED ✅
- pass: 7 (commit 3385951); addressed at commit 8717d8e
- issue: #66
- viewport: repository
- category: voice
- observation: Chronicle was mapping the flee outcome to
  `'PARLEYED WITH'` / `'talks turn aside.'` — the engine has
  no parley outcome today, so the journal was claiming the
  player negotiated when they actually fled. Pass-7 reader
  flagged it as lying; /oversight 2026-05-16 chose Re-voice
  to FLED.
- fix: `buildChronicle` flee branch now emits label `'FLED'`
  + body `'the path bends away.'` matching the FELLED /
  ROUTED BY register. JSDoc updated; test fixture flipped
  in lockstep. PARLEYED WITH can return as its own mapping
  when/if the engine ships a real parley outcome.

### [MED] /state/presenters/memoir.engine.ts:447-462 — `selectMemoirViewModel` JSDoc stale after Ticks C+D shipped ✅
- pass: 7 (commit 3385951); addressed at commit c15c755
- issue: #65
- viewport: repository
- category: docs
- observation: JSDoc still narrated Tick B as `(this commit)`
  and described Ticks C-D as future placeholders, even though
  all four ticks shipped on 2026-05-16.
- fix: rewrote the `selectMemoirViewModel` JSDoc in present
  tense (one paragraph per VM section with read source +
  current behaviour); moved the tick-by-tick changelog into a
  `## Phase 33 history` subsection. Refreshed the file-level
  JSDoc to drop the pre-ship framing.

### [HIGH] /app/(tabs)/memoir/index.tsx:42 — QuestCard inlines objective bullet glyphs ✅
- pass: 7 (commit 3385951); addressed at commit 40db0e3
- issue: #64
- viewport: repository
- category: consistency
- observation: Inline `'✓ '` / `'○ '` glyphs at the view layer
  — same Hard Rule #8 class pass 6 just closed for event.tsx.
- fix: exported `QUEST_OBJECTIVE_BULLET = { done: '✓',
  pending: '○' }` constant + extended `MemoirQuestRow.objectives`
  with `bullet: '✓' | '○'`; screen now reads `{o.bullet}
  {o.text}`. +2 pins added to the existing active-quests test
  case. Verify 461 / 461 unchanged (pins inside existing case).

### [LOW] /state/presenters/event.engine.ts:115 — empty-state body is second-person imperative + modern sentence-case ✅
- pass: 6 (commit 08bcf5e); addressed at commit d6bf779
- issue: #63
- viewport: repository
- category: voice
- observation: Empty-state body `'Walk on. The world has not
  yet stirred.'` was second-person imperative + modern
  sentence-case; moved to the VM in pass 5 but never re-voiced
  to match the lowercase-ritual register adopted everywhere else.
- fix: re-voiced to `'the world is still.'` — lowercase ritual
  matching `'the paths close.'` / `'none at hand.'`. Avoided
  the verb `stirred` so the empty-state body doesn't echo the
  `STRIFE STIRS` chrome sash. No test added (existing shape
  test still covers the field; pinning the exact string would
  over-constrain). Verify 461 / 461.

### [MED] /state/presenters/event.engine.ts:144-155 + :203-251 — `'ENCOUNTER'` literal duplicated between preludeChrome and badge ✅
- pass: 6 (commit 08bcf5e); addressed at commit 11c47db
- issue: #62
- viewport: repository
- category: consistency
- observation: Same `ENCOUNTER` literal lived in two places
  derived from the same `isBoss` boolean (`withPreludeChrome`
  eyebrow + `composeCombatPrelude` badge) with no test pinning
  the relationship — silent-drift risk on any copy edit.
- fix: exported `ENCOUNTER_LABEL = 'ENCOUNTER'` module constant
  referenced from both sites; +2 hermetic pins under
  `selectEventViewModel: preludeChrome contract` (non-boss
  asserts both equal `ENCOUNTER_LABEL`, boss asserts eyebrow
  ends with it + badge diverges to `OMEN OF DOOM`).
  Verify 461 / 461 (+2 from 459).

### [HIGH] /app/event/index.tsx:217-218,291,298 — display literals still at view layer post Phase-32 port ✅
- pass: 6 (commit 08bcf5e); addressed at commit 994fb02
- issue: #61
- viewport: repository
- category: consistency
- observation: After the Phase 32 prelude-chrome lift, four
  display literals (`BACK`, `RETURN`, `SKIP ›`, `✠ A RECKONING`)
  still lived at the view layer — same Hard Rule #8 class pass 5
  closed elsewhere.
- fix: added `EventChrome` interface + `EVENT_CHROME` constant +
  `withChrome` wrapper sibling to `withPreludeChrome`; lifted
  all four strings off `app/event/index.tsx` onto `vm.chrome.*`;
  +4 hermetic tests under `selectEventViewModel: chrome
  contract`. Verify 428 / 428 (+4 from 424).

### [needs-user-call] /app/(tabs)/_layout.tsx — tab labels MAP / COMBAT / SHEET / SACK mix registers ✅
- pass: 2 (commit d967f27)
- viewport: repository
- category: navigation
- observation: The four tab titles wobble as a coherent set — three are objects/places (MAP, SHEET, SACK) and one is an event/state (COMBAT).
- evidence: `app/(tabs)/_layout.tsx` lines 98, 113, 128, 142.
- suggested fix: Align to one register.
- source: reader
- **Unblocked 2026-05-16 via `/oversight`** — promoted as Phase 31 (Tabs design pass) in `plan/steps/01_build_plan.md` with explicit register pick: **all places** (`WILDS · STRIFE · SELF · SACK`). Phase 31 ships after Phase 30 (hermetic render coverage) so the tab title pipeline is verified working before the strings change. Row moved Pending → Done; the fix lands as part of Phase 31's commit.

### [LOW] /plan/steps/01_build_plan.md — Phase 17 row's "to be drafted" parenthetical lacks owner reference ✅
- pass: 5 (commit dfb3358)
- viewport: repository
- category: comprehension
- observation: Phase 17 row referenced an unwritten brief at the time of critique.
- evidence: `plan/steps/01_build_plan.md:167-169` pre-fix (and pre-Phase-28).
- suggested fix: Append `— drafted by Phase 28` to the Phase 17 row.
- source: reader
- issue: #55
- fixed in commit `ee64020`. The brief landed via Phase 28 (`ab3912a`) and the row already cited Phase 28; this fix replaced the remaining `<this commit>` placeholder with the actual hash so the pointer is concrete.

### [LOW] /app/(tabs)/inventory/index.tsx — static category headers + `SACK · WALLET · BURDEN` hardcoded ✅
- pass: 5 (commit dfb3358)
- viewport: repository
- category: consistency
- observation: Section eyebrow + four category headers lived at the view layer; pass-3 had moved emptyMessage but skipped these.
- evidence: `app/(tabs)/inventory/index.tsx:28-33` + `:141` pre-fix.
- suggested fix: Move both onto `selectInventoryViewModel`.
- source: reader
- issue: #54
- fixed in commit `17297af` — `vm.sectionHeader` + `vm.categoryHeaders` populated; screen reads via VM; +1 hermetic shape test. 390/390 pass.

### [LOW] /app/(tabs)/character/index.tsx — "NO ACTIVE EFFECTS" hardcoded HUD-imperative ✅
- pass: 5 (commit dfb3358)
- viewport: repository
- category: voice
- observation: Effect-section empty label was hardcoded ALLCAPS at the view layer rather than the lowercase-ritual + `textTransform: 'uppercase'` pattern unified across other screens.
- evidence: `app/(tabs)/character/index.tsx:95` pre-fix.
- suggested fix: Add `emptyEffectsMessage: 'none at hand.'` to the VM; render via `textTransform: 'uppercase'`.
- source: reader
- issue: #53
- fixed in commit `69588e2` — `vm.emptyEffectsMessage = 'none at hand.'`; screen reads via the existing emptyLabel style augmented with `textTransform: 'uppercase'`. +1 shape test. 389/389 pass.

### [MED] /app/(tabs)/exploration/index.tsx — drawer empty-state + swipe hint hardcoded; voice mismatch ✅
- pass: 5 (commit dfb3358)
- viewport: repository
- category: consistency
- observation: Drawer empty-state `"No paths remain from here."` and `"swipe →"` were hardcoded ritual copy at the view layer; the empty string also read sentence-case modern rather than the article-prefix lowercase ritual used elsewhere.
- evidence: `app/(tabs)/exploration/index.tsx:244` + `:249` pre-fix.
- suggested fix: Move both strings to `selectExplorationViewModel`; rephrase as lowercase ritual.
- source: reader
- issue: #52
- fixed in commit `6122db8` — `vm.drawerCopy.emptyMessage = 'the paths close.'` and `vm.drawerCopy.swipeHint`; both code paths populated; +2 hermetic shape + regression tests. 388/388 pass.

### [MED] /app/(tabs)/combat.tsx — hardcoded ritual copy violates Hard Rule #8 ✅
- pass: 5 (commit dfb3358)
- viewport: repository
- category: consistency
- observation: Two ritual strings lived at the view layer — battle-log empty `"The air shivers. Combat begins."` and flee row `"or … flee like a craven (luck save)"`.
- evidence: `app/(tabs)/combat.tsx:259` + `:577` pre-fix.
- suggested fix: Surface both on the combat VM and drop the literals.
- source: reader
- issue: #51
- fixed in commit `96636fc` — added `vm.logEmptyMessage` + `vm.actionPicker.fleeHint`; both code paths populated; +3 hermetic shape tests. 386/386 pass.

### [MED] /app/(tabs)/character/index.tsx — `vm.a11y` block built but never consumed ✅
- pass: 5 (commit dfb3358)
- viewport: repository
- category: a11y
- observation: `selectCharacterViewModel` built a populated `a11y` block but the screen consumed zero of it; the only inline a11y string was a hardcoded `accessibilityLabel="Open Token Crucible"` on the Crucible button.
- evidence: `state/presenters/character.engine.ts:204-215` built `a11y` strings; `app/(tabs)/character/index.tsx` consumed 0 of them.
- suggested fix: Wire `vm.a11y.*` onto the section wrappers + replace the inline Crucible literal with a presenter-sourced label.
- source: reader
- issue: #50
- fixed in commit `1380a4f` — header / BASE / DERIVED / SAVES & TESTS / AFFLICTIONS & BLESSINGS / WORN & WIELDED + Crucible button all carry `accessibilityLabel={vm.a11y.<section>}`; added `vm.a11y.crucibleOpen` to the presenter. +1 shape test. 383/383 pass.

### [LOW] /state/presenters/event.engine.ts — combat-prelude boss subtitle is the same cryptic line for every boss ✅
- pass: 4 (commit 2a2c0aa)
- viewport: repository
- category: voice
- observation: Every boss opened with `'fourth seal · third sigh'`.
- evidence: `state/presenters/event.engine.ts:176`.
- suggested fix: Derive from `enemy.description` or rotate by level.
- source: reader
- issue: #46
- **Resolved 2026-05-15.** Boss subtitle prefers trimmed `enemy.description`; falls back to a 5-entry per-level table (`first seal` / `second seal` / ... / `fifth seal`) keyed on `enemy.level - 1 % 5` so repeats at the same tier are consistent but different tiers each get their own omen. Verify green at 357/357. Closes #46. See commit `28676c6`.

### [LOW] /state/presenters/event.engine.ts — village `merchants` argument received and discarded ✅
- pass: 4 (commit 2a2c0aa)
- viewport: repository
- category: consistency
- observation: Underscore-prefixed `_merchants` arg silently ignored; deferred-shop signal hidden in comment.
- evidence: `state/presenters/event.engine.ts:355-388`.
- suggested fix: Surface `merchants.length` in subtitle.
- source: reader
- issue: #45
- **Resolved 2026-05-15.** Subtitle now shows `'1 stall'` / `'N stalls'` when merchants exist (empty when none, to keep small villages tidy). The deferred-shop signal is in-VM. Verify green at 357/357. Closes #45. See commit `72487ac`.

### [LOW] /state/presenters/event.engine.ts — cutscene 'ON' button label too terse for the register ✅
- pass: 4 (commit 2a2c0aa)
- viewport: repository
- category: voice
- observation: Cutscene continue button `ON` didn't match the ritual register of sibling choice labels.
- evidence: `state/presenters/event.engine.ts:403`.
- suggested fix: `WALK ON` or `WITNESS`.
- source: reader
- issue: #44
- **Resolved 2026-05-15.** `'ON'` → `'WITNESS'`. Matches the cutscene's `A VISION` badge cadence. Verify green at 357/357. Closes #44. See commit `0038d66`.

### [LOW] /app/(tabs)/exploration/index.tsx — "Where next, pilgrim?" breaks the screen's own glyph + case convention ✅
- pass: 2 (commit d967f27)
- viewport: repository
- category: voice
- observation: Star glyph + sentence case break the ✠+ALLCAPS pattern used elsewhere.
- evidence: `app/(tabs)/exploration/index.tsx:242`.
- suggested fix: Unify to ✠ + ALLCAPS ritual.
- source: reader
- issue: #43
- **Resolved 2026-05-15.** `★ Where next, pilgrim?` → `✠ WHITHER, PILGRIM?` Verify green at 357/357. Closes #43. See commit `d6849bc`.

### [MED] /docs/combat.md — "Stance-derived stats" section references deleted `STANCE_DERIVED` constant ✅
- pass: 4 (commit 2a2c0aa)
- viewport: repository
- category: comprehension
- observation: Doc named deleted constant + future swap that already happened.
- evidence: `docs/combat.md:117-119`.
- suggested fix: Refresh bullet to post-Phase-26 reality.
- source: reader
- issue: #42
- **Resolved 2026-05-15.** Bullet rewritten to describe `deriveStancePerformance` reading `player.derivedStats` (emotional/physical/mental triples, Math.round at the mapper boundary). Verify green at 357/357. Closes #42. See commit `583dc55`.

### [MED] /state/actions.ts — pickEventChoice JSDoc still names removed `processNode` API ✅
- pass: 4 (commit 2a2c0aa)
- viewport: repository
- category: comprehension
- observation: Phase 23 migrated to `resolveMapEvent`; JSDoc still mentioned `processNode`.
- evidence: `state/actions.ts:162`.
- suggested fix: Replace with `resolveMapEvent`.
- source: reader
- issue: #41
- **Resolved 2026-05-15.** One-comment-line edit. `grep -rn processNode state/ app/ components/` now empty. Verify green at 357/357. Closes #41. See commit `133ce07`.

### [MED] /app/crucible.tsx — file-level JSDoc points at dead `app/event.tsx` path ✅
- pass: 3 (commit aaa6dbd)
- viewport: repository
- category: comprehension
- observation: JSDoc cited removed `app/event.tsx`; Phase 6 Tick C moved it to `app/event/index.tsx`.
- evidence: `app/crucible.tsx:8`.
- suggested fix: Update reference.
- source: reader
- issue: #40
- **Resolved 2026-05-15.** JSDoc now points at `app/event/index.tsx` and names the `app/_layout.tsx` Stack.Screen registration for context. Verify green at 357/357. Closes #40. See commit `5696c23`.

### [MED] /state/presenters/event.engine.ts — narrative-choice titles mix HUD-imperative with ritual register ✅
- pass: 4 (commit 2a2c0aa)
- viewport: repository
- category: voice
- observation: Three titles used HUD-imperative `YOU REST/GATHER/TAKE` while hazard/village/interaction branches used ritual phrasing.
- evidence: `state/presenters/event.engine.ts:245,263,267`.
- suggested fix: Article-prefix ritual titles.
- source: reader
- issue: #39
- **Resolved 2026-05-15.** `YOU REST → THE FIRE LOWERS`, `YOU GATHER → THE BRUSH YIELDS`, `YOU TAKE → THE CACHE OPENS`. Three string changes; matches the hazard branch's `THE AIR TURNS` pattern. Verify green at 357/357. Closes #39. See commit `8449ce9`.

### [MED] /app/(tabs)/combat.tsx — skill-availability hint "X of Y available — STANCE LOCKED" reads as a status bar ✅
- pass: 2 (commit d967f27)
- viewport: repository
- category: voice
- observation: Mixed register: lowercase progress + ALLCAPS suffix + em-dash separator. HUD readout, not scripture.
- evidence: `app/(tabs)/combat.tsx:656`.
- suggested fix: Lowercase ritual + em-dot separator.
- source: reader
- issue: #36
- **Resolved 2026-05-15.** `{N} of {M} available — STANCE LOCKED` → `{N} of {M} open · stance bound.` One-line copy change. Verify green at 342/342. Closes #36. See commit `62fc19b`.

### [MED] /app/(tabs)/exploration/index.tsx — map-node `accessibilityLabel` reads internal enum to screen readers ✅
- pass: 2 (commit d967f27)
- viewport: repository
- category: a11y
- observation: Screen-reader users heard raw enum tokens (`locked` / `completed` / `current` / `available`).
- evidence: `app/(tabs)/exploration/index.tsx:190`.
- suggested fix: Map kinds to spoken phrases.
- source: reader
- issue: #35
- **Resolved 2026-05-15.** `accessibilityLabel` now maps `locked → sealed`, `completed → walked`, `current → here`, `available → open` — ritual single-word descriptors, no second-person pronouns. Verify green at 342/342. Closes #35. See commit `3f33d72`.

### [MED] /state/presenters/event.engine.ts — choice descriptions double-uppercased between presenter and screen ✅
- pass: 3 (commit aaa6dbd)
- viewport: repository
- category: voice
- observation: Presenter labels are ALLCAPS and the screen re-uppercased the descriptions, flattening lowercase ritual cadence into HUD shouting.
- evidence: `app/event/index.tsx:93`.
- suggested fix: Drop the screen-side `.toUpperCase()`, move styling to `textTransform: 'uppercase'`.
- source: reader
- issue: #34
- **Resolved 2026-05-15.** Two-line fix in `app/event/index.tsx`: drop `description.toUpperCase()` and add `textTransform: 'uppercase'` to the `choiceSub` style. Source strings stay readable as voice copy; UI still renders caps. Verify green at 342/342. Closes #34. See commit `30e01bd`.

### [MED] /app/event/index.tsx — "✠ WHAT WILL YOU DO?" eyebrow uses modern direct-address voice ✅
- pass: 3 (commit aaa6dbd)
- viewport: repository
- category: voice
- observation: Modern quiz-prompt eyebrow out of register with the rest of the Phase 6 surface.
- evidence: `app/event/index.tsx:225-227`.
- suggested fix: Rephrase to ritual register.
- source: reader
- issue: #33
- **Resolved 2026-05-15.** `'✠ WHAT WILL YOU DO?'` → `'✠ A RECKONING'`. Matches the article-prefix ritual pattern of the surrounding badges. Verify green at 342/342. Closes #33. See commit `2ece636`.

### [MED] /state/presenters/inventory.engine.ts — empty-state copy still says "Thy sack is empty." ✅
- pass: 3 (commit aaa6dbd)
- viewport: repository
- category: voice
- observation: Banned-pronoun violation; also hardcoded in the screen layer (Hard Rule #8 violation).
- evidence: `state/presenters/inventory.engine.ts:112` + `app/(tabs)/inventory/index.tsx:83`.
- suggested fix: Rephrase + drop the hardcoded literal.
- source: reader
- issue: #32
- **Resolved 2026-05-15.** Rephrased to `'Nothing in the sack.'` `EmptySack` component now takes a `message` prop sourced from `vm.emptyMessage`. Q4 JSDoc note updated to point at the bearings rule. Verify green at 342/342. Closes #32. See commit `068322e`.

### [MED] /components/EventGate.tsx — JSDoc claims `selectHasActiveEvent` is a no-op; Spec 08 shipped ✅
- pass: 3 (commit aaa6dbd)
- viewport: repository
- category: comprehension
- observation: The gate's JSDoc said "Spec 08 will make `selectHasActiveEvent` non-trivial. Until then this is a no-op..." — but Spec 08 had shipped.
- evidence: `components/EventGate.tsx:12-14`.
- suggested fix: Rewrite the JSDoc to match the post-Phase-6 reality.
- source: reader
- **Resolved 2026-05-15 via `/oversight` (drop-now).** Phase 23 (the engine-0.7.0 migration in progress) will re-touch the event surface and rewrite this JSDoc as part of its close-out (Tick C/D in `plan/phases/phase_23_mapevents_migration.md`); filing this row as a standalone iterate target would be double-work. Resolution rolled into Phase 23's commit chain.

### [HIGH] /state/presenters/combat.engine.ts — phase banner copy still says "CHOOSE THY STANCE" / "DECLARE THY ACTION" ✅
- pass: 3 (commit aaa6dbd)
- viewport: repository
- category: voice
- observation: Bearings was updated 2026-05-15 (commit `14a9395`) to ban second-person archaic pronouns. These two strings sat on the combat HUD every turn.
- evidence: `state/presenters/combat.engine.ts:268-269`. Test pin at `state/e2e/combat.screen.test.tsx:106,114`.
- suggested fix: Rephrase without `thy` — pattern-match the sibling `✠ INVOKE A SKILL`. Update presenter + screen test.
- source: reader
- issue: #29
- **Resolved 2026-05-15.** Rephrased to `✠ CHOOSE A STANCE` and `✠ DECLARE AN ACTION` — matches the sibling `✠ INVOKE A SKILL` pattern in the same record. Test pins updated. Verify green at 321/321. Closes #29. See commit `e3da6ba`.

### [MED] /app/(tabs)/combat.tsx — "No items at hand. Coming soon." breaks voice on visible failure path ✅
- pass: 2 (commit d967f27)
- viewport: repository
- category: voice
- observation: The Item-action toast string read as a modern dev placeholder. It appeared on the most-tapped failure path (player picks Item before items exist), making it the highest-frequency voice violation in combat.
- evidence: `app/(tabs)/combat.tsx:122`: `setToast('No items at hand. Coming soon.');`
- suggested fix: Rephrase in the project's terse/archaic register and drop the shipping-status aside, e.g. `setToast('Thy hands are empty.');`
- source: reader
- issue: #28
- **Resolved 2026-05-15.** Replaced the toast string with `'Thy hands are empty.'` Verify green at 287/287. Closes #28. See commit `176cc80`.

### [HIGH] /app/event.tsx — dev-only ENCOUNTER/BOSS variant toggle shipped to players ✅
- pass: 2 (commit d967f27)
- viewport: repository
- category: comprehension
- observation: The modal event screen rendered a top-of-screen `ENCOUNTER` / `BOSS` toggle as two full-width tappable buttons — a stranger landing in this scene from `EventGate` would read it as a real choice and be confused. The accompanying comment literally tagged it `for demo`.
- evidence: `app/event.tsx:135-143`: `{/* Variant toggle (for demo) */}` … two `TouchableOpacity` rows rendered above the illustration.
- suggested fix: Gate behind `__DEV__` (or remove entirely); the screen is the player-facing modal in production, not a dev sandbox.
- source: reader
- issue: #27
- **Resolved 2026-05-15.** Wrapped the toggle JSX in `{__DEV__ && (...)}` in `app/event.tsx`. In production builds the toggle disappears entirely; in dev / Expo Go it stays so the team can still preview the boss illustration while Phase 6 (event screen wiring) is [skipped]. Default `variant` state remains `'encounter'`. Verify green at 287/287. Closes #27. See commit `c4fd3a4`.

### [LOW] /state/presenters/navigation.engine.ts — TODO comments break voice consistency ✅
- pass: 1 (commit 2a2b0b6)
- viewport: repository
- category: voice
- observation: Multiple TODO comments break the terse archaic voice with modern development language
- evidence: navigation.engine.ts lines contain 'TODO: When engine exposes' which conflicts with the ritual/archaic voice guideline
- suggested fix: Rewrite TODOs in archaic voice or use different comment style
- source: reader
- issue: #23
- **Resolved 2026-05-15.** Rewrote both `TODO`-prefixed comments in `state/presenters/navigation.engine.ts` to match the codebase's "Until / Once X ships…" pattern already used in `components/EventGate.tsx` and `state/presenters/character.engine.ts`. No behaviour change — `selectTabBadges` still returns `EMPTY_BADGES`. Closes #23.

### [MED] /app/_layout.tsx — deep link implementation status unclear ✅
- pass: 1 (commit 2a2b0b6)
- viewport: repository
- category: comprehension
- observation: Deep linking handlers are stubbed with TODO comments indicating incomplete implementation
- evidence: app/_layout.tsx lines 72-82: handleDeepLink function has logic but comments suggest incomplete functionality
- suggested fix: Complete deep link implementation or document current limitations
- source: reader
- issue: #21
- **Resolved 2026-05-15.** Removed the dead `handleDeepLink` `useEffect` block from `app/_layout.tsx` (both branches were no-ops); replaced with a comment block documenting that deep linking is declared in `app.json` but not yet wired to navigation, plus the implementation notes needed when it gets wired. Also dropped the now-unused `expo-linking` import. Closes #21.

### [MED] /package.json — deploy environment setup unclear ✅
- pass: 1 (commit 2a2b0b6)
- viewport: repository
- category: comprehension
- observation: Deploy commands exist but appear to require manual environment setup not documented for new maintainers
- evidence: package.json lines 21-22: deploy commands reference scripts/with-env.mjs and eas build but env setup is unclear
- suggested fix: Add quick start section for deploy environment setup
- source: reader
- issue: #20
- **Resolved 2026-05-15.** Added a "Deploy environment" section to README.md covering `.env.example` setup, the EXPO_TOKEN / EAS_PROJECT_ID / DEPLOY_PROVIDER table, build commands, and the `deploy:check` stub contract. Closes #20.

### [HIGH] /README.md — broken TODO.md reference ✅
- pass: 1 (commit 2a2b0b6)
- viewport: repository
- category: comprehension
- observation: README references missing TODO.md file that would contain native testing plan
- evidence: README.md line 192: 'See [`TODO.md`](./TODO.md) for the eventual native plan.'
- suggested fix: Either create TODO.md or remove the broken reference
- source: reader
- **Resolved 2026-05-15.** Removed broken reference to non-existent TODO.md file from README. Simplified text to state that native testing is not wired in current pass. See commit 7b5b44d.
