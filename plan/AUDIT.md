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

## Top 5 findings (scored)

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

### [ ] [9.0] InventoryTabs component missing test coverage affecting item management maintainability
- category: tests
- impact: 8
- ease: 7.5
- base-score: 6.0  
- user-source-bump: 0.0 (audit source)
- bias-multiplier: 1.5 (gameplay/content bias)
- final-score: 9.0
- next: Add comprehensive test coverage for InventoryTabs component including tab switching and accessibility compliance
- observation: InventoryTabs component at components/inventory/InventoryTabs.tsx handles inventory category navigation but lacks test coverage
- evidence: Component manages tab state for satchel/equipment/burden categories but missing from components/inventory/__tests__/ directory
- suggested fix: Create components/inventory/__tests__/InventoryTabs.test.tsx with tab selection, state management, and accessibility testing following inventory component patterns
- source: audit

### [ ] [7.2] Art components directory entirely missing test coverage affecting visual consistency
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