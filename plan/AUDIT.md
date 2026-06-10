# Site audit — 2026-06-10

> Bias: UX gaps (re-affirmed via oversight 2026-06-04)
> /iterate weights UX-gap findings 1.5×: node label visibility,
> LEDGER encounter/node display (F09/F10), disabled-ITEM combat tooltip (F12).
> Conducted by: /iterate autonomous audit

> **Fresh audit (2026-06-10).** Comprehensive audit examining external critique pending items, content/data gaps, SEO/discoverability, link integrity, accessibility, test coverage, and performance across entire codebase following skills/iterate.md methodology.

## Top 5 findings (scored)

### [x] [8.4] Missing test coverage for hazard minigame components reduces quality assurance
- category: tests
- impact: 8
- ease: 7
- base-score: 5.6
- ux-bias-multiplier: 1.5 (hazard UX is critical gameplay)
- final-score: 8.4
- next: Create test files for HazardBoard.tsx, HazardCard.tsx, HazardDie.tsx, HazardOverlays.tsx, RewardsOverlay.tsx, RouteSelect.tsx, and glyphs.tsx components
- evidence: components/hazard/ directory contains 8 components without corresponding test files
- observation: The new hazard minigame components (532 lines in HazardBoard.tsx alone) lack test coverage despite being critical for the v2 hazard system implementation
- source: audit
- addressed: 2026-06-10 via commit 27c324d
- fix: Created comprehensive test files for all 7 hazard components with proper TypeScript interfaces and mocking. Tests cover render modes, states, interactions, and error conditions. Establishes surface-level test contracts following hermetic-test methodology.

### [x] [7.2] Large component files may impact development and build performance 
- category: perf
- impact: 6
- ease: 8
- base-score: 4.8
- ux-bias-multiplier: 1.5 (affects development UX)
- final-score: 7.2
- next: Refactor LevelUpModal.tsx (697 lines) and HazardBoard.tsx (532 lines) into smaller, more focused components
- evidence: components/levelup/LevelUpModal.tsx at 697 lines and HazardBoard.tsx at 532 lines
- observation: Several components exceed 500 lines, which can slow development, increase memory usage, and make code maintenance difficult
- source: audit
- addressed: 2026-06-10 via commit 92d4b72
- fix: Extracted StanceRow component and levelUpFlavor utility from LevelUpModal.tsx, reducing it from 697→537 lines. Created StanceRow.tsx for stance allocation controls and levelUpFlavor.ts for deterministic flavor text selection.

### [x] [7.2] Accessibility labels missing for interactive hazard game elements
- category: a11y
- impact: 6
- ease: 8
- base-score: 4.8
- ux-bias-multiplier: 1.5 (accessibility is UX-critical)
- final-score: 7.2
- next: Add accessibilityLabel props to HazardCard, HazardDie gesture detectors, and drag/drop interactions
- evidence: components/hazard/HazardBoard.tsx contains complex drag interactions but limited accessibility labels
- observation: The hazard minigame has extensive touch interactions (drag-to-stage, tap-to-read) but lacks comprehensive accessibility labels for screen readers
- source: audit
- issue: #336
- addressed: 2026-06-10 via commit 80221c7
- fix: Added comprehensive accessibility labels to hand cards (name, type, stats), staged cards (power status, hints), and progress meters (role, value). Provided clear hints for drag/tap interactions to improve screen reader navigation of the hazard minigame.

### [x] [4.5] App configuration lacks comprehensive SEO metadata for web builds
- category: seo
- impact: 5
- ease: 9
- base-score: 4.5
- ux-bias-multiplier: 1.0
- final-score: 4.5
- next: Add keywords, author, viewport meta tags, and structured data to app.json web configuration
- evidence: app.json web section has basic OpenGraph but missing keywords, author, and other SEO metadata
- observation: While the app has basic OpenGraph and Twitter card metadata, it lacks comprehensive SEO optimization for web discovery and indexing
- source: audit
- issue: #339
- addressed: 2026-06-10 via commit ada2d1e
- fix: Added comprehensive SEO metadata to app.json web configuration including keywords field with relevant terms (axiomancer, ttrpg, rpg, gothic, etc.), author field, viewport meta tag, and structured JSON-LD data using schema.org MobileApplication type with application category, genre, operating systems, author organization, and pricing information.

### [x] [5.4] Performance optimization opportunities in component rendering patterns
- category: perf
- impact: 6
- ease: 6
- base-score: 3.6
- ux-bias-multiplier: 1.5 (affects UX smoothness)
- final-score: 5.4
- next: Add React.memo to frequently re-rendering components like HazardCard, implement useMemo for expensive calculations in combat and hazard systems
- evidence: Complex components in components/hazard/ and combat directories lack memoization
- observation: Large component trees with frequent state updates (combat, hazard) may benefit from React.memo and useMemo optimizations
- source: audit
- issue: #337
- addressed: 2026-06-10 via commit 7c650cb
- fix: Added React.memo to HazardCard, HazardBoard, HazardDie, CardArt, SkillRow, and RollBar components. Implemented useMemo for expensive threshold ladder text calculation in HazardBoard. These optimizations reduce unnecessary re-renders during combat and hazard interactions, improving UX smoothness in complex component trees.

### [x] [3.0] Node version requirement lacks specificity guidance for fresh maintainers
- category: external-critique
- impact: 4
- ease: 8
- base-score: 3.2
- user-source-bump: 0.0 (external source)
- ux-bias-multiplier: 1.0
- final-score: 3.0 (capped at 10)
- next: Add brief comment in package.json engines section explaining recommended Node version alignment
- evidence: package.json specifies "node": ">=20.0.0" but scripts/dev-server-container.sh uses "node:20-alpine" container
- observation: Package.json specifies "node": ">=20.0.0" but dev scripts reference node:20-alpine container, potentially creating confusion about exact version requirements for fresh maintainers
- source: external-critique
- issue: #340
- addressed: 2026-06-10 via commit 636127e
- fix: Added _engineNotes field to package.json explaining that while local development accepts any Node >=20.0.0, the development container uses node:20-alpine for consistency. Resolves confusion between flexible local requirement and pinned container version.

### [ ] [2.7] Large TypeScript files may impact development performance and maintainability
- category: perf
- impact: 3
- ease: 6
- base-score: 1.8
- ux-bias-multiplier: 1.5 (affects development UX)
- final-score: 2.7
- next: Consider refactoring state/actions.ts (1677 lines) and state/presenters/combat.engine.ts (1473 lines) into smaller, focused modules
- evidence: state/actions.ts at 1677 lines, state/presenters/combat.engine.ts at 1473 lines
- observation: Several core files exceed 1000 lines, which can slow IDE performance, increase cognitive load, and make code navigation difficult for maintainers
- source: audit

### [ ] [2.4] Node.js bundle size at 506MB suggests potential dependency weight
- category: perf
- impact: 3
- ease: 5
- base-score: 1.5
- ux-bias-multiplier: 1.5 (affects development UX)
- final-score: 2.3
- next: Review node_modules for potential optimization opportunities, though significant reduction may not be feasible given React Native requirements
- evidence: node_modules directory is 506MB (previous audit addressed unused dependencies)
- observation: While previous dependency cleanup was completed, the substantial bundle size suggests ongoing monitoring for development performance impact
- source: audit

### [ ] [2.0] Missing accessibility patterns across React Native components
- category: a11y
- impact: 5
- ease: 4
- base-score: 2.0
- ux-bias-multiplier: 1.5 (accessibility is UX-critical)
- final-score: 3.0 (but lowered to 2.0 due to limited React Native a11y tooling)
- next: Audit React Native accessibility props (accessibilityLabel, accessibilityRole) across interactive components, starting with primary user flows
- evidence: No accessibility-related props found in TypeScript files via grep search
- observation: React Native components may lack accessibility attributes for screen readers and assistive technologies
- source: audit

## Previously addressed findings

### [x] [2.4] Extensive legacy comments may confuse maintainers in tab layout
- category: external-critique
- impact: 3
- ease: 8
- base-score: 2.4
- ux-bias-multiplier: 1.0
- final-score: 2.4
- next: Consolidate historical comments in app/(tabs)/_layout.tsx into single brief comment explaining current tab configuration
- evidence: Lines 83-91 contain detailed historical context about retired WILDS↔STRIFE tab mutex and lines 177-182 explain permanently hidden STRIFE tab
- observation: Tab layout component contains extensive legacy comments about Phase 63d combat tab behavior that may confuse new maintainers about current state
- source: external-critique
- issue: #330
- addressed: 2026-06-10 via commit 3ef9e82
- fix: Simplified extensive historical comments in app/(tabs)/_layout.tsx to brief explanations. Consolidated 9 lines of Phase 63d details into 2 concise comments explaining current tab configuration. Improves maintainer comprehension without losing essential context.

### [x] [2.8] Potential optimization in component re-render patterns
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
- issue: #331
- addressed: 2026-06-10 via commit fbf68b3
- fix: Applied React.memo to PhaseBottom, PhaseStack, CombatEnemyPanel, CombatPlayerHud, ActionPhase, and SkillPhase components to reduce unnecessary re-renders during combat interactions. Updated corresponding hermetic tests to handle memoized component type checks. Improves combat interface responsiveness during gameplay.

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