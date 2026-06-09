# Site audit — 2026-06-09

> Bias: UX gaps (re-affirmed via oversight 2026-06-04)
> /iterate weights UX-gap findings 1.5×: node label visibility,
> LEDGER encounter/node display (F09/F10), disabled-ITEM combat tooltip (F12).
> Conducted by: /iterate autonomous audit

> **Fresh comprehensive audit (2026-06-09).** Examined external critique pending items, content/data gaps, SEO/discoverability, link integrity, accessibility, test coverage, and performance across entire codebase following skills/iterate.md methodology.

## Top 5 findings (scored)

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

### [ ] [6.8] Node.js bundle size at 507MB suggests potential dependency bloat
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

### [ ] [6.0] Missing accessibility focus management for keyboard navigation
- category: a11y
- impact: 4
- ease: 10
- base-score: 4.0
- ux-bias-multiplier: 1.5 (accessibility is UX-related)
- final-score: 6.0
- next: Implement focus management patterns with onFocus/onBlur handlers for interactive components, especially in modal dialogs and combat sequences
- evidence: Grep search shows only 3 design files contain focus-related patterns, no production components implement keyboard focus management
- observation: Interactive components lack keyboard navigation support, making the app inaccessible for users who rely on keyboard navigation or assistive technologies
- source: audit

## Previously completed findings (prior audit 2026-06-08)

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

### [x] [7.2] README.md architecture documentation references outdated presenter file locations
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
- issue: #311

### [x] [6.3] Multiple hardcoded color literals in EncounterPreludeContent bypass design system
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

### [x] [5.4] Missing test coverage for critical event illustration accessibility patterns  
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
- issue: #313

### [x] [4.5] Stale TODO comments in mercy action test files reference outdated Phase 108 context
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
- issue: #314
- addressed: 2026-06-08 via commit 97a9834
- fix: Removed outdated Phase 108 references in mercy action test file header and test description. Updated file documentation to reflect current engine-integrated implementation state rather than historical development phase context.

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