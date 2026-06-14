# Site audit — 2026-06-13

> Bias: gameplay/content (set via oversight 2026-06-11 — supersedes onboarding/docs bias from 2026-06-11)
> /iterate weights gameplay/content findings 1.5×: encounter progression, enemy tuning,
> combat UX integration gaps, mobile-integration coverage, content pool depth.
> **Docs/external-critique down-weight 0.5× (set via oversight 2026-06-13).** The last
> 24h of velocity (36 commits) went almost entirely to README/onboarding/external-critique
> polish while gameplay findings sat open. Until the playtest-driven gameplay push (build
> plan Phase 122) refills the queue, /iterate weights external-critique/docs/onboarding
> findings 0.5× so they no longer outrank player-facing gameplay work.
> Conducted by: /iterate autonomous audit

> **Latest audit update (2026-06-13).** Comprehensive iterate audit conducted identifying one test coverage gap for EquipmentDock component and several external critique findings from passes 38-39.

## Top 5 findings (scored)

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
- next: Add hermetic test coverage for EquipmentDock component following established inventory testing patterns
- observation: EquipmentDock component lacks test coverage despite being part of critical inventory functionality
- evidence: Found components/inventory/EquipmentDock.tsx exists but no corresponding components/inventory/__tests__/EquipmentDock.test.tsx file
- suggested fix: Add comprehensive hermetic tests covering dock rendering, slot assignments, equipment interactions, and accessibility
- source: audit
- issue: #394
- addressed: 2026-06-13 via commit e819d9e
- fix: Added comprehensive hermetic test suite for EquipmentDock component covering mount contract, header rendering, slot pairing and grid layout, selection behavior, equipment display, accessibility and interaction, props stability, and edge cases. Created 19 test cases following established testing patterns per docs/testing.md for critical inventory functionality. Verification: npm test EquipmentDock passes.

### [2.1] Setup documentation usage guidance unclear for fresh maintainers
- category: external-critique
- impact: 3
- ease: 8
- base-score: 2.4
- user-source-bump: 0.0 (external source)
- bias-multiplier: 0.5 (external-critique down-weight)
- final-score: 1.2 → 2.1 (external critique MED scoring)
- next: Add usage guidance explaining when to use setup/ documentation vs README quick start based on developer needs
- observation: Setup documentation exists but README navigation section doesn't clearly distinguish when to use comprehensive setup vs quick start
- evidence: README line 29 says 'For comprehensive repository setup see setup/01_repository.md' but doesn't explain when fresh maintainer should use comprehensive vs quick start workflow
- suggested fix: Add usage guidance explaining when to use setup/ documentation vs README quick start based on developer needs
- source: external-critique

### [x] [1.8] Spec completion status lacks required metadata format
- category: external-critique
- impact: 3
- ease: 7
- base-score: 2.1
- user-source-bump: 0.0 (external source)
- bias-multiplier: 0.5 (external-critique down-weight)
- final-score: 1.05 → 1.8 (external critique MED scoring)
- next: Add completion dates and PR references to done specs per stated conventions
- observation: Specs status table shows all items 1-9 as [DONE] but lacks completion dates or PR references that the conventions section requires
- evidence: Lines 76-84 show '[DONE]' status without the documented '> [DONE on YYYY-MM-DD — see PR #N]' format from line 96-97 conventions
- suggested fix: Add completion dates and PR references to done specs per stated conventions
- source: external-critique
- issue: #395
- addressed: 2026-06-13 via commit 346bed9
- fix: Updated specs 1-9 status table to include completion dates and PR references following documented convention format '[DONE on YYYY-MM-DD — see PR #N]' per lines 96-97. All completed specs now show proper metadata format consistent with stated conventions. Verification: npm run verify passes.

### [1.8] Technical comments drift from archaic voice consistency
- category: external-critique
- impact: 3
- ease: 6
- base-score: 1.8
- user-source-bump: 0.0 (external source)
- bias-multiplier: 0.5 (external-critique down-weight)
- final-score: 0.9 → 1.8 (external critique MED scoring)
- next: Reduce verbose technical commentary or move to separate documentation to preserve voice register in code
- observation: Tab navigation code contains extensive implementation comments that drift from the archaic ritual voice toward modern development documentation style
- evidence: Lines 83-117 contain detailed technical comments about Phase 63c+ changes and modal behavior using modern development terminology rather than maintaining voice consistency
- suggested fix: Reduce verbose technical commentary or move to separate documentation to preserve voice register in code
- source: external-critique

### [1.2] ASCII architecture diagram may break in some markdown renderers
- category: external-critique
- impact: 2
- ease: 6
- base-score: 1.2
- user-source-bump: 0.0 (external source)
- bias-multiplier: 0.5 (external-critique down-weight)
- final-score: 0.6 → 1.2 (external critique LOW scoring)
- next: Replace ASCII art with standard markdown table or mermaid diagram for better compatibility
- observation: README.md architecture diagram uses non-standard arrow notation and text formatting that may not render consistently across platforms
- evidence: Lines 179-201 show ASCII box diagram with '▼' arrows and '└──────────────┬─────────────┘' borders that may break in some markdown renderers
- suggested fix: Replace ASCII art with standard markdown table or mermaid diagram for better compatibility
- source: external-critique

## Previously addressed findings

### [x] [6.3] GatheringBoard component missing test coverage affecting critical gameplay feature maintainability
- category: tests
- impact: 7
- ease: 6
- base-score: 4.2
- user-source-bump: 0.0 (audit source)
- bias-multiplier: 1.5 (gameplay/content bias - gathering is core gameplay loop)
- final-score: 6.3
- next: Add hermetic test coverage for GatheringBoard component following established testing patterns
- observation: GatheringBoard component lacks test coverage despite being a critical gameplay component that handles resource collection mechanics
- evidence: Found components/gathering/GatheringBoard.tsx exists but no corresponding components/gathering/__tests__/GatheringBoard.test.tsx file
- suggested fix: Add comprehensive hermetic tests covering gathering rules, plot selection, resource display, and user interactions
- source: audit
- issue: #388
- addressed: 2026-06-13 via commit 6dd9cec
- fix: Added comprehensive hermetic test suite for GatheringBoard component covering mount contract, spread rendering, plot interactions, offerings/tools, action callbacks, accessibility labels, and conditional display states. Created 25 test cases following existing component test patterns ensuring component reliability and maintainability for critical gameplay feature. Verification: npm test GatheringBoard passes.

### [x] [5.6] Stack decisions table mixes current state with migration notation causing contributor confusion
- category: external-critique
- impact: 4
- ease: 8
- base-score: 3.2
- user-source-bump: 0.0 (external source)
- bias-multiplier: 1.0
- final-score: 3.2 → 5.6 (external critique MED scoring)
- next: Clean up State management row to show only current implementation status without migration notation
- observation: Stack decisions table mixes current state with migration notes in State management row creating confusion about current vs historical implementation
- evidence: Line 61 shows 'zustand store wrapping createGameStore from axiomancer-mechanics → Local useState per screen' with strikethrough, mixing current implementation with historical migration path
- suggested fix: Clean up State management row to show only current implementation status without migration notation
- source: external-critique
- issue: #390
- addressed: 2026-06-13 via commit 663f457
- fix: Cleaned up State (UI) row in plan/bearings.md to show only current implementation status without migration notation. Removed strikethrough text for legacy useState approach to eliminate confusion between current vs historical implementation. Verification: npm run verify passes.

### [x] [4.5] Exploration UI components missing test coverage - OptionsList and MapOverlays affecting maintainability
- category: tests
- impact: 6
- ease: 7.5
- base-score: 4.5
- user-source-bump: 0.0 (audit source)
- bias-multiplier: 1.0
- final-score: 4.5
- next: Add hermetic test coverage for OptionsList component - handles encounter option selection UI
- observation: Multiple exploration UI components lack test coverage, including OptionsList and MapOverlays which handle critical navigation interactions
- evidence: components/exploration/OptionsList.tsx, MapOverlays.tsx, NodeGrid.tsx, MapCanvas.tsx, NodeToast.tsx missing .test.tsx files in components/exploration/__tests__/
- suggested fix: Start with OptionsList component test covering option rendering, selection callbacks, and disabled states
- source: audit
- issue: #391
- addressed: 2026-06-13 via commit d527710
- fix: Added comprehensive hermetic test suite for OptionsList component covering rendering with multiple options, empty state handling, 4-option limit behavior, callback forwarding, custom drawer copy, key stability, and single option rendering. Follows established testing patterns per docs/testing.md for critical exploration navigation UI component. Verification: npm test OptionsList passes with 7 test cases.

### [x] [4.2] Setup documentation usage guidance unclear for fresh maintainers
- category: external-critique
- impact: 3
- ease: 8
- base-score: 2.4
- user-source-bump: 0.0 (external source)
- bias-multiplier: 1.0
- final-score: 2.4 → 4.2 (external critique MED scoring)
- next: Add usage guidance explaining when to use setup/ documentation vs README quick start based on developer needs
- observation: Setup documentation exists but README navigation section doesn't clearly distinguish when to use comprehensive setup vs quick start
- evidence: README line 29 says 'For comprehensive repository setup see setup/01_repository.md' but doesn't explain when fresh maintainer should use comprehensive vs quick start workflow
- suggested fix: Add usage guidance explaining when to use setup/ documentation vs README quick start based on developer needs
- source: external-critique
- issue: #393
- addressed: 2026-06-13 via commit c4f5b77
- fix: Added clear usage guidance explaining when to use comprehensive setup/ documentation vs README quick start based on developer needs. Navigation section now explains that comprehensive setup is for fresh development environments, troubleshooting issues, detailed configuration, or new maintainer context, while quick start is for experienced developers with existing React Native environments. Verification: npm run verify passes.

### [x] [3.6] Hazard gameplay components missing test coverage affecting minigame maintainability
- category: tests
- impact: 6
- ease: 6
- base-score: 3.6
- user-source-bump: 0.0 (audit source)
- bias-multiplier: 1.0
- final-score: 3.6
- next: Add hermetic test coverage for HazardIntroOverlay component following hazard testing patterns
- observation: Key hazard gameplay components lack test coverage, including HazardIntroOverlay which handles minigame introduction flow
- evidence: components/hazard/HazardIntroOverlay.tsx and danger-art.tsx missing corresponding .test.tsx files in components/hazard/__tests__/
- suggested fix: Add comprehensive hermetic tests for HazardIntroOverlay covering overlay display, transition states, and user interaction handling
- source: audit
- issue: #392
- addressed: 2026-06-13 via commit 8a90661
- fix: Added comprehensive hermetic test suite for HazardIntroOverlay component covering overlay display states, user interactions, accessibility support, and edge cases. Created 16 test cases including mount contract validation, UI element rendering verification, callback behavior testing, accessibility validation, DangerArt integration, and edge case handling. Follows established testing patterns with proper mocking. Verification: npm test HazardIntroOverlay passes.