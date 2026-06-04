# Site audit — 2026-06-04

> Bias: none
> Conducted by: /iterate autonomous audit

## Top 5 findings (scored)

### [4.8] Console statements in production builds expose debug info ✅ (already addressed)
- category: perf
- impact: 6
- ease: 8
- next: Wrap console.error in ErrorBoundary.tsx:73, console.warn in LevelUpModal.tsx:138, DebugFriendship.tsx:36,50, and DebugEffectApply.tsx:64 with `if (__DEV__)` guards to prevent debug output in production builds
- evidence: Found 6 console statements in production components that would execute in release builds
- observation: Console statements in ErrorBoundary.tsx, LevelUpModal.tsx, and debug components execute in production, potentially exposing debug information and cluttering production logs
- status: All console statements already properly wrapped with `if (__DEV__)` guards

### [3.6] Missing placeholder content in testing-guide.md 
- category: content-gaps
- impact: 4
- ease: 9
- next: Fill template placeholders like "[internal testing email]" with actual content or clarify purpose vs docs/testing.md
- evidence: File contains template placeholders that suggest incomplete documentation
- observation: docs/testing-guide.md contains unfilled template content that affects contributor onboarding

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

### [2.8] Heavy font loading blocks app startup
- category: perf
- impact: 7 
- ease: 4
- next: Implement progressive font loading with fallbacks to reduce initial bundle and startup time
- evidence: app/_layout.tsx loads 5 Google Fonts synchronously before app starts
- observation: All fonts loaded synchronously at startup creates delay in app initialization

### [2.4] Bundle size optimization opportunities
- category: perf
- impact: 3
- ease: 8  
- next: Audit and potentially reduce number of Google Fonts loaded, implement code splitting for less critical components
- evidence: Large font bundle and potential for lazy loading of debug components
- observation: App loads multiple font families and debug components that could be optimized for production builds

## Completed findings

*Previous audit findings will be listed here as they are addressed*