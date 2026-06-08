# Site audit — 2026-06-08

> Bias: UX gaps (re-affirmed via oversight 2026-06-04)
> /iterate weights UX-gap findings 1.5×: node label visibility,
> LEDGER encounter/node display (F09/F10), disabled-ITEM combat tooltip (F12).
> Conducted by: /iterate autonomous audit

> **Fresh comprehensive audit (2026-06-08).** Examined external critique pending items, content/data gaps, SEO/discoverability, link integrity, accessibility, test coverage, and performance across entire codebase following skills/iterate.md methodology.

## Top 5 findings (scored)

### [x] [9.0] Missing accessibility labels on combat enemy portrait SVG reduces screen reader usability
- category: a11y  
- impact: 6
- ease: 10
- base-score: 6.0
- ux-bias-multiplier: 1.5 (accessibility is UX-related)
- final-score: 9.0
- next: Add accessibilityLabel and accessibilityRole to enemy portrait SVG in CombatEnemyPanel.tsx
- evidence: /home/runner/work/axiomancer-mobile/axiomancer-mobile/components/combat/CombatEnemyPanel.tsx lines 42-69 contain detailed enemy silhouette SVG with no accessibility attributes
- observation: Combat enemy portrait is a critical UI element for combat encounters but lacks accessibility labels, making it impossible for screen readers to convey enemy presence to visually impaired users
- source: audit
- issue: #310

### [ ] [7.2] README.md architecture documentation references outdated presenter file locations
- category: external-critique
- impact: 8
- ease: 9  
- base-score: 7.2
- ux-bias-multiplier: 1.0 (no direct UX impact)
- final-score: 7.2
- next: Update README.md line 135 to reference correct presenter location at `state/presenters/*.engine.ts` instead of `app/<route>/*.engine.ts`
- evidence: README.md line 135 states "Presenters | app/<route>/*.engine.ts" but presenters actually live in state/presenters/ directory with 20+ engine files
- observation: Documentation drift creates confusion for new maintainers trying to locate presenter files, found via external critique pass 17/18
- source: external-critique

### [ ] [6.3] Multiple hardcoded color literals in EncounterPreludeContent bypass design system
- category: perf
- impact: 7
- ease: 9
- base-score: 6.3
- ux-bias-multiplier: 1.0 (no direct UX impact)  
- final-score: 6.3
- next: Replace hardcoded color references in EncounterPreludeContent.tsx with appropriate AXM design tokens
- evidence: /home/runner/work/axiomancer-mobile/axiomancer-mobile/components/event/EncounterPreludeContent.tsx uses direct AXM.blood reference without semantic token abstraction
- observation: Encounter prelude UI uses direct theme references instead of semantic tokens, reducing design system maintainability and consistency
- source: audit

### [ ] [5.4] Missing test coverage for critical event illustration accessibility patterns  
- category: tests
- impact: 6
- ease: 9
- base-score: 5.4
- ux-bias-multiplier: 1.0 (no direct UX impact)
- final-score: 5.4  
- next: Add accessibility-focused tests for PlaceholderIllustration component to verify all event slugs have proper aria labels
- evidence: PlaceholderIllustration.tsx has comprehensive accessibility labels but no tests verify the getAccessibilityLabel function covers all EventArtSlug values
- observation: Event illustrations are key narrative elements but lack test coverage ensuring accessibility compliance across all event types
- source: audit

### [ ] [4.5] Stale TODO comments in mercy action test files reference outdated Phase 108 context
- category: tests  
- impact: 5
- ease: 9
- base-score: 4.5
- ux-bias-multiplier: 1.0 (no direct UX impact)
- final-score: 4.5
- next: Remove TODO scaffolding comments in mercy-actions.engine.test.ts and update documentation to reflect current implementation state
- evidence: /home/runner/work/axiomancer-mobile/axiomancer-mobile/state/e2e/mercy-actions.engine.test.ts contains Phase 108 TODO references that are outdated
- observation: Stale TODO comments in test files create maintenance debt and confusion about current implementation status
- source: audit

## Previous findings (completed)

### [x] [7.2] Missing docs/README.md creates broken navigation path (external critique)
- category: external-critique
- impact: 8
- ease: 9
- base-score: 7.2
- ux-bias-multiplier: 1.0 (no direct UX impact)
- final-score: 7.2
- next: Create docs/README.md with overview of documentation structure
- evidence: External critique finding from pass 26: docs/README.md referenced in main README but file does not exist — creates broken navigation path for fresh maintainer
- observation: Main README line 132 shows 'docs/ design notes' but docs/README.md was missing
- source: external-critique
- issue: #309
- addressed: 2026-06-08 via commit cf60f7a
- fix: Created comprehensive docs/README.md with overview of documentation structure, ADR guidance, engine integration guides, design and UX documentation sections, and navigation back to main README and plan/

## Previously addressed (completed)

### [x] [4.5] Package.json scripts lack development workflow guidance (external critique)
- category: external-critique
- impact: 5
- ease: 9
- base-score: 4.5
- ux-bias-multiplier: 1.0 (no direct UX impact)
- final-score: 4.5
- next: Add missing development workflow scripts to README.md Scripts table with clear descriptions
- evidence: External critique finding from pass 24: Commands like 'verify', 'deploy:preview', 'baseline:approve' exist with no explanation of when/how to use them in development workflow
- observation: README.md Scripts table incomplete - missing critical development workflow scripts that new maintainers need to understand
- source: external-critique
- addressed: 2026-06-08 via commit 6ad6e8b
- fix: Expanded README.md Scripts table with 7 additional development workflow scripts including verify (quality gate), verify:visual (visual smoke tests), baseline:approve (visual test maintenance), and deploy:* commands with clear descriptions

### [x] [4.5] Hardcoded hex colors in PixelEmblem bypass design system despite carve-out justification
- category: perf
- impact: 5
- ease: 9
- base-score: 4.5
- ux-bias-multiplier: 1.0 (no direct UX impact)
- final-score: 4.5
- next: Replace hardcoded hex colors '#7a0d1c' and '#fff5e0' in PixelEmblem.tsx with appropriate AXM design tokens while preserving pixel art aesthetic
- evidence: /home/runner/work/axiomancer-mobile/axiomancer-mobile/components/event/aftermath/PixelEmblem.tsx lines 70-71 use hardcoded colors '#7a0d1c' (shadow) and '#fff5e0' (highlight) instead of design system tokens
- observation: While pixel art has design carve-out justification, hardcoded colors still create maintenance burden and bypass centralized theming system
- source: audit
- addressed: 2026-06-08 via commit 8f72b6f
- fix: Added AXM.pixelShadow and AXM.pixelHighlight design tokens and replaced hardcoded hex colors in both PixelEmblem and PixelHeartEmblem components. Preserves exact pixel art aesthetic while centralizing color management for easier theme maintenance.

### [x] [5.4] Hardcoded gradient hex colors in ModalRivet component bypass design system
- category: perf
- impact: 6
- ease: 9
- base-score: 5.4
- ux-bias-multiplier: 1.0 (no direct UX impact)
- final-score: 5.4
- next: Replace hardcoded hex colors #6a625a and #2a2520 in ModalRivet.tsx with appropriate AXM design tokens
- evidence: /home/runner/work/axiomancer-mobile/axiomancer-mobile/components/event/ModalRivet.tsx lines 21-22 use hardcoded hex colors in SVG gradient stops instead of AXM design tokens
- observation: Modal rivet decorative elements use hardcoded gradients that bypass the centralized theming system and reduce design consistency
- source: audit
- issue: #308
- addressed: 2026-06-08 via commit c25a316
- fix: Replaced hardcoded hex colors #6a625a and #2a2520 in SVG gradient stops with AXM.bone and AXM.ash design tokens. Maintains metallic rivet gradient effect while using centralized design system tokens for consistency.

### [x] [5.4] Hardcoded #0a0a0a colors in levelup and modal components bypass design system
- category: perf
- impact: 6
- ease: 9
- base-score: 5.4
- ux-bias-multiplier: 1.0 (no direct UX impact)
- final-score: 5.4
- next: Replace hardcoded #0a0a0a values with AXM.bg design token in AscendStrip.tsx, LevelReadyStrip.tsx, and ModalRivet.tsx
- evidence: Found hardcoded #0a0a0a in /home/runner/work/axiomancer-mobile/axiomancer-mobile/components/levelup/AscendStrip.tsx lines 104,110,116,120; /home/runner/work/axiomancer-mobile/axiomancer-mobile/components/levelup/LevelReadyStrip.tsx lines 78,84,90; /home/runner/work/axiomancer-mobile/axiomancer-mobile/components/event/ModalRivet.tsx lines 22,25
- observation: Level-up UI components and modal rivets use hardcoded color values instead of centralized AXM.bg design token
- source: audit
- issue: #307
- addressed: 2026-06-08 via commit 14eb1da
- fix: Replaced hardcoded #0a0a0a hex literals with AXM.bg design token in AscendStrip.tsx, LevelReadyStrip.tsx, and ModalRivet.tsx. Added AXM import to ModalRivet component for design system consistency.

## Previously addressed (completed)

### [x] [5.6] RGBA hardcoded colors in multiple components bypass design system
- category: perf
- impact: 7
- ease: 8
- base-score: 5.6
- ux-bias-multiplier: 1.0 (no direct UX impact)
- final-score: 5.6
- next: Replace all hardcoded RGBA values with appropriate AXM design tokens
- evidence: Found hardcoded RGBA values in ErrorBoundary.tsx, MercyChoiceModal.tsx, LevelUpModal.tsx, StatBar.tsx, ErrorFallbackModal.tsx, ItemCard.tsx, DifficultyBadge.tsx, EncounterModalOverlay.tsx, and app screen components - these should use centralized AXM design tokens for consistency
- observation: RGBA hardcoded colors in multiple components bypass design system
- source: audit
- issue: #306
- addressed: 2026-06-08 via commit 58ec29c
- fix: Added comprehensive semantic AXM tokens for common opacity patterns (parchmentMed/Dim, sulfurSubtle/Med, bloodSubtle/Med/Strong, rustSubtle, shadow, nodeBg) and replaced all hardcoded RGBA values across 14 files. Maintains visual consistency while centralizing color management.

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

### [x] [6.3] Excessive use of 'as any' type casts undermines TypeScript safety
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
- issue: #305
- addressed: 2026-06-08 via commit 4156f2b
- fix: Replaced 9 instances of 'as any' with specific 'as unknown as Type' assertions in key test files (memoir, inventory, codex-unlock-consumer), improving type documentation while maintaining test functionality

### [x] [5.6] Performance anti-patterns in component rendering
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
- addressed: 2026-06-08 via commit f2f6d3e
- fix: Added React.memo to frequently-reused components (StatBar, StanceGlyph components GlyphHeart/GlyphBody/GlyphMind, SectionLabel, EffectChip) to prevent unnecessary re-renders for pure presentational components

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