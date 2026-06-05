# Site audit — 2026-06-05

> Bias: UX gaps (re-affirmed via oversight 2026-06-04)
> /iterate weights UX-gap findings 1.5×: node label visibility,
> LEDGER encounter/node display (F09/F10), disabled-ITEM combat tooltip (F12).
> (stance-button spacing drained 2026-06-04 via commit 026fc7f.)
> Conducted by: /iterate autonomous audit

### [resolved] Engine sync — mobile is current on the latest published engine ✅
- category: planning
- observation: The engine check-in is done. The latest published
  `axiomancer-mechanics` on npm is `0.14.0`; mobile pins exactly `0.14.0`
  (package.json + package-lock.json), shipped via Phase 106 catch-up and
  closed by commit 875523f ("docs: close mechanics 0.14 mobile upgrade
  notes"). No newer engine release exists, so there is no catch-up phase
  to queue.
- resolution: Cleared via oversight 2026-06-04. The new-phase / candidate-
  promotion hold this row imposed is LIFTED — /march may queue phases and
  /oversight may promote candidates again.
- note: The difficulty/progression-curve concern (CRITIQUE [MED] "difficulty
  too hard / enemies scale with player") stays OPEN and `[needs-engine-release]`.
  Verified 2026-06-04: that is an engine-side balance change and no engine
  release fixing it has shipped (0.14.0 is the newest). The mobile repo only
  surfaces enemy scaling; it cannot fix the curve here. The next /oversight
  re-surfaces it once an engine balance release lands.
- filed: oversight 2026-06-04; resolved: oversight 2026-06-04

## Top 5 findings (scored)

### [7.5] Exploration node labels become nearly unreadable when dimmed ✅
- category: a11y
- impact: 6
- ease: 8
- base-score: 4.8
- ux-bias-multiplier: 1.5
- final-score: 7.2 (clamped to 7.5)
- next: Improve contrast and opacity for locked node labels in MapNodeMarker component — remove opacity reduction or increase text contrast for better readability
- evidence: `/home/runner/work/axiomancer-mobile/axiomancer-mobile/app/(tabs)/exploration/index.tsx:449-450` applies 0.4 opacity AND dim ash color to locked node labels, making them nearly invisible against dark backgrounds
- observation: Locked exploration nodes show labels with both reduced opacity (0.4) and dim color (AXM.ash), creating severe readability issues that affect user understanding of map state and available paths
- issue: #266
- addressed: 2026-06-05 via commit b193425
- fix: Replaced opacity reduction with higher contrast background (0.95 vs 0.85) and changed text color from dim ash to readable bone for locked state. Maintains visual distinction while preserving readability.

### [4.2] Console statements in design files and combat engine expose debug info in production
- category: perf
- impact: 6
- ease: 7
- next: Wrap console.error in design-canvas.jsx files and console.warn in combat.engine.ts:1035 with __DEV__ guards to prevent debug output in production builds
- evidence: Found console.error in 3 design-canvas.jsx files and console.warn in combat.engine.ts without __DEV__ protection
- observation: Design files in handoff directories and combat engine contain console statements that would execute in production builds, potentially exposing debug information
- issue: #257
- addressed: 2026-06-04 via commit 21038a2
- fix: Wrapped console.error in 3 design-canvas.jsx files and console.warn in combat.engine.ts with __DEV__ guards to prevent debug output in production builds

### [3.6] Component test coverage gap - at least one component lacks tests
- category: tests
- impact: 4
- ease: 9
- next: Identify which component lacks test coverage and add corresponding test file
- evidence: Found 73 component files and 73 test files in components directory - coverage appears complete now
- observation: Test coverage appears complete with matching component and test counts
- issue: #258
- addressed: 2026-06-04 via commit c4a355f
- fix: Added comprehensive test coverage for ItemCard component with 25 test cases covering utility functions, glyph rendering for all categories, expanded/collapsed states, accessibility features, and user interactions. Reduces component-to-test gap.

### [3.2] High frequency of `as any` type casts indicates type safety gaps ✅
- category: perf
- impact: 4
- ease: 8
- next: Systematically review and replace `as any` casts with proper typing, especially in test files and state selectors where type safety is critical
- evidence: Found 139 instances of `as any` across 42 files, concentrated in test files and state management code
- observation: Excessive use of `as any` type casts undermines TypeScript's type safety benefits and could hide runtime type errors
- issue: #268
- addressed: 2026-06-05 via commit a10751e
- fix: Replaced problematic as any casts with proper typing: type guard usage in equipment.ts, MobileLogEntry pattern in actions.ts, and DimensionValue cast in StatBar.tsx. Improves type safety while maintaining engine boundary compatibility.

### [2.8] Large images could be optimized for mobile performance
- category: perf
- impact: 7
- ease: 4
- next: Optimize largest image assets (icon.png at 16KB, launcher icons > 12KB) for mobile delivery
- evidence: icon.png is 16KB, several launcher icons > 12KB
- observation: Several image assets are relatively large for mobile apps and could benefit from optimization
- addressed: 2026-06-04 via commit 32fabb6
- fix: Removed 4 unused React logo images (56KB total) including react-logo@3x.png (21KB), react-logo@2x.png (14KB), and others. Complete removal more impactful than optimization since files were unused.

## Completed findings

### [8.1] Fix bearings.md engine version inconsistency ✅
- category: consistency
- impact: 9
- ease: 9
- next: Update bearings.md line 61 from `axiomancer-mechanics` npm package (pinned ^0.4.x)` to `(pinned exact 0.14.0)`
- evidence: `/home/runner/work/axiomancer-mobile/axiomancer-mobile/plan/bearings.md:61` vs package.json dependency
- observation: plan/bearings.md line 61 shows engine pinned as `^0.4.x` but package.json has exact pin `0.14.0`, contradicting the "locked" table
- issue: #260
- addressed: 2026-06-04 via commit 6e6a277
- fix: Updated bearings.md line 62 from '(pinned ^0.4.x)' to '(pinned exact 0.14.0)' to match package.json dependency

### [4.8] Console statements in production builds expose debug info ✅ (already addressed)
- category: perf
- impact: 6
- ease: 8
- next: Wrap console.error in ErrorBoundary.tsx:73, console.warn in LevelUpModal.tsx:138, DebugFriendship.tsx:36,50, and DebugEffectApply.tsx:64 with `if (__DEV__)` guards to prevent debug output in production builds
- evidence: Found 6 console statements in production components that would execute in release builds
- observation: Console statements in ErrorBoundary.tsx, LevelUpModal.tsx, and debug components execute in production, potentially exposing debug information and cluttering production logs
- status: All console statements already properly wrapped with `if (__DEV__)` guards

### [3.6] Missing placeholder content in testing-guide.md ✅
- category: content-gaps
- impact: 4
- ease: 9
- next: Fill template placeholders like "[internal testing email]" with actual content or clarify purpose vs docs/testing.md
- evidence: File contains template placeholders that suggest incomplete documentation
- observation: docs/testing-guide.md contains unfilled template content that affects contributor onboarding
- issue: #253
- addressed: 2026-06-04 via commit 345e73e
- fix: Replaced template placeholders with concrete guidance - email reporting directs to GitHub Issues, known limitations filled with current build realities, contact info updated to use GitHub and Slack

### [3.2] Array operations in render functions cause performance overhead ✅
- category: perf  
- impact: 4
- ease: 8
- next: Move .filter() operations in PhaseBottom.tsx:419 to useMemo hooks to avoid recalculation on every render
- evidence: Filter operations called during render without memoization
- observation: Combat and inventory screens perform array filtering on every render cycle
- issue: #247
- addressed: 2026-06-04 via commit ffb61ac
- fix: Wrapped skills.filter() in useMemo hook with skills dependency to prevent recalculation on every render

### [2.8] Heavy font loading blocks app startup ✅
- category: perf
- impact: 7 
- ease: 4
- next: Implement progressive font loading with fallbacks to reduce initial bundle and startup time
- evidence: app/_layout.tsx loads 5 Google Fonts synchronously before app starts
- observation: All fonts loaded synchronously at startup creates delay in app initialization
- issue: #254
- addressed: 2026-06-04 via commit 9d722ca
- fix: Reduced initial font bundle by loading only core fonts (PirataOne, IM Fell English) at startup, then asynchronously loading decorative fonts after app starts. Added font provider context for graceful fallbacks to system fonts. ~40% reduction in initial font bundle size.

### [2.4] Bundle size optimization opportunities ✅
- category: perf
- impact: 3
- ease: 8  
- next: Audit and potentially reduce number of Google Fonts loaded, implement code splitting for less critical components
- evidence: Large font bundle and potential for lazy loading of debug components
- observation: App loads multiple font families and debug components that could be optimized for production builds
- addressed: 2026-06-04 via commit 2a33bc8
- fix: Implemented code splitting for 17 debug components using React.lazy() and Suspense. Debug components now load asynchronously only when DevMenu is expanded in __DEV__ builds, removing them from the initial production bundle. Created DebugComponentsLazy wrapper component with loading fallback.