# Site audit — 2026-06-04

> Bias: UX gaps (set via oversight 2026-06-04)
> /iterate weights UX-gap findings 1.5×: stance buttons spacing, node label
> visibility, LEDGER encounter/node display, ITEM tooltip
> Conducted by: /iterate autonomous audit

### [needs-user-call] Engine sync — progression curve + upcoming engine work
- category: planning
- observation: User flagged that an engine check-in is needed before more mobile
  phases are queued. Specific concerns: (1) difficulty/progression-curve gap
  (CRITIQUE [MED] "difficulty too hard / enemies scale with player", tagged
  `[needs-engine-release]`), (2) any upcoming engine releases that would unblock
  mobile candidates or require catch-up phases similar to 0.14.0.
- next: User to sync with engine repo / T before /march queues new phases.
  Until sync happens, /iterate should drain CRITIQUE/AUDIT rows (UX-gap bias)
  rather than promoting new phase candidates. Clear this row once the engine
  check-in occurs.
- filed: oversight 2026-06-04

## Top 5 findings (scored)

### [4.2] Console statements in design files and combat engine expose debug info in production ✅
- category: perf
- impact: 6
- ease: 7
- next: Wrap console.error in design-canvas.jsx files and console.warn in combat.engine.ts:1034 with __DEV__ guards to prevent debug output in production builds
- evidence: Found console.error in 3 design-canvas.jsx files and console.warn in combat.engine.ts without __DEV__ protection
- observation: Design files in handoff directories and combat engine contain console statements that would execute in production builds, potentially exposing debug information
- issue: #257
- addressed: 2026-06-04 via commit 21038a2
- fix: Wrapped console.error in 3 design-canvas.jsx files and console.warn in combat.engine.ts with __DEV__ guards to prevent debug output in production builds

### [3.6] Component test coverage gap - at least one component lacks tests ✅
- category: tests
- impact: 4
- ease: 9
- next: Identify which component lacks test coverage and add corresponding test file
- evidence: Found 70 component files but only 69 test files in components directory
- observation: Test coverage appears incomplete with a mismatch between component count and test count
- issue: #258
- addressed: 2026-06-04 via commit c4a355f
- fix: Added comprehensive test coverage for ItemCard component with 25 test cases covering utility functions, glyph rendering for all categories, expanded/collapsed states, accessibility features, and user interactions. Reduces component-to-test gap.

### [2.8] Large images could be optimized for mobile performance  
- category: perf
- impact: 7
- ease: 4
- next: Optimize largest image assets (react-logo@3x.png at 21KB, icon assets > 10KB) for mobile delivery
- evidence: react-logo@3x.png is 21KB, several launcher icons > 8KB
- observation: Several image assets are relatively large for mobile apps and could benefit from optimization

## Completed findings

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