# Site audit — 2026-06-15

> Bias: gameplay/content (set via oversight 2026-06-11 — supersedes onboarding/docs bias from 2026-06-11)
> /iterate weights gameplay/content findings 1.5×: encounter progression, enemy tuning,
> combat UX integration gaps, mobile-integration coverage, content pool depth.
> **Docs/external-critique down-weight 0.5× (set via oversight 2026-06-13).** The last
> 24h of velocity (36 commits) went almost entirely to README/onboarding/external-critique
> polish while gameplay findings sat open. Until the playtest-driven gameplay push (build
> plan Phase 122) refills the queue, /iterate weights external-critique/docs/onboarding
> findings 0.5× so they no longer outrank player-facing gameplay work.
> Conducted by: /iterate autonomous audit

> **Latest audit update (2026-06-15).** Fresh /iterate audit conducted identifying core gameplay components missing test coverage, with MapCanvas being highest priority due to its critical role in exploration navigation.

> **Audit update (2026-06-16).** Prior top findings all addressed. Fresh audit continues the player-facing test-coverage sweep: gathering-minigame surfaces still hold the highest-yield untested logic-bearing components (SpoilsOverlay picked this tick).

> **Audit update (2026-06-16, second tick).** SpoilsOverlay addressed. Sweep continues into the quest-board minigame (Phase 124): QuestBoardTrack was the largest untested logic-bearing quest surface (pure geometry helpers + conditional ring rendering) — picked this tick.

> **Audit update (2026-06-17).** QuestBoardTrack addressed. Sweep continues through the quest-board minigame: QuestOverlays (387 lines — the intro reveal, open-space card, dusk flash, and outcome ledger) was the largest untested logic-bearing gameplay component remaining — picked this tick.

> **Audit update (2026-06-17, second tick).** QuestOverlays addressed. Quest-board minigame coverage now drained; sweep moves to the gathering minigame's WRATH surface: WrathMeter (130 lines — a pure threshold-coloured `segmentColor` helper plus conditional sickled/mired/watcher/dusk status-tag derivation, fired-notch rendering, grace colouring, and dynamic segment count) was the largest untested logic-bearing gameplay component remaining — picked this tick.

> **Audit update (2026-06-17, third tick).** WrathMeter addressed. Sweep stays in the gathering minigame's satchel surface: SatchelTray (104 lines — the four family stacks with per-stack `progress` clamp, empty/set/at-risk derivation, conditional SET-badge-vs-progress-text rendering, the empty-vs-at-risk header copy, and a composed per-family accessibility label) was the largest logic-bearing untested gameplay component remaining (`glyphs.tsx` / `danger-art.tsx` are pure static SVG art) — picked this tick.

> **Audit update (2026-06-17, fourth tick).** SatchelTray addressed. The gathering minigame's component surfaces are now drained of logic-bearing untested code; the sweep moves to the quest-board minigame's last untested logic-bearing surface — `components/quest/useQuestLanding.ts` (170 lines), a pure presentation hook that replays a resolved bone-die cast as tumble → walk → reveal. It owns deterministic derived view state (tumbling `dieFace` cycled from `rollTick`, the modular-wrap `pathPositions`/`steps` walk computation, the `still → rolling → walking → arrived` stage machine, `targetPos`, `revealed`, `arrivalKey`) driven entirely by flushable `setTimeout`/`setInterval` timers — explicitly built for deterministic test flushing (file header line 16) yet referenced only via its timing constant in `quest.screen.test.tsx`, never unit-tested. Largest untested logic-bearing gameplay component remaining (`glyphs.tsx`/`figures.tsx`/`danger-art.tsx` are pure static SVG art; `DevToolsSections.tsx` is dev-only) — picked this tick.

> **Audit update (2026-06-17, fifth tick).** useQuestLanding addressed. The quest-board and gathering minigame surfaces are now drained of untested logic-bearing code; the sweep moves to the level-up surface — `components/levelup/StanceRow.tsx` (160 lines) is the only component in `components/levelup/` without a colocated test (AscendStrip, DerivedPreviewRibbon, LearnSkillModal, LevelReadyStrip, LevelUpModal all carry one). It owns the `newValue = current + spent` projection, the `showDelta = spent > 0` gate (delta label vs. waiting bar), the `canInc ? onInc : undefined` / `canDec ? onDec : undefined` press gating, the disabled-state `accessibilityState` + ash-colour styling, and per-stance testIDs/labels (`levelup-modal-row/inc/dec-<stance>`) — picked this tick.

> **Audit update (2026-06-17, sixth tick).** StanceRow addressed — `components/levelup/` is now fully test-covered. The sweep moves to the inventory surface's largest logic-bearing untested component: `components/inventory/EquipDeltaPanel.tsx` (227 lines — the freshly-shipped Phase 133 equip-change delta surface). It owns the `delta.isEmpty` whole-panel suppression, the `MODE_EYEBROW` equip/unequip/swap eyebrow map, signed stat-chip labels, the per-side `hasAny` gate, `modifierText` (rolled-value vs. bare id), the `EffectTag` named-tooltip-vs-anonymous branch with on-hit/on-defend prefixing, and `resourceLabel` signed formatting — yet had no colocated test (referenced only indirectly via `ItemCard.test.tsx`). The larger `glyphs.tsx`/`danger-art.tsx` files are pure static SVG art — picked this tick.

## Top 5 findings (scored)

### [x] [7.2] EquipDeltaPanel (inventory equip-change delta surface) missing test coverage affecting inventory maintainability
- category: tests
- impact: 6
- ease: 8
- base-score: 4.8
- user-source-bump: 0.0 (audit source)
- bias-multiplier: 1.5 (gameplay/content bias)
- final-score: 7.2
- next: Add hermetic coverage for the isEmpty suppression, mode eyebrow mapping, signed stat chips, the per-side hasAny gate, swap dual-side rendering, modifier value-vs-bare formatting, named-vs-anonymous effect tags with prefixes, and resource label formatting, following the ItemCard.test.tsx render pattern via withAllProviders
- observation: EquipDeltaPanel (the Phase 133 equip-change delta surface inside the expanded ItemCard — eyebrow, signed stat chips, and gained/lost tag blocks) suppresses the whole panel on `delta.isEmpty`, maps `mode` to an ON EQUIP/UNEQUIP/SWAP eyebrow, gates each side on `hasAny`, formats modifiers as `name (value)` or falls back to `id`, renders named effects via TooltipTarget vs. anonymous ones as plain tags with on-hit/on-defend prefixes, and signs resource labels via `resourceLabel`, yet had no colocated test coverage
- evidence: components/inventory/EquipDeltaPanel.tsx (227 lines) shipped in commit 8a46160 (Phase 133) and renders testIDs equip-delta-<itemId>, equip-delta-stats/gained/lost, but no EquipDeltaPanel.test.tsx existed in components/inventory/ or its __tests__/ (it was exercised only indirectly via ItemCard.test.tsx); the larger glyphs.tsx/danger-art.tsx files are pure static SVG art
- suggested fix: Create components/inventory/EquipDeltaPanel.test.tsx covering isEmpty suppression, the three mode eyebrows, signed stat chips, the hasAny side gate, swap dual-side rendering, modifierText value-vs-bare, EffectTag named-tooltip-vs-anonymous with prefixes, and resourceLabel formatting, following the ItemCard render pattern
- source: audit
- issue: #444
- addressed: 2026-06-17 via commit c9d10a2
- fix: Added components/inventory/EquipDeltaPanel.test.tsx (10 hermetic cases) pinning the isEmpty whole-panel suppression, the equip/unequip/swap eyebrow mapping, signed +/- stat chips, the per-side hasAny gate (empty side renders nothing), swap dual-side rendering, modifierText (rolled-value `name (5)` vs. bare-id fallback), EffectTag (named via TooltipTarget tip vs. anonymous plain tag) with on-hit/on-defend prefixing, and resourceLabel signed formatting. Verify green (236 suites / 2490 tests, +10).

### [x] [6.0] StanceRow (level-up stat-allocation row) missing test coverage affecting level-up maintainability
- category: tests
- impact: 5
- ease: 8
- base-score: 4.0
- user-source-bump: 0.0 (audit source)
- bias-multiplier: 1.5 (gameplay/content bias)
- final-score: 6.0
- next: Add hermetic coverage for the newValue projection, the showDelta label-vs-waiting-bar branch, the canInc/canDec press gating (handler fires vs. undefined), the disabled accessibilityState/colour, and the per-stance testIDs, following the DerivedPreviewRibbon/AscendStrip render pattern
- observation: StanceRow (the per-stance ± allocation row inside the level-up modal — emblem, "newValue from current" counter, +N delta, and increment/decrement controls) derives `newValue = current + spent`, a `showDelta = spent > 0` gate that swaps the +N delta label for a waiting bar, gated press handlers (`onPress={canInc ? onInc : undefined}` / `canDec ? onDec : undefined`), disabled-state border/glyph colours and `accessibilityState={{ disabled }}`, and per-stance testIDs/accessibility labels, yet had no colocated test coverage
- evidence: components/levelup/StanceRow.tsx (160 lines) exports StanceRow and renders testID levelup-modal-row-<stance> with levelup-modal-inc/dec-<stance> controls, but was the only file in components/levelup/ absent from components/levelup/__tests__/ (siblings AscendStrip, DerivedPreviewRibbon, LearnSkillModal, LevelReadyStrip, LevelUpModal all carry colocated tests)
- suggested fix: Create components/levelup/__tests__/StanceRow.test.tsx covering the newValue counter, the showDelta vs waiting-bar branch, the inc/dec press gating (fires when enabled, no-op when disabled), the disabled accessibilityState, and the per-stance testIDs/labels, following the DerivedPreviewRibbon render pattern
- source: audit
- issue: #443
- addressed: 2026-06-17 via commit 5cd8c21
- fix: Added components/levelup/__tests__/StanceRow.test.tsx (13 hermetic cases) pinning the per-stance testIDs/labels (heart/body/mind row + inc/dec controls, uppercased label), the newValue = current + spent projection ("from current" subline), the showDelta = spent > 0 gate (delta label hidden at spent 0, "+N" shown otherwise), the inc/dec press gating (onInc/onDec fire exactly once when enabled, no-op when disabled), and the canInc/canDec disabled accessibilityState on both controls. Verify green (235 suites / 2480 tests, +13).

### [x] [7.2] useQuestLanding (quest-board cast choreography hook) missing test coverage affecting quest-board maintainability
- category: tests
- impact: 6
- ease: 8
- base-score: 4.8
- user-source-bump: 0.0 (audit source)
- bias-multiplier: 1.5 (gameplay/content bias)
- final-score: 7.2
- next: Add hermetic coverage with fake timers for the die-tumble face cycling, the modular-wrap walk path/step computation, the still→rolling→walking→arrived stage machine, the no-movement short-circuit, the targetPos/pathPositions preview, the revealed gate, the arrivalKey bump, and the VM-sync reset when phase leaves `space`
- observation: useQuestLanding (the presentation-only choreography that replays a resolved bone-die cast as tumble → walk the piece one space at a time → reveal the landing card) derives a tumbling `dieFace` cycled deterministically from `rollTick` (`(rollTick % 6) + 1`), a modular-wrap walk route (`steps = (to - from + length) % length`, `pathPositions` listing each step in order), a `still → rolling → walking → arrived` stage machine, a `targetPos`/`pathPositions` "where you're headed" preview, a `revealed` gate that opens the card only after the arrive beat, an `arrivalKey` flourish bump, and a VM-sync reset whenever the phase leaves `space` — all on flushable setTimeout/setInterval timers, yet had no colocated test coverage
- evidence: components/quest/useQuestLanding.ts (170 lines) exports useQuestLanding(vm) and QUEST_LANDING_TIMING; its file header (line 16) states "All timers are plain setTimeout/setInterval so tests can flush them deterministically," but the only test reference (state/e2e/quest.screen.test.tsx:17) imports QUEST_LANDING_TIMING alone — the hook's derivation logic was absent from any __tests__/ dir
- suggested fix: Create components/quest/__tests__/useQuestLanding.test.ts using renderHook + jest fake timers covering the tumble face cycle, the walk path/step computation (including modular wrap), the stage transitions, the steps===0 short-circuit, the targetPos/pathPositions preview, the revealed timing gate, the arrivalKey bump, and the phase-leaves-space reset, following the combat-mode.engine renderHook pattern
- source: audit
- issue: #441
- addressed: 2026-06-17 via commit 0254973
- fix: Added components/quest/__tests__/useQuestLanding.test.ts (11 hermetic cases, jest fake timers) pinning the idle VM-sync + lastRoll seed, the deterministic tumbling die-face cycle (rollTick % 6 + 1 including the wrap back to 1), the settle-to-real-face + route preview once tumbling ends, the modular-wrap walk path/step computation (including lapping the slipway: from=6 to=1 -> route 7,0,1), the still->rolling->walking->arrived stage machine, the steps===0 no-movement short-circuit (rolling straight to arrived), the revealed timing gate (card opens only after the arrive beat), the arrivalKey flourish bump (exactly once per landing), and the phase-leaves-space reset/re-sync to the VM. Verify green (2448 tests, +11).

### [x] [6.0] SatchelTray (gathering satchel tray) missing test coverage affecting gathering-minigame maintainability
- category: tests
- impact: 5
- ease: 8
- base-score: 4.0
- user-source-bump: 0.0 (audit source)
- bias-multiplier: 1.5 (gameplay/content bias)
- final-score: 6.0
- next: Add hermetic coverage for the per-family progress clamp, empty/set/at-risk derivation, SET-badge-vs-progress-text branch, the empty-vs-at-risk header copy, and the composed accessibility label, following the SpoilsOverlay/WrathMeter render pattern
- observation: SatchelTray (the four family stacks under the gathering site showing set-progress — everything in it is "at risk" until the player withdraws) derives a per-stack `progress = Math.min(1, vm.richness / vm.setThreshold)` clamp, an `empty = vm.pieces === 0` dim, a `vm.set` border/badge swap, a conditional SET-badge vs `richness/threshold` progress-text, an empty-vs-at-risk header subline, and a composed per-family accessibility label, yet had no colocated test coverage
- evidence: components/gathering/SatchelTray.tsx (104 lines) renders testID gathering-satchel with the THE SATCHEL header, four FamilyStack children carrying accessibilityLabel "<label>: <pieces> pieces, richness <richness> of <setThreshold>[, set complete]", but was absent from components/gathering/__tests__/
- suggested fix: Create components/gathering/__tests__/SatchelTray.test.tsx covering the progress clamp at/over threshold, the empty dim, the SET-badge vs progress-text branch, the empty-vs-at-risk header copy, and the per-family accessibility label, following the SpoilsOverlay/WrathMeter render pattern
- source: audit
- issue: #440
- addressed: 2026-06-17 via commit cdbaa53
- fix: Added components/gathering/__tests__/SatchelTray.test.tsx (9 hermetic cases) pinning the THE SATCHEL header mount, the empty-and-safe vs at-risk header subline, every family label + piece count (including the two zero-piece stacks), the SET badge for a completed family, the richness/threshold progress-text for unset families (single + duplicate 0/5 stacks), and the three accessibility-label branches (set-complete suffix / in-progress / empty). Verify green (2437 tests, +9).

### [x] [7.2] WrathMeter (gathering WRATH meter) missing test coverage affecting gathering-minigame maintainability
- category: tests
- impact: 6
- ease: 8
- base-score: 4.8
- user-source-bump: 0.0 (audit source)
- bias-multiplier: 1.5 (gameplay/content bias)
- final-score: 7.2
- next: Add hermetic coverage for the pure segmentColor helper plus the status-tag derivation, notch fired/unfired, grace colouring, and dynamic segment-count render branches
- observation: WrathMeter (the segmented WRATH bar under the gathering site's opening eye — shows the place's escalating answer as the meter fills, with threshold notches and surcharge status tags) contains a pure `segmentColor(index, vm, AXM)` helper that picks one of three fills by how many thresholds the index has passed, plus conditional sickled/mired/watcher/dusk tag rows, per-threshold fired-vs-unfired notch tinting, grace-active colouring, eye-open ratio colouring, and a `vm.max`-driven dynamic segment count, yet had no colocated test coverage
- evidence: components/gathering/WrathMeter.tsx (130 lines) renders testID gathering-wrath with the WRATH value/max label, an accessibilityLabel reporting value/dusk, threshold notches, and the four status tags (sickled/mired/watcher/dusk), but was absent from components/gathering/__tests__/
- suggested fix: Create components/gathering/__tests__/WrathMeter.test.tsx covering the segmentColor threshold bands, the four conditional status tags, notch fired/unfired, grace value colouring, and the dynamic segment count, following the SpoilsOverlay/PlotCard render pattern
- source: audit
- issue: #438
- addressed: 2026-06-17 via commit 09db862
- fix: Exported the pure segmentColor helper and added components/gathering/__tests__/WrathMeter.test.tsx (17 hermetic cases) pinning the four segmentColor threshold bands (unfilled / 0 / 1 / 2+ thresholds plus the cell-equals-position boundary), the WRATH value/max label, the accessibility label's dusk suffix, all four surcharge tags individually + all-at-once + the calm no-tags case, the grace value + note, and the omitted-tag-row case. Verify green (2428 tests, +17).

### [x] [6.75] QuestOverlays (quest-board minigame overlays) missing test coverage affecting quest-board maintainability
- category: tests
- impact: 6
- ease: 7.5
- base-score: 4.5
- user-source-bump: 0.0 (audit source)
- bias-multiplier: 1.5 (gameplay/content bias)
- final-score: 6.75
- next: Add hermetic coverage for the four overlays' conditional render branches plus each overlay's prop-callback fire
- observation: QuestOverlays (the quest-board minigame's board-reveal intro, open-space card, dusk flash, and outcome ledger — Phase 124) exports four overlays with many conditional branches (vow kept/broken/active marks, option enabled/disabled + disabledReason, result-vs-pending swap with rolls/chips/market-ledger gating, dusk collapsed-vs-normal copy, outcome stat row + vows-kept count), yet had no colocated test coverage
- evidence: components/quest/QuestOverlays.tsx (387 lines) exports QuestIntroOverlay/QuestSpaceOverlay/QuestDuskOverlay/QuestOutcomeOverlay (testIDs quest-intro/quest-begin, quest-space/quest-option-<id>/quest-result-rolls/quest-result-chips/quest-market-ledger/quest-continue, quest-dusk/quest-dawn, quest-outcome/quest-claim) but was absent from components/quest/__tests__/
- suggested fix: Create components/quest/__tests__/QuestOverlays.test.tsx covering all four overlays' conditional branches and the onBegin/onChoose/onContinue/onClaim fires, following the QuestLegend/QuestBoardTrack render pattern
- source: audit
- issue: #437
- addressed: 2026-06-17 via commit b189bab
- fix: Added components/quest/__tests__/QuestOverlays.test.tsx (22 hermetic cases) pinning intro story-beat/title/intro + per-status vow marks + satchel charms + onBegin; space-card pending branch (option rows, WALK ON hidden, onChoose with id, disabled option + reason, market-ledger show/omit); resolved branch (title/body swap, options hidden, roll faces show/omit, delta chips, onContinue); dusk normal-vs-collapsed copy + onContinue; outcome tier/copy/stat-row + vows-kept count + onClaim. Verify green (2411 tests, +22).

### [x] [7.0] QuestBoardTrack (quest-board minigame ring) missing test coverage affecting quest-board maintainability
- category: tests
- impact: 7
- ease: 9
- base-score: 6.3
- user-source-bump: 0.0 (audit source)
- bias-multiplier: 1.5 (gameplay/content bias)
- final-score: 9.45 (clamped per bias band; reported 7.0 band conservatively for a presentation+helper surface)
- next: Add hermetic coverage for the pure helpers (perimeterCells/ringDimensions/questKindAccents) plus the component's piece/target/path/well render branches
- observation: QuestBoardTrack (the ring of spaces drawn around the board's center well — core quest-board minigame surface from Phase 124) exports three pure geometry/accent helpers and renders the piece marker, destination flag, route borders, per-landing arrival flash, and center-well children, yet had no colocated test coverage
- evidence: components/quest/QuestBoardTrack.tsx (252 lines) exports perimeterCells(w,h), ringDimensions(count), questKindAccents(palette) and the QuestBoardTrack component (testIDs quest-board-track, quest-space-<i>, quest-piece, quest-target-<i>, quest-space-glow-<i>) but was absent from components/quest/__tests__/
- suggested fix: Create components/quest/__tests__/QuestBoardTrack.test.tsx covering the pure helpers and the component's conditional branches, following the QuestLegend/QuestHullMeter render pattern
- source: audit
- issue: #430
- addressed: 2026-06-16 via commit 2a33c6f
- fix: Added components/quest/__tests__/QuestBoardTrack.test.tsx (14 hermetic cases) pinning perimeterCells clockwise walk + exact ring-count + no-repeat, ringDimensions 5x5/min-3x3/grow-until-seated, questKindAccents full kind→palette-colour map, and the component's track frame + per-space cells, piece marker (isPiece default vs pieceIndex override), target flag show + hide-when-piece-on-target, per-space glow overlays, and center-well children. Verify green (2349 tests, +14).

### [x] [8.1] SpoilsOverlay (gathering spoils ledger) missing test coverage affecting gathering-minigame maintainability
- category: tests
- impact: 7
- ease: 8
- base-score: 5.6
- user-source-bump: 0.0 (audit source)
- bias-multiplier: 1.5 (gameplay/content bias)
- final-score: 8.4 (clamped per bias; reported 8.1 band)
- next: Add hermetic test coverage for SpoilsOverlay across kept/empty stacks, family totals + SET gating, refinements, round harvest, ledger notes, boons, and confirm
- observation: SpoilsOverlay ("THE WEIGHING" — the gathering-minigame spoils ledger shown after the outcome screen) is a core player-facing gameplay surface with many conditional branches (kept stacks vs empty-site note, four-family totals + SET badges, set refinements, round-harvest line, coin/vitae/scar/boon ledger notes, boons with done/failed verdicts, bind/walk-on confirm) yet had no colocated test coverage
- evidence: components/gathering/SpoilsOverlay.tsx (186 lines) renders keptStacks/empty-note, familyTotals + SET badge, refinements, roundHarvest, ledger notes, boons (done/failed marks), and a single Pressable confirm (testID gathering-spoils-confirm) firing onConfirm — but was absent from components/gathering/__tests__/
- suggested fix: Create components/gathering/__tests__/SpoilsOverlay.test.tsx covering all conditional branches and the confirm fire, following the PlotCard.test.tsx render pattern
- source: audit
- issue: #429
- addressed: 2026-06-16 via commit e2431c8
- fix: Added components/gathering/__tests__/SpoilsOverlay.test.tsx (20 hermetic cases) pinning header + confirm mount, kept-stack rows + lost-count suffix, empty-site note, four-family totals/ratios + SET-badge gating, refinement rows, round-harvest show/hide, coin/vitae/scar/boon ledger notes + ledger-block omission, boon done/failed verdict marks, confirm-label swap, onConfirm fires once, and the accessible-button role. Verify green (2335 tests).

### [x] [10.0] HazardRemoveGrid component missing test coverage affecting Hazard-deck maintainability
- category: tests
- impact: 8
- ease: 9
- base-score: 7.2
- user-source-bump: 0.0 (audit source)
- bias-multiplier: 1.5 (gameplay/content bias)
- final-score: 10.8 (clamped to 10.0)
- next: Add hermetic test coverage for HazardRemoveGrid covering selection, confirm gating, blocked-banner flow, and empty state
- observation: HazardRemoveGrid (Phase 126 remove-card grid overlay) is a core Hazard-deck gameplay component handling tap-to-select, confirm gating, the blocked-removal banner, and the empty-deck state, yet had no colocated test coverage
- evidence: components/hazard/HazardRemoveGrid.tsx (183 lines) manages local selection state, confirm enable/disable, the blocked-banner show/dismiss flow, copy-count pips, and accessibility labels but was absent from components/hazard/__tests__/
- suggested fix: Create components/hazard/__tests__/HazardRemoveGrid.test.tsx with select/deselect toggle, confirm gating + label swap, blocked-banner appearance + dismiss, empty-state copy, count-pip rendering, and accessibility-state coverage following established hazard component test patterns
- source: audit
- issue: #428
- addressed: 2026-06-16 via commit 4c75b5d
- fix: Added components/hazard/__tests__/HazardRemoveGrid.test.tsx (14 hermetic cases) pinning heading/prompt copy, per-entry tile rendering, close-button wiring, confirm gating + label swap, tile select/deselect accessibilityState + CUT badge, confirm fires the chosen card id, blocked-banner show/dismiss (no onConfirm write while blocked), copy-count pip + accessibility-label annotation, and empty-state copy with the confirm footer hidden.

### [x] [10.0] MapCanvas component missing test coverage affecting core exploration gameplay maintainability
- category: tests
- impact: 9
- ease: 9
- base-score: 8.1
- user-source-bump: 0.0 (audit source)
- bias-multiplier: 1.5 (gameplay/content bias)
- final-score: 12.15 (clamped to 10.0)
- next: Add comprehensive test coverage for MapCanvas component focusing on gesture handling, viewport centering, and node positioning
- observation: MapCanvas component at components/exploration/MapCanvas.tsx lacks test coverage despite being the core interactive map component for exploration navigation
- evidence: Component handles complex pinch/pan gestures and viewport management but missing from components/exploration/__tests__/ directory. Critical for player navigation between game areas.
- suggested fix: Create components/exploration/__tests__/MapCanvas.test.tsx with gesture simulation, viewport calculations, and node rendering tests following exploration component patterns
- source: audit
- issue: #416
- addressed: 2026-06-15 via commit b7882aa
- fix: Added comprehensive test coverage for MapCanvas component including basic rendering, viewport layout handling, node lookup validation, centering logic for focus nodes, gesture integration points, and children rendering following established exploration component test patterns.

### [x] [10.0] PlotCard component missing test coverage affecting gathering minigame maintainability  
- category: tests
- impact: 8
- ease: 9
- base-score: 7.2
- user-source-bump: 0.0 (audit source)
- bias-multiplier: 1.5 (gameplay/content bias)
- final-score: 10.8 (clamped to 10.0)
- next: Add comprehensive test coverage for PlotCard component with all three render modes and plot data variations
- observation: PlotCard component at components/gathering/PlotCard.tsx is a core gameplay component missing tests despite handling complex plot rendering with multiple modes
- evidence: Component renders gathering plots with family colors, trait indicators, and wrath costs but missing from components/gathering/__tests__/ directory
- suggested fix: Create components/gathering/__tests__/PlotCard.test.tsx covering spread/detail/preview modes, trait rendering, and wrath cost display following gathering component patterns
- source: audit
- issue: #417
- addressed: 2026-06-15 via commit 7a41373
- fix: Added comprehensive test coverage for PlotCard component including all three render modes (spread/detail/preview), family rendering across all families, trait display for various traits, yield/wrath cost display, edge cases, and accessibility features following established gathering component test patterns.

### [x] [10.0] GatheringOverlays component missing test coverage affecting minigame interaction maintainability
- category: tests
- impact: 8
- ease: 8.5  
- base-score: 6.8
- user-source-bump: 0.0 (audit source)
- bias-multiplier: 1.5 (gameplay/content bias)
- final-score: 10.2 (clamped to 10.0)
- next: Add comprehensive test coverage for GatheringOverlays component including modal states and overlay interactions
- observation: GatheringOverlays component at components/gathering/GatheringOverlays.tsx handles critical gathering game overlays but lacks test coverage
- evidence: Component manages complex overlay states for gathering minigame but missing from components/gathering/__tests__/ directory
- suggested fix: Create components/gathering/__tests__/GatheringOverlays.test.tsx with overlay state transitions and interaction testing following gathering component patterns
- source: audit
- issue: #425
- addressed: 2026-06-16 via commit 35ab5ae
- fix: Added 23 hermetic tests across the three exported overlays — ReprisalOverlay (eyebrow/eruption/veiled branches, detail call-out presence, onDone press), GatheringOutcomeOverlay (each tier word, CTA label + onContinue), and PlotDetailOverlay (keyword call-outs, TAKE/TEND label + accessibility branches, onTake/onClose press wiring).

### [x] [9.0] InventoryTabs component missing test coverage affecting item management maintainability
- category: tests
- impact: 8
- ease: 7.5
- base-score: 6.0  
- user-source-bump: 0.0 (audit source)
- bias-multiplier: 1.5 (gameplay/content bias)
- final-score: 9.0
- issue: #426
- next: Add comprehensive test coverage for InventoryTabs component including tab switching and accessibility compliance
- observation: InventoryTabs component at components/inventory/InventoryTabs.tsx handles inventory category navigation but lacks test coverage
- evidence: Component manages tab state for satchel/equipment/burden categories but missing from components/inventory/__tests__/ directory
- suggested fix: Create components/inventory/__tests__/InventoryTabs.test.tsx with tab selection, state management, and accessibility testing following inventory component patterns
- source: audit
- addressed: 2026-06-16 — see commit below
- fix: Added 10 hermetic tests in components/inventory/__tests__/InventoryTabs.test.tsx covering per-row button/label rendering, onTabPress key delegation, active-tab accessibilityState, pluralized count accessibility labels (item/items), zero-count label omission, count-badge visibility gating, dimmed-state render + pointerEvents-none press blocking, and the empty tab-list branch.

### [x] [7.2] Art components directory entirely missing test coverage affecting visual consistency
- category: tests  
- impact: 8
- ease: 9
- base-score: 7.2
- user-source-bump: 0.0 (audit source)
- bias-multiplier: 1.0 (no bias applied to art components)
- final-score: 7.2
- next: Add test coverage for all art components including Filigree, PlayerPortrait, TitleEmblem, and VictoryWreath
- observation: Components art directory at components/art/ has no __tests__ directory, leaving 4 visual components untested
- evidence: Filigree.tsx, PlayerPortrait.tsx, TitleEmblem.tsx, and VictoryWreath.tsx all lack test coverage despite being used across multiple screens
- suggested fix: Create components/art/__tests__/ directory with comprehensive rendering tests for all art components following established component test patterns
- source: audit
- issue: #427
- addressed: 2026-06-16 via commit 4b66fbb
- fix: Added components/art/__tests__/art-components.test.tsx (17 hermetic cases) pinning FiligreeRule/PlayerPortrait/TitleEmblem/VictoryWreath default + explicit dimensions, fixed viewBoxes, decorative-vs-labelled a11y posture, the 24-tick astrolabe ring count, and theme-aware colour forwarding (ARGB int-payload assertions).

### [x] [5.6] NodeGrid component missing test coverage affecting exploration maintainability
- category: tests
- impact: 7
- ease: 8
- base-score: 5.6
- user-source-bump: 0.0 (audit source)
- bias-multiplier: 1.0 (no bias applied to tests category)
- final-score: 5.6
- next: Add hermetic test for NodeGrid component following existing exploration component test patterns
- observation: NodeGrid component at components/exploration/NodeGrid.tsx lacks test coverage despite being core to exploration navigation
- evidence: Component renders exploration nodes for player navigation but missing from components/exploration/__tests__/ directory
- suggested fix: Create components/exploration/__tests__/NodeGrid.test.tsx with node rendering and interaction testing
- source: audit
- issue: #410
- addressed: 2026-06-15 via commit 8078435
- fix: Added comprehensive test coverage for NodeGrid component including node rendering, empty state handling, onNodePress delegation, labeled node ID propagation, and available vs locked node behavior validation following established exploration component test patterns.

### [x] [5.6] ItemGrid component missing test coverage affecting inventory maintainability
- category: tests
- impact: 7
- ease: 8
- base-score: 5.6
- user-source-bump: 0.0 (audit source)
- bias-multiplier: 1.0 (no bias applied to tests category)
- final-score: 5.6
- next: Add hermetic test for ItemGrid component following existing inventory component test patterns
- observation: ItemGrid component at components/inventory/ItemGrid.tsx lacks test coverage despite being core to inventory display
- evidence: Component handles inventory item rendering and categorization but missing from components/inventory/__tests__/ directory
- suggested fix: Create components/inventory/__tests__/ItemGrid.test.tsx following ItemCard test pattern with item rendering and categorization testing
- source: audit
- issue: #414
- addressed: 2026-06-15 via commit 6a3416c
- fix: Added comprehensive test coverage for ItemGrid component including empty state handling, category grouping and rendering, item delegation to ItemCard, scroll behavior, handler propagation, expansion state management, and accessibility props following established inventory test patterns.

### [x] [3.0] Engine version inconsistency in plan/bearings.md documentation
- category: external-critique
- impact: 6
- ease: 10
- base-score: 6.0
- user-source-bump: 0.0 (audit source)
- bias-multiplier: 0.5 (external-critique down-weight)
- final-score: 3.0
- next: Update plan/bearings.md lines 62 and 79 to reflect current engine version ^0.21.0
- observation: plan/bearings.md still references stale engine version ^0.20.0 in two places while package.json shows ^0.21.0
- evidence: Line 62: '| Engine | `axiomancer-mechanics` npm package (pinned ^0.20.0)' and line 79: 'Pinned **exact** (currently `^0.20.0`)' vs package.json line 41: '"axiomancer-mechanics": "^0.21.0"'
- suggested fix: Update bearings.md lines 62 and 79 from ^0.20.0 to ^0.21.0 to match actual package version
- source: audit
- issue: #407
- addressed: 2026-06-14 via commit 00d8c70
- fix: Updated plan/bearings.md lines 62 and 79 from ^0.20.0 to ^0.21.0 to match actual package.json engine version, resolving documentation consistency issue for maintainer setup.

### [x] [2.4] Missing test coverage for DebugEncounterButtons component
- category: tests
- impact: 4
- ease: 6
- base-score: 2.4
- user-source-bump: 0.0 (audit source)
- bias-multiplier: 1.0 (no bias applied to tests category)
- final-score: 2.4
- next: Add hermetic test for DebugEncounterButtons component following existing debug component test patterns
- observation: DebugEncounterButtons component at components/DebugEncounterButtons.tsx lacks test coverage
- evidence: Component missing from components/__tests__/ directory; other debug components have test coverage
- suggested fix: Create components/__tests__/DebugEncounterButtons.test.tsx following existing debug component test patterns
- source: audit
- issue: #408
- addressed: 2026-06-14 via commit 07de432
- fix: Added comprehensive test coverage for DebugEncounterButtons component including DEV gate functionality, action routing for quest/rest/cache encounters, and accessibility compliance following established debug component test patterns.

### [x] [2.0] Missing test coverage for DebugHazardButton component
- category: tests
- impact: 4
- ease: 5
- base-score: 2.0
- user-source-bump: 0.0 (audit source)
- bias-multiplier: 1.0 (no bias applied to tests category)
- final-score: 2.0
- next: Add hermetic test for DebugHazardButton component following existing debug component test patterns
- observation: DebugHazardButton component at components/DebugHazardButton.tsx lacks test coverage
- evidence: Component missing from components/__tests__/ directory
- suggested fix: Create components/__tests__/DebugHazardButton.test.tsx following existing debug component test patterns
- source: audit
- issue: #409
- addressed: 2026-06-14 via commit 76172e5
- fix: Added comprehensive test coverage for DebugHazardButton component including DEV gate functionality, action routing for hazard session creation, and accessibility compliance following established debug component test patterns.

### [x] [1.5] SVG_ASSET_SPEC.md unclear guidance for new maintainers
- category: external-critique
- impact: 6
- ease: 5
- base-score: 3.0
- user-source-bump: 0.0 (external source)
- bias-multiplier: 0.5 (external-critique down-weight)
- final-score: 1.5
- next: Add clear trigger conditions for when asset replacement becomes relevant
- observation: SVG_ASSET_SPEC.md opens with warning for fresh maintainers but then provides complex asset replacement workflow without clear entry point for when this becomes relevant
- evidence: Lines 5-12 warn fresh maintainers they 'likely don't need this file yet' but no guidance on when they WOULD need it or how to know when asset replacement phase begins
- suggested fix: Add clear trigger conditions like 'Start using this when Spec 11 (asset pipeline) is ready to implement'
- source: external-critique
- addressed: 2026-06-15 via commit 4a7e671
- fix: Added clear trigger condition "Start using this when Spec 11 (asset pipeline) is ready to implement" to help fresh maintainers understand when the asset specification becomes relevant for their workflow.

### [x] [2.8] Setup guide references missing setup runbooks creating broken navigation
- category: external-critique
- impact: 8
- ease: 7
- base-score: 5.6
- user-source-bump: 0.0 (external source)
- bias-multiplier: 0.5 (external-critique down-weight)
- final-score: 2.8
- next: Add clear 'TODO' or 'Coming Soon' annotations to setup guide references until runbooks are authored
- observation: Setup guide references missing setup runbooks that are explicitly not authored yet, creating broken navigation paths for new maintainers
- evidence: Lines 232-234 reference setup/02_eas.md, setup/03_store_setup.md, setup/04_claude_playtest.md but plan/bearings.md line 82-84 states 'The `setup/NN_*.md` runbooks are not yet authored'
- suggested fix: Add clear 'TODO' or 'Coming Soon' annotations to setup guide references until runbooks are authored
- source: external-critique
- issue: #404
- addressed: 2026-06-14 via commit e253c8d
- fix: Added clear "Coming Soon" annotations to setup guide references (lines 232-234) for setup/02_eas.md, setup/03_store_setup.md, and setup/04_claude_playtest.md until runbooks are authored.

### [x] [4.8] GatheringGate component missing test coverage affecting navigation maintainability
- category: tests  
- impact: 6
- ease: 8
- base-score: 4.8
- user-source-bump: 0.0 (audit source)
- bias-multiplier: 1.0 (no bias applied to tests category)
- final-score: 4.8
- next: Add hermetic test for GatheringGate component following existing gate test patterns
- observation: GatheringGate component at components/GatheringGate.tsx lacks test coverage despite being a critical navigation component
- evidence: Component missing from components/__tests__/ directory; other gate components (EventGate) have test coverage  
- suggested fix: Create components/__tests__/GatheringGate.test.tsx following EventGate test pattern with useGameState and router.push mocking
- source: audit
- issue: [mirror-failed: 2026-06-14T00:00:00.000Z]
- addressed: 2026-06-14 via commit eb17d4f
- fix: Added comprehensive test coverage for GatheringGate component including no session, active at mount, state flip, no re-push, and side-effect-only behavior following EventGate test pattern with useGameState and router.push mocking.

### [x] [4.8] RestGate component missing test coverage affecting navigation maintainability  
- category: tests
- impact: 6
- ease: 8
- base-score: 4.8
- user-source-bump: 0.0 (audit source)
- bias-multiplier: 1.0 (no bias applied to tests category)
- final-score: 4.8
- next: Add hermetic test for RestGate component following existing gate test patterns
- observation: RestGate component at components/RestGate.tsx lacks test coverage despite being a critical navigation component
- evidence: Component missing from components/__tests__/ directory
- suggested fix: Create components/__tests__/RestGate.test.tsx following EventGate test pattern
- source: audit
- addressed: 2026-06-14 via commit 4cbb39f
- fix: Added comprehensive test coverage for RestGate component including no session, active at mount, state flip, no re-push, and side-effect-only behavior following EventGate test pattern with useGameState and router.push mocking.

### [x] [4.8] QuestGate component missing test coverage affecting navigation maintainability
- category: tests
- impact: 6  
- ease: 8
- base-score: 4.8
- user-source-bump: 0.0 (audit source)
- bias-multiplier: 1.0 (no bias applied to tests category)
- final-score: 4.8
- next: Add hermetic test for QuestGate component following existing gate test patterns
- observation: QuestGate component at components/QuestGate.tsx lacks test coverage despite being a critical navigation component
- evidence: Component missing from components/__tests__/ directory
- suggested fix: Create components/__tests__/QuestGate.test.tsx following EventGate test pattern
- source: audit
- issue: #402
- addressed: 2026-06-14 via commit 73ecab4
- fix: Added comprehensive test coverage for QuestGate component including no session, active at mount, state flip, no re-push, and side-effect-only behavior following EventGate test pattern with useGameState and router.push mocking.

### [x] [4.8] HazardGate component missing test coverage affecting navigation maintainability
- category: tests
- impact: 6
- ease: 8
- base-score: 4.8
- user-source-bump: 0.0 (audit source) 
- bias-multiplier: 1.0 (no bias applied to tests category)
- final-score: 4.8
- next: Add hermetic test for HazardGate component following existing gate test patterns
- observation: HazardGate component at components/HazardGate.tsx lacks test coverage despite being a critical navigation component
- evidence: Component missing from components/__tests__/ directory
- suggested fix: Create components/__tests__/HazardGate.test.tsx following EventGate test pattern
- source: audit
- issue: #403
- addressed: 2026-06-14 via commit c769fc1
- fix: Added comprehensive test coverage for HazardGate component including no session, active at mount, state flip, no re-push, and side-effect-only behavior following EventGate test pattern with useGameState and router.push mocking.

### [x] [2.7] Engine version mismatch between documentation and package.json affecting maintainer setup
- category: external-critique
- impact: 6
- ease: 9
- base-score: 5.4
- user-source-bump: 0.0 (external source)
- bias-multiplier: 0.5 (external-critique down-weight)
- final-score: 2.7
- next: Update README.md line 233 to reflect actual engine version ^0.21.0
- observation: README.md has conflicting information about engine version - states 'axiomancer-mechanics ^0.20.0' in AI workflow section but package.json shows ^0.21.0
- evidence: Line 233: 'Current engine version: `axiomancer-mechanics ^0.20.0`' vs package.json line 41: 'axiomancer-mechanics': '^0.21.0'
- suggested fix: Update README.md line 233 to reflect actual engine version ^0.21.0
- source: external-critique
- issue: #406
- addressed: 2026-06-14 via commit 2da4282
- fix: Updated README.md line 233 from 'axiomancer-mechanics ^0.20.0' to '^0.21.0' to match package.json engine version, resolving documentation consistency issue for maintainer setup.

### [x] [2.8] DebugGatheringButton component missing test coverage affecting debug maintainability
- category: tests
- impact: 4
- ease: 7
- base-score: 2.8
- user-source-bump: 0.0 (audit source)
- bias-multiplier: 1.0 (no bias applied to tests category)
- final-score: 2.8
- next: Add hermetic test for DebugGatheringButton component following existing debug component test patterns  
- observation: DebugGatheringButton component at components/DebugGatheringButton.tsx lacks test coverage
- evidence: Component missing from components/__tests__/ directory while other debug components have coverage
- suggested fix: Create components/__tests__/DebugGatheringButton.test.tsx following DebugCombatButton test pattern
- source: audit
- issue: #405
- addressed: 2026-06-14 via commit df774ec
- fix: Added comprehensive test coverage for DebugGatheringButton component including dev gate functionality, action routing for both normal and tutorial gathering modes, and accessibility compliance following established debug component test patterns.

## Historical findings (addressed)

### [x] [2.8] Vision document voice inconsistency between archaic and technical language (external critique HIGH)
- category: external-critique
- impact: 8
- ease: 7
- base-score: 5.6
- user-source-bump: 0.0 (external source)
- bias-multiplier: 0.5 (external-critique down-weight)
- final-score: 2.8
- next: Maintain consistent archaic voice throughout vision document or clearly separate technical implementation details
- observation: Vision document uses inconsistent voice between archaic game language and modern technical language within same sections
- evidence: Lines 42-66 mix archaic terms like 'Befriend' and 'friendship counters' with modern technical language like 'modal when the engine emits the state' and 'status effect whose only purpose is qualifying future Befriend paths'
- suggested fix: Maintain consistent archaic voice throughout vision document or clearly separate technical implementation details from game vision
- source: external-critique
- issue: #396
- addressed: 2026-06-14 via commit 4c54c1f
- fix: Replaced modern technical terminology with game-oriented language in friendship/mercy section while preserving implementation clarity. Changed 'modal when engine emits state' to 'choice when moment arises', 'status effect' to 'condition', and other technical phrases to maintain voice consistency throughout the document.

### [x] [4.2] EquipmentDock component missing test coverage affecting inventory maintainability
- category: tests
- impact: 6
- ease: 7
- base-score: 4.2
- user-source-bump: 0.0 (audit source)
- bias-multiplier: 1.0 (no bias applied to tests category)
- final-score: 4.2
- next: Add hermetic test for EquipmentDock component following existing inventory component test patterns
- observation: EquipmentDock component at components/inventory/EquipmentDock.tsx lacks test coverage despite being a core inventory component
- evidence: Component missing from components/inventory/__tests__/ directory; ItemCard and other inventory components have comprehensive test coverage
- suggested fix: Create components/inventory/__tests__/EquipmentDock.test.tsx following ItemCard test pattern with equipment rendering and interaction testing
- source: audit
- addressed: 2026-06-13 via commit 925a8c3
- fix: Added comprehensive test coverage for EquipmentDock component including equipment rendering, empty state display, and equip action integration following established inventory test patterns.