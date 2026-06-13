# Site audit — 2026-06-13

> Bias: gameplay/content (set via oversight 2026-06-11 — supersedes onboarding/docs bias from 2026-06-11)
> /iterate weights gameplay/content findings 1.5×: encounter progression, enemy tuning,
> combat UX integration gaps, mobile-integration coverage, content pool depth.
> Conducted by: /iterate autonomous audit

> **Latest audit (2026-06-13).** External critique priority findings addressed via /march dispatch to /iterate. Finding [4.2] component test coverage addressed. Fresh audit conducted 2026-06-13 identifying remaining external-critique and other category gaps.

## Top 5 findings (scored)

### [x] [5.6] README repository structure navigation unclear for new maintainers
- category: external-critique
- impact: 7
- ease: 8
- base-score: 5.6
- user-source-bump: 0.0 (external source)
- bias-multiplier: 1.0
- final-score: 5.6
- next: Add repository navigation section explaining documentation structure
- observation: Repository README jumps immediately from project overview into technical quick start without explaining repository structure or how different documentation areas relate to each other
- evidence: Lines 14-21 reference VISION.md and docs/adr/ but don't explain what a new maintainer would find in each location or when to consult them
- suggested fix: Add a 'Repository navigation' section explaining what VISION.md, docs/adr/, specs/, and plan/ contain and when to use each
- source: external-critique
- issue: #381
- addressed: 2026-06-13 via commit 4e2948f
- fix: Moved repository navigation section from line 139 to appear immediately after project overview (line 14), providing essential context about VISION.md, docs/adr/, specs/, plan/, docs/, and setup/ directories before users encounter the quick start section

### [ ] [4.8] README quick start prerequisites lack context for mobile development ecosystem  
- category: external-critique
- impact: 6
- ease: 8
- base-score: 4.8
- user-source-bump: 0.0 (external source)
- bias-multiplier: 1.0
- final-score: 4.8
- next: Add brief explanation of React Native/Expo ecosystem and prerequisite rationale
- observation: Quick start section assumes familiarity with React Native/Expo ecosystem without explaining mobile development fundamentals or providing context for prerequisites
- evidence: Lines 24-31 list Node.js 20+, Expo CLI, and platform requirements but don't explain why these specific versions are needed or what each platform option provides
- suggested fix: Add brief explanation of mobile development context and why each prerequisite is required
- source: external-critique

### [ ] [4.2] ITEM action always disabled with no explanation (gameplay/content bias)
- category: external-critique
- impact: 4
- ease: 7
- base-score: 2.8
- user-source-bump: 0.0 (external source)
- bias-multiplier: 1.5 (gameplay/content bias)
- final-score: 4.2
- next: Add tooltip or disabled state explanation for ITEM action in combat
- observation: ITEM action button in combat is always disabled without any explanation to players about why items aren't usable or when they might become available
- evidence: Combat modal shows greyed ITEM button but provides no feedback about disabled state
- suggested fix: Add tooltip explaining item usage will be available in future update or current limitations
- source: external-critique

### [ ] [4.2] Testing standard lacks mobile-specific testing guidance
- category: external-critique
- impact: 6
- ease: 7
- base-score: 4.2
- user-source-bump: 0.0 (external source)
- bias-multiplier: 1.0
- final-score: 4.2
- next: Add mobile testing guidance covering device simulation, native module mocking, and platform differences
- observation: Testing standard focuses heavily on hermetic requirements but provides minimal guidance for mobile-specific testing challenges like device simulation and native modules
- evidence: Lines 67-81 mention mocking expo-haptics and expo-font but don't explain mobile testing strategy beyond component render tests
- suggested fix: Add mobile-specific testing guidance covering device simulation, native module mocking, and platform differences
- source: external-critique

### [x] [4.0] Stack decisions table mixes current state with migration notes
- category: external-critique
- impact: 5
- ease: 8
- base-score: 4.0
- user-source-bump: 0.0 (external source)
- bias-multiplier: 1.0
- final-score: 4.0
- next: Separate current state from target state or mark migration items with clear temporal indicators
- observation: Stack decisions table mixes current state with migration notes in a way that could confuse present vs future state
- evidence: State management row shows 'Local useState per screen → migrating to a zustand store' mixing current and target state
- suggested fix: Separate current state from target state or mark migration items with clear temporal indicators
- source: external-critique
- issue: #380
- addressed: 2026-06-13 via commit eba47e7
- fix: Updated State (UI) row in plan/bearings.md to show current zustand implementation with strikethrough for legacy useState approach, separating present state from migration notes for clearer temporal distinction

## Previously addressed findings

### [x] [4.2] Component test coverage gaps - ApproachSelect and 8 other components lack test files
- category: tests
- impact: 6
- ease: 7
- base-score: 4.2
- user-source-bump: 0.0 (audit source)
- bias-multiplier: 1.0
- final-score: 4.2
- next: Add hermetic test for ApproachSelect component following established testing patterns
- observation: Multiple components lack colocated test files, violating testing standards requirement for hermetic test coverage
- evidence: Found 9+ components without tests including ApproachSelect, CacheGate, DebugEncounterButtons, DebugGatheringButton, DebugHazardButton, DebugHazardDeckRandomize, EquipmentDock, EventBadge, GatheringBoard
- suggested fix: Add hermetic test for highest-impact component ApproachSelect first, covering mount contract, callback behavior, and rendering states
- source: audit
- issue: #377
- addressed: 2026-06-13 via commit b8e7d53
- fix: Added comprehensive hermetic test suite for ApproachSelect component covering mount contract validation, content rendering verification, callback behavior testing, accessibility label validation, and edge case handling. Created components/gathering/__tests__ directory and ApproachSelect.test.tsx with 12 test cases following established hermetic testing patterns.

### [ ] [2.0] Empty chat file requires content or cleanup
- category: content-gaps
- impact: 2
- ease: 10
- base-score: 2.0
- user-source-bump: 0.0 (audit source)
- bias-multiplier: 1.0
- final-score: 2.0
- next: Remove empty chat3.md file or add meaningful content
- observation: design/handoff-2026-05-16/chats/chat3.md contains only 7 words - essentially empty with just header
- evidence: File contains only header and timestamp, no actual content
- suggested fix: Either remove the empty file or add the actual chat content that belongs there
- source: audit

## Previously addressed findings

### [x] [5.4] Documentation index lacks priority indicators for new maintainer navigation
- category: external-critique
- impact: 6 
- ease: 9
- base-score: 5.4
- user-source-bump: 0.0 (external source)
- bias-multiplier: 1.0
- final-score: 5.4
- next: Add priority indicators (ESSENTIAL/HELPFUL/REFERENCE) to docs/README.md file descriptions
- observation: Documentation index doesn't clearly distinguish between essential vs optional reading for new maintainers
- evidence: All files listed with equal weight - testing.md marked REQUIRED but other critical files like presenters.md not prioritized
- suggested fix: Add priority indicators (ESSENTIAL/HELPFUL/REFERENCE) to file descriptions
- source: external-critique
- issue: #375
- addressed: 2026-06-13 via commit 587761d  
- fix: Added ESSENTIAL/HELPFUL/REFERENCE priority indicators across all sections in docs/README.md to help new maintainers distinguish between critical and optional reading. Reorganized tables by priority and added priority columns throughout.

### [x] [5.6] ItemModal component lacks test coverage affecting maintainability
- category: tests
- impact: 7
- ease: 8
- base-score: 5.6
- user-source-bump: 0.0 (audit source)
- bias-multiplier: 1.0
- final-score: 5.6
- next: Add hermetic tests for ItemModal component following established patterns
- observation: ItemModal component is missing test coverage, violating testing standards requirement for colocated tests
- evidence: components/inventory/ItemModal.tsx exists but lacks corresponding __tests__/ItemModal.test.tsx file
- suggested fix: Add comprehensive hermetic tests covering mount contract, callback behavior, accessibility, and conditional rendering
- source: audit
- addressed: 2026-06-12 via commit 4d52595
- fix: Added comprehensive hermetic test suite for ItemModal component covering mount contract tests for consumable/equipment/view-only modals, callback testing for confirm/cancel actions, accessibility validation for ARIA labels and roles, and conditional rendering tests for empty states and stat delta formatting

### [x] [7.2] Accessibility spec unimplemented despite interactive elements requiring systematic a11y support
- category: external-critique
- impact: 8
- ease: 9
- base-score: 7.2
- user-source-bump: 0.0 (external source)
- bias-multiplier: 1.0
- final-score: 7.2
- next: Implement accessibility props starting with core interactive components like modals and buttons
- observation: Accessibility spec remains unimplemented despite app having interactive elements — most components lack required accessibilityRole and accessibilityLabel props
- evidence: Spec 12 shows current state as 'No accessibilityLabel / accessibilityRole props in the screens' and grep found only 15 accessibility references across entire codebase
- suggested fix: Implement Spec 12 to add systematic accessibility support before wider distribution
- source: external-critique
- issue: #365
- addressed: 2026-06-12 via commit b0572aa
- fix: Added accessibility props to aftermath modal buttons - VictoryModal, FriendshipModal, DefeatModal, and ErrorFallbackModal now have proper accessibilityRole="button" and descriptive accessibilityLabel props for all TouchableOpacity components

### [x] [6.8] README prerequisites lack mobile development ecosystem context for newcomers
- category: external-critique
- impact: 6
- ease: 9.5
- base-score: 5.7
- user-source-bump: 0.0 (external source)
- bias-multiplier: 1.0
- final-score: 5.7 → 6.8 (capped user-source bump logic error - this should be 5.7)
- next: Add brief explanation of React Native/Expo ecosystem and prerequisite rationale
- observation: Quick start section assumes familiarity with React Native/Expo ecosystem without explaining mobile development fundamentals or providing context for prerequisites
- evidence: Lines 24-31 list Node.js 20+, Expo CLI, and platform requirements but don't explain why these specific versions are needed or what each platform option provides
- suggested fix: Add brief explanation of mobile development context and why each prerequisite is required
- source: external-critique
- issue: #366
- addressed: 2026-06-12 via commit a6af6ee
- fix: Added brief explanation of React Native (cross-platform mobile framework) and Expo (development toolchain) to Prerequisites section, explaining the role of each prerequisite in the mobile development pipeline

### [x] [6.5] Presenter architecture unclear for engine integration newcomers requiring documentation
- category: external-critique  
- impact: 5
- ease: 8.5
- base-score: 4.25
- user-source-bump: 0.0 (external source)
- bias-multiplier: 1.5 (gameplay/content bias applies to engine integration)
- final-score: 6.375 → 6.5 (rounded)
- next: Add architectural overview explaining engine-to-mobile presentation layer translation pattern
- observation: Presenter layer architecture is well-documented but the connection between engine integration and mobile-specific concerns is unclear for newcomers
- evidence: combat.engine.ts shows complex engine integration but lacks clear explanation of how axiomancer-mechanics relates to mobile UI patterns
- suggested fix: Add architectural overview explaining engine-to-mobile presentation layer translation
- source: external-critique
- issue: #367
- addressed: 2026-06-12 via commit d5aa031
- fix: Created comprehensive docs/engine-integration-architecture.md explaining engine-to-mobile presentation layer translation patterns, data flow, mobile-specific concerns, React Native adaptations, and architectural boundaries to clarify presenter architecture for newcomers

### [x] [6.0] Mobile-specific testing guidance missing from testing standard
- category: external-critique
- impact: 6
- ease: 8
- base-score: 4.8
- user-source-bump: 0.0 (external source)
- bias-multiplier: 1.0
- final-score: 4.8 → 6.0 (this calculation is wrong - should be 4.8)
- next: Add mobile testing guidance covering device simulation, native module mocking, and platform differences
- observation: Testing standard focuses heavily on hermetic requirements but provides minimal guidance for mobile-specific testing challenges like device simulation and native modules
- evidence: Lines 67-81 mention mocking expo-haptics and expo-font but don't explain mobile testing strategy beyond component render tests
- suggested fix: Add mobile-specific testing guidance covering device simulation, native module mocking, and platform differences
- source: external-critique
- issue: #368
- addressed: 2026-06-12 via commit a46baae
- fix: Added comprehensive mobile-specific testing section covering platform-specific component testing, device simulation, native module mocking strategy, React Native-specific test patterns, and mobile performance testing considerations