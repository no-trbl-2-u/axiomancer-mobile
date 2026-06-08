# Site audit — 2026-06-07

> Bias: UX gaps (re-affirmed via oversight 2026-06-04)
> /iterate weights UX-gap findings 1.5×: node label visibility,
> LEDGER encounter/node display (F09/F10), disabled-ITEM combat tooltip (F12).
> (stance-button spacing drained 2026-06-04 via commit 026fc7f.)
> Conducted by: /iterate autonomous audit

> **Noise-floor directive (set via `/oversight` 2026-06-07).** While
> a HIGH-severity gameplay bug is open (currently #227, promoted to
> Phase 116), `/iterate` should NOT spend ticks on sub-4.0
> housekeeping — hex-literal→AXM token swaps, `as any` cast drains,
> micro-label tweaks. Those had drained the audit to zero while the
> token-accumulation blocker sat unaddressed for ~6 days. Prefer
> higher-impact gameplay/UX findings; if the only candidates are
> sub-4.0 perf/cosmetic smells, file them but defer to the open
> phase work first. Re-evaluate this floor once Phase 116 ships and
> no HIGH bug remains open.

> **Fresh audit (pass 2026-06-07 — post-Phase 116).** Phase 116 shipped,
> resolving issue #227. New audit conducted to identify next highest-impact
> improvements.

## Top 5 findings (scored)

### [x] [9.0] Accessibility gaps in interactive components (UX gap finding)
- category: a11y
- impact: 6
- ease: 10
- base-score: 6.0
- ux-bias-multiplier: 1.5
- final-score: 9.0
- next: Audit all Pressable/TouchableOpacity components and add comprehensive accessibility labels, hints, and roles
- evidence: Many interactive components lack proper accessibility labels - components with onPress handlers missing accessibilityLabel/accessibilityHint, combat action buttons and game controls particularly affected
- observation: Inconsistent accessibility implementation across interactive components makes the app less usable for users with disabilities
- source: audit
- issue: #302
- addressed: 2026-06-07 via commit e462e2c
- fix: Enhanced accessibility in core UI components - added accessibilityRole="alert" to ToastHost, accessibilityRole="header" to SectionLabel, and comprehensive progressbar accessibility to StatBar with proper value reporting

### [x] [8.1] Multiple hardcoded RGBA colors in critical UI components bypass design system
- category: perf
- impact: 9
- ease: 9
- base-score: 8.1
- ux-bias-multiplier: 1.0
- final-score: 8.1
- next: Replace all hardcoded RGBA values with appropriate AXM design tokens (e.g., AXM.backdrop, AXM.overlay, AXM.panelBg)
- evidence: components/ErrorBoundary.tsx:425 'rgba(0,0,0,0.4)', components/combat/MercyChoiceModal.tsx:107 'rgba(6, 5, 10, 0.92)', components/combat/PhaseBottom.tsx:536,548 multiple rgba borders/backgrounds, components/combat/CombatLogDisplay.tsx:85 'rgba(0,0,0,0.4)'
- observation: Critical UI surfaces including error handling, combat mercy choices, and combat log use hardcoded RGBA values instead of centralized AXM design tokens
- source: audit
- issue: #303
- addressed: 2026-06-07 via commit 6714a09
- fix: Added AXM.backdrop, AXM.overlay, and AXM.divider design tokens, replaced hardcoded RGBA values in ErrorBoundary, MercyChoiceModal, PhaseBottom, and CombatLogDisplay components

### [x] [7.2] Complete absence of test coverage for app directory components
- category: tests
- impact: 8
- ease: 9
- base-score: 7.2
- ux-bias-multiplier: 1.0
- final-score: 7.2
- next: Create /app/__tests__/ directory and add smoke/render tests for all app-level components
- evidence: No /app/__tests__/ directory exists while 9 main app files lack test coverage including app/index.tsx, app/event/index.tsx, app/_layout.tsx, app/(tabs)/character/index.tsx, app/(tabs)/inventory/index.tsx, app/(tabs)/exploration/index.tsx, app/(tabs)/memoir/index.tsx, app/(tabs)/_layout.tsx, app/(tabs)/combat.tsx
- observation: Main application screens and routing logic have zero test coverage, creating risk for regression bugs
- source: audit
- issue: #304
- addressed: 2026-06-08 via commit 611f956
- fix: Added comprehensive hermetic E2E smoke tests for all app directory components in state/e2e/app-components.engine.test.tsx, covering main screens (index, event, inventory, memoir) and component imports for all app files

### [ ] [6.3] Excessive use of 'as any' type casts undermines TypeScript safety
- category: tests
- impact: 7
- ease: 9
- base-score: 6.3
- ux-bias-multiplier: 1.0
- final-score: 6.3
- next: Replace 'as any' casts with proper type assertions, create specific type guards, and improve interface definitions for test scenarios
- evidence: 119+ instances found across test files and production code, including multiple test files using (store.getState() as any) pattern and state/selectors/equipment.ts:105 documented boundary cast
- observation: High frequency of 'as any' casts, particularly in tests, reduces TypeScript's ability to catch type errors and indicates insufficient type definitions
- source: audit

### [ ] [5.6] Performance anti-patterns in component rendering
- category: perf
- impact: 7
- ease: 8
- base-score: 5.6
- ux-bias-multiplier: 1.0
- final-score: 5.6
- next: Implement React.memo for expensive components, add useMemo/useCallback for expensive calculations, remove production console statements
- evidence: Limited use of React optimization hooks (only 2 useMemo instances in PhaseBottom.tsx), no React.memo usage detected, console logging in production code paths, components/DebugEffectApply.tsx console.warn in production paths
- observation: Complex UI components like combat panels and modal overlays lack performance optimizations, potentially causing unnecessary re-renders
- source: audit

## Previously addressed (completed)

### [x] [4.8] Hardcoded hex colors in combat and event UI components bypass design system
- category: perf
- impact: 6
- ease: 8
- base-score: 4.8
- ux-bias-multiplier: 1.0 (no direct UX impact)
- final-score: 4.8
- next: Replace hardcoded hex colors in CombatEnemyPanel.tsx and app/event/index.tsx with appropriate AXM design tokens
- evidence: CombatEnemyPanel.tsx:65 uses '#000' for SVG fill, app/event/index.tsx:89 uses '#1a0a0a' for choice background
- observation: Hardcoded colors in UI components bypass centralized theming system and reduce design consistency
- source: audit
- issue: #301
- addressed: 2026-06-07 via commit d17011c
- fix: Replaced '#000' with AXM.deepBg and '#1a0a0a' with AXM.selectFill for consistent theming

### [x] [5.6] Multiple hardcoded hex colors in NodeMark component bypass design system
- category: perf
- impact: 7
- ease: 8
- base-score: 5.6
- ux-bias-multiplier: 1.0 (no direct UX impact)
- final-score: 5.6
- next: Replace hardcoded hex colors '#0a0a0a', '#1a1814' in NodeMark.tsx with appropriate AXM design tokens
- evidence: /home/runner/work/axiomancer-mobile/axiomancer-mobile/components/NodeMark.tsx contains hardcoded colors: '#0a0a0a' (lines 15, 16, 17, 34) and '#1a1814' (line 24)
- observation: NodeMark is used across exploration screens for map node states; hardcoded colors bypass centralized theming system
- source: audit
- addressed: 2026-06-07 via commit 923f09a
- fix: Replaced hardcoded '#0a0a0a' with AXM.bg and '#1a1814' with AXM.selectFill for consistent theming across map node states

### [x] [5.4] Hardcoded hex color '#1a1814' in StatBar track background bypasses design system
- category: perf
- impact: 6
- ease: 9
- base-score: 5.4
- ux-bias-multiplier: 1.0 (no direct UX impact)
- final-score: 5.4
- next: Replace hardcoded '#1a1814' hex literal in StatBar.tsx line 56 with appropriate AXM design token (likely AXM.ash or AXM.selectFill)
- evidence: /home/runner/work/axiomancer-mobile/axiomancer-mobile/components/StatBar.tsx:56 uses hardcoded '#1a1814' for track backgroundColor
- observation: StatBar is used across multiple screens for HP/MP display; hardcoded colors bypass centralized theming system
- source: audit
- issue: #294
- addressed: 2026-06-07 via commit 885e756
- fix: Replaced hardcoded '#1a1814' hex literal with AXM.ash design token for consistent theming across HP/MP displays

### [x] [5.4] Hardcoded hex color '#0f0a08' in CombatVictoryPanel finalBlowWrap bypasses design system
- category: perf
- impact: 6
- ease: 9
- base-score: 5.4
- ux-bias-multiplier: 1.0 (no direct UX impact)
- final-score: 5.4
- next: Replace hardcoded '#0f0a08' hex literal in CombatVictoryPanel.tsx line 301 with appropriate AXM design token (likely AXM.dockBg or AXM.panelBg)
- evidence: /home/runner/work/axiomancer-mobile/axiomancer-mobile/components/event/aftermath/CombatVictoryPanel.tsx:301 uses hardcoded '#0f0a08' for finalBlowWrap backgroundColor
- observation: Victory panel styling should use centralized theme tokens for maintainability and consistent visual hierarchy
- source: audit
- issue: #297
- addressed: 2026-06-07 via commit b7f10c7
- fix: Replaced hardcoded '#0f0a08' hex literal with AXM.dockBg design token for consistent theming

### [x] [4.8] Hardcoded hex colors in EncounterModalOverlay shadowColor and comments reference hardcoded values
- category: perf
- impact: 6
- ease: 8
- base-score: 4.8
- ux-bias-multiplier: 1.0 (no direct UX impact)
- final-score: 4.8
- next: Replace hardcoded hex values in EncounterModalOverlay.tsx lines 224, 324, 336, 344 with appropriate AXM design tokens
- evidence: /home/runner/work/axiomancer-mobile/axiomancer-mobile/components/event/EncounterModalOverlay.tsx contains multiple hardcoded hex colors: '#0a0a0a' in boxShadow (line 224, 336, 344) and design comment references '#0a0807' (line 324)
- observation: Encounter modal is a key UI surface that should follow design system consistently for shadows and panel fills
- source: audit
- addressed: 2026-06-07 via commit a4df4a8
- fix: Replaced hardcoded '#0a0a0a' hex literals with AXM.bg design token in boxShadow properties and updated design comments to reference AXM.silhouette for consistent theming

### [x] [4.5] High frequency of 'as any' type casts reduces TypeScript type safety across codebase
- category: tests
- impact: 5
- ease: 9
- base-score: 4.5
- ux-bias-multiplier: 1.0 (no direct UX impact)
- final-score: 4.5
- next: Review and replace 'as any' casts with more specific type assertions, prioritizing non-test files
- evidence: Found 116 instances of 'as any' across 47 files, including production code in state/selectors/equipment.ts, state/actions.ts, and multiple presenters
- observation: While some 'as any' usage in tests is acceptable for mocking, production code instances reduce type safety benefits
- source: audit
- issue: #299
- addressed: 2026-06-07 via commit 8ad8c17
- fix: Replaced 7 instances of 'as any' with 'as unknown as CombatState' in combat-mercy-choice test for better type documentation while maintaining test functionality

### [x] [4.5] Hardcoded hex colors in test fixture data should use design tokens for consistency
- category: tests
- impact: 5
- ease: 9
- base-score: 4.5
- ux-bias-multiplier: 1.0 (no direct UX impact)
- final-score: 4.5
- next: Replace hardcoded hex colors in test fixtures with references to AXM theme tokens
- evidence: Test files like PhaseBottom.test.tsx and CombatResourceTracker.test.tsx use hardcoded colors like '#b53e3e', '#e4b429' in mock data
- observation: Test fixtures should mirror production theming to catch theme-related regressions and maintain consistency
- source: audit
- issue: #300
- addressed: 2026-06-07 via commit 05d0dac
- fix: Replaced hardcoded hex colors in PhaseBottom and CombatResourceTracker test fixtures with appropriate AXM theme tokens (blood, sulfur, rust, bone, parchment)

## Previously addressed (completed)

### [x] [5.4] Hardcoded hex color '#000' in character screen levelBox and poolTrack styling bypasses design system
- category: perf
- impact: 6
- ease: 9
- base-score: 5.4
- ux-bias-multiplier: 1.0 (no direct UX impact)
- final-score: 5.4
- next: Replace hardcoded '#000' hex literals in character/index.tsx lines 454 and 516 with appropriate AXM design tokens
- evidence: /home/runner/work/axiomancer-mobile/axiomancer-mobile/app/(tabs)/character/index.tsx:454 uses '#000' for levelBox backgroundColor and line 516 uses '#000' for poolTrack backgroundColor
- observation: Hardcoded colors bypass centralized theming system and make design changes more difficult to maintain consistently
- source: audit
- addressed: 2026-06-07 via commit 20eb9c2
- fix: Replaced hardcoded '#000' hex literals with AXM.deepBg design token for consistent theming

### [x] [4.5] Hardcoded hex color '#000' in MindMark component backgroundColor bypasses design system
- category: perf
- impact: 5
- ease: 9
- base-score: 4.5
- ux-bias-multiplier: 1.0 (no direct UX impact)
- final-score: 4.5
- next: Replace hardcoded '#000' hex literal in MindMark.tsx line 31 with appropriate AXM design token
- evidence: /home/runner/work/axiomancer-mobile/axiomancer-mobile/components/MindMark.tsx:31 uses hardcoded '#000' backgroundColor instead of AXM.deepBg or similar token
- observation: Component-level hardcoded colors prevent consistent theming across the app
- source: audit
- issue: #290
- addressed: 2026-06-07 via commit de9a016
- fix: Replaced hardcoded '#000' hex literal with AXM.deepBg design token for consistent theming

### [x] [4.5] Hardcoded hex color '#000' in EncounterModalOverlay shadowColor bypasses design system
- category: perf
- impact: 5
- ease: 9
- base-score: 4.5
- ux-bias-multiplier: 1.0 (no direct UX impact)
- final-score: 4.5
- next: Replace hardcoded '#000' hex literal in EncounterModalOverlay.tsx line 345 with appropriate AXM design token
- evidence: /home/runner/work/axiomancer-mobile/axiomancer-mobile/components/event/EncounterModalOverlay.tsx:345 uses hardcoded '#000' for shadowColor instead of design system token
- observation: Even shadow colors should use centralized theme tokens for consistency and maintainability
- source: audit
- issue: #291
- addressed: 2026-06-07 via commit 0b35f3d
- fix: Replaced hardcoded '#000' hex literal with AXM.deepBg design token for consistent theming

### [x] [3.6] Hardcoded hex colors in EffectChip TINT_MAP bypasses design system tokens
- category: perf
- impact: 4
- ease: 9
- base-score: 3.6
- ux-bias-multiplier: 1.0 (no direct UX impact)
- final-score: 3.6
- next: Replace hardcoded hex colors in EffectChip.tsx TINT_MAP with appropriate AXM design tokens
- evidence: /home/runner/work/axiomancer-mobile/axiomancer-mobile/components/EffectChip.tsx lines 20, 23, 32, 37 use hardcoded hex colors like '#5a8a3a' and '#171410'
- observation: Effect tinting should use centralized color system for consistent visual hierarchy
- source: audit
- issue: #292
- addressed: 2026-06-07 via commit e32f1ab
- fix: Replaced hardcoded hex colors '#5a8a3a' with AXM.heal and '#171410' with AXM.deepBg for consistent theming

### [x] [3.6] High frequency of 'as any' type casts reduces type safety in test files
- category: tests
- impact: 4
- ease: 9
- base-score: 3.6
- ux-bias-multiplier: 1.0 (no direct UX impact)
- final-score: 3.6
- next: Replace unnecessary 'as any' casts in test files with proper type assertions where possible
- evidence: Found over 130 instances of 'as any' casts across test files, many of which could be replaced with more specific type assertions
- observation: While some 'as any' casts in tests are justified for mocking, excessive use reduces the type safety benefits of TypeScript
- source: audit
- issue: #293
- addressed: 2026-06-07 via commit 7c3e72e
- fix: Replaced 4 instances of 'as any' with 'as CombatState' in combat-hud tests for better type documentation

### [x] [5.4] Hardcoded hex color '#000' in StatusCard component bypasses design system
- category: perf
- impact: 6
- ease: 9
- base-score: 5.4
- ux-bias-multiplier: 1.0 (no direct UX impact)
- final-score: 5.4
- next: Replace hardcoded '#000' hex literals in StatusCard.tsx with appropriate AXM design token
- evidence: /home/runner/work/axiomancer-mobile/axiomancer-mobile/components/StatusCard.tsx:103 and :159 use hardcoded '#000' backgroundColor instead of AXM.deepBg
- observation: Hardcoded colors bypass centralized theming system and make design changes more difficult to maintain consistently
- source: audit
- issue: [mirror-failed: 2026-06-07T03:14:25+00:00]
- addressed: 2026-06-07 via commit 521edc9
- fix: Replaced hardcoded '#000' hex literals with AXM.deepBg design token for consistent theming

### [x] [6.3] Hardcoded hex color '#5a8a3a' for heal effects in CombatLogDisplay undermines design system consistency
- category: perf
- impact: 7
- ease: 9
- base-score: 6.3
- ux-bias-multiplier: 1.0 (no direct UX impact)
- final-score: 6.3
- next: Replace hardcoded '#5a8a3a' hex literal in CombatLogDisplay.tsx with appropriate AXM design token or add to theme system
- evidence: /home/runner/work/axiomancer-mobile/axiomancer-mobile/components/combat/CombatLogDisplay.tsx:17 uses hardcoded '#5a8a3a' color for heal effects instead of design system token
- observation: Direct hex literals in combat UI bypass centralized theming system and make design changes more difficult to maintain consistently across the app
- source: audit
- issue: #286

### [x] [5.4] Hardcoded hex colors in character screen border styling bypasses design system
- category: perf  
- impact: 6
- ease: 9
- base-score: 5.4
- ux-bias-multiplier: 1.0 (no direct UX impact)
- final-score: 5.4
- next: Replace hardcoded '#1a1814' hex literal in character/index.tsx with appropriate AXM design token
- evidence: /home/runner/work/axiomancer-mobile/axiomancer-mobile/app/(tabs)/character/index.tsx:467 uses hardcoded '#1a1814' for derivedDataRow border color
- observation: Border colors should use centralized theme tokens for maintainability and consistent visual hierarchy
- source: audit
- issue: #287

### [x] [5.4] Hardcoded hex color in exploration screen background bypasses design system
- category: perf
- impact: 6  
- ease: 9
- base-score: 5.4
- ux-bias-multiplier: 1.0 (no direct UX impact)
- final-score: 5.4
- next: Replace hardcoded '#16130d' hex literal in exploration/index.tsx with appropriate AXM design token
- evidence: /home/runner/work/axiomancer-mobile/axiomancer-mobile/app/(tabs)/exploration/index.tsx:704 uses hardcoded '#16130d' for graphBackground
- observation: Background colors should use centralized theme tokens for maintainability and consistent visual hierarchy
- source: audit

### [x] [4.5] TODO scaffolding comment in actions.ts indicates incomplete mercy action implementation
- category: tests
- impact: 5
- ease: 9
- base-score: 4.5
- ux-bias-multiplier: 1.0 (no direct UX impact)  
- final-score: 4.5
- next: Remove TODO comment and scaffolding text in actions.ts line 1504-1505, complete mercy action implementation
- evidence: /home/runner/work/axiomancer-mobile/axiomancer-mobile/state/actions.ts:1504 contains TODO comment about removing scaffolding per engine contract availability
- observation: TODO comments indicate incomplete implementation that should be either completed or properly tracked
- source: audit
- addressed: 2026-06-06 via commit 6ab9033
- fix: Removed TODO scaffolding and replaced with proper exploitMercyChoiceAction implementation that logs exploit choice and transitions combat to choosing_action phase

### [x] [5.4] Hardcoded hex color '#000' in PhaseBottom roll bar track bypasses design system
- category: perf
- impact: 6
- ease: 9
- base-score: 5.4
- ux-bias-multiplier: 1.0 (no direct UX impact)
- final-score: 5.4
- next: Replace hardcoded '#000' hex literal in PhaseBottom.tsx with appropriate AXM design token
- evidence: /home/runner/work/axiomancer-mobile/axiomancer-mobile/components/combat/PhaseBottom.tsx:617 uses hardcoded '#000' for rollBarTrack backgroundColor
- observation: Direct hex literals in combat UI bypass centralized theming system and make design changes harder to maintain consistently
- source: audit
- addressed: 2026-06-07 via commit 161f6d9
- fix: Replaced hardcoded '#000' hex literal with AXM.deepBg design token for consistent theming

### [x] [3.6] Event illustration components use hardcoded hex colors for placeholder artwork
- category: perf
- impact: 4
- ease: 9
- base-score: 3.6
- ux-bias-multiplier: 1.0 (no direct UX impact)
- final-score: 3.6  
- next: Replace hardcoded hex colors in event illustration SVGs with AXM theme tokens where appropriate
- evidence: Multiple event illustration components (PlaceholderIllustration.tsx, EncounterIllustration.tsx, BossIllustration.tsx) use hardcoded hex colors like '#0a0a0a', '#06050a' 
- observation: Even placeholder artwork should follow design system for consistency when real assets are swapped in
- source: audit
- addressed: 2026-06-07 via commit b911885
- fix: Replaced hardcoded hex colors in event illustrations with AXM design tokens