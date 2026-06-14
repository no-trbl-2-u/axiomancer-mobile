# Site audit — 2026-06-14

> Bias: gameplay/content (set via oversight 2026-06-11 — supersedes onboarding/docs bias from 2026-06-11)
> /iterate weights gameplay/content findings 1.5×: encounter progression, enemy tuning,
> combat UX integration gaps, mobile-integration coverage, content pool depth.
> **Docs/external-critique down-weight 0.5× (set via oversight 2026-06-13).** The last
> 24h of velocity (36 commits) went almost entirely to README/onboarding/external-critique
> polish while gameplay findings sat open. Until the playtest-driven gameplay push (build
> plan Phase 122) refills the queue, /iterate weights external-critique/docs/onboarding
> findings 0.5× so they no longer outrank player-facing gameplay work.
> Conducted by: /iterate autonomous audit

> **Latest audit update (2026-06-14).** Comprehensive /march iterate audit conducted identifying test coverage gaps for navigation gate components and debug utilities.

## Top 5 findings (scored)

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

### [ ] [2.8] DebugGatheringButton component missing test coverage affecting debug maintainability
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