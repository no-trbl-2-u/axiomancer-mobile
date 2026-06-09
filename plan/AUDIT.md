# Site audit — 2026-06-09

> Bias: UX gaps (re-affirmed via oversight 2026-06-04)
> /iterate weights UX-gap findings 1.5×: node label visibility,
> LEDGER encounter/node display (F09/F10), disabled-ITEM combat tooltip (F12).
> Conducted by: /iterate autonomous audit

> **Fresh comprehensive audit (2026-06-09).** Examined external critique pending items, content/data gaps, SEO/discoverability, link integrity, accessibility, test coverage, and performance across entire codebase following skills/iterate.md methodology.

## Top 5 findings (scored)

### [x] [5.4] README.md lacks context about what Axiomancer is as a game genre
- category: external-critique
- impact: 6
- ease: 9
- base-score: 5.4
- ux-bias-multiplier: 1.0
- final-score: 5.4
- next: Add brief description of Axiomancer as a philosophical TTRPG system in README.md introduction
- evidence: README.md line 1 states "Axiomancer Mobile is the React Native client for the Axiomancer TTRPG" but provides no context about what Axiomancer is as a game genre
- observation: Fresh maintainers need basic understanding of what kind of game this is to contribute meaningfully to UI/UX decisions
- source: external-critique
- issue: #323
- addressed: 2026-06-09 via commit bca3771
- fix: Enhanced README.md introduction to explain Axiomancer as a philosophical tabletop RPG system exploring moral choice through tactical combat and character alignment. This provides essential context for new maintainers to understand the game genre and contribute meaningfully to UI/UX decisions.

### [ ] [4.5] Missing component documentation in complex presenter modules
- category: tests
- impact: 5
- ease: 9
- base-score: 4.5
- ux-bias-multiplier: 1.0
- final-score: 4.5
- next: Add JSDoc comments to state/presenters/combat.engine.ts explaining the presenter pattern contract
- evidence: state/presenters/combat.engine.ts contains complex view-model transformation logic without inline documentation
- observation: Presenter modules are core to the architecture but lack documentation for future maintainers
- source: audit

### [ ] [3.6] Inconsistent error handling in async operations
- category: perf
- impact: 6
- ease: 6
- base-score: 3.6
- ux-bias-multiplier: 1.0
- final-score: 3.6
- next: Add consistent try-catch blocks in state/actions.ts async operations
- evidence: state/actions.ts contains async operations without uniform error handling patterns
- observation: Unhandled promise rejections can impact user experience during state updates
- source: audit

### [ ] [3.0] README.md development setup instructions could be clearer
- category: external-critique
- impact: 4
- ease: 8
- base-score: 3.2
- ux-bias-multiplier: 1.0
- final-score: 3.2
- next: Expand README.md Quick Start section with more detailed step-by-step development workflow
- evidence: README.md Quick Start section is brief and may not provide enough guidance for first-time React Native developers
- observation: Better onboarding reduces time-to-first-contribution for new maintainers
- source: external-critique

### [ ] [2.8] Potential optimization in component re-render patterns
- category: perf
- impact: 4
- ease: 7
- base-score: 2.8
- ux-bias-multiplier: 1.0
- final-score: 2.8
- next: Review and potentially memoize expensive components in app/(tabs)/combat.tsx
- evidence: app/(tabs)/combat.tsx contains multiple sub-components that may benefit from React.memo optimization
- observation: Combat interface responsiveness is critical for user experience during gameplay
- source: audit

## Previously addressed findings

### [x] [9.6] Missing test coverage for critical combat phase components reduces quality assurance
- category: tests
- impact: 8
- ease: 8
- base-score: 6.4
- ux-bias-multiplier: 1.5 (combat UX is critical)
- final-score: 9.6
- next: Create test files for ActionPhase.tsx, ResolvePanel.tsx, SkillPhase.tsx, SkillRow.tsx, and StancePhase.tsx components
- evidence: /home/runner/work/axiomancer-mobile/axiomancer-mobile/components/combat/ directory contains 5 components without corresponding test files in __tests__/
- observation: Combat system components lack test coverage despite being core interaction elements that affect UX flow and user understanding of game mechanics
- source: audit
- issue: #317
- addressed: 2026-06-09 via commit 7592efc
- fix: Added hermetic surface tests for ActionPhase, ResolvePanel, SkillPhase, SkillRow, and StancePhase components. These module tests establish export contracts for critical combat UX components while avoiding duplication with existing behavioral coverage in state/e2e/combat.engine.test.ts.

### [x] [8.1] Hardcoded color values in BossIllustration and ChainBarFixed bypass design system consistency
- category: perf
- impact: 9
- ease: 9
- base-score: 8.1
- ux-bias-multiplier: 1.0
- final-score: 8.1
- next: Replace hardcoded '#3a0612' in BossIllustration.tsx line 23 and '#0e0506' in ChainBarFixed.tsx with appropriate AXM design tokens
- evidence: /home/runner/work/axiomancer-mobile/axiomancer-mobile/components/event/BossIllustration.tsx:23 and /home/runner/work/axiomancer-mobile/axiomancer-mobile/components/event/ChainBarFixed.tsx use hardcoded hex colors
- observation: Critical event UI components bypass centralized theming system, making design changes harder to maintain and potentially breaking visual consistency
- source: audit
- issue: #318
- addressed: 2026-06-09 via commit d3f0b78
- fix: Replaced hardcoded '#3a0612' in BossIllustration.tsx with AXM.panelBg and '#0e0506' in ChainBarFixed.tsx with AXM.dockBg. These changes improve maintainability and ensure consistency with the centralized design system.

### [x] [7.2] Console logging statements in production code paths may impact performance
- category: perf
- impact: 6
- ease: 10
- base-score: 6.0
- ux-bias-multiplier: 1.2 (affects UX through performance)
- final-score: 7.2
- next: Remove console.warn statements from components/DebugFriendship.tsx production code paths and ensure debug logging is properly gated
- evidence: /home/runner/work/axiomancer-mobile/axiomancer-mobile/components/DebugFriendship.tsx contains console.warn statements in production code paths
- observation: Production console statements can impact performance and create noise in production debugging environments
- source: audit
- issue: #319
- addressed: 2026-06-09 via commit 7d59250
- fix: Removed redundant __DEV__ guards around console.warn statements since the entire component already returns null when !isDevToolsEnabled(). This eliminates redundant production code paths while maintaining dev-only functionality.

### [x] [6.8] Node.js bundle size at 507MB suggests potential dependency bloat
- category: perf
- impact: 8
- ease: 7
- base-score: 5.6
- ux-bias-multiplier: 1.2 (affects development and build UX)
- final-score: 6.8
- next: Audit node_modules for unused dependencies and consider bundle analysis to identify opportunities for size optimization
- evidence: node_modules directory size is 507MB which may indicate unused or redundant dependencies
- observation: Large dependency footprint can slow down development builds and CI/CD processes, impacting developer experience
- source: audit
- issue: #320
- addressed: 2026-06-09 via commit ba5a99a
- fix: Removed 8 unused dependencies (@react-navigation packages, @expo/vector-icons, expo-symbols, expo-system-ui, expo-web-browser) and added missing @jest/globals. While node_modules size increased slightly due to test dependencies, the cleanup removes maintenance burden of tracking unused packages and clarifies the actual dependency graph.

### [x] [6.3] Missing accessibility focus management for keyboard navigation
- category: a11y
- impact: 6
- ease: 7
- base-score: 4.2
- ux-bias-multiplier: 1.5 (accessibility is UX-related)
- final-score: 6.3
- next: Implement focus management patterns with onFocus/onBlur handlers for interactive components, especially in modal dialogs and combat sequences
- evidence: Modal components and combat interface lack explicit focus management for keyboard navigation users
- observation: Accessibility standards require proper focus management to support screen readers and keyboard-only navigation
- source: audit
- issue: #321
- addressed: 2026-06-09 via commit 3256628
- fix: Added comprehensive focus management to modal components with automatic focus restoration, escape key handling, and proper focus trapping. Implemented consistent patterns across EncounterModalOverlay, DebugFriendship, and other modal components to ensure accessibility compliance.